# API Routes Reference

Complete documentation of all API endpoints in the dls-react-moe application.

## Quick Reference Table

| API Route | Method(s) | Database Used | Page Link | Why Used | Status |
|-----------|-----------|---------------|-----------|----------|--------|
| `/api/auth/[...nextauth]` | ALL | Redis | [Login](../sitemap/03-login/README.md) | NextAuth OIDC authentication handler | ✅ Active |
| `/api/parent/conduct` | GET | Parent Portal + Shared DB | [Parent Conduct](../sitemap/08-child-parent-conduct/README.md) | Fetch aggregate conduct data | ✅ Active |
| `/api/parent/generate-conduct-pdf` | POST | None | [Parent Conduct](../sitemap/08-child-parent-conduct/README.md) | Server-side PDF generation with Arabic fonts | ✅ Active |
| `/api/parent/students-partnership-charter` | GET, POST | Parent Portal DB | [Dashboard](../sitemap/02-dashboard/README.md), [Child Detail](../sitemap/06-child-detail/README.md) | Check/submit conduct agreement signature | ✅ Active |
| `/api/parent/child-actions` | GET | Parent Portal + Shared DB | [Dashboard](../sitemap/02-dashboard/README.md), [Child Detail](../sitemap/06-child-detail/README.md) | Determine available actions for student | ✅ Active |
| `/api/parent/update-information-requests` | GET, POST, PATCH | Parent Portal DB | [Update Info](../sitemap/07-child-update-info/README.md), [Dashboard](../sitemap/02-dashboard/README.md) | Submit/retrieve/update student information | ✅ Active |
| `/api/students/[id]` | GET | Shared DB (Student) | [Child Detail](../sitemap/06-child-detail/README.md), [Profile](../sitemap/04-profile/README.md) | Fetch student data from shared database | ✅ Active |
| `/api/db/health` | GET | Shared DB (Student) | System Health | Test shared database connectivity | ✅ Active |
| `/api/db/health-parent` | GET | Parent Portal DB | System Health | Test parent portal database connectivity | ✅ Active |
| `/api/db/emirates` | GET | Shared DB (Student) | [Update Info](../sitemap/07-child-update-info/README.md) | Populate UAE emirates dropdown | ✅ Active |
| `/api/db/regions` | GET | Shared DB (Student) | [Update Info](../sitemap/07-child-update-info/README.md) | Load regions for Abu Dhabi cascade | ✅ Active |
| `/api/db/zones` | GET | Shared DB (Student) | [Update Info](../sitemap/07-child-update-info/README.md) | Load zones for Abu Dhabi cascade | ✅ Active |
| `/api/db/areas` | GET | Shared DB (Student) | [Update Info](../sitemap/07-child-update-info/README.md) | Load areas with grade/gender filtering | ✅ Active |
| `/api/db/plots` | GET | Shared DB (Student) | [Update Info](../sitemap/07-child-update-info/README.md) | Enrich plot data after map selection | ✅ Active |
| `/api/admin/check-access` | GET | Parent Portal DB | [Admin EID](../sitemap/11-admin-eid/README.md) | Verify user has admin permissions | ✅ Active |
| `/api/admin/academic-year/active` | GET | Parent Portal DB | [Admin EID](../sitemap/11-admin-eid/README.md) | Get currently active academic year | ✅ Active |
| `/api/admin/config/academic-year` | GET, POST, PATCH, DELETE | Parent Portal DB | [Admin EID](../sitemap/11-admin-eid/README.md) | Manage academic year configurations | ✅ Active |
| `/api/admin/config/periods` | GET, POST, PATCH, DELETE | Parent Portal DB | [Admin EID](../sitemap/11-admin-eid/README.md) | Manage update period configurations | ✅ Active |
| `/api/admin/config/actions` | GET, POST, PATCH, DELETE | Parent Portal DB | [Admin EID](../sitemap/11-admin-eid/README.md) | Manage action configurations by education type | ✅ Active |
| `/api/admin/config/users` | GET, POST, PATCH, DELETE | Parent Portal DB | [Admin EID](../sitemap/11-admin-eid/README.md) | Manage admin user access | ✅ Active |
| `/api/admin/config/status` | GET | Parent Portal DB | [Admin EID](../sitemap/11-admin-eid/README.md) | Get current configuration status | ✅ Active |
| `/api/admin/analytics/stats` | GET | Parent Portal + Shared DB | [Admin EID](../sitemap/11-admin-eid/README.md) | Display student statistics and metrics | ✅ Active |
| `/api/admin/analytics/students` | GET | Parent Portal + Shared DB | [Admin EID](../sitemap/11-admin-eid/README.md) | Paginated student list with filters | ✅ Active |
| `/api/admin/analytics/updates` | GET | Parent Portal DB | [Admin EID](../sitemap/11-admin-eid/README.md) | Track information update history | ✅ Active |
| `/api/admin/resilience-metrics` | GET, POST | Redis (Metrics) | [Admin EID](../sitemap/11-admin-eid/README.md) | View/reset API circuit breaker metrics | ✅ Active |
| `/api/notifications` | GET, POST | Parent Portal DB | [Notifications](../sitemap/05-notifications/README.md), [Dashboard](../sitemap/02-dashboard/README.md) | Fetch/create user notifications | ✅ Active |
| `/api/notifications/count` | GET | Parent Portal DB | [Dashboard](../sitemap/02-dashboard/README.md) (Header) | Get unread notification count | ✅ Active |
| `/api/notifications/[id]/read` | PATCH | Parent Portal DB | [Notifications](../sitemap/05-notifications/README.md) | Mark single notification as read | ✅ Active |
| `/api/notifications/mark-all-read` | POST | Parent Portal DB | [Notifications](../sitemap/05-notifications/README.md) | Mark all notifications as read | ✅ Active |
| `/api/notifications/email` | POST | None (Email Service) | [Parent Conduct](../sitemap/08-child-parent-conduct/README.md) | Send PDF via email to parent | ✅ Active |
| `/api/notifications/sms` | POST | None (SMS Service) | Multiple Pages | Send SMS notifications | ✅ Active |
| `/api/PP/auth/token` | GET | None (OAuth) | All PP API Calls | Get OAuth token for .NET backend | ✅ Active |
| `/api/PP/persons` | GET | None (.NET API) | Legacy | Look up persons by Emirates ID | ⚠️ Legacy |
| `/api/PP/ChildList/[eid]` | GET | None (.NET API) | [Dashboard](../sitemap/02-dashboard/README.md) | Get children list from .NET API | ⚠️ Legacy |
| `/api/PP/student/[id]` | GET | None (.NET API) | [Child Detail](../sitemap/06-child-detail/README.md) | Get student from .NET API | ⚠️ Legacy |
| `/api/PP/student/[id]/enrollments` | GET | None (.NET API) | [Child Detail](../sitemap/06-child-detail/README.md) | Get enrollments from .NET API | ⚠️ Legacy |
| `/api/PP/school/[id]` | GET | None (.NET API) | [Child Detail](../sitemap/06-child-detail/README.md) | Get school details from .NET API | ⚠️ Legacy |
| `/api/PP/child/sync` | GET, POST | Parent Portal + .NET API | [Admin EID](../sitemap/11-admin-eid/README.md) | Sync data between systems | ⚠️ Maintenance |
| `/api/PP/myapplications` | POST | None (.NET API) | [Applications](../sitemap/09-parent-applications/README.md) | Forward applications to legacy system | ⚠️ Legacy |
| `/api/PP/information-status/[studentSourcedId]` | PATCH | None (.NET API) | [Update Info](../sitemap/07-child-update-info/README.md) | Sync status changes to .NET backend | ✅ Active |
| `/api/PP/conduct-status/[studentSourcedId]` | PATCH | None (.NET API) | [Parent Conduct](../sitemap/08-child-parent-conduct/README.md) | Sync conduct signatures to .NET backend | ✅ Active |
| `/api/backoffice/idh` | GET, POST | None (IDH Ministry API) | [Update Info](../sitemap/07-child-update-info/README.md) | Interface with Ministry IDH system | ✅ Active |
| `/api/debug/student/[id]` | GET | Shared DB (Student) | Development Only | Debug student data inspection | 🔧 Debug |
| `/api/debug/conduct` | GET | Parent Portal + Shared DB | Development Only | Debug conduct aggregation flow | 🔧 Debug |

### Status Legend

- ✅ **Active**: Actively used in production
- ⚠️ **Legacy**: Backward compatibility with .NET system, may be deprecated
- ⚠️ **Maintenance**: Admin/maintenance operations only
- 🔧 **Debug**: Development/debugging only, disabled in production

---

## Table of Contents

- [Authentication APIs](#authentication-apis)
- [Authentication APIs](#authentication-apis)
- [Parent Portal APIs](#parent-portal-apis)
- [Student Data APIs](#student-data-apis)
- [Database APIs](#database-apis)
- [Admin Panel APIs](#admin-panel-apis)
- [Notification APIs](#notification-apis)
- [Backend Integration APIs](#backend-integration-apis)
- [Debug APIs](#debug-apis)
---

## Authentication APIs

### `/api/auth/[...nextauth]`
**Methods:** ALL (NextAuth handler)  
**Purpose:** NextAuth authentication handler for OIDC/OAuth login  
**Used For:**
- Emirates ID authentication via Auth0/OIDC
- Session management with JWT
- Credentials provider for mobile token authentication
- Automatic token refresh and storage in Redis

---

## Parent Portal APIs

### `/api/parent/conduct`
**Method:** GET  
**Purpose:** Aggregate parent conduct data for a student  
**Query Params:** `studentPersonId`, `parentEid`, `academicYear`, `nocache`  
**Used For:**
- Fetching conduct agreement form data
- Displaying student, parent, and school information for conduct PDF
- Pre-filling conduct agreement forms

### `/api/parent/generate-conduct-pdf`
**Method:** POST  
**Purpose:** Server-side PDF generation for conduct agreements  
**Request Body:** `PdfFormData`, `template` (uae/expats)  
**Used For:**
- Generating filled PDF forms with Arabic font support
- Creating conduct agreement PDFs for UAE nationals and expats
- Embedding Cairo/Alexandria fonts for proper Arabic rendering

### `/api/parent/students-partnership-charter`
**Method:** GET  
**Purpose:** Check if conduct agreement is signed  
**Query Params:** `studentNumber`, `academicYear`, `nocache`  
**Used For:**
- Checking signature status before showing sign button
- Retrieving signed PDF from database
- Displaying signature date and status

**Method:** POST  
**Purpose:** Submit signed conduct agreement  
**Request Body:** `academicyear`, `studentNumber`, `attachment01` (base64 PDF), `datetime`  
**Used For:**
- Saving signed conduct PDF to database
- Recording signature timestamp
- Marking agreement as complete

### `/api/parent/child-actions`
**Method:** GET  
**Purpose:** Get available actions for a student  
**Query Params:** `studentPersonId`, `parentPersonId`, `studentEmirateId`, `educationType`, `schoolYear`  
**Used For:**
- Determining which actions to show (update info, sign conduct, download PDF)
- Checking IDH status and update period eligibility
- Displaying action buttons with proper disabled states
- Showing status banners and badges

### `/api/parent/update-information-requests`
**Method:** POST  
**Purpose:** Submit student information update request  
**Request Body:** Student data with address, contacts, transportation  
**Used For:**
- Submitting parent-initiated information updates
- Creating update request records in database
- Sending data to IDH system for approval

**Method:** GET  
**Purpose:** Retrieve update request for a student  
**Query Params:** `studentPersonId`, `parentPersonId`  
**Used For:**
- Checking if student has pending update request
- Retrieving previous submission data
- Displaying update status to parent

**Method:** PATCH  
**Purpose:** Update existing information request  
**Used For:**
- Modifying pending update requests
- Resubmitting after rejection

---

## Student Data APIs

### `/api/students/[id]`
**Method:** GET  
**Purpose:** Get student profile from shared database  
**URL Params:** `id` (student sourcedId)  
**Query Params:** `nocache`  
**Used For:**
- Fetching complete student information
- Displaying student profile page
- Showing enrollment, demographic, and contact data

---

---

## Database APIslth`
**Method:** GET  
**Purpose:** Check shared database connectivity  
**Used For:**
- Testing SQL Server connection (Student database)
- Health monitoring
- Deployment verification

### `/api/db/health-parent`
**Method:** GET  
**Purpose:** Check parent portal database connectivity  
**Used For:**
- Testing parent portal database connection
- Health monitoring
- Deployment verification

### `/api/db/emirates`
**Method:** GET  
**Purpose:** Get list of UAE emirates  
**Used For:**
- Populating emirate dropdown in AddressPicker
- Address selection forms

### `/api/db/regions`
**Method:** GET  
**Purpose:** Get regions for an emirate  
**Query Params:** `emirateId`  
**Used For:**
- Abu Dhabi address selection (Region → Zone → Area)
- Cascading dropdown population

### `/api/db/zones`
**Method:** GET  
**Purpose:** Get zones for a region  
**Query Params:** `regionId`  
**Used For:**
- Abu Dhabi address selection (second level)
- Cascading dropdown population

### `/api/db/areas`
**Method:** GET  
**Purpose:** Get areas for emirate or zone  
**Query Params:** `emirateId`, `zoneId`, `isAbuDhabi`, `gradeCode`, `genderCode`  
**Used For:**
- Dubai/Northern Emirates address selection (direct area lookup)
- Abu Dhabi address selection (third level after zone)
- Filtering by student grade and gender for school zones

### `/api/db/plots`
**Method:** GET  
**Purpose:** Get ManhalCodes from address hierarchy based on GISID lookup  
**Query Params:** `filter` (required) - GISID suffix to match against PlotId or PlotNumber  
**Data Source:** `AuhAddresses` table (refreshed address authority data)  
**Response:**
```typescript
{
  data: {
    areaId: number,
    areaManhalCode: string | null,      // SectorCode
    zoneId: number,
    zoneManhalCode: string | null,      // RegionCode
    regionId: number,
    regionManhalCode: string | null,    // CityCode
    emirateId: number,
    emirateManhalCode: string | null    // StateCode
  },
  meta: { filter: string, count: number }
}
```
**Used For:**
- Fetching ManhalCodes for Abu Dhabi addresses during student info updates
- Enriching address data before submission to IDH API
- Replacing direct Onwani API calls with database lookups

**See:** [Address System Migration](../features/ADDRESS_SYSTEM_MIGRATION.md) for complete documentation

---

## Admin Panel APIs

### `/api/admin/check-access`
**Method:** GET  
**Purpose:** Verify if user has admin access  
**Used For:**
- Checking if Emirates ID is in admin users table
- Protecting admin routes
- Showing/hiding admin navigation

### `/api/admin/academic-year/active`
**Method:** GET  
**Purpose:** Get currently active academic year  
**Used For:**
- Displaying active year in admin panel
- Using in queries that need academic year context
- Defaulting academic year selections

### `/api/admin/config/academic-year`
**Method:** GET  
**Purpose:** Get all academic year configurations  
**Query Params:** `activeOnly=true` (optional)  
**Used For:**
- Listing academic years in admin panel
- Managing academic year settings

**Method:** POST  
**Purpose:** Create new academic year or initialize defaults  
**Request Body:** `academicYear`, `yearValue`, `isActive`, `description` OR `initializeDefaults: true`  
**Used For:**
- Adding new academic years
- Setting up initial 6-year range (2025-2031)

**Method:** PATCH  
**Purpose:** Update academic year  
**Request Body:** `id`, updates  
**Used For:**
- Changing active academic year
- Updating descriptions

**Method:** DELETE  
**Purpose:** Delete academic year  
**Query Params:** `id`  
**Used For:**
- Removing academic year configurations
- Cannot delete active year

### `/api/admin/config/periods`
**Method:** GET  
**Purpose:** Get all update period configurations  
**Used For:**
- Listing update periods in admin panel
- Checking current active periods

**Method:** POST  
**Purpose:** Create new update period  
**Request Body:** `name`, `startDate`, `endDate`, `isEnabled`, `description`  
**Used For:**
- Setting time windows for information updates
- Controlling when parents can update student data

**Method:** PATCH  
**Purpose:** Update update period  
**Request Body:** `id`, updates  
**Used For:**
- Enabling/disabling periods
- Adjusting dates

**Method:** DELETE  
**Purpose:** Delete update period  
**Query Params:** `id`  
**Used For:**
- Removing period configurations

### `/api/admin/config/actions`
**Method:** GET  
**Purpose:** Get student action configurations  
**Query Params:** `educationType` (optional)  
**Used For:**
- Listing configured actions by education type
- Managing which actions appear for different student types

**Method:** POST  
**Purpose:** Create new action configuration  
**Request Body:** `educationType`, `actionName`, `actionKey`, `isEnabled`, `displayOrder`, `configJson`  
**Used For:**
- Adding custom actions
- Configuring action visibility rules

**Method:** PATCH  
**Purpose:** Update action configuration  
**Request Body:** `id`, updates  
**Used For:**
- Modifying action settings
- Changing order and availability

**Method:** DELETE  
**Purpose:** Delete action configuration  
**Query Params:** `id`  
**Used For:**
- Removing action configurations

### `/api/admin/config/users`
**Method:** GET  
**Purpose:** Get all admin users  
**Used For:**
- Listing admin users in panel
- Managing admin access

**Method:** POST  
**Purpose:** Add new admin user  
**Request Body:** `emirateId`, `name`, `email`, `isActive`  
**Used For:**
- Granting admin access to users
- Adding to admin whitelist

**Method:** PATCH  
**Purpose:** Update admin user  
**Request Body:** `id`, updates  
**Used For:**
- Activating/deactivating admins
- Updating contact info

**Method:** DELETE  
**Purpose:** Delete admin user  
**Query Params:** `id`  
**Used For:**
- Removing admin access

### `/api/admin/config/status`
**Method:** GET  
**Purpose:** Get current configuration status  
**Query Params:** `educationType` (optional)  
**Used For:**
- Checking if update period is active
- Getting enabled actions for education type
- Displaying status in admin panel

### `/api/admin/analytics/stats`
**Method:** GET  
**Purpose:** Get analytics statistics  
**Query Params:** `emirateId` (optional)  
**Used For:**
- Displaying student counts by status
- Showing update request statistics
- Admin dashboard metrics

### `/api/admin/analytics/students`
**Method:** GET  
**Purpose:** Get paginated student list with filters  
**Query Params:** `page`, `limit`, `emirateId`, `status`, `search`  
**Used For:**
- Students table in admin panel
- Filtering and searching students
- Bulk data view

### `/api/admin/analytics/updates`
**Method:** GET  
**Purpose:** Get update request logs  
**Query Params:** `page`, `limit`, `status`  
**Used For:**
- Update logs table in admin panel
- Tracking information update history
- Audit trail

### `/api/admin/resilience-metrics`
**Method:** GET  
**Purpose:** Get API resilience metrics  
**Used For:**
- Monitoring circuit breaker states
- Viewing API success/failure rates
- System health dashboard

**Method:** POST  
**Purpose:** Reset resilience metrics  
**Request Body:** `service` (optional - specific service or "all")  
**Used For:**
- Clearing accumulated metrics
- Resetting circuit breakers

---

## Notification APIs

### `/api/notifications`
**Method:** GET  
**Purpose:** Fetch user notifications with filtering  
**Query Params:** `status` (all/read/unread), `type`, `limit`, `offset`  
**Used For:**
- Notifications page listing
- Dropdown notifications
- Fetching recent notifications

**Method:** POST  
**Purpose:** Create new notification (admin/system use)  
**Request Body:** `userId`, `type`, `title`, `body`, `data`  
**Used For:**
- System-generated notifications
- Admin broadcasts
- Status change alerts

### `/api/notifications/count`
**Method:** GET  
**Purpose:** Get unread notification count  
**Used For:**
- Bell icon badge number
- Notification counter
- Real-time notification checks

### `/api/notifications/[id]/read`
**Method:** PATCH  
**Purpose:** Mark single notification as read  
**URL Params:** `id`  
**Used For:**
- Marking individual notifications read on click
- Updating read status

### `/api/notifications/mark-all-read`
**Method:** POST  
**Purpose:** Mark all notifications as read  
**Used For:**
- "Mark all as read" button
- Bulk read operation

### `/api/notifications/email`
**Method:** POST  
**Purpose:** Send email with PDF attachment  
**Request Body:** `to`, `pdf64`  
**Used For:**
- Emailing signed conduct PDFs to parents
- PDF delivery via email

### `/api/notifications/sms`
**Method:** POST  
**Purpose:** Send SMS notification  
**Request Body:** `to`, `message`  
**Used For:**
- SMS alerts for status changes
- Text message notifications

---

## Backend Integration APIs

### `/api/PP/auth/token`
**Method:** GET  
**Purpose:** Get or generate Parent Portal API access token  
**Used For:**
- Authenticating with .NET backend API
- OAuth client credentials flow
- Token caching in memory

### `/api/PP/persons`
**Method:** GET  
**Purpose:** Get persons list from Parent Portal API  
**Query Params:** `eid` (Emirates ID)  
**Used For:**
- Looking up parents by Emirates ID
- Resolving person records
- Legacy .NET API integration

### `/api/PP/ChildList/[eid]`
**Method:** GET  
**Purpose:** Get children list for parent from .NET API  
**URL Params:** `eid` (parent Emirates ID)  
**Used For:**
- Dashboard children list
- Legacy system compatibility
- Fallback when OneRoster unavailable

### `/api/PP/student/[id]`
**Method:** GET  
**Purpose:** Get student profile from .NET API  
**URL Params:** `id` (student person ID)  
**Used For:**
- Legacy student profile data
- Backward compatibility

### `/api/PP/student/[id]/enrollments`
**Method:** GET  
**Purpose:** Get student enrollments from .NET API  
**URL Params:** `id`  
**Used For:**
- Enrollment history from legacy system

### `/api/PP/school/[id]`
**Method:** GET  
**Purpose:** Get school information from .NET API  
**URL Params:** `id` (school sourcedId)  
**Used For:**
- School details
- Contact information
- Legacy integration

### `/api/PP/child/sync`
**Method:** GET  
**Purpose:** Get sync status  
**Method:** POST  
**Purpose:** Trigger child data sync between systems  
**Used For:**
- Synchronizing data between Next.js and .NET backend
- Data migration operations
- System maintenance

### `/api/PP/myapplications`
**Method:** POST  
**Purpose:** Submit application through .NET API  
**Used For:**
- Forwarding applications to legacy system
- Application processing
- Backward compatibility

### `/api/PP/information-status/[studentSourcedId]`
**Method:** PATCH  
**Purpose:** Update information request status in .NET system  
**URL Params:** `studentSourcedId`  
**Used For:**
- Syncing status changes to .NET backend
- Update request workflow
- System integration

### `/api/PP/conduct-status/[studentSourcedId]`
**Method:** PATCH  
**Purpose:** Update conduct status in .NET system  
**URL Params:** `studentSourcedId`  
**Used For:**
- Syncing conduct signatures to backend
- Agreement tracking
- System integration

---

## Backend Integration APIs (IDH)

### `/api/backoffice/idh`
**Method:** GET  
**Purpose:** Get student information from IDH system  
**Query Params:** `eid`, `studentNumber`, `schoolYear`, `nocache`  
**Used For:**
- Fetching student data from Ministry's IDH system
- Getting update request status
- Checking approval/rejection status
- Circuit breaker protected with retry logic

**Method:** POST  
**Purpose:** Submit student information to IDH system  
**Request Body:** Student update data  
**Used For:**
- Submitting parent information updates to IDH
- Triggering IDH approval workflow
- Creating new IDH records

---

## Debug APIs

### `/api/debug/student/[id]`
**Method:** GET  
**Purpose:** Debug endpoint to inspect student data  
**URL Params:** `id` (student sourcedId)  
**Query Params:** `nocache`  
**Used For:**
- Development debugging
- Data inspection
- Testing data flows

### `/api/debug/conduct`
**Method:** GET  
**Purpose:** Debug conduct aggregation flow  
**Query Params:** `studentPersonId`, `parentEid`, `schoolYear`, `nocache`  
**Used For:**
- Step-by-step debugging of conduct data flow
- Testing Parent Portal API integration
- Verifying data aggregation logic

---

## API Usage Patterns

### Common Query Parameters

- **`nocache=1`** - Force fresh data fetch, bypass cache
- **`studentPersonId`** - Student identifier from shared database
- **`studentSourcedId`** - Student identifier from OneRoster
- **`eid`** - Emirates ID (format: 784-XXXX-XXXXXXX-X)
- **`academicYear`** - Academic year string (e.g., "2025-2026")
- **`schoolYear`** - School year number (e.g., 2026)

### Authentication

All authenticated endpoints require:
- Valid NextAuth session
- Emirates ID in session.user
- Some admin endpoints require admin user check

### Caching Strategy

- OneRoster calls: No cache (`cache: "no-store"`)
- Database queries: Cached results with `nocache` override
- Parent Portal API: Token caching with automatic refresh
- IDH API: Queue-based with circuit breaker protection

### Error Handling

Standard error response format:
```json
{
  "error": "Error message",
  "details": "Additional context"
}
```

Common status codes:
- `200` - Success
- `400` - Bad request / validation error
- `401` - Unauthorized / no session
- `403` - Forbidden / insufficient permissions
- `404` - Resource not found
- `429` - Rate limited / circuit breaker open
- `500` - Server error / external API failure

---

## Integration Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ├─ /api/parent/* ────────┐
       ├─ /api/notifications/* ─┤
       ├─ /api/admin/* ─────────┤
       │                        │
       v                        v
┌──────────────┐        ┌──────────────┐
│  Next.js API │───────>│ SQL Server   │
│   Routes     │<───────│ (Shared DB)  │
└──────┬───────┘        └──────────────┘
       │
       ├─ /api/oneroster/* ──> OneRoster Vendor API
       ├─ /api/PP/* ─────────> .NET Parent Portal API
       ├─ /api/backoffice/* ─> IDH Ministry System
       └─ /api/db/* ─────────> SQL Server (Parent DB)
```

---

## Performance Considerations

- **OneRoster APIs**: Add `nocache=1` only when fresh data is critical
- **Database APIs**: Use pagination for large datasets
- **IDH APIs**: Queue-based processing to prevent overload
- **Notification APIs**: Limit query with `limit` parameter
       ├─ /api/PP/* ─────────> .NET Parent Portal API
---

## Security Notes

- All `/api/admin/*` routes check for admin user access
- `/api/parent/*` routes require authenticated session
- `/api/PP/*` routes use OAuth token with automatic refresh
- `/api/backoffice/idh` uses circuit breaker for resilience
- Emirates ID format validation on all inputs
- SQL injection protection via Prisma ORM
- XSS protection via Next.js automatic escaping

---

*Last Updated: December 2025*
