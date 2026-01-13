# Environment Variables Reference

**Last Updated**: January 13, 2026  
**Project**: DLS Parent Portal

Complete reference for all environment variables used in the application.

---

## Quick Setup

1. Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in the required values (marked with ⚠️ below)

3. Start the development server:
   ```bash
   npm run dev
   ```

---

## Table of Contents

- [Application Configuration](#application-configuration)
- [Authentication (NextAuth & OIDC)](#authentication-nextauth--oidc)
- [Database Configuration](#database-configuration)
- [OneRoster API](#oneroster-api)
- [Parent Portal API (.NET Backend)](#parent-portal-api-net-backend)
- [File Server](#file-server)
- [Email & SMS Services](#email--sms-services)
- [External Services](#external-services)
- [Environment-Specific Variables](#environment-specific-variables)

---

## Application Configuration

### `PUBLIC_URL`
**Required**: ✅ Yes  
**Default**: `http://localhost:4200`  
**Description**: Public-facing URL for the application. Used for internal API calls, especially important for IIS reverse proxy in production.

**Examples**:
```bash
# Local Development
PUBLIC_URL="http://localhost:4200"

# Staging
PUBLIC_URL="https://parent-stg.moe.gov.ae"

# Production
PUBLIC_URL="https://parent.moe.gov.ae"
```

---

## Authentication (NextAuth & OIDC)

### `NEXTAUTH_URL`
**Required**: ✅ Yes  
**Default**: `http://localhost:4200`  
**Description**: Base URL for NextAuth callbacks. Must match your application URL.

**Examples**:
```bash
NEXTAUTH_URL="http://localhost:4200"
NEXTAUTH_URL="https://parent-stg.moe.gov.ae"
```

### `NEXTAUTH_SECRET`
**Required**: ✅ Yes (Production), ⚠️ Recommended (Development)  
**Default**: None  
**Description**: Secret key for encrypting JWT tokens and cookies. Generate a secure random string.

**Generate**:
```bash
# Generate a secure secret
npx auth secret

# Or use OpenSSL
openssl rand -base64 32
```

**Example**:
```bash
NEXTAUTH_SECRET="ZeYWyU9MMtRnneQTl2O2KXx9fZBqvY9VGy2jkOOcs+Q="
```

### `AUTH0_ISSUER`
**Required**: ✅ Yes  
**Default**: None  
**Description**: OIDC issuer URL (UAE Pass authentication server).

**Examples**:
```bash
# Staging
AUTH0_ISSUER="https://stg-login.moe.gov.ae"

# Production
AUTH0_ISSUER="https://login.moe.gov.ae"
```

### `AUTH0_CLIENT_ID`
**Required**: ✅ Yes  
**Default**: None  
**Description**: OAuth client ID for UAE Pass integration.

**Example**:
```bash
AUTH0_CLIENT_ID="moe.parents.consent"
```

### `AUTH0_CLIENT_SECRET`
**Required**: ✅ Yes  
**Default**: None  
**Description**: OAuth client secret for UAE Pass integration. Keep this confidential!

**Example**:
```bash
AUTH0_CLIENT_SECRET="your-secret-here"
```

### `OIDC_LOGOUT_URL`
**Required**: ✅ Yes  
**Default**: None  
**Description**: Full OIDC logout endpoint URL for ending sessions.

**Examples**:
```bash
# Staging
OIDC_LOGOUT_URL="https://stg-login.moe.gov.ae/connect/endsession"

# Production
OIDC_LOGOUT_URL="https://login.moe.gov.ae/connect/endsession"
```

### `OIDC_LOGOUT_RETURN_TO`
**Required**: ✅ Yes  
**Default**: None  
**Description**: URL where users are redirected after logout from OIDC provider.

**Examples**:
```bash
# Local Development
OIDC_LOGOUT_RETURN_TO="http://localhost:4200/signout"

# Staging
OIDC_LOGOUT_RETURN_TO="https://parent-stg.moe.gov.ae/signout"
```

---

## Database Configuration

### `DATABASE_URL`
**Required**: ✅ Yes  
**Default**: None  
**Description**: Connection string for the Parent Portal database (SQL Server).

**Format**:
```bash
DATABASE_URL="sqlserver://HOST;database=DB_NAME;user=USERNAME;password=PASSWORD;encrypt=true;trustServerCertificate=BOOL;MultiSubnetFailover=true;connection_limit=100;pool_timeout=30;connect_timeout=60"
```

**Example**:
```bash
DATABASE_URL="sqlserver://10.190.36.25;database=ParentPortal;user=sa;password=p@ssw0rd;encrypt=true;trustServerCertificate=true;MultiSubnetFailover=true;connection_limit=100;pool_timeout=30;connect_timeout=60"
```

**Parameters Explained**:
- `HOST`: SQL Server hostname or IP
- `database`: Database name (ParentPortal)
- `user`: Database username
- `password`: Database password
- `encrypt`: Use TLS encryption (true/false)
- `trustServerCertificate`: Accept self-signed certificates (true for dev)
- `MultiSubnetFailover`: Failover support (true recommended)
- `connection_limit`: Max connections in pool (default: 100)
- `pool_timeout`: Connection pool timeout in seconds (default: 30)
- `connect_timeout`: Connection timeout in seconds (default: 60)

### `DATABASE_URL_STU_REG`
**Required**: ✅ Yes  
**Default**: None  
**Description**: Connection string for the Student Registration database (shared with .NET application).

**Format**: Same as `DATABASE_URL`

**Example**:
```bash
DATABASE_URL_STU_REG="sqlserver://10.190.36.25;database=StudentRegistration;user=sa;password=p@ssw0rd;encrypt=true;trustServerCertificate=true;MultiSubnetFailover=true"
```

⚠️ **Important**: This database is shared with the .NET backend. Never modify schema without coordination!

---

## OneRoster API

The application supports both UAT (staging) and production OneRoster endpoints.

### `ONEROSTER_AUTH_URL`
**Required**: ✅ Yes  
**Default**: None  
**Description**: OneRoster authentication endpoint URL for token exchange (UAT/Staging).

**Example**:
```bash
ONEROSTER_AUTH_URL=https://sis-uat.itworxedu.net/Integration/authentication/ims/oneroster/login
```

### `ONEROSTER_BASE`
**Required**: ✅ Yes  
**Default**: None  
**Description**: OneRoster API base URL (UAT/Staging).

**Example**:
```bash
ONEROSTER_BASE=https://sis-uat.itworxedu.net/Integration/ims/oneroster
```

### `ONEROSTER_AUTH_URL_PRD`
**Required**: ⚠️ Production only  
**Default**: None  
**Description**: OneRoster authentication endpoint URL for production.

**Example**:
```bash
ONEROSTER_AUTH_URL_PRD=https://sisapi.moe.gov.ae/Integration/authentication/ims/oneroster/login
```

### `ONEROSTER_BASE_PRD`
**Required**: ⚠️ Production only  
**Default**: None  
**Description**: OneRoster API base URL for production.

**Example**:
```bash
ONEROSTER_BASE_PRD=https://sisapi.moe.gov.ae/Integration/ims/oneroster
```

### `ONEROSTER_READ_USERNAME`
**Required**: ✅ Yes  
**Default**: None  
**Description**: Username for OneRoster read-only access.

**Example**:
```bash
ONEROSTER_READ_USERNAME="ESE_API_ReadAccess"
```

### `ONEROSTER_READ_PASSWORD`
**Required**: ✅ Yes  
**Default**: None  
**Description**: Password for OneRoster read-only access.

**Example**:
```bash
ONEROSTER_READ_PASSWORD="tAHKDE6G"
```

### `ONEROSTER_READ_SITE_UID`
**Required**: ✅ Yes  
**Default**: None  
**Description**: Site UID for OneRoster read operations.

**Example**:
```bash
ONEROSTER_READ_SITE_UID="SST-1-1-Site-1"
```

### `ONEROSTER_WRITE_USERNAME`
**Required**: ✅ Yes  
**Default**: None  
**Description**: Username for OneRoster write access.

**Example**:
```bash
ONEROSTER_WRITE_USERNAME="ESE_API_WriteAccess"
```

### `ONEROSTER_WRITE_PASSWORD`
**Required**: ✅ Yes  
**Default**: None  
**Description**: Password for OneRoster write access.

**Example**:
```bash
ONEROSTER_WRITE_PASSWORD="tAHKDE6G"
```

### `ONEROSTER_WRITE_SITE_UID`
**Required**: ✅ Yes  
**Default**: None  
**Description**: Site UID for OneRoster write operations.

**Example**:
```bash
ONEROSTER_WRITE_SITE_UID="SST-1-1-Site-1"
```

---

## Parent Portal API (.NET Backend)

### `PP_BASE_URL`
**Required**: ✅ Yes  
**Default**: None  
**Description**: Base URL for the Parent Portal .NET backend API.

**Examples**:
```bash
# Local Development (.NET running locally)
PP_BASE_URL=http://localhost:5147/api

# Staging
PP_BASE_URL=https://api-gw-uat.moe.gov.ae/ppapi-dotnet-stg/api

# Production
PP_BASE_URL=https://api-gw.moe.gov.ae/ppapi-dotnet/api
```

### `PP_CLIENT_ID`
**Required**: ✅ Yes  
**Default**: None  
**Description**: OAuth client ID for Parent Portal API authentication.

**Example**:
```bash
PP_CLIENT_ID=pp-api
```

### `PP_CLIENT_SECRET`
**Required**: ✅ Yes  
**Default**: None  
**Description**: OAuth client secret for Parent Portal API authentication.

**Example**:
```bash
PP_CLIENT_SECRET=pp-api-R*05W4ef@K
```

---

## File Server

### `FILE_SERVER_URL`
**Required**: ✅ Yes  
**Default**: None  
**Description**: File server API endpoint for document uploads and downloads.

**Example**:
```bash
FILE_SERVER_URL="https://apps.moe.gov.ae/file/api/File"
```

### `FILE_SERVER_CLIENT_ID`
**Required**: ✅ Yes  
**Default**: None  
**Description**: Client ID for file server authentication.

**Example**:
```bash
FILE_SERVER_CLIENT_ID="5027d14a-83e7-4746-ab42-55bb9c180bbc"
```

### `FILE_SERVER_USERNAME`
**Required**: ✅ Yes  
**Default**: None  
**Description**: Username for file server access.

**Example**:
```bash
FILE_SERVER_USERNAME="parent-portal-stg"
```

### `FILE_SERVER_PASSWORD`
**Required**: ✅ Yes  
**Default**: None  
**Description**: Password for file server access.

**Example**:
```bash
FILE_SERVER_PASSWORD="k))UE@Jx@@js"
```

---

## Email & SMS Services

### `BASIC_EMAIL_USERNAME`
**Required**: ✅ Yes  
**Default**: None  
**Description**: Username for email service authentication.

**Example**:
```bash
BASIC_EMAIL_USERNAME='parent-portal'
```

### `BASIC_EMAIL_PASSWORD`
**Required**: ✅ Yes  
**Default**: None  
**Description**: Password for email service authentication.

**Example**:
```bash
BASIC_EMAIL_PASSWORD='fh7_Ga-XBx'
```

### `CLIENT_EMAIL`
**Required**: ✅ Yes  
**Default**: None  
**Description**: Client identifier for email service.

**Example**:
```bash
CLIENT_EMAIL='f5071e48-496a-49bf-8a18-2e54e352a1c6'
```

### `BASIC_SMS_USERNAME`
**Required**: ✅ Yes  
**Default**: None  
**Description**: Username for SMS service authentication.

**Example**:
```bash
BASIC_SMS_USERNAME='parent-portal'
```

### `BASIC_SMS_PASSWORD`
**Required**: ✅ Yes  
**Default**: None  
**Description**: Password for SMS service authentication.

**Example**:
```bash
BASIC_SMS_PASSWORD='W~0qAtQ^o8'
```

### `CLIENT_SMS`
**Required**: ✅ Yes  
**Default**: None  
**Description**: Client identifier for SMS service.

**Example**:
```bash
CLIENT_SMS='65739461-3b8b-4759-9902-a91f525c30a1'
```

---

## External Services

### `ONWANI_INSECURE_TLS`
**Required**: ⚠️ Optional  
**Default**: `false`  
**Description**: Allow insecure TLS connections for Onwani map integration (use only in development/staging with self-signed certificates).

**Example**:
```bash
ONWANI_INSECURE_TLS=true
```

⚠️ **Security Warning**: Never set to `true` in production!

---

## Environment-Specific Variables

### Local Development (.env.local)

```bash
# Application
PUBLIC_URL="http://localhost:4200"
NEXTAUTH_URL="http://localhost:4200"
NEXTAUTH_SECRET="ZeYWyU9MMtRnneQTl2O2KXx9fZBqvY9VGy2jkOOcs+Q="

# Auth (Staging OIDC)
AUTH0_ISSUER="https://stg-login.moe.gov.ae"
AUTH0_CLIENT_ID="moe.parents.consent"
AUTH0_CLIENT_SECRET="your-secret-here"
OIDC_LOGOUT_URL="https://stg-login.moe.gov.ae/connect/endsession"
OIDC_LOGOUT_RETURN_TO="http://localhost:4200/signout"

# Database (Staging/UAT)
DATABASE_URL="sqlserver://10.190.36.25;database=ParentPortal;user=sa;password=p@ssw0rd;encrypt=true;trustServerCertificate=true;MultiSubnetFailover=true;connection_limit=100;pool_timeout=30;connect_timeout=60"
DATABASE_URL_STU_REG="sqlserver://10.190.36.25;database=StudentRegistration;user=sa;password=p@ssw0rd;encrypt=true;trustServerCertificate=true;MultiSubnetFailover=true"

# OneRoster (UAT)
ONEROSTER_AUTH_URL=https://sis-uat.itworxedu.net/Integration/authentication/ims/oneroster/login
ONEROSTER_BASE=https://sis-uat.itworxedu.net/Integration/ims/oneroster
ONEROSTER_READ_USERNAME="ESE_API_ReadAccess"
ONEROSTER_READ_PASSWORD="tAHKDE6G"
ONEROSTER_READ_SITE_UID="SST-1-1-Site-1"
ONEROSTER_WRITE_USERNAME="ESE_API_WriteAccess"
ONEROSTER_WRITE_PASSWORD="tAHKDE6G"
ONEROSTER_WRITE_SITE_UID="SST-1-1-Site-1"

# PP API (Local .NET or UAT)
PP_BASE_URL=http://localhost:5147/api
PP_CLIENT_ID=pp-api
PP_CLIENT_SECRET=pp-api-R*05W4ef@K

# File Server (Staging)
FILE_SERVER_URL="https://apps.moe.gov.ae/file/api/File"
FILE_SERVER_CLIENT_ID="5027d14a-83e7-4746-ab42-55bb9c180bbc"
FILE_SERVER_USERNAME="parent-portal-stg"
FILE_SERVER_PASSWORD="k))UE@Jx@@js"

# Email/SMS (Staging)
BASIC_EMAIL_USERNAME='parent-portal'
BASIC_EMAIL_PASSWORD='fh7_Ga-XBx'
CLIENT_EMAIL='f5071e48-496a-49bf-8a18-2e54e352a1c6'
BASIC_SMS_USERNAME='parent-portal'
BASIC_SMS_PASSWORD='W~0qAtQ^o8'
CLIENT_SMS='65739461-3b8b-4759-9902-a91f525c30a1'

# Development Only
ONWANI_INSECURE_TLS=true
```

### Staging Environment

```bash
PUBLIC_URL="https://parent-stg.moe.gov.ae"
NEXTAUTH_URL="https://parent-stg.moe.gov.ae"
NEXTAUTH_SECRET="ZeYWyU9MMtRnneQTl2O2KXx9fZBqvY9VGy2jkOOcs+Q="

AUTH0_ISSUER="https://stg-login.moe.gov.ae"
AUTH0_CLIENT_ID="moe.parents.consent"
AUTH0_CLIENT_SECRET="staging-secret"
OIDC_LOGOUT_URL="https://stg-login.moe.gov.ae/connect/endsession"
OIDC_LOGOUT_RETURN_TO="https://parent-stg.moe.gov.ae/signout"

# Use UAT OneRoster endpoints
ONEROSTER_AUTH_URL=https://sis-uat.itworxedu.net/Integration/authentication/ims/oneroster/login
ONEROSTER_BASE=https://sis-uat.itworxedu.net/Integration/ims/oneroster

# PP API Gateway (Staging)
PP_BASE_URL=https://api-gw-uat.moe.gov.ae/ppapi-dotnet-stg/api

# Staging credentials for all services...
```

### Production Environment

```bash
PUBLIC_URL="https://parent.moe.gov.ae"
NEXTAUTH_URL="https://parent.moe.gov.ae"
NEXTAUTH_SECRET="production-secret-change-me"

AUTH0_ISSUER="https://login.moe.gov.ae"
AUTH0_CLIENT_ID="moe.parents.consent"
AUTH0_CLIENT_SECRET="production-secret"
OIDC_LOGOUT_URL="https://login.moe.gov.ae/connect/endsession"
OIDC_LOGOUT_RETURN_TO="https://parent.moe.gov.ae/signout"

# Production Database
DATABASE_URL="sqlserver://production-host;database=ParentPortal;user=app_user;password=secure-password;encrypt=true;trustServerCertificate=false;MultiSubnetFailover=true"

# Production OneRoster
ONEROSTER_AUTH_URL=https://sisapi.moe.gov.ae/Integration/authentication/ims/oneroster/login
ONEROSTER_BASE=https://sisapi.moe.gov.ae/Integration/ims/oneroster

# Production PP API
PP_BASE_URL=https://api-gw.moe.gov.ae/ppapi-dotnet/api

# Production credentials for all services...

# NEVER use insecure TLS in production
ONWANI_INSECURE_TLS=false
```

---

## Security Best Practices

### ✅ DO:
- ✅ Store `.env.local` file locally only (never commit to git)
- ✅ Use strong, randomly generated secrets for `NEXTAUTH_SECRET`
- ✅ Use environment-specific credentials for each environment
- ✅ Rotate secrets regularly (quarterly recommended)
- ✅ Use least-privilege database accounts
- ✅ Enable TLS encryption for all external connections
- ✅ Use environment variables in CI/CD pipelines

### ❌ DON'T:
- ❌ Never commit `.env.local` or `.env` to git
- ❌ Never share production credentials in development
- ❌ Never use `trustServerCertificate=true` in production
- ❌ Never use `ONWANI_INSECURE_TLS=true` in production
- ❌ Never hardcode credentials in source code
- ❌ Never log environment variable values
- ❌ Never expose secrets in client-side code

---

## Validation Checklist

Before deploying, verify all required variables are set:

### Minimal Required Variables
- [ ] `NEXTAUTH_URL` - Application base URL
- [ ] `NEXTAUTH_SECRET` - JWT encryption key
- [ ] `AUTH0_ISSUER` - OIDC provider URL
- [ ] `AUTH0_CLIENT_ID` - OIDC client ID
- [ ] `AUTH0_CLIENT_SECRET` - OIDC client secret
- [ ] `DATABASE_URL` - Parent Portal database
- [ ] `DATABASE_URL_STU_REG` - Student database
- [ ] `ONEROSTER_AUTH_URL` - OneRoster auth endpoint
- [ ] `ONEROSTER_BASE` - OneRoster API base
- [ ] `ONEROSTER_READ_USERNAME` - OneRoster username
- [ ] `ONEROSTER_READ_PASSWORD` - OneRoster password
- [ ] `PP_BASE_URL` - PP API base URL
- [ ] `PP_CLIENT_ID` - PP API client ID
- [ ] `PP_CLIENT_SECRET` - PP API client secret

### Verify Setup
```bash
# Check if database is accessible
curl http://localhost:4200/api/db/health
# Expected: {"status":"ok"}

# Check parent portal database
curl http://localhost:4200/api/db/health-parent
# Expected: {"status":"ok"}

# Start application
npm run dev
# Should start without errors
```

---

## Troubleshooting

### Database Connection Issues

**Error**: `P1000: Authentication failed`
- ✅ Verify username and password in `DATABASE_URL`
- ✅ Check SQL Server allows remote connections
- ✅ Verify firewall allows port 1433

**Error**: `P1001: Can't reach database server`
- ✅ Check host/IP address is correct
- ✅ Verify SQL Server is running
- ✅ Check network connectivity

**Error**: `ECONNREFUSED`
- ✅ Verify connection string format
- ✅ Check port number (default: 1433)

### NextAuth Issues

**Error**: `[next-auth][error][SIGNIN_OAUTH_ERROR]`
- ✅ Verify `AUTH0_ISSUER` URL is correct
- ✅ Check `AUTH0_CLIENT_ID` matches OIDC provider
- ✅ Verify `AUTH0_CLIENT_SECRET` is correct
- ✅ Check `NEXTAUTH_URL` matches your domain

**Error**: `No secret provided`
- ✅ Set `NEXTAUTH_SECRET` in environment

### OneRoster Issues

**Error**: `401 Unauthorized`
- ✅ Check OneRoster username/password
- ✅ Verify SITE_UID is correct
- ✅ Check credentials have required permissions

**Error**: `Timeout`
- ✅ Verify `ONEROSTER_BASE` URL is accessible
- ✅ Check network/firewall settings

---

## Related Documentation

- [HANDOVER.md](../HANDOVER.md) - Setup guide
- [ARCHITECTURE.md](../core/ARCHITECTURE.md) - System architecture
- [API_ROUTES.md](./API_ROUTES.md) - API endpoints
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues (if exists)

---

**Last Updated**: January 13, 2026  
**Maintained By**: Development Team  
**Version**: 1.0
