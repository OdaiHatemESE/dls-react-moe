# IDH API Implementation Summary

## Overview

This document describes the implementation of the IDH (Individual Data Hub) API endpoints that connect to the Parent Portal API at `https://parent-stg.moe.gov.ae/v1ppAPI/idh`.

## Purpose

The IDH API manages student transportation and address data, including:
- Transportation type and contact information
- Detailed address components (emirate, area, street, building, etc.)
- Geographic coordinates (latitude/longitude)
- Supporting attachments (e.g., route maps)
- Status tracking

## Implementation Files

### 1. API Routes

#### `/app/api/backoffice/idh/route.ts`
**GET endpoint** - Fetches IDH data for a specific student by their sourceId (OneRoster person ID) via query parameter

**Features:**
- Requires authentication via NextAuth session
- Automatically obtains PP API token
- Returns student transportation and address data
- Includes metadata (sourceId, fetchedAt timestamp)

**Usage:**
```bash
GET /api/backoffice/idh?sourceId=SST-1-1-Pers-1687158
```

#### `/app/api/backoffice/idh/route.ts` (same file)
**POST endpoint** - Inserts or updates IDH data for a student

**Features:**
- Requires authentication via NextAuth session
- Validates required fields (studentNumber, schoolId, sourceId)
- Automatically obtains PP API token
- Accepts full IDHStudent object in request body
- Returns confirmation with insertedAt timestamp

**Usage:**
```bash
POST /api/backoffice/idh
Content-Type: application/json

{
  "studentNumber": "123456",
  "schoolId": "SCH-1001",
  "sourceId": "SST-1-1-Pers-1687158",
  ...
}
```

### 2. TypeScript Types

#### `/app/types/idh.ts`
Defines shared TypeScript interfaces:

- `IDHStudent` - Core data structure for IDH records
- `IDHApiResponse` - Response wrapper for GET requests
- `IDHInsertResponse` - Response wrapper for POST requests

### 3. Documentation

#### `/app/api/backoffice/idh/README.md`
Comprehensive API documentation including:
- Endpoint descriptions
- Authentication requirements
- Request/response examples
- Error handling
- Field definitions

### 4. Test Page

#### `/app/debug/idh-test/page.tsx`
Interactive test page for the IDH endpoints:
- Fetch IDH data by sourceId
- Insert/update IDH data with form inputs
- Display results and errors
- Pre-filled with sample data

**Access at:** `http://localhost:4200/debug/idh-test`

## Data Structure

```typescript
interface IDHStudent {
  studentNumber: string;        // Student identifier
  schoolId: string;             // School identifier
  primaryPhone: string;         // Primary contact phone
  otherPhone: string;           // Secondary contact phone
  transportationType: string;   // e.g., "Bus", "Private", etc.
  
  // Address components
  emirate: string;              // e.g., "Dubai", "Abu Dhabi"
  area: string;                 // Area/district name
  street: string;               // Street name
  houseBuilding: string;        // Building/villa number
  region: string;               // Region name
  zone: string;                 // Zone identifier
  plot: string;                 // Plot number
  mainPlot: string;             // Main plot number
  premises: string;             // Premises type
  
  // Geographic data
  latitude: string;             // Decimal degrees
  longitude: string;            // Decimal degrees
  
  // Additional data
  attachment01: string;         // URL to attachment (e.g., route map)
  statusId: number;             // Status code
  sourceId: string;             // OneRoster person ID (required)
  datetime: string;             // ISO timestamp
}
```

## Authentication Flow

1. User must have valid NextAuth session
2. API route calls `/api/PP/auth/token` to obtain PP API access token
3. Token is cached in Redis with 50-minute TTL
4. Token is used in `Authorization: Bearer <token>` header for upstream requests

## Environment Configuration

Required environment variables (already configured in `.env`):

```properties
PP_BASE_URL=https://parent-stg.moe.gov.ae/v1ppAPI
PP_USERNAME="PP_Admin_STG"
PP_PASSWORD="LSNSHZaENh3zdI5QljFeWvjg"
```

## Usage Examples

### Client-side Fetch Example

```typescript
import type { IDHApiResponse } from '@/app/types/idh';

// Fetch IDH data
const response = await fetch(`/api/backoffice/idh?sourceId=${encodeURIComponent(sourceId)}`);
const result: IDHApiResponse = await response.json();

if (result.ok && result.data) {
  console.log('Student address:', result.data.street);
  console.log('Transportation:', result.data.transportationType);
}
```

### Client-side Insert Example

```typescript
import type { IDHStudent } from '@/app/types/idh';

const idhData: IDHStudent = {
  studentNumber: "123456",
  schoolId: "SCH-1001",
  sourceId: "SST-1-1-Pers-1687158",
  primaryPhone: "+971501234567",
  // ... other fields
};

const response = await fetch('/api/backoffice/idh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(idhData),
});

const result = await response.json();
if (result.ok) {
  console.log('IDH data saved successfully');
}
```

## Error Handling

Both endpoints return consistent error responses:

```json
{
  "ok": false,
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad request (missing/invalid parameters)
- `401` - Unauthorized (no session)
- `500` - Internal server error or upstream error

## Testing

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to the test page:**
   ```
   http://localhost:4200/debug/idh-test
   ```

3. **Test fetching data:**
   - Enter a valid sourceId (e.g., `SST-1-1-Pers-1687158`)
   - Click "Fetch IDH Data"
   - Review the response

4. **Test inserting data:**
   - Fill in the required fields (studentNumber, schoolId, sourceId)
   - Optionally modify other fields
   - Click "Insert/Update IDH Data"
   - Verify the response

## Integration Notes

- All requests use `cache: 'no-store'` to ensure fresh data
- The PP API token is automatically managed and cached
- Follows the same patterns as existing PP API endpoints (`/api/PP/student`, `/api/PP/ChildList`)
- Compatible with the existing auth infrastructure
- Can be integrated into admin or parent-facing interfaces

## Next Steps

Potential enhancements:
1. Add caching layer for frequently accessed IDH data
2. Create admin UI for managing IDH records
3. Add validation for coordinates (valid lat/lng ranges)
4. Implement file upload for attachments
5. Add batch operations for multiple students
6. Create integration with address autocomplete services
7. Add audit logging for data changes

## Files Created/Modified

### New Files:
- `/app/api/backoffice/idh/route.ts` - GET and POST endpoints
- `/app/api/backoffice/idh/README.md` - API documentation
- `/app/types/idh.ts` - TypeScript type definitions
- `/app/debug/idh-test/page.tsx` - Test page
- `/IDH_API_IMPLEMENTATION.md` - This document

### Modified Files:
- None (all new implementations)

## Dependencies

Uses existing infrastructure:
- NextAuth for authentication (`@/lib/auth`)
- PP API token management (`/api/PP/auth/token`)
- Cache utilities (`@/lib/cache`)
- Next.js App Router
- UI components from `/components/ui`
