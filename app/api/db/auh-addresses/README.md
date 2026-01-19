# Abu Dhabi Addresses Hierarchy API

**Endpoint**: `GET /api/db/auh-addresses`

## Overview

Unified API for retrieving Abu Dhabi address hierarchy data from the `AuhAddresses` table. Returns distinct values for Emirates, Regions, Zones, or Areas with their ManhalCodes in a single, efficient call.

## Why This API?

Instead of having separate APIs querying different tables:
- ❌ `/api/db/emirates` → `Emirates` table
- ❌ `/api/db/regions` → `Regions` table  
- ❌ `/api/db/zones` → `Zones` table
- ❌ `/api/db/areas` → `Areas` table

We now have:
- ✅ `/api/db/auh-addresses` → `AuhAddresses` table (single source of truth for Abu Dhabi)

**Benefits**:
- All data in one table with ManhalCodes already included
- Faster queries with `DISTINCT` instead of joins
- Consistent data structure across all hierarchy levels
- Single API to maintain instead of four

## Query Parameters

### Required
- **`level`** (string): The hierarchy level to fetch
  - Values: `"emirate"` | `"region"` | `"zone"` | `"area"`

### Optional (depending on level)
- **`stateId`** (number): Required for `level=region` - Filter regions by emirate
- **`cityId`** (number): Required for `level=zone` - Filter zones by region  
- **`regionId`** (number): Required for `level=area` - Filter areas by zone

## Response Format

All responses follow the same structure:

```typescript
{
  data: Array<{
    id: number;           // StateId | CityId | RegionId | SectorId
    titleAr: string;      // Arabic name
    titleEn: string;      // English name
    manhalCode: string;   // StateCode | CityCode | RegionCode | SectorCode
  }>,
  meta: {
    level: string;        // "emirate" | "region" | "zone" | "area"
    count: number;        // Number of results
    stateId?: number;     // Included if level=region
    cityId?: number;      // Included if level=zone
    regionId?: number;    // Included if level=area
  }
}
```

## Examples

### 1. Get All Emirates
```bash
GET /api/db/auh-addresses?level=emirate
```

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "titleAr": "أبوظبي",
      "titleEn": "Abu Dhabi",
      "manhalCode": "AUH"
    }
  ],
  "meta": {
    "level": "emirate",
    "count": 1
  }
}
```

### 2. Get Regions by Emirate
```bash
GET /api/db/auh-addresses?level=region&stateId=1
```

**Response**:
```json
{
  "data": [
    {
      "id": 101,
      "titleAr": "أبوظبي",
      "titleEn": "Abu Dhabi",
      "manhalCode": "AUH-01"
    },
    {
      "id": 102,
      "titleAr": "العين",
      "titleEn": "Al Ain",
      "manhalCode": "AUH-02"
    }
  ],
  "meta": {
    "level": "region",
    "stateId": 1,
    "count": 2
  }
}
```

### 3. Get Zones by Region
```bash
GET /api/db/auh-addresses?level=zone&cityId=101
```

**Response**:
```json
{
  "data": [
    {
      "id": 1001,
      "titleAr": "المنطقة الشرقية",
      "titleEn": "Eastern Region",
      "manhalCode": "AUH-01-E"
    }
  ],
  "meta": {
    "level": "zone",
    "cityId": 101,
    "count": 1
  }
}
```

### 4. Get Areas by Zone
```bash
GET /api/db/auh-addresses?level=area&regionId=1001
```

**Response**:
```json
{
  "data": [
    {
      "id": 10001,
      "titleAr": "المنطقة الصناعية",
      "titleEn": "Industrial Area",
      "manhalCode": "AUH-01-E-IND"
    }
  ],
  "meta": {
    "level": "area",
    "regionId": 1001,
    "count": 1
  }
}
```

## Error Responses

### Missing Level Parameter
```json
{
  "error": "Missing required query parameter: level (emirate|region|zone|area)"
}
```
**Status**: 400

### Invalid Level Value
```json
{
  "error": "Invalid level parameter. Must be: emirate, region, zone, or area"
}
```
**Status**: 400

### Missing Filter Parameter
```json
{
  "error": "Missing required query parameter: stateId"
}
```
**Status**: 400

### Invalid ID Format
```json
{
  "error": "Invalid stateId"
}
```
**Status**: 400

## SQL Queries Used

### Emirates
```sql
SELECT DISTINCT StateId, StateNameAr, StateNameEn, StateCode
FROM AuhAddresses
WHERE IsActive = 1
ORDER BY StateNameEn ASC
```

### Regions
```sql
SELECT DISTINCT CityId, CityNameAr, CityNameEn, CityCode
FROM AuhAddresses
WHERE IsActive = 1 AND StateId = ?
ORDER BY CityNameEn ASC
```

### Zones
```sql
SELECT DISTINCT RegionId, RegionNameAr, RegionNameEn, RegionCode
FROM AuhAddresses
WHERE IsActive = 1 AND CityId = ?
ORDER BY RegionNameEn ASC
```

### Areas
```sql
SELECT DISTINCT SectorId, SectorNameAr, SectorNameEn, SectorCode
FROM AuhAddresses
WHERE IsActive = 1 AND RegionId = ?
ORDER BY SectorNameEn ASC
```

## Address Hierarchy Mapping

| Level | AuhAddresses Columns | ManhalCode | Used For |
|-------|---------------------|------------|----------|
| **Emirate** | StateId, StateNameAr, StateNameEn | StateCode | Top level (Abu Dhabi) |
| **Region** | CityId, CityNameAr, CityNameEn | CityCode | Second level (Abu Dhabi City, Al Ain, etc.) |
| **Zone** | RegionId, RegionNameAr, RegionNameEn | RegionCode | Third level (Districts) |
| **Area** | SectorId, SectorNameAr, SectorNameEn | SectorCode | Fourth level (Sectors) |

## Usage in Frontend

```typescript
// Get emirates
const emiratesRes = await fetch('/api/db/auh-addresses?level=emirate');
const { data: emirates } = await emiratesRes.json();

// Get regions for selected emirate
const regionsRes = await fetch(`/api/db/auh-addresses?level=region&stateId=${emirateId}`);
const { data: regions } = await regionsRes.json();

// Get zones for selected region
const zonesRes = await fetch(`/api/db/auh-addresses?level=zone&cityId=${regionId}`);
const { data: zones } = await zonesRes.json();

// Get areas for selected zone
const areasRes = await fetch(`/api/db/auh-addresses?level=area&regionId=${zoneId}`);
const { data: areas } = await areasRes.json();
```

## Performance Notes

- Uses `DISTINCT` to eliminate duplicates efficiently
- Filters by `IsActive = 1` to return only active records
- Results ordered by English name for consistent UX
- Single table access = faster than multi-table joins
- All queries use indexes on foreign key columns

## Migration Path

When updating existing code:

**Before** (old APIs):
```typescript
// Old: Multiple endpoints
const emirates = await fetch('/api/db/emirates');
const regions = await fetch(`/api/db/regions?emirateId=${id}`);
const zones = await fetch(`/api/db/zones?regionId=${id}`);
const areas = await fetch(`/api/db/areas?zoneId=${id}`);
```

**After** (new unified API):
```typescript
// New: Single endpoint with level parameter
const emirates = await fetch('/api/db/auh-addresses?level=emirate');
const regions = await fetch(`/api/db/auh-addresses?level=region&stateId=${id}`);
const zones = await fetch(`/api/db/auh-addresses?level=zone&cityId=${id}`);
const areas = await fetch(`/api/db/auh-addresses?level=area&regionId=${id}`);
```

## Related Documentation

- [AuhAddresses Schema](../../../prisma/student-registration/schema.prisma)
- [Address Update Flow](../../../docs/sitemap/07-child-update-info/README.md)
- [Onwani Integration](../../../app/components/Onwani/MyLandPicker.README.md)
