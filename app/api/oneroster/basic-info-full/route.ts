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

type Wrapped<T> = { data: T; fetchedAt: string };

// [NEW-Cache] modified to include Redis read-through caching with optional bypass and fetchedAt
async function getFullPersonById(
  value: string,
  isStudent: boolean,
  noCache: boolean
): Promise<{ data: unknown[]; fetchedAt: string | null; source: "cache" | "upstream" }> {
  const filterField = isStudent ? "sourcedId" : "identifier"; 
  const key = makeKey(["or", "person", filterField, value]);           // [NEW-Cache]

  if (!noCache) {
    const cachedAny = await cacheGetJSON<unknown>(key);                 // [NEW-Cache]
    if (cachedAny) {
      if (Array.isArray(cachedAny)) {
        return { data: cachedAny as unknown[], fetchedAt: null, source: "cache" };
      }
      if (typeof cachedAny === "object" && cachedAny !== null && Array.isArray((cachedAny as Wrapped<unknown[]>).data)) {
        const w = cachedAny as Wrapped<unknown[]>;
        return { data: w.data, fetchedAt: w.fetchedAt ?? null, source: "cache" };
      }
    }
  }

  const literal = String(value).replace(/'/g, "''");
  const filter = `${filterField}='${literal}'`;
  const data = await orFetch<Person>(`/v1p1/persons?filter=${encodeURIComponent(filter)}` , "read"); 
  const arr = Array.isArray(data) ? data : [data]; 
  const fetchedAt = new Date().toISOString();
  await cacheSetJSON<Wrapped<unknown[]>>(key, { data: arr as unknown[], fetchedAt }, { ttlSeconds: TTL.PERSON });          // [NEW-Cache]
  return { data: arr as unknown[], fetchedAt, source: "upstream" };
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

// Try to locate a person's national identifier (EID) from a tolerant vendor payload
function pickIdentifier(fullPersonArr: unknown[]): string | undefined {
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

  const direct = getProp(p, "identifier");
  if (typeof direct === "string" && direct.trim().length > 0) return direct.trim();

  const meta = isRecord(p) ? (getProp(p, "metadata") as Record<string, unknown> | undefined) : undefined;
  const metaId = isRecord(meta) ? getProp(meta, "identifier") : undefined;
  if (typeof metaId === "string" && metaId.trim().length > 0) return metaId.trim();

  return undefined;
}

// Try to locate a student's sourcedId from a tolerant vendor payload
function pickSourcedId(fullPersonArr: unknown[]): string | undefined {
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

  const sid = getProp(p, "sourcedId");
  return typeof sid === "string" && sid.trim().length > 0 ? sid.trim() : undefined;
}

// ──────────────────────────────────────────────────────────────────────────────
// Route handler
// ──────────────────────────────────────────────────────────────────────────────

export async function GET(req: Request) { 
  const { searchParams } = new URL(req.url); 
  const sourcedId = searchParams.get("sourcedId"); 
  const noCache = ["1", "true", "yes"].includes((searchParams.get("nocache") || "").toLowerCase());
  const eid = await getSessionEid(); 
  if (!eid && !sourcedId) { 
    return NextResponse.json({ error: "Missing ?sourcedId or not authenticated" }, { status: 400 }); 
  } 

  try { 
    let person: { sourcedId: string }; 
    let personIdentifier: string; 

    if (typeof sourcedId === "string" && sourcedId) { 
      if (!eid) { 
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 }); 
      } 
      const foundParent = await getPersonByEid(eid); 
      if (!foundParent || !foundParent.sourcedId) { 
        return NextResponse.json({ error: `No parent found for EID ${eid}` }, { status: 404 }); 
      } 

      // [NEW-Cache] cache parent→student links (with nocache and wrapper)
      const linksKey = makeKey(["or", "links", "parent", foundParent.sourcedId]);
      let linksFetchedAt: string | null = null;
      let linksSource: "cache" | "upstream" = "cache";
      let linkedStudentIds: string[] = [];
      if (!noCache) {
        const cachedAny = await cacheGetJSON<unknown>(linksKey);
        if (cachedAny) {
          if (Array.isArray(cachedAny)) {
            linkedStudentIds = cachedAny as string[];
            linksSource = "cache";
          } else if (typeof cachedAny === "object" && cachedAny !== null && Array.isArray((cachedAny as Wrapped<string[]>).data)) {
            const w = cachedAny as Wrapped<string[]>;
            linkedStudentIds = w.data;
            linksFetchedAt = w.fetchedAt ?? null;
            linksSource = "cache";
          }
        }
      }
      if (!linkedStudentIds.length) {
        try {
          linkedStudentIds = await getStudentIdsForPerson(foundParent.sourcedId);
          linksFetchedAt = new Date().toISOString();
          linksSource = "upstream";
          await cacheSetJSON<Wrapped<string[]>>(linksKey, { data: linkedStudentIds, fetchedAt: linksFetchedAt }, { ttlSeconds: TTL.LINKS });
        } catch {
          linkedStudentIds = [];
        }
      }

      if (!linkedStudentIds.includes(sourcedId)) { 
        return NextResponse.json({  
          error: "Student not linked to this parent",  
          forbidden: true,  
          warning: "You do not have access to this student's information."  
        }, { status: 403 }); 
      } 

      person = { sourcedId }; 
      personIdentifier = sourcedId; 
      

  // [NEW-Cache] call cached person fetch with nocache
  const parentOrStudentFullWrap = await getFullPersonById(personIdentifier, true, noCache);         // [NEW-Cache]
  const parentOrStudentFull = parentOrStudentFullWrap.data;
      const role = pickRole(parentOrStudentFull)?.toString().toLowerCase() || ""; 

      if (!role.includes("student")) { 
        return NextResponse.json({ error: "Not a student record" }, { status: 400 }); 
      } 
 
      // Create/update a parent-driven "update information" request for this student
      let updateReqMeta: unknown = null;
      try {
        const origin = new URL(req.url).origin;
        const studentEmirateId = pickIdentifier(parentOrStudentFull) || null;
        const resp = await fetch(`${origin}/api/parent/update-information-requests`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            studentPersonId: person.sourcedId,
            parentPersonId: foundParent.sourcedId,
            studentEmirateId,
          }),
        });
        updateReqMeta = await resp.json().catch(() => ({ ok: false, error: "Invalid JSON from update-information-requests" }));
        console.log("Update information request response:", updateReqMeta);
      } catch (e) {
        updateReqMeta = { ok: false, error: e instanceof Error ? e.message : String(e) };
         console.log("Update information request response:", updateReqMeta);
      }

      return NextResponse.json({ 
        meta: { 
          sourcedId: person.sourcedId, 
          parentEid: eid, 
          role: "student", 
          studentCount: 0, 
          cache: {
            source: [parentOrStudentFullWrap.source, linksSource].includes("upstream") ? "upstream" : "cache",
            lastUpdated: [parentOrStudentFullWrap.fetchedAt, linksFetchedAt]
              .filter((x): x is string => typeof x === "string")
              .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null,
          },
          updateInformationRequest: updateReqMeta,
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
      

  // [NEW-Cache] cached parent record (with nocache)
  const parentOrStudentFullWrap = await getFullPersonById(personIdentifier, false, noCache);
  console.log(parentOrStudentFullWrap.data);       // [NEW-Cache]
  const parentOrStudentFull = parentOrStudentFullWrap.data;
      const role = pickRole(parentOrStudentFull)?.toString().toLowerCase() || ""; 

      if (role.includes("student")) { 
        // If the logged-in identity itself is a student, optionally create/update a self-driven request
        let updateReqMeta: unknown = null;
        try {
          const origin = new URL(req.url).origin;
          const studentEmirateId = pickIdentifier(parentOrStudentFull) || null;
          const resp = await fetch(`${origin}/api/parent/update-information-requests`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({
              studentPersonId: person.sourcedId,
              parentPersonId: null,
              studentEmirateId,
            }),
          });
          updateReqMeta = await resp.json().catch(() => ({ ok: false, error: "Invalid JSON from update-information-requests" }));
          console.debug(updateReqMeta)
        } catch (e) {
          updateReqMeta = { ok: false, error: e instanceof Error ? e.message : String(e) };
            console.debug(updateReqMeta)
        }

        return NextResponse.json({ 
          meta: { 
            eid: personIdentifier, 
            personSourcedId: person.sourcedId, 
            role: "student", 
            studentCount: 0, 
            cache: {
              source: parentOrStudentFullWrap.source,
              lastUpdated: parentOrStudentFullWrap.fetchedAt,
            },
            updateInformationRequest: updateReqMeta,
          }, 
          parent: parentOrStudentFull, 
          children: [], 
        }); 
      } 

      // [NEW-Cache] cache links for parent→students (with nocache + wrapper)
      const linksKey = makeKey(["or", "links", "parent", person.sourcedId]);                 // [NEW-Cache]
      let linksFetchedAt2: string | null = null;
      let linksSource2: "cache" | "upstream" = "cache";
      let studentIds: string[] = [];
      if (!noCache) {
        const cachedAny = await cacheGetJSON<unknown>(linksKey);
        if (cachedAny) {
          if (Array.isArray(cachedAny)) {
            studentIds = cachedAny as string[];
          } else if (typeof cachedAny === "object" && cachedAny !== null && Array.isArray((cachedAny as Wrapped<string[]>).data)) {
            const w = cachedAny as Wrapped<string[]>;
            studentIds = w.data;
            linksFetchedAt2 = w.fetchedAt ?? null;
          }
        }
      }
      if (!studentIds.length) {
        try {
          studentIds = await getStudentIdsForPerson(person.sourcedId);
          linksFetchedAt2 = new Date().toISOString();
          linksSource2 = "upstream";
          await cacheSetJSON<Wrapped<string[]>>(linksKey, { data: studentIds, fetchedAt: linksFetchedAt2 }, { ttlSeconds: TTL.LINKS });
        } catch {
          studentIds = [] as string[];
        }
      }

      // [NEW-Cache] cache full children payload batch (with nocache + wrapper)
  // Include sorted studentIds to avoid collisions between same-length sets
  const childrenKey = makeKey(["or", "children", person.sourcedId, "ids", studentIds.slice().sort().join(",")]); // [NEW-Cache]
      let childrenFetchedAt: string | null = null;
      let childrenSource: "cache" | "upstream" = "cache";
      let childrenFull: unknown[] = [];
      if (!noCache) {
        const cachedAny = await cacheGetJSON<unknown>(childrenKey);
        if (cachedAny) {
          if (Array.isArray(cachedAny)) {
            childrenFull = cachedAny as unknown[];
          } else if (typeof cachedAny === "object" && cachedAny !== null && Array.isArray((cachedAny as Wrapped<unknown[]>).data)) {
            const w = cachedAny as Wrapped<unknown[]>;
            childrenFull = w.data;
            childrenFetchedAt = w.fetchedAt ?? null;
          }
        }
      }
      if (!childrenFull.length) {
        try {
          const full = await getStudentsFull(studentIds);
          childrenFull = full as unknown[];
          childrenFetchedAt = new Date().toISOString();
          childrenSource = "upstream";
          await cacheSetJSON<Wrapped<unknown[]>>(childrenKey, { data: childrenFull, fetchedAt: childrenFetchedAt }, { ttlSeconds: TTL.CHILDREN });
        } catch {
          // On failure, do not hard-fail the entire endpoint. Return empty children with a cache hint.
          childrenFull = [];
          childrenFetchedAt = null;
          childrenSource = "upstream";
        }
      }

      // After we have the student IDs (and optionally their full payloads), create/update update-information-requests rows
      try {
        const origin = new URL(req.url).origin;
        // Build a lookup from sourcedId -> emiratesId if available from childrenFull
        const idToEid: Record<string, string | null> = {};
        for (const entry of childrenFull) {
          try {
            const sid = pickSourcedId([entry]);
            if (!sid) continue;
            const eid = pickIdentifier([entry]) || null;
            idToEid[sid] = eid;
          } catch {
            // ignore parse errors for individual entries
          }
        }

        await Promise.allSettled(
          studentIds.map(async (sid) => {
            const studentEmirateId = idToEid[sid] ?? null;
            await fetch(`${origin}/api/parent/update-information-requests`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              cache: "no-store",
              body: JSON.stringify({
                studentPersonId: sid,
                parentPersonId: person.sourcedId,
                studentEmirateId,
              }),
            }).catch(() => undefined);
          })
        );
      } catch {
        // Soft-fail: do not block the response if background creation fails
      }

      return NextResponse.json({ 
        meta: { 
          eid: personIdentifier, 
          parentSourcedId: person.sourcedId, 
          personSourcedId: person.sourcedId, 
          role: role || "parent", 
          studentCount: studentIds.length, 
          cache: {
            source: [parentOrStudentFullWrap.source, linksSource2, childrenSource].includes("upstream") ? "upstream" : "cache",
            lastUpdated: [parentOrStudentFullWrap.fetchedAt, linksFetchedAt2, childrenFetchedAt]
              .filter((x): x is string => typeof x === "string")
              .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null,
          },
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
