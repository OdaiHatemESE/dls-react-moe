# System Architecture & Core Infrastructure

**Last Updated:** December 15, 2025  
**Version:** 1.0

---

## Table of Contents

- [Quick Start](#quick-start)
- [Database Architecture](#database-architecture)
- [API Resilience](#api-resilience)
- [Student Authorization Security](#student-authorization-security)
- [External Service Integration](#external-service-integration)

---

## Quick Start

### Core Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                  SQL Server Database                             │
│                  (Parent Portal)                                 │
│                  10.190.36.25:1433                              │
└─────────────────────────────────────────────────────────────────┘
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

### Key Technologies

- **Framework:** Next.js App Router with TailwindCSS
- **Auth:** NextAuth using OIDC/Auth0 + Credentials provider
- **Database:** Microsoft SQL Server via Prisma ORM
- **Data Sources:** OneRoster vendor APIs + PP API
- **Caching:** Redis (ioredis) for tokens and secrets
- **Client Data:** SWR with centralized config

---

## Database Architecture

### Shared Database Model

The Parent Portal database is **shared** between two applications:
- **.NET Backend**: Primary data sync and business logic
- **Next.js Frontend**: UI and admin configuration

### Table Ownership

#### Tables Created by .NET (Original Schema)

| Table Name | Purpose | .NET Access | Next.js Access |
|------------|---------|-------------|----------------|
| `UpdateInformationRequests` | Parent update requests | ✅ **Write** (primary) | ✅ Read (display) |
| `Student` | Student master data | ✅ **Write** (OneRoster sync) | ✅ Read (display) |
| `StudentAddress` | Student addresses | ✅ **Write** (sync) | ✅ Read (display) |
| `StudentContact` | Student contacts | ✅ **Write** (sync) | ✅ Read (display) |
| `StudentEnrollment` | Enrollment data | ✅ **Write** (sync) | ✅ Read (display) |
| `Parent` | Parent master data | ✅ **Write** (sync) | ✅ Read (display) |

**Ownership**: .NET is the **source of truth** for these tables.

#### Tables Created by Next.js/Prisma (Admin & Config)

| Table Name | Purpose | .NET Access | Next.js Access |
|------------|---------|-------------|----------------|
| `AdminUser` | Admin access control | ❌ Not used | ✅ **Write** (manage) |
| `UpdatePeriodConfig` | Update window config | ❌ Not used | ✅ **Write** (admin) |
| `StudentActionConfig` | Action configuration | ❌ Not used | ✅ **Write** (admin) |
| `AcademicYearConfig` | Active year config | ❌ Not used | ✅ **Write** (admin) |
| `Notification` | User notifications | ❌ Not used | ✅ **Write** (manage) |

**Ownership**: Next.js is the **source of truth** for these tables.

### Data Flow Patterns

#### Pattern 1: .NET Writes, Next.js Reads (Most Common)

```
OneRoster API → .NET Backend → SQL Server → Next.js Frontend → User
              (Sync student     (Student    (Display on
               data)             table)      dashboard)
```

**Examples:**
- Student data sync from OneRoster
- Enrollment updates
- Parent-student linking

**Important**: Next.js should **never** modify these tables directly.

#### Pattern 2: Next.js Writes, Next.js Reads (Admin Features)

```
Admin User → Next.js Frontend → SQL Server → Next.js Frontend
           (Update config)     (Config       (Display config)
                                tables)
```

**Examples:**
- Admin user management
- Update period configuration
- Student action toggles
- Academic year selection

### Critical Rules for Shared Database

#### ❌ NEVER Modify .NET Tables from Next.js
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

#### ✅ Keep Prisma Schema in Sync with .NET Tables

When .NET schema changes:
```bash
# Introspect database to update schema
npx prisma db pull --schema=prisma/parent-portal/schema.prisma

# Then regenerate client
npx prisma generate --schema=prisma/parent-portal/schema.prisma
```

#### ✅ Use Database Views for Complex Queries

Instead of complex joins in both apps, create SQL views:
```sql
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

### Schema Management Strategy

#### .NET Backend (Original Tables)
```csharp
// Entity Framework migrations in .NET
// Location: PP_API/Migrations/
// Command: dotnet ef migrations add <MigrationName>
```

**Process:**
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

**Process:**
1. Developer modifies `schema.prisma`
2. Runs `prisma migrate dev`
3. Migration SQL is generated and applied
4. .NET doesn't need to know about these tables

---

## API Resilience

### Overview

Complete resilience protection across all 36 API endpoints using:
- ⏱️ **Timeouts** - Prevent indefinite hangs
- 🔄 **Retries** - Handle transient failures
- 🚦 **Circuit Breakers** - Fast-fail during outages
- 📊 **Rate Limiting** - Prevent 429 errors (IDH only)

### Protection Patterns by Service

#### PP API (Parent Portal)

**Pattern**: Timeout + Retry + Circuit Breaker

```typescript
import { fetchWithTimeout, FetchTimeoutError } from '@/lib/fetch-with-timeout';
import { ppApiCircuitBreaker, CircuitBreakerError } from '@/lib/circuit-breaker';

const MAX_RETRIES = 1;
const TIMEOUT_MS = 25000;

try {
  const result = await ppApiCircuitBreaker.execute(async () => {
    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        const res = await fetchWithTimeout(url, {
          headers: { Authorization: `Bearer ${token}` },
          timeoutMs: TIMEOUT_MS,
        });
        return await res.json();
      } catch (error) {
        if (attempt < MAX_RETRIES + 1 && error instanceof FetchTimeoutError) {
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
          continue;
        }
        throw error;
      }
    }
  });
} catch (error) {
  if (error instanceof CircuitBreakerError) {
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
  }
  if (error instanceof FetchTimeoutError) {
    return NextResponse.json({ error: 'Request timed out' }, { status: 504 });
  }
  throw error;
}
```

**Configuration:**
- Circuit Breaker: 5 failures → OPEN, 60s cooldown, 2 successes → CLOSED
- Timeout: 10-30s depending on endpoint complexity
- Retry: 1 attempt with 500ms backoff

**Endpoints Using This Pattern:**
- `/api/PP/student/[id]` (25s timeout)
- `/api/PP/student/[id]/enrollments` (25s timeout)
- `/api/PP/school/[id]` (10s timeout)
- `/api/PP/persons` (30s timeout)
- `lib/fetch-student-profile.ts` (25s timeout)

#### OneRoster API

**Pattern**: Centralized Timeout via `orFetch()`

```typescript
import { orFetch } from '@/lib/oneroster';

// Default 15s timeout
const student = await orFetch<Student>('/students/SST-1-1-Pers-521025');

// Custom timeout
const student = await orFetch<Student>('/students/SST-1-1-Pers-521025', 'read', {
  timeoutMs: 20000,
});
```

**Configuration:**
- Default timeout: 15s
- Retry: Built-in retry on 401/403 (token refresh)
- Circuit breaker: Optional

**All OneRoster Endpoints Protected** (via `orFetch`):
- `- `/api/oneroster/schoolenrollments``
- `/api/oneroster/classes/[sourcedId]`
- `/api/oneroster/enrollments`
- `/api/oneroster/persons`
- `/api/oneroster/basic-info-full`

#### IDH API (Student Status/Transportation)

**Pattern**: Timeout + Queue + Retry (POST only)

```typescript
import { fetchWithTimeout, FetchTimeoutError } from '@/lib/fetch-with-timeout';
import { idhQueue } from '@/lib/idh-queue';

// GET request (read-only)
const result = await idhQueue.execute(async () => {
  const res = await fetchWithTimeout(url, {
    headers: { Authorization: `Bearer ${token}` },
    timeoutMs: 12000,
  });
  return await res.json();
});

// POST request (write)
for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
  try {
    const result = await idhQueue.execute(async () => {
      const res = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        timeoutMs: 15000,
      });
      return await res.json();
    });
    break;
  } catch (error) {
    if (attempt < MAX_RETRIES + 1 && error instanceof FetchTimeoutError) {
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      continue;
    }
    throw error;
  }
}
```

**Configuration:**
- Queue: 3 concurrent, 5 requests/second max
- Timeout: GET 12s, POST 15s
- Retry: POST only (1 attempt, 1s backoff)

### Timeout Configuration Reference

| Endpoint | Timeout | Retry | Circuit Breaker | Queue |
|----------|---------|-------|-----------------|-------|
| **PP API** |
| `/api/PP/auth/token` | 8s | No | No | No |
| `/api/PP/student/[id]` | 25s | Yes (1x) | Yes (ppApi) | No |
| `/api/PP/student/[id]/enrollments` | 25s | Yes (1x) | Yes (ppApi) | No |
| `/api/PP/ChildList/[eid]` | 20s | Yes (1x) | No | No |
| `/api/PP/school/[id]` | 10s | Yes (1x) | Yes (ppApi) | No |
| `/api/PP/persons` | 30s | Yes (1x) | Yes (ppApi) | No |
| `/api/PP/conduct-status/[id]` | 15s | Yes (1x) | No | No |
| `/api/PP/information-status/[id]` | 15s | Yes (1x) | No | No |
| **OneRoster API** |
| All endpoints via `orFetch()` | 15s (default) | Yes (401/403) | No | No |
| **IDH API** |
| `/api/backoffice/idh` GET | 12s | No | No | Yes |
| `/api/backoffice/idh` POST | 15s | Yes (1x) | No | Yes |

### Circuit Breaker States

#### ppApiCircuitBreaker
- **Threshold**: 5 consecutive failures
- **Timeout**: 25s per request
- **Open Duration**: 60s
- **Half-Open Requests**: 3 test requests
- **Success Threshold**: 2 successes to close

**State Transitions:**
```
CLOSED (normal)
  ↓ (5 failures)
OPEN (fast-fail, return 503)
  ↓ (after 60s)
HALF_OPEN (test recovery with 3 requests)
  ↓ (2 successes)
CLOSED (recovered)
```

**Check Circuit Breaker State:**
```typescript
const stats = ppApiCircuitBreaker.getStats();
console.log({
  state: stats.state, // 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  failures: stats.failures,
  successes: stats.successes,
  nextAttempt: stats.nextAttemptTime,
});
```

### Queue Configuration

#### idhQueue (IDH API Rate Limiting)
```typescript
const idhQueue = new IdhQueueManager({
  concurrency: 3,           // Max 3 simultaneous requests
  intervalCap: 5,          // Max 5 requests per interval
  interval: 1000,          // 1 second interval
  retryOptions: {
    retries: 3,
    minTimeout: 1000,
    maxTimeout: 5000,
    factor: 2,
  },
});
```

**Usage:**
```typescript
// Single request
const result = await idhQueue.execute(async () => {
  return await fetchIDHData();
});

// Batch requests (auto-queued)
const results = await idhQueue.executeMany([
  () => fetchIDHData('student1'),
  () => fetchIDHData('student2'),
  () => fetchIDHData('student3'),
]);
```

### Error Types

1. **FetchTimeoutError**
   - HTTP Status: 504 Gateway Timeout
   - Action: Retry if retry logic enabled
   - Message: "Request timed out after Xms"

2. **CircuitBreakerError**
   - HTTP Status: 503 Service Unavailable
   - Action: Fast-fail, don't retry
   - Message: "Circuit breaker is OPEN"

3. **QueueTimeoutError**
   - HTTP Status: 504 Gateway Timeout
   - Action: Already retried, return error
   - Message: "Request failed after X retries"

---

## Student Authorization Security

### Overview

Server-side authorization system to enforce parent-student data access and modification rules.

### Authorization Levels

#### 1. Ownership Validation (`authorizeStudentOwnership`)
**Use Case**: Read-only operations where viewing inactive students is acceptable

**Checks:**
- ✅ Student belongs to the authenticated parent (via Emirates ID)
- ✅ Valid student ID provided
- ✅ Parent has valid session

**Does NOT check:**
- ❌ Active enrollment status
- ❌ Current academic year

**Used in:**
- `/api/parent/conduct` (GET) - Viewing conduct information

#### 2. Active Student Validation (`authorizeStudentAccess`)
**Use Case**: Modify operations that should only work with active students

**Checks:**
- ✅ All ownership checks (from level 1)
- ✅ Student has enrollment for current academic year
- ✅ At least one enrollment is NOT marked as "private" education type
- ✅ Student's `isActive` flag is true (if present)

**Validation Logic:**
1. First checks if student has ANY enrollment for current academic year
2. Then validates at least one enrollment is non-private education
3. Provides specific error messages for each failure case

**Used in:**
- `/api/backoffice/idh` (POST) - Updating student information
- `/api/parent/students-partnership-charter` (POST) - Signing conduct charter

### Implementation

**Location**: `/lib/student-authorization.ts`

```typescript
// Full active student check (for modifications)
const authResult = await authorizeStudentAccess(
  studentId,
  parentEid,
  accessToken
);

// Ownership check only (for reads)
const authResult = await authorizeStudentOwnership(
  studentId,
  parentEid,
  accessToken
);
```

**Response Structure:**
```typescript
// Success
{
  authorized: true,
  student: StudentProfileV1
}

// Failure
{
  authorized: false,
  error: {
    code: 'UNAUTHORIZED' | 'NOT_FOUND' | 'INACTIVE_STUDENT' | 'NO_ACTIVE_ENROLLMENT' | 'PRIVATE_EDUCATION',
    message: string,
    status: number
  }
}
```

### Protected Endpoints

#### Update Student Information
**Endpoint**: `POST /api/backoffice/idh`

**Authorization**: Active Student Validation

**Flow:**
1. Verify user session exists
2. Extract parent Emirates ID from session
3. Get PP API access token
4. **Authorize**: Validate student ownership + active enrollment
5. Validate required fields
6. Submit to upstream IDH API

**Error Responses:**
- `401`: No session or invalid parent EID
- `403`: Student inactive, no active enrollment, or enrolled in private education only
- `404`: Student not found for this parent
- `400`: Missing required fields

#### Sign Conduct Charter
**Endpoint**: `POST /api/parent/students-partnership-charter`

**Authorization**: Active Student Validation

**Flow:**
1. Verify user session exists
2. Extract parent Emirates ID from session
3. Validate required payload fields
4. Get PP API access token
5. Fetch all students for parent (by Emirates ID)
6. Find student by `studentNumber`
7. **Authorize**: Validate student ownership + active enrollment
8. Submit charter to upstream API

### Active Academic Year Integration

```typescript
// From lib/admin-config.ts
const activeAcademicYear = await getActiveAcademicYearValue();
// Returns: 2026 (for academic year 2025-2026)

// Check student has enrollment for current year
const currentYearEnrollments = student.enrollment?.filter(
  (enr) => enr.schoolYear === String(activeAcademicYear)
) ?? [];

if (currentYearEnrollments.length === 0) {
  // Error: NO_ACTIVE_ENROLLMENT
}

// Check at least one enrollment is non-private
const hasNonPrivateEnrollment = currentYearEnrollments.some(
  (enr) => enr.educationType?.toLowerCase() !== 'private'
);

if (!hasNonPrivateEnrollment) {
  // Error: PRIVATE_EDUCATION
}
```

### Security Best Practices Applied

✅ **Defense in Depth**: Authorization at API layer even though UI hides actions  
✅ **Principle of Least Privilege**: Only parents can access their own children  
✅ **Separation of Concerns**: Dedicated authorization module  
✅ **Fail Secure**: Default deny, explicit allow  
✅ **Centralized Logic**: Reusable authorization functions  
✅ **Detailed Error Codes**: Specific error types for debugging

### Template for New Endpoints

```typescript
import { authorizeStudentAccess } from '@/lib/student-authorization';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.emiratesId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await req.json();
  const token = await getToken();
  
  const authResult = await authorizeStudentAccess(
    body.studentId,
    session.user.emiratesId,
    token
  );
  
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error.message },
      { status: authResult.error.status }
    );
  }
  
  // Process authorized request...
}
```

---

## External Service Integration

### Auth & Token Management

#### NextAuth Configuration
**Location**: `lib/auth.ts`

- **Providers**: OIDC/Auth0 + Credentials (mobile tokens)
- **Token Storage**: Large access tokens stored in Redis, referenced in JWT via small key (`atKey`)
- **Session Payload**: Trimmed to essentials (id, name, email, optional emiratesId)

#### Token Indirection Pattern
```typescript
// JWT callback stores token reference, not token itself
jwt.atKey = `at:${userId}:${Date.now()}`;

// Store actual token in Redis
await redis.set(jwt.atKey, accessToken, 'EX', 3600);

// Session callback retrieves if needed
const accessToken = await redis.get(session.user.atKey);
```

### OneRoster Integration

**Location**: `lib/oneroster.ts`

#### Key Features
- **Server-only**: Enforces server-only usage
- **No caching**: Never caches via Next.js route cache (`cache: "no-store"`)
- **Token exchange**: Automatic token management
- **Retry logic**: Retries once on 401/403 by invalidating in-memory token cache

#### Usage
```typescript
import { orFetch } from '@/lib/oneroster';

// Typed fetch wrapper
const student = await orFetch<Student>('/v1p1/students/SST-1-1-Pers-521025', 'read');

// With custom timeout
const classes = await orFetch<Classes>('/v1p1/classes', 'read', {
  timeoutMs: 20000
});
```

### PP API Integration

**Location**: Various `/api/PP/*` routes

#### Token Flow
1. Fetch token with timeout (8s)
2. Use token for data request with timeout (varies by endpoint)
3. Retry on timeout (1 attempt with backoff)
4. Circuit breaker protection (for critical endpoints)

#### Example
```typescript
const TOKEN_TIMEOUT_MS = 8000;
const DATA_TIMEOUT_MS = 25000;

// Get token
const tokenRes = await fetchWithTimeout(tokenUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ /* credentials */ }),
  timeoutMs: TOKEN_TIMEOUT_MS,
});

// Use token
const dataRes = await ppApiCircuitBreaker.execute(async () => {
  return await fetchWithTimeout(dataUrl, {
    headers: { Authorization: `Bearer ${token}` },
    timeoutMs: DATA_TIMEOUT_MS,
  });
});
```

### Connection Management

#### Prisma
```typescript
// lib/prisma.ts - Singleton pattern
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

#### Redis
```typescript
// lib/redis.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export { redis };
```

---

## Troubleshooting

### Database Issues

**Problem**: Prisma schema out of sync
```bash
# Solution: Pull latest schema from database
npx prisma db pull --schema=prisma/parent-portal/schema.prisma
npx prisma generate --schema=prisma/parent-portal/schema.prisma
```

**Problem**: Connection pool exhausted
```typescript
// Solution: Limit Prisma connections
// In DATABASE_URL:
// sqlserver://...;Max Pool Size=20
```

### API Issues

**Problem**: All requests returning 503
- Check circuit breaker stats: `ppApiCircuitBreaker.getStats()`
- Wait for cooldown period (60s for ppApi)
- Verify upstream service is healthy

**Problem**: Frequent 504 timeouts on specific endpoint
- Check P95 response time for that endpoint
- If P95 > timeout, increase timeout by 50%
- Update timeout constant in route file

**Problem**: Queue backing up (IDH)
- Check queue metrics: `idhQueue.getMetrics()`
- If `pending > 50`, reduce parallelism in caller
- Consider increasing `concurrency` if IDH can handle it

### Auth Issues

**Problem**: Session token too large
- Ensure large tokens are stored in Redis, not JWT
- Check `atKey` pattern is being used
- Verify Redis connection

---

## Performance Optimization

### Database
- Indexes on userId and createdAt for fast queries
- Connection pooling configured appropriately
- Views for complex queries used by multiple systems

### Caching
- SWR reduces API calls on client
- Redis for token and secret storage
- In-memory token cache for OneRoster (with invalidation)

### API Calls
- Timeouts prevent indefinite hangs
- Retries handle transient failures
- Circuit breakers prevent cascading failures
- Queues prevent rate limiting issues

---

## Related Documentation

- [Child Actions System](../features/CHILD_ACTIONS.md)
- [Notifications System](../features/NOTIFICATIONS.md)
- [Admin Panel](../features/ADMIN_PANEL.md)

---

**Document Version**: 1.0  
**Last Updated**: December 15, 2025  
**Maintained By**: Development Team
