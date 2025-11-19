# Parent Conduct Route - Staging Debug Guide

## Issues Fixed

### 1. School Endpoint URL Resolution
**Problem**: The school endpoint was using `NEXTAUTH_URL` to build internal API URLs, which fails in staging due to:
- DNS loopback issues (server can't resolve its own external domain)
- SSL certificate validation failures
- Network configuration restrictions

**Fix**: Updated `/api/PP/school/[id]/route.ts` to use `buildInternalApiUrl()` which:
- Uses `http://localhost:{PORT}` for all internal API calls
- Prevents SSL and DNS issues in staging/production
- Consistent with the student endpoint pattern

### 2. Added Timeout Handling
**Problem**: Network requests could hang indefinitely in staging

**Fix**: Added `fetchWithTimeout` with specific timeouts:
- Token fetch: 8 seconds
- School data fetch: 10 seconds
- Returns 504 Gateway Timeout on timeout
- Returns 502 Bad Gateway on network errors

### 3. Enhanced Error Logging
**Problem**: Hard to diagnose failures in staging

**Fix**: Added comprehensive logging to:
- `/api/PP/school/[id]/route.ts` - Logs token fetch, validation, and school data fetch
- `/api/parent/conduct/route.ts` - Logs each aggregation step with context

## Debug Endpoints Created

### 1. Student Debug (No Auth)
**Endpoint**: `/api/debug/student/[id]`

**Usage**:
```bash
GET /api/debug/student/SST-1-1-Pers-9424?parentEid=784197779540745
```

**Returns**:
- Full student profile from PP API
- All enrollment details
- Contact and address info
- Parent information
- List of all students for that parent (if student not found)

### 2. Conduct Flow Debug
**Endpoint**: `/api/debug/conduct`

**Usage**:
```bash
GET /api/debug/conduct?studentPersonId=SST-1-1-Pers-9424&parentEid=784197779540745
```

**Returns** step-by-step debug info:
```json
{
  "ok": true/false,
  "debug": {
    "request": { "origin", "studentPersonId", "parentEid" },
    "steps": {
      "tokenFetch": { "status", "url", "httpStatus", "hasToken" },
      "studentFetch": { "status", "url", "httpStatus", "enrollmentCount", "hasParent" },
      "schoolFetch": { "status", "url", "httpStatus", "schoolName" }
    },
    "errors": [...],
    "warnings": [...],
    "environment": {
      "PP_BASE_URL": "✓ configured",
      "NEXTAUTH_URL": "✓ configured"
    }
  }
}
```

## Testing in Staging

### Step 1: Test Debug Endpoints
```bash
# Replace with actual values
STUDENT_ID="SST-1-1-Pers-9424"
PARENT_EID="784197779540745"
STAGING_URL="https://parent-stg.moe.gov.ae"

# Test conduct flow debug
curl "$STAGING_URL/api/debug/conduct?studentPersonId=$STUDENT_ID&parentEid=$PARENT_EID" | jq

# Test student debug
curl "$STAGING_URL/api/debug/student/$STUDENT_ID?parentEid=$PARENT_EID" | jq
```

### Step 2: Check Logs
Look for log entries with these prefixes:
- `[PP School]` - School endpoint operations
- `[Parent Conduct]` - Conduct aggregation steps
- `[DEBUG]` - Debug endpoint operations

### Step 3: Verify Environment Variables
The debug endpoint checks for:
- `PP_BASE_URL` - Must point to PP API (e.g., `https://api-gw-uat.moe.gov.ae/ppapi-dotnet-stg/api`)
- `NEXTAUTH_URL` - Should be staging domain
- `PORT` - Default 4200

## Common Staging Issues

### Issue: "Timed out while requesting PP token"
**Cause**: Token endpoint taking too long or unreachable
**Debug**: Check if localhost:{PORT} is accessible from within the container
**Fix**: Verify PORT environment variable matches the actual running port

### Issue: "Timed out while fetching school data"
**Cause**: PP API slow or network issues
**Debug**: Test PP_BASE_URL directly from the server
**Fix**: Increase timeout or check PP API health

### Issue: "School fetch failed: 404"
**Cause**: School ID doesn't exist in PP API
**Debug**: Check enrollment.schoolId in student data
**Fix**: Verify school data exists in PP database

### Issue: "Failed to reach PP token endpoint"
**Cause**: Internal API routing not working
**Debug**: 
1. Check if the app is actually running on the PORT
2. Verify no firewall rules blocking localhost
3. Check PM2 process status
**Fix**: Ensure `buildInternalApiUrl` is using correct port

## What Changed

### Files Modified:
1. `/app/api/PP/school/[id]/route.ts`
   - Import `buildInternalApiUrl` and `fetchWithTimeout`
   - Replace `NEXTAUTH_URL` with `buildInternalApiUrl()`
   - Add timeout handling for token and school fetches
   - Add comprehensive error logging

2. `/app/api/parent/conduct/route.ts`
   - Add detailed logging for each step
   - Log enrollment processing
   - Log school fetch attempts
   - Log final aggregation status

### Files Created:
1. `/app/api/debug/student/[id]/route.ts`
   - Bypasses parent authorization
   - Returns full student data from PP API
   - Useful for testing data structure

2. `/app/api/debug/conduct/route.ts`
   - Tests entire conduct aggregation flow
   - Returns step-by-step status
   - Shows errors and warnings
   - Validates environment configuration

## Expected Behavior

### Successful Flow:
1. Token fetch: ~100-500ms
2. Student fetch: ~200-1000ms (depends on cache)
3. School fetch: ~200-1000ms (depends on cache)
4. Total: < 3 seconds

### In Staging:
- First request (no cache): 1-3 seconds
- Cached requests: < 500ms
- Timeout if > 10 seconds for any step

## Next Steps

1. Deploy changes to staging
2. Run debug endpoints to verify flow
3. Check PM2 logs for detailed error messages
4. Verify environment variables are correct
5. Test with actual parent session (remove debug endpoints after testing)

## Security Note

**IMPORTANT**: The debug endpoints bypass authorization and should be:
- Removed or disabled in production
- Protected by IP whitelist if kept in staging
- Never exposed to end users
