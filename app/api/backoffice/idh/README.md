# IDH API Endpoints

These endpoints connect to the PP API's IDH (Individual Data Hub) service for managing student transportation and address data.

## Base URL

- **Upstream**: `https://parent-stg.moe.gov.ae/v1ppAPI/idh`
- **Local**: `/api/backoffice/idh`

## Authentication

All endpoints require:
- Valid NextAuth session
- PP API token (automatically obtained via `/api/PP/auth/token`)

## Endpoints

### 1. Fetch Student IDH Data

**GET** `/api/backoffice/idh?sourceId=[sourceId]`

Retrieves IDH data for a specific student by their sourceId (OneRoster person ID).

#### Parameters

- `sourceId` (query parameter): The student's OneRoster person ID (e.g., `SST-1-1-Pers-1687158`)

#### Example Request

```bash
curl "http://localhost:4200/api/backoffice/idh?sourceId=SST-1-1-Pers-1687158" \
  -H "Cookie: next-auth.session-token=..."
```

#### Example Response

```json
{
  "ok": true,
  "data": {
    "studentNumber": "123456",
    "schoolId": "SCH-1001",
    "primaryPhone": "+971501234567",
    "otherPhone": "+971504444444",
    "transportationType": "Bus",
    "emirate": "Dubai",
    "area": "Jumeirah 2",
    "street": "Al Wasl Road",
    "houseBuilding": "Villa 15",
    "region": "Jumeirah",
    "zone": "Zone 7",
    "plot": "123",
    "mainPlot": "123-A",
    "premises": "Residential",
    "latitude": "25.2048",
    "longitude": "55.2708",
    "attachment01": "https://cdn.example.com/attachments/route-map.pdf",
    "statusId": 5,
    "sourceId": "SST-1-1-Pers-1687158",
    "datetime": "2025-10-25T12:00:00Z"
  },
  "meta": {
    "sourceId": "SST-1-1-Pers-1687158",
    "fetchedAt": "2025-10-28T10:30:00Z"
  }
}
```

### 2. Insert/Update Student IDH Data

**POST** `/api/backoffice/idh`

Creates or updates IDH data for a student.

#### Request Body

```typescript
interface IDHStudent {
  studentNumber: string;        // Required
  schoolId: string;             // Required
  sourceId: string;             // Required - OneRoster person ID
  primaryPhone: string;
  otherPhone: string;
  transportationType: string;
  emirate: string;
  area: string;
  street: string;
  houseBuilding: string;
  region: string;
  zone: string;
  plot: string;
  mainPlot: string;
  premises: string;
  latitude: string;
  longitude: string;
  attachment01: string;
  statusId: number;
  datetime: string;
}
```

#### Example Request

```bash
curl -X POST http://localhost:4200/api/backoffice/idh \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "studentNumber": "123456",
    "schoolId": "SCH-1001",
    "primaryPhone": "+971501234567",
    "otherPhone": "+971504444444",
    "transportationType": "Bus",
    "emirate": "Dubai",
    "area": "Jumeirah 2",
    "street": "Al Wasl Road",
    "houseBuilding": "Villa 15",
    "region": "Jumeirah",
    "zone": "Zone 7",
    "plot": "123",
    "mainPlot": "123-A",
    "premises": "Residential",
    "latitude": "25.2048",
    "longitude": "55.2708",
    "attachment01": "https://cdn.example.com/attachments/route-map.pdf",
    "statusId": 5,
    "sourceId": "SST-1-1-Pers-1687158",
    "datetime": "2025-10-25T12:00:00Z"
  }'
```

#### Example Response

```json
{
  "ok": true,
  "data": {
    "id": 1234,
    "sourceId": "SST-1-1-Pers-1687158",
    "message": "IDH data saved successfully"
  },
  "meta": {
    "sourceId": "SST-1-1-Pers-1687158",
    "insertedAt": "2025-10-28T10:35:00Z"
  }
}
```

## Error Responses

### 400 Bad Request

```json
{
  "error": "sourceId is required"
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

### 500 Internal Server Error

```json
{
  "ok": false,
  "error": "Upstream returned 500"
}
```

## Notes

- All requests require authentication via NextAuth session
- The PP API token is automatically managed with 50-minute TTL
- GET requests use `cache: 'no-store'` to ensure fresh data
- The `sourceId` field must match a valid OneRoster person ID
- Coordinates (latitude/longitude) should be in decimal degrees format
- The `statusId` field indicates the current status of the IDH record
