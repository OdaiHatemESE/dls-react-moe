# Admin Configuration System - Quick Start Guide

## ✅ What Has Been Created

### 1. Database Schema (Prisma Models)
Three new tables added to `prisma/parent-portal/schema.prisma`:
- **AdminUser** - Users who can access admin panel (by Emirates ID)
- **UpdatePeriodConfig** - Time periods when updates are allowed
- **StudentActionConfig** - Actions available for different education types

### 2. API Routes
Created under `/app/api/admin/config/`:
- `/users` - Manage admin users (CRUD)
- `/periods` - Manage update periods (CRUD)
- `/actions` - Manage student actions (CRUD)
- `/status` - Get current configuration status (for portal integration)
- `/check-access` - Verify admin access

### 3. Admin UI Page
Location: `/app/admin/eid/page.tsx`

Features:
- ✅ Access control by Emirates ID
- ✅ Three tabs: Users, Periods, Actions
- ✅ Full CRUD operations for all entities
- ✅ Real-time enable/disable toggles
- ✅ Auto-redirect if no access

### 4. Components Created
- `AdminUsersManager.tsx` - Manage admin users
- `UpdatePeriodsManager.tsx` - Manage update periods with date/time
- `StudentActionsManager.tsx` - Manage actions by education type
- `UpdatePeriodStatus.tsx` - Status indicator for parent portal

### 5. UI Components (shadcn/ui style)
- `Switch` - Toggle switches
- `Table` - Data tables
- `Toast` & `Toaster` - Notifications
- `Alert` - Status alerts

### 6. Helper Utilities
`lib/admin-config.ts`:
```typescript
isUpdatePeriodActive()  // Check if updates allowed now
getCurrentUpdatePeriod()  // Get active period details
getEnabledActionsForEducationType(type)  // Get actions
isAdminUser(emirateId)  // Check admin status
```

## 🚀 Setup Steps

### Step 1: Database (Already Done ✅)
```bash
npm run prisma:pp:generate  # Generate client
npm run prisma:pp:push      # Push to database
```

### Step 2: Add Your First Admin User
Option A - Direct SQL:
```sql
INSERT INTO AdminUser (emirateId, name, email, isActive, createdBy, createdAt, updatedAt)
VALUES ('7841234123456701', 'Your Name', 'you@moe.gov.ae', 1, 'system', GETDATE(), GETDATE());
```

Option B - Run the setup script:
```bash
# Edit scripts/setup-admin-config.sql with your details, then run it
```

### Step 3: Access the Admin Panel
1. Start dev server: `npm run dev`
2. Login with your Emirates ID (784-1987-9173543-8)
3. Navigate to: `http://localhost:4200/admin/eid`

**Important:** The URL is `/admin/eid`, NOT `/admin/{your-emirates-id}`

## 📋 How to Use

### Managing Admin Users
1. Go to "Admin Users" tab
2. Click "Add User"
3. Enter Emirates ID (with or without dashes)
4. Enter name and optional email
5. Toggle active status as needed

### Configuring Update Periods
1. Go to "Update Periods" tab
2. Click "Add Period"
3. Set:
   - Period name (e.g., "Spring 2026 Updates")
   - Start date & time
   - End date & time
   - Description (optional)
   - Enable/disable toggle
4. Only enabled periods within date range allow updates

### Setting Up Student Actions
1. Go to "Student Actions" tab
2. Click "Add Action"
3. Configure:
   - Education type (Public, Private, etc.)
   - Action name (displayed to users)
   - Action key (unique identifier)
   - Display order (sorting)
   - Description
   - Config JSON (for custom settings)
   - Enable/disable

## 🔌 Integration with Parent Portal

### Check if Updates Are Allowed
```typescript
import { isUpdatePeriodActive } from "@/lib/admin-config";

// In your server component or API route
const canUpdate = await isUpdatePeriodActive();

if (!canUpdate) {
  return <div>Updates not available at this time</div>;
}
```

### Get Available Actions
```typescript
import { getEnabledActionsForEducationType } from "@/lib/admin-config";

// Get actions for student's education type
const actions = await getEnabledActionsForEducationType("Public");

// actions will be sorted by displayOrder
actions.forEach(action => {
  console.log(action.actionName, action.actionKey);
});
```

### Use Status Component
```typescript
import { UpdatePeriodStatus } from "@/app/components/custom/UpdatePeriodStatus";

// In your parent portal page
<UpdatePeriodStatus 
  educationType="Public" 
  showActions={true} 
/>
```

### Client-Side Status Check
```typescript
// Fetch configuration status
const res = await fetch("/api/admin/config/status?educationType=Public");
const { updatePeriod, actions } = await res.json();

if (updatePeriod.isActive) {
  // Show update forms
  // Display available actions
}
```

## 🎯 Use Cases

### Use Case 1: Scheduled Update Window
1. Admin creates period: "Fall 2026 Updates"
2. Sets dates: Sept 1-30, 2026
3. Enables the period
4. Parents can only update info during September

### Use Case 2: Different Actions by School Type
**Public Schools:**
- Update Contact Info
- Update Address
- Upload Documents

**Private Schools:**
- Update Contact Info
- Update Emergency Contact
- Request Transfer

### Use Case 3: Emergency Update Period
1. Urgent situation requires immediate updates
2. Admin creates new period with current dates
3. Enables it immediately
4. All parents can update right away
5. Admin disables when complete

## 🔐 Security Features

- ✅ Authentication required for all operations
- ✅ Access verified by Emirates ID in database
- ✅ Active status check (can disable users)
- ✅ Auto-redirect if unauthorized
- ✅ All changes tracked with createdBy field
- ✅ Emirates IDs normalized (dashes removed)

## 📝 API Examples

### Create Update Period
```bash
POST /api/admin/config/periods
Content-Type: application/json

{
  "name": "Spring 2026 Update Window",
  "startDate": "2026-03-01T00:00:00",
  "endDate": "2026-03-31T23:59:59",
  "isEnabled": true,
  "description": "Annual spring update period"
}
```

### Create Student Action
```bash
POST /api/admin/config/actions
Content-Type: application/json

{
  "educationType": "Public",
  "actionName": "Update Contact Information",
  "actionKey": "update_contact",
  "isEnabled": true,
  "displayOrder": 1,
  "description": "Update phone and email",
  "configJson": "{\"fields\": [\"phone\", \"email\"]}"
}
```

### Check Current Status
```bash
GET /api/admin/config/status?educationType=Public
```

Response:
```json
{
  "updatePeriod": {
    "isActive": true,
    "current": {
      "name": "Spring 2026 Updates",
      "startDate": "2026-03-01T00:00:00Z",
      "endDate": "2026-03-31T23:59:59Z",
      "description": "..."
    }
  },
  "actions": [
    {
      "actionName": "Update Contact",
      "actionKey": "update_contact",
      "displayOrder": 1,
      ...
    }
  ]
}
```

## 📚 File Reference

### Schema
- `prisma/parent-portal/schema.prisma`

### API Routes
- `app/api/admin/config/users/route.ts`
- `app/api/admin/config/periods/route.ts`
- `app/api/admin/config/actions/route.ts`
- `app/api/admin/config/status/route.ts`
- `app/api/admin/check-access/route.ts`

### Admin UI
- `app/admin/eid/page.tsx`
- `app/admin/eid/components/AdminUsersManager.tsx`
- `app/admin/eid/components/UpdatePeriodsManager.tsx`
- `app/admin/eid/components/StudentActionsManager.tsx`

### Helper Libraries
- `lib/admin-config.ts`

### Portal Components
- `app/components/custom/UpdatePeriodStatus.tsx`

### Setup Scripts
- `scripts/setup-admin-config.sql`

### Documentation
- `ADMIN_CONFIG_SYSTEM.md` (detailed docs)
- `ADMIN_CONFIG_QUICKSTART.md` (this file)

## 🎉 You're Ready!

The admin configuration system is fully set up and ready to use. Just add your first admin user and start configuring!

For questions or issues, check the detailed documentation in `ADMIN_CONFIG_SYSTEM.md`.
