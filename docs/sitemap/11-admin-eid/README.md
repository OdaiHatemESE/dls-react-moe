# Admin Panel (/admin/eid)

**Route**: `/admin/eid`  
**File**: `app/admin/eid/page.tsx`  
**Access**: Protected (requires admin authorization via Emirates ID whitelist)

## 📋 Business Purpose

Administrative configuration and management interface for:
- System analytics and statistics
- Student data management
- Update logs viewing
- Admin user management
- Update period configuration
- Academic year settings
- Student action configuration
- System resilience monitoring

## 🔌 API Endpoints Used

### 1. GET /api/admin/check-access
- **Purpose**: Verify admin authorization
- **Response**:
  ```typescript
  {
    hasAccess: boolean,
    reason?: string,
    user?: {
      id: number,
      name: string,
      email?: string,
      emirateId: string
    }
  }
  ```

### Additional APIs (via child components):
- `/api/admin/users` - User management
- `/api/admin/periods` - Update periods
- `/api/admin/academic-year` - Academic year config
- `/api/admin/actions` - Student actions
- `/api/admin/students` - Student data
- `/api/admin/logs` - Update logs
- `/api/admin/stats` - System statistics

## 📊 Navigation Views

### 1. Analytics (Default)
- System stats overview
- Admin statistics
- Update logs table

### 2. Students
- Student data table
- Search and filter
- Bulk operations

### 3. Logs
- Update logs history
- Filter by student/date
- Audit trail

### 4. Users
- Admin user management
- Add/remove admins
- Emirates ID whitelist

### 5. Periods
- Update period configuration
- Start/end dates
- Active period management

### 6. Academic Year
- Set active academic year
- Historical year tracking

### 7. Actions
- Configure available student actions
- Enable/disable features

### 8. Resilience
- Circuit breaker monitoring
- API health metrics
- System performance

## ✅ Authorization Logic

```typescript
if (!data.hasAccess) {
  // Show access denied
  // Auto-redirect to dashboard after 3 seconds
}
```

### Access Control
- Checks admin_users table in database
- Validates Emirates ID against whitelist
- Server-side validation on all admin APIs

## 🎨 Layout Structure

### Desktop (> 1024px)
```
┌────────────┬─────────────────────────┐
│            │ Header (gradient)       │
│ Left       ├─────────────────────────┤
│ Sidebar    │                         │
│ (fixed)    │ Content Area            │
│            │ (dynamic views)         │
│ - Nav      │                         │
│ - User     │                         │
│   Info     │                         │
└────────────┴─────────────────────────┘
```

### Mobile (< 1024px)
```
┌─────────────────────────┐
│ Mobile Header           │
├─────────────────────────┤
│ Dropdown Navigation     │
├─────────────────────────┤
│ Content Area            │
│ (full width)            │
└─────────────────────────┘
```

## 🔄 State Management

```typescript
const [activeView, setActiveView] = useState("analytics");
const [isCheckingAccess, setIsCheckingAccess] = useState(true);
const [accessData, setAccessData] = useState<AdminAccess | null>(null);
```

### View Rendering
```typescript
const renderContent = () => {
  switch (activeView) {
    case "analytics": return <Analytics />;
    case "students": return <StudentsTable />;
    // ... etc
  }
};
```

## 🌐 Internationalization

- Admin interface supports Arabic/English
- RTL layout support
- Navigation labels localized
- All child components support i18n

## 🔐 Security

1. **Server-Side Check**: `/api/admin/check-access` validates on every load
2. **Database Whitelist**: admin_users table stores authorized Emirates IDs
3. **Auto-Redirect**: Unauthorized users redirected to dashboard
4. **API Protection**: All admin APIs check authorization

## 🎯 Key Features

- Role-based access control
- Multi-view dashboard
- Real-time system monitoring
- User management
- Configuration management
- Audit logging
- Mobile-responsive
- Bilingual support

## 📝 Database Tables Used

- **admin_users**: Administrator whitelist
- **admin_config**: System configuration
- **academic_year_config**: Academic year settings
- **update_logs**: Student update history
- **update_periods**: Allowed update windows
