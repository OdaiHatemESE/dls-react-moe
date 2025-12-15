# Notification System - Quick Start Guide

## ✅ What's Been Created

### Files Created:

**Types:**
- `types/notification.ts` - TypeScript types
- Updated `types/index.ts` - Export notification types

**API Routes (4 files):**
- `app/api/notifications/route.ts` - GET/POST notifications
- `app/api/notifications/[id]/read/route.ts` - PATCH mark as read
- `app/api/notifications/mark-all-read/route.ts` - POST mark all read
- `app/api/notifications/count/route.ts` - GET notification counts

**Hooks:**
- `lib/hooks/useNotifications.ts` - Data fetching hooks

**Components (3 files):**
- `app/components/notifications/NotificationBell.tsx` - Bell icon with badge
- `app/components/notifications/NotificationCard.tsx` - Individual notification
- `app/components/notifications/NotificationDropdown.tsx` - Dropdown popup
- `app/components/notifications/index.ts` - Export file

**Pages:**
- `app/notifications/page.tsx` - Full notifications page

**Documentation:**
- `docs/NOTIFICATION_SYSTEM.md` - Complete documentation
- `scripts/sample-notifications.sql` - Sample data for testing

## 🚀 Quick Setup

### 1. Database is Ready
The `Notification` table already exists in your Prisma schema at `prisma/parent-portal/schema.prisma`. No migration needed!

### 2. Test the API (Optional)
Add sample notifications for testing:
```bash
# Connect to your SQL Server and run:
# scripts/sample-notifications.sql
```

### 3. Add to Your Layout/Header

Edit `app/layout.tsx` or your header component to add the notification dropdown:

```tsx
import { NotificationDropdown } from "@/app/components/notifications";

// Inside your header/navigation:
<NotificationDropdown locale={locale} />
```

**Example integration in VerticalHeader:**

```tsx
// app/components/VerticalHeader.tsx
import { NotificationDropdown } from "@/app/components/notifications";

export function VerticalHeader() {
  return (
    <header>
      {/* ... other header content ... */}
      
      {/* Add notification dropdown */}
      <div className="flex items-center gap-4">
        <NotificationDropdown />
        {/* ... other header items ... */}
      </div>
    </header>
  );
}
```

### 4. Access the Notifications Page

Navigate to `/notifications` to see the full notifications page.

## 📋 Usage Examples

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

## 🧪 Testing

### Test API Endpoints

```bash
# Get notifications
curl -X GET http://localhost:4200/api/notifications \
  -H "Cookie: your-session-cookie"

# Get count
curl -X GET http://localhost:4200/api/notifications/count \
  -H "Cookie: your-session-cookie"

# Mark as read
curl -X PATCH http://localhost:4200/api/notifications/1/read \
  -H "Cookie: your-session-cookie"

# Mark all as read
curl -X POST http://localhost:4200/api/notifications/mark-all-read \
  -H "Cookie: your-session-cookie"
```

### Create Test Notification via API

```bash
curl -X POST http://localhost:4200/api/notifications \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "userId": "784-1234-5678901-2",
    "type": "info",
    "title": "Test Notification",
    "body": "This is a test notification",
    "data": { "link": "/dashboard" }
  }'
```

## 🎨 Notification Types & Colors

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

## 🔧 Configuration

### Auto-refresh Interval

By default, notifications refresh every 30 seconds. To customize:

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

### Results Limit

```tsx
// Show more notifications in dropdown
const { notifications } = useNotifications({ limit: 10 });

// Show fewer on page
const { notifications } = useNotifications({ limit: 20 });
```

## 🌐 Localization

The components support Arabic (RTL) and English:

```tsx
<NotificationDropdown locale="ar" />
<NotificationCard notification={n} locale="ar" />
```

Current translations are inline. For full i18n support, you may want to integrate with your i18n system.

## 📊 Key Features

✅ Real-time auto-refresh (30s default)  
✅ Unread count badge on bell  
✅ Mark individual/all as read  
✅ Filter by status (all/read/unread)  
✅ Filter by type  
✅ Pagination support  
✅ Optimistic UI updates  
✅ Color-coded by type  
✅ Clickable notifications with links  
✅ Relative time display  
✅ Mobile responsive  
✅ RTL ready  

## 🔐 Security

- All routes require NextAuth authentication
- Notifications are scoped to user's Emirates ID
- Users can only access their own notifications
- No public access to notification data

## 📚 Next Steps

1. **Add to your header** - Integrate `NotificationDropdown` component
2. **Test with sample data** - Run the SQL script to add test notifications
3. **Create notifications** - Use the POST API when events occur in your app
4. **Customize styling** - Adjust colors/styles to match your brand
5. **Add push notifications** - Extend with service workers for browser push

## 💡 Tips

- Notifications are automatically marked as read when clicked
- The dropdown shows the latest 5 notifications
- Full page shows all with filtering
- Data field supports custom JSON for flexible use cases
- All times are displayed as relative ("2 hours ago")

## 🐛 Troubleshooting

**No notifications showing:**
- Check if user is authenticated
- Verify notifications exist for the user's Emirates ID
- Check browser console for errors

**Count not updating:**
- Auto-refresh is set to 30 seconds
- Click refresh button for immediate update
- Check if SWR is configured properly

**Unauthorized errors:**
- Ensure user has valid NextAuth session
- Check that `emiratesId` is present in session

For more details, see `docs/NOTIFICATION_SYSTEM.md`
