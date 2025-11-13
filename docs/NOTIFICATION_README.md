# 🔔 Notification System

A complete, production-ready notification system for the DLS Parent Portal built with Next.js, React, TypeScript, Prisma, and SQL Server.

## ✨ Features at a Glance

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

## 📦 What's Included

- **4 API Routes** - Full REST API for notifications
- **2 React Hooks** - Data fetching with SWR
- **3 UI Components** - Bell, Dropdown, Card
- **1 Full Page** - Complete notifications view
- **Server Utilities** - Helper functions for creating notifications
- **TypeScript Types** - Full type safety
- **Documentation** - Comprehensive guides and examples
- **Sample Data** - SQL script for testing

## 🚀 Quick Start

### 1. Add to Your Header

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

### 2. Navigate to `/notifications`

The full notifications page is automatically available at `/notifications`.

### 3. Create Notifications

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

## 📚 Documentation

- **[Quick Start Guide](./NOTIFICATION_QUICK_START.md)** - Get started in 5 minutes
- **[Complete Documentation](./NOTIFICATION_SYSTEM.md)** - Full API reference
- **[Architecture](./NOTIFICATION_ARCHITECTURE.md)** - System design and data flow
- **[Integration Examples](./NOTIFICATION_INTEGRATION_EXAMPLES.md)** - Real-world usage patterns
- **[Implementation Summary](./NOTIFICATION_IMPLEMENTATION_SUMMARY.md)** - What was built

## 🎯 Use Cases

### 1. Student Information Updates
```typescript
await createNotification({
  userId: parent.emiratesId,
  ...NotificationTemplates.informationUpdated(student.name, student.id)
});
```

### 2. Conduct Agreement Reminders
```typescript
await createNotification({
  userId: parent.emiratesId,
  ...NotificationTemplates.conductAgreementPending(student.name, student.id)
});
```

### 3. School Announcements
```typescript
await createBulkNotifications({
  userIds: allParentIds,
  ...NotificationTemplates.announcement(
    "School Holiday",
    "Schools closed Nov 20-24."
  )
});
```

### 4. Update Period Notifications
```typescript
await createBulkNotifications({
  userIds: allParentIds,
  ...NotificationTemplates.updatePeriodActive("December 15, 2025")
});
```

## 🔌 API Reference

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

## 🎨 Notification Types

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| `info` | ℹ️ | Blue | General information |
| `success` | ✅ | Green | Success messages |
| `warning` | ⚠️ | Yellow | Warnings/alerts |
| `error` | ❌ | Red | Error messages |
| `enrollment` | 🎓 | Purple | Enrollment updates |
| `update` | 📝 | Orange | Information updates |
| `conduct` | 📋 | Indigo | Conduct agreements |
| `announcement` | 📢 | Pink | Announcements |

## 🧩 Components

### NotificationBell
Simple bell icon with unread badge

```tsx
<NotificationBell onClick={handleClick} />
```

### NotificationDropdown
Complete dropdown with latest notifications

```tsx
<NotificationDropdown locale="en" />
```

### NotificationCard
Individual notification display

```tsx
<NotificationCard 
  notification={notification}
  onRead={markAsRead}
  showFullBody={true}
/>
```

## 🎣 Hooks

### useNotifications()
Fetch and manage notifications

```typescript
const {
  notifications,
  total,
  isLoading,
  markAsRead,
  markAllAsRead,
  refresh,
} = useNotifications({ status: "unread" });
```

### useNotificationCount()
Track unread count

```typescript
const { unread, total, refresh } = useNotificationCount();
```

## 🔧 Configuration

### Auto-refresh Interval
```typescript
// 60 seconds instead of 30
useNotifications(filter, { refreshInterval: 60000 });

// Disable auto-refresh
useNotifications(filter, { refreshInterval: 0 });
```

### Results Per Page
```typescript
useNotifications({ limit: 100 });
```

## 🧪 Testing

### Sample Data
Run the SQL script to add test notifications:
```bash
# In SQL Server Management Studio or Azure Data Studio
# Run: scripts/sample-notifications.sql
```

### Manual Testing
```bash
# Start dev server
npm run dev

# Test endpoints
curl http://localhost:4200/api/notifications/count

# View in browser
# Navigate to: /notifications
```

## 🔒 Security

- ✅ All routes require NextAuth authentication
- ✅ Notifications scoped to user's Emirates ID
- ✅ Server-side validation on all operations
- ✅ No public access to notification data
- ✅ XSS protection (JSON data is sanitized)

## 🚀 Performance

- **SWR Caching** - Reduces unnecessary API calls
- **Optimistic Updates** - Instant UI feedback
- **Database Indexes** - Fast queries on large datasets
- **Pagination** - Efficient loading of large lists
- **Auto-cleanup** - Automatic deletion of old notifications

## 📱 Responsive Design

- Mobile-friendly dropdown
- Touch-optimized interactions
- Responsive notification cards
- Adaptive layouts

## 🌐 Internationalization

Components support locale prop for RTL/LTR:

```tsx
<NotificationDropdown locale="ar" /> // Arabic
<NotificationDropdown locale="en" /> // English
```

## 📊 Analytics Ready

Track notification engagement:

```typescript
// When notification is read
analytics.track('notification_read', {
  notificationId: id,
  type: notification.type,
  userId: session.user.emiratesId,
});

// When notification is clicked
analytics.track('notification_clicked', {
  notificationId: id,
  destination: notification.data.link,
});
```

## 🐛 Troubleshooting

**No notifications showing?**
- Check user is authenticated
- Verify notifications exist in database
- Check browser console for errors

**Count not updating?**
- Wait for auto-refresh (30s)
- Click refresh button
- Check SWR configuration

**TypeScript errors?**
- Run `npm run prisma:generate`
- Restart TypeScript server

**401 Unauthorized?**
- Ensure valid NextAuth session
- Check `emiratesId` in session

## 🔮 Future Enhancements

- [ ] Push notifications (service workers)
- [ ] Email digest (daily/weekly)
- [ ] User preferences/settings
- [ ] Notification categories
- [ ] Priority levels
- [ ] Rich media support
- [ ] Embedded action buttons
- [ ] Template editor

## 📄 License

Part of the DLS Parent Portal project.

## 🤝 Contributing

1. Follow existing code patterns
2. Add tests for new features
3. Update documentation
4. Follow TypeScript best practices

## 📞 Support

For issues or questions:
1. Check documentation files in `docs/`
2. Review integration examples
3. Test with sample data
4. Check API responses in browser DevTools

---

**Status:** ✅ Production Ready

Built with ❤️ for the DLS Parent Portal
