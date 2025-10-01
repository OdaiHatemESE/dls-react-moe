// lib/roster-repo.ts
import { orFetch } from "@/lib/oneroster";

export type Person = {
  sourcedId: string;
  givenName?: string;
  familyName?: string;
  email?: string;
};

export type StudentBasic = {
  sourcedId: string;
  givenName?: string;
  familyName?: string;
  grade?: string;
  username?: string;
};

/**
 * Escape a literal value used within OneRoster filter single quotes.
 * e.g., identifier='O''Connor' (single quote is doubled inside quotes)
 */
function escapeFilterLiteral(value: string): string {
  return String(value).replace(/'/g, "''");
}

function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return [arr];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// -------- Type guards for tolerant vendor responses ---------
function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function isPerson(x: unknown): x is Person {
  return isRecord(x) && typeof x.sourcedId === "string";
}

function isStudentBasic(x: unknown): x is StudentBasic {
  return isRecord(x) && typeof x.sourcedId === "string";
}

function isPersonsEnvelope(x: unknown): x is { persons: Person[] } {
  return isRecord(x) && Array.isArray((x as { persons?: unknown }).persons) &&
    ((x as { persons: unknown[] }).persons).every(isPerson);
}

function isStudentsEnvelope(x: unknown): x is { students: StudentBasic[] } {
  return isRecord(x) && Array.isArray((x as { students?: unknown }).students) &&
    ((x as { students: unknown[] }).students).every(isStudentBasic);
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
 export async function getStudentIdsForPerson(personSourceId: string): Promise<string[]> {
  // Endpoint returns an ARRAY, each item like:
  // { parent: {...}, student: { sourcedId: "..." }, ... }
  const filter = `parent='${personSourceId}'`;
  const data = await orFetch<any[]>(
    `/v1p1/studentlinks?filter=${encodeURIComponent(filter)}`,
    "read"
  );

  if (!Array.isArray(data)) return [];

  return data
    .map((item: any) => item?.student?.sourcedId)
    .filter((id: unknown): id is string => typeof id === "string" && id.length > 0);
}



/**
 * 3) Get basic info for student IDs
 */
 // 3) Given a list of student sourcedIds, fetch their basic info (one-by-one)
 // 3) Given a list of student link IDs, fetch student basic info via /students?filter=student='<id>'
// 3) Given a list of student sourcedIds, fetch their info via /persons/{id}
 // 3) Given a list of student sourcedIds, fetch their info via /persons/{id}
// Vendor returns an ARRAY, each item like: [{ persons: { ...fields... } }]
export async function getStudentsBasic(ids: string[]): Promise<StudentBasic[]> {
  if (!ids.length) return [];

  const all: StudentBasic[] = [];

  for (const id of ids) {
    try {
      
      const data = await orFetch<any>(`/v1p1/persons?filter=person=${encodeURIComponent(id)}`, "read");
      if (!data) continue;

      

      // Normalize to an array of records
      const arr = Array.isArray(data) ? data : [data];

      for (const item of arr) {
        const p = (item?.persons ?? item) as any; // prefer nested "persons", else the item itself
        if (!p) continue;

        // Try to pick a primary email if top-level email is missing
        let email: string | undefined = p.email;
        if (!email && Array.isArray(p.metadata?.contacts)) {
          const emails = p.metadata.contacts
            .filter((c: any) => String(c?.contactType).toLowerCase().includes("email"))
            .map((c: any) => c?.value)
            .filter((v: any) => typeof v === "string" && v.includes("@"));
          email = emails[0];
        }

        all.push({
          sourcedId: p.sourcedId ?? id,
          // Vendor may localize name fields. Keep both fallbacks:
          givenName: p.givenName ?? p.englishFirstName ?? p.firstName,
          familyName: p.familyName ?? p.englishFamilyName ?? p.lastName,
          // grades is a simple string here (e.g., "G4")
          grade: p.grades ?? p.grade,
          username: p.username ?? p.userName ?? p.loginId,
          // If you also want to include email in StudentBasic, add it to the type
          // and surface it in your API response:
          // email,
        } as StudentBasic);
      }
    } catch (err) {
      console.error("Failed fetching student info for", id, err);
    }
  }

  return all;
}


// Get FULL vendor payload for each student via /persons/{id}
// Returns an array where each entry is exactly what the API returned for that id
export async function getStudentsFull(ids: string[]): Promise<any[]> {
  if (!ids.length) return [];

  const all: any[] = [];

  for (const id of ids) {
    try {
      const data = await orFetch<any>(`/v1p1/persons?filter=person=${encodeURIComponent(id)}`, "read");
      // Some vendors return a single object; yours returns an ARRAY like [{ persons: {...} }]
      if (Array.isArray(data)) {
        all.push(...data);
      } else {
        all.push(data);
      }
    } catch (err) {
      console.error("Failed fetching FULL student object for", id, err);
    }
  }

  return all;
}
