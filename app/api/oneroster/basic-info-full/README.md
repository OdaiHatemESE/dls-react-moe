# Basic Info (Full) API

Endpoint: `/api/oneroster/basic-info-full`

This Next.js route returns a person’s full OneRoster record by external identifier (`eid`). If the person is a parent/guardian, it also returns the full records of their linked students. If the person is a student, it returns just the student’s full record and no children.

- Always dynamic: no ISR caching (`export const dynamic = "force-dynamic"`).
- Preserves vendor payload shapes (does not normalize `parent`/`children` bodies beyond wrapping in arrays when needed).

## Request

- Method: `GET`
- Query params:
  - `eid` (required): the person’s external OneRoster identifier.

Example:

```
GET /api/oneroster/basic-info-full?eid=P98765
```

If `eid` is missing → 400.

## High-level flow

1) Look up the person by EID to obtain their `sourcedId`.
2) Fetch the vendor’s full person record by identifier (for role detection and as `parent`).
3) Detect the role robustly across vendor payload shapes using `pickRole`.
4) If role includes `student` → return the person as a student (no children).
5) Otherwise assume parent/guardian → fetch linked students and return their full records as `children`.

## Role detection (`pickRole`)

Vendors can return different shapes. This route supports these common forms:

- `[ { persons: { ...person } } ]`
- `[ { persons: [ { ...person } ] } ]`
- `[ { ...person } ]`

`pickRole` looks for:
- `role`
- `metadata.role`
- `roleList` (array of strings or objects like `{ role: "guardian" }`)

If multiple roles are present, they are joined as a comma-separated string (e.g., `"guardian,parent"`). The result is lowercased and checked with `includes("student")`.

## Responses

All responses are JSON. The `parent` and `children` fields keep the vendor’s original structure.

### Student EID

- Request: `GET /api/oneroster/basic-info-full?eid=S12345`
- Response:

```json
{
  "meta": {
    "eid": "S12345",
    "personSourcedId": "<student-sourced-id>",
    "role": "student",
    "studentCount": 0
  },
  "parent": [
    // full student record in the vendor's original shape
  ],
  "children": []
}
```

### Parent/Guardian EID

- Request: `GET /api/oneroster/basic-info-full?eid=P98765`
- Response:

```json
{
  "meta": {
    "eid": "P98765",
    "parentSourcedId": "<parent-sourced-id>",
    "personSourcedId": "<parent-sourced-id>",
    "role": "parent", // or the resolved role string
    "studentCount": 2
  },
  "parent": [
    // full parent record in the vendor's original shape
  ],
  "children": [
    // array of full student records in the vendor's original shape
  ]
}
```

Notes:
- If a parent has no linked students (or the vendor returns 404 for the relationship call), `children` is `[]` and `studentCount` is `0`.
- `personSourcedId` is provided in `meta` for both student and parent paths; when the user is a parent, `parentSourcedId` is also included as an alias for clarity.

## Error cases

- 400: `{ "error": "Missing ?eid" }`
- 404: `{ "error": "No person found for EID <eid>" }`
- 500: `{ "error": "<server error message>" }`

## Implementation details

- File: `app/api/oneroster/basic-info-full/route.ts`
- Key helpers:
  - `getPersonByEid(eid)`: lightweight lookup to obtain `sourcedId`.
  - `getFullPersonById(eid)`: wraps a vendor `persons` query by identifier and always returns an array.
  - `getStudentIdsForPerson(sourcedId)`: lists student IDs linked to a parent.
  - `getStudentsFull(studentIds)`: fetches full records for multiple students.
  - `orFetch<T>(path, permission)`: typed OneRoster fetch wrapper.

## Usage tips

- Use `eid` for lookup; do not pass `sourcedId` directly to this endpoint.
- The returned `parent`/`children` payloads are vendor-native. If you need normalized shapes, add a transformation layer downstream to avoid coupling this route to a single vendor format.
- If you need caching, introduce it in the data layer (`orFetch`/repo functions) rather than at the route level to keep correctness and control.

## Related endpoints

- See `app/api/oneroster/get-person/route.ts` and `app/api/oneroster/schoolenrollments/route.ts` for complementary OneRoster data.
