# Metrics Tracking Integration

## ✅ Completed Routes

### Critical External API Routes (Integrated)

1. **`/api/PP/student/[id]`** - PP Student Profile API
   - Tracks: Response time, success/failure, cache hits
   - Status: ✅ Integrated

2. **`/api/backoffice/idh (GET)`** - IDH Student Status API  
   - Tracks: Response time, timeouts, queue metrics
   - Status: ✅ Integrated

3. **`/api/backoffice/idh (POST)`** - IDH Student Update API
   - Tracks: Response time, timeouts, retry success
   - Status: ✅ Integrated

---

## 📋 Remaining Critical Routes (To Be Added)

### High Priority PP API Routes

- `/api/PP/ChildList/[eid]` - Get all children for parent
- `/api/PP/persons` - Parent person data
- `/api/PP/student/[id]/enrollments` - Student enrollment history
- `/api/PP/conduct-status/[studentSourcedId]` - Conduct agreement status
- `/api/PP/information-status/[studentSourcedId]` - Update request status

### Medium Priority OneRoster Routes

- `/api/oneroster/basic-info-full` - Basic student info
- `/api/oneroster/students/[sourcedId]` - Individual student lookup
- `/api/oneroster/latest-enrollment` - Latest enrollment data
- `/api/oneroster/schoolenrollments` - School enrollment list

---

## 🔧 How to Add Tracking to a Route

### Step 1: Import metricsTracker

```typescript
import { metricsTracker } from '@/lib/metrics-tracker';
```

### Step 2: Add timing variables at start of handler

```typescript
export async function GET(req: Request) {
  const startTime = Date.now();
  const endpoint = '/api/your-route-name';
  
  try {
    // ... your code
```

### Step 3: Track success before return

```typescript
    const response = NextResponse.json({ /* your data */ });
    
    // Track successful request
    metricsTracker.recordRequest(endpoint, true, Date.now() - startTime);
    return response;
```

### Step 4: Track failures in catch block

```typescript
  } catch (err: unknown) {
    // Track failed request with error details
    const isTimeout = err instanceof FetchTimeoutError;
    metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, {
      timeout: isTimeout,
      statusCode: isTimeout ? 504 : 500,
    });
    
    // ... your error handling
  }
```

---

## 📊 What Gets Tracked

For each API call, we record:

- **Endpoint**: Route path (e.g., `/api/PP/student/[id]`)
- **Success/Failure**: Boolean flag
- **Response Time**: Milliseconds from start to finish
- **Metadata**:
  - `timeout`: Was it a timeout error?
  - `retry`: Was this a retry attempt?
  - `retrySuccess`: Did the retry succeed?
  - `circuitBreakerRejection`: Was it rejected by circuit breaker?
  - `statusCode`: HTTP status code (for failures)

---

## 🎯 Benefits

Once integrated, you get automatic:

1. **Dashboard Visibility**
   - Success rates per endpoint
   - P50/P95/P99 response times
   - Timeout patterns
   - Retry effectiveness

2. **Database Persistence**
   - Metrics saved every 60 seconds or 100 requests
   - Historical data for trend analysis
   - Queryable via SQL for custom reports

3. **Health Monitoring**
   - Health scores (0-100) per endpoint
   - Problematic endpoint alerts
   - System-wide health status

---

## 🚀 Next Steps

Run the application and test an API call. Within 60 seconds, check the database:

```sql
SELECT TOP 10 * 
FROM dbo.ApiMetrics 
ORDER BY Timestamp DESC;
```

You should see metrics appearing automatically! 🎉
