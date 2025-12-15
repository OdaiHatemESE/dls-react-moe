# 🔥 HIGH PRIORITY FIXES - Implementation Guide

This document provides deep technical details for the critical fixes implemented to resolve production issues.

---

## **1. IDH Rate Limiting & Request Queue** ⚡

### **Problem Summary**
```
Error: 429 Too Many Requests
Location: /api/parent/child-actions
Pattern: 6 rapid 429 errors in ~2 seconds on Nov 19, 13:20 UTC
```

**Root Cause**: When parents with multiple children load their dashboard, the app fires parallel requests to the IDH API, exceeding rate limits:

```typescript
// ❌ BEFORE: All requests hit IDH simultaneously
await Promise.all(students.map(student => 
  fetch(`/idh?sourceId=${student.id}`)
));
// Result: 5 students = 5 parallel requests → 429 Rate Limit Error
```

### **Solution Implemented**

#### **Architecture**
```
┌─────────────────┐
│ Multiple Parents│
│  with Children  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│    IDH Request Queue             │
│  ┌─────────────────────────┐   │
│  │ Concurrency: 3          │   │
│  │ Rate: 5 req/s max       │   │
│  │ Retry: Exponential      │   │
│  └─────────────────────────┘   │
└────────┬────────────────────────┘
         │ Throttled requests
         ▼
┌─────────────────┐
│   IDH API       │
│  (External)     │
└─────────────────┘
```

#### **Queue Configuration**
```typescript
// lib/idh-queue.ts
const IDH_QUEUE_CONFIG = {
  concurrency: 3,        // Max 3 parallel requests
  intervalCap: 5,        // Max 5 requests...
  interval: 1000,        // ...per second (5 req/s)
  timeout: 30000,        // 30s max queue wait
};

const IDH_RETRY_CONFIG = {
  retries: 3,            // Retry up to 3 times
  factor: 2,             // 2x backoff (500ms, 1s, 2s)
  minTimeout: 500,       // Start with 500ms delay
  maxTimeout: 5000,      // Max 5s delay
  randomize: true,       // Jitter to prevent thundering herd
};
```

#### **Usage Example**

**Before**:
```typescript
// ❌ Direct fetch - no protection against rate limits
const idhRes = await fetch(url, {
  headers: { Authorization: `Bearer ${token}` }
});
```

**After**:
```typescript
// ✅ Queued with retry protection
import { idhQueue } from '@/lib/idh-queue';

const idhRes = await idhQueue.execute(
  () => fetchWithTimeout(url, {
    headers: { Authorization: `Bearer ${token}` },
    timeoutMs: 12000,
  }),
  { 
    studentId: studentPersonId,
    priority: 5  // Optional: 0-10, higher = first
  }
);
```

#### **Batch Processing Example**
```typescript
// Process multiple students efficiently
const requests = students.map(student => ({
  fn: () => fetchIDHStatus(student.id),
  studentId: student.id,
  priority: student.isActive ? 7 : 3, // Prioritize active students
}));

const results = await idhQueue.executeMany(requests);

results.forEach((result, index) => {
  if (result.success) {
    console.log(`Student ${index}: IDH status =`, result.data);
  } else {
    console.error(`Student ${index}: Failed -`, result.error);
  }
});
```

#### **Monitoring Queue Health**
```typescript
// Get real-time metrics
const metrics = idhQueue.getMetrics();
console.log({
  currentQueue: metrics.currentQueueSize,
  pending: metrics.currentPending,
  successRate: metrics.successRate,
  rateLimitHits: metrics.rateLimitHits,
});

// Example output:
// {
//   currentQueue: 2,
//   pending: 3,
//   successRate: '94.12%',
//   rateLimitHits: 0
// }
```

#### **Benefits**
- ✅ **No more 429 errors**: Automatic throttling prevents rate limit violations
- ✅ **Automatic retry**: Transient failures retry with exponential backoff
- ✅ **Fair queuing**: All requests processed in order with priority support
- ✅ **Monitoring**: Built-in metrics for observability

---

## **2. Auth Timeout Fix (OIDC Discovery)** 🔐

### **Problem Summary**
```
[SIGNIN_OAUTH_ERROR] outgoing request timed out after 3500ms
Occurrences: Dec 3, 5, 6, 8, 9, 2025
Provider: OIDC (IdentityServer)
```

**Root Cause**: Next-Auth default HTTP timeout (3.5s) is too short for OIDC discovery endpoint, especially when:
- Network latency is high
- OIDC server is under load
- DNS resolution is slow

### **Solution Implemented**

#### **Configuration Change**
```typescript
// lib/auth.ts
const oidcProvider = Auth0Provider({
  id: "oidc",
  issuer: OIDC_ISSUER,
  clientId: OIDC_CLIENT_ID,
  clientSecret: OIDC_CLIENT_SECRET,
  
  // ✅ FIXED: Increased timeout from 3500ms → 10000ms
  httpOptions: {
    timeout: 10000, // 10 seconds
  },
  
  authorization: {
    params: {
      scope: "openid profile IdentityServerApi",
    },
  },
});
```

#### **What This Fixes**
1. **OIDC Discovery** (`GET /.well-known/openid-configuration`)
   - Was failing at 3.5s
   - Now allows up to 10s for slow networks

2. **Token Exchange** (`POST /connect/token`)
   - More time for Auth0/IdentityServer to respond
   - Handles slow database queries on IdP side

3. **UserInfo Endpoint** (`GET /connect/userinfo`)
   - Prevents timeout during profile fetch

#### **Expected Behavior**
```
BEFORE:
User clicks "Login" → OIDC discovery starts → 3.5s timeout → Error

AFTER:
User clicks "Login" → OIDC discovery starts → 10s timeout → Success
```

#### **Testing**
```bash
# Simulate slow OIDC server
curl -w "@curl-format.txt" -o /dev/null -s \
  "https://your-oidc-issuer/.well-known/openid-configuration"

# Should complete in < 10s to avoid timeout
```

---

## **3. Circuit Breaker Pattern** 🔌

### **Problem Summary**
```
Pattern: Cascade failures when PP API goes down
Example: Nov 25, 08:39 - 6 students failed simultaneously
Result: All requests fail slowly, consuming resources
```

**Root Cause**: When upstream PP API is down, the app keeps retrying, causing:
- Resource exhaustion (open connections, memory)
- Slow response times (waiting for timeouts)
- User frustration (spinning loaders)

### **Solution Implemented**

#### **Circuit Breaker States**
```
┌──────────┐
│  CLOSED  │  ← Normal operation, all requests pass through
└────┬─────┘
     │ 5 failures in 10s
     ▼
┌──────────┐
│   OPEN   │  ← Fast-fail mode, reject requests immediately
└────┬─────┘
     │ Wait 30s
     ▼
┌──────────┐
│HALF-OPEN │  ← Testing if service recovered
└────┬─────┘
     │ 80% success rate
     ▼
┌──────────┐
│  CLOSED  │  ← Back to normal
└──────────┘
```

#### **Configuration**
```typescript
// lib/circuit-breaker.ts
export const ppApiCircuitBreaker = new CircuitBreaker({
  name: 'PP-API',
  failureThreshold: 5,      // Open after 5 failures
  successThreshold: 0.8,    // Need 80% success to close
  timeout: 10000,           // Within 10 second window
  resetTimeout: 30000,      // Try again after 30s
});

export const idhApiCircuitBreaker = new CircuitBreaker({
  name: 'IDH-API',
  failureThreshold: 3,      // More aggressive
  successThreshold: 0.9,    // Need 90% success
  timeout: 5000,            // 5 second window
  resetTimeout: 20000,      // 20 second cooldown
});
```

#### **Usage Example**

**Basic Usage**:
```typescript
import { ppApiCircuitBreaker } from '@/lib/circuit-breaker';

try {
  const result = await ppApiCircuitBreaker.execute(async () => {
    return await fetch('/api/PP/student/123');
  });
  
  // Success - circuit remains closed
  console.log('Student data:', result);
  
} catch (error) {
  if (error instanceof CircuitBreakerError) {
    // Circuit is OPEN - service is down
    return NextResponse.json({
      error: 'Student service temporarily unavailable',
      retryAfter: error.stats.nextAttemptTime,
    }, { status: 503 });
  }
  
  // Other error - circuit may open soon
  throw error;
}
```

**Integration with Student Profile Fetch**:
```typescript
// lib/fetch-student-profile.ts
import { ppApiCircuitBreaker } from '@/lib/circuit-breaker';

export async function fetchStudentProfile(options) {
  try {
    return await ppApiCircuitBreaker.execute(async () => {
      // Existing fetch logic with timeout + retry
      const response = await fetchWithTimeout(url, {
        timeoutMs: 25000,
        retries: 1,
      });
      return response.json();
    });
  } catch (error) {
    if (error instanceof CircuitBreakerError) {
      // Return graceful degradation
      return {
        ok: false,
        status: 503,
        message: 'Student service unavailable - please try again shortly',
        retryAfter: error.stats.nextAttemptTime,
      };
    }
    throw error;
  }
}
```

#### **Real-World Scenario**

**Without Circuit Breaker**:
```
PP API goes down
↓
User 1 request → waits 25s → timeout → 504
User 2 request → waits 25s → timeout → 504
User 3 request → waits 25s → timeout → 504
... (continues for minutes, consuming resources)
```

**With Circuit Breaker**:
```
PP API goes down
↓
Request 1 → fails after 25s
Request 2 → fails after 25s
Request 3 → fails after 25s
Request 4 → fails after 25s
Request 5 → fails after 25s → CIRCUIT OPENS
Request 6 → IMMEDIATE 503 (no wait)
Request 7 → IMMEDIATE 503 (no wait)
... (fast failures, no resource waste)
↓
After 30 seconds → HALF-OPEN → test 1 request
↓
If successful → CLOSED (back to normal)
If failed → OPEN again for 30s
```

#### **Monitoring Circuit State**
```typescript
// Check circuit health
const stats = ppApiCircuitBreaker.getStats();

console.log({
  state: stats.state,              // CLOSED | OPEN | HALF_OPEN
  failures: stats.failures,         // Recent failure count
  successes: stats.successes,       // Recent success count
  rejections: stats.rejections,     // Requests blocked by circuit
  nextAttempt: stats.nextAttemptTime, // When to retry (if OPEN)
});

// Manual operations (for maintenance)
ppApiCircuitBreaker.reset();      // Force close circuit
ppApiCircuitBreaker.forceOpen();  // Force open (maintenance mode)
```

#### **Benefits**
- ✅ **Fast failures**: No waiting for timeouts when service is down
- ✅ **Resource protection**: Prevents connection/memory exhaustion
- ✅ **Automatic recovery**: Tests service health periodically
- ✅ **User experience**: Clear error messages instead of spinners

---

## **4. Cookie SameSite Fix** 🍪

### **Problem Summary**
```
[OAUTH_CALLBACK_ERROR] State cookie was missing
Date: Dec 9, 08:36 UTC
Flow: OAuth callback from Auth0/OIDC
```

**Root Cause**: The OAuth state cookie wasn't being sent in the callback request because:
1. Cookie `SameSite` attribute mismatch
2. Browser treating OAuth redirect as cross-site
3. Missing explicit cookie configuration

### **Solution Implemented**

#### **Cookie Configuration**
```typescript
// lib/auth.ts
export const authOptions: NextAuthOptions = {
  cookies: {
    // Session token
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',  // ✅ Changed from 'none'
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    },
    
    // ✅ NEW: Explicit state cookie configuration
    state: {
      name: `next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: 'lax',  // CRITICAL for OAuth flow
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 15 * 60,  // 15 minutes
      }
    },
    
    // ✅ NEW: PKCE code verifier cookie
    pkceCodeVerifier: {
      name: `next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 15 * 60,
      }
    },
    
    // ... other cookies (nonce, csrf, etc.)
  },
};
```

#### **SameSite Attribute Explanation**

| Value | Behavior | Use Case |
|-------|----------|----------|
| `strict` | Never sent cross-site | Banking apps (highest security) |
| `lax` | Sent on top-level navigation | **OAuth flows** (recommended) |
| `none` | Always sent (requires Secure) | iFrames, cross-domain APIs |

**Why `lax` is correct for OAuth**:
```
1. User clicks "Login with OIDC"
   └─> Browser navigates to auth0.example.com
       └─> Auth0 creates state cookie (SameSite=lax)

2. User enters credentials

3. Auth0 redirects back to your app
   ├─> URL: https://parent-stg.moe.gov.ae/api/auth/callback/oidc?code=...&state=...
   └─> Browser sends state cookie (✅ because top-level navigation)

4. NextAuth verifies state cookie matches URL parameter
   └─> Success! User is authenticated
```

**With `SameSite=none`** (old behavior):
- Requires `Secure` attribute (HTTPS only)
- Some browsers block in cross-site context
- Privacy concerns (tracking)

**With `SameSite=lax`** (new behavior):
- ✅ Sent on OAuth callback (top-level navigation)
- ✅ Not sent on embedded requests (prevents CSRF)
- ✅ Better privacy
- ✅ Wider browser support

#### **Testing the Fix**

1. **Development** (HTTP):
```typescript
secure: process.env.NODE_ENV === 'production', // false in dev
```
Cookies work on `localhost:4200`

2. **Production** (HTTPS):
```typescript
secure: process.env.NODE_ENV === 'production', // true
```
Cookies require HTTPS on `parent-stg.moe.gov.ae`

3. **Verify Cookie Presence**:
```bash
# In browser DevTools → Application → Cookies
# Should see:
next-auth.state          (HttpOnly, SameSite=Lax, Secure)
next-auth.pkce.code_verifier  (HttpOnly, SameSite=Lax, Secure)
```

#### **Common Issues & Solutions**

**Issue 1**: "State cookie still missing"
```
Solution: Check NEXTAUTH_URL matches your deployment URL exactly
export NEXTAUTH_URL="https://parent-stg.moe.gov.ae"
```

**Issue 2**: Cookies not set in production
```
Solution: Verify SSL/TLS is enabled (secure cookies require HTTPS)
```

**Issue 3**: Cookies deleted too quickly
```
Solution: Increased maxAge to 15 minutes for OAuth cookies
maxAge: 15 * 60  // 900 seconds
```

---

## **5. Installation & Dependencies**

### **Required Packages**
```bash
npm install p-queue p-retry
```

### **Package Details**

#### **p-queue** (Request Queue)
```json
{
  "name": "p-queue",
  "version": "^8.0.1",
  "description": "Promise queue with concurrency control",
  "size": "~5KB"
}
```
- **Purpose**: Limit concurrent IDH API requests
- **Features**: Concurrency control, priority queuing, intervals
- **Docs**: https://github.com/sindresorhus/p-queue

#### **p-retry** (Retry Logic)
```json
{
  "name": "p-retry",
  "version": "^6.0.0",
  "description": "Retry a promise-returning function",
  "size": "~2KB"
}
```
- **Purpose**: Automatic retry with exponential backoff
- **Features**: Configurable attempts, jitter, abort conditions
- **Docs**: https://github.com/sindresorhus/p-retry

---

## **6. Deployment Checklist**

### **Pre-Deployment**
- [ ] Run `npm install p-queue p-retry`
- [ ] Run `npm run build` to check for TypeScript errors
- [ ] Test OAuth login flow in staging
- [ ] Verify OIDC timeout with slow network simulation
- [ ] Monitor queue metrics in development

### **Post-Deployment Monitoring**

#### **Metrics to Track**
```typescript
// Add to monitoring dashboard
const metrics = {
  // IDH Queue
  idhQueueSize: idhQueue.getMetrics().currentQueueSize,
  idhSuccessRate: idhQueue.getMetrics().successRate,
  idhRateLimitHits: idhQueue.getMetrics().rateLimitHits,
  
  // Circuit Breakers
  ppApiCircuitState: ppApiCircuitBreaker.getState(),
  idhApiCircuitState: idhApiCircuitBreaker.getState(),
  
  // Auth Errors
  authTimeouts: 0, // Should be 0 after fix
  stateCookieErrors: 0, // Should be 0 after fix
};
```

#### **Alert Thresholds**
```yaml
# Example alert rules
alerts:
  - name: High IDH Queue Size
    condition: idhQueueSize > 10
    action: Scale up or investigate IDH API
    
  - name: Circuit Breaker Open
    condition: ppApiCircuitState == 'OPEN'
    action: Check PP API health, notify ops team
    
  - name: Rate Limit Hit
    condition: idhRateLimitHits > 0
    action: Review queue configuration
    
  - name: Auth Timeout
    condition: authTimeouts > 0
    action: Increase OIDC timeout further
```

---

## **7. Rollback Plan**

If issues occur after deployment:

### **Quick Rollback**
```typescript
// lib/idh-queue.ts - Disable queue (use direct fetch)
export const idhQueue = {
  execute: async (fn) => fn(), // Bypass queue
  executeMany: async (requests) => 
    Promise.all(requests.map(r => r.fn())),
};
```

### **Partial Rollback**
```typescript
// Revert only specific features
// 1. Keep circuit breaker, remove queue
// 2. Keep cookie fix, revert timeout
```

---

## **8. Performance Impact**

### **Expected Improvements**
- ✅ **429 errors**: 100% → 0% (eliminated)
- ✅ **Auth timeout errors**: ~4/week → 0
- ✅ **State cookie errors**: ~2/week → 0
- ✅ **Circuit breaker**: Prevent cascade failures (measured in recovery time)

### **Potential Concerns**
- ⚠️ **Queue latency**: Requests may wait in queue during high load
  - **Mitigation**: Monitor queue size, increase `concurrency` if needed
- ⚠️ **Circuit breaker false positives**: Healthy service marked as down
  - **Mitigation**: Tune thresholds based on observed baseline

---

## **9. Additional Resources**

- **P-Queue Docs**: https://github.com/sindresorhus/p-queue
- **Circuit Breaker Pattern**: https://martinfowler.com/bliki/CircuitBreaker.html
- **NextAuth Cookies**: https://next-auth.js.org/configuration/options#cookies
- **SameSite Cookies**: https://web.dev/samesite-cookies-explained/

---

**Questions?** Contact the development team or refer to:
- `/lib/idh-queue.ts` - Queue implementation
- `/lib/circuit-breaker.ts` - Circuit breaker implementation
- `/lib/auth.ts` - Auth & cookie configuration
