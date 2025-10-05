import { NextResponse } from "next/server"; 
import { getPersonByEid, getStudentIdsForPerson, getStudentsFull } from "@/lib/roster-repo"; 
import { orFetch } from "@/lib/oneroster"; 
import { Person } from "@/types"; 
import { getSessionEid } from "./session"; 

// [NEW-Cache] import cache helpers for Redis-based caching
import { cacheGetJSON, cacheSetJSON, makeKey } from "@/lib/cache"; // [NEW-Cache]

// [NEW-Cache] make sure route remains dynamic (not ISR)
export const dynamic = "force-dynamic"; 

// [NEW-Cache] define TTLs for each data type
const TTL = {                                             // [NEW-Cache]
  PERSON: 60 * 60,       // 1 hour for person records     // [NEW-Cache]
  LINKS: 15 * 60,        // 15 min for parent→student links // [NEW-Cache]
  CHILDREN: 10 * 60,     // 10 min for children payloads  // [NEW-Cache]
} as const;                                                // [NEW-Cache]

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

// [NEW-Cache] modified to include Redis read-through caching
async function getFullPersonById(value: string, isStudent: boolean): Promise<unknown[]> { 
  const filterField = isStudent ? "sourcedId" : "identifier"; 
  const key = makeKey(["or", "person", filterField, value]);           // [NEW-Cache]
  const cached = await cacheGetJSON<unknown[]>(key);                 // [NEW-Cache]
  if (cached) return cached;                                         // [NEW-Cache]

  const data = await orFetch<Person>(`/v1p1/persons?filter=${filterField}='${value}'`, "read"); 
  const arr = Array.isArray(data) ? data : [data]; 

  await cacheSetJSON(key, arr, { ttlSeconds: TTL.PERSON });          // [NEW-Cache]
  return arr; 
} 

function isRecord(x: unknown): x is Record<string, unknown> { 
  return typeof x === "object" && x !== null; 
} 

function getProp(obj: Record<string, unknown> | undefined, key: string): unknown { 
  if (!obj) return undefined; 
  return (obj as Record<string, unknown>)[key]; 
} 

function pickRole(fullPersonArr: unknown[]): string | undefined { 
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
  const roleCandidate = 
    getProp(p, "role") ?? (isRecord(meta) ? getProp(meta, "role") : undefined) ?? getProp(p, "roleList"); 
  if (!roleCandidate) return undefined; 

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
  const eid = await getSessionEid(); 
  if (!eid && !sourcedId) { 
    return NextResponse.json({ error: "Missing ?sourcedId or not authenticated" }, { status: 400 }); 
  } 

  try { 
    let person: { sourcedId: string }; 
    let personIdentifier: string; 
    let identifierType: string; 

    if (typeof sourcedId === "string" && sourcedId) { 
      if (!eid) { 
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 }); 
      } 
      const foundParent = await getPersonByEid(eid); 
      if (!foundParent || !foundParent.sourcedId) { 
        return NextResponse.json({ error: `No parent found for EID ${eid}` }, { status: 404 }); 
      } 

      // [NEW-Cache] cache parent→student links
  const linksKey = makeKey(["or", "links", "parent", foundParent.sourcedId]);           // [NEW-Cache]
      let linkedStudentIds =                                                               // [NEW-Cache]
        (await cacheGetJSON<string[]>(linksKey)) ??                                        // [NEW-Cache]
        (await (async () => {                                                              // [NEW-Cache]
          try { 
            const ids = await getStudentIdsForPerson(foundParent.sourcedId); 
            await cacheSetJSON(linksKey, ids, { ttlSeconds: TTL.LINKS });                  // [NEW-Cache]
            return ids; 
          } catch { 
            return [] as string[]; 
          } 
        })());                                                                             // [NEW-Cache]

      if (!linkedStudentIds.includes(sourcedId)) { 
        return NextResponse.json({  
          error: "Student not linked to this parent",  
          forbidden: true,  
          warning: "You do not have access to this student's information."  
        }, { status: 403 }); 
      } 

      person = { sourcedId }; 
      personIdentifier = sourcedId; 
      identifierType = "sourcedId"; 

      // [NEW-Cache] call cached person fetch
      const parentOrStudentFull = await getFullPersonById(personIdentifier, true);         // [NEW-Cache]
      const role = pickRole(parentOrStudentFull)?.toString().toLowerCase() || ""; 

      if (!role.includes("student")) { 
        return NextResponse.json({ error: "Not a student record" }, { status: 400 }); 
      } 

      return NextResponse.json({ 
        meta: { 
          sourcedId: person.sourcedId, 
          parentEid: eid, 
          role: "student", 
          studentCount: 0, 
        }, 
        parent: parentOrStudentFull, 
        children: [], 
      }); 
    } else if (eid) { 
      const foundPerson = await getPersonByEid(eid); 
      if (!foundPerson || !foundPerson.sourcedId) { 
        return NextResponse.json({ error: `No person found for EID ${eid}` }, { status: 404 }); 
      } 
      person = { sourcedId: foundPerson.sourcedId }; 
      personIdentifier = eid; 
      identifierType = "eid"; 

      // [NEW-Cache] cached parent record
      const parentOrStudentFull = await getFullPersonById(personIdentifier, false);        // [NEW-Cache]
      const role = pickRole(parentOrStudentFull)?.toString().toLowerCase() || ""; 

      if (role.includes("student")) { 
        return NextResponse.json({ 
          meta: { 
            eid: personIdentifier, 
            personSourcedId: person.sourcedId, 
            role: "student", 
            studentCount: 0, 
          }, 
          parent: parentOrStudentFull, 
          children: [], 
        }); 
      } 

      // [NEW-Cache] cache links for parent→students
  const linksKey = makeKey(["or", "links", "parent", person.sourcedId]);                 // [NEW-Cache]
      const studentIds =                                                                   // [NEW-Cache]
        (await cacheGetJSON<string[]>(linksKey)) ??                                        // [NEW-Cache]
        (await (async () => {                                                              // [NEW-Cache]
          try { 
            const ids = await getStudentIdsForPerson(person.sourcedId); 
            await cacheSetJSON(linksKey, ids, { ttlSeconds: TTL.LINKS });                  // [NEW-Cache]
            return ids; 
          } catch { 
            return [] as string[]; 
          } 
        })());                                                                             // [NEW-Cache]

      // [NEW-Cache] cache full children payload batch
  const childrenKey = makeKey(["or", "children", person.sourcedId, `n=${studentIds.length}`]); // [NEW-Cache]
      const childrenFull =                                                                 // [NEW-Cache]
        (await cacheGetJSON<unknown[]>(childrenKey)) ??                                    // [NEW-Cache]
        (await (async () => {                                                              // [NEW-Cache]
          const full = await getStudentsFull(studentIds); 
          await cacheSetJSON(childrenKey, full, { ttlSeconds: TTL.CHILDREN });             // [NEW-Cache]
          return full; 
        })());                                                                             // [NEW-Cache]

      return NextResponse.json({ 
        meta: { 
          eid: personIdentifier, 
          parentSourcedId: person.sourcedId, 
          personSourcedId: person.sourcedId, 
          role: role || "parent", 
          studentCount: studentIds.length, 
        }, 
        parent: parentOrStudentFull, 
        children: childrenFull, 
      }); 
    } else { 
      return NextResponse.json({ error: "Missing ?sourcedId or not authenticated" }, { status: 400 }); 
    } 
  } catch (err: unknown) { 
    const message = err instanceof Error ? err.message : "Server error"; 
    return NextResponse.json({ error: message }, { status: 500 }); 
  } 
} 
