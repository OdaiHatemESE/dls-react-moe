import { NextResponse } from "next/server";
import { orFetch } from "@/lib/oneroster";
import type { SchoolEnrollment } from "@/types";

// Always dynamic (no ISR)
export const dynamic = "force-dynamic";

// Helper to escape single quotes in OneRoster filter literals
function escapeFilterLiteral(value: string): string {
  return String(value).replace(/'/g, "''");
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function pick<T = unknown>(obj: unknown, path: string): T | undefined {
  if (!isRecord(obj)) return undefined;
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (!isRecord(cur)) return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur as T | undefined;
}

function parseDateSafe(val: unknown): number {
  if (typeof val === "string" && val.trim()) {
    const ts = Date.parse(val);
    if (!Number.isNaN(ts)) return ts;
  }
  return 0;
}

// Extract educationType from a variety of vendor response shapes
function extractEducationType(src: unknown, depth = 0): string | null {
  if (depth > 6) return null;
  if (typeof src === "string" && src.trim().length > 0) return src;
  if (Array.isArray(src)) {
    for (const item of src) {
      const found = extractEducationType(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (isRecord(src)) {
    // Direct field
    for (const k of ["educationType", "EducationType"]) {
      const v = src[k];
      if (typeof v === "string" && v.trim().length > 0) return v;
    }
    // Common envelopes
    for (const k of ["school", "School"]) {
      const v = src[k];
      const found = extractEducationType(v, depth + 1);
      if (found) return found;
    }
    // Fallback: search all nested values
    for (const v of Object.values(src)) {
      const found = extractEducationType(v, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sourcedId = searchParams.get("sourcedId") || searchParams.get("sourceId");
  // Default to 2022 per request; allow override via ?schoolYear=
  const schoolYear = searchParams.get("schoolYear") || "2022";

  if (!sourcedId) {
    return NextResponse.json({ error: "Missing required parameter: sourcedId" }, { status: 400 });
  }

  try {
    // Build filter exactly as requested (exitDate is a single space)
    const filter = [
      `student='${escapeFilterLiteral(sourcedId)}'`,
      `schoolYear='${escapeFilterLiteral(schoolYear)}'`,
      `exitDate=' '`,
      `enrollmentType='Enrollment'`,
      `status='active'`,
    ].join(" AND ");

    // Request relevant fields to minimize payload size; include dates for sorting
    const path = `/v1p1/schoolenrollments?filter=${encodeURIComponent(filter)}&fields=sourcedId,school,streamGrade,schoolYear,entryDate,enrollmentType,status,exitDate,dateLastModified,createDate`;
    const data = await orFetch<unknown>(path, "read");

    // Normalize to array of enrollments
    const enrollments: SchoolEnrollment[] = Array.isArray(data)
      ? (data as SchoolEnrollment[])
      : (data ? [data as SchoolEnrollment] : []);

    if (!enrollments.length) {
      return NextResponse.json({
        sourcedId,
        schoolYear,
        enrollment: null,
        schoolID: null,
        educationType: null,
        count: 0,
        meta: { note: "No active enrollment found for given constraints" },
      });
    }

    // Pick the latest by entryDate, then dateLastModified, then createDate
    const latest = enrollments
      .slice()
      .sort((a, b) => {
        const aEntry = parseDateSafe(a?.entryDate);
        const bEntry = parseDateSafe(b?.entryDate);
        if (bEntry !== aEntry) return bEntry - aEntry;
        const aMod = parseDateSafe(a?.dateLastModified);
        const bMod = parseDateSafe(b?.dateLastModified);
        if (bMod !== aMod) return bMod - aMod;
        const aCr = parseDateSafe(a?.createDate);
        const bCr = parseDateSafe(b?.createDate);
        return bCr - aCr;
      })[0]!;

    const schoolID: string | null = latest?.school?.sourcedId || null;

    // Fetch educationType from /schools/{id}?fields=educationType
    let educationType: string | null = null;
    if (schoolID) {
      try {
        const schoolPath = `/v1p1/schools/${encodeURIComponent(schoolID)}?fields=educationType`;
        const schoolResp = await orFetch<unknown>(schoolPath, "read");

        // Tolerant extraction across various vendor envelopes and arrays
        educationType =
          extractEducationType(schoolResp) ??
          pick<string>(schoolResp, "educationType") ??
          pick<string>(schoolResp, "school.educationType") ??
          pick<string>(schoolResp, "School.educationType") ??
          null;
      } catch {
        educationType = null;
      }
    }

    return NextResponse.json({
      sourcedId,
      schoolYear,
      enrollment: latest,
      schoolID,
      educationType,
      count: enrollments.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
