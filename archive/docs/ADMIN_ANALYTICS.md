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
  - Information update flag (isInformationUpdated)
  - Information update timestamp (informationUpdatedAt)
  - Information update status code (informationUpdateStatus)
  - Conduct agreement signed flag (isConductAgreementSigned)
  - Conduct agreement signature timestamp (conductAgreementSignedAt)

- **Search & Pagination**
  - Search by name, Emirates ID, or student number
  - Paginated results (default 50 per page)
  - Total count and page navigation
  - Current page statistics (total, updated, conduct signed)

### 3. **Information Update Activity** (`/api/admin/analytics/updates`)
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
    "informationUpdates": {
      "total": 150,
      "updated": 85,
      "pending": 65,
      "updateRate": "56.67",
      "withConductSigned": 78,
      "conductSignRate": "52.00",
      "byStatus": [
        { "status": 1, "count": 30 },
        { "status": 2, "count": 55 }
      ]
    },
    "system": {
      "admins": { "total": 3, "active": 2 },
      "periods": { "total": 2, "active": 1 },
      "actions": { "total": 5, "enabled": 4 },
      "academicYears": { "total": 3, "active": 1 }
    }
  },
  "demographics": {...},
  "recentActivity": {
    "newStudents": [...],
    "recentEnrollments": [...],
    "recentInfoUpdates": [...],
    "recentConductSignatures": [...]
  },
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
  },
  "stats": {
    "currentPage": {
      "total": 50,
      "updated": 28,
      "conductSigned": 25
    }
  }
}
```

### GET `/api/admin/analytics/updates`
Returns student information update activity and conduct agreement tracking.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

**Response:**
```json
{
  "students": [
    {
      "id": 1,
      "emirateId": "784-1234-5678901-2",
      "firstNameEnglish": "Ahmed",
      "familyNameEnglish": "Ali",
      "firstNameArabic": "أحمد",
      "lastNameArabic": "علي",
      "username": "ahmed.ali",
      "studentNumber": "STU-12345",
      "status": "active",
      "updatedAt": "2024-11-05T10:30:00Z",
      "isInformationUpdated": true,
      "informationUpdatedAt": "2024-11-01T14:20:00Z",
      "informationUpdateStatus": 2,
      "isConductAgreementSigned": true,
      "conductAgreementSignedAt": "2024-11-01T14:15:00Z"
    }
  ],
  "stats": {
    "total": 120,
    "infoUpdated": 85,
    "conductSigned": 78,
    "bothCompleted": 65,
    "pendingInfo": 35,
    "pendingConduct": 42,
    "byStatus": [
      { "status": 1, "count": 30 },
      { "status": 2, "count": 55 },
      { "status": 3, "count": 10 }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 50,
    "totalCount": 120,
    "totalPages": 3
  },
  "meta": {
    "fetchedAt": "2024-11-05T12:00:00Z"
  }
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
Information update activity showing:
- Students with information updates or conduct agreements
- Update completion status with timestamps
- Conduct agreement signatures with dates
- Statistics cards (Total, Info Updated, Conduct Signed, Both Completed)
- Sortable by most recent activity
- Paginated results

## Access Control

All analytics endpoints require:
1. Valid authentication (NextAuth session)
2. Admin user status (verified against `AdminUser` table)
3. Active admin account

Unauthorized requests return 401/403 status codes.

## Database Tables Used

- `Student` - Primary table for information update tracking:
  - `isInformationUpdated` - Boolean flag for update completion
  - `informationUpdatedAt` - Timestamp of last information update
  - `informationUpdateStatus` - Integer status code for update state (1=pending, 2=completed, 3=requested)
  - `isConductAgreementSigned` - Boolean flag for conduct agreement
  - `conductAgreementSignedAt` - Timestamp of conduct signature
- `StudentAddress` - Student addresses (for profile completeness)
- `StudentContact` - Student contacts (for profile completeness)
- `StudentEnrollment` - Enrollment history (for context)
- `AdminUser` - Admin access control
- `UpdatePeriodConfig` - Update period settings
- `StudentActionConfig` - Student action configurations
- `AcademicYearConfig` - Academic year management
- `Parent` - Parent records

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
