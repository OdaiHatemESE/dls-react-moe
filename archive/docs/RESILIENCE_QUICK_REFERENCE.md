# API Resilience - Quick Reference Guide

**Last Updated**: December 2025  
**Status**: Production Ready

---

## Overview

Complete resilience protection across all 36 API endpoints using:
- ⏱️ **Timeouts** - Prevent indefinite hangs
- 🔄 **Retries** - Handle transient failures
- 🚦 **Circuit Breakers** - Fast-fail during outages
- 📊 **Rate Limiting** - Prevent 429 errors (IDH only)

---

## Protection Patterns by Service

### PP API (Parent Portal)
**Pattern**: Timeout + Retry + Circuit Breaker

```typescript
import { fetchWithTimeout, FetchTimeoutError } from '@/lib/fetch-with-timeout';
import { ppApiCircuitBreaker, CircuitBreakerError } from '@/lib/circuit-breaker';

const MAX_RETRIES = 1;
const TIMEOUT_MS = 25000; // Adjust per endpoint

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

**Configuration**:
- Circuit Breaker: 5 failures → OPEN, 60s cooldown, 2 successes → CLOSED
- Timeout: 10-30s depending on endpoint complexity
- Retry: 1 attempt with 500ms backoff

**Endpoints Using This Pattern**:
- `/api/PP/student/[id]` (25s timeout)
- `/api/PP/student/[id]/enrollments` (25s timeout)
- `/api/PP/school/[id]` (10s timeout)
- `/api/PP/persons` (30s timeout)
- `/lib/fetch-student-profile.ts` (25s timeout)

---

### OneRoster API
**Pattern**: Centralized Timeout via `orFetch()`

```typescript
import { orFetch } from '@/lib/oneroster';

// Default 15s timeout
const student = await orFetch<Student>('/students/SST-1-1-Pers-521025');

// Custom timeout
const student = await orFetch<Student>('/students/SST-1-1-Pers-521025', 'read', {
  timeoutMs: 20000, // 20 seconds
});
```

**Configuration**:
- Default timeout: 15s
- Retry: Built-in retry on 401/403 (token refresh)
- Circuit breaker: Optional (can add `oneRosterCircuitBreaker` if needed)

**All OneRoster Endpoints Protected** (via `orFetch`):
- `/api/oneroster/students/[id]`
- `/api/oneroster/classes/[sourcedId]`
- `/api/oneroster/enrollments`
- `/api/oneroster/orgs/[sourcedId]`
- `/api/oneroster/persons`
- `/api/oneroster/classes/student/[studentSourcedId]`
- `/api/oneroster/basic-info-full`

---

### IDH API (Student Status/Transportation)
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

**Configuration**:
- Queue: 3 concurrent, 5 requests/second max
- Timeout: GET 12s, POST 15s
- Retry: POST only (1 attempt, 1s backoff)
- Circuit breaker: Optional (can add `idhApiCircuitBreaker` if needed)

**Endpoints Using This Pattern**:
- `/api/backoffice/idh` (GET + POST)
- `/api/parent/child-actions` (uses queue for parallel requests)

---

## Timeout Configuration Reference

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
| **Auth** |
| OIDC discovery | 10s | No | No | No |

---

## Circuit Breaker States

### ppApiCircuitBreaker
- **Threshold**: 5 consecutive failures
- **Timeout**: 25s per request
- **Open Duration**: 60s
- **Half-Open Requests**: 3 test requests
- **Success Threshold**: 2 successes to close

**State Transitions**:
```
CLOSED (normal)
  ↓ (5 failures)
OPEN (fast-fail, return 503)
  ↓ (after 60s)
HALF_OPEN (test recovery with 3 requests)
  ↓ (2 successes)
CLOSED (recovered)
```

### idhApiCircuitBreaker
- **Threshold**: 3 consecutive failures
- **Timeout**: 15s per request
- **Open Duration**: 30s
- **Half-Open Requests**: 2 test requests
- **Success Threshold**: 2 successes to close

### oneRosterCircuitBreaker
- **Threshold**: 5 consecutive failures
- **Timeout**: 15s per request
- **Open Duration**: 45s
- **Half-Open Requests**: 3 test requests
- **Success Threshold**: 2 successes to close

**Check Circuit Breaker State**:
```typescript
const stats = ppApiCircuitBreaker.getStats();
console.log({
  state: stats.state, // 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  failures: stats.failures,
  successes: stats.successes,
  nextAttempt: stats.nextAttemptTime,
});
```

---

## Queue Configuration

### idhQueue (IDH API Rate Limiting)
```typescript
const idhQueue = new IdhQueueManager({
  concurrency: 3,           // Max 3 simultaneous requests
  intervalCap: 5,          // Max 5 requests per interval
  interval: 1000,          // 1 second interval
  retryOptions: {
    retries: 3,            // Retry up to 3 times
    minTimeout: 1000,      // Start with 1s delay
    maxTimeout: 5000,      // Max 5s delay
    factor: 2,             // Exponential backoff (1s, 2s, 4s)
    onFailedAttempt: (error) => {
      console.log(`Retry attempt ${error.attemptNumber} failed:`, error.message);
    },
  },
});
```

**Usage**:
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

**Metrics**:
```typescript
const metrics = idhQueue.getMetrics();
console.log({
  pending: metrics.pending,      // Requests waiting in queue
  active: metrics.active,        // Currently executing
  completed: metrics.completed,  // Total completed
  failed: metrics.failed,        // Total failed
});
```

---

## Error Handling Reference

### Error Types

1. **FetchTimeoutError**
   - Thrown by: `fetchWithTimeout()`
   - HTTP Status: 504 Gateway Timeout
   - Action: Retry if retry logic enabled
   - Message: "Request timed out after Xms"

2. **CircuitBreakerError**
   - Thrown by: Circuit breaker in OPEN state
   - HTTP Status: 503 Service Unavailable
   - Action: Fast-fail, don't retry
   - Message: "Circuit breaker is OPEN"

3. **QueueTimeoutError**
   - Thrown by: IDH queue after max retries
   - HTTP Status: 504 Gateway Timeout
   - Action: Already retried, return error
   - Message: "Request failed after X retries"

### Error Response Patterns

```typescript
// Pattern 1: Circuit Breaker Error
if (error instanceof CircuitBreakerError) {
  return NextResponse.json(
    { error: 'Service temporarily unavailable. Please try again shortly.' },
    { status: 503 }
  );
}

// Pattern 2: Timeout Error
if (error instanceof FetchTimeoutError) {
  return NextResponse.json(
    { error: 'Request timed out. Please try again.' },
    { status: 504 }
  );
}

// Pattern 3: Upstream Error
if (!response.ok) {
  return NextResponse.json(
    { error: `Upstream service returned ${response.status}` },
    { status: response.status }
  );
}
```

---

## Adding Resilience to New Endpoints

### Step 1: Identify Service Type

- **PP API** → Use PP pattern (timeout + retry + circuit breaker)
- **OneRoster** → Use `orFetch()` (automatic timeout)
- **IDH** → Use IDH pattern (timeout + queue + retry for POST)
- **Internal** → Usually no timeout needed

### Step 2: Add Imports

```typescript
import { fetchWithTimeout, FetchTimeoutError } from '@/lib/fetch-with-timeout';
import { ppApiCircuitBreaker, CircuitBreakerError } from '@/lib/circuit-breaker';
```

### Step 3: Choose Timeout Value

| Endpoint Type | Recommended Timeout |
|---------------|---------------------|
| Token fetch | 8s |
| Simple lookup (school, org) | 10-15s |
| Complex data (student profile) | 25s |
| Batch operation (enrollments) | 30s |
| IDH status check | 12s |
| IDH update | 15s |

### Step 4: Add Retry (If Applicable)

```typescript
const MAX_RETRIES = 1; // Usually 1 retry is enough

for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
  try {
    // Your fetch logic here
    break; // Success, exit loop
  } catch (error) {
    if (attempt < MAX_RETRIES + 1 && error instanceof FetchTimeoutError) {
      await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      continue;
    }
    throw error; // Not a timeout or last attempt
  }
}
```

### Step 5: Add Circuit Breaker (If External Service)

```typescript
try {
  const result = await ppApiCircuitBreaker.execute(async () => {
    // Your fetch + retry logic here
  });
} catch (error) {
  if (error instanceof CircuitBreakerError) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
  // Handle other errors
}
```

### Step 6: Test

1. Normal operation → Should work as before
2. Slow response (>timeout) → Should return 504
3. 5 consecutive failures → Circuit breaker opens, instant 503
4. Wait 60s → Circuit breaker tests recovery
5. Transient error → Retry succeeds

---

## Monitoring Checklist

### Daily Checks
- [ ] Check 504 error rate (target: <10/day)
- [ ] Check circuit breaker activations (should correlate with known outages)
- [ ] Check retry success rate (target: >60%)

### Weekly Review
- [ ] Analyze timeout patterns by endpoint
- [ ] Review circuit breaker metrics
- [ ] Identify slow endpoints (candidates for timeout tuning)
- [ ] Check queue metrics (IDH only)

### Metrics Dashboard Queries

**Timeout Error Rate**:
```sql
SELECT COUNT(*) as timeout_errors
FROM error_logs
WHERE status = 504
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY DATE(timestamp)
```

**Circuit Breaker State**:
```sql
SELECT 
  circuit_name,
  state,
  failures,
  last_state_change
FROM circuit_breaker_events
ORDER BY last_state_change DESC
LIMIT 10
```

**Retry Success Rate**:
```sql
SELECT 
  endpoint,
  COUNT(CASE WHEN retry_attempt > 0 AND status = 200 THEN 1 END) as retry_success,
  COUNT(CASE WHEN retry_attempt > 0 THEN 1 END) as total_retries,
  (retry_success::float / NULLIF(total_retries, 0) * 100) as success_rate
FROM request_logs
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY endpoint
```

---

## Troubleshooting Guide

### Problem: All requests returning 503

**Possible Cause**: Circuit breaker stuck in OPEN state

**Solution**:
1. Check circuit breaker stats: `ppApiCircuitBreaker.getStats()`
2. If OPEN, wait for cooldown period (60s for ppApi)
3. Verify upstream service is healthy
4. If upstream recovered but circuit still open, restart app (last resort)

**Prevention**: Ensure upstream issues are resolved before circuit reopens

---

### Problem: Frequent 504 timeouts on specific endpoint

**Possible Cause**: Timeout too short for endpoint complexity

**Solution**:
1. Check P95 response time for that endpoint
2. If P95 > timeout, increase timeout by 50%
3. Example: If timeout=10s and P95=12s, increase to 15s
4. Update timeout constant in route file
5. Deploy and monitor

**Prevention**: Set timeouts to P95 + 20% buffer

---

### Problem: Queue backing up (IDH)

**Possible Cause**: Too many parallel requests to IDH API

**Solution**:
1. Check queue metrics: `idhQueue.getMetrics()`
2. If `pending > 50`, reduce parallelism in caller
3. Verify rate limit is not being hit (check IDH API logs for 429)
4. Consider increasing `concurrency` if IDH can handle it

**Prevention**: Use `executeMany()` instead of parallel Promise.all()

---

### Problem: Circuit breaker opening unnecessarily

**Possible Cause**: Threshold too low or transient failures

**Solution**:
1. Check failure pattern - are they consecutive or sporadic?
2. If consecutive, upstream has real issue
3. If sporadic, increase `failureThreshold` (current: 5 for PP, 3 for IDH)
4. Consider increasing `timeout` if failures are timeout-related

**Prevention**: Tune thresholds based on actual error patterns

---

## Configuration Files Reference

### Timeout Constants Location
```typescript
// Token fetch (used by all PP endpoints)
const TOKEN_TIMEOUT_MS = 8000; // app/api/PP/*/route.ts

// PP API endpoints
const PROFILE_TIMEOUT_MS = 25000; // app/api/PP/student/[id]/route.ts
const CHILDLIST_TIMEOUT_MS = 20000; // app/api/PP/ChildList/[eid]/route.ts
const SCHOOL_TIMEOUT_MS = 10000; // app/api/PP/school/[id]/route.ts
const PERSONS_TIMEOUT_MS = 30000; // app/api/PP/persons/route.ts
const STATUS_TIMEOUT_MS = 15000; // app/api/PP/*-status/*/route.ts

// IDH API
const IDH_GET_TIMEOUT_MS = 12000; // app/api/backoffice/idh/route.ts
const IDH_POST_TIMEOUT_MS = 15000; // app/api/backoffice/idh/route.ts

// OneRoster (centralized)
const ONEROSTER_TIMEOUT_MS = 15000; // lib/oneroster.ts (default)
```

### Circuit Breaker Configuration
```typescript
// lib/circuit-breaker.ts
export const ppApiCircuitBreaker = new CircuitBreaker('ppApi', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 25000,
  openDuration: 60000,
  halfOpenRequests: 3,
});

export const idhApiCircuitBreaker = new CircuitBreaker('idhApi', {
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 15000,
  openDuration: 30000,
  halfOpenRequests: 2,
});

export const oneRosterCircuitBreaker = new CircuitBreaker('oneRosterApi', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 15000,
  openDuration: 45000,
  halfOpenRequests: 3,
});
```

### Queue Configuration
```typescript
// lib/idh-queue.ts
export const idhQueue = new IdhQueueManager({
  concurrency: 3,
  intervalCap: 5,
  interval: 1000,
  retryOptions: {
    retries: 3,
    minTimeout: 1000,
    maxTimeout: 5000,
    factor: 2,
  },
});
```

---

## Quick Decision Tree

**Adding timeout/retry to new endpoint?**

```
Is it an external API call?
├─ Yes → Which service?
│  ├─ PP API → Use PP pattern (timeout + retry + circuit breaker)
│  ├─ OneRoster → Use orFetch() (automatic timeout)
│  ├─ IDH → Use IDH pattern (timeout + queue)
│  └─ Other → Start with timeout only, add retry if needed
└─ No → No timeout needed (internal/cache/database)

Is it user-facing (parent dashboard)?
├─ Yes → Add retry (1 attempt) for better UX
└─ No → Timeout only is fine

Is it a critical service?
├─ Yes → Add circuit breaker for fast-fail
└─ No → Timeout + retry is sufficient
```

---

## Summary

✅ **All 36 endpoints protected**  
✅ **3 circuit breakers configured** (PP, IDH, OneRoster)  
✅ **1 rate-limiting queue** (IDH)  
✅ **Consistent error handling** across all services  
✅ **Production ready** with comprehensive testing & monitoring

**Remember**: The goal is **graceful degradation**, not perfection. Timeouts, retries, and circuit breakers ensure users see clear error messages instead of infinite loading.
