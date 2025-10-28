# Admin Configuration System

This document describes the admin configuration system for managing users, update periods, and student actions.

## Overview

The admin configuration system provides three main management areas:

1. **Admin Users** - Manage who can access the admin panel by Emirates ID
2. **Update Periods** - Configure time windows when parents can update student information
3. **Student Actions** - Define available actions for different education types

## Database Schema

### AdminUser
Stores users authorized to access the admin panel.

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

### UpdatePeriodConfig
Defines time periods when information updates are allowed.

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

### StudentActionConfig
Configures actions available for specific education types.

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

## API Endpoints

### Admin Users
- `GET /api/admin/config/users` - List all admin users
- `POST /api/admin/config/users` - Create new admin user
- `PATCH /api/admin/config/users` - Update admin user
- `DELETE /api/admin/config/users?id={id}` - Delete admin user

### Update Periods
- `GET /api/admin/config/periods` - List all update periods
- `POST /api/admin/config/periods` - Create new period
- `PATCH /api/admin/config/periods` - Update period
- `DELETE /api/admin/config/periods?id={id}` - Delete period

### Student Actions
- `GET /api/admin/config/actions` - List all actions (optional: `?educationType={type}`)
- `POST /api/admin/config/actions` - Create new action
- `PATCH /api/admin/config/actions` - Update action
- `DELETE /api/admin/config/actions?id={id}` - Delete action

### Access Control
- `GET /api/admin/check-access` - Check if current user has admin access

## Admin Page

The admin configuration page is located at `/app/admin/eid/page.tsx`.

**URL:** `/admin/eid` (not `/admin/{emirateId}`)

### Features:
- **Access Control** - Automatically checks if user has admin privileges
- **Three Tabs**:
  - Admin Users - Add/edit/delete admin users by Emirates ID
  - Update Periods - Configure time windows with start/end dates
  - Student Actions - Manage actions by education type

### Access Requirements:
1. User must be authenticated
2. User's Emirates ID must exist in `AdminUser` table
3. User's `isActive` flag must be true

## Helper Functions

Located in `lib/admin-config.ts`:

```typescript
// Check if updates are currently allowed
await isUpdatePeriodActive(): Promise<boolean>

// Get current active period details
await getCurrentUpdatePeriod()

// Get enabled actions for education type
await getEnabledActionsForEducationType(educationType: string)

// Check if user is admin
await isAdminUser(emirateId: string): Promise<boolean>
```

## Usage Examples

### 1. Add Admin User
```typescript
POST /api/admin/config/users
{
  "emirateId": "784-1234-1234567-1",
  "name": "John Doe",
  "email": "john@example.com",
  "isActive": true
}
```

### 2. Create Update Period
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

### 3. Configure Student Action
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

## Integration with Parent Portal

To use the configuration in your parent portal:

```typescript
import { 
  isUpdatePeriodActive, 
  getEnabledActionsForEducationType 
} from "@/lib/admin-config";

// Check if updates are allowed
const canUpdate = await isUpdatePeriodActive();

// Get actions for student's education type
const actions = await getEnabledActionsForEducationType("Public");
```

## Setup Instructions

1. **Schema is already migrated** - The database tables have been created
2. **Add first admin user** - Use Prisma Studio or direct DB insert:
   ```sql
   INSERT INTO AdminUser (emirateId, name, email, isActive, createdAt, updatedAt)
   VALUES ('7841234123456701', 'System Admin', 'admin@moe.gov.ae', 1, GETDATE(), GETDATE());
   ```
3. **Access admin panel** - Navigate to `/admin/eid`
4. **Configure periods and actions** as needed

## Security Notes

- Emirates IDs are automatically normalized (dashes and spaces removed)
- All admin operations require authentication
- Access is verified on each page load
- Inactive admins cannot access the panel
- All changes are logged with `createdBy` field

## Future Enhancements

Potential additions:
- Audit log for all admin actions
- Role-based permissions (super admin, manager, viewer)
- Email notifications when periods are activated
- Bulk import/export of configurations
- More granular action permissions per user
