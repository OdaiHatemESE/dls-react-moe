// lib/roster-repo.ts
import { orFetch } from "@/lib/oneroster";
import type { Person, StudentBasic, SchoolEnrollment, Org } from "@/types";
import { get } from "http";

/**
 * Escape a literal value used within OneRoster filter single quotes.
 * e.g., identifier='O''Connor' (single quote is doubled inside quotes)
 */
function escapeFilterLiteral(value: string): string {
  return String(value).replace(/'/g, "''");
}

// Note: If batching is needed in future, reintroduce a chunk helper.

// -------- Type guards for tolerant vendor responses ---------
function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function isPerson(x: unknown): x is Person {
  return isRecord(x) && typeof x.sourcedId === "string";
}

// Note: StudentBasic guard unused currently; add back if needed for stricter parsing.

function isPersonsEnvelope(x: unknown): x is { persons: Person[] } {
  return (
    isRecord(x) &&
    Array.isArray((x as { persons?: unknown }).persons) &&
    (x as { persons: unknown[] }).persons.every(isPerson)
  );
}

 
function getProp(
  obj: Record<string, unknown> | undefined,
  key: string
): unknown {
  if (!obj) return undefined;
  return (obj as Record<string, unknown>)[key];
}

/**
 * 1) Get a person by EID.
 * Your vendor expects: /persons?filter=identifier='<eid>'
 */
export async function getPersonByEid(eid: string): Promise<Person | null> {
  const filter = `identifier='${escapeFilterLiteral(eid)}'`;
  const data = await orFetch<unknown>(
    `/v1p1/persons?filter=${encodeURIComponent(filter)}`,
    "read"
  );
  if (isPersonsEnvelope(data)) {
    return data.persons[0] ?? null;
  }
  if (Array.isArray(data) && data.every(isPerson)) {
    return (data as Person[])[0] ?? null;
  }
  return null;
}

/**
 * 2) From person.sourcedId, get linked students
 */
export async function getStudentIdsForPerson(
  personSourceId: string
): Promise<string[]> {
  // Endpoint returns an ARRAY, each item like:
  // { parent: {...}, student: { sourcedId: "..." }, ... }
  const filter = `parent='${personSourceId}'`;
  const data = await orFetch<unknown>(
    `/v1p1/studentlinks?filter=${encodeURIComponent(filter)}`,
    "read"
  );

  if (!Array.isArray(data)) return [];

  return data
    .map((item: unknown) => {
      if (!isRecord(item)) return undefined;
      const student = getProp(item, "student");
      if (!isRecord(student)) return undefined;
      const sid = getProp(student, "sourcedId");
      return typeof sid === "string" && sid.length > 0 ? sid : undefined;
    })
    .filter(
      (id: unknown): id is string => typeof id === "string" && id.length > 0
    );
}

// Get FULL vendor payload for each student via /persons/{id}
// Returns an array where each entry is exactly what the API returned for that id
export async function getStudentsFull(ids: string[]): Promise<Person[]> {
  if (!ids.length) return [];

  const all: Person[] = [];

  for (const id of ids) {
    console.debug("Fetching full student data for", id);
    try {
      const filter = `sourcedId='${escapeFilterLiteral(id)}'`;
      const data = await orFetch<unknown>(
        `/v1p1/persons?filter=${encodeURIComponent(filter)}`,
        "read"
      );
      // Some vendors return a single object; yours returns an ARRAY like [{ persons: {...} }]
      if (Array.isArray(data)) {
        all.push(...data);
      } else if (isPerson(data)) {
        all.push(data);
      }
    } catch (err) {
      console.error("Failed fetching FULL student object for", id, err);
    }
  }

  return all;
}

/**
 * Get school enrollments by student ID and optional school year
 */
export async function getSchoolEnrollmentsByStudent(
  studentId: string,
  schoolYear?: string
): Promise<SchoolEnrollment[]> {
  let filter = `student='${escapeFilterLiteral(studentId)}'`;

  if (schoolYear) {
    filter += ` AND schoolYear='${escapeFilterLiteral(schoolYear)}'`;
  }
 
  try {
    
    const data  = await orFetch<SchoolEnrollment[]>(
      `/v1p1/schoolenrollments?filter=${encodeURIComponent(filter)}&fields=sourcedId,school,streamGrade`,
      "read"
    );

    console.debug(data.length, "enrollments fetched for student", studentId);
    if (!Array.isArray(data)) {
      // Handle case where vendor returns a single object or envelope
      return data;    }

    return data
  } catch (err) {
    console.error(
      "Failed fetching school enrollments for student",
      studentId,
      err
    );
    return [];
  }
}
 
/**
 * Fetch an Org by sourcedId using /v1p1/orgs/{id}.
 * Handles vendor variations where the response may be the org object itself
 * or wrapped in an envelope like { Org: {...} } or { org: {...} }.
 */
export async function getOrgBySourcedId(id: string): Promise<Org | null> {
  try {
    const data:Org = await orFetch<Org>(`/v1p1/orgs/${encodeURIComponent(id)}?fields=sourcedId,name,metadata.shortName,metadata.englishName,metadata.addresses`, "read");
    console.debug("Fetched org data for", id, typeof(data));
    return data as Org;
  } catch (err) {
    console.error("Failed fetching org by id", id, err);
    return null;
  }
}
