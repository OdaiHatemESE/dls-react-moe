# latest-enrollment API

Returns the latest active school enrollment for a student and the school's educationType.

- Method: GET
- Path: `/api/oneroster/latest-enrollment`

## Query parameters
- `sourcedId` (required): Student sourcedId (e.g., `SST-1-1-Pers-3575279`). Alias: `sourceId`.
- `schoolYear` (optional): School year filter. Defaults to `2022` per current vendor requirement.

Additional fixed filters applied:
- `exitDate = ' '` (single space)
- `enrollmentType = 'Enrollment'`
- `status = 'active'`

## Behavior
1. Fetches `/v1p1/schoolenrollments` with the above filter and selects the most recent enrollment by `entryDate`, then `dateLastModified`, then `createDate`.
2. Uses the selected enrollment's `school.sourcedId` to fetch `/v1p1/schools/{id}?fields=educationType` and extracts `educationType`.

## Response
```
{
  "sourcedId": "<studentId>",
  "schoolYear": "2022",
  "enrollment": { ... },
  "schoolID": "<school sourcedId>|null",
  "educationType": "<string>|null",
  "count": <number of enrollments matching filter>
}
```

If no enrollment matches, `enrollment`, `schoolID`, and `educationType` will be `null`.
