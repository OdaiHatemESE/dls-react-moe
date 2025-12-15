# Notification System

**Last Updated:** December 15, 2025  
**Version:** 1.0

---

## Table of Contents

- [Quick Start](#quick-start)
- [System Architecture](#system-architecture)
- [Setup & Configuration](#setup--configuration)
- [Usage Examples](#usage-examples)
- [Integration Patterns](#integration-patterns)
- [Toast Notifications](#toast-notifications)

---

## Quick Start

### What's Included

A complete, production-ready notification system for the DLS Parent Portal:

- 🔔 **Bell icon** with real-time unread count badge
- 📱 **Dropdown popup** showing latest 5 notifications
- 📄 **Full page** for browsing all notifications with filtering
- ✅ **Mark as read** (individual or bulk)
- 🔄 **Auto-refresh** every 30 seconds
- 🎨 **8 color-coded types** (info, success, warning, error, enrollment, update, conduct, announcement)
- ⏱️ **Relative timestamps** ("2 hours ago")
- 🔗 **Clickable notifications** with custom navigation
- 🔍 **Advanced filtering** by status and type
- 📊 **Pagination** for large notification lists
- 🌐 **RTL support** ready (Arabic/English)
- ♿ **Accessible** with ARIA labels
- 🔒 **Secure** with NextAuth authentication
- 🚀 **Optimized** with SWR caching and optimistic updates

### Add to Your Header

```tsx
import { NotificationDropdown } from "@/app/components/notifications";

export function Header() {
  return (
    <header>
      {/* Your header content */}
      <NotificationDropdown locale="en" />
    </header>
  );
}
```

### Create Notifications

```typescript
import { createNotification } from "@/lib/notifications";

await createNotification({
  userId: "784-1234-5678901-2", // Emirates ID
  type: "success",
  title: "Information Updated",
  body: "Your student information has been updated.",
  data: {
    link: "/child/123",
    studentId: "123",
  },
});
```

---

## System Architecture

### Component Hierarchy

```
App Layout
│
├── Header / VerticalHeader
│   │
│   └── NotificationDropdown
│       │
│       ├── NotificationBell (trigger)
│       │   └── Badge (unread count)
│       │
│       └── Popover Content
│           ├── Header (with "Mark all read")
│           ├── NotificationCard (×5 latest)
│           │   ├── Icon (type-based)
│           │   ├── Badge (type label)
│           │   ├── Title
│           │   ├── Body
│           │   └── Timestamp
│           └── Footer (View all link)
│
└── /notifications Page
    │
    ├── Header (Title, Refresh, Mark all read)
    ├── Filters
    │   ├── Status Tabs (All/Read/Unread)
    │   └── Type Select (8 types)
    │
    ├── Notification List
    │   └── NotificationCard (×N)
    │       ├── Full body display
    │       ├── Click to navigate
    │       └── Auto mark as read
    │
    └── Load More Button
```

### Data Flow

#### Fetch Notifications
```
User → Component → useNotifications() → SWR Cache → API Route → Prisma → Database
                                                                              │
                                                                              ▼
User ← Component ← React State ← SWR Update ← JSON Response ← Transform ← Result
```

#### Mark as Read
```
User clicks → Component → markAsRead(id) → API PATCH → Prisma Update → Database
                 │                                                         │
                 └─ Optimistic Update ──────────────────────────────────────┘
                         (immediate UI)
```

#### Create Notification (Server-side)
```
Event Trigger → API Route → createNotification() → Prisma → Database
     │                                                          │
     └───── (e.g., Student Update, Conduct Sign, etc.) ────────┘
```

### Hook Dependencies

```
useNotifications()
│
├── SWR (data fetching)
│   ├── jsonFetcher (from lib/swr.ts)
│   ├── Auto-refresh (30s interval)
│   └── Cache management
│
├── Functions
│   ├── markAsRead(id)
│   ├── markAllAsRead()
│   └── refresh()
│
└── State
    ├── notifications: Notification[]
    ├── total: number
    ├── isLoading: boolean
    └── error: Error | undefined

useNotificationCount()
│
├── SWR (count fetching)
│   ├── Auto-refresh (30s)
│   └── Lightweight endpoint
│
├── Functions
│   └── refresh()
│
└── State
    ├── count: NotificationCount
    ├── unread: number
    └── total: number
```

### Database Schema

```prisma
model Notification {
  id          Int       @id @default(autoincrement())
  userId      String    @db.VarChar(64)
  type        String    @db.VarChar(100)
  title       String    @db.VarChar(500)
  body        String    @db.VarChar(Max)
  data        String?   @db.VarChar(Max)
  isRead      Boolean   @default(false)
  createdAt   DateTime  @default(now())
  readAt      DateTime?

  @@index([userId, isRead])
  @@index([createdAt])
}
```

### Security Flow

```
Request
   │
   ├─> NextAuth Middleware
   │      │
   │      ├─ Check session
   │      │     │
   │      │     ├─ Valid ✓ → Extract Emirates ID
   │      │     └─ Invalid ✗ → 401 Unauthorized
   │      │
   │      └─> API Route Handler
   │             │
   │             ├─ Validate userId matches session
   │             │     │
   │             │     ├─ Match ✓ → Process request
   │             │     └─ Mismatch ✗ → 403 Forbidden
   │             │
   │             └─> Database Query
   │                    │
   │                    └─ WHERE userId = session.emiratesId
   │
   └─> Response
```

---

## Setup & Configuration

### Database Setup

The `Notification` table is already included in your Prisma schema. If you need to add it manually:

```bash
# Generate Prisma client
npx prisma generate --schema=prisma/parent-portal/schema.prisma

# Push to database
npx prisma db push --schema=prisma/parent-portal/schema.prisma
```

### Add Sample Data (Optional)

```bash
# Connect to SQL Server and run:
# scripts/sample-notifications.sql
```

### Auto-refresh Configuration

```tsx
// Custom refresh interval (60 seconds)
const { notifications } = useNotifications(
  { status: "all" },
  { refreshInterval: 60000 }
);

// Disable auto-refresh
const { notifications } = useNotifications(
  { status: "all" },
  { refreshInterval: 0 }
);
```

---

## Usage Examples

### Basic Usage - Bell Icon Only
```tsx
import { NotificationBell } from "@/app/components/notifications";

<NotificationBell onClick={() => setShowNotifications(true)} />
```

### Full Dropdown
```tsx
import { NotificationDropdown } from "@/app/components/notifications";

<NotificationDropdown locale="en" />
```

### Custom Implementation
```tsx
import { useNotifications } from "@/lib/hooks/useNotifications";
import { NotificationCard } from "@/app/components/notifications";

function MyNotifications() {
  const { notifications, markAsRead } = useNotifications(
    { status: "unread", limit: 10 }
  );
  
  return (
    <div>
      {notifications.map(n => (
        <NotificationCard
          key={n.id}
          notification={n}
          onRead={markAsRead}
        />
      ))}
    </div>
  );
}
```

### Notification Types & Colors

| Type | Color | Icon | Use Case |
|------|-------|------|----------|
| `info` | Blue | Info | General information |
| `success` | Green | CheckCircle | Success messages |
| `warning` | Yellow | AlertTriangle | Warnings |
| `error` | Red | XCircle | Errors |
| `enrollment` | Purple | GraduationCap | Enrollment updates |
| `update` | Orange | FileEdit | Information updates |
| `conduct` | Indigo | FileCheck | Conduct agreements |
| `announcement` | Pink | Megaphone | Announcements |

---

## Integration Patterns

### Pattern 1: Send Notification After Student Update

```typescript
// app/api/student/[id]/update/route.ts
import { createNotification, NotificationTemplates } from "@/lib/notifications";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  try {
    // Update student logic here...
    const student = await updateStudent(params.id, data);

    // Send notification
    await createNotification({
      userId: session.user.emiratesId,
      ...NotificationTemplates.informationUpdated(student.name, student.id),
    });

    return NextResponse.json({ success: true, student });
  } catch (error) {
    // Send error notification
    await createNotification({
      userId: session.user.emiratesId,
      ...NotificationTemplates.systemError("Failed to update student information."),
    });
    
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}
```

### Pattern 2: Bulk Notification for Announcements

```typescript
// app/api/admin/announcements/route.ts
import { createBulkNotifications, NotificationTemplates } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  const { title, body, targetGrade } = await request.json();

  // Get all parent Emirates IDs
  const parents = await prisma.parent.findMany({
    where: targetGrade ? {
      Student: {
        some: {
          StudentEnrollment: {
            some: { streamGradeId: targetGrade },
          },
        },
      },
    } : undefined,
    select: { identifier: true },
  });

  const parentIds = parents
    .map((p) => p.identifier)
    .filter((id): id is string => Boolean(id));

  // Send bulk notification
  const result = await createBulkNotifications({
    userIds: parentIds,
    ...NotificationTemplates.announcement(title, body, "/announcements"),
  });

  return NextResponse.json({
    success: true,
    count: result.count,
  });
}
```

### Pattern 3: Auto-notify on Conduct Agreement Signing

```typescript
// app/api/child/[id]/conduct/sign/route.ts
import { createNotification } from "@/lib/notifications";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  try {
    // Sign conduct agreement logic...
    await signConductAgreement(params.id);

    // Send success notification
    await createNotification({
      userId: session.user.emiratesId,
      type: "success",
      title: "Conduct Agreement Signed",
      body: "You have successfully signed the conduct agreement.",
      data: {
        link: `/child/${params.id}`,
        studentId: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to sign conduct agreement" }, { status: 500 });
  }
}
```

### Pattern 4: Scheduled Notifications (Cron Job)

```typescript
// app/api/cron/notifications/route.ts
import { createNotification } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find parents with unsigned conduct agreements
  const pendingConduct = await prisma.student.findMany({
    where: {
      isConductAgreementSigned: false,
      Parent: { identifier: { not: null } },
    },
    include: {
      Parent: { select: { identifier: true } },
    },
  });

  // Group by parent
  const parentNotifications = new Map<string, string[]>();
  
  for (const student of pendingConduct) {
    const parentId = student.Parent?.identifier;
    if (!parentId) continue;
    
    if (!parentNotifications.has(parentId)) {
      parentNotifications.set(parentId, []);
    }
    parentNotifications.get(parentId)?.push(student.firstNameEnglish || "Student");
  }

  // Send notifications
  let count = 0;
  for (const [parentId, studentNames] of parentNotifications) {
    await createNotification({
      userId: parentId,
      type: "warning",
      title: "Conduct Agreement Reminder",
      body: `You have ${studentNames.length} pending conduct agreement(s) to sign for: ${studentNames.join(", ")}.`,
      data: {
        link: "/dashboard",
        action: "sign_conduct",
      },
    });
    count++;
  }

  return NextResponse.json({
    success: true,
    message: `Sent ${count} reminder notifications`,
  });
}
```

### Pattern 5: Cleanup Old Notifications

```typescript
// app/api/cron/cleanup-notifications/route.ts
import { cleanupOldNotifications } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete read notifications older than 30 days
  const result = await cleanupOldNotifications(30);

  return NextResponse.json({
    success: true,
    deleted: result.count,
  });
}
```

### Notification Templates

```typescript
// lib/notifications.ts
export const NotificationTemplates = {
  informationUpdated: (studentName: string, studentId: string) => ({
    type: "update" as const,
    title: "Information Updated",
    body: `Information for ${studentName} has been updated successfully.`,
    data: { link: `/child/${studentId}`, studentId },
  }),

  conductAgreementPending: (studentName: string, studentId: string) => ({
    type: "conduct" as const,
    title: "Conduct Agreement Required",
    body: `Please sign the conduct agreement for ${studentName}.`,
    data: { link: `/child/${studentId}/conduct`, studentId },
  }),

  announcement: (title: string, body: string, link?: string) => ({
    type: "announcement" as const,
    title,
    body,
    data: link ? { link } : {},
  }),

  systemError: (message: string) => ({
    type: "error" as const,
    title: "System Error",
    body: message,
    data: {},
  }),

  updatePeriodActive: (endDate: string) => ({
    type: "info" as const,
    title: "Update Period Active",
    body: `You can now update student information until ${endDate}.`,
    data: { link: "/dashboard" },
  }),
};
```

---

## Toast Notifications

### Overview

The toast system provides elegant, accessible notifications for immediate user feedback:
- Success messages
- Error messages
- Warnings
- Informational messages
- Loading states

### Setup

Toast notifications are already integrated in `app/layout.tsx` with the `<Toaster />` component.

### Usage

```typescript
import { useToastNotifications } from '@/lib/hooks/use-toast-notifications'
import { useI18n } from '@/app/i18n/I18nProvider'

function MyComponent() {
  const toast = useToastNotifications()
  const { locale } = useI18n()
  
  // Success notification
  toast.success(
    locale === 'ar' ? 'تم بنجاح' : 'Success',
    locale === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully'
  )
  
  // Error notification
  toast.error(
    locale === 'ar' ? 'خطأ' : 'Error',
    locale === 'ar' ? 'حدث خطأ ما' : 'Something went wrong'
  )
  
  // Warning notification
  toast.warning(
    locale === 'ar' ? 'تحذير' : 'Warning',
    locale === 'ar' ? 'يرجى التحقق' : 'Please verify'
  )
  
  // Info notification
  toast.info(
    locale === 'ar' ? 'معلومات' : 'Info',
    locale === 'ar' ? 'ميزة جديدة' : 'New feature available'
  )
  
  // Loading notification (won't auto-dismiss)
  const loadingToast = toast.loading(
    locale === 'ar' ? 'جارٍ المعالجة' : 'Processing',
    locale === 'ar' ? 'يرجى الانتظار' : 'Please wait'
  )
  // Later dismiss it
  loadingToast.dismiss()
}
```

### Toast Variants

#### Success (Green)
```typescript
toast.success('Title', 'Description')
```
Use for: Successful operations, confirmations

#### Error (Red)
```typescript
toast.error('Title', 'Description')
```
Use for: Failed operations, validation errors

#### Warning (Yellow)
```typescript
toast.warning('Title', 'Description')
```
Use for: Partial successes, deprecation notices, cautionary messages

#### Info (Blue)
```typescript
toast.info('Title', 'Description')
```
Use for: Informational messages, tips, feature announcements

#### Loading (Gray)
```typescript
const loadingToast = toast.loading('Title', 'Description')
// Remember to dismiss it!
loadingToast.dismiss()
```
Use for: Long-running operations, async processes

### Common Translation Pairs

| English | Arabic |
|---------|--------|
| Success | تم بنجاح |
| Error | خطأ |
| Warning | تحذير |
| Info | معلومات |
| Saved successfully | تم الحفظ بنجاح |
| Updated successfully | تم التحديث بنجاح |
| Deleted successfully | تم الحذف بنجاح |
| Something went wrong | حدث خطأ ما |
| Please try again | يرجى المحاولة مرة أخرى |
| Partial Success | تحديث جزئي |
| Processing | جارٍ المعالجة |
| Please wait | يرجى الانتظار |

### Example Patterns

#### API Call with Success/Error

```typescript
async function handleSubmit() {
  try {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    
    if (!response.ok) throw new Error('Failed')
    
    toast.success(
      locale === 'ar' ? 'تم بنجاح' : 'Success',
      locale === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully'
    )
  } catch (error) {
    toast.error(
      locale === 'ar' ? 'خطأ' : 'Error',
      locale === 'ar' ? 'حدث خطأ' : 'An error occurred'
    )
  }
}
```

#### Multi-System Update (Partial Success)

```typescript
async function updateSystems() {
  // Update local system
  await updateLocal()
  
  // Try to update PP system
  try {
    await updatePP()
    toast.success('Success', 'Updated in all systems')
  } catch (ppError) {
    // Show warning for partial success
    toast.warning(
      'Partial Success',
      'Saved locally, but central system update failed'
    )
  }
}
```

#### Loading State

```typescript
async function longOperation() {
  const loadingToast = toast.loading(
    locale === 'ar' ? 'جارٍ المعالجة' : 'Processing',
    locale === 'ar' ? 'يرجى الانتظار' : 'Please wait'
  )
  
  try {
    await performLongTask()
    loadingToast.dismiss()
    toast.success('Done', 'Operation completed')
  } catch (error) {
    loadingToast.dismiss()
    toast.error('Error', 'Operation failed')
  }
}
```

### Best Practices

✅ **DO:**
- Always provide bilingual messages
- Use appropriate toast type (success, error, warning, info)
- Keep messages clear and actionable
- Dismiss loading toasts when done
- Use warnings for partial successes

❌ **DON'T:**
- Don't use `alert()` - use toast instead
- Don't show generic errors - provide context
- Don't leave loading toasts running forever
- Don't show toasts for silent background operations

---

## API Reference

### GET `/api/notifications`
Fetch notifications with filtering

**Query Parameters:**
- `status`: `all` | `read` | `unread`
- `type`: notification type
- `limit`: results per page (default: 50)
- `offset`: pagination offset

### GET `/api/notifications/count`
Get unread and total counts

### PATCH `/api/notifications/[id]/read`
Mark a specific notification as read

### POST `/api/notifications/mark-all-read`
Mark all notifications as read

### POST `/api/notifications`
Create a new notification (admin/system)

---

## Performance Optimizations

1. **Database Indexes**
   - `(userId, isRead)` - Fast filtering of unread notifications
   - `(createdAt)` - Fast sorting by date

2. **SWR Caching**
   - Automatic deduplication of requests
   - Background revalidation
   - Optimistic updates

3. **Pagination**
   - Default limit: 50 notifications
   - Offset-based pagination
   - Load more on demand

4. **Auto-refresh**
   - Configurable interval (default 30s)
   - Disabled on focus (configurable)
   - Exponential backoff on errors

5. **Optimistic Updates**
   - Immediate UI feedback on mark as read
   - Background sync with server
   - Automatic rollback on error

---

## Troubleshooting

**No notifications showing:**
- Check user is authenticated
- Verify notifications exist in database
- Check browser console for errors

**Count not updating:**
- Wait for auto-refresh (30s)
- Click refresh button
- Check SWR configuration

**TypeScript errors:**
- Run `npm run prisma:generate`
- Restart TypeScript server

**401 Unauthorized:**
- Ensure valid NextAuth session
- Check `emiratesId` in session

---

## Related Documentation

- [System Architecture](../core/ARCHITECTURE.md) - Database and API design
- [Child Actions](./CHILD_ACTIONS.md) - Student actions system
- [Admin Panel](./ADMIN_PANEL.md) - Configuration management

---

**Document Version**: 1.0  
**Last Updated**: December 15, 2025  
**Maintained By**: Development Team
