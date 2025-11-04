import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getChildActionsSummary } from "@/lib/child-actions";
import { getActiveAcademicYearValue } from "@/lib/admin-config";
import type { StudentProfileV1 } from "@/app/types/studentprofile";
import type {
  ChildActionIdhDebug,
  ChildActionIdhDebugShape,
  ChildActionIdhDebugSource,
  ChildActionResponse,
} from "@/types/child-actions";

export const dynamic = "force-dynamic";

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
console.debug("child-actions route loaded");
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const { searchParams } = url;
    const studentPersonId = searchParams.get("studentPersonId")?.trim();
    const parentPersonId = searchParams.get("parentPersonId")?.trim() || null;
    const studentEmirateId = searchParams.get("studentEmirateId")?.trim() || null;
    const includeIdhDebug = TRUE_VALUES.has((searchParams.get("idhDebug") ?? "").toLowerCase());

    if (!studentPersonId) {
      return NextResponse.json({ ok: false, error: "studentPersonId is required" }, { status: 400 });
    }

    // Fetch student enrollment data from PP API
    const origin = url.origin;

    const activeAcademicYearPromise = getActiveAcademicYearValue();
    const studentProfilePromise = (async (): Promise<StudentProfileV1 | null> => {
      try {
        const studentRes = await fetch(`${origin}/api/PP/student/${encodeURIComponent(studentPersonId)}`, {
          headers: { cookie: req.headers.get("cookie") ?? "" },
          cache: "no-store",
        });

        if (studentRes.ok) {
          return (await studentRes.json()) as StudentProfileV1;
        }
      } catch (error) {
        console.warn("Failed to fetch student enrollment data from PP API:", error);
      }

      return null;
    })();

    const idhPromise = fetchIdhStatus(studentPersonId, req, { debug: includeIdhDebug });

    const [activeAcademicYear, studentData, idh] = await Promise.all([
      activeAcademicYearPromise,
      studentProfilePromise,
      idhPromise,
    ]);

    let educationType: string | null = null;
    let schoolYear: string | null = null;

    if (studentData) {
      const activeYearStr = activeAcademicYear ? String(activeAcademicYear) : null;
      const matchingEnrollment = studentData.enrollment?.find((enr) => enr.schoolYear === activeYearStr);

      if (matchingEnrollment) {
        educationType = matchingEnrollment.educationType;
        schoolYear = matchingEnrollment.schoolYear;
      } else if (studentData.enrollment?.length) {
        const sorted = [...studentData.enrollment].sort((a, b) => {
          const aYear = a.schoolYear ? parseInt(a.schoolYear, 10) : 0;
          const bYear = b.schoolYear ? parseInt(b.schoolYear, 10) : 0;
          return bYear - aYear;
        });
        educationType = sorted[0].educationType;
        schoolYear = sorted[0].schoolYear;
      }
    }

    // Always fetch IDH data
    const idhStatusId = idh.statusId;
    const idhFetchedAt = idh.fetchedAt;
    const idhTrace = idh.trace;

    const payload = await getChildActionsSummary({
      studentPersonId,
      parentPersonId,
      studentEmirateId,
      educationTypeHint: educationType,
      schoolYearHint: schoolYear,
      idhStatusId,
      idhFetchedAt,
      activeAcademicYear,
    });

    if (includeIdhDebug && idhTrace) {
      payload.idhDebug = idhTrace;
    }

    return NextResponse.json(payload as ChildActionResponse);
  } catch (error) {
    console.error("child-actions GET failed", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

type FetchIdhStatusOptions = {
  debug?: boolean;
};

type FetchIdhStatusResult = {
  statusId: number | null;
  fetchedAt: string | null;
  trace?: ChildActionIdhDebug;
};

async function fetchIdhStatus(studentPersonId: string, req: Request, options?: FetchIdhStatusOptions): Promise<FetchIdhStatusResult> {
  const debug = options?.debug ?? false;
  const trace: ChildActionIdhDebug | null = debug
    ? {
        statusId: null,
        fetchedAt: null,
        upstreamStatus: 0,
        parsedShape: "unknown",
        extractedFrom: "none",
      }
    : null;

  try {
    const baseUrl = process.env.PP_BASE_URL;
    if (!baseUrl) {
      console.warn("PP_BASE_URL missing; skipping IDH fetch");
      if (trace) {
        trace.warning = "PP_BASE_URL missing";
      }
      return { statusId: null, fetchedAt: null, trace: trace ?? undefined };
    }

    const origin = new URL(req.url).origin;
    const tokenRes = await fetch(`${origin}/api/PP/auth/token`, { cache: "no-store" });
    const tokenJson = (await tokenRes.json().catch(() => null)) as { accessToken?: string } | null;

    if (!tokenRes.ok || !tokenJson?.accessToken) {
      console.warn("Failed to retrieve PP token", tokenJson);
      if (trace) {
        trace.warning = `Failed to retrieve PP token (${tokenRes.status})`;
        trace.parsedShape = "empty";
      }
      return { statusId: null, fetchedAt: null, trace: trace ?? undefined };
    }

    const accessToken = tokenJson.accessToken;
    const upstreamUrl = `${baseUrl.replace(/\/$/, "")}/idh?sourceId=${encodeURIComponent(studentPersonId)}`;
    const idhRes = await fetch(upstreamUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (trace) {
      trace.upstreamStatus = idhRes.status;
    }

    if (idhRes.status === 404) {
      if (trace) {
        trace.parsedShape = "empty";
        trace.warning = "IDH record not found (404)";
      }
      return { statusId: null, fetchedAt: new Date().toISOString(), trace: trace ?? undefined };
    }

    const rawBody = await idhRes.text();
    const trimmedBody = rawBody.trim();
    const hasBody = trimmedBody.length > 0;

    if (!idhRes.ok) {
      console.warn("IDH fetch failed", idhRes.status, hasBody ? trimmedBody : "");
      if (trace) {
        trace.parsedShape = hasBody ? "string" : "empty";
        trace.warning = `Upstream returned ${idhRes.status}`;
        trace.bodyPreview = debug && hasBody ? truncateForDebug(trimmedBody) : undefined;
      }
      return { statusId: null, fetchedAt: null, trace: trace ?? undefined };
    }

    if (!hasBody) {
      console.warn("IDH fetch returned empty body", upstreamUrl);
      if (trace) {
        trace.parsedShape = "empty";
        trace.warning = "Empty body from upstream";
      }
      return { statusId: null, fetchedAt: null, trace: trace ?? undefined };
    }

    let parsed: unknown = null;
    try {
      parsed = JSON.parse(trimmedBody);
    } catch (error) {
      console.warn("Failed to parse IDH response JSON", error);
      if (trace) {
        trace.parsedShape = "string";
        trace.warning = "Failed to parse JSON body";
        trace.bodyPreview = debug ? truncateForDebug(trimmedBody) : undefined;
      }
      return { statusId: null, fetchedAt: null, trace: trace ?? undefined };
    }

    const extraction = extractIdhStatusPayload(parsed);

    if (trace) {
      trace.statusId = extraction.statusId;
      trace.fetchedAt = extraction.fetchedAt;
      trace.parsedShape = extraction.parsedShape;
      trace.extractedFrom = extraction.extractedFrom;
      trace.statusKey = extraction.statusKey ?? undefined;
      trace.keys = extraction.keys?.slice(0, 8);
      trace.arrayLength = typeof extraction.arrayLength === "number" ? extraction.arrayLength : undefined;
      trace.warning = extraction.warning;
      trace.bodyPreview = debug ? truncateForDebug(trimmedBody) : undefined;
    }

    const statusId = extraction.statusId;
    let fetchedAt = extraction.fetchedAt;
    if (!fetchedAt && statusId !== null) {
      fetchedAt = new Date().toISOString();
    }

    return {
      statusId,
      fetchedAt,
      trace: trace ?? undefined,
    };
  } catch (error) {
    console.warn("Error while fetching IDH status", error);
    if (trace) {
      trace.warning = error instanceof Error ? error.message : String(error);
    }
    return { statusId: null, fetchedAt: null, trace: trace ?? undefined };
  }
}

type ExtractedIdhStatus = {
  statusId: number | null;
  fetchedAt: string | null;
  parsedShape: ChildActionIdhDebugShape;
  extractedFrom: ChildActionIdhDebugSource;
  statusKey?: string | null;
  keys?: string[];
  arrayLength?: number;
  warning?: string;
};

const NESTED_IDH_KEYS = ["data", "Data", "result", "Result", "payload", "Payload", "records", "Records", "items", "Items", "student", "Student"];

function extractIdhStatusPayload(payload: unknown): ExtractedIdhStatus {
  if (payload === null || payload === undefined) {
    return { statusId: null, fetchedAt: null, parsedShape: "empty", extractedFrom: "none", warning: "Empty response" };
  }

  if (Array.isArray(payload)) {
    const arrayLength = payload.length;
    for (const entry of payload) {
      const nested = extractIdhStatusPayload(entry);
      if (nested.statusId !== null) {
        return {
          ...nested,
          parsedShape: "array",
          extractedFrom: nested.extractedFrom === "none" ? "array" : nested.extractedFrom,
          arrayLength,
        };
      }
    }
    return {
      statusId: null,
      fetchedAt: null,
      parsedShape: "array",
      extractedFrom: "array",
      arrayLength,
      warning: arrayLength ? "statusId missing in array entries" : "Empty array response",
    };
  }

  if (typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    const keys = Object.keys(obj);

    const statusLookup = resolveStatusFromObject(obj);
    const directStatus = coerceNumber(statusLookup?.value);

    if (directStatus !== null) {
      const fetchedAt =
        coerceDatetime(
          obj.datetime ??
            obj.datetimeAt ??
            obj.fetchedAt ??
            obj.fetched_at ??
            obj.updatedAt ??
            obj.updated_at ??
            obj.lastUpdated ??
            obj.last_updated ??
            obj.insertedAt ??
            obj.inserted_at ??
            obj.Datetime ??
            obj.datetimeUTC ??
            obj.DateTime ??
            obj.dateTime
        ) ?? null;

      return {
        statusId: directStatus,
        fetchedAt,
        parsedShape: "object",
        extractedFrom: "root",
        statusKey: statusLookup?.key ?? null,
        keys,
      };
    }

    for (const key of NESTED_IDH_KEYS) {
      if (key in obj) {
        const nested = extractIdhStatusPayload(obj[key]);
        if (nested.statusId !== null) {
          const extractedFrom = key === "data" || key === "Data"
            ? "data"
            : nested.extractedFrom === "none"
              ? "data"
              : nested.extractedFrom;

          return {
            ...nested,
            parsedShape: "object",
            extractedFrom,
            statusKey: nested.statusKey ?? statusLookup?.key ?? key,
            keys,
          };
        }
      }
    }

    return {
      statusId: null,
      fetchedAt: null,
      parsedShape: "object",
      extractedFrom: "none",
      statusKey: statusLookup?.key ?? null,
      keys,
      warning: keys.length ? "statusId not found in object" : "Empty object response",
    };
  }

  if (typeof payload === "string") {
    const status = coerceNumber(payload);
    if (status !== null) {
      return {
        statusId: status,
        fetchedAt: null,
        parsedShape: "string",
        extractedFrom: "root",
      };
    }
    return { statusId: null, fetchedAt: null, parsedShape: "string", extractedFrom: "none", warning: "String payload without statusId" };
  }

  if (typeof payload === "number") {
    if (Number.isFinite(payload)) {
      return { statusId: payload, fetchedAt: null, parsedShape: "number", extractedFrom: "root" };
    }
    return { statusId: null, fetchedAt: null, parsedShape: "number", extractedFrom: "none", warning: "Non-finite numeric payload" };
  }

  if (typeof payload === "boolean") {
    return { statusId: null, fetchedAt: null, parsedShape: "boolean", extractedFrom: "none", warning: "Boolean payload" };
  }

  return { statusId: null, fetchedAt: null, parsedShape: "unknown", extractedFrom: "none", warning: "Unrecognized payload shape" };
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

function coerceDatetime(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const timestamp = Date.parse(trimmed);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return new Date(timestamp).toISOString();
}

type ResolvedStatus = { key: string; value: unknown } | null;

const STATUS_KEY_CANDIDATES = [
  "statusId",
  "status_id",
  "StatusId",
  "StatusID",
  "Status_Id",
  "Status_ID",
  "status_Id",
  "status_ID",
  "Status",
  "status",
];

function resolveStatusFromObject(obj: Record<string, unknown>): ResolvedStatus {
  for (const key of STATUS_KEY_CANDIDATES) {
    if (key in obj) {
      return { key, value: obj[key] };
    }
  }

  for (const [key, value] of Object.entries(obj)) {
    const normalized = normalizeKeyName(key);
    if (normalized === "statusid" || normalized === "status") {
      return { key, value };
    }
  }

  return null;
}

function normalizeKeyName(key: string): string {
  return key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

function truncateForDebug(body: string, limit = 400): string {
  if (body.length <= limit) {
    return body;
  }

  return `${body.slice(0, limit)}...`;
}
