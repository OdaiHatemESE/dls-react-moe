# Documentation Hub

**Project**: DLS Parent Portal  
**Last Updated**: January 13, 2026  
**Status**: ✅ Production Ready

> **👋 New Developer?** Start with **[HANDOVER.md](./HANDOVER.md)** - Complete onboarding guide

---

## 📖 Documentation Map

### 🎯 Start Here

| Document | Purpose | Read This If... |
|----------|---------|-----------------|
| **[HANDOVER.md](./HANDOVER.md)** | Complete onboarding guide | You're new to the project |
| **[Sitemap](./sitemap/README.md)** | All pages explained | You need to understand/modify UI pages |
| **[API Routes](./reference/API_ROUTES.md)** | All API endpoints | You're working with backend/APIs |
| **[Architecture](./core/ARCHITECTURE.md)** | System design & integrations | You need to understand how it all fits together |

### 📂 Documentation Structure

```
docs/
├── HANDOVER.md                  ⭐ START HERE - New developer guide
├── README.md                    📖 This file - Documentation hub
├── sitemap/                     🗺️ Every page documented
│   ├── README.md               → Sitemap overview
│   ├── INDEX.md                → Quick reference
│   ├── SITEMAP_VISUAL.md       → Visual diagrams
│   ├── 01-home/                → Home page
│   ├── 02-dashboard/           → Dashboard page
│   ├── 03-login/               → Login page
│   ├── 04-profile/             → Profile page
│   ├── 05-notifications/       → Notifications page
│   ├── 06-child-detail/        → Child detail page
│   ├── 07-child-update-info/   → Update info page
│   ├── 08-child-parent-conduct/→ Conduct signing page
│   ├── 09-parent-applications/ → Applications page
│   ├── 10-parent-summary/      → Summary page
│   ├── 11-admin-eid/           → Admin panel page
│   └── 12-signout/             → Signout page
├── features/                    🎨 Feature documentation
│   ├── CHILD_ACTIONS.md        → Business logic & status flow
│   ├── NOTIFICATIONS.md        → Notification system
│   ├── ADMIN_PANEL.md          → Admin configuration
│   ├── PDF_GENERATION.md       → PDF forms & signing
│   └── ADDRESS_PICKER.md       → Address selection
├── core/                        🏗️ Architecture & infrastructure
│   └── ARCHITECTURE.md         → System design, APIs, security
└── reference/                   📚 Technical reference
    └── API_ROUTES.md           → Complete API documentation
```

---

## 🚀 Quick Start (5 Minutes)

### For New Developers

1. **Read** [HANDOVER.md](./HANDOVER.md) (20 minutes)
2. **Setup** local environment (see handover guide)
3. **Explore** [Sitemap](./sitemap/README.md) to understand pages
4. **Review** [API Routes](./reference/API_ROUTES.md) for backend

### For Existing Developers

| Task | Documentation |
|------|---------------|
| Modify a page | [Sitemap](./sitemap/) → Find your page |
| Add/modify API | [API Routes](./reference/API_ROUTES.md) |
| Understand business logic | [Child Actions](./features/CHILD_ACTIONS.md) |
| Configure admin settings | [Admin Panel](./features/ADMIN_PANEL.md) |
| Fix notification issue | [Notifications](./features/NOTIFICATIONS.md) |
| Troubleshoot integration | [Architecture](./core/ARCHITECTURE.md) |

---

## 📚 Core Documentation

### [ARCHITECTURE.md](./core/ARCHITECTURE.md)
**System Architecture & Infrastructure**

- Database architecture (shared SQL Server)
- API resilience (timeouts, retries, circuit breakers)
- Student authorization & security
- External service integration (OneRoster, PP API, IDH)
- Token management & authentication flow

**Read this for**: Understanding how the system works, integration patterns, security model

---

## 🗺️ Sitemap Documentation

### Complete Page-by-Page Documentation

**[Sitemap Hub](./sitemap/README.md)** - Navigation structure and overview

Each page has detailed documentation covering:
- ✅ Business purpose & user stories
- ✅ API endpoints used (with examples)
- ✅ Data dependencies & structure
- ✅ Validation logic & checks
- ✅ State management patterns
- ✅ UI components & layout
- ✅ Internationalization (Arabic/English)
- ✅ Responsive design approach
- ✅ Navigation flows
- ✅ Error handling
- ✅ Security considerations
- ✅ Testing scenarios

**Quick Links**:
- [Dashboard](./sitemap/02-dashboard/README.md) - Main parent hub
- [Child Detail](./sitemap/06-child-detail/README.md) - Student profile
- [Update Info](./sitemap/07-child-update-info/README.md) - Information updates
- [Admin Panel](./sitemap/11-admin-eid/README.md) - Configuration
- [All Pages →](./sitemap/INDEX.md) - Quick reference index

---

## 🎨 Features Documentation

### [CHILD_ACTIONS.md](./features/CHILD_ACTIONS.md)
**Student Actions System - Business Logic**

- IDH status flow (null → 1-5)
- Conduct signature system
- Action availability rules
- Status badges & banners
- Configuration & setup

**Read this for**: Understanding when actions show/hide, status transitions, business rules

### [NOTIFICATIONS.md](./features/NOTIFICATIONS.md)
**Notification System**

- Database-persisted notifications
- Toast system for immediate feedback
- 8 notification types with color coding
- SWR hooks & real-time updates
- Email & SMS integration

**Read this for**: Adding notifications, toast messages, notification types

### [ADMIN_PANEL.md](./features/ADMIN_PANEL.md)
**Admin Panel & Configuration**

- Admin user management (Emirates ID whitelist)
- Update period configuration (time windows)
- Academic year management
- Action configuration by education type
- Analytics & reporting dashboard

**Read this for**: Admin features, configuration, system settings

### [PDF_GENERATION.md](./features/PDF_GENERATION.md)
**PDF Forms & Document Generation**

- Arabic font support (Cairo/Alexandria)
- Server-side PDF filling
- Electronic signature capture
- Conduct agreement forms

### [ADDRESS_SYSTEM_MIGRATION.md](./features/ADDRESS_SYSTEM_MIGRATION.md) ⭐
**Database-Backed Address System**

- Migration from Onwani API to database
- AuhAddresses table usage
- ManhalCode lookup via /api/db/plots
- GISID-based hierarchy fetching
- Performance improvements

### [ADDRESS_PICKER.md](./features/ADDRESS_PICKER.md)
**Address Selection Component (Legacy)**

- UAE emirate cascade (deprecated)
- Onwani API integration (legacy reference)
- Historical implementation

⭐ = Active system - use this for current development

---

## 📚 Reference Documentation

### [API_ROUTES.md](./reference/API_ROUTES.md)
**Complete API Endpoint Reference**

Every API endpoint documented with:
- HTTP methods
- Request/response formats
- Authentication requirements
- Query parameters
- Usage examples
- Integration patterns

**50+ endpoints** including:
- Authentication APIs
- Parent portal APIs
- Student data APIs
- OneRoster integration
- Admin panel APIs
- Notification APIs
- Database utilities
- Debug endpoints

---

## 🎯 Documentation by Use Case

### "I need to..."

| Task | Documentation | Section |
|------|---------------|---------|
| **Onboard to project** | [HANDOVER.md](./HANDOVER.md) | Entire guide |
| **Understand a page** | [Sitemap](./sitemap/) | Find the page |
| **Add new API endpoint** | [HANDOVER.md](./HANDOVER.md) | Common Tasks |
| **Understand auth flow** | [Architecture](./core/ARCHITECTURE.md) | Authentication |
| **Modify business logic** | [Child Actions](./features/CHILD_ACTIONS.md) | Status Flow |
| **Show/hide actions** | [Child Actions](./features/CHILD_ACTIONS.md) | Action Availability |
| **Send notification** | [Notifications](./features/NOTIFICATIONS.md) | Usage Examples |
| **Configure admin** | [Admin Panel](./features/ADMIN_PANEL.md) | Configuration |
| **Debug API timeout** | [Architecture](./core/ARCHITECTURE.md) | API Resilience |
| **Fix database issue** | [HANDOVER.md](./HANDOVER.md) | Common Issues |
| **Add new page** | [HANDOVER.md](./HANDOVER.md) | Common Tasks |
| **Understand routing** | [Sitemap Visual](./sitemap/SITEMAP_VISUAL.md) | Navigation |

### Prerequisites

```bash
Node.js 18+
npm 9+
SQL Server access
Redis instance
```

### Installation

```bash
# 1. Clone repository
git clone <repo-url>
cd dls-react-moe

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.local.example .env.local
# Edit .env.local with your credentials

# 4. Generate Prisma clients
npm run prisma:pp:generate
npm run prisma:sr:generate

# 5. Start development server
npm run dev
# Open http://localhost:4200
```

### Verify Setup

- ✅ `http://localhost:4200` → Should redirect to login
- ✅ `http://localhost:4200/api/db/health` → `{"status":"ok"}`
- ✅ `http://localhost:4200/api/db/health-parent` → `{"status":"ok"}`

---

## 💡 How to Use This Documentation

### Scenario-Based Guide

**"I'm new to the project"**
1. Start: [HANDOVER.md](./HANDOVER.md)
2. Then: [Sitemap Overview](./sitemap/README.md)
3. Finally: [Architecture](./core/ARCHITECTURE.md)

**"I need to modify the Dashboard page"**
1. Read: [Dashboard Documentation](./sitemap/02-dashboard/README.md)
2. Check APIs: [API Routes](./reference/API_ROUTES.md) → ChildList section
3. Understand: [Architecture](./core/ARCHITECTURE.md) → Data sources

**"I need to add a new API endpoint"**
1. Follow: [HANDOVER.md](./HANDOVER.md) → Common Tasks → Add API
2. Reference: [API Routes](./reference/API_ROUTES.md) → Pattern examples
3. Document: Add to API Routes reference

**"I need to understand business logic"**
1. Read: [Child Actions](./features/CHILD_ACTIONS.md)
2. Check: [Child Detail Page](./sitemap/06-child-detail/README.md)
3. Review: [Update Info Page](./sitemap/07-child-update-info/README.md)

**"The system is down"**
1. Check: [HANDOVER.md](./HANDOVER.md) → Common Issues
2. Review: [Architecture](./core/ARCHITECTURE.md) → API Resilience
3. Monitor: `/api/admin/resilience-metrics`

---

## 🔧 Maintenance & Updates

### Keeping Documentation Current

**When code changes**:
1. Update affected page docs in `sitemap/`
2. Update API docs in `reference/API_ROUTES.md`
3. Update feature docs if business logic changes
4. Update date stamps

**When adding features**:
1. Add to appropriate feature doc or create new one
2. Update sitemap if UI page added
3. Update API reference if endpoints added
4. Update HANDOVER.md common tasks
5. Update this README with new links

**Documentation Standards**:
- ✅ Use clear, concise language
- ✅ Provide real code examples
- ✅ Include API request/response samples
- ✅ Show both success and error cases
- ✅ Cross-reference related docs
- ✅ Keep diagrams up to date
- ✅ Test code examples work

---

## ⚡ Quick Reference

### Key URLs

| URL | Purpose |
|-----|---------|
| `/` | Home (auto-redirect) |
| `/dashboard` | Main parent hub |
| `/child/[id]` | Student profile |
| `/admin/eid` | Admin panel |
| `/api/db/health` | Database health check |

### Key Files

| File | Purpose |
|------|---------|
| `lib/auth.ts` | Authentication config |
| `lib/oneroster.ts` | OneRoster API client |
| `lib/child-actions.ts` | Business logic |
| `lib/notifications.ts` | Notification system |
| `lib/prisma.ts` | Database clients |

### Key Commands

```bash
# Development
npm run dev                    # Start dev server (port 4200)

# Database
npm run prisma:pp:generate     # Generate Parent Portal client
npm run prisma:sr:generate     # Generate Student Registration client
npm run prisma:pp:studio       # Open database UI

# Build & Deploy
npm run build                  # Build for production
npm start                      # Start production server
npm run lint                   # Run linter
```

---

## 🆘 Getting Help

### Finding Information

1. **Search docs**: `grep -r "search term" docs/`
2. **Find API**: Check [API Routes](./reference/API_ROUTES.md)
3. **Find page**: Check [Sitemap Index](./sitemap/INDEX.md)
4. **Understand flow**: Check [Sitemap Visual](./sitemap/SITEMAP_VISUAL.md)
5. **See architecture**: Check [Architecture](./core/ARCHITECTURE.md)

### Common Issues

See [HANDOVER.md → Common Issues](./HANDOVER.md#-common-issues--solutions) for:
- Database connection problems
- NextAuth OIDC errors
- Redis connection failures
- Prisma client issues
- External API failures

---

## 📊 Documentation Statistics

- **Total Pages Documented**: 12
- **Total API Endpoints**: 50+
- **Feature Docs**: 5
- **Architecture Docs**: 1
- **Reference Docs**: 1
- **Lines of Documentation**: 15,000+

---

## ✅ Documentation Checklist

### Documentation is Complete When:

- [x] All pages in sitemap have detailed docs
- [x] All API endpoints documented with examples
- [x] Business logic explained in feature docs
- [x] Architecture and integrations documented
- [x] Handover guide for new developers
- [x] Common issues and solutions listed
- [x] Code patterns and examples provided
- [x] Visual diagrams for complex flows
- [x] Cross-references between related docs
- [x] Quick reference cards available

---

**Last Updated**: January 13, 2026  
**Documentation Version**: 2.0  
**Status**: ✅ Complete and Production Ready  

**Maintained by**: Development Team  
**For Questions**: See [HANDOVER.md](./HANDOVER.md) → Getting Help

## 🔑 Key Differences from Old Docs

### What's Changed

✅ **Removed Duplicates** - Information that appeared in multiple files is now in one place  
✅ **Organized Logically** - Related information grouped together  
✅ **Removed Outdated Content** - Only current, implemented features included  
✅ **Added Quick Starts** - Every document starts with quick start section  
✅ **Cross-Referenced** - Links between related documents  
✅ **Comprehensive Examples** - Real code examples from the codebase  

### What's Consolidated

**Architecture Document** combines:
- DATABASE_ARCHITECTURE_SHARED.md
- STUDENT_AUTHORIZATION_SECURITY.md
- API_RESILIENCE_AUDIT.md
- RESILIENCE_QUICK_REFERENCE.md

**Child Actions Document** combines:
- CHILD_ACTIONS_QUICK_REFERENCE.md
- ACTIONS_INDEPENDENCE.md
- ACTIONS_SIMPLIFIED.md
- CHILD_EDIT_FEATURE.md

**Notifications Document** combines:
- NOTIFICATION_ARCHITECTURE.md
- NOTIFICATION_README.md
- NOTIFICATION_QUICK_START.md
- NOTIFICATION_INTEGRATION_EXAMPLES.md
- TOAST_NOTIFICATION_SYSTEM.md
- TOAST_QUICK_REFERENCE.md

**Admin Panel Document** combines:
- ADMIN_CONFIG_SYSTEM.md
- ADMIN_CONFIG_QUICKSTART.md
- ADMIN_ACADEMIC_YEAR_CONFIG.md
- ADMIN_ANALYTICS.md
- ACADEMIC_YEAR_IMPLEMENTATION.md

---

## 📖 Document Conventions

### Structure

Each document follows this structure:
1. **Quick Start** - Get up and running quickly
2. **Overview** - High-level understanding
3. **Detailed Topics** - Deep dive into specifics
4. **Examples** - Real-world code examples
5. **Troubleshooting** - Common issues and solutions
6. **Related Docs** - Links to related documentation

### Code Examples

- All code examples are from actual implementation
- Examples show complete, working code (no placeholders)
- Includes error handling and edge cases
- Demonstrates best practices

### Visual Aids

- ASCII diagrams for system flows
- Tables for configuration references
- Checklists for processes
- Status matrices for rules

---

## 🔍 Finding Information

### By Topic

| Topic | Document | Section |
|-------|----------|---------|
| Database Schema | Architecture | Database Architecture |
| API Timeouts | Architecture | API Resilience |
| Circuit Breakers | Architecture | API Resilience |
| Authorization | Architecture | Student Authorization Security |
| Student Status | Child Actions | Status Flow |
| Action Badges | Child Actions | Badge Display Rules |
| Update Info vs Conduct | Child Actions | System Overview |
| Database Notifications | Notifications | System Architecture |
| Toast Messages | Notifications | Toast Notifications |
| Admin Users | Admin Panel | Admin Access Control |
| Update Windows | Admin Panel | Update Period Management |
| Academic Years | Admin Panel | Academic Year Management |
| System Stats | Admin Panel | Admin Analytics |

### By Use Case

| Use Case | Document | Section |
|----------|----------|---------|
| Adding API timeout | Architecture | API Resilience |
| Checking student access | Architecture | Student Authorization Security |
| Showing/hiding actions | Child Actions | Action Availability |
| Understanding status flow | Child Actions | Status Flow |
| Sending notifications | Notifications | Usage Examples |
| Toast feedback | Notifications | Toast Notifications |
| Creating admin users | Admin Panel | Admin Access Control |
| Setting update periods | Admin Panel | Update Period Management |
| Changing academic year | Admin Panel | Academic Year Management |

---

## 🛠️ Maintenance

### Updating Documentation

When making changes to the system:

1. **Update relevant consolidated doc** - Don't create new files
2. **Keep examples current** - Update code examples if implementation changes
3. **Update version date** - Change "Last Updated" date at top of document
4. **Cross-reference changes** - Update related documents if needed
5. **Test examples** - Verify code examples still work

### Adding New Features

For new features:

1. **Identify document** - Which consolidated doc should it go in?
2. **Add to TOC** - Update table of contents
3. **Add Quick Start entry** - If it's a major feature
4. **Update this README** - Add to finding information tables
5. **Cross-reference** - Link from related documents

---

## 📞 Support

For questions or clarifications:

1. Check the relevant consolidated document
2. Search for specific terms using your editor
3. Review code examples in the document
4. Check related documents (cross-references at bottom)
5. Review actual implementation in codebase

---

## ⚡ Quick Reference

### Important URLs

- Admin Panel: `/admin/eid`
- Notifications Page: `/notifications`
- Student Profile: `/child/[id]`
- Update Info: `/child/[id]/update-info`
- Conduct Agreement: `/child/[id]/parent-conduct`

### Important Files

- Auth Config: `lib/auth.ts`
- OneRoster: `lib/oneroster.ts`
- Admin Config: `lib/admin-config.ts`
- Notifications: `lib/notifications.ts`
- Child Actions: `lib/child-actions.ts`
- Prisma Schema: `prisma/parent-portal/schema.prisma`

### Key Commands

```bash
# Development
npm run dev

# Prisma
npm run prisma:pp:generate
npm run prisma:pp:push
npm run prisma:pp:studio

# Build
npm run build
npm start

# Lint
npm run lint
```

---

**Status:** ✅ Complete and Up-to-Date  
**Documents:** 4 Consolidated Files  
**Coverage:** All Implemented Features  

Maintained by the Development Team
