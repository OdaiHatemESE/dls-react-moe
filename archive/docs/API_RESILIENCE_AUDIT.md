# 🔍 API Resilience Audit - All External API Calls

**Date**: December 11, 2025  
**Purpose**: Identify all external API calls and recommend timeout/queue/circuit breaker protection

---

## 📊 Summary

| API Type | Total Endpoints | Protected | Needs Protection | Priority |
|----------|----------------|-----------|------------------|----------|
| **PP API** | 12 | 5 ✅ | 7 ⚠️ | HIGH |
| **IDH API** | 3 | 1 ✅ | 2 ⚠️ | HIGH |
| **OneRoster API** | 8 | 0 ❌ | 8 ⚠️ | MEDIUM |
| **Database** | 8 | 0 ❌ | 0 ✅ | LOW (local) |
| **Notifications** | 5 | 0 ❌ | 0 ✅ | LOW (async) |

**Total**: 36 endpoints, 6 protected (17%), 17 need protection (47%)

---

## 🔴 HIGH PRIORITY - Needs Immediate Protection

### 1. PP API Endpoints

#### ✅ **PROTECTED** (Already Fixed)
1. **`/api/PP/student/[id]/route.ts`**
   - Status: ✅ Timeout 25s, Retry 1x
   - External Call: `PP_BASE_URL/Student/Profiles`
   - Protection: `fetchWithTimeout` with retry logic

2. **`/api/PP/student/[id]/enrollments/route.ts`**
   - Status: ✅ Timeout 25s, Retry 1x
   - External Call: `PP_BASE_URL/Student/Profiles`
   - Protection: `fetchWithTimeout` with retry logic

3. **`/api/debug/student/[id]/route.ts`**
   - Status: ✅ Timeout 25s, Retry 1x
   - External Call: `PP_BASE_URL/Student/Profiles`
   - Protection: `fetchWithTimeout` with retry logic

4. **`/api/parent/students-partnership-charter/route.ts`**
   - Status: ✅ Timeout 25s, Retry 1x
   - External Call: `PP_BASE_URL/Student/Profiles`
   - Protection: `fetchWithTimeout` with retry logic

5. **`/api/parent/child-actions/route.ts`**
   - Status: ✅ Timeout 20s for PP + IDH Queue
   - External Calls: 
     - `PP_BASE_URL/Student/Profiles`
     - `PP_BASE_URL/idh` (via queue)
   - Protection: `fetchStudentProfile` + `idhQueue`

#### ⚠️ **NEEDS PROTECTION**

6. **`/api/backoffice/idh/route.ts`** ⚡ HIGH PRIORITY
   - Current Status: ❌ NO timeout, NO retry
   - External Calls:
     ```typescript
     // Line 47: Token fetch - NO timeout
     const tokenRes = await fetch(tokenUrl);
     
     // Line 66: IDH fetch - NO timeout
     const idhRes = await fetch(idhUrl, {
       headers: { Authorization: `Bearer ${accessToken}` },
       cache: 'no-store',
     });
     ```
   - **Risk**: 
     - Seen in error logs: "Request timeout after 12000ms"
     - Can hang indefinitely
     - Direct user-facing endpoint (used by update-info page)
   
   - **Recommended Fix**:
     ```typescript
     // Add timeout + queue protection
     import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
     import { idhQueue } from '@/lib/idh-queue';
     
     const TOKEN_TIMEOUT_MS = 8000;
     const IDH_TIMEOUT_MS = 12000;
     
     const tokenRes = await fetchWithTimeout(tokenUrl, {
       timeoutMs: TOKEN_TIMEOUT_MS,
     });
     
     const idhRes = await idhQueue.execute(
       () => fetchWithTimeout(idhUrl, {
         headers: { Authorization: `Bearer ${accessToken}` },
         cache: 'no-store',
         timeoutMs: IDH_TIMEOUT_MS,
       }),
       { studentId: sourceId }
     );
     ```

7. **`/api/PP/ChildList/[eid]/route.ts`** ⚡ HIGH PRIORITY
   - Current Status: ❌ NO timeout, NO retry
   - External Calls:
     ```typescript
     // Line 96: Token fetch - NO timeout
     const tokenRes = await fetch(tokenUrl);
     
     // Line 121: Student list fetch - NO timeout
     const ppRes = await fetch(ppUrl, {
       headers: { Authorization: `Bearer ${token}` },
     });
     ```
   - **Risk**:
     - Critical for parent dashboard
     - Fetches all children (potentially 5+ students)
     - Can timeout during peak hours
   
   - **Recommended Fix**:
     ```typescript
     const TOKEN_TIMEOUT_MS = 8000;
     const CHILDLIST_TIMEOUT_MS = 20000; // May need to fetch multiple students
     const MAX_RETRIES = 1;
     
     for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
       try {
         const tokenRes = await fetchWithTimeout(tokenUrl, {
           timeoutMs: TOKEN_TIMEOUT_MS,
         });
         
         const ppRes = await fetchWithTimeout(ppUrl, {
           headers: { Authorization: `Bearer ${token}` },
           timeoutMs: CHILDLIST_TIMEOUT_MS,
         });
         
         break; // Success
       } catch (error) {
         if (attempt < MAX_RETRIES + 1) {
           await new Promise(resolve => setTimeout(resolve, 500 * attempt));
           continue;
         }
         throw error;
       }
     }
     ```

8. **`/api/PP/conduct-status/[id]/route.ts`** 🔶 MEDIUM PRIORITY
   - Current Status: ❌ NO timeout
   - External Call: `PP_BASE_URL/conduct/status`
   - **Risk**: Used by parent-conduct page, can timeout
   - **Recommended Fix**: Add 15s timeout + retry

9. **`/api/PP/information-status/[id]/route.ts`** 🔶 MEDIUM PRIORITY
   - Current Status: ❌ NO timeout
   - External Call: `PP_BASE_URL/information/status`
   - **Risk**: Used by update-info page, can timeout
   - **Recommended Fix**: Add 15s timeout + retry

10. **`/api/PP/school/[id]/route.ts`** ✅ PARTIALLY PROTECTED
    - Current Status: ⚠️ Has 10s timeout, NO retry
    - External Call: `PP_BASE_URL/School/[id]`
    - **Recommended Enhancement**: Add retry logic
    ```typescript
    // Already has SCHOOL_TIMEOUT_MS = 10000
    // Need to add retry loop similar to student profile
    ```

11. **`/api/PP/child/sync/route.ts`** 🔶 MEDIUM PRIORITY
    - Current Status: ❌ NO timeout
    - External Call: `PP_BASE_URL/Student/Profiles`
    - **Risk**: Used by dashboard sync, can timeout
    - **Recommended Fix**: Add 20s timeout + retry

12. **`/api/PP/persons/route.ts`** ✅ PARTIALLY PROTECTED
    - Current Status: ⚠️ Has 30s timeout, NO retry
    - Already uses `fetchWithTimeout` with 30s
    - **Recommended Enhancement**: Add retry logic

---

### 2. IDH API Endpoints

#### ✅ **PROTECTED**
1. **`/api/parent/child-actions/route.ts`**
   - Status: ✅ IDH Queue + 12s timeout
   - External Call: `PP_BASE_URL/idh` (via queue)
   - Protection: `idhQueue.execute()`

#### ⚠️ **NEEDS PROTECTION**

2. **`/api/backoffice/idh/route.ts` (GET)** ⚡ HIGH PRIORITY
   - **Same as PP API #6 above** - needs IDH queue integration

3. **`/api/backoffice/idh/route.ts` (POST)** ⚡ HIGH PRIORITY
   - Current Status: ❌ NO timeout, NO retry
   - External Calls:
     ```typescript
     // Line 165: Token fetch - NO timeout
     const tokenRes = await fetch(tokenUrl);
     
     // Line 189: IDH POST - NO timeout
     const idhRes = await fetch(idhUrl, {
       method: 'POST',
       headers: { Authorization: `Bearer ${accessToken}` },
       body: JSON.stringify(payload),
     });
     ```
   - **Risk**:
     - Critical user action (saving IDH data)
     - No feedback if request hangs
     - Used by update-info form submission
   
   - **Recommended Fix**:
     ```typescript
     const TOKEN_TIMEOUT_MS = 8000;
     const IDH_POST_TIMEOUT_MS = 15000; // POST may be slower
     const MAX_RETRIES = 1; // Retry once on timeout
     
     for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
       try {
         const tokenRes = await fetchWithTimeout(tokenUrl, {
           timeoutMs: TOKEN_TIMEOUT_MS,
         });
         
         // Use queue for rate limiting even on POST
         const idhRes = await idhQueue.execute(
           () => fetchWithTimeout(idhUrl, {
             method: 'POST',
             headers: { Authorization: `Bearer ${accessToken}` },
             body: JSON.stringify(payload),
             timeoutMs: IDH_POST_TIMEOUT_MS,
           }),
           { studentId: payload.sourceId, priority: 7 } // Higher priority for writes
         );
         
         break; // Success
       } catch (error) {
         if (attempt < MAX_RETRIES + 1 && error instanceof FetchTimeoutError) {
           await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
           continue;
         }
         throw error;
       }
     }
     ```

---

### 3. OneRoster API Endpoints

**Current Protection**: `orFetch()` has **1 retry on 401/403**, but **NO timeout**

#### ⚠️ **ALL NEED TIMEOUT PROTECTION**

1. **`/api/oneroster/basic-info-full/route.ts`** 🔶 MEDIUM PRIORITY
   - Current: `orFetch()` - NO timeout
   - External Calls:
     ```typescript
     // Multiple orFetch calls, no timeout:
     await orFetch(`/v1p1/persons?filter=identifiers={eid}`, "read")
     await orFetch(`/v1p1/persons/${sourcedId}`, "read")
     await orFetch(`/v1p1/students?filter=...`, "read")
     ```
   - **Risk**: 
     - Can hang if OneRoster vendor is slow
     - Seen in logs: "Failed fetching school enrollments"
   
   - **Recommended Fix**: Add timeout to `orFetch()` function
     ```typescript
     // lib/oneroster.ts
     export async function orFetch<T>(
       path: string, 
       kind: TokenKind = "read", 
       init?: RequestInit,
       timeoutMs = 15000 // NEW: default 15s timeout
     ): Promise<T> {
       const makeReq = async (retry: boolean): Promise<T> => {
         const token = await getToken(kind);
         const url = joinBaseAndPath(BASE_URL, path);
         
         // Wrap in timeout
         const res = await fetchWithTimeout(url, {
           ...init,
           headers: { ...other, Authorization: `Bearer ${token}` },
           cache: "no-store",
           timeoutMs, // Apply timeout
         });
         
         // ... rest of logic
       };
     }
     ```

2. **`/api/oneroster/schoolenrollments/route.ts`** 🔶 MEDIUM PRIORITY
   - Current: `orFetch()` - NO timeout
   - External Call: `orFetch('/v1p1/schoolenrollments?filter=...')`
   - **Risk**: Seen in error logs frequently
   - **Recommended Fix**: Add timeout to `orFetch()` (same as #1)

3. **`/api/oneroster/students/[sourcedId]/route.ts`** 🟢 LOW PRIORITY
   - Current: `orFetch()` - NO timeout
   - External Call: `orFetch('/v1p1/students/[id]')`
   - **Risk**: Less critical, used for metadata only
   - **Recommended Fix**: Add timeout to `orFetch()` (same as #1)

4. **`/api/oneroster/latest-enrollment/route.ts`** 🟢 LOW PRIORITY
   - Current: `orFetch()` - NO timeout
   - **Recommended Fix**: Add timeout to `orFetch()` (same as #1)

5-8. **Other OneRoster endpoints**: All inherit from `orFetch()`, fix is centralized

**Centralized Fix for All OneRoster APIs**:
```typescript
// lib/oneroster.ts - Update orFetch signature
export async function orFetch<T>(
  path: string, 
  kind: TokenKind = "read", 
  init?: RequestInit & { timeoutMs?: number }
): Promise<T> {
  const timeoutMs = init?.timeoutMs ?? 15000; // Default 15s
  
  const makeReq = async (retry: boolean): Promise<T> => {
    const token = await getToken(kind);
    const url = joinBaseAndPath(BASE_URL, path);
    
    const res = await fetchWithTimeout(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...headersToObject(init?.headers),
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      timeoutMs,
    });
    
    // ... existing retry logic on 401/403
  };
}
```

---

## 🟡 MEDIUM PRIORITY - Enhanced Protection Needed

### PP API Endpoints with Partial Protection

1. **`/api/PP/school/[id]/route.ts`**
   - Current: ✅ 10s timeout, ❌ NO retry
   - **Recommendation**: Add retry loop

2. **`/api/PP/persons/route.ts`**
   - Current: ✅ 30s timeout, ❌ NO retry
   - **Recommendation**: Add retry loop + reduce timeout to 20s

3. **`/api/PP/conduct-status/[id]/route.ts`**
   - Current: ❌ NO timeout, ❌ NO retry
   - **Recommendation**: Add 15s timeout + retry

4. **`/api/PP/information-status/[id]/route.ts`**
   - Current: ❌ NO timeout, ❌ NO retry
   - **Recommendation**: Add 15s timeout + retry

---

## 🟢 LOW PRIORITY - No Immediate Action Needed

### Database APIs (Local SQL Server)
- `/api/db/health/route.ts`
- `/api/db/regions/route.ts`
- `/api/db/zones/route.ts`
- `/api/db/areas/route.ts`
- `/api/db/emirates/route.ts`
- `/api/db/plots/route.ts`

**Status**: ✅ Local network, fast responses  
**Action**: Monitor Prisma query timeouts, no external API protection needed

### Notification APIs (Async)
- `/api/notifications/route.ts`
- `/api/notifications/[id]/read/route.ts`
- `/api/notifications/count/route.ts`
- `/api/notifications/mark-all-read/route.ts`
- `/api/notifications/email/route.ts`
- `/api/notifications/sms/route.ts`

**Status**: ✅ Database operations + async email/SMS  
**Action**: Consider queue for email/SMS burst sends (future enhancement)

---

## 📋 Implementation Priority Matrix

### Phase 1: CRITICAL (This Week)
**Goal**: Protect all user-facing PP and IDH endpoints

| Endpoint | External API | Current | Fix | Est. Time |
|----------|--------------|---------|-----|-----------|
| `/api/backoffice/idh/route.ts` (GET) | IDH | ❌ None | Timeout 12s + IDH Queue | 30 min |
| `/api/backoffice/idh/route.ts` (POST) | IDH | ❌ None | Timeout 15s + IDH Queue + Retry | 30 min |
| `/api/PP/ChildList/[eid]/route.ts` | PP | ❌ None | Timeout 20s + Retry | 30 min |
| `/api/PP/conduct-status/[id]/route.ts` | PP | ❌ None | Timeout 15s + Retry | 20 min |
| `/api/PP/information-status/[id]/route.ts` | PP | ❌ None | Timeout 15s + Retry | 20 min |

**Total**: ~2.5 hours

### Phase 2: HIGH PRIORITY (Next Week)
**Goal**: Add centralized timeout to OneRoster + circuit breaker integration

| Task | Scope | Fix | Est. Time |
|------|-------|-----|-----------|
| Update `orFetch()` | All OneRoster APIs | Add timeout parameter (default 15s) | 1 hour |
| Circuit Breaker Integration | PP student/enrollment APIs | Wrap in `ppApiCircuitBreaker.execute()` | 1 hour |
| Add retry to partially protected | `/api/PP/school`, `/api/PP/persons` | Add retry loop | 30 min |

**Total**: ~2.5 hours

### Phase 3: OPTIMIZATION (Following Week)
**Goal**: Monitoring + tuning

| Task | Description | Est. Time |
|------|-------------|-----------|
| Create admin metrics endpoint | `/api/admin/resilience-metrics` | 1 hour |
| Add Grafana/CloudWatch integration | Push queue/circuit breaker metrics | 2 hours |
| Load testing | Simulate high concurrent load | 2 hours |
| Tune timeouts based on P99 latency | Adjust thresholds | 1 hour |

**Total**: ~6 hours

---

## 🛠️ Recommended Configuration Values

### Timeout Values by API Type

| API Type | Operation | Recommended Timeout | Retry | Notes |
|----------|-----------|---------------------|-------|-------|
| **PP Auth Token** | POST | 8s | No | Fast or fail |
| **PP Student Profile** | GET | 25s | 1x (500ms delay) | Already implemented |
| **PP ChildList** | GET | 20s | 1x (500ms delay) | Multiple students |
| **PP School** | GET | 10s | 1x (500ms delay) | Metadata only |
| **PP Conduct Status** | GET | 15s | 1x (500ms delay) | Status check |
| **PP Info Status** | GET | 15s | 1x (500ms delay) | Status check |
| **IDH GET** | GET | 12s | No (use queue) | Rate limited |
| **IDH POST** | POST | 15s | 1x (1s delay) | Writes are slower |
| **OneRoster** | Any | 15s | No (built-in 401/403 retry) | Vendor API |

### Queue Configuration

**IDH Queue** (Already Configured):
```typescript
{
  concurrency: 3,      // Max 3 parallel requests
  intervalCap: 5,      // Max 5 requests
  interval: 1000,      // per 1 second
  timeout: 30000,      // 30s max queue wait
}
```

**Potential New Queues**:
- **PP API Queue** (if rate limits appear):
  ```typescript
  {
    concurrency: 10,   // More generous
    intervalCap: 20,   // 20 req/s
    interval: 1000,
  }
  ```

- **OneRoster Queue** (if vendor throttles):
  ```typescript
  {
    concurrency: 5,    // Conservative
    intervalCap: 10,   // 10 req/s
    interval: 1000,
  }
  ```

---

## 🔍 Code Pattern: How to Add Protection

### Pattern 1: Simple Timeout + Retry (Most Common)

```typescript
import { fetchWithTimeout, FetchTimeoutError } from '@/lib/fetch-with-timeout';

const TOKEN_TIMEOUT_MS = 8000;
const DATA_TIMEOUT_MS = 15000;
const MAX_RETRIES = 1;

export async function GET(req: Request) {
  try {
    // Get token with timeout
    const tokenRes = await fetchWithTimeout(tokenUrl, {
      timeoutMs: TOKEN_TIMEOUT_MS,
    });
    
    const token = (await tokenRes.json()).accessToken;
    
    // Fetch data with timeout + retry
    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        const dataRes = await fetchWithTimeout(dataUrl, {
          headers: { Authorization: `Bearer ${token}` },
          timeoutMs: DATA_TIMEOUT_MS,
        });
        
        const data = await dataRes.json();
        return NextResponse.json({ ok: true, data });
        
      } catch (error) {
        if (attempt < MAX_RETRIES + 1 && error instanceof FetchTimeoutError) {
          // Retry on timeout
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
          continue;
        }
        throw error; // Give up
      }
    }
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 504 }
    );
  }
}
```

### Pattern 2: IDH Queue Integration

```typescript
import { idhQueue } from '@/lib/idh-queue';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

const IDH_TIMEOUT_MS = 12000;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sourceId = searchParams.get('sourceId');
  
  // Wrap IDH fetch in queue
  const idhRes = await idhQueue.execute(
    () => fetchWithTimeout(idhUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      timeoutMs: IDH_TIMEOUT_MS,
    }),
    { 
      studentId: sourceId,
      priority: 5 
    }
  );
  
  const data = await idhRes.json();
  return NextResponse.json({ ok: true, data });
}
```

### Pattern 3: Circuit Breaker (Phase 2)

```typescript
import { ppApiCircuitBreaker, CircuitBreakerError } from '@/lib/circuit-breaker';

export async function GET(req: Request) {
  try {
    const data = await ppApiCircuitBreaker.execute(async () => {
      // Existing fetch logic with timeout + retry
      return await fetchStudentProfile({ id, timeoutMs: 25000 });
    });
    
    return NextResponse.json({ ok: true, data });
    
  } catch (error) {
    if (error instanceof CircuitBreakerError) {
      // Circuit is OPEN - service is down
      return NextResponse.json({
        error: 'Service temporarily unavailable',
        retryAfter: error.stats.nextAttemptTime,
      }, { status: 503 });
    }
    
    throw error;
  }
}
```

---

## 📊 Expected Impact

### Error Reduction Targets

| Error Type | Current Rate (Per Week) | Target After Phase 1 | Target After Phase 2 |
|------------|------------------------|----------------------|----------------------|
| **IDH Timeout** | ~15 | <2 (87% ↓) | 0 (100% ↓) |
| **PP Timeout** | ~25 | <10 (60% ↓) | <5 (80% ↓) |
| **OneRoster Timeout** | ~10 | ~10 (no change) | <2 (80% ↓) |
| **429 Rate Limit** | 0 (fixed) | 0 | 0 |

### Performance Improvements

- **P50 Response Time**: No change (fast requests unaffected)
- **P95 Response Time**: May increase by 1-2s (due to queuing)
- **P99 Response Time**: Decrease by 50% (fewer hanging requests)
- **Error Rate**: Decrease by 70% overall

---

## ✅ Next Steps

1. **Review this audit** with team
2. **Prioritize Phase 1 fixes** (critical user-facing endpoints)
3. **Create GitHub issues** for each fix
4. **Implement in order**:
   - IDH endpoints (highest user impact)
   - PP ChildList (dashboard blocker)
   - PP status endpoints
   - OneRoster centralized fix
5. **Test in staging** before production
6. **Monitor metrics** for 48 hours post-deployment

---

**Last Updated**: December 11, 2025  
**Audit Performed By**: Development Team  
**Status**: 📝 Recommendations Ready for Implementation
