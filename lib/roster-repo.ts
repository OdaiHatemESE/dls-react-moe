// lib/roster-repo.ts
import { orFetch } from "@/lib/oneroster";
import type { Person, StudentBasic, SchoolEnrollment } from "@/types";

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isStudentsEnvelope(_x: unknown): _x is { students: StudentBasic[] } {
  // No current usage; keep as placeholder for vendor variations
  return false;
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
    const data = await orFetch<unknown>(
      `/v1p1/schoolenrollments?filter=${encodeURIComponent(filter)}`,
      "read"
    );

    if (!Array.isArray(data)) {
      // Handle case where vendor returns a single object or envelope
      if (isRecord(data)) {
        const enrollments = getProp(data, "enrollments");
        if (Array.isArray(enrollments)) {
          return parseEnrollments(enrollments);
        }
        // If it's a single enrollment object
        return parseEnrollments([data]);
      }
      return [];
    }

    return parseEnrollments(data);
  } catch (err) {
    console.error(
      "Failed fetching school enrollments for student",
      studentId,
      err
    );
    return [];
  }
}

function parseEnrollments(data: unknown[]): SchoolEnrollment[] {
  const results: SchoolEnrollment[] = [];

  for (const item of data) {
    if (!isRecord(item)) continue;

    // Extract all required fields
    const sourcedId = getProp(item, "sourcedId");
    const entryType = getProp(item, "entryType");
    const exitType = getProp(item, "exitType");
    const note = getProp(item, "note");
    const exitReason = getProp(item, "exitReason");
    const entryDate = getProp(item, "entryDate");
    const student = getProp(item, "student");
    const session = getProp(item, "session");
    const community = getProp(item, "community");
    const dateLastModified = getProp(item, "dateLastModified");
    const isSpecialNeed = getProp(item, "isSpecialNeed");
    const school = getProp(item, "school");
    const schoolYear = getProp(item, "schoolYear");
    const streamGrade = getProp(item, "streamGrade");
    const enrollmentType = getProp(item, "enrollmentType");
    const exitDate = getProp(item, "exitDate");
    const status = getProp(item, "status");
    const isMandatoryEducation = getProp(item, "isMandatoryEducation");
    const createDate = getProp(item, "createDate");

    // Validate required string fields
    if (
      typeof sourcedId !== "string" ||
      typeof entryType !== "string" ||
      typeof exitType !== "string" ||
      typeof note !== "string" ||
      typeof exitReason !== "string" ||
      typeof entryDate !== "string" ||
      typeof dateLastModified !== "string" ||
      typeof enrollmentType !== "string" ||
      typeof exitDate !== "string" ||
      typeof status !== "string" ||
      typeof isMandatoryEducation !== "string" ||
      typeof createDate !== "string"
    ) {
      continue;
    }

    // Validate schoolYear as number
    if (typeof schoolYear !== "number") {
      continue;
    }

    // Validate isSpecialNeed as boolean
    if (typeof isSpecialNeed !== "boolean") {
      continue;
    }

    // Validate and extract student object
    if (!isRecord(student)) continue;
    const studentHref = getProp(student, "href");
    const studentSourcedId = getProp(student, "sourcedId");
    const studentType = getProp(student, "type");

    if (
      typeof studentHref !== "string" ||
      typeof studentSourcedId !== "string" ||
      typeof studentType !== "string"
    ) {
      continue;
    }

    // Validate and extract session object
    if (!isRecord(session)) continue;
    const sessionHref = getProp(session, "href");
    const sessionSourcedId = getProp(session, "sourcedId");
    const sessionType = getProp(session, "type");

    if (
      typeof sessionHref !== "string" ||
      typeof sessionSourcedId !== "string" ||
      typeof sessionType !== "string"
    ) {
      continue;
    }

    // Validate and extract community object
    if (!isRecord(community)) continue;
    const communityHref = getProp(community, "href");
    const communitySourcedId = getProp(community, "sourcedId");
    const communityType = getProp(community, "type");

    if (
      typeof communityHref !== "string" ||
      typeof communitySourcedId !== "string" ||
      typeof communityType !== "string"
    ) {
      continue;
    }

    // Validate and extract school object
    if (!isRecord(school)) continue;
    const schoolHref = getProp(school, "href");
    const schoolSourcedId = getProp(school, "sourcedId");
    const schoolType = getProp(school, "type");

    if (
      typeof schoolHref !== "string" ||
      typeof schoolSourcedId !== "string" ||
      typeof schoolType !== "string"
    ) {
      continue;
    }

    // Validate and extract streamGrade object
    if (!isRecord(streamGrade)) continue;
    const streamGradeHref = getProp(streamGrade, "href");
    const streamGradeSourcedId = getProp(streamGrade, "sourcedId");
    const streamGradeType = getProp(streamGrade, "type");

    if (
      typeof streamGradeHref !== "string" ||
      typeof streamGradeSourcedId !== "string" ||
      typeof streamGradeType !== "string"
    ) {
      continue;
    }

    // All validations passed, create the enrollment object
    results.push({
      sourcedId,
      entryType,
      exitType,
      note,
      exitReason,
      entryDate,
      student: {
        href: studentHref,
        sourcedId: studentSourcedId,
        type: studentType,
      },
      session: {
        href: sessionHref,
        sourcedId: sessionSourcedId,
        type: sessionType,
      },
      community: {
        href: communityHref,
        sourcedId: communitySourcedId,
        type: communityType,
      },
      dateLastModified,
      isSpecialNeed,
      school: {
        href: schoolHref,
        sourcedId: schoolSourcedId,
        type: schoolType,
      },
      schoolYear,
      streamGrade: {
        href: streamGradeHref,
        sourcedId: streamGradeSourcedId,
        type: streamGradeType,
      },
      enrollmentType,
      exitDate,
      status,
      isMandatoryEducation,
      createDate,
    });
  }

  return results;
}
