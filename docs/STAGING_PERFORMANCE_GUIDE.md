# Staging Performance Debugging Guide

## Current Observations

Based on logs, the **PP API Gateway** (`api-gw-uat.moe.gov.ae`) is responding slowly in the staging environment.

### Typical Timings

```
Local Development (good):
- Token fetch: 50-200ms
- IDH API call: 500-2000ms
- Total: < 3 seconds

Staging Environment (observed):
- Token fetch: 200-500ms  ✅ Acceptable
- IDH API call: 5000-8000ms  ⚠️ SLOW but within limits
- Total: 5-9 seconds
```

## What the Logs Tell You

### 1. Queue Status
```log
[IDH Queue] Status: {
  queued: 0,        // ✅ No requests waiting
  pending: 1,       // ✅ Only 1 active request
  successRate: '100%'  // ✅ All requests succeeding
}
```

**Interpretation:**
- ✅ **No congestion** - queue is working efficiently
- ✅ **Not a rate limiting issue** - rateLimitHits: 0
- ✅ **Requests are succeeding** - not timing out

### 2. Slow Request Warnings
```log
[IDH Queue] Slow request detected {
  studentId: 'SST-1-1-Pers-4523664',
  duration: '5880ms',
  queueWait: '0ms'
}
```

**Interpretation:**
- ⚠️ **External API is slow** - 5.8 seconds for the actual HTTP request
- ✅ **Not a queue issue** - queueWait is 0ms (didn't wait in queue)
- ⚠️ **Network/API latency** - the PP API gateway is taking time to respond

### 3. New Enhanced Logs (After Latest Changes)

You'll now see these additional logs:

```log
[IDH Queue] Request waited in queue {
  waitTime: '150ms'  // Time spent waiting before execution
}

[IDH Queue] API call timing {
  apiCallDuration: '5200ms'  // Actual time for HTTP request
}

[IDH Queue] Request completed {
  duration: '5350ms',
  status: 'acceptable'  // 5-8s is acceptable for staging
}
```

## Configuration Changes Made

### Timeout Increases
| Component | Before | After | Reason |
|-----------|--------|-------|--------|
| IDH Timeout (prod) | 12s | 18s | PP API gateway is slow in staging |
| Queue Timeout | 30s | 45s | Allow for slower external API + retries |
| Slow Request Threshold | 5s | 8s | Reduce noise in logs |

### Queue Configuration
- **Concurrency**: 3 parallel requests (unchanged)
- **Rate limit**: 5 requests/second (unchanged)
- **Retry attempts**: 2 (reduced from 3 to prevent queue timeout)
- **Retry backoff**: 1-3 seconds (faster than before)

## Is This a Problem?

### ✅ **NOT a problem if:**
- Success rate is > 95%
- Users aren't complaining about timeouts
- Requests complete within 10 seconds
- Queue isn't backing up (queued: 0, pending: < 5)

### 🔴 **IS a problem if:**
- Many requests timing out (> 18 seconds)
- Queue growing (queued > 10)
- Success rate dropping (< 90%)
- Many circuit breaker openings

## Current Status: ✅ ACCEPTABLE

Based on your logs:
- ✅ Requests completing in 5-8 seconds
- ✅ 100% success rate
- ✅ No queue congestion
- ✅ No rate limiting issues

**Conclusion:** The PP API gateway is slow, but the system is handling it correctly with appropriate timeouts and retries.

## What You Can Do

### Option 1: Accept Current Performance ✅ Recommended
- 5-8 second response times are reasonable for staging
- All requests are succeeding
- No user-facing errors
- **Action:** Monitor and do nothing

### Option 2: Investigate PP API Performance
- Contact the team managing `api-gw-uat.moe.gov.ae`
- Ask why IDH endpoint takes 5-8 seconds
- Check if they can optimize
- **Action:** Open ticket with PP API team

### Option 3: Add Caching (Future Enhancement)
- Cache IDH status for 5-10 minutes
- Dramatically reduce API calls
- Much faster responses for repeated requests
- **Action:** Implement Redis caching layer

## Monitoring

### Use the Debug Tools

1. **Visual Monitor:**
   ```
   https://parent-stg.moe.gov.ae/debug/staging-monitor
   ```
   - Real-time performance testing
   - Color-coded results
   - Detailed timing breakdown

2. **API Endpoint:**
   ```bash
   curl "https://parent-stg.moe.gov.ae/api/debug/pp-connection?studentPersonId=SST-1-1-Pers-1687158&detailed=true"
   ```

3. **PM2 Logs:**
   ```bash
   # On staging server
   pm2 logs PPApp-st --lines 100 | grep "IDH"
   ```

### What to Watch For

**Normal (5-8 seconds):**
```log
[IDH Queue] API call timing { apiCallDuration: '5200ms', status: 'completed' }
[IDH Queue] Request completed { duration: '5350ms', status: 'acceptable' }
```

**Warning (8-15 seconds):**
```log
[IDH Queue] Slow request detected { totalDuration: '12000ms' }
```

**Critical (> 18 seconds):**
```log
[IDH Queue] Request failed after retries { error: 'Request timeout after 18000ms' }
Request failed { duration: 18543, message: 'Request timed out' }
```

## Summary

Your staging environment is **working correctly**. The PP API gateway is slow (5-8 seconds), but:
- ✅ Within configured timeout limits
- ✅ All requests succeeding
- ✅ No queue congestion
- ✅ Appropriate error handling in place

The timeout configuration changes ensure the system can handle this slow API without throwing errors.
