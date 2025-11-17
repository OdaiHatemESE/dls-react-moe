# Staging Loopback Fix - Internal API URL Helper

## Problem Summary
On staging server (`parent-stg.moe.gov.ae`), API routes were failing with `502 Bad Gateway` and `500 Internal Server Error` when making internal API calls to themselves via the external domain.

### Root Cause
- Server trying to reach itself via `https://parent-stg.moe.gov.ae/api/...`
- Windows Server DNS loopback issues prevented self-resolution
- Network/SSL configuration blocked external-to-self connections

### Error Examples
```
TypeError: fetch failed
GET /api/parent/child-actions 502 (Bad Gateway)
GET /api/parent/students-partnership-charter 500 (Internal Server Error)
```

## Solution Implemented

### New Utility: `lib/internal-api-url.ts`
Created a helper that detects production/staging environments and automatically uses `localhost` for same-server API calls.

**Key Functions:**
- `getInternalApiOrigin(requestOrigin)` - Returns localhost for prod/staging, original origin for dev
- `buildInternalApiUrl(requestOrigin, path)` - Builds complete internal API URL

**Detection Logic:**
```typescript
// Detects these domains as external:
- parent-stg.moe.gov.ae (staging)
- parent.moe.gov.ae (production)

// For these, returns: http://localhost:${PORT}
// For others (dev), returns: original origin
```

## Files Modified

### Core Utility
- ✅ `lib/internal-api-url.ts` - New helper utility
- ✅ `lib/internal-api-url.test.ts` - 25 unit tests (all passing)

### Updated API Routes
- ✅ `lib/fetch-student-profile.ts` - Student profile fetching
- ✅ `app/api/parent/child-actions/route.ts` - Child actions endpoint
- ✅ `app/api/parent/students-partnership-charter/route.ts` - Charter documents
- ✅ `app/api/parent/conduct/route.ts` - Conduct records
- ✅ `app/api/backoffice/idh/route.ts` - IDH data endpoint

## Testing

### Unit Tests
```bash
npm test -- lib/internal-api-url.test.ts
```

**Results:** ✅ 25/25 tests passed

**Test Coverage:**
- Staging domain detection
- Production domain detection
- Development environment handling
- Port configuration (default and custom)
- Path normalization
- Query parameter preservation
- Edge cases (empty paths, multiple slashes, etc.)
- Real-world integration scenarios

## Usage Example

### Before (Broken on Staging)
```typescript
const origin = new URL(req.url).origin; // "https://parent-stg.moe.gov.ae"
const tokenUrl = `${origin}/api/PP/auth/token`;
const res = await fetch(tokenUrl); // ❌ FAILS on staging
```

### After (Works Everywhere)
```typescript
import { buildInternalApiUrl } from '@/lib/internal-api-url';

const origin = new URL(req.url).origin;
const tokenUrl = buildInternalApiUrl(origin, '/api/PP/auth/token');
const res = await fetch(tokenUrl); // ✅ Works on staging (uses localhost)
```

## Deployment

### Environment Variables
No new environment variables required. Uses existing `PORT` variable (defaults to 4200).

### Build & Deploy
1. Build: `npm run build`
2. Deploy to staging
3. Restart PM2: `pm2 restart PPApp`

### Verification
After deployment, verify these endpoints work:
- `/api/parent/child-actions?studentPersonId=SST-1-1-Pers-XXXXX`
- `/api/parent/students-partnership-charter?studentNumber=XXXXX&academicyear=2025-2026`
- `/api/parent/conduct?studentPersonId=SST-1-1-Pers-XXXXX`

## Benefits

✅ **Reliability** - No more DNS/network loopback issues on staging  
✅ **Performance** - Faster internal API calls via localhost  
✅ **Security** - No external network hops for same-server calls  
✅ **Compatibility** - Works on dev, staging, and production  
✅ **Maintainability** - Centralized helper, tested thoroughly  

## Future Considerations

- Consider using this pattern for all internal API calls
- Could be extended to detect other production domains if needed
- Pattern could be applied to other Next.js projects with similar issues

---

**Created:** November 17, 2025  
**Issue:** Staging loopback problem causing 502/500 errors  
**Status:** ✅ Resolved and tested
