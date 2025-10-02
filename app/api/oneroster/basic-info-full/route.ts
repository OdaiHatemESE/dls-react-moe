import { NextResponse } from "next/server";
import { getPersonByEid, getStudentIdsForPerson, getStudentsFull } from "@/lib/roster-repo";
import { orFetch } from "@/lib/oneroster";
import { Person } from "@/types";

// Ensure this API route is always dynamic (no ISR caching)
export const dynamic = "force-dynamic";

async function getFullPersonById(id: string) {
  const data = await orFetch<Person>(`/v1p1/persons?filter=identifier='${id}'`, "read");
  return Array.isArray(data) ? data : [data];
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function getProp(obj: Record<string, unknown> | undefined, key: string): unknown {
  if (!obj) return undefined;
  return (obj as Record<string, unknown>)[key];
}

function pickRole(fullPersonArr: unknown[]): string | undefined {
  // Common vendor shapes:
  // - [{ persons: {...} }]
  // - [{ persons: [{...}] }]
  // - [{ ...person }]
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

  const meta = getProp(p, "metadata");
  const roleCandidate = getProp(p, "role") ?? (isRecord(meta) ? getProp(meta, "role") : undefined) ?? getProp(p, "roleList");
  if (!roleCandidate) return undefined;

  if (Array.isArray(roleCandidate)) {
    // roleList could be ["student"] or [{ role: "student" }]
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
    : (isRecord(roleCandidate) && typeof getProp(roleCandidate, "role") === "string")
      ? (getProp(roleCandidate, "role") as string)
      : String(roleCandidate);
}

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

    // 2) Fetch FULL record to determine role
  const parentOrStudentFull = await getFullPersonById(eid);
    const role = pickRole(parentOrStudentFull)?.toString().toLowerCase() || "";

    if (role.includes("student")) {
      // The EID belongs to a STUDENT — no children to list.
      // Return the student as `parent` for consistency and empty `children`.
      return NextResponse.json({
        meta: {
          eid,
          personSourcedId: person.sourcedId,
          role: "student",
          studentCount: 0,
        },
        parent: parentOrStudentFull, // this is actually the student’s full record
        children: [],
      });
    }

    // Otherwise assume parent/guardian → get linked students
    let studentIds: string[] = [];
    try {
      studentIds = await getStudentIdsForPerson(person.sourcedId);
    } catch {
      // If the vendor returns 404 for parent without links, fall back to none
      studentIds = [];
    }

    const childrenFull = await getStudentsFull(studentIds);

    return NextResponse.json({
      meta: {
        eid,
        parentSourcedId: person.sourcedId,
        // Non-breaking alias for consistency with student path
        personSourcedId: person.sourcedId,
        role: role || "parent",
        studentCount: studentIds.length,
      },
      parent: parentOrStudentFull, // full vendor shape
      children: childrenFull,      // full vendor shape
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
