# School Enrollments API

This API endpoint provides access to OneRoster school enrollment data by student ID.

## Endpoint

```
GET /api/oneroster/schoolenrollments
```

## Parameters

| Parameter   | Type   | Required | Description                                                     |
|-------------|--------|----------|-----------------------------------------------------------------|
| `studentId` | string | Yes      | The student's sourcedId to get enrollments for                 |
| `schoolYear`| string | No       | Optional school year filter (e.g., "2026")                     |

## Examples

### Get enrollments for a specific student and school year
```bash
curl "http://localhost:4200/api/oneroster/schoolenrollments?studentId=SST-1-1-Pers-3570291&schoolYear=2026"
```

### Get all enrollments for a specific student
```bash
curl "http://localhost:4200/api/oneroster/schoolenrollments?studentId=SST-1-1-Pers-3570291"
```

## Response Format

### Success Response (200)
```json
{
  "enrollments": [
    {
      "sourcedId": "SST-1-1-Enrl-1601638597",
      "entryType": "Promoted",
      "exitType": "",
      "note": "",
      "exitReason": "",
      "entryDate": "2025-08-18",
      "student": {
        "href": "https://sisapi.moe.gov.ae/Integration/ims/oneroster/v1p1/students/SST-1-1-Pers-3570291",
        "sourcedId": "SST-1-1-Pers-3570291",
        "type": "students"
      },
      "session": {
        "href": "https://sisapi.moe.gov.ae/Integration/ims/oneroster/v1p1/academicSessions/SST-1-1-Sess-1174405155",
        "sourcedId": "SST-1-1-Sess-1174405155",
        "type": "academicSessions"
      },
      "community": {
        "href": "https://sisapi.moe.gov.ae/Integration/ims/oneroster/v1p1/communities/SST-1-1-Cmty-228730019",
        "sourcedId": "SST-1-1-Cmty-228730019",
        "type": "communities"
      },
      "dateLastModified": "2025-09-24T16:49:26.211Z",
      "isSpecialNeed": false,
      "school": {
        "href": "https://sisapi.moe.gov.ae/Integration/ims/oneroster/v1p1/schools/SST-1-1-Site-110756",
        "sourcedId": "SST-1-1-Site-110756",
        "type": "schools"
      },
      "schoolYear": 2026,
      "streamGrade": {
        "href": "https://sisapi.moe.gov.ae/Integration/ims/oneroster/v1p1/streamGrades/SST-1-1-StrG-1174405279",
        "sourcedId": "SST-1-1-StrG-1174405279",
        "type": "streamGrades"
      },
      "enrollmentType": "Enrollment",
      "exitDate": "",
      "status": "active",
      "isMandatoryEducation": "true",
      "createDate": "2025-08-12T15:00:30.582Z"
    }
  ],
  "count": 1,
  "studentId": "SST-1-1-Pers-3570291",
  "schoolYear": "2026"
}
```

### Error Response (400)
```json
{
  "error": "Missing required parameter: studentId"
}
```

### Error Response (500)
```json
{
  "error": "Server error message"
}
```

## Response Fields

### Enrollment Object

| Field                    | Type    | Description                                           |
|--------------------------|---------|-------------------------------------------------------|
| `sourcedId`              | string  | Unique identifier for the enrollment                  |
| `entryType`              | string  | Type of entry (e.g., "Promoted")                     |
| `exitType`               | string  | Type of exit (empty if still enrolled)               |
| `note`                   | string  | Additional notes about the enrollment                 |
| `exitReason`             | string  | Reason for exit (empty if still enrolled)            |
| `entryDate`              | string  | Date when student entered (YYYY-MM-DD)               |
| `student`                | object  | Student reference with href, sourcedId, and type     |
| `session`                | object  | Academic session reference                            |
| `community`              | object  | Community reference                                   |
| `dateLastModified`       | string  | ISO date string of last modification                 |
| `isSpecialNeed`          | boolean | Whether the student has special needs                 |
| `school`                 | object  | School reference with href, sourcedId, and type      |
| `schoolYear`             | number  | The school year for this enrollment (e.g., 2026)     |
| `streamGrade`            | object  | Stream/Grade reference                                |
| `enrollmentType`         | string  | Type of enrollment (e.g., "Enrollment")              |
| `exitDate`               | string  | Date when student exited (empty if still enrolled)   |
| `status`                 | string  | Enrollment status (e.g., "active")                   |
| `isMandatoryEducation`   | string  | Whether this is mandatory education ("true"/"false") |
| `createDate`             | string  | ISO date string when enrollment was created          |

### Reference Object Structure

Each reference object (student, session, community, school, streamGrade) contains:

| Field       | Type   | Description                               |
|-------------|--------|-------------------------------------------|
| `href`      | string | Full URL to the referenced resource       |
| `sourcedId` | string | Unique identifier of the referenced item  |
| `type`      | string | Type of the referenced resource           |

## OneRoster Filter Format

This endpoint translates to the following OneRoster API call:

```
/v1p1/schoolenrollments?filter=student='SST-1-1-Pers-3570291' AND schoolYear='2026'
```

The filter properly escapes single quotes in values and URL-encodes the entire filter parameter.

## Testing

Run the test script to verify the endpoint:

```bash
node test-enrollment.js
```

Make sure your development server is running first:

```bash
npm run dev
```

## Environment Variables Required

Ensure these OneRoster credentials are configured in your `.env.local`:

```
ONEROSTER_AUTH_URL=your_auth_url
ONEROSTER_BASE=your_base_url
ONEROSTER_READ_USERNAME=your_read_username
ONEROSTER_READ_PASSWORD=your_read_password
ONEROSTER_READ_SITE_UID=your_site_uid
```