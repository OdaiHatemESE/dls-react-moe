# Parent Summary Page (/parent/summary)

**Route**: `/parent/summary`  
**File**: `app/parent/summary/page.tsx`  
**Access**: Protected (requires authentication & Emirates ID)

## 📋 Business Purpose

Provides parents with a comprehensive summary of:
- All children overview
- Recent activities and updates
- Pending actions
- Account statistics

## 🔌 API Endpoints Used

### GET /api/PP/summary?eid=:eid
- **Purpose**: Fetch parent account summary
- **Response**:
  ```typescript
  {
    children: StudentProfileV1[],
    recentUpdates: Update[],
    pendingActions: Action[],
    statistics: {
      totalChildren: number,
      activeEnrollments: number,
      pendingUpdates: number,
      unsignedConducts: number
    }
  }
  ```

## 📊 Summary Components

1. **Statistics Cards**:
   - Total Children
   - Active Enrollments
   - Pending Updates
   - Unsigned Conducts

2. **Recent Updates List**:
   - Last 5 information updates
   - Status indicators
   - Quick links

3. **Pending Actions**:
   - Actions requiring attention
   - Conduct signing reminders
   - Update deadlines

4. **Children Quick View**:
   - Summary cards for each child
   - Quick navigation to details

## 🎯 Key Features

- Overview dashboard
- Activity timeline
- Action reminders
- Quick navigation
- Statistics at-a-glance
