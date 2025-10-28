# Admin Analytics System

## Overview
Comprehensive admin dashboard providing detailed insights into students, update requests, and system statistics.

## Features

### 1. **System Statistics** (`/api/admin/analytics/stats`)
Real-time overview of the entire system:

- **Student Metrics**
  - Total students count
  - Active vs inactive students
  - Students with complete profiles (address, contact, enrollment)
  
- **Update Request Analytics**
  - Total update requests
  - Completed updates
  - Pending updates  
  - Completion rate percentage

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
  - Last 5 update requests

### 2. **Students Directory** (`/api/admin/analytics/students`)
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
  - Whether student has update request
  - Update request status
  - Last update date
  - Conduct agreement status

- **Search & Pagination**
  - Search by name, Emirates ID, or student number
  - Paginated results (default 50 per page)
  - Total count and page navigation

### 3. **Update Activity Logs** (`/api/admin/analytics/updates`)
Track parent access and information updates:

- **Update Records**
  - Student Emirates ID
  - Parent person ID
  - Request status (Pending, Completed, Requested)
  - Conduct agreement signature status
  - Citizenship information
  - Created and updated timestamps

- **Statistics**
  - Total updates
  - Completed updates count
  - Pending updates count  
  - Updates with signed conduct agreements

- **Filtering**
  - Filter by status
  - Paginated results

## API Endpoints

### GET `/api/admin/analytics/stats`
Returns comprehensive system statistics.

**Response:**
```json
{
  "overview": {
    "students": {
      "total": 150,
      "active": 145,
      "inactive": 5,
      "withAddress": 140,
      "withContact": 138,
      "withEnrollment": 148
    },
    "updates": {
      "total": 45,
      "completed": 30,
      "pending": 15,
      "completionRate": "66.67"
    },
    "system": {
      "admins": { "total": 3, "active": 2 },
      "periods": { "total": 2, "active": 1 },
      "actions": { "total": 5, "enabled": 4 }
    }
  },
  "demographics": {...},
  "recentActivity": {...},
  "counts": {...}
}
```

### GET `/api/admin/analytics/students`
Returns paginated student list.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `search` - Search term for filtering

**Response:**
```json
{
  "students": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "totalCount": 150,
    "totalPages": 3
  }
}
```

### GET `/api/admin/analytics/updates`
Returns update request logs.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `status` - Filter by status (1=pending, 2=completed, 3=requested)

**Response:**
```json
{
  "updates": [...],
  "stats": {
    "total": 45,
    "requested": 10,
    "completed": 30,
    "pending": 5,
    "withConductAgreement": 28
  },
  "pagination": {...}
}
```

## Components

### `SystemStats`
Displays high-level overview cards:
- Total students
- Update requests
- Database records
- System health

### `StudentsTable`
Full student directory with:
- Search functionality
- Pagination controls
- Student details display
- Related data counts (contacts, addresses)

### `UpdateLogsTable`
Activity log showing:
- All update requests
- Status breakdowns (stats cards)
- Parent activity tracking
- Timeline information

## Access Control

All analytics endpoints require:
1. Valid authentication (NextAuth session)
2. Admin user status (verified against `AdminUser` table)
3. Active admin account

Unauthorized requests return 401/403 status codes.

## Database Tables Used

- `Student` - Student records
- `StudentAddress` - Student addresses
- `StudentContact` - Student contacts
- `StudentEnrollment` - Enrollment history
- `UpdateInformationRequests` - Update request tracking
- `AdminUser` - Admin access control
- `UpdatePeriodConfig` - Update period settings
- `StudentActionConfig` - Student action configurations

## UI Features

### Tabs
- **Analytics** - Overview with update logs
- **Students** - Complete student directory
- **Logs** - Update activity tracking
- **Users** - Admin user management
- **Periods** - Update period configuration
- **Actions** - Student action settings

### Styling
- Uses UAE Government Design System colors (aegold, aegreen)
- Responsive design for mobile/tablet/desktop
- Dark mode support
- Clean, flat design with no shadows
- Consistent border and spacing

## Usage Example

```tsx
// Access the admin analytics page
Navigate to: /admin/eid

// The page will:
1. Verify admin access
2. Show system stats at top
3. Display admin config stats
4. Provide tabbed interface for:
   - Analytics overview
   - Students directory
   - Update logs
   - Config management
```

## Performance Considerations

- All queries are optimized with proper indexes
- Pagination prevents loading excessive data
- Parallel queries using Promise.all()
- SWR caching on client-side
- No real-time polling (manual refresh via SWR)

## Future Enhancements

- Export to CSV/Excel functionality
- Date range filtering
- Advanced search with multiple filters
- Charts and visualizations
- Email notifications for updates
- Audit trail for admin actions
