# POST /api/parent/update-information-requests

Creates a row in the Parent-Portal DB table `UpdateInformationRequests` for a given `studentPersonId` using the parent Prisma client.

- If a row for the `studentPersonId` already exists, the API returns it without creating a duplicate.
- Uses the separate Prisma client from `@/lib/prisma-parent` (mapped to `@prisma/client-parent-portal`).

## Request

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