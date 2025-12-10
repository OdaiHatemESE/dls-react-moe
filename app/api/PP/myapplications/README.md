# My Applications API

This endpoint retrieves student application data from the Parent Portal backend.

## Endpoint

```
POST /api/PP/myapplications
```

## Request

### Headers
- `Content-Type: application/json`

### Body
```json
{
  "sourceIds": ["SST-1-1-Pers-28503", "SST-1-1-Pers-28535"]
}
```

**Parameters:**
- `sourceIds` (required): Array of one or more student source IDs (OneRoster sourcedIds)

## Response

### Success (200 OK)

```json
{
  "data": [
    {
      "id": 42,
      "school_ID": "SST-1-1-Site-633",
      "studentNumber": "2014007613",
      "primaryPhone": "0565222410",
      "otherPhone": "0504427287",
      "transportationType": "Car",
      "emirate": "ABU DHABI",
      "area": "Abu Dhabi",
      "street": "20a, غرب 10, البطين, أبوظبي",
      "houseBuilding": "",
      "region": "AL BATEEN",
      "zone": "W10",
      "plot": "20a",
      "mainPlot": "Plot_100041172",
      "premises": "",
      "latitude": "",
      "longitude": "",
      "attachment01": "",
      "stateID": null,
      "cityID": null,
      "regionID": null,
      "sectorID": null,
      "status_ID": 1,
      "returnComment": null,
      "source_ID": "SST-1-1-Pers-28503",
      "datetime": "2025-12-09T11:35:33.693",
      "m95_Lookups": {
        "id": 1,
        "description": "قيد الإجراء",
        "keys": 1,
        "parent_ID": null,
        "listName": "Status",
        "m95_MAIN": [null]
      }
    }
  ]
}
```

### Error Responses

**400 Bad Request** - Invalid or missing sourceIds
```json
{
  "error": "sourceIds array is required and must not be empty"
}
```

**500 Internal Server Error** - Configuration or server error
```json
{
  "error": "PP_BASE_URL not configured"
}
```

**502 Bad Gateway** - Failed to authenticate with PP backend
```json
{
  "error": "Failed to obtain PP authentication token"
}
```

## Usage Example

### JavaScript/TypeScript
```typescript
const response = await fetch('/api/PP/myapplications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sourceIds: ['SST-1-1-Pers-28503', 'SST-1-1-Pers-28535']
  })
});

const result = await response.json();
console.log('Applications:', result.data);
```

### cURL
```bash
curl -X POST http://localhost:4200/api/PP/myapplications \
  -H "Content-Type: application/json" \
  -d '{"sourceIds": ["SST-1-1-Pers-28503"]}'
```

## Backend Integration

This endpoint proxies requests to the Parent Portal backend:
- **Upstream endpoint**: `PP_BASE_URL/Idh/applications`
- **Authentication**: Automatically obtains and caches Bearer token from PP backend
- **Method**: POST
- **Timeout**: 30 seconds

## Environment Variables

Required environment variables:
- `PP_BASE_URL`: Base URL of the Parent Portal backend
- `PP_CLIENT_ID`: Client ID for PP authentication
- `PP_CLIENT_SECRET`: Client secret for PP authentication

## Notes

- The endpoint automatically handles authentication with the PP backend
- Access tokens are cached to minimize authentication requests
- Returns application data with status information and address details
- Each application includes a nested `m95_Lookups` object with status description
