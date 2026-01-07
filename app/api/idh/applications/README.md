# IDH Applications Endpoint

## Overview
This endpoint retrieves all Information Data Hub (IDH) applications from the Parent Portal API. It's designed for admin use to view all update information requests submitted by parents.

## Endpoint
```
GET /api/idh/applications
```

## Authentication
- **Required**: Yes (NextAuth session)
- **Type**: Session-based authentication

## Request

### Headers
```
Cookie: next-auth.session-token=<session-token>
```

### Query Parameters
None

## Response

### Success Response (200)
```json
{
  "ok": true,
  "data": [
    {
      "id": 62,
      "school_ID": "SST-1-1-Site-633",
      "studentNumber": "2014007613",
      "primaryPhone": "0504427287",
      "otherPhone": "0501181502",
      "transportationType": "Car",
      "emirate": "SHARJAH",
      "area": "أسيحل",
      "street": "1312312",
      "houseBuilding": "12313123",
      "region": "",
      "zone": "",
      "plot": "",
      "mainPlot": "",
      "premises": "",
      "latitude": "",
      "longitude": "",
      "attachment01": "92e973e3-121f-430e-bfeb-85a45a5207cf",
      "stateID": "AE.003",
      "cityID": "AE.003",
      "regionID": "AE.003.C013.0114",
      "createtime": null
    }
    // ... more applications
  ],
  "count": 100
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "ok": false,
  "error": "Unauthorized"
}
```

#### 500 Internal Server Error
```json
{
  "ok": false,
  "error": "PP_BASE_URL not configured"
}
```

#### 502 Bad Gateway
```json
{
  "ok": false,
  "error": "Failed to reach PP applications endpoint"
}
```

#### 504 Gateway Timeout
```json
{
  "ok": false,
  "error": "Timed out while fetching applications from PP API"
}
```

## Implementation Details

### Queue Management
- Uses `idhQueue` to manage concurrent requests and prevent rate limiting
- Priority level: 7 (higher priority for admin requests)
- Timeout: 20 seconds

### Token Exchange
- Automatically exchanges session for PP API token
- Token timeout: 8 seconds
- Token is cached and managed internally

### Response Normalization
- Handles both wrapped (`{ data: [...] }`) and direct array responses
- Returns empty array if no applications found
- Includes count of applications in response

## Usage Example

### Using fetch
```typescript
const response = await fetch('/api/idh/applications', {
  credentials: 'include',
});

const result = await response.json();

if (result.ok) {
  console.log(`Found ${result.count} applications`);
  result.data.forEach(app => {
    console.log(`Student: ${app.studentNumber}, School: ${app.school_ID}`);
  });
}
```

### Using SWR
```typescript
import useSWR from 'swr';
import { jsonFetcher } from '@/lib/swr';

function ApplicationsList() {
  const { data, error, isLoading } = useSWR('/api/idh/applications', jsonFetcher);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading applications</div>;
  if (!data?.ok) return <div>Failed to load</div>;

  return (
    <div>
      <h2>Total Applications: {data.count}</h2>
      {data.data.map(app => (
        <div key={app.id}>
          {app.studentNumber} - {app.school_ID}
        </div>
      ))}
    </div>
  );
}
```

## Related Endpoints
- `POST /api/parent/update-information-requests` - Create new update request
- `GET /api/parent/update-information-requests` - Get specific student request
- `PATCH /api/parent/update-information-requests` - Update existing request

## Environment Variables Required
- `PP_BASE_URL` - Parent Portal API base URL
- `NEXTAUTH_URL` or `PUBLIC_URL` - Internal API base URL for token exchange

## Monitoring
- All requests are tracked via `metricsTracker`
- Detailed logging for debugging and monitoring
- Queue metrics available via `idhQueue.getMetrics()`
