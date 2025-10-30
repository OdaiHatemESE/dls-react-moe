# Academic Year Configuration API

This API endpoint manages the active academic year configuration for the parent portal system.

## Base URL
```
/api/admin/config/academic-year
```

## Authentication
All endpoints require authentication via NextAuth session.

---

## Endpoints

### GET - Retrieve Academic Years

Fetch all configured academic years or get the active year.

**Query Parameters:**
- `activeOnly=true` - (Optional) Returns only the currently active academic year

**Response (All Years):**
```json
[
  {
    "id": 1,
    "academicYear": "2025-2026",
    "yearValue": 2026,
    "isActive": true,
    "description": "Academic year 2025-2026",
    "createdBy": "784-xxxx-xxxxxxx-x",
    "createdAt": "2025-10-30T10:00:00.000Z",
    "updatedAt": "2025-10-30T10:00:00.000Z"
  },
  {
    "id": 2,
    "academicYear": "2026-2027",
    "yearValue": 2027,
    "isActive": false,
    "description": "Academic year 2026-2027",
    "createdBy": "784-xxxx-xxxxxxx-x",
    "createdAt": "2025-10-30T10:00:00.000Z",
    "updatedAt": "2025-10-30T10:00:00.000Z"
  }
]
```

**Response (Active Only):**
```json
{
  "id": 1,
  "academicYear": "2025-2026",
  "yearValue": 2026,
  "isActive": true,
  "description": "Academic year 2025-2026",
  "createdBy": "784-xxxx-xxxxxxx-x",
  "createdAt": "2025-10-30T10:00:00.000Z",
  "updatedAt": "2025-10-30T10:00:00.000Z"
}
```

---

### POST - Create Academic Year or Initialize Defaults

Create a new academic year or initialize all default years (2025-2031).

**Request Body (Single Year):**
```json
{
  "academicYear": "2025-2026",
  "yearValue": 2026,
  "isActive": true,
  "description": "Academic year 2025-2026"
}
```

**Request Body (Initialize Defaults):**
```json
{
  "initializeDefaults": true
}
```

**Response:**
```json
{
  "id": 1,
  "academicYear": "2025-2026",
  "yearValue": 2026,
  "isActive": true,
  "description": "Academic year 2025-2026",
  "createdBy": "784-xxxx-xxxxxxx-x",
  "createdAt": "2025-10-30T10:00:00.000Z",
  "updatedAt": "2025-10-30T10:00:00.000Z"
}
```

**Response (Initialize Defaults):**
```json
{
  "message": "Default academic years initialized",
  "years": [
    { "id": 1, "academicYear": "2025-2026", "yearValue": 2026, ... },
    { "id": 2, "academicYear": "2026-2027", "yearValue": 2027, ... },
    { "id": 3, "academicYear": "2027-2028", "yearValue": 2028, ... },
    { "id": 4, "academicYear": "2028-2029", "yearValue": 2029, ... },
    { "id": 5, "academicYear": "2029-2030", "yearValue": 2030, ... },
    { "id": 6, "academicYear": "2030-2031", "yearValue": 2031, ... }
  ]
}
```

**Validation:**
- `academicYear` and `yearValue` are required for single year creation
- `academicYear` must be unique
- Setting a year as active will automatically deactivate all other years

---

### PATCH - Update Academic Year

Update an existing academic year configuration.

**Request Body:**
```json
{
  "id": 1,
  "isActive": true,
  "description": "Updated description"
}
```

**Response:**
```json
{
  "id": 1,
  "academicYear": "2025-2026",
  "yearValue": 2026,
  "isActive": true,
  "description": "Updated description",
  "createdBy": "784-xxxx-xxxxxxx-x",
  "createdAt": "2025-10-30T10:00:00.000Z",
  "updatedAt": "2025-10-30T10:30:00.000Z"
}
```

**Validation:**
- `id` is required
- Setting `isActive: true` will automatically deactivate all other years

---

### DELETE - Remove Academic Year

Delete an academic year configuration.

**Query Parameters:**
- `id` - (Required) The ID of the academic year to delete

**Example:**
```
DELETE /api/admin/config/academic-year?id=2
```

**Response:**
```json
{
  "message": "Academic year deleted successfully"
}
```

**Validation:**
- Cannot delete the currently active academic year
- `id` is required

---

## Usage Examples

### Get Active Academic Year
```typescript
const response = await fetch('/api/admin/config/academic-year?activeOnly=true');
const activeYear = await response.json();
console.log(activeYear.yearValue); // 2026
```

### Initialize Default Years
```typescript
const response = await fetch('/api/admin/config/academic-year', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ initializeDefaults: true })
});
const result = await response.json();
console.log(result.years.length); // 6
```

### Set Active Year
```typescript
const response = await fetch('/api/admin/config/academic-year', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 2,
    isActive: true
  })
});
const updatedYear = await response.json();
```

---

## Helper Functions

Use these helper functions in your server-side code:

```typescript
import {
  getActiveAcademicYear,
  getActiveAcademicYearValue
} from '@/lib/admin-config';

// Get full active year object
const activeYear = await getActiveAcademicYear();
console.log(activeYear?.academicYear); // "2025-2026"

// Get just the year value
const yearValue = await getActiveAcademicYearValue();
console.log(yearValue); // 2026
```

---

## Academic Year Format

The system uses the following format:
- **Academic Year**: String format `YYYY-YYYY` (e.g., "2025-2026")
- **Year Value**: Integer representing the **ending year** (e.g., 2026)

### Examples:
| Academic Year | Year Value |
|---------------|------------|
| 2025-2026     | 2026       |
| 2026-2027     | 2027       |
| 2027-2028     | 2028       |
| 2028-2029     | 2029       |
| 2029-2030     | 2030       |
| 2030-2031     | 2031       |

---

## Database Schema

```prisma
model AcademicYearConfig {
  id               Int      @id @default(autoincrement())
  academicYear     String   @unique @db.VarChar(20)
  yearValue        Int
  isActive         Boolean  @default(false)
  description      String?  @db.VarChar(Max)
  createdBy        String?  @db.VarChar(64)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

---

## Error Responses

**401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

**400 Bad Request:**
```json
{
  "error": "Academic year and year value are required"
}
```
```json
{
  "error": "Academic year already exists"
}
```
```json
{
  "error": "Cannot delete the active academic year"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to fetch academic years"
}
```

---

## Notes

- Only one academic year can be active at a time
- The active year is automatically set when creating/updating with `isActive: true`
- Deleting the active academic year is prevented to ensure system integrity
- The "Initialize Defaults" feature creates 6 years starting from 2025-2026
- Years are displayed in descending order (newest first)
