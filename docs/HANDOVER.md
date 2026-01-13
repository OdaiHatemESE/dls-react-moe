# Developer Handover Guide

**Project**: DLS Parent Portal (Next.js)  
**Last Updated**: January 13, 2026  
**Prepared For**: New Developer Onboarding  
**Current Branch**: `feature/clean`

---

## 🎯 Quick Start (5 Minutes)

### Prerequisites
```bash
# Required
Node.js 18+ 
npm 9+
SQL Server access
Redis instance

# Recommended
VS Code
Prisma extension
```

### Get Running
```bash
# 1. Clone and install
git clone <repo-url>
cd dls-react-moe
npm install

# 2. Setup environment (copy .env.local.example to .env.local)
cp .env.local.example .env.local
# Edit .env.local with your credentials

# 3. Generate Prisma clients
npm run prisma:pp:generate
npm run prisma:sr:generate

# 4. Start development
npm run dev
# Open http://localhost:4200
```

### Test Your Setup
1. Visit `http://localhost:4200` → should redirect to login
2. Check `http://localhost:4200/api/db/health` → should return `{"status":"ok"}`
3. Check `http://localhost:4200/api/db/health-parent` → should return `{"status":"ok"}`

---

## 📚 Essential Documentation

### Start Here (Priority Order)

1. **[README.md](./README.md)** - Overview and structure
2. **[Sitemap](./sitemap/README.md)** - All pages explained
3. **[API Routes](./reference/API_ROUTES.md)** - All endpoints
4. **[Architecture](./core/ARCHITECTURE.md)** - System design

### By Your Role

**Frontend Developer**:
- Sitemap docs for all pages
- [Child Actions](./features/CHILD_ACTIONS.md) for business logic
- [Notifications](./features/NOTIFICATIONS.md) for UI patterns

**Backend Developer**:
- [API Routes](./reference/API_ROUTES.md) comprehensive
- [Architecture](./core/ARCHITECTURE.md) for database and integrations
- [Admin Panel](./features/ADMIN_PANEL.md) for configuration

**Full-Stack**:
- Read everything above
- Focus on Architecture first

---

## 🏗️ Project Structure

```
dls-react-moe/
├── app/                          # Next.js 14 App Router
│   ├── (public)/                # Public routes (login, signout)
│   ├── dashboard/               # Main parent hub
│   ├── child/[id]/             # Child pages (detail, update, conduct)
│   ├── parent/                  # Parent pages (applications, summary)
│   ├── admin/eid/              # Admin panel
│   ├── api/                     # API routes (see API_ROUTES.md)
│   │   ├── admin/              # Admin endpoints
│   │   ├── parent/             # Parent portal endpoints
│   │   ├── PP/                 # .NET backend integration
│   │   ├── backoffice/         # IDH Ministry system
│   │   ├── notifications/      # Notification system
│   │   └── db/                 # Database utilities
│   ├── components/             # Shared React components
│   └── i18n/                   # Internationalization
├── lib/                         # Utility libraries
│   ├── auth.ts                 # NextAuth configuration
│   ├── oneroster.ts            # OneRoster API client
│   ├── redis.ts                # Redis token storage
│   ├── prisma.ts               # Database clients
│   ├── child-actions.ts        # Business logic
│   ├── notifications.ts        # Notification system
│   └── admin-config.ts         # Admin configuration
├── prisma/                      # Database schemas
│   ├── parent-portal/          # Parent portal DB
│   └── student-registration/   # Shared student DB
├── components/ui/              # shadcn/ui components
├── docs/                        # THIS FOLDER - documentation
│   ├── sitemap/                # Page-by-page docs
│   ├── features/               # Feature docs
│   ├── core/                   # Architecture docs
│   └── reference/              # API reference
└── public/                      # Static assets
```

---

## 🔑 Key Concepts

### 1. Authentication Flow

```
User → UAE Pass (OIDC) → NextAuth → Session with Emirates ID
                                        ↓
                                   Redis (access tokens)
                                        ↓
                                   Protected routes
```

- **Provider**: UAE Pass via Auth0/OIDC
- **Session**: JWT with Emirates ID
- **Tokens**: Stored in Redis (not in JWT cookie)
- **Config**: `lib/auth.ts`

### 2. Data Sources

We integrate with **4 external systems**:

| System | Purpose | Library | Status |
|--------|---------|---------|--------|
| **OneRoster** | Student academic data | `lib/oneroster.ts` | ✅ Primary |
| **Parent Portal API (.NET)** | Legacy parent data | `/api/PP/*` | ⚠️ Legacy |
| **IDH Ministry** | Information updates | `/api/backoffice/idh` | ✅ Active |
| **SQL Server (Shared)** | Student master data | Prisma | ✅ Primary |

### 3. Database Architecture

**Two Databases**:
1. **Shared Student DB** (SQL Server)
   - Shared with .NET application
   - Student master data
   - Schema: `prisma/student-registration/`
   - Client: `@prisma/client` (default)

2. **Parent Portal DB** (SQL Server)
   - Next.js specific
   - Notifications, admin config, logs
   - Schema: `prisma/parent-portal/`
   - Client: `@prisma/client-parent`

**Important**: Never modify shared DB schema without coordination!

### 4. API Resilience

All external APIs use:
- **Timeouts**: 30s default
- **Retries**: 1 retry with 2s delay
- **Circuit Breakers**: Auto-disable failing APIs
- **Monitoring**: `/api/admin/resilience-metrics`

See [Architecture](./core/ARCHITECTURE.md#api-resilience) for details.

---

## 🔧 Common Tasks

### Add a New API Endpoint

1. Create file: `app/api/your-endpoint/route.ts`
2. Export handler(s):
   ```typescript
   export async function GET(req: Request) {
     // Your code
     return NextResponse.json({ data });
   }
   ```
3. Add authentication if needed:
   ```typescript
   const session = await getServerSession(authOptions);
   if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   ```
4. Document in `docs/reference/API_ROUTES.md`
5. Add to sitemap docs if used in UI

### Add a New Page

1. Create page: `app/your-page/page.tsx`
2. Add to sitemap: `docs/sitemap/XX-your-page/README.md`
3. Update navigation if needed
4. Add to `docs/sitemap/INDEX.md`
5. Update `docs/sitemap/SITEMAP_VISUAL.md`

### Add a New Feature

1. Implement code
2. Document in `docs/features/YOUR_FEATURE.md`
3. Update `docs/README.md` to reference it
4. Add API endpoints to `docs/reference/API_ROUTES.md`
5. Update sitemap docs for affected pages

### Modify Student Actions Logic

1. **Don't**. The system is now simple and works.
2. If you must: read `docs/features/CHILD_ACTIONS.md` first
3. Changes go in `lib/child-actions.ts`
4. Update API: `app/api/parent/child-actions/route.ts`
5. Test all status scenarios (see feature doc)

---

## 🧪 Testing

### Manual Testing Checklist

```bash
# Health checks
✓ /api/db/health → {"status":"ok"}
✓ /api/db/health-parent → {"status":"ok"}

# Authentication
✓ Login via UAE Pass works
✓ Session persists after page refresh
✓ Logout clears session

# Dashboard
✓ Children list loads
✓ Data sync button works
✓ Navigation to child detail works

# Child Detail
✓ Student info displays
✓ Action buttons show/hide correctly
✓ Update info form works
✓ Conduct signing works

# Admin Panel
✓ Admin access check works
✓ All configuration tabs load
✓ Changes persist to database

# Notifications
✓ Notifications load
✓ Mark as read works
✓ Unread count updates
```

### Test Accounts

(Add your test accounts here)

---

## 🐛 Common Issues & Solutions

### Issue: "Can't connect to database"

**Solution**:
1. Check DATABASE_URL in .env.local
2. Verify SQL Server is accessible
3. Test: `npm run prisma:pp:studio`
4. Check `/api/db/health`

### Issue: "NextAuth OIDC error"

**Solution**:
1. Check AUTH0_* variables in .env.local
2. Verify callback URL is registered
3. Check NEXTAUTH_SECRET is set
4. Test with credentials provider first

### Issue: "Redis connection failed"

**Solution**:
1. Check REDIS_URL in .env.local
2. Verify Redis is running
3. Test: `redis-cli ping`
4. Fallback: App works without Redis (no token caching)

### Issue: "Prisma client not found"

**Solution**:
```bash
# Regenerate clients
npm run prisma:pp:generate
npm run prisma:sr:generate

# If still fails, delete and regenerate
rm -rf node_modules/.prisma
npm run prisma:pp:generate
npm run prisma:sr:generate
```

### Issue: "OneRoster 401/403 errors"

**Solution**:
1. Check ONEROSTER_* credentials in .env.local
2. Tokens may be expired - check token exchange
3. View circuit breaker status: `/api/admin/resilience-metrics`
4. Reset circuit breaker if needed

### Issue: "IDH system not responding"

**Solution**:
1. Check circuit breaker: `/api/admin/resilience-metrics`
2. IDH may be down (Ministry system)
3. Circuit breaker will auto-disable after failures
4. Reset after IDH is back up

---

## 📖 Code Patterns

### Data Fetching (Client)

```typescript
// Use SWR for all data fetching
import useSWR from 'swr';
import { jsonFetcher } from '@/lib/swr';

const { data, error, isLoading } = useSWR('/api/endpoint', jsonFetcher);

// Handle states
if (isLoading) return <Loading />;
if (error) return <Error message={error.message} />;
if (!data) return <NoData />;

// Use data
```

### Authentication Check

```typescript
// Client component
import { useSession } from 'next-auth/react';

const { data: session } = useSession();
const eid = session?.user?.emiratesId;

// Server component/API route
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const session = await getServerSession(authOptions);
if (!session) return unauthorized();
```

### Database Query

```typescript
// Student DB (shared)
import { prisma } from '@/lib/prisma';

const student = await prisma.students.findUnique({
  where: { sourcedId: id }
});

// Parent Portal DB
import { prismaParent } from '@/lib/prisma-parent';

const notification = await prismaParent.notifications.create({
  data: { ... }
});
```

### Internationalization

```typescript
// Client component
import { useI18n } from '@/app/i18n/I18nProvider';

const { t, locale } = useI18n();

return (
  <div className={locale === 'ar' ? 'rtl' : 'ltr'}>
    <h1>{t.dashboard.welcome}</h1>
  </div>
);
```

### API Route Pattern

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Extract params
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    // 3. Validate
    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    // 4. Fetch data
    const data = await fetchData(id);

    // 5. Return
    return NextResponse.json({ data });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 🔐 Security Checklist

- [ ] All API routes check authentication
- [ ] Admin routes verify admin access
- [ ] Emirates ID format validated
- [ ] SQL injection protected (use Prisma)
- [ ] XSS protected (Next.js escapes by default)
- [ ] CSRF tokens in forms (NextAuth handles)
- [ ] Sensitive data in .env.local (not committed)
- [ ] Access tokens in Redis (not cookies)
- [ ] Parent-child relationship validated
- [ ] File uploads sanitized

---

## 📦 Deployment

### Environment Variables Required

```bash
# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key

# OIDC (UAE Pass)
AUTH0_ISSUER=https://your-auth-provider
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret

# Database
DATABASE_URL=sqlserver://host:1433;database=DB;user=U;password=P;encrypt=true;trustServerCertificate=false

# Redis
REDIS_URL=redis://host:6379

# OneRoster
ONEROSTER_BASE=https://api.oneroster.com
ONEROSTER_READ_CLIENT_ID=client-id
ONEROSTER_READ_CLIENT_SECRET=secret

# Parent Portal API (.NET)
ONEROSTER_AUTH_URL=https://pp-api.com/auth
PP_API_BASE=https://pp-api.com

# IDH System
IDH_API_BASE=https://idh-system.gov.ae
IDH_API_KEY=your-key
```

### Build & Deploy

```bash
# 1. Install dependencies
npm ci

# 2. Generate Prisma clients
npm run prisma:pp:generate
npm run prisma:sr:generate

# 3. Build
npm run build

# 4. Start
npm start
# Runs on port 4200
```

### Database Migrations

```bash
# Parent Portal DB (safe to migrate)
npm run prisma:pp:migrate

# Student Registration DB (NEVER migrate without approval!)
# Shared with .NET app - coordinate changes!
```

---

## 🎓 Learning Path

### Week 1: Understand the System
- [ ] Read this handover guide
- [ ] Read [Architecture](./core/ARCHITECTURE.md)
- [ ] Explore [Sitemap](./sitemap/README.md)
- [ ] Run the app locally
- [ ] Test all major features

### Week 2: Understand the Code
- [ ] Read [API Routes](./reference/API_ROUTES.md)
- [ ] Trace a request from UI to database
- [ ] Understand authentication flow
- [ ] Read [Child Actions](./features/CHILD_ACTIONS.md)
- [ ] Read [Notifications](./features/NOTIFICATIONS.md)

### Week 3: Make Changes
- [ ] Fix a small bug
- [ ] Add a new API endpoint
- [ ] Modify a page
- [ ] Update documentation
- [ ] Submit your first PR

### Week 4: Deep Dive
- [ ] Review admin panel
- [ ] Understand IDH integration
- [ ] Explore circuit breakers
- [ ] Review security patterns
- [ ] Optimize a query

---

## 📞 Getting Help

### When Stuck:

1. **Search the docs** - Use Cmd+F in docs folder
2. **Check code comments** - Most complex code is commented
3. **Review similar code** - Find similar feature and copy pattern
4. **Check git history** - `git log` and `git blame` for context
5. **Ask the team** - After trying above

### Useful Commands

```bash
# Search all docs
grep -r "search term" docs/

# Find API route
find app/api -name "route.ts" | grep "your-term"

# Check database schema
npm run prisma:pp:studio

# View recent changes
git log --oneline -20

# See who wrote this
git blame file.ts
```

---

## ✅ Pre-Commit Checklist

Before pushing code:

- [ ] Code runs locally without errors
- [ ] No console.errors in browser
- [ ] APIs return expected data
- [ ] Authentication still works
- [ ] Database queries are optimized
- [ ] No sensitive data in code
- [ ] TypeScript compiles (`npm run build`)
- [ ] Documentation updated if needed
- [ ] Tested in both English and Arabic
- [ ] Tested on mobile layout

---

## 🎯 Success Metrics

You'll know you're up to speed when you can:

- [ ] Explain authentication flow
- [ ] Add a new API endpoint independently
- [ ] Modify a page without breaking it
- [ ] Understand all 4 data sources
- [ ] Debug a failing external API
- [ ] Review and approve PRs
- [ ] Update documentation
- [ ] Train the next developer

---

## 📝 Quick Reference Cards

### Environment

```bash
Development: npm run dev (port 4200)
Production: npm start (port 4200)
Database UI: npm run prisma:pp:studio
```

### Important URLs

```
Dashboard: /dashboard
Child Detail: /child/[id]
Admin Panel: /admin/eid
API Health: /api/db/health
API Docs: /api (see docs/reference/API_ROUTES.md)
```

### Important Files

```
Auth: lib/auth.ts
APIs: lib/oneroster.ts, lib/admin-config.ts
Database: lib/prisma.ts, lib/prisma-parent.ts
Business Logic: lib/child-actions.ts
Schemas: prisma/*/schema.prisma
```

### Key Commands

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run prisma:pp:generate  # Generate Prisma client (Parent Portal)
npm run prisma:sr:generate  # Generate Prisma client (Student Registration)
npm run prisma:pp:studio    # Database UI (Parent Portal)
```

---

**Welcome to the team! 🎉**

**Questions?** Start with the docs, then ask the team.

**Updates?** Keep this document current as you learn.

**Last Updated**: January 13, 2026  
**Maintained By**: Development Team
