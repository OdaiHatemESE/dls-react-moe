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
  return isRecord(x) && Array.isArray((x as { persons?: unknown }).persons) &&
    ((x as { persons: unknown[] }).persons).every(isPerson);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isStudentsEnvelope(_x: unknown): _x is { students: StudentBasic[] } {
  // No current usage; keep as placeholder for vendor variations
  return false;
}

function getProp(obj: Record<string, unknown> | undefined, key: string): unknown {
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
 export async function getStudentIdsForPerson(personSourceId: string): Promise<string[]> {
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
  const filter = `identifier='${escapeFilterLiteral(id)}'`;
  const data = await orFetch<unknown>(`/v1p1/persons?filter=${encodeURIComponent(filter)}`, "read");
      if (!data) continue;

      

      // Normalize to an array of records
      const arr = Array.isArray(data) ? data : [data];

      for (const item of arr) {
        // Prefer nested "persons" shape, else item itself
        let p: Record<string, unknown> | undefined;
        if (isRecord(item)) {
          const persons = getProp(item, "persons");
          if (Array.isArray(persons)) {
            p = isRecord(persons[0]) ? (persons[0] as Record<string, unknown>) : undefined;
          } else if (isRecord(persons)) {
            p = persons as Record<string, unknown>;
          } else {
            p = item as Record<string, unknown>;
          }
        }
        if (!p) continue;

        // Try to pick a primary email if top-level email is missing
        let email: string | undefined = typeof getProp(p, "email") === "string" ? (getProp(p, "email") as string) : undefined;
        if (!email) {
          const metadata = getProp(p, "metadata");
          if (isRecord(metadata)) {
            const contacts = getProp(metadata, "contacts");
            if (Array.isArray(contacts)) {
              const emails = contacts
                .map((c: unknown) => {
                  if (!isRecord(c)) return undefined;
                  const type = getProp(c, "contactType");
                  const val = getProp(c, "value");
                  if (typeof type === "string" && type.toLowerCase().includes("email") && typeof val === "string") {
                    return val;
                  }
                  return undefined;
                })
                .filter((v: unknown): v is string => typeof v === "string" && v.includes("@"));
              email = emails[0];
            }
          }
        }

        const sourcedId = getProp(p, "sourcedId");
        const givenName = (getProp(p, "givenName") ?? getProp(p, "englishFirstName") ?? getProp(p, "firstName"));
        const familyName = (getProp(p, "familyName") ?? getProp(p, "englishFamilyName") ?? getProp(p, "lastName"));
        const grade = (getProp(p, "grades") ?? getProp(p, "grade"));
        const username = (getProp(p, "username") ?? getProp(p, "userName") ?? getProp(p, "loginId"));

        all.push({
          sourcedId: typeof sourcedId === "string" ? sourcedId : id,
          givenName: typeof givenName === "string" ? givenName : undefined,
          familyName: typeof familyName === "string" ? familyName : undefined,
          grade: typeof grade === "string" ? grade : undefined,
          username: typeof username === "string" ? username : undefined,
          // If you also want to include email in StudentBasic, add it to the type
          // and surface it in your API response:
          // email,
        } satisfies StudentBasic);
      }
    } catch (err) {
      console.error("Failed fetching student info for", id, err);
    }
  }

  return all;
}


// Get FULL vendor payload for each student via /persons/{id}
// Returns an array where each entry is exactly what the API returned for that id
export async function getStudentsFull(ids: string[]): Promise<unknown[]> {
  if (!ids.length) return [];

  const all: unknown[] = [];

  for (const id of ids) {
    console.debug("Fetching full student data for", id);
    try {
      const filter = `sourcedId='${escapeFilterLiteral(id)}'`;
      const data = await orFetch<unknown>(`/v1p1/persons?filter=${encodeURIComponent(filter)}`, "read");
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
