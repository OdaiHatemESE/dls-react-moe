# OneRoster API – Consolidated README

This document describes all OneRoster-facing API routes under `app/api/oneroster/**`, the shared auth/fetch layer, request/response shapes, caching, and migration notes. It is designed so another AI/agent can re-implement or migrate these endpoints reliably.

## Overview

- Runtime: Next.js App Router (route handlers under `app/api/**`).
- Data source: External OneRoster vendor APIs via `lib/oneroster.ts` (server-only, bearer authentication with token exchange).
- Caching: Redis JSON caching via `lib/cache.ts` with in-memory fallback. All routes are dynamic (`export const dynamic = "force-dynamic"`).
- Shapes: Responses from our endpoints largely preserve the vendor’s native JSON payloads; minimal normalization is applied.

## Environment configuration

The OneRoster client requires the following env vars (see `.env.local.example`):

- `ONEROSTER_AUTH_URL` – Token endpoint (JSON body) used to obtain a bearer token.
- `ONEROSTER_BASE` – Base URL for vendor API calls (e.g., `https://vendor.example.com/oneroster`).
- Read credentials (required for GETs):
  - `ONEROSTER_READ_USERNAME`
  - `ONEROSTER_READ_PASSWORD`
  - `ONEROSTER_READ_SITE_UID`
- Write credentials (only if implementing POST/PUT later):
  - `ONEROSTER_WRITE_USERNAME`
  - `ONEROSTER_WRITE_PASSWORD`
  - `ONEROSTER_WRITE_SITE_UID`

## Shared fetch layer (`lib/oneroster.ts`)

Contract for `orFetch<T>(path, kind = "read", init?)`:
- Inputs:
  - `path`: string like `/v1p1/persons?filter=...`.
  - `kind`: `"read" | "write"`; selects credential set and token cache.
  - `init`: optional `RequestInit`; headers are merged, but `Authorization` is always set by the helper.
- Behavior:
  - Obtains a bearer token by POSTing JSON to `ONEROSTER_AUTH_URL` with body `{ ImsCredentials: { username, password, siteUid } }`.
  - Caches the token in-memory per kind with an expiry derived from several possible fields (`accessToken|token|jwt|bearerToken`, `expiresIn|expires_in|expiry|expires|expiresAt|expiration`).
  - Performs the request to `ONEROSTER_BASE + path` with `cache: "no-store"`.
  - On 401/403, invalidates the token and retries once.
  - Returns parsed JSON when possible; otherwise returns raw text.

Implications for migration:
- Treat this as the only path to call the vendor; don’t duplicate token handling in routes.
- All vendor calls should be server-only.

## Cache layer (`lib/cache.ts`)

- `cacheGetJSON(key)` / `cacheSetJSON(key, value, { ttlSeconds })` store JSON blobs in Redis. If Redis is down, an in-memory Map is used as a fallback.
- `makeKey([...parts])` joins parts by `:` for namespaced keys.
- Route handlers expose a `nocache=1|true|yes` query param to bypass Redis when necessary.

## Endpoints

### 1) GET /api/oneroster/basic-info-full

Purpose: Given an authenticated user’s Emirates ID (EID) from NextAuth session, returns the person’s full OneRoster record. If the user is a parent/guardian, includes the full records of all linked students. Optionally, a `sourcedId` may be supplied to fetch a specific student after verifying the student is linked to the parent.

- Auth: Requires NextAuth session; EID read via `getServerSession(authOptions)` and `session.user.emiratesId`.
- Query params:
  - `sourcedId` (optional): If present, verifies linkage to the authenticated parent, then returns that student’s data only.
  - `nocache` (optional): `1|true|yes` to bypass Redis.
- Behavior:
  - For authenticated parent without `sourcedId`:
    - Fetch parent full record via `/v1p1/persons?filter=identifier='<eid>'`.
    - Fetch linked students via `/v1p1/studentlinks?filter=parent='<parentId>'`.
    - Fetch each student’s full record via `/v1p1/persons?filter=sourcedId='<sid>'`.
    - Writes background records to `/api/parent/update-information-requests` (best-effort; soft-fails).
  - For authenticated student: returns only the student record.
  - For `sourcedId` param: verifies linkage to parent before returning the specific student.
- Caching:
  - Parent/student person lookups: 1h TTL.
  - Parent→student links: 15m TTL.
  - Children full payload batch: 10m TTL (key includes sorted student ID list).
  - All caches store `{ data, fetchedAt }` wrappers for provenance.
- Response shape:
  ```json
  {
    "meta": {
      "eid"?: "<user EID>",
      "parentSourcedId"?: "<parent id>",
      "personSourcedId": "<person id>",
      "role": "student|parent|...",
      "studentCount": <number>,
      "cache": { "source": "cache|upstream", "lastUpdated": "<ISO>|null" },
      "updateInformationRequest"?: { ... } // when applicable
    },
    "parent": [ ...vendor-native parent-or-student payload... ],
    "children": [ ...vendor-native student payloads... ]
  }
  ```
- Files: `basic-info-full/route.ts`, `basic-info-full/session.ts`, `basic-info-full/README.md`.

### 2) GET /api/oneroster/latest-enrollment

Purpose: Return the latest active school enrollment for a given student, plus the school’s `educationType`.

- Query params:
  - `sourcedId` (required, alias: `sourceId`): student sourcedId.
  - `schoolYear` (optional): defaults to `2022` if omitted.
- Behavior:
  - Fetch `/v1p1/schoolenrollments` with filter:
    - `student='<id>' AND schoolYear='<year>' AND exitDate=' ' AND enrollmentType='Enrollment' AND status='active'`.
  - Sort by `entryDate` desc, then `dateLastModified` desc, then `createDate` desc; pick first.
  - If `school.sourcedId` exists, fetch `/v1p1/schools/{id}?fields=educationType` and extract `educationType` from multiple possible shapes.
- Response shape:
  ```json
  {
    "sourcedId": "<studentId>",
    "schoolYear": "<year>",
    "enrollment": { ... } | null,
    "schoolID": "<school sourcedId>" | null,
    "educationType": "<string>" | null,
    "count": <number>
  }
  ```
- File: `latest-enrollment/route.ts`.

### 3) GET /api/oneroster/schoolenrollments

Purpose: Retrieve all school enrollments for a student, optionally filtered by school year, with helpful related data and caching.

- Query params:
  - `studentId` (required)
  - `schoolYear` (optional): if omitted, returns all years; response includes `schoolYear: "all"`.
  - `nocache` (optional): bypass Redis.
- Behavior:
  - Calls `getSchoolEnrollmentsByStudent(studentId, schoolYear?)` which requests `/v1p1/schoolenrollments` with a selected field list for efficiency.
  - Caches enrollment arrays per `(studentId, schoolYear)` with wrapper `{ data, fetchedAt }`.
  - Collects unique `school.sourcedId` values and fetches each org via `/v1p1/orgs/{id}?fields=...` (cached per org).
  - Looks up each enrollment’s `streamGrade` via `/v1p1/streamGrades/{id}` (cached per id).
- Response shape:
  ```json
  {
    "enrollments": [ ... ],
    "count": <number>,
    "studentId": "<id>",
    "schoolYear": "<year|all>",
    "schoolID": "<first schoolId>|null",
    "schoolInfo": { ... } | null,
    "schoolIDs": [ ...unique ids... ],
    "schoolInfos": [ ...parallel org payloads... ],
    "StreamGrades": [ ...stream grade payloads or nulls... ],
    "meta": { "cache": { "source": "cache|upstream", "lastUpdated": "<ISO>|null" } }
  }
  ```
- File: `schoolenrollments/route.ts`.

### 4) GET /api/oneroster/students/[sourcedId]

Purpose: Proxy to vendor’s `/v1p1/students/{sourcedId}` with optional passthrough query params; preserves vendor shape.

- Params: Path param `sourcedId`.
- Query params: Any are forwarded except `nocache` (which only controls our cache bypass).
- Behavior:
  - Cache key includes `sourcedId` and a stable serialization of the passed-through query string.
  - TTL: 10 minutes.
- Response: vendor-native JSON for the student.
- File: `students/[sourcedId]/route.ts`.

## Support library (`lib/roster-repo.ts`)

- `getPersonByEid(eid)`: `/v1p1/persons?filter=identifier='<eid>'`; returns first person.
- `getStudentIdsForPerson(personId)`: `/v1p1/studentlinks?filter=parent='<personId>'`; returns `[sourcedId]` array.
- `getStudentsFull(ids[])`: for each id, `/v1p1/persons?filter=sourcedId='<id>'`; concatenates arrays or single objects.
- `getSchoolEnrollmentsByStudent(studentId, schoolYear?)`: `/v1p1/schoolenrollments?filter=...&fields=...`; returns array.
- `getOrgBySourcedId(id)`: `/v1p1/orgs/{id}?fields=sourcedId,name,metadata.shortName,metadata.englishName,metadata.addresses`.
- `getStreamGradeById(id)`: `/v1p1/streamGrades/{id}`.

## Error handling conventions

- Validation errors return 400 with `{ error: "..." }`.
- Authorization or linkage errors return 401/403 as appropriate with `{ error: "..." }` plus hints when safe.
- Upstream failures return 500 with `{ error: "Server error" | message }`; some routes soft-fail noncritical lookups and continue with partial data.

## Migration checklist for another agent

- Replicate `orFetch` logic exactly (token extraction and retry rules), or import it from a shared package.
- Preserve dynamic routes and disable ISR for vendor-dependent endpoints.
- Maintain vendor-native response shapes whenever possible; avoid normalization at this layer.
- Implement Redis (or equivalent) JSON caching with TTLs per data class and a `nocache` bypass.
- Keep auth-dependent behavior in `basic-info-full` (session EID, parent-student linkage checks) and background POSTs to `api/parent/update-information-requests` as best-effort.
- Ensure query literal escaping for OneRoster `filter` values by doubling single quotes.

## Examples

- Basic info for current user (parent or student):
  - `GET /api/oneroster/basic-info-full`
- Specific linked student for a parent:
  - `GET /api/oneroster/basic-info-full?sourcedId=<SID>`
- Latest enrollment for a student:
  - `GET /api/oneroster/latest-enrollment?sourcedId=<SID>&schoolYear=2022`
- All enrollments with orgs and stream grades:
  - `GET /api/oneroster/schoolenrollments?studentId=<SID>&schoolYear=2024`
- Student proxy:
  - `GET /api/oneroster/students/<SID>?fields=name,grades`

## Notes and gotchas

- Always set `cache: "no-store"` for vendor calls; avoid Next.js route cache.
- Some vendors wrap responses in envelopes (e.g., arrays or `{ persons: [...] }`). Parsers are tolerant and keep raw payloads when unsure.
- When building cache keys for batches (e.g., children set), include a sorted list of IDs to avoid collisions.

---

Maintainers: Add new OneRoster routes under `app/api/oneroster/<name>/route.ts` and include a brief `README.md` there if the route is externally consumed. Update this consolidated README when you add or change endpoints.
