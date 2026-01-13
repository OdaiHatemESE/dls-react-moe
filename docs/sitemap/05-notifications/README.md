# Notifications Page (/notifications)

**Route**: `/notifications`  
**File**: `app/notifications/page.tsx`  
**Access**: Protected (requires authentication)

## 📋 Business Purpose

Provides a comprehensive notification management interface:
- View all notifications with filtering
- Mark notifications as read/unread
- Filter by type and status
- Pagination support
- Real-time unread count

## 🔌 API Endpoints Used

### Custom Hook: useNotifications
**Endpoints** (from `lib/hooks/useNotifications`):

1. **GET /api/notifications**
   - Query params: `status`, `type`, `limit`, `offset`
   - Returns: `{ notifications: [], total: number }`

2. **PATCH /api/notifications/:id/read**
   - Mark single notification as read

3. **POST /api/notifications/mark-all-read**
   - Mark all notifications as read

4. **GET /api/notifications/count**
   - Returns: `{ unread: number }`

## 📊 Data Dependencies

### Notification Types
```typescript
type NotificationType = 
  | "info" | "success" | "warning" | "error"
  | "enrollment" | "update" | "conduct" | "announcement"
  | "StatusChange" | "AddressUpdate" | "ContactUpdate"
  | "TransportationUpdate" | "DataUpdate";
```

### Filter States
- **Status**: `all` | `read` | `unread`
- **Type**: Any NotificationType or `undefined`
- **Pagination**: `limit` (50) and `offset`

## ✅ Validation & Checks

1. **Filter Changes**: Reset offset to 0 when filters change
2. **Pagination**: Check if `hasMore` based on total count
3. **Empty State**: Show message when no notifications found

## 🎨 Key Components

- **Tabs**: Status filter (All/Unread/Read)
- **Select**: Type filter dropdown
- **NotificationCard**: Individual notification display
- **Load More Button**: Pagination control
- **Refresh Button**: Manual data refresh
- **Mark All Read Button**: Bulk action

## 🔄 State Management

```typescript
const [statusFilter, setStatusFilter] = useState<"all" | "read" | "unread">("all");
const [typeFilter, setTypeFilter] = useState<NotificationType | undefined>();
const [limit] = useState(50);
const [offset, setOffset] = useState(0);
```

### Refresh Logic
- Refreshes both notification list and count
- Uses SWR mutation for optimistic updates

## 🌐 Internationalization

- Full Arabic/English support
- RTL layout for Arabic
- Localized notification types
- Translated filter labels

## 🎯 Key Features

- Real-time unread count in header
- Filter by status and type
- Pagination with "Load More"
- Mark individual or all as read
- Responsive design
- Loading and empty states
