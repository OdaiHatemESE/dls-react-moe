# Notification System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ NotificationBell │  │ Notification     │  │ Notifications│  │
│  │                  │  │ Dropdown         │  │ Page         │  │
│  │  - Badge count   │  │  - Latest 5      │  │  - Filters   │  │
│  │  - Click action  │  │  - Mark read     │  │  - Pagination│  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘  │
│           │                     │                    │           │
│           └─────────────────────┼────────────────────┘           │
│                                 │                                │
│                    ┌────────────▼───────────┐                   │
│                    │   React Hooks          │                   │
│                    │                        │                   │
│                    │  - useNotifications()  │                   │
│                    │  - useNotificationCount() │                │
│                    │                        │                   │
│                    │  SWR + Auto-refresh    │                   │
│                    └────────────┬───────────┘                   │
│                                 │                                │
└─────────────────────────────────┼────────────────────────────────┘
                                  │
                            HTTP Requests
                                  │
┌─────────────────────────────────▼────────────────────────────────┐
│                         API Layer (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              API Routes (4 endpoints)                      │  │
│  │                                                            │  │
│  │  GET    /api/notifications          - Fetch all          │  │
│  │  GET    /api/notifications/count    - Get counts         │  │
│  │  PATCH  /api/notifications/[id]/read - Mark one read     │  │
│  │  POST   /api/notifications/mark-all-read - Mark all      │  │
│  │                                                            │  │
│  │  Authentication: NextAuth (Emirates ID)                   │  │
│  └────────────────────────┬──────────────────────────────────┘  │
│                           │                                      │
│  ┌────────────────────────▼──────────────────────────────────┐  │
│  │              Server Utilities (lib/notifications.ts)      │  │
│  │                                                            │  │
│  │  - createNotification()                                   │  │
│  │  - createBulkNotifications()                              │  │
│  │  - NotificationTemplates                                  │  │
│  │  - cleanupOldNotifications()                              │  │
│  └────────────────────────┬──────────────────────────────────┘  │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                       Prisma ORM
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                    Database Layer (SQL Server)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Notification Table                          │    │
│  │                                                          │    │
│  │  id          INT PK AUTO_INCREMENT                      │    │
│  │  userId      VARCHAR(64)       -- Emirates ID           │    │
│  │  type        VARCHAR(100)      -- Notification type     │    │
│  │  title       VARCHAR(500)      -- Title text            │    │
│  │  body        VARCHAR(MAX)      -- Body text             │    │
│  │  data        VARCHAR(MAX)      -- JSON metadata         │    │
│  │  isRead      BIT                -- Read status          │    │
│  │  createdAt   DATETIME           -- Created timestamp    │    │
│  │  readAt      DATETIME           -- Read timestamp       │    │
│  │                                                          │    │
│  │  INDEX: (userId, isRead)                                │    │
│  │  INDEX: (createdAt)                                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Fetch Notifications
```
User → Component → useNotifications() → SWR Cache → API Route → Prisma → Database
                                                                              │
                                                                              ▼
User ← Component ← React State ← SWR Update ← JSON Response ← Transform ← Result
```

### 2. Mark as Read
```
User clicks → Component → markAsRead(id) → API PATCH → Prisma Update → Database
                 │                                                         │
                 └─ Optimistic Update ──────────────────────────────────────┘
                         (immediate UI)
```

### 3. Create Notification (Server-side)
```
Event Trigger → API Route → createNotification() → Prisma → Database
     │                                                          │
     └───── (e.g., Student Update, Conduct Sign, etc.) ────────┘
```

## Component Hierarchy

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

## Hook Dependencies

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

## Security Flow

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

## Auto-refresh Mechanism

```
Component Mount
   │
   ├─> Initial Fetch
   │      │
   │      └─> SWR Cache
   │
   └─> Set Interval Timer (30s)
          │
          ├─> Background Fetch
          │      │
          │      ├─> Compare with cache
          │      │      │
          │      │      ├─ Changed → Update UI
          │      │      └─ Same → No update
          │      │
          │      └─> Retry on error (exponential backoff)
          │
          └─> Loop until unmount
```

## Notification Types & Colors

```
┌──────────────┬───────────┬──────────────────┬─────────────────┐
│ Type         │ Color     │ Icon             │ Badge Variant   │
├──────────────┼───────────┼──────────────────┼─────────────────┤
│ info         │ Blue      │ Info             │ default         │
│ success      │ Green     │ CheckCircle      │ default         │
│ warning      │ Yellow    │ AlertTriangle    │ secondary       │
│ error        │ Red       │ XCircle          │ destructive     │
│ enrollment   │ Purple    │ GraduationCap    │ default         │
│ update       │ Orange    │ FileEdit         │ secondary       │
│ conduct      │ Indigo    │ FileCheck        │ default         │
│ announcement │ Pink      │ Megaphone        │ default         │
└──────────────┴───────────┴──────────────────┴─────────────────┘
```

## File Structure

```
dls-react-moe/
│
├── types/
│   ├── notification.ts          ← Type definitions
│   └── index.ts                 ← Exports
│
├── lib/
│   ├── hooks/
│   │   └── useNotifications.ts  ← React hooks
│   └── notifications.ts         ← Server utilities
│
├── app/
│   ├── api/
│   │   └── notifications/
│   │       ├── route.ts                      ← GET/POST
│   │       ├── count/route.ts                ← GET count
│   │       ├── mark-all-read/route.ts        ← POST mark all
│   │       └── [id]/read/route.ts            ← PATCH mark one
│   │
│   ├── components/
│   │   └── notifications/
│   │       ├── NotificationBell.tsx          ← Bell icon
│   │       ├── NotificationCard.tsx          ← Card component
│   │       ├── NotificationDropdown.tsx      ← Dropdown popup
│   │       └── index.ts                      ← Exports
│   │
│   └── notifications/
│       └── page.tsx                          ← Full page
│
├── prisma/
│   └── parent-portal/
│       └── schema.prisma         ← Notification model
│
├── scripts/
│   └── sample-notifications.sql  ← Test data
│
└── docs/
    ├── NOTIFICATION_SYSTEM.md              ← Full documentation
    ├── NOTIFICATION_QUICK_START.md         ← Quick start
    ├── NOTIFICATION_IMPLEMENTATION_SUMMARY.md  ← Summary
    └── NOTIFICATION_INTEGRATION_EXAMPLES.md    ← Examples
```

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

## Scalability Considerations

- **Database**: Indexes on userId and createdAt for fast queries
- **Caching**: SWR reduces API calls
- **Cleanup**: Automated deletion of old read notifications
- **Bulk Operations**: Support for notifying multiple users
- **Pagination**: Prevent loading too much data at once

## Extension Points

1. **Push Notifications**: Add service worker for browser push
2. **Email Digest**: Send daily/weekly email summaries
3. **Preferences**: User settings for notification types
4. **Categories**: Group notifications by category
5. **Priority**: High/medium/low priority levels
6. **Actions**: Embedded action buttons in notifications
7. **Rich Media**: Support images/videos in notifications
8. **Templates**: More pre-defined notification templates

---

This architecture provides a solid foundation for a scalable, performant, and user-friendly notification system.
