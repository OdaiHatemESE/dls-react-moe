# Sitemap Quick Reference Index

Quick links to all page documentation with key information at a glance.

## 📑 Table of Contents

1. [Home](#1-home-)
2. [Dashboard](#2-dashboard-dashboard)
3. [Login](#3-login-login)
4. [Profile](#4-profile-profile)
5. [Notifications](#5-notifications-notifications)
6. [Child Detail](#6-child-detail-childid)
7. [Update Info](#7-update-info-childidupdate-info)
8. [Parent Conduct](#8-parent-conduct-childidparent-conduct)
9. [My Applications](#9-my-applications-parentapplications)
10. [Parent Summary](#10-parent-summary-parentsummary)
11. [Admin Panel](#11-admin-panel-admineid)
12. [Sign Out](#12-sign-out-signout)

---

## 1. Home (/)
📂 [Full Documentation](./01-home/README.md)

**Purpose**: Landing page with auto-redirect  
**Auth**: Public  
**Key APIs**: None  
**Main Action**: Redirects to `/dashboard`

| Feature | Details |
|---------|---------|
| Redirect Target | `/dashboard` |
| Loading State | ✅ |
| i18n | ✅ |

---

## 2. Dashboard (/dashboard)
📂 [Full Documentation](./02-dashboard/README.md)

**Purpose**: Main parent hub showing all children  
**Auth**: Required (Parent + Emirates ID)  
**Key APIs**: 
- `GET /api/PP/ChildList/:eid` - Get children
- `GET /api/PP/child/sync` - Sync data

| Feature | Details |
|---------|---------|
| Data Sync | ✅ Manual refresh |
| Cache | ✅ SWR caching |
| RTL Support | ✅ |
| Mobile | ✅ Optimized |

**Navigation To**: Child Detail, Profile, Notifications

---

## 3. Login (/login)
📂 [Full Documentation](./03-login/README.md)

**Purpose**: Authentication entry point  
**Auth**: Public  
**Key APIs**: NextAuth OIDC flow

| Feature | Details |
|---------|---------|
| Provider | UAE Pass (OIDC) |
| Auto-Redirect | ✅ |
| Callback URL | ✅ Preserved |
| Security | PKCE + State |

**Flow**: Login → UAE Pass → Callback → Dashboard

---

## 4. Profile (/profile)
📂 [Full Documentation](./04-profile/README.md)

**Purpose**: Parent personal information  
**Auth**: Required (Parent)  
**Key APIs**: 
- `GET /api/PP/persons?eid=:eid` - Get parent data

| Feature | Details |
|---------|---------|
| Emirates ID Check | ✅ Shows warning if missing |
| Contact Info | ✅ Email, Phone |
| Address | ✅ Full address display |
| Bilingual Names | ✅ Arabic + English |

---

## 5. Notifications (/notifications)
📂 [Full Documentation](./05-notifications/README.md)

**Purpose**: Notification management center  
**Auth**: Required (Parent + Emirates ID)  
**Key APIs**: 
- `GET /api/notifications` - List notifications
- `PATCH /api/notifications/:id/read` - Mark read
- `POST /api/notifications/mark-all-read` - Bulk mark

| Feature | Details |
|---------|---------|
| Filters | Status, Type |
| Pagination | ✅ Load more |
| Unread Count | ✅ Real-time |
| Mark All Read | ✅ |

**Notification Types**: 13 types including info, success, warning, error, enrollment, update, conduct, etc.

---

## 6. Child Detail (/child/[id])
📂 [Full Documentation](./06-child-detail/README.md)

**Purpose**: Comprehensive student profile  
**Auth**: Required (Parent + Emirates ID)  
**Key APIs**: 
- `GET /api/PP/student/:id` - Student details
- `GET /api/PP/child/sync` - Sync data
- `GET /api/admin/academic-year/active` - Current year

| Feature | Details |
|---------|---------|
| Tabs | Info, School, Grades |
| Conduct Signing | ✅ If active |
| Data Sync | ✅ Manual refresh |
| Breadcrumb | ✅ Back to dashboard |

**Actions**: Update Info, Sign Conduct, View Grades

---

## 7. Update Info (/child/[id]/update-info)
📂 [Full Documentation](./07-child-update-info/README.md)

**Purpose**: Update student information  
**Auth**: Required (Parent + Emirates ID)  
**Key APIs**: 
- `GET /api/PP/student/:id` - Current data
- `POST /api/PP/student/:id/update` - Submit update
- `POST /api/file-share/upload` - Upload files

| Feature | Details |
|---------|---------|
| Form Fields | Phone, Address, Transportation |
| File Upload | ✅ Max 5 files, 10MB each |
| Validation | ✅ Real-time |
| Resubmit Mode | ✅ For returned apps |

**Workflow**: Fill form → Upload docs → Submit → Return to child detail

---

## 8. Parent Conduct (/child/[id]/parent-conduct)
📂 [Full Documentation](./08-child-parent-conduct/README.md)

**Purpose**: Sign student conduct agreement  
**Auth**: Required (Parent + Emirates ID)  
**Key APIs**: 
- `POST /api/PP/parent-conduct/sign` - Submit signature
- `GET /api/PP/parent-conduct/pdf` - Generate PDF

| Feature | Details |
|---------|---------|
| Signature Canvas | ✅ Touch-enabled |
| PDF Generation | ✅ Server-side |
| Download | ✅ Signed document |
| Academic Year | ✅ Tracked |

**Workflow**: View conduct → Sign → Generate PDF → Download

---

## 9. My Applications (/parent/applications)
📂 [Full Documentation](./09-parent-applications/README.md)

**Purpose**: Track student application status  
**Auth**: Required (Parent + Emirates ID)  
**Key APIs**: 
- `GET /api/PP/ChildList/:eid` - Get children
- `POST /api/PP/myapplications` - Get applications

| Feature | Details |
|---------|---------|
| Statistics | Total, In Progress, Accepted |
| Status Codes | 5 statuses (In Progress, Returned, Modified, Accepted, Rejected) |
| Actions | Resubmit, View Profile |
| Multi-Child | ✅ All children in one view |

**Status Flow**: Submit → In Progress → Accepted/Returned/Rejected

---

## 10. Parent Summary (/parent/summary)
📂 [Full Documentation](./10-parent-summary/README.md)

**Purpose**: Account overview dashboard  
**Auth**: Required (Parent + Emirates ID)  
**Key APIs**: 
- `GET /api/PP/summary?eid=:eid` - Summary data

| Feature | Details |
|---------|---------|
| Statistics | Children count, Enrollments, Updates, Conducts |
| Recent Updates | Last 5 activities |
| Pending Actions | Action reminders |
| Quick Navigation | ✅ To child details |

---

## 11. Admin Panel (/admin/eid)
📂 [Full Documentation](./11-admin-eid/README.md)

**Purpose**: Administrative configuration  
**Auth**: Required (Admin + Emirates ID whitelist)  
**Key APIs**: 
- `GET /api/admin/check-access` - Verify admin
- Multiple admin-specific APIs

| Feature | Details |
|---------|---------|
| Views | 8 sections (Analytics, Students, Logs, Users, Periods, Academic Year, Actions, Resilience) |
| User Management | ✅ Add/remove admins |
| Configuration | ✅ Update periods, Academic years |
| Monitoring | ✅ System health, Circuit breakers |

**Access Control**: Database whitelist by Emirates ID

---

## 12. Sign Out (/signout)
📂 [Full Documentation](./12-signout/README.md)

**Purpose**: Logout and session cleanup  
**Auth**: Public  
**Key APIs**: NextAuth signout

| Feature | Details |
|---------|---------|
| Session Clear | ✅ |
| Redis Cleanup | ✅ Token removal |
| Redirect | → /login |
| CSRF Protection | ✅ |

---

## 🔍 Quick Search

### By Feature

**File Upload**: Update Info (#7)  
**Data Sync**: Dashboard (#2), Child Detail (#6)  
**PDF Generation**: Parent Conduct (#8)  
**Filtering**: Notifications (#5), Applications (#9)  
**Statistics**: Dashboard (#2), Applications (#9), Admin (#11)  
**Signature**: Parent Conduct (#8)

### By API

**ChildList API**: Dashboard (#2), Applications (#9)  
**Student API**: Child Detail (#6), Update Info (#7)  
**Notifications API**: Notifications (#5)  
**Admin APIs**: Admin Panel (#11)  
**File Share API**: Update Info (#7)

### By User Role

**Parent Pages**: 1-10  
**Admin Pages**: 11  
**Public Pages**: 1, 3, 12

### By Authentication

**No Auth Required**: Home, Login, Signout  
**Parent Auth**: Dashboard, Profile, Notifications, Child pages, Parent pages  
**Admin Auth**: Admin Panel

---

## 📊 Page Complexity Matrix

| Page | APIs | Components | State | Complexity |
|------|------|------------|-------|------------|
| Home | 0 | 2 | Low | 🟢 Simple |
| Login | 1 | 3 | Low | 🟢 Simple |
| Signout | 1 | 2 | Low | 🟢 Simple |
| Dashboard | 2 | 10+ | Medium | 🟡 Medium |
| Profile | 1 | 8 | Low | 🟢 Simple |
| Notifications | 4 | 8 | High | 🔴 Complex |
| Child Detail | 3 | 15+ | High | 🔴 Complex |
| Update Info | 3 | 12+ | High | 🔴 Complex |
| Parent Conduct | 3 | 8 | Medium | 🟡 Medium |
| Applications | 2 | 10+ | Medium | 🟡 Medium |
| Summary | 1 | 8 | Medium | 🟡 Medium |
| Admin | 8+ | 20+ | High | 🔴 Complex |

---

## 🎯 Common Patterns

### Data Fetching
All pages use **SWR** for caching and data fetching:
```typescript
const { data, error, isLoading } = useSWR(key, fetcher);
```

### Authentication
All protected pages check session:
```typescript
const { data: session } = useSession();
const eid = session?.user?.emiratesId;
```

### Internationalization
All pages support i18n:
```typescript
const { t, locale } = useI18n();
const isRTL = locale === 'ar';
```

### Loading States
All data-driven pages have loading skeletons:
```typescript
if (isLoading) return <LoadingSkeleton />;
if (error) return <ErrorMessage />;
```

---

## 🔗 Quick Links

- [Main Sitemap README](./README.md) - Overview and structure
- [Visual Sitemap](./SITEMAP_VISUAL.md) - Diagrams and flows
- [Copilot Instructions](../.github/copilot-instructions.md) - Development guidelines

---

Last Updated: January 13, 2026
