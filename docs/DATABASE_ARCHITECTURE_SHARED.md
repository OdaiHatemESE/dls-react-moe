# Parent Portal Database - Shared Architecture

**Database**: Parent Portal (SQL Server)  
**Shared Between**: .NET Backend + Next.js Frontend (Prisma)  
**Date**: December 11, 2025

---

## 🏗️ Architecture Overview

The Parent Portal database is **shared** between two applications:

```
┌─────────────────────────────────────────────────────────────┐
│                  SQL Server Database                         │
│                  (Parent Portal)                             │
│                  10.190.36.25:1433                          │
└─────────────────────────────────────────────────────────────┘
                          ▲          ▲
                          │          │
                ┌─────────┘          └─────────┐
                │                              │
    ┌───────────────────────┐    ┌────────────────────────┐
    │   .NET Backend API    │    │  Next.js Frontend      │
    │   (PP API)            │    │  (Prisma ORM)          │
    │                       │    │                        │
    │   - C#/ASP.NET        │    │  - TypeScript          │
    │   - Entity Framework  │    │  - Prisma Client       │
    │   - OneRoster         │    │  - React/Next.js       │
    │   - Business Logic    │    │  - Parent Portal UI    │
    └───────────────────────┘    └────────────────────────┘
```

---

## 📊 Database Tables - Ownership & Purpose

### **Tables Created by .NET (Original Schema)**

These tables were created by the .NET backend and are primarily managed by Entity Framework:

| Table Name | Purpose | .NET Access | Next.js Access |
|------------|---------|-------------|----------------|
| `UpdateInformationRequests` | Parent update requests | ✅ **Write** (primary) | ✅ Read (display) |
| `Student` | Student master data | ✅ **Write** (OneRoster sync) | ✅ Read (display) |
| `StudentAddress` | Student addresses | ✅ **Write** (sync) | ✅ Read (display) |
| `StudentContact` | Student contacts | ✅ **Write** (sync) | ✅ Read (display) |
| `StudentEnrollment` | Enrollment data | ✅ **Write** (sync) | ✅ Read (display) |
| `Parent` | Parent master data | ✅ **Write** (sync) | ✅ Read (display) |
| `User` | Legacy users | ✅ **Write** | ❌ Not used |

**Ownership**: .NET is the **source of truth** for these tables.

---

### **Tables Created by Next.js/Prisma (Admin & Config)**

These tables were added by the Next.js app for admin configuration:

| Table Name | Purpose | .NET Access | Next.js Access |
|------------|---------|-------------|----------------|
| `AdminUser` | Admin access control | ❌ Not used | ✅ **Write** (manage) |
| `UpdatePeriodConfig` | Update window config | ❌ Not used | ✅ **Write** (admin) |
| `StudentActionConfig` | Action configuration | ❌ Not used | ✅ **Write** (admin) |
| `AcademicYearConfig` | Active year config | ❌ Not used | ✅ **Write** (admin) |

**Ownership**: Next.js is the **source of truth** for these tables.

---

### **NEW: Shared Monitoring Tables**

These tables will be **shared** between both applications:

| Table Name | Purpose | .NET Access | Next.js Access |
|------------|---------|-------------|----------------|
| `ApiMetrics` | API performance metrics | ✅ Write (optional) | ✅ **Write** (primary) |

**Ownership**: Both applications can write, Next.js reads and displays.

---

## 🔄 Data Flow Patterns

### Pattern 1: .NET Writes, Next.js Reads (Most Common)

```
OneRoster API → .NET Backend → SQL Server → Next.js Frontend → User
              (Sync student     (Student    (Display on
               data)             table)      dashboard)
```

**Examples**:
- Student data sync from OneRoster
- Enrollment updates
- Parent-student linking

**Important**: Next.js should **never** modify these tables directly.

---

### Pattern 2: Next.js Writes, Next.js Reads (Admin Features)

```
Admin User → Next.js Frontend → SQL Server → Next.js Frontend
           (Update config)     (Config       (Display config)
                                tables)
```

**Examples**:
- Admin user management
- Update period configuration
- Student action toggles
- Academic year selection

**Important**: .NET backend doesn't need these tables.

---

### Pattern 3: Both Write, Both Read (Monitoring - NEW)

```
.NET API Calls → SQL Server ← Next.js API Calls
                (ApiMetrics)
                     ↓
              Next.js Dashboard
              (Read & Display)
```

**Examples**:
- API performance metrics
- Error tracking
- Response time monitoring

**Important**: Both apps write independently, Next.js aggregates and displays.

---

## 🔐 Schema Management Strategy

### Current Approach

#### .NET Backend (Original Tables)
```csharp
// Entity Framework migrations in .NET
// Location: PP_API/Migrations/
// Command: dotnet ef migrations add <MigrationName>
```

**Process**:
1. Developer modifies C# entity models
2. Creates EF migration
3. Applies migration to database
4. Prisma schema must be **manually updated** to match

#### Next.js Frontend (Prisma Tables)
```bash
# Prisma migrations in Next.js
# Location: prisma/parent-portal/migrations/
# Command: npx prisma migrate dev --name <migration_name>
```

**Process**:
1. Developer modifies `schema.prisma`
2. Runs `prisma migrate dev`
3. Migration SQL is generated and applied
4. .NET doesn't need to know about these tables

---

### ⚠️ Critical Rules for Shared Database

#### Rule 1: Never Modify .NET Tables from Next.js
```typescript
// ❌ NEVER DO THIS
await prisma.student.update({
  where: { id: 123 },
  data: { emirateId: 'new-id' }  // .NET owns this table!
});

// ✅ CORRECT: Read only
const student = await prisma.student.findUnique({
  where: { id: 123 }
});
```

#### Rule 2: Keep Prisma Schema in Sync with .NET Tables
When .NET schema changes:
```bash
# Option 1: Introspect database (recommended)
npx prisma db pull --schema=prisma/parent-portal/schema.prisma

# Option 2: Manual update to schema.prisma
# Then regenerate client
npx prisma generate --schema=prisma/parent-portal/schema.prisma
```

#### Rule 3: Use Database Views for Complex Queries
Instead of complex joins in both apps, create SQL views:
```sql
-- Create view that both apps can use
CREATE VIEW vw_StudentWithEnrollment AS
SELECT 
    s.id,
    s.orSourcedId,
    s.firstNameEnglish,
    e.schoolId,
    e.streamGradeId
FROM Student s
LEFT JOIN StudentEnrollment e ON s.id = e.studentId
WHERE e.SchoolYear = '2024-2025';
```

Then add to Prisma:
```prisma
model StudentWithEnrollment {
  id               Int
  orSourcedId      String
  firstNameEnglish String?
  schoolId         String?
  streamGradeId    String?
  
  @@map("vw_StudentWithEnrollment")
}
```

---

## 🎯 Best Practices for ApiMetrics Table

### Design Decisions

1. **Aggregation Periods**
   - `realtime`: Every API call (deleted after 7 days)
   - `hourly`: Aggregated every hour (kept 90 days)
   - `daily`: Aggregated daily (kept 2 years)

2. **Why This Matters**
   - Prevents table bloat (millions of rows)
   - Fast queries (indexed by period)
   - Historical trend analysis

3. **Both Apps Can Write**
   ```csharp
   // .NET: Insert metrics after API call
   await _dbContext.ApiMetrics.AddAsync(new ApiMetric {
       Endpoint = "/api/oneroster/students",
       ServiceName = "OneRoster",
       AggregationPeriod = "realtime",
       TotalRequests = 1,
       SuccessfulRequests = 1,
       AvgResponseTime = 1250.5
   });
   ```

   ```typescript
   // Next.js: Insert metrics after API call
   await prisma.apiMetrics.create({
     data: {
       endpoint: '/api/PP/student/[id]',
       serviceName: 'PP',
       aggregationPeriod: 'realtime',
       totalRequests: 1,
       successfulRequests: 1,
       avgResponseTime: 1250.5
     }
   });
   ```

---

## 📦 Adding ApiMetrics to Prisma Schema

Add this to `/prisma/parent-portal/schema.prisma`:

```prisma
model ApiMetrics {
  id                        Int       @id @default(autoincrement()) @map("Id")
  endpoint                  String    @map("Endpoint") @db.NVarChar(500)
  serviceName               String?   @map("ServiceName") @db.NVarChar(100)
  timestamp                 DateTime  @default(now()) @map("Timestamp") @db.DateTime2(7)
  aggregationPeriod         String    @map("AggregationPeriod") @db.NVarChar(20)
  
  totalRequests             Int       @default(0) @map("TotalRequests")
  successfulRequests        Int       @default(0) @map("SuccessfulRequests")
  failedRequests            Int       @default(0) @map("FailedRequests")
  
  timeoutErrors             Int       @default(0) @map("TimeoutErrors")
  circuitBreakerRejections  Int       @default(0) @map("CircuitBreakerRejections")
  networkErrors             Int       @default(0) @map("NetworkErrors")
  
  totalRetries              Int       @default(0) @map("TotalRetries")
  successfulRetries         Int       @default(0) @map("SuccessfulRetries")
  
  avgResponseTime           Float     @default(0) @map("AvgResponseTime")
  minResponseTime           Float     @default(0) @map("MinResponseTime")
  maxResponseTime           Float     @default(0) @map("MaxResponseTime")
  p50ResponseTime           Float?    @map("P50ResponseTime")
  p95ResponseTime           Float?    @map("P95ResponseTime")
  p99ResponseTime           Float?    @map("P99ResponseTime")
  
  statusCodeBreakdown       String?   @map("StatusCodeBreakdown") @db.NVarChar(Max)
  
  createdAt                 DateTime  @default(now()) @map("CreatedAt") @db.DateTime2(7)
  updatedAt                 DateTime  @default(now()) @map("UpdatedAt") @db.DateTime2(7)

  @@index([timestamp, endpoint], map: "IX_ApiMetrics_Timestamp_Endpoint")
  @@index([endpoint, timestamp], map: "IX_ApiMetrics_Endpoint_Timestamp")
  @@index([aggregationPeriod, timestamp], map: "IX_ApiMetrics_AggregationPeriod_Timestamp")
  @@index([serviceName, timestamp], map: "IX_ApiMetrics_ServiceName_Timestamp")
}
```

Then regenerate Prisma client:
```bash
npx prisma generate --schema=prisma/parent-portal/schema.prisma
```

---

## 🚀 Migration Steps

### Step 1: Run SQL Script
```bash
# Connect to SQL Server
sqlcmd -S 10.190.36.25,1433 -U <username> -P <password> -d ParentPortal -i docs/CREATE_API_METRICS_TABLE.sql
```

### Step 2: Update Prisma Schema
Add the `ApiMetrics` model to `prisma/parent-portal/schema.prisma` (see above)

### Step 3: Generate Prisma Client
```bash
npx prisma generate --schema=prisma/parent-portal/schema.prisma
```

### Step 4: Verify Table
```typescript
// Test query
const metrics = await prisma.apiMetrics.findMany({
  take: 10,
  orderBy: { timestamp: 'desc' }
});
console.log(metrics);
```

---

## ⚠️ Important Warnings

### 1. Schema Conflicts
If .NET and Next.js both try to manage the same table:
- ❌ **WILL FAIL**: Migrations conflict
- ❌ **WILL FAIL**: Schema out of sync
- ✅ **SOLUTION**: One owner per table

### 2. Connection Pooling
Both apps connect to same database:
- .NET: Uses connection pooling (default 100)
- Next.js: Uses Prisma connection pooling (default unlimited)
- **Risk**: Connection exhaustion
- **Solution**: Configure limits in both apps

### 3. Transaction Isolation
- .NET default: `READ COMMITTED`
- Prisma default: `READ COMMITTED`
- **Risk**: Race conditions on shared tables
- **Solution**: Use `serializable` for critical writes

---

## 📚 Summary

| Aspect | .NET Backend | Next.js Frontend |
|--------|--------------|------------------|
| **Primary Role** | Data sync & business logic | UI & admin features |
| **Writes To** | Student, Parent, Enrollment, UpdateRequests | Admin configs, ApiMetrics |
| **Reads From** | All tables | All tables |
| **Schema Tool** | Entity Framework migrations | Prisma migrations |
| **Connection** | ADO.NET / EF Core | Prisma Client |
| **Typical Load** | Heavy writes (sync jobs) | Heavy reads (user dashboards) |

**Golden Rule**: Each table has ONE owner. If .NET owns it, Next.js only reads. If Next.js owns it, .NET doesn't touch it.

---

## 🔧 Troubleshooting

### Problem: Prisma schema out of sync
```bash
# Solution: Pull latest schema from database
npx prisma db pull --schema=prisma/parent-portal/schema.prisma
npx prisma generate --schema=prisma/parent-portal/schema.prisma
```

### Problem: .NET can't see new table
```csharp
// Solution: Add entity to DbContext
public DbSet<ApiMetric> ApiMetrics { get; set; }
```

### Problem: Connection pool exhausted
```typescript
// Solution: Limit Prisma connections
// In DATABASE_URL:
// sqlserver://...;Max Pool Size=20
```

---

**Document Version**: 1.0  
**Last Updated**: December 11, 2025  
**Maintained By**: Development Team
