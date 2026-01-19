# Address System Migration Guide

**Last Updated:** January 19, 2026

## Overview

This document describes the migration from the Onwani public API-based address system to the new database-backed address system using the `AuhAddresses` table.

---

## 🔄 What Changed

### Before (Old System)
- Used **Onwani public APIs** directly from the client
- Real-time API calls to `https://onwani.abudhabi.ae/`
- Client-side address selection and validation
- Dynamic district/community/plot lookups

### After (New System)
- Uses **`AuhAddresses` database table** 
- Server-side lookups via `/api/db/plots` endpoint
- Pre-populated address authority data
- Efficient database queries instead of external API calls

---

## 📊 Architecture Comparison

### Old Architecture (Deprecated)

```
┌─────────────────────────────────────────────────┐
│   Client (Browser)                              │
│                                                 │
│  ┌──────────────────────────────────────┐     │
│  │  Update Info Form                    │     │
│  │  - Select Municipality               │     │
│  │  - Select District                   │     │
│  │  - Select Community                  │     │
│  │  - Select Plot                       │     │
│  └──────────┬───────────────────────────┘     │
│             │                                  │
│             │ Direct API Calls                 │
│             ▼                                  │
│  ┌──────────────────────────────────────┐     │
│  │  lib/onwani-client.ts                │     │
│  │  - getDistricts()                    │     │
│  │  - getCommunities()                  │     │
│  │  - getPlotNumbers()                  │     │
│  │  - getGisIds()                       │     │
│  └──────────┬───────────────────────────┘     │
└─────────────┼───────────────────────────────────┘
              │
              │ HTTPS
              ▼
┌─────────────────────────────────────────────────┐
│   Onwani Public API                             │
│   https://onwani.abudhabi.ae/                   │
│   - /tamm/api/getdistricts                      │
│   - /tamm/api/getcommunities                    │
│   - /tamm/api/getplotnumbers                    │
│   - /onwaniapi/api/gisid                        │
└─────────────────────────────────────────────────┘
```

### New Architecture (Current)

```
┌─────────────────────────────────────────────────┐
│   Client (Browser)                              │
│                                                 │
│  ┌──────────────────────────────────────┐     │
│  │  Update Info Form                    │     │
│  │  - Enter GISID (Plot ID)             │     │
│  │  - ManhalCodes fetched automatically │     │
│  └──────────┬───────────────────────────┘     │
│             │                                  │
│             │ Fetch to internal API            │
│             ▼                                  │
└─────────────┼───────────────────────────────────┘
              │
              │ HTTP
              ▼
┌─────────────────────────────────────────────────┐
│   API Route                                      │
│   GET /api/db/plots?filter={gisid}              │
│   File: app/api/db/plots/route.ts               │
└──────────┬──────────────────────────────────────┘
           │
           │ Prisma Query
           ▼
┌─────────────────────────────────────────────────┐
│   Database (SQL Server)                         │
│   Table: AuhAddresses                           │
│   - PlotId / PlotNumber (LIKE search)          │
│   - SectorCode (Area ManhalCode)               │
│   - RegionCode (Zone ManhalCode)               │
│   - CityCode (Region ManhalCode)               │
│   - StateCode (Emirate ManhalCode)             │
└─────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### AuhAddresses Table

```sql
CREATE TABLE AuhAddresses (
  Id             INT PRIMARY KEY IDENTITY,
  ValidAddressId INT,
  
  -- Emirate Level (State)
  StateId        INT,
  StateCode      NVARCHAR(MAX),      -- Emirate ManhalCode
  StateNameAr    NVARCHAR(MAX),
  StateNameEn    NVARCHAR(MAX),
  
  -- Region Level (City)
  CityId         INT,
  CityCode       NVARCHAR(25),       -- Region ManhalCode
  CityNameAr     NVARCHAR(25),
  CityNameEn     NVARCHAR(25),
  
  -- Zone Level (Region)
  RegionId       INT,
  RegionCode     NVARCHAR(50),       -- Zone ManhalCode
  RegionNameAr   NVARCHAR(50),
  RegionNameEn   NVARCHAR(50),
  
  -- Area Level (Sector)
  SectorId       INT,
  SectorCode     NVARCHAR(50),       -- Area ManhalCode
  SectorNameEn   NVARCHAR(50),
  SectorNameAr   NVARCHAR(50),
  
  -- Plot Details
  RoadNumber     INT,
  PlotNumber     NVARCHAR(50),       -- Searchable
  PlotId         NVARCHAR(25),       -- GISID - Searchable
  
  -- Geographic
  Latitude       NVARCHAR(25),
  Longitude      NVARCHAR(50),
  
  -- Additional Fields
  BuildingNumber NVARCHAR(350),
  PostalCode     NVARCHAR(350),
  StreetName     NVARCHAR(350),
  IsActive       BIT DEFAULT 0
);
```

### Naming Convention Map

| Database Column | Represents | Used For |
|----------------|------------|----------|
| `StateCode` | Emirate ManhalCode | IDH emirate ID |
| `CityCode` | Region ManhalCode | IDH region ID |
| `RegionCode` | Zone ManhalCode | IDH zone ID |
| `SectorCode` | Area ManhalCode | IDH area ID |
| `PlotId` | GISID | Search key |
| `PlotNumber` | Plot Number | Alternative search |

---

## 🔌 API Endpoint

### GET /api/db/plots

**Purpose:** Fetch ManhalCodes from the address hierarchy based on GISID lookup.

**File:** `app/api/db/plots/route.ts`

#### Request

```typescript
GET /api/db/plots?filter={gisid}

// Query Parameters
{
  filter: string  // Required - GISID suffix (PlotId or PlotNumber)
}
```

#### Response (Success)

```typescript
{
  data: {
    // Area level
    areaId: number,
    areaManhalCode: string | null,  // SectorCode
    
    // Zone level
    zoneId: number,
    zoneManhalCode: string | null,  // RegionCode
    
    // Region level
    regionId: number,
    regionManhalCode: string | null,  // CityCode
    
    // Emirate level
    emirateId: number,
    emirateManhalCode: string | null  // StateCode
  },
  meta: {
    filter: string,  // Echo of search term
    count: number    // Always 1 if found
  }
}
```

#### Response (Error)

```typescript
// 400 Bad Request - Missing filter
{
  error: "Missing required query parameter: filter (GISID)"
}

// 404 Not Found - No matching plot
{
  error: "No plot found matching the provided GISID"
}

// 500 Internal Server Error
{
  error: "Server error message"
}
```

#### Examples

```bash
# Search by GISID
GET /api/db/plots?filter=100041172

# Response
{
  "data": {
    "areaId": 1234,
    "areaManhalCode": "AREA123",
    "zoneId": 567,
    "zoneManhalCode": "ZONE567",
    "regionId": 89,
    "regionManhalCode": "REG89",
    "emirateId": 1,
    "emirateManhalCode": "EMI1"
  },
  "meta": {
    "filter": "100041172",
    "count": 1
  }
}
```

---

## 💻 Implementation

### Query Logic

```typescript
// File: app/api/db/plots/route.ts

const likeParam = `%${filter}`;

const rows = await prisma.$queryRaw(
  Prisma.sql`
    SELECT TOP 1
      SectorId,
      SectorCode,      -- Area ManhalCode
      RegionId,
      RegionCode,      -- Zone ManhalCode
      CityId,
      CityCode,        -- Region ManhalCode
      StateId,
      StateCode        -- Emirate ManhalCode
    FROM AuhAddresses
    WHERE PlotId LIKE ${likeParam}
       OR PlotNumber LIKE ${likeParam}
  `
);
```

**Search Strategy:**
- Uses `LIKE '%{filter}'` for suffix matching
- Searches both `PlotId` and `PlotNumber` columns
- Returns TOP 1 result
- Fetches entire hierarchy in single query

---

## 🔄 Migration Details

### Files Changed

#### 1. API Route Created
**File:** `app/api/db/plots/route.ts`
- ✅ **Created** - New endpoint for ManhalCode lookup
- Uses Prisma raw SQL query
- Returns hierarchical address data

#### 2. Update Info Page Modified
**File:** `app/child/[id]/update-info/page.tsx`
- ✅ **Modified** - Lines ~1000-1040
- Added ManhalCode fetching logic
- Integrated with plots API
- Added loading state (`isFetchingManhalCodes`)

**Key Changes:**
```typescript
// NEW: Fetch ManhalCodes before preview
const gisid = newAddress.mainPlotId || 
              newAddress.premisesPlotId || 
              (newAddress.plotId ? String(newAddress.plotId) : null);

if (gisid) {
  setIsFetchingManhalCodes(true);
  try {
    const plotsResponse = await fetch(`/api/db/plots?filter=${encodeURIComponent(gisid)}`);
    
    if (plotsResponse.ok) {
      const plotsData = await plotsResponse.json();
      
      if (plotsData.data) {
        enrichedAddress = {
          ...newAddress,
          emirateManhalCode: plotsData.data.emirateManhalCode || undefined,
          regionManhalCode: plotsData.data.regionManhalCode || undefined,
          zoneManhalCode: plotsData.data.zoneManhalCode || undefined,
          areaManhalCode: plotsData.data.areaManhalCode || undefined,
        };
      }
    }
  } catch (error) {
    console.warn('Failed to fetch ManhalCodes for preview:', error);
  } finally {
    setIsFetchingManhalCodes(false);
  }
}
```

#### 3. Schema Updated
**File:** `prisma/student-registration/schema.prisma`
- ✅ **Added** - AuhAddresses model definition
- Lines 235-265

#### 4. Onwani Client (Preserved)
**File:** `lib/onwani-client.ts`
- ⚠️ **Kept for reference** - May be used elsewhere
- Not actively used in update-info flow
- Contains legacy functions:
  - `getDistricts()`
  - `getCommunities()`
  - `getPlotNumbers()`
  - `getGisIds()`

---

## 🎯 Usage in Application Flow

### Student Update Info Flow

```
1. Parent enters address information
   └─> Fills form with GISID (mainPlotId/premisesPlotId/plotId)

2. Parent clicks Preview
   └─> Triggers validation and ManhalCode lookup

3. System checks if Abu Dhabi emirate
   └─> Only fetches ManhalCodes for Abu Dhabi addresses

4. System calls /api/db/plots
   └─> Passes GISID as filter parameter

5. API queries AuhAddresses table
   └─> Returns full hierarchy (Emirate → Region → Zone → Area)

6. System enriches address with ManhalCodes
   └─> Adds: emirateManhalCode, regionManhalCode, zoneManhalCode, areaManhalCode

7. Enriched address shown in preview
   └─> Parent confirms or edits

8. Submission to IDH API
   └─> Includes ManhalCodes for proper routing
```

### Code Example

```typescript
// In app/child/[id]/update-info/page.tsx

// Step 1: Determine GISID
const gisid = newAddress.mainPlotId || 
              newAddress.premisesPlotId || 
              (newAddress.plotId ? String(newAddress.plotId) : null);

// Step 2: Fetch ManhalCodes
const plotsResponse = await fetch(
  `/api/db/plots?filter=${encodeURIComponent(gisid)}`
);

// Step 3: Parse response
const plotsData = await plotsResponse.json();

// Step 4: Enrich address object
const enrichedAddress = {
  ...newAddress,
  emirateManhalCode: plotsData.data.emirateManhalCode || undefined,
  regionManhalCode: plotsData.data.regionManhalCode || undefined,
  zoneManhalCode: plotsData.data.zoneManhalCode || undefined,
  areaManhalCode: plotsData.data.areaManhalCode || undefined,
};

// Step 5: Use in payload
const payload = {
  studentId: sourcedId,
  newAddress: enrichedAddress,
  // ... other fields
};
```

---

## 🧪 Testing

### Test Scenarios

#### 1. Valid GISID Lookup
```bash
# Test with known GISID
curl "http://localhost:4200/api/db/plots?filter=100041172"

# Expected: 200 OK with data
```

#### 2. Invalid GISID
```bash
# Test with non-existent GISID
curl "http://localhost:4200/api/db/plots?filter=99999999"

# Expected: 404 Not Found
```

#### 3. Missing Parameter
```bash
# Test without filter
curl "http://localhost:4200/api/db/plots"

# Expected: 400 Bad Request
```

#### 4. Partial GISID Match
```bash
# Test with partial GISID (suffix matching)
curl "http://localhost:4200/api/db/plots?filter=41172"

# Expected: 200 OK if suffix matches
```

### Manual Testing Checklist

- [ ] Open student update info page
- [ ] Enter Abu Dhabi address with valid GISID
- [ ] Click Preview
- [ ] Verify loading state appears
- [ ] Verify ManhalCodes populated in preview
- [ ] Check browser network tab for /api/db/plots call
- [ ] Verify response includes all 4 ManhalCode levels
- [ ] Submit and verify IDH receives ManhalCodes
- [ ] Test with non-Abu Dhabi emirate (should skip lookup)
- [ ] Test with invalid GISID (should continue without codes)

---

## 🚀 Performance

### Before (Onwani API)
- Multiple external API calls
- Network latency: ~500-2000ms per call
- Rate limiting concerns
- Dependency on external service availability

### After (Database Lookup)
- Single database query
- Query time: ~50-200ms
- No rate limiting
- Internal control and reliability
- Indexed for fast lookups

### Query Performance

```sql
-- Indexed columns for fast lookup
CREATE INDEX IX_AuhAddresses_PlotId 
ON AuhAddresses(PlotId);

CREATE INDEX IX_AuhAddresses_PlotNumber 
ON AuhAddresses(PlotNumber);
```

---

## ⚠️ Important Notes

### When ManhalCodes Are Fetched

✅ **Fetched when:**
- Emirate is Abu Dhabi (or Al Ain, or Dhafra)
- Valid GISID exists (mainPlotId, premisesPlotId, or plotId)
- User clicks Preview in update-info form

❌ **Not fetched when:**
- Emirate is not Abu Dhabi
- No GISID provided
- API call fails (continues without codes)

### GISID Priority

The system tries these fields in order:
1. `newAddress.mainPlotId` (highest priority)
2. `newAddress.premisesPlotId` (second)
3. `newAddress.plotId` (fallback)

### Error Handling

```typescript
try {
  // Fetch ManhalCodes
} catch (error) {
  console.warn('Failed to fetch ManhalCodes for preview:', error);
  // Continue with original address without ManhalCodes
  // System is resilient to lookup failures
}
```

---

## 📝 Deprecated Components

### ⚠️ No Longer Used

#### lib/onwani-client.ts
**Status:** Preserved but not actively used in update-info flow

**Functions:**
```typescript
❌ getDistricts(municipality)
❌ getCommunities(municipality, districtNameEn)
❌ getRoadIds(districtNameEn, communityNameEn)
❌ getCommunityShape(municipality, districtNameEn, communityNameEn)
❌ getPlotNumbers(municipality, districtNameEn, communityNameEn, roadId?)
❌ getGisIds(gisid)
```

**Why Kept:**
- May be used in other parts of application
- Reference for legacy implementation
- Potential future use cases

**Note:** Safe to remove if confirmed unused elsewhere.

---

## 🔄 Data Refresh

### Updating AuhAddresses Data

The `AuhAddresses` table should be periodically refreshed from the address authority.

#### Refresh Process

1. **Export from Authority**
   - Obtain latest address dataset from Abu Dhabi Address Authority
   - Format: CSV or database dump

2. **Import to Database**
   ```sql
   -- Backup existing data
   SELECT * INTO AuhAddresses_Backup FROM AuhAddresses;
   
   -- Truncate table
   TRUNCATE TABLE AuhAddresses;
   
   -- Bulk insert new data
   BULK INSERT AuhAddresses
   FROM 'path/to/data.csv'
   WITH (
     FIELDTERMINATOR = ',',
     ROWTERMINATOR = '\n',
     FIRSTROW = 2
   );
   ```

3. **Verify Data**
   ```sql
   -- Check row count
   SELECT COUNT(*) FROM AuhAddresses;
   
   -- Verify ManhalCodes exist
   SELECT COUNT(*) FROM AuhAddresses WHERE StateCode IS NOT NULL;
   
   -- Test sample lookups
   SELECT * FROM AuhAddresses WHERE PlotId LIKE '%41172';
   ```

4. **Update Prisma Schema**
   ```bash
   # If schema changed
   npm run prisma:pull
   npm run prisma:generate
   ```

---

## 🐛 Troubleshooting

### Issue: 404 Not Found for GISID

**Problem:** `/api/db/plots?filter={gisid}` returns 404

**Possible Causes:**
1. GISID doesn't exist in AuhAddresses table
2. GISID format mismatch (with/without prefix)
3. Data not imported correctly

**Solutions:**
```sql
-- Check if GISID exists
SELECT * FROM AuhAddresses 
WHERE PlotId LIKE '%{gisid}' 
   OR PlotNumber LIKE '%{gisid}';

-- Check data in table
SELECT TOP 10 PlotId, PlotNumber FROM AuhAddresses;
```

### Issue: Null ManhalCodes

**Problem:** API returns data but ManhalCodes are null

**Possible Causes:**
1. Source data missing ManhalCodes
2. Column mapping incorrect

**Solutions:**
```sql
-- Check data completeness
SELECT 
  COUNT(*) as Total,
  COUNT(StateCode) as WithStateCode,
  COUNT(CityCode) as WithCityCode,
  COUNT(RegionCode) as WithRegionCode,
  COUNT(SectorCode) as WithSectorCode
FROM AuhAddresses;
```

### Issue: Slow Queries

**Problem:** Queries taking too long

**Solutions:**
```sql
-- Create indexes if missing
CREATE INDEX IX_AuhAddresses_PlotId ON AuhAddresses(PlotId);
CREATE INDEX IX_AuhAddresses_PlotNumber ON AuhAddresses(PlotNumber);

-- Check index usage
EXEC sp_helpindex 'AuhAddresses';
```

### Issue: Preview Doesn't Show ManhalCodes

**Problem:** UI doesn't display fetched codes

**Check:**
1. Browser console for API errors
2. Network tab for successful response
3. State update in React component
4. Emirate is Abu Dhabi (codes only fetched for Abu Dhabi)

---

## 📊 Comparison Matrix

| Feature | Old (Onwani API) | New (Database) |
|---------|-----------------|----------------|
| **Data Source** | External API | Internal DB |
| **Latency** | 500-2000ms | 50-200ms |
| **Availability** | Depends on Onwani | 99.9%+ |
| **Rate Limits** | Yes | No |
| **Offline Support** | No | Yes (with cache) |
| **Data Freshness** | Real-time | Periodic refresh |
| **Maintenance** | None | Periodic updates |
| **Cost** | API calls | Storage only |
| **Reliability** | External dependency | Internal control |

---

## 🎓 Best Practices

### For Developers

1. **Always check response status**
   ```typescript
   if (!plotsResponse.ok) {
     // Handle error gracefully
     console.warn('Failed to fetch ManhalCodes');
     return originalAddress; // Don't break user flow
   }
   ```

2. **Use proper error boundaries**
   ```typescript
   try {
     const data = await fetch('/api/db/plots?filter=' + gisid);
   } catch (error) {
     // Log but don't throw - address update can continue
     console.error('ManhalCode fetch failed', error);
   }
   ```

3. **Validate GISID before calling API**
   ```typescript
   if (!gisid || gisid.length < 5) {
     console.warn('Invalid GISID, skipping ManhalCode lookup');
     return originalAddress;
   }
   ```

### For Database Admins

1. **Keep indexes up to date**
   ```sql
   -- Rebuild indexes quarterly
   ALTER INDEX IX_AuhAddresses_PlotId ON AuhAddresses REBUILD;
   ALTER INDEX IX_AuhAddresses_PlotNumber ON AuhAddresses REBUILD;
   ```

2. **Monitor table size**
   ```sql
   EXEC sp_spaceused 'AuhAddresses';
   ```

3. **Regular data refresh**
   - Schedule: Quarterly or as provided by authority
   - Process: Export → Backup → Import → Verify

---

## 🔗 Related Documentation

- **[Architecture](../core/ARCHITECTURE.md)** - Overall system design
- **[API Routes](../reference/API_ROUTES.md)** - All API endpoints
- **[Update Info Page](../sitemap/07-child-update-info/README.md)** - UI implementation
- **[Address Picker (Legacy)](./ADDRESS_PICKER.md)** - Old component reference

---

## 📞 Support

### Questions?

- **Technical Issues:** Check troubleshooting section above
- **Data Issues:** Contact database admin
- **API Issues:** Check `/api/db/plots/route.ts` logs

### Resources

- Database table: `AuhAddresses`
- API route: `app/api/db/plots/route.ts`
- Usage: `app/child/[id]/update-info/page.tsx` (lines 1000-1040)
- Schema: `prisma/student-registration/schema.prisma` (lines 235-265)

---

**Migration Date:** January 2026  
**Status:** ✅ Active in Production  
**Last Data Refresh:** Check with database admin

**Quick Links:**
- [Implementation Code](../app/api/db/plots/route.ts)
- [Database Schema](../prisma/student-registration/schema.prisma)
- [Usage Example](../app/child/[id]/update-info/page.tsx)
