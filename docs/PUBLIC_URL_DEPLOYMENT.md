# PUBLIC_URL Deployment Guide

## Overview
The `PUBLIC_URL` environment variable is **CRITICAL** for internal API calls when the application runs behind IIS or a reverse proxy.

## Why is PUBLIC_URL needed?

When running behind IIS with URL rewrite rules, the Next.js server sees requests as coming from `localhost:4200` instead of the actual public domain. Without `PUBLIC_URL`, internal API-to-API calls fail because:

- ❌ Server tries to call `https://localhost:4200/api/...` 
- ❌ SSL certificate errors (localhost has no SSL)
- ❌ Connection failures

With `PUBLIC_URL` configured:
- ✅ Server calls `https://parent-stg.moe.gov.ae/api/...`
- ✅ Uses the same public URL that external users access
- ✅ SSL certificates work correctly
- ✅ Network path is proven working

## Environment Files

### `.env.staging` - For Staging Server
```bash
PUBLIC_URL="https://parent-stg.moe.gov.ae"
NEXTAUTH_URL="https://parent-stg.moe.gov.ae"
```

### `.env.production` - For Production Server
```bash
PUBLIC_URL="https://parent.moe.gov.ae"
NEXTAUTH_URL="https://parent.moe.gov.ae"
```

### `.env.local` - For Local Development
```bash
# Do NOT set PUBLIC_URL for local development
# It will default to http://localhost:4200
NEXTAUTH_URL="http://localhost:4200"
```

## Deployment Steps

### On Staging Server (Windows/IIS)

1. **Navigate to application directory:**
   ```cmd
   cd C:\inetpub\wwwroot\PPApp
   ```

2. **Create or update `.env.production` file:**
   ```cmd
   notepad .env.production
   ```
   
   Add at the TOP of the file:
   ```bash
   PUBLIC_URL="https://parent-stg.moe.gov.ae"
   ```

3. **Restart PM2:**
   ```cmd
   pm2 restart PPApp-st
   # or
   pm2 reload PPApp-st
   ```

4. **Verify the change:**
   Check the logs to see if internal API calls now use the correct URL:
   ```cmd
   pm2 logs PPApp-st --lines 50
   ```
   
   You should see:
   ```
   [fetchStudentProfile] Request origin: https://parent-stg.moe.gov.ae
   [fetchStudentProfile] Resolved URL: https://parent-stg.moe.gov.ae/api/PP/student/...
   ```

### On Production Server

Same steps, but use:
```bash
PUBLIC_URL="https://parent.moe.gov.ae"
```

## Verification

After deployment, test an endpoint that makes internal API calls:

```bash
# From browser or curl
https://parent-stg.moe.gov.ae/api/parent/child-actions?studentPersonId=SST-1-1-Pers-XXXXX

# Should NOT see "fetch failed" errors anymore
```

Check PM2 logs:
```cmd
pm2 logs PPApp-st --lines 100 | findstr "Resolved URL"
```

Expected output:
```
[fetchStudentProfile] Resolved URL: https://parent-stg.moe.gov.ae/api/PP/student/...
```

## How It Works

### Code Priority Order:
```typescript
const internalApiBaseUrl = process.env.PUBLIC_URL || process.env.NEXTAUTH_URL || 'http://localhost:4200';
```

1. **First**: Uses `PUBLIC_URL` if set (staging/production)
2. **Second**: Falls back to `NEXTAUTH_URL` if PUBLIC_URL not set
3. **Third**: Uses `http://localhost:4200` for local development

### Files Updated:
All API routes now use this pattern:
- `app/api/PP/student/[id]/route.ts`
- `app/api/PP/school/[id]/route.ts`
- `app/api/parent/child-actions/route.ts`
- `app/api/parent/conduct/route.ts`
- And 9 more API routes...

## Troubleshooting

### Issue: Still seeing "fetch failed" errors

**Solution:** Verify PUBLIC_URL is set correctly:
```cmd
# On server
cd C:\inetpub\wwwroot\PPApp
type .env.production | findstr PUBLIC_URL
```

Expected output:
```
PUBLIC_URL="https://parent-stg.moe.gov.ae"
```

### Issue: PUBLIC_URL set but still using localhost

**Solution:** Restart PM2 to load new environment variables:
```cmd
pm2 restart PPApp-st
```

### Issue: Mixed HTTP/HTTPS errors

**Solution:** Ensure PUBLIC_URL uses HTTPS (not HTTP):
```bash
# ✅ Correct
PUBLIC_URL="https://parent-stg.moe.gov.ae"

# ❌ Wrong
PUBLIC_URL="http://parent-stg.moe.gov.ae"
```

## Quick Reference

| Environment | PUBLIC_URL Value |
|------------|------------------|
| **Local Dev** | *(not set)* - defaults to `http://localhost:4200` |
| **Staging** | `https://parent-stg.moe.gov.ae` |
| **Production** | `https://parent.moe.gov.ae` |

## Related Files

- `.env.staging` - Staging configuration
- `.env.production` - Production configuration  
- `.env.example` - Template with documentation
- `lib/fetch-student-profile.ts` - Uses PUBLIC_URL
- All files in `app/api/**/*.ts` - Use PUBLIC_URL

## Security Note

✅ PUBLIC_URL is **safe to expose** - it's just your public domain name  
✅ No sensitive data in PUBLIC_URL  
✅ Same URL users already access
