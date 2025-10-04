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
 * Fetch a full OneRoster person payload by identifier or sourcedId.
 * If isStudent is true, use sourcedId; otherwise, use identifier (EID).
 * Always returns an array to simplify downstream handling regardless of vendor shape.
 */
async function getFullPersonById(value: string, isStudent: boolean): Promise<unknown[]> {
  const filterField = isStudent ? "sourcedId" : "identifier";
  const data = await orFetch<Person>(`/v1p1/persons?filter=${filterField}='${value}'`, "read");
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
  const sourcedId = searchParams.get("sourcedId");
  const eid = searchParams.get("eid");
  if (!eid && !sourcedId) {
    return NextResponse.json({ error: "Missing ?eid or ?sourcedId" }, { status: 400 });
  }

  try {
    let person: { sourcedId: string };
    let personIdentifier: string;
    let identifierType: string;

    if (typeof sourcedId === "string" && sourcedId) {
      // If sourcedId is provided, use it directly (assume student, but check role after fetch)
      person = { sourcedId };
      personIdentifier = sourcedId;
      identifierType = "sourcedId";
    } else if (typeof eid === "string" && eid) {
      // Otherwise, look up by eid (assume parent, but check role after fetch)
      const foundPerson = await getPersonByEid(eid);
      if (!foundPerson || !foundPerson.sourcedId) {
        return NextResponse.json({ error: `No person found for EID ${eid}` }, { status: 404 });
      }
      person = { sourcedId: foundPerson.sourcedId };
      personIdentifier = eid;
      identifierType = "eid";
    } else {
      // Should not reach here due to earlier check, but just in case
      return NextResponse.json({ error: "Missing ?eid or ?sourcedId" }, { status: 400 });
    }

    // Fetch FULL record to determine role (preserve vendor-native shape)
    // If using sourcedId, likely student; if using eid, likely parent
    // But always check role after fetch
    let parentOrStudentFull: unknown[];
    let role: string;
    if (identifierType === "sourcedId") {
      parentOrStudentFull = await getFullPersonById(personIdentifier, true);
      role = pickRole(parentOrStudentFull)?.toString().toLowerCase() || "";
    } else {
      parentOrStudentFull = await getFullPersonById(personIdentifier, false);
      role = pickRole(parentOrStudentFull)?.toString().toLowerCase() || "";
    }

    // If the identifier is a student → no children, return student payload in `parent`
    if (role.includes("student")) {
      return NextResponse.json({
        meta: {
          sourcedId: person.sourcedId,
          role: "student",
          studentCount: 0,
        },
        parent: parentOrStudentFull,
        children: [],
      });
    }

    // Otherwise assume parent/guardian → collect linked students
    let studentIds: string[] = [];
    try {
      studentIds = await getStudentIdsForPerson(person.sourcedId);
    } catch {
      studentIds = [];
    }

    const childrenFull = await getStudentsFull(studentIds);

    return NextResponse.json({
      meta: {
        eid: identifierType === "eid" ? personIdentifier : undefined,
        sourcedId: person.sourcedId,
        parentSourcedId: person.sourcedId,
        personSourcedId: person.sourcedId,
        role: role || "parent",
        studentCount: studentIds.length,
      },
      parent: parentOrStudentFull,
      children: childrenFull,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
