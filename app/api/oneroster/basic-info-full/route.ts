import { NextResponse } from "next/server";
import { getPersonByEid, getStudentIdsForPerson, getStudentsFull } from "@/lib/roster-repo";
import { orFetch } from "@/lib/oneroster";
import { Person } from "@/types";

/**
 * OneRoster Basic Info (Full) API
 * --------------------------------
 * Given an external identifier (eid), this endpoint returns the full vendor-native
 * person record and, if the person is a parent/guardian, the full records of their
 * linked students. If the person is a student, children will be an empty array.
 *
 * Notes
 * - The vendor payload shape is preserved (no normalization beyond role detection).
 * - Role detection is resilient to different vendor shapes and fields.
 */

// Ensure this API route is always dynamic (no ISR caching)
export const dynamic = "force-dynamic";

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a full OneRoster person payload by external identifier.
 * Always returns an array to simplify downstream handling regardless of vendor shape.
 */
async function getFullPersonById(id: string): Promise<unknown[]> {
  const data = await orFetch<Person>(`/v1p1/persons?filter=identifier='${id}'`, "read");
  return Array.isArray(data) ? data : [data];
}

/** Narrowing helper to check plain object records. */
function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

/** Safe property getter that tolerates unknown vendor shapes. */
function getProp(obj: Record<string, unknown> | undefined, key: string): unknown {
  if (!obj) return undefined;
  return (obj as Record<string, unknown>)[key];
}

/**
 * Attempt to extract the role from a variety of vendor payload shapes.
 * Supported patterns include:
 * - [ { persons: { ... } } ]
 * - [ { persons: [ { ... } ] } ]
 * - [ { ...person } ]
 *
 * Role may be provided as:
 * - role
 * - metadata.role
 * - roleList (string[] or { role: string }[])
 */
function pickRole(fullPersonArr: unknown[]): string | undefined {
  // Locate the primary person node
  const node = isRecord(fullPersonArr?.[0]) ? (fullPersonArr[0] as Record<string, unknown>) : undefined;
  let p: Record<string, unknown> | undefined;
  const persons = getProp(node, "persons");
  if (Array.isArray(persons)) {
    p = isRecord(persons[0]) ? (persons[0] as Record<string, unknown>) : undefined;
  } else if (isRecord(persons)) {
    p = persons as Record<string, unknown>;
  } else {
    p = node;
  }

  // Resolve role from multiple possible fields
  const meta = getProp(p, "metadata");
  const roleCandidate =
    getProp(p, "role") ?? (isRecord(meta) ? getProp(meta, "role") : undefined) ?? getProp(p, "roleList");
  if (!roleCandidate) return undefined;

  // roleList could be ["student"] or [{ role: "student" }]
  if (Array.isArray(roleCandidate)) {
    const asStrings = roleCandidate
      .map((r: unknown) => {
        if (typeof r === "string") return r;
        if (isRecord(r)) {
          const rv = getProp(r, "role");
          return typeof rv === "string" ? rv : "";
        }
        return "";
      })
      .filter((s): s is string => typeof s === "string" && s.length > 0);
    return asStrings.join(",");
  }

  return typeof roleCandidate === "string"
    ? roleCandidate
    : isRecord(roleCandidate) && typeof getProp(roleCandidate, "role") === "string"
      ? (getProp(roleCandidate, "role") as string)
      : String(roleCandidate);
}

// ──────────────────────────────────────────────────────────────────────────────
// Route handler
// ──────────────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eid = searchParams.get("eid");
  if (!eid) return NextResponse.json({ error: "Missing ?eid" }, { status: 400 });

  try {
    // 1) Find the person by EID (light lookup to get sourcedId)
    const person = await getPersonByEid(eid);
    if (!person?.sourcedId) {
      return NextResponse.json({ error: `No person found for EID ${eid}` }, { status: 404 });
    }

    // 2) Fetch FULL record to determine role (preserve vendor-native shape)
    const parentOrStudentFull = await getFullPersonById(eid);
    const role = pickRole(parentOrStudentFull)?.toString().toLowerCase() || "";

    // 3) If the EID is a student → no children, return student payload in `parent`
    if (role.includes("student")) {
      return NextResponse.json({
        meta: {
          eid,
          personSourcedId: person.sourcedId,
          role: "student",
          studentCount: 0,
        },
        // This is actually the student's full record; kept in `parent` for response consistency
        parent: parentOrStudentFull,
        children: [],
      });
    }

    // 4) Otherwise assume parent/guardian → collect linked students (tolerate vendors without links)
    let studentIds: string[] = [];
    try {
      studentIds = await getStudentIdsForPerson(person.sourcedId);
    } catch {
      // Some vendors may return 404 if there are no relationships; treat as empty
      studentIds = [];
    }

    // Fetch full student records (vendor-native shapes)
    const childrenFull = await getStudentsFull(studentIds);

    // 5) Return parent plus children payloads
    return NextResponse.json({
      meta: {
        eid,
        parentSourcedId: person.sourcedId,
        // Non-breaking alias for consistency with the student path
        personSourcedId: person.sourcedId,
        role: role || "parent",
        studentCount: studentIds.length,
      },
      parent: parentOrStudentFull, // full vendor shape
      children: childrenFull, // full vendor shape
    });
  } catch (err: unknown) {
    // Fallback error response with safe message extraction
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
