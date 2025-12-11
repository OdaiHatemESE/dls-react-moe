# 🎯 Quick Reference: Production Error Fixes

**Date**: December 2025  
**Priority**: HIGH  
**Status**: ✅ IMPLEMENTED

---

## 📋 TL;DR - What Was Fixed

| Error | Cause | Fix | Status |
|-------|-------|-----|--------|
| **429 Rate Limit** | Parallel IDH requests | Request queue (3 concurrent, 5 req/s) | ✅ Complete |
| **Auth Timeout** | OIDC discovery timeout at 3.5s | Increased to 10s | ✅ Complete |
| **State Cookie Missing** | Cookie not persisting in OAuth flow | Added explicit `sameSite: 'lax'` config | ✅ Complete |
| **504 Timeout** | PP API slow during peak hours | Timeout 15s→25s + retry logic | ✅ Complete |
| **Cascade Failures** | PP API down causes resource exhaustion | Circuit breaker pattern | ⏳ Ready (not integrated yet) |

---

## 🚀 Quick Start - Using New Features

### 1. IDH Queue (Already Integrated)
```typescript
import { idhQueue } from '@/lib/idh-queue';

// Automatic throttling + retry
const idhData = await idhQueue.execute(
  () => fetch('/idh/student/123'),
  { studentId: '123', priority: 5 }
);
```

**Metrics**:
```typescript
const metrics = idhQueue.getMetrics();
console.log(metrics.successRate);  // "95.35%"
console.log(metrics.rateLimitHits); // Should be 0
```

### 2. Circuit Breaker (Ready to Integrate)
```typescript
import { ppApiCircuitBreaker } from '@/lib/circuit-breaker';

try {
  const data = await ppApiCircuitBreaker.execute(
    () => fetch('/api/PP/student/123')
  );
} catch (error) {
  if (error instanceof CircuitBreakerError) {
    // Circuit OPEN - service is down, fail fast
    return { error: 'Service unavailable', status: 503 };
  }
  throw error;
}
```

**Check Status**:
```typescript
const stats = ppApiCircuitBreaker.getStats();
console.log(stats.state); // "CLOSED" | "OPEN" | "HALF_OPEN"
```

### 3. Auth Cookies (Already Configured)
No code changes needed - all 6 NextAuth cookies now use:
- `sameSite: 'lax'` for OAuth compatibility
- `maxAge: 15 * 60` for state/pkce/nonce (15 minutes)

---

## 📊 Monitoring Commands

### Check Queue Health
```bash
# In Node.js console or API route
const { idhQueue } = require('@/lib/idh-queue');
console.log(idhQueue.getMetrics());
```

### Check Circuit Breaker Status
```bash
# In Node.js console or API route
const { ppApiCircuitBreaker } = require('@/lib/circuit-breaker');
console.log(ppApiCircuitBreaker.getStats());
```

### View Logs (Staging)
```bash
# SSH to Windows server
ssh user@parent-stg.moe.gov.ae

# View IIS logs
Get-Content C:\inetpub\logs\LogFiles\W3SVC1\*.log -Tail 100 | Select-String "error"

# View application logs (if configured)
tail -f /var/log/parent-stg/application.log | grep -i "429\|timeout\|cookie"
```

---

## 🚨 Alert Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| `idhQueue.rateLimitHits` | > 0 | Reduce queue concurrency or increase interval |
| `idhQueue.currentQueueSize` | > 10 | Increase concurrency or investigate IDH API |
| `ppApiCircuitBreaker.state` | `"OPEN"` | Check PP API health, notify ops team |
| `authTimeouts` | > 0 | Increase OIDC timeout beyond 10s |
| `stateCookieErrors` | > 0 | Verify NEXTAUTH_URL matches deployment URL |

---

## 🐛 Troubleshooting

### Still seeing 429 errors?
```typescript
// Increase concurrency (in lib/idh-queue.ts)
const IDH_QUEUE_CONFIG = {
  concurrency: 5,  // was 3
  intervalCap: 10, // was 5
};
```

### Circuit breaker stuck OPEN?
```typescript
// Manually reset
ppApiCircuitBreaker.reset();

// Or wait for automatic HALF_OPEN after timeout
const stats = ppApiCircuitBreaker.getStats();
console.log('Next retry:', new Date(stats.nextAttemptTime));
```

### State cookie still missing?
```bash
# Verify NEXTAUTH_URL in .env.local
echo $NEXTAUTH_URL  # Should be https://parent-stg.moe.gov.ae

# Check cookie in browser DevTools
# Application → Cookies → next-auth.state should exist
```

---

## 📦 Dependencies

### Installed Packages
```bash
npm list | grep -E "p-queue|p-retry"
# Should show:
# ├── p-queue@8.0.1
# └── p-retry@6.0.0
```

### If missing:
```bash
npm install p-queue p-retry
```

---

## 🔄 Rollback (Emergency)

### Quick Disable - Queue Only
```typescript
// lib/idh-queue.ts - Change line 98
execute: async (fn) => fn(),  // Bypass queue
```

### Full Rollback
```bash
git revert HEAD~5  # Revert last 5 commits
npm run build
# Deploy previous version
```

---

## 📞 Support

### Error Log Analysis
See: `/docs/HIGH_PRIORITY_FIXES_IMPLEMENTATION.md`

### Deployment Guide
See: `/docs/DEPLOYMENT_SUMMARY_HIGH_PRIORITY_FIXES.md`

### Code References
- IDH Queue: `/lib/idh-queue.ts`
- Circuit Breaker: `/lib/circuit-breaker.ts`
- Auth Config: `/lib/auth.ts` (lines 92, 160-220)

---

## ✅ Next Steps

1. **Deploy to Staging** ← You are here
2. **Monitor for 24 hours** (check metrics every 2 hours)
3. **Deploy Circuit Breaker Integration** (Phase 2)
4. **Create Admin Metrics Dashboard** (Phase 3)
5. **Deploy to Production** (after staging validation)

---

**Last Updated**: December 2025  
**Owner**: Development Team  
**Priority**: HIGH
