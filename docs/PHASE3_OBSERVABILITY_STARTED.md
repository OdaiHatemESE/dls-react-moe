# Phase 3: Observability & Intelligence - STARTED

**Status**: 🚧 **IN PROGRESS**  
**Date**: December 11, 2025  
**Priority**: HIGH  
**Focus**: Real-time monitoring, metrics tracking, and intelligent recommendations

---

## Overview

Phase 3 builds on the resilience foundation from Phases 1 & 2 by adding comprehensive observability and intelligence. Now that all endpoints have timeout/retry/circuit breaker protection, we need visibility into how well these systems are working.

---

## ✅ Implemented Components

### 1. **Metrics Tracking System** 📊

**File**: `/lib/metrics-tracker.ts` (NEW - 380 lines)

**Purpose**: Centralized tracking of all API request metrics

**Features**:
- ✅ Request counting (total, success, failure)
- ✅ Response time tracking (P50, P95, P99 percentiles)
- ✅ Timeout pattern detection
- ✅ Retry effectiveness monitoring
- ✅ Circuit breaker rejection tracking
- ✅ Per-endpoint and global statistics
- ✅ Health score calculation (0-100)

**Key Methods**:
```typescript
// Record a request
metricsTracker.recordRequest(endpoint, success, responseTimeMs, {
  timeout: boolean,
  retry: boolean,
  retrySuccess: boolean,
  circuitBreakerRejection: boolean,
  statusCode: number,
});

// Get metrics
const metrics = metricsTracker.getEndpointMetrics('/api/PP/student/[id]');
const summary = metricsTracker.getEndpointSummary('/api/PP/student/[id]');
const healthScore = metricsTracker.calculateHealthScore('/api/PP/student/[id]');

// Find problems
const problematic = metricsTracker.getProblematicEndpoints(10);
const allHealth = metricsTracker.getAllHealthScores();
```

**Health Score Factors** (0-100):
- **Availability (40%)**: Success rate
- **Performance (30%)**: Response time vs 2s baseline
- **Reliability (20%)**: Retry success rate
- **Resilience (10%)**: Circuit breaker effectiveness

---

### 2. **Admin Metrics API** 🔌

**File**: `/app/api/admin/resilience-metrics/route.ts` (NEW - 320 lines)

**Purpose**: REST API endpoint for retrieving comprehensive metrics

**Endpoint**: `GET /api/admin/resilience-metrics`

**Authentication**: Requires NextAuth session (admin role check TODO)

**Response Structure**:
```json
{
  "timestamp": "2025-12-11T14:23:45Z",
  "systemHealth": {
    "status": "healthy|degraded|critical",
    "score": 87,
    "issues": ["Circuit breaker X is OPEN", "..."]
  },
  "circuitBreakers": {
    "ppApi": {
      "state": "CLOSED",
      "failures": 2,
      "successes": 1543,
      "rejections": 0,
      "uptimePercentage": "99.87%",
      "lastFailureAgo": "2h ago",
      "lastSuccessAgo": "5s ago",
      "name": "PP API",
      "description": "Parent Portal API circuit breaker"
    },
    "idhApi": { /* same structure */ },
    "oneRoster": { /* same structure */ }
  },
  "queues": {
    "idh": {
      "currentPending": 3,
      "currentQueueSize": 2,
      "successfulRequests": 8542,
      "failedRequests": 15,
      "successRate": "99.82%",
      "name": "IDH Request Queue"
    }
  },
  "endpoints": {
    "count": 12,
    "global": {
      "totalRequests": 15234,
      "successRate": "96.5%",
      "averageResponseTime": "1850ms",
      "p95ResponseTime": "4200ms",
      "p99ResponseTime": "8500ms",
      "retrySuccessRate": "68%"
    },
    "problematic": [
      {
        "endpoint": "/api/PP/student/[id]",
        "errorRate": 12.5,
        "summary": { /* detailed stats */ }
      }
    ],
    "healthScores": [
      {
        "endpoint": "/api/PP/student/[id]",
        "score": 87,
        "trend": "stable"
      }
    ]
  },
  "recommendations": [
    "PP API: High failure rate (15%). Monitor for potential service degradation.",
    "/api/PP/student/[id]: Slow P95 response time (8500ms). Consider increasing timeout."
  ]
}
```

**Management Endpoint**: `POST /api/admin/resilience-metrics`

**Actions**:
```json
// Reset all metrics
{ "action": "reset", "target": "metrics" }

// Reset queue metrics
{ "action": "reset", "target": "queue" }

// Reset specific circuit breaker
{ "action": "reset", "target": "circuitBreaker", "name": "ppApi" }
```

---

### 3. **Visual Dashboard** 📈

**File**: `/app/admin/eid/components/ResilienceDashboard.tsx` (NEW - 420 lines)

**Purpose**: React dashboard for monitoring resilience metrics in real-time

**URL**: `https://parent-stg.moe.gov.ae/admin/eid` (Resilience tab)

**Features**:
- ✅ **Auto-refresh** every 10 seconds (toggleable)
- ✅ **System Health Overview** with color-coded status
- ✅ **Circuit Breaker Cards** showing state, uptime, failures
- ✅ **Queue Metrics** with pending/active/completed counts
- ✅ **Endpoint Statistics** with global summary
- ✅ **Problematic Endpoints** highlighted in red
- ✅ **Health Score Bars** for all endpoints
- ✅ **Actionable Recommendations** based on current state

**Components**:
- `ResilienceDashboard` - Main dashboard container
- `CircuitBreakerCard` - Individual circuit breaker display
- `QueueCard` - Queue metrics display
- `StatCard` - Reusable stat display
- Uses SWR for automatic data fetching/caching

**Visual Design**:
- Green = Healthy (score ≥ 80, circuit CLOSED)
- Yellow = Degraded (score 50-79, circuit HALF_OPEN)
- Red = Critical (score < 50, circuit OPEN)

---

## 🎯 System Health Calculation

The dashboard calculates an overall system health score (0-100):

**Factors**:
1. **Circuit Breakers**: -30 points per OPEN, -10 per HALF_OPEN
2. **Queue Depth**: -15 points if pending > 50
3. **Endpoint Health**: -5 points per endpoint with score < 70

**Status Thresholds**:
- **Healthy**: Score ≥ 80
- **Degraded**: Score 50-79
- **Critical**: Score < 50

---

## 📊 Intelligent Recommendations

The system automatically generates recommendations based on:

### Circuit Breaker Analysis
```typescript
if (circuitBreaker.state === 'OPEN') {
  → "Check upstream service health and wait for automatic recovery"
}

if (failureRate > 10% && state === 'CLOSED') {
  → "High failure rate detected. Monitor for potential service degradation."
}
```

### Endpoint Analysis
```typescript
if (errorRate > 20%) {
  → "Review timeout configuration and upstream service"
}

if (p95ResponseTime > 10s) {
  → "Consider increasing timeout or optimizing upstream"
}
```

### Health Score Analysis
```typescript
if (healthScore < 50) {
  → "Critical health score. Immediate investigation recommended."
}
```

---

## 🔄 Integration with Existing Code

### How to Track Metrics in Endpoints

Add this to your API routes:

```typescript
import { metricsTracker } from '@/lib/metrics-tracker';

export async function GET(req: Request) {
  const endpoint = '/api/PP/student/[id]';
  const startTime = Date.now();
  
  try {
    // Your existing fetch logic
    const result = await fetchStudentData();
    
    // Record success
    metricsTracker.recordRequest(
      endpoint,
      true, // success
      Date.now() - startTime,
      { statusCode: 200 }
    );
    
    return NextResponse.json(result);
  } catch (error) {
    // Record failure
    metricsTracker.recordRequest(
      endpoint,
      false, // failure
      Date.now() - startTime,
      {
        timeout: error instanceof FetchTimeoutError,
        retry: retryAttempt > 0,
        retrySuccess: false,
        circuitBreakerRejection: error instanceof CircuitBreakerError,
        statusCode: 504,
      }
    );
    
    throw error;
  }
}
```

---

## 📈 Testing the Dashboard

### 1. Local Development

```bash
# Start dev server
npm run dev

# Visit admin panel
open http://localhost:4200/admin/eid

# Click "API Resilience" tab to see the dashboard

# Generate some traffic
curl http://localhost:4200/api/PP/student/SST-1-1-Pers-521025
curl http://localhost:4200/api/PP/school/ORG-123
curl http://localhost:4200/api/oneroster/students/SST-1-1-Pers-521025

# Refresh dashboard to see metrics
```

### 2. Test Circuit Breaker States

```typescript
// In browser console or API testing tool

// Force circuit breaker OPEN (maintenance mode)
await fetch('/api/admin/resilience-metrics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'forceOpen',
    target: 'circuitBreaker',
    name: 'ppApi'
  })
});

// Reset circuit breaker
await fetch('/api/admin/resilience-metrics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'reset',
    target: 'circuitBreaker',
    name: 'ppApi'
  })
});
```

### 3. Check Metrics API

```bash
# Get current metrics
curl http://localhost:4200/api/admin/resilience-metrics | jq

# Expected output:
# {
#   "timestamp": "...",
#   "systemHealth": { "status": "healthy", "score": 100, ... },
#   "circuitBreakers": { ... },
#   "endpoints": { ... },
#   "recommendations": [ ... ]
# }
```

---

## 🚧 TODO: Phase 3 Remaining Tasks

### Week 1 (Current) - Foundation ✅
- [x] Create metrics tracking system
- [x] Build admin API endpoint
- [x] Create visual dashboard
- [ ] **Add metrics tracking to existing endpoints** ⏳
- [ ] **Implement admin role check** ⏳
- [ ] **Add export functionality (CSV/JSON)** ⏳

### Week 2 - Advanced Monitoring
- [ ] Set up Grafana dashboard integration
- [ ] Create CloudWatch/Azure Monitor alarms
- [ ] Implement weekly report generation
- [ ] Add trend analysis (improving/stable/degrading)
- [ ] Create email alert system for critical issues

### Week 3 - Intelligence
- [ ] Implement timeout tuning suggestions
- [ ] Add error correlation logic
- [ ] Build self-healing prototypes
- [ ] Create automated recovery strategies
- [ ] Add A/B testing for timeout values

### Week 4 - Validation
- [ ] Load testing suite with Artillery
- [ ] Performance baseline documentation
- [ ] Create operations runbook
- [ ] Team training sessions
- [ ] Production deployment

---

## 🎯 Next Immediate Steps

### Step 1: Add Metrics Tracking to Endpoints

We need to instrument existing endpoints with metrics tracking. Let me create a helper function to make this easier:

**Target Files**:
1. `/app/api/PP/student/[id]/route.ts`
2. `/app/api/PP/school/[id]/route.ts`
3. `/app/api/PP/persons/route.ts`
4. `/app/api/backoffice/idh/route.ts`
5. All other protected endpoints

**Pattern**:
```typescript
// Wrap your endpoint handler
import { trackRequest } from '@/lib/metrics-helper';

export async function GET(req: Request) {
  return trackRequest('/api/PP/student/[id]', async () => {
    // Your existing logic
    return NextResponse.json(result);
  });
}
```

### Step 2: Add Admin Role Check

Update `/app/api/admin/resilience-metrics/route.ts`:

```typescript
// TODO: Replace this check
if (!session?.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// With proper admin role check
if (!session?.user || session.user.role !== 'admin') {
  return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
}
```

### Step 3: Test with Real Traffic

1. Deploy to staging
2. Generate traffic using load testing script
3. Monitor dashboard for metrics
4. Verify circuit breaker behavior
5. Check recommendations accuracy

---

## 📊 Expected Benefits

Once Phase 3 is fully deployed:

### Visibility
- ✅ **Real-time system health** at a glance
- ✅ **Instant problem detection** before users complain
- ✅ **Historical trend analysis** for capacity planning
- ✅ **Per-endpoint performance** visibility

### Efficiency
- ✅ **Faster troubleshooting** with detailed metrics
- ✅ **Proactive optimization** based on data
- ✅ **Reduced MTTR** (Mean Time To Recovery)
- ✅ **Data-driven decisions** for timeout tuning

### Intelligence
- ✅ **Automatic recommendations** for tuning
- ✅ **Anomaly detection** for unusual patterns
- ✅ **Correlation analysis** across services
- ✅ **Self-healing capabilities** (future)

---

## 🚀 Quick Start Guide

### For Developers

1. **View Dashboard**:
   ```
   http://localhost:4200/admin/eid
   ```
   Then click the "API Resilience" tab in the navigation

2. **Add Metrics to New Endpoint**:
   ```typescript
   import { metricsTracker } from '@/lib/metrics-tracker';
   
   // In your route handler
   const startTime = Date.now();
   // ... do work ...
   metricsTracker.recordRequest(endpoint, success, Date.now() - startTime);
   ```

3. **Check Endpoint Health**:
   ```typescript
   const health = metricsTracker.calculateHealthScore('/api/my-endpoint');
   console.log(`Health score: ${health}/100`);
   ```

### For Operations

1. **Monitor System Health**: Check dashboard every morning
2. **Review Recommendations**: Act on suggestions in blue box
3. **Investigate Alerts**: Red boxes = immediate attention needed
4. **Weekly Review**: Export metrics and analyze trends

---

## 📝 Summary

**Phase 3 Status**: Foundation complete, integration in progress

**Completed**:
- ✅ Metrics tracking system (380 lines)
- ✅ Admin API endpoint (320 lines)
- ✅ Visual dashboard (420 lines)
- ✅ Health score calculation
- ✅ Intelligent recommendations
- ✅ Real-time monitoring

**In Progress**:
- ⏳ Endpoint instrumentation
- ⏳ Admin role enforcement
- ⏳ Export functionality

**Next Week**:
- 📊 Grafana integration
- 🔔 Alert system
- 📧 Weekly reports

**Total New Code**: ~1,120 lines across 3 files

The foundation for comprehensive observability is in place! 🎉
