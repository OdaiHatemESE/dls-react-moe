# /api/parent/update-information-requests

Endpoints for interacting with the Parent-Portal DB table `UpdateInformationRequests` using the parent Prisma client.

- Uses the separate Prisma client from `@/lib/prisma-parent` (mapped to `@prisma/client-parent-portal`).

## POST (create if missing)

Method: POST

Body JSON:

- studentPersonId (string, required)
- parentPersonId (string, optional)
- studentEmirateId (string, optional)

Example:

POST /api/parent/update-information-requests
Content-Type: application/json

{ "studentPersonId": "STU-123", "parentPersonId": "PAR-456", "studentEmirateId": "784-XXXX-XXXXXXX-X" }

## Responses

- 201 Created
{ "ok": true, "created": true, "data": { ...row } }

- 200 OK (already exists)
{ "ok": true, "alreadyExists": true, "data": { ...row } }

- 400 Bad Request
{ "ok": false, "error": "studentPersonId is required" }

- 500 Server Error
{ "ok": false, "error": "<message>" }

## Notes

- The model allows multiple records per `studentPersonId`; this endpoint chooses to avoid duplicates by checking `findFirst` before insert.
- If stricter uniqueness is desired, add a unique index on `studentPersonId` in the Prisma schema and switch to `upsert`.
- Timestamps `createAt` and `updateAt` are set by the route.

## GET (retrieve/upsert by studentPersonId)

Method: GET

Query params:

- studentPersonId (string, required)
- parentPersonId (string, optional; will be linked on first creation or updated if missing)
- studentEmirateId (string, optional)

Behavior:

- Requires authentication (401 otherwise).
- Upserts a record by `studentPersonId` so the caller can rely on a row existing.
- Returns current flags like `isInfoUpdateRequested` and `isConductAgreementSigned`.

Response 200 OK
{ "ok": true, "data": { ...row } }