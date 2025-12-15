# Admin Panel & Configuration

**Last Updated:** December 15, 2025  
**Version:** 1.0

---

## Table of Contents

- [Quick Start](#quick-start)
- [Admin Access Control](#admin-access-control)
- [Update Period Management](#update-period-management)
- [Student Actions Configuration](#student-actions-configuration)
- [Academic Year Management](#academic-year-management)
- [Admin Analytics](#admin-analytics)

---

## Quick Start

### Overview

The admin configuration system provides comprehensive management for:

1. **Admin Users** - Manage who can access the admin panel by Emirates ID
2. **Update Periods** - Configure time windows when parents can update student information
3. **Student Actions** - Define available actions for different education types
4. **Academic Year** - Set the active academic year for system operations
5. **Analytics** - View system statistics and student data

### Access Requirements

To access the admin panel:
1. User must be authenticated
2. User's Emirates ID must exist in `AdminUser` table
3. User's `isActive` flag must be true

### Admin Panel Location

**URL:** `/admin/eid`

---

## Admin Access Control

### Database Schema

```prisma
model AdminUser {
  id        Int      @id @default(autoincrement())
  emirateId String   @unique
  name      String
  email     String?
  isActive  Boolean  @default(true)
  createdBy String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Setup First Admin User

**Option A - Direct SQL:**
```sql
INSERT INTO AdminUser (emirateId, name, email, isActive, createdBy, createdAt, updatedAt)
VALUES ('7841234123456701', 'System Admin', 'admin@moe.gov.ae', 1, 'system', GETDATE(), GETDATE());
```

**Option B - Prisma Studio:**
```bash
npx prisma studio --schema=prisma/parent-portal/schema.prisma
```

### API Endpoints

- `GET /api/admin/config/users` - List all admin users
- `POST /api/admin/config/users` - Create new admin user
- `PATCH /api/admin/config/users` - Update admin user
- `DELETE /api/admin/config/users?id={id}` - Delete admin user
- `GET /api/admin/check-access` - Check if current user has admin access

### Managing Admin Users

#### Add Admin User
```typescript
POST /api/admin/config/users
{
  "emirateId": "784-1234-1234567-1",
  "name": "John Doe",
  "email": "john@example.com",
  "isActive": true
}
```

#### Update Admin User
```typescript
PATCH /api/admin/config/users
{
  "id": 1,
  "name": "John Doe Updated",
  "isActive": false
}
```

#### Delete Admin User
```typescript
DELETE /api/admin/config/users?id=1
```

### Helper Functions

```typescript
import { isAdminUser } from "@/lib/admin-config";

// Check if user is admin
const isAdmin = await isAdminUser("784-1234-1234567-1");
```

---

## Update Period Management

### Database Schema

```prisma
model UpdatePeriodConfig {
  id          Int      @id @default(autoincrement())
  name        String
  startDate   DateTime
  endDate     DateTime
  isEnabled   Boolean  @default(false)
  description String?
  createdBy   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Purpose

Update periods define time windows when parents are allowed to update student information. Only enabled periods within the date range allow updates.

### API Endpoints

- `GET /api/admin/config/periods` - List all update periods
- `POST /api/admin/config/periods` - Create new period
- `PATCH /api/admin/config/periods` - Update period
- `DELETE /api/admin/config/periods?id={id}` - Delete period

### Configuration

#### Create Update Period
```typescript
POST /api/admin/config/periods
{
  "name": "Spring 2026 Updates",
  "startDate": "2026-03-01T00:00:00",
  "endDate": "2026-03-31T23:59:59",
  "isEnabled": true,
  "description": "Spring semester information update window"
}
```

#### Update Period
```typescript
PATCH /api/admin/config/periods
{
  "id": 1,
  "name": "Spring 2026 Updates (Extended)",
  "endDate": "2026-04-07T23:59:59",
  "isEnabled": true
}
```

#### Delete Period
```typescript
DELETE /api/admin/config/periods?id=1
```

### Integration with Parent Portal

#### Check if Updates Are Allowed
```typescript
import { isUpdatePeriodActive } from "@/lib/admin-config";

// In your server component or API route
const canUpdate = await isUpdatePeriodActive();

if (!canUpdate) {
  return <div>Updates not available at this time</div>;
}
```

#### Get Current Period Details
```typescript
import { getCurrentUpdatePeriod } from "@/lib/admin-config";

const period = await getCurrentUpdatePeriod();

if (period) {
  console.log(`Active until: ${period.endDate}`);
}
```

### Use Cases

#### Use Case 1: Scheduled Update Window
1. Admin creates period: "Fall 2026 Updates"
2. Sets dates: Sept 1-30, 2026
3. Enables the period
4. Parents can only update info during September

#### Use Case 2: Emergency Update Period
1. Urgent situation requires immediate updates
2. Admin creates new period with current dates
3. Enables it immediately
4. All parents can update right away
5. Admin disables when complete

---

## Student Actions Configuration

### Database Schema

```prisma
model StudentActionConfig {
  id             Int      @id @default(autoincrement())
  educationType  String
  actionName     String
  actionKey      String
  isEnabled      Boolean  @default(true)
  displayOrder   Int      @default(0)
  description    String?
  configJson     String?
  createdBy      String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@unique([educationType, actionKey])
}
```

### Purpose

Student actions determine which actions are available for students based on their education type (Public, Private, etc.).

### API Endpoints

- `GET /api/admin/config/actions` - List all actions (optional: `?educationType={type}`)
- `POST /api/admin/config/actions` - Create new action
- `PATCH /api/admin/config/actions` - Update action
- `DELETE /api/admin/config/actions?id={id}` - Delete action

### Configuration

#### Create Student Action
```typescript
POST /api/admin/config/actions
{
  "educationType": "Public",
  "actionName": "Update Contact Information",
  "actionKey": "update_contact",
  "isEnabled": true,
  "displayOrder": 1,
  "description": "Allow parents to update phone and email",
  "configJson": "{\"fields\": [\"phone\", \"email\"]}"
}
```

#### Update Action
```typescript
PATCH /api/admin/config/actions
{
  "id": 1,
  "isEnabled": false,
  "displayOrder": 5
}
```

#### Delete Action
```typescript
DELETE /api/admin/config/actions?id=1
```

### Integration with Parent Portal

#### Get Available Actions
```typescript
import { getEnabledActionsForEducationType } from "@/lib/admin-config";

// Get actions for student's education type
const actions = await getEnabledActionsForEducationType("Public");

// actions will be sorted by displayOrder
actions.forEach(action => {
  console.log(action.actionName, action.actionKey);
});
```

#### Use Status Component
```typescript
import { UpdatePeriodStatus } from "@/app/components/custom/UpdatePeriodStatus";

// In your parent portal page
<UpdatePeriodStatus 
  educationType="Public" 
  showActions={true} 
/>
```

### Use Case: Different Actions by School Type

**Public Schools:**
- Update Contact Info
- Update Address
- Upload Documents

**Private Schools:**
- Update Contact Info
- Update Emergency Contact
- Request Transfer

---

## Academic Year Management

### Database Schema

```prisma
model AcademicYearConfig {
  id               Int      @id @default(autoincrement())
  academicYear     String   @unique @db.VarChar(20)
  yearValue        Int
  isActive         Boolean  @default(false)
  description      String?  @db.VarChar(Max)
  createdBy        String?  @db.VarChar(64)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

### Purpose

The Academic Year Configuration allows administrators to manage and set the active academic year for the parent portal. This configuration determines which academic year is used throughout the system for various operations.

### Academic Year Format

The system uses a specific format:
- **Display Format:** "YYYY-YYYY" (e.g., "2025-2026")
- **Stored Value:** Ending year as integer (e.g., 2026)

### Available Years

| Academic Year | Year Value |
|---------------|------------|
| 2025-2026     | 2026       |
| 2026-2027     | 2027       |
| 2027-2028     | 2028       |
| 2028-2029     | 2029       |
| 2029-2030     | 2030       |
| 2030-2031     | 2031       |

### API Endpoints

- `GET /api/admin/config/academic-year` - List all years or get active year
- `POST /api/admin/config/academic-year` - Create new year or initialize defaults
- `PATCH /api/admin/config/academic-year` - Update year configuration
- `DELETE /api/admin/config/academic-year?id={id}` - Delete year

### Initial Setup

#### Initialize Default Years

If no academic years are configured:

1. Click the **"Initialize Defaults"** button
2. Confirm the action in the dialog
3. The system will create 6 academic years (2025-2031)
4. 2025-2026 will be set as active by default

**API Request:**
```typescript
POST /api/admin/config/academic-year
{
  "initializeDefaults": true
}
```

### Managing Academic Years

#### Add a New Academic Year

```typescript
POST /api/admin/config/academic-year
{
  "academicYear": "2031-2032",
  "description": "Academic year 2031-2032",
  "isActive": false
}
```

#### Update Academic Year

```typescript
PATCH /api/admin/config/academic-year
{
  "id": 1,
  "description": "Updated description",
  "isActive": false
}
```

#### Set Active Year

```typescript
PATCH /api/admin/config/academic-year
{
  "id": 2,
  "isActive": true
}
```

**Note:** Only ONE year can be active at a time. Setting a year as active automatically deactivates others.

#### Delete Academic Year

```typescript
DELETE /api/admin/config/academic-year?id=3
```

**Restrictions:**
- You **cannot delete** the currently active academic year
- The delete button will be disabled for the active year

### Integration with System

#### Get Active Year in Server Code

```typescript
import { getActiveAcademicYear, getActiveAcademicYearValue } from '@/lib/admin-config';

// Get full year object
const activeYear = await getActiveAcademicYear();
console.log(activeYear?.academicYear); // "2025-2026"

// Get just the value
const yearValue = await getActiveAcademicYearValue();
console.log(yearValue); // 2026
```

#### Fetch via API

```typescript
// Get all years
const response = await fetch('/api/admin/config/academic-year');
const years = await response.json();

// Get active year only
const response = await fetch('/api/admin/config/academic-year?activeOnly=true');
const activeYear = await response.json();
```

### Best Practices

#### When to Change Active Year
- Change the active academic year at the start of each new school year
- Typically done before the academic year begins or during transition periods
- Coordinate with other system administrators before changing

#### Planning Ahead
- Keep at least 2-3 future years configured
- Add new years before the current year expires
- Review and update descriptions as needed

#### Data Integrity
- Never delete the active academic year
- Ensure there's always one active year configured
- Backup your data before making bulk changes

### Common Workflows

#### Scenario 1: Start of New Academic Year (September 2026)

1. Go to Academic Year configuration
2. Find "2026-2027" in the table
3. Click **"Set Active"** button
4. Confirm the change
5. The system now uses 2026-2027 as the active year

#### Scenario 2: Add Future Years

1. Click **"Add Year"**
2. Select "2031-2032" from dropdown
3. Enter description: "Academic year 2031-2032"
4. Leave "Set as Active Year" unchecked
5. Click **"Create"**

---

## Admin Analytics

### Overview

Comprehensive admin dashboard providing detailed insights into students, update requests, and system statistics.

### Features

#### 1. System Statistics

**Endpoint:** `GET /api/admin/analytics/stats`

Real-time overview of the entire system:

- **Student Metrics**
  - Total students count
  - Active vs inactive students
  - Students with complete profiles (address, contact, enrollment)
  
- **Information Update Analytics**
  - Total students
  - Students with updated information
  - Pending information updates
  - Update completion rate percentage
  - Students with signed conduct agreements
  - Conduct signature rate percentage
  - Breakdown by information update status

- **System Health**
  - Active admin users
  - Enabled update periods
  - Active student actions

- **Demographics Breakdown**
  - Gender distribution
  - Religion distribution
  - Citizenship status distribution

- **Recent Activity**
  - Last 5 newly added students
  - Last 5 enrollment updates
  - Last 10 information updates
  - Last 10 conduct agreement signatures

#### 2. Students Directory

**Endpoint:** `GET /api/admin/analytics/students`

Searchable, paginated list of all students with:

- **Student Information**
  - Full name (English & Arabic)
  - Emirates ID
  - Student number
  - Username
  - Gender, religion, citizenship
  - Date of birth

- **Related Data**
  - All addresses with verification status
  - All contact information (phone, email, etc.)
  - Enrollment history

- **Update Status**
  - Information update flag
  - Information update timestamp
  - Information update status code
  - Conduct agreement signed flag
  - Conduct agreement signature timestamp

- **Search & Pagination**
  - Search by name, Emirates ID, or student number
  - Paginated results (default 50 per page)
  - Total count and page navigation

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `search` - Search term for filtering

#### 3. Information Update Activity

**Endpoint:** `GET /api/admin/analytics/updates`

Track student information updates and conduct agreement signatures:

- **Student Update Records**
  - Student information (Emirates ID, name, student number, status)
  - Information update status and timestamps
  - Conduct agreement signature status and timestamps
  - Update status codes

- **Statistics**
  - Total students with activity
  - Students with information updated
  - Students with conduct agreements signed
  - Students with both completed
  - Pending information updates
  - Pending conduct signatures
  - Status code distribution

- **Filtering & Display**
  - Paginated results (default 50 per page)
  - Ordered by most recent information updates
  - Shows only students with update activity

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

### UI Features

#### Tabs
- **Analytics** - Overview with update logs
- **Students** - Complete student directory
- **Logs** - Update activity tracking
- **Users** - Admin user management
- **Periods** - Update period configuration
- **Actions** - Student action settings
- **Academic Year** - Academic year management

#### Styling
- Uses UAE Government Design System colors (aegold, aegreen)
- Responsive design for mobile/tablet/desktop
- Dark mode support
- Clean, flat design with no shadows
- Consistent border and spacing

### Access Control

All analytics endpoints require:
1. Valid authentication (NextAuth session)
2. Admin user status (verified against `AdminUser` table)
3. Active admin account

Unauthorized requests return 401/403 status codes.

### Performance Considerations

- All queries are optimized with proper indexes
- Pagination prevents loading excessive data
- Parallel queries using Promise.all()
- SWR caching on client-side
- No real-time polling (manual refresh via SWR)

---

## Helper Functions Reference

### Location: `lib/admin-config.ts`

```typescript
// Check if updates are currently allowed
await isUpdatePeriodActive(): Promise<boolean>

// Get current active period details
await getCurrentUpdatePeriod()

// Get enabled actions for education type
await getEnabledActionsForEducationType(educationType: string)

// Check if user is admin
await isAdminUser(emirateId: string): Promise<boolean>

// Get active academic year
await getActiveAcademicYear()

// Get active academic year value
await getActiveAcademicYearValue(): Promise<number | null>
```

---

## Security Notes

### Best Practices

- Emirates IDs are automatically normalized (dashes and spaces removed)
- All admin operations require authentication
- Access is verified on each page load
- Inactive admins cannot access the panel
- All changes are logged with `createdBy` field

### Access Verification Flow

```
User Request
   │
   ├─> NextAuth Middleware
   │      │
   │      ├─ Check session
   │      │     │
   │      │     ├─ Valid ✓ → Extract Emirates ID
   │      │     └─ Invalid ✗ → 401 Unauthorized
   │      │
   │      └─> Check AdminUser table
   │             │
   │             ├─ Exists & Active ✓ → Allow access
   │             └─ Not found or inactive ✗ → 403 Forbidden
   │
   └─> Admin Panel
```

---

## Troubleshooting

### Can't Delete a Year
**Cause:** The year is currently active  
**Solution:** Set a different year as active first, then delete

### Initialize Button Not Showing
**Cause:** Years are already configured  
**Solution:** This is normal - the button only appears when no years exist

### Changes Not Saving
**Cause:** Network error or session timeout  
**Solution:**
1. Check your internet connection
2. Refresh the page and try again
3. Re-login if session expired

### Unauthorized Access
**Cause:** User not in AdminUser table or inactive  
**Solution:**
1. Add user to AdminUser table with active status
2. Verify Emirates ID matches session
3. Check database connection

---

## File Reference

### Schema
- `prisma/parent-portal/schema.prisma`

### API Routes
- `app/api/admin/config/users/route.ts`
- `app/api/admin/config/periods/route.ts`
- `app/api/admin/config/actions/route.ts`
- `app/api/admin/config/academic-year/route.ts`
- `app/api/admin/config/status/route.ts`
- `app/api/admin/check-access/route.ts`
- `app/api/admin/analytics/stats/route.ts`
- `app/api/admin/analytics/students/route.ts`
- `app/api/admin/analytics/updates/route.ts`

### Admin UI
- `app/admin/eid/page.tsx`
- `app/admin/eid/components/AdminUsersManager.tsx`
- `app/admin/eid/components/UpdatePeriodsManager.tsx`
- `app/admin/eid/components/StudentActionsManager.tsx`
- `app/admin/eid/components/AcademicYearManager.tsx`
- `app/admin/eid/components/SystemStats.tsx`
- `app/admin/eid/components/StudentsTable.tsx`
- `app/admin/eid/components/UpdateLogsTable.tsx`

### Helper Libraries
- `lib/admin-config.ts`

### Portal Components
- `app/components/custom/UpdatePeriodStatus.tsx`

### Setup Scripts
- `scripts/setup-admin-config.sql`
- `scripts/add-academic-year-config.sql`

---

## Related Documentation

- [System Architecture](../core/ARCHITECTURE.md) - Database and API design
- [Child Actions](./CHILD_ACTIONS.md) - Student actions system
- [Notifications](./NOTIFICATIONS.md) - Notification system

---

**Document Version**: 1.0  
**Last Updated**: December 15, 2025  
**Maintained By**: Development Team
