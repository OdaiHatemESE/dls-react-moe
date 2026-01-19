# Address System Architecture Diagrams

**Visual Guide to the Address System Migration**

---

## 🏗️ System Architecture

### Before: Onwani API-Based System

```
┌─────────────────────────────────────────────────────────────────┐
│                      Browser (Client)                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Update Info Form Component                              │  │
│  │                                                          │  │
│  │  1. Select Municipality (ADM/AAM/WRM)                   │  │
│  │     └─> Triggers getDistricts()                         │  │
│  │                                                          │  │
│  │  2. Select District from dropdown                       │  │
│  │     └─> Triggers getCommunities()                       │  │
│  │                                                          │  │
│  │  3. Select Community from dropdown                      │  │
│  │     └─> Triggers getPlotNumbers()                       │  │
│  │                                                          │  │
│  │  4. Select Plot from list                               │  │
│  │     └─> Optionally getGisIds()                          │  │
│  └────────────┬─────────────────────────────────────────────┘  │
│               │                                                 │
│               │ Uses lib/onwani-client.ts                      │
│               ▼                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Onwani Client Functions                                 │  │
│  │  • getDistricts(municipality)                           │  │
│  │  • getCommunities(municipality, district)               │  │
│  │  • getPlotNumbers(municipality, district, community)    │  │
│  │  • getGisIds(gisid)                                     │  │
│  └────────────┬─────────────────────────────────────────────┘  │
└───────────────┼──────────────────────────────────────────────────┘
                │
                │ HTTPS (External Network)
                │ 500-2000ms per call
                │ Multiple sequential calls
                ▼
┌─────────────────────────────────────────────────────────────────┐
│           Onwani Public API (External Service)                  │
│           https://onwani.abudhabi.ae/                           │
│                                                                 │
│  • GET /tamm/api/getdistricts                                  │
│  • GET /tamm/api/getcommunities                                │
│  • GET /tamm/api/getplotnumbers                                │
│  • GET /onwaniapi/api/gisid                                    │
└─────────────────────────────────────────────────────────────────┘

Issues:
❌ Multiple sequential API calls (slow)
❌ External dependency (reliability)
❌ Rate limiting concerns
❌ Network latency accumulates
❌ No offline capability
```

---

### After: Database-Backed System

```
┌─────────────────────────────────────────────────────────────────┐
│                      Browser (Client)                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Update Info Form Component                              │  │
│  │                                                          │  │
│  │  1. User enters/selects address                         │  │
│  │     GISID captured in:                                  │  │
│  │     • mainPlotId (priority 1)                           │  │
│  │     • premisesPlotId (priority 2)                       │  │
│  │     • plotId (priority 3)                               │  │
│  │                                                          │  │
│  │  2. User clicks Preview                                 │  │
│  │     └─> Triggers ManhalCode fetch                       │  │
│  └────────────┬─────────────────────────────────────────────┘  │
│               │                                                 │
│               │ fetch('/api/db/plots?filter={gisid}')          │
│               ▼                                                 │
└───────────────┼──────────────────────────────────────────────────┘
                │
                │ HTTP (Internal Network)
                │ 50-200ms single call
                ▼
┌─────────────────────────────────────────────────────────────────┐
│              Next.js API Route (Server)                         │
│              app/api/db/plots/route.ts                          │
│                                                                 │
│  export async function GET(req: Request) {                     │
│    const filter = searchParams.get("filter");                  │
│                                                                 │
│    const rows = await prisma.$queryRaw(                        │
│      Prisma.sql`                                               │
│        SELECT TOP 1                                            │
│          SectorId, SectorCode,      -- Area                   │
│          RegionId, RegionCode,      -- Zone                   │
│          CityId, CityCode,          -- Region                 │
│          StateId, StateCode         -- Emirate                │
│        FROM AuhAddresses                                       │
│        WHERE PlotId LIKE '%' + ${filter}                       │
│           OR PlotNumber LIKE '%' + ${filter}                   │
│      `                                                         │
│    );                                                          │
│                                                                 │
│    return NextResponse.json({                                  │
│      data: { /* ManhalCodes */ }                              │
│    });                                                         │
│  }                                                             │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ Prisma ORM
             │ SQL Query
             ▼
┌─────────────────────────────────────────────────────────────────┐
│           SQL Server Database (Internal)                        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Table: AuhAddresses                                     │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │ Id  PlotId  PlotNumber  SectorCode  RegionCode  ...│ │  │
│  │  ├────────────────────────────────────────────────────┤ │  │
│  │  │ 1   100041  172         AREA123     ZONE567     ...│ │  │
│  │  │ 2   200042  173         AREA124     ZONE568     ...│ │  │
│  │  │ ... ...     ...         ...         ...         ...│ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  Indexes:                                                │  │
│  │  • IX_AuhAddresses_PlotId                               │  │
│  │  • IX_AuhAddresses_PlotNumber                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

Benefits:
✅ Single API call (fast)
✅ Internal service (reliable)
✅ No rate limiting
✅ Low latency (indexed queries)
✅ Can work offline with cache
```

---

## 📊 Data Flow Comparison

### Old System: Sequential API Calls

```
Time: 0ms
┌────────────────────────┐
│ User selects           │
│ Municipality: AAM      │
└───────────┬────────────┘
            │
Time: 50ms  ▼
┌────────────────────────┐
│ API Call 1:            │
│ getDistricts('AAM')    │
│ Latency: 600ms         │
└───────────┬────────────┘
            │
Time: 650ms ▼
┌────────────────────────┐
│ Display districts      │
│ User selects:          │
│ District: Al Bateen    │
└───────────┬────────────┘
            │
Time: 700ms ▼
┌────────────────────────┐
│ API Call 2:            │
│ getCommunities()       │
│ Latency: 800ms         │
└───────────┬────────────┘
            │
Time: 1500ms▼
┌────────────────────────┐
│ Display communities    │
│ User selects:          │
│ Community: Central     │
└───────────┬────────────┘
            │
Time: 1550ms▼
┌────────────────────────┐
│ API Call 3:            │
│ getPlotNumbers()       │
│ Latency: 1200ms        │
└───────────┬────────────┘
            │
Time: 2750ms▼
┌────────────────────────┐
│ Display plots          │
│ User selects plot      │
└───────────┬────────────┘
            │
Time: 2800ms▼
┌────────────────────────┐
│ ✅ Address Complete    │
│ Total: ~2.8 seconds    │
└────────────────────────┘
```

### New System: Single Lookup

```
Time: 0ms
┌────────────────────────┐
│ User enters address    │
│ GISID: 100041172       │
└───────────┬────────────┘
            │
Time: 50ms  ▼
┌────────────────────────┐
│ User clicks Preview    │
└───────────┬────────────┘
            │
Time: 60ms  ▼
┌────────────────────────┐
│ API Call:              │
│ /api/db/plots          │
│ Latency: 120ms         │
└───────────┬────────────┘
            │
Time: 180ms ▼
┌────────────────────────┐
│ ✅ Address Complete    │
│ with all ManhalCodes   │
│ Total: ~0.18 seconds   │
└────────────────────────┘

Speed Improvement: 15x faster! 🚀
```

---

## 🗄️ Database Schema Visualization

### AuhAddresses Table Structure

```
┌───────────────────────────────────────────────────────────────────┐
│                        AuhAddresses                                │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Primary Key:                                                      │
│  ├─ Id (INT, AUTO INCREMENT)                                      │
│                                                                    │
│  Emirate Level (State):                                           │
│  ├─ StateId (INT) ──────────────┐                                │
│  ├─ StateCode (NVARCHAR) ───────┼─→ Emirate ManhalCode           │
│  ├─ StateNameEn (NVARCHAR)      │                                │
│  └─ StateNameAr (NVARCHAR)      │                                │
│                                  │                                │
│  Region Level (City):            │                                │
│  ├─ CityId (INT) ───────────────┼─────┐                          │
│  ├─ CityCode (NVARCHAR) ────────┼─────┼─→ Region ManhalCode      │
│  ├─ CityNameEn (NVARCHAR)       │     │                          │
│  └─ CityNameAr (NVARCHAR)       │     │                          │
│                                  │     │                          │
│  Zone Level (Region):            │     │                          │
│  ├─ RegionId (INT) ─────────────┼─────┼──────┐                   │
│  ├─ RegionCode (NVARCHAR) ──────┼─────┼──────┼─→ Zone ManhalCode │
│  ├─ RegionNameEn (NVARCHAR)     │     │      │                   │
│  └─ RegionNameAr (NVARCHAR)     │     │      │                   │
│                                  │     │      │                   │
│  Area Level (Sector):            │     │      │                   │
│  ├─ SectorId (INT) ─────────────┼─────┼──────┼─────┐             │
│  ├─ SectorCode (NVARCHAR) ──────┼─────┼──────┼─────┼─→ Area Code │
│  ├─ SectorNameEn (NVARCHAR)     │     │      │     │             │
│  └─ SectorNameAr (NVARCHAR)     │     │      │     │             │
│                                  │     │      │     │             │
│  Plot Information:               │     │      │     │             │
│  ├─ RoadNumber (INT)             │     │      │     │             │
│  ├─ PlotNumber (NVARCHAR) [IDX]◄┼─────┼──────┼─────┼─ SEARCHABLE │
│  ├─ PlotId (NVARCHAR) [IDX] ◄───┼─────┼──────┼─────┼─ SEARCHABLE │
│  ├─ BuildingNumber (NVARCHAR)    │     │      │     │   (GISID)   │
│  ├─ StreetName (NVARCHAR)        │     │      │     │             │
│  └─ PostalCode (NVARCHAR)        │     │      │     │             │
│                                   │     │      │     │             │
│  Geographic:                      │     │      │     │             │
│  ├─ Latitude (NVARCHAR)           │     │      │     │             │
│  ├─ Longitude (NVARCHAR)          │     │      │     │             │
│  └─ ValidAddressId (INT)          │     │      │     │             │
│                                    │     │      │     │             │
│  Status:                           │     │      │     │             │
│  └─ IsActive (BIT)                 │     │      │     │             │
│                                    │     │      │     │             │
│  Hierarchy: State ─────────────────┘     │      │     │             │
│                └─> City ──────────────────┘      │     │             │
│                     └─> Region ───────────────────┘     │             │
│                          └─> Sector ─────────────────────┘             │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🔄 ManhalCode Flow

### How ManhalCodes are Fetched and Used

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: User Interaction                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Parent fills Update Info form                        │   │
│  │ • Enters address details                            │   │
│  │ • GISID captured (mainPlotId/premisesPlotId/plotId) │   │
│  │ • Clicks "Preview" button                           │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 2: Validation & Check                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ System checks:                                       │   │
│  │ • Is emirate Abu Dhabi? ─────────┐                  │   │
│  │ • Does GISID exist? ──────────┐  │                  │   │
│  │                               │  │                  │   │
│  │ If NO to either ───> Skip     │  │                  │   │
│  │ If YES to both ───> Continue  │  │                  │   │
│  └───────────────────────────────┼──┼──────────────────┘   │
└────────────────────────────────┬─┼──┼──────────────────────┘
                                 │ │  │
                        Priority:│ │  │
                     ┌───────────┘ │  │
                     ▼              │  │
            mainPlotId exists?      │  │
                     │              │  │
                     NO             │  │
                     │              │  │
                     ├──────────────┘  │
                     ▼                 │
            premisesPlotId exists?     │
                     │                 │
                     NO                │
                     │                 │
                     ├─────────────────┘
                     ▼
            plotId exists?
                     │
                     YES
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 3: API Call                                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ setIsFetchingManhalCodes(true)                       │   │
│  │ fetch(`/api/db/plots?filter=${gisid}`)              │   │
│  │                                                      │   │
│  │ Request:                                             │   │
│  │ GET /api/db/plots?filter=100041172                  │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 4: Database Query                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ SELECT TOP 1                                         │   │
│  │   SectorId, SectorCode,    -- Area                  │   │
│  │   RegionId, RegionCode,    -- Zone                  │   │
│  │   CityId, CityCode,        -- Region                │   │
│  │   StateId, StateCode       -- Emirate               │   │
│  │ FROM AuhAddresses                                    │   │
│  │ WHERE PlotId LIKE '%100041172'                       │   │
│  │    OR PlotNumber LIKE '%100041172'                   │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 5: Response Processing                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Response:                                            │   │
│  │ {                                                    │   │
│  │   data: {                                            │   │
│  │     areaId: 1234,                                    │   │
│  │     areaManhalCode: "AREA123", ◄────┐               │   │
│  │     zoneId: 567,                    │               │   │
│  │     zoneManhalCode: "ZONE567", ◄────┼───┐           │   │
│  │     regionId: 89,                   │   │           │   │
│  │     regionManhalCode: "REG89", ◄────┼───┼───┐       │   │
│  │     emirateId: 1,                   │   │   │       │   │
│  │     emirateManhalCode: "EMI1" ◄─────┼───┼───┼───┐   │   │
│  │   }                                 │   │   │   │   │   │
│  │ }                                   │   │   │   │   │   │
│  └─────────────────────────────────────┼───┼───┼───┼───┘   │
└─────────────────────────────────────────┼───┼───┼───┼───────┘
                                          │   │   │   │
                                          ▼   ▼   ▼   ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 6: Address Enrichment                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ enrichedAddress = {                                  │   │
│  │   ...newAddress,  // Original address fields        │   │
│  │   emirateManhalCode: "EMI1",  ◄──── For IDH API     │   │
│  │   regionManhalCode: "REG89",  ◄──── For IDH API     │   │
│  │   zoneManhalCode: "ZONE567",  ◄──── For IDH API     │   │
│  │   areaManhalCode: "AREA123"   ◄──── For IDH API     │   │
│  │ }                                                    │   │
│  │ setIsFetchingManhalCodes(false)                      │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 7: Preview & Submission                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ • Show enriched address in preview modal             │   │
│  │ • Parent confirms                                    │   │
│  │ • Submit to IDH API with ManhalCodes                 │   │
│  │ • IDH can properly route using ManhalCodes           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 File Dependency Graph

```
Update Info Page
app/child/[id]/update-info/page.tsx
         │
         ├─ Imports & Uses
         │
         ▼
┌────────────────────┐
│  Client fetches:   │
│  /api/db/plots     │
└───────┬────────────┘
        │
        ▼
API Route Handler
app/api/db/plots/route.ts
        │
        ├─ Imports
        │
        ├─────────────────┬──────────────────┐
        │                 │                  │
        ▼                 ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌────────────────┐
│ Prisma       │  │ NextResponse │  │ Prisma.sql     │
│ from         │  │ from         │  │ (Raw Query)    │
│ lib/prisma   │  │ next/server  │  └────────────────┘
└──────┬───────┘  └──────────────┘
       │
       │ Uses
       │
       ▼
Prisma Client
lib/prisma.ts
       │
       ├─ Configured by
       │
       ▼
Prisma Schema
prisma/student-registration/schema.prisma
       │
       ├─ Defines
       │
       ▼
┌────────────────────────┐
│  model AuhAddresses {  │
│    Id, PlotId,         │
│    SectorCode,         │
│    RegionCode,         │
│    CityCode,           │
│    StateCode,          │
│    ...                 │
│  }                     │
└────────┬───────────────┘
         │
         │ Maps to
         │
         ▼
Database Table
SQL Server: AuhAddresses
```

---

## 🔍 Search Strategy Visualization

### How GISID Lookup Works

```
Input: filter = "100041172"

┌─────────────────────────────────────────────────┐
│  Query Pattern: LIKE '%100041172'               │
│                                                 │
│  Matches any row where:                         │
│  • PlotId ends with "100041172"                 │
│  • PlotNumber ends with "100041172"             │
└─────────────────────────────────────────────────┘

Database Scan:
┌─────────┬────────────┬─────────────┬──────────────┐
│   Id    │  PlotId    │ PlotNumber  │ Match?       │
├─────────┼────────────┼─────────────┼──────────────┤
│  1001   │ 100041170  │ 170         │ ❌ No        │
│  1002   │ 100041171  │ 171         │ ❌ No        │
│  1003   │ 100041172  │ 172         │ ✅ YES! ◄──┐ │
│  1004   │ 100041173  │ 173         │ ❌ No     │ │
│  1005   │ 200041172  │ 41172       │ ✅ YES! ◄─┤ │
└─────────┴────────────┴─────────────┴───────────┼─┘
                                                  │
Return: TOP 1 ────────────────────────────────────┘
(First match)

Result:
┌───────────────────────────────────────────────┐
│ Row 1003:                                     │
│ SectorCode:  "AREA123"    → areaManhalCode    │
│ RegionCode:  "ZONE567"    → zoneManhalCode    │
│ CityCode:    "REG89"      → regionManhalCode  │
│ StateCode:   "EMI1"       → emirateManhalCode │
└───────────────────────────────────────────────┘
```

---

## ⚡ Performance Comparison Visual

```
Old System (Onwani API):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 2800ms
│        │        │            │
Call 1   Call 2   Call 3       Complete
(600ms)  (800ms)  (1200ms)     

New System (Database):
━━━━ 120ms
│    │
Call Complete

Speed Improvement: 23x faster! 🚀
```

---

## 🎯 Error Handling Flow

```
┌──────────────────────────────┐
│ User clicks Preview          │
└─────────────┬────────────────┘
              │
              ▼
┌──────────────────────────────┐
│ Check: Is Abu Dhabi?         │
├──────────────┬───────────────┤
│ NO           │ YES           │
▼              ▼               
Skip           Continue        
              │
              ▼
┌──────────────────────────────┐
│ Check: GISID exists?         │
├──────────────┬───────────────┤
│ NO           │ YES           │
▼              ▼               
Skip           Continue        
              │
              ▼
┌──────────────────────────────┐
│ try {                        │
│   fetch /api/db/plots        │
│ }                            │
└─────────────┬────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
┌────────┐         ┌────────┐
│Success │         │ Error  │
└───┬────┘         └───┬────┘
    │                  │
    │                  ▼
    │         ┌──────────────────┐
    │         │ console.warn()   │
    │         │ Continue without │
    │         │ ManhalCodes      │
    │         └────────┬─────────┘
    │                  │
    ├──────────────────┘
    │
    ▼
┌──────────────────────────────┐
│ Show preview                 │
│ (with or without codes)      │
└──────────────────────────────┘

Key: System never breaks user flow
     Missing ManhalCodes = Warning only
```

---

## 📊 Data Hierarchy Visual

```
Emirate (State)
    │
    ├─ StateId: 1
    ├─ StateCode: "EMI1" ◄─── Emirate ManhalCode
    ├─ StateNameEn: "Abu Dhabi"
    └─ StateNameAr: "أبوظبي"
         │
         ├─ Region (City)
         │     │
         │     ├─ CityId: 89
         │     ├─ CityCode: "REG89" ◄─── Region ManhalCode
         │     ├─ CityNameEn: "Al Ain"
         │     └─ CityNameAr: "العين"
         │          │
         │          ├─ Zone (Region)
         │          │     │
         │          │     ├─ RegionId: 567
         │          │     ├─ RegionCode: "ZONE567" ◄─── Zone ManhalCode
         │          │     ├─ RegionNameEn: "Central"
         │          │     └─ RegionNameAr: "المركزي"
         │          │          │
         │          │          └─ Area (Sector)
         │          │                │
         │          │                ├─ SectorId: 1234
         │          │                ├─ SectorCode: "AREA123" ◄─── Area ManhalCode
         │          │                ├─ SectorNameEn: "Al Jimi"
         │          │                ├─ SectorNameAr: "الجيمي"
         │          │                │
         │          │                └─ Plot
         │          │                      │
         │          │                      ├─ PlotId: "100041172" (GISID)
         │          │                      ├─ PlotNumber: "172"
         │          │                      ├─ RoadNumber: 45
         │          │                      ├─ BuildingNumber: "12"
         │          │                      ├─ Latitude: "24.4539"
         │          │                      └─ Longitude: "54.3773"
```

All 4 ManhalCodes fetched in single query! ⚡

---

**See Also:**
- [Complete Migration Guide](./features/ADDRESS_SYSTEM_MIGRATION.md)
- [Old vs New Comparison](./ADDRESS_OLD_VS_NEW.md)
- [Quick Summary](./ADDRESS_UPDATE_SUMMARY.md)
