# Child Detail Page (/child/[id])

**Route**: `/child/[id]`  
**File**: `app/child/[id]/page.tsx`  
**Access**: Protected (requires authentication & Emirates ID)

## 📋 Business Purpose

The child detail page is the **comprehensive student profile view** that displays:
- Complete student information (personal, academic, school)
- Real-time enrollment and grade data
- School information with contact details
- Parent conduct document signing capabilities
- Information update links
- Data synchronization with cache management

This page serves as the central hub for all child-related information and actions.

## 🎯 User Stories

- As a **parent**, I want to see all my child's information in one place
- As a **parent**, I want to view my child's current grades and academic performance
- As a **parent**, I want to see which school my child attends
- As a **parent**, I want to sign conduct agreements electronically
- As a **parent**, I want to update my child's information when needed
- As a **parent**, I want to refresh the data to ensure it's current

## 🔧 Technical Implementation

### Component Type
- **Client Component** (`"use client"`)
- Uses Next.js dynamic routing with `[id]` parameter
- SWR for data fetching with cache management
- Tab-based interface for organized content

### Key Features
1. **Dynamic Student Profile**: Fetches data based on URL parameter
2. **Academic Year Selection**: Dropdown to view different years
3. **Tabbed Interface**: Info, School, and Grades sections
4. **Conduct Signing**: Integrated PDF generation and signing workflow
5. **Data Sync**: Manual refresh capability with cache invalidation
6. **Breadcrumb Navigation**: Easy back to dashboard

### Code Flow
```
User navigates to /child/:id
    ↓
Extract student sourcedId from URL
    ↓
Fetch student details from API
    ↓
Fetch active academic year
    ↓
Display profile with tabs
    ↓
User can:
  - View information
  - Sign conduct
  - Update info
  - Sync data
```

## 🔌 API Endpoints Used

### 1. **GET /api/PP/student/:id**
**Purpose**: Fetch detailed student profile
- **Method**: GET
- **Auth**: Required (session)
- **Parameters**:
  - `id` (path): Student's OneRoster sourcedId
- **Response**:
  ```typescript
  {
    ...StudentProfileV1,
    meta?: {
      cache?: {
        cachedAt?: string,
        source: 'cache' | 'api'
      }
    }
  }
  ```
- **Used For**: All student information display

### 2. **GET /api/PP/child/sync?emirateId=:eid**
**Purpose**: Sync all children data including this student
- **Method**: GET
- **Auth**: Required (session)
- **Parameters**:
  - `emirateId` (query): Parent's Emirates ID
- **Response**:
  ```typescript
  {
    students: StudentProfileV1[],
    meta: { ... }
  }
  ```
- **Used For**: Manual data refresh
- **Post-Processing**: Finds matching student and updates cache

### 3. **GET /api/admin/academic-year/active**
**Purpose**: Get current active academic year
- **Method**: GET
- **Auth**: Required (session)
- **Response**:
  ```typescript
  {
    id?: number,
    yearValue: number,        // e.g., 2026
    isActive?: boolean,
    isDefault: boolean,
    academicYear?: string,
    description?: string | null
  }
  ```
- **Used For**: Default year selection, conduct document academic year

## 📊 Data Dependencies

### URL Parameters
- **id**: Student's OneRoster sourcedId (dynamic route parameter)
  ```typescript
  const params = useParams();
  const sourcedId = params.id as string;
  ```

### Session Data (Required)
- **Emirates ID**: `session?.user?.emiratesId`
  - Used for sync operations
  - Validates parent-child relationship

### Student Data Structure
```typescript
interface StudentProfileV1 {
  // Identifiers
  id: string;
  emirateId: string;
  studentNumber: string;
  
  // Names (English)
  firstNameEnglish: string;
  middleNameEnglish: string;
  thirdNameEnglish: string;
  fourthNameEnglish: string;
  familyNameEnglish: string;
  
  // Names (Arabic)
  firstNameArabic: string;
  middleNameArabic: string;
  lastNameArabic: string;
  
  // Status
  status: 'active' | 'inactive';
  isActive: boolean;
  role: string;
  
  // Additional fields...
  meta?: { cache?: CacheMeta };
}
```

### Academic Year Data
- Determines default year for grade viewing
- Used in conduct document generation
- Falls back to current year if not set

## ✅ Validation & Checks

### 1. Authentication & Authorization
```typescript
const { data: session } = useSession();
const eid = session?.user?.emiratesId;
```
- User must be logged in
- Emirates ID must exist
- Server validates parent has access to this student

### 2. Student Data Validation
```typescript
if (isLoading) return <LoadingSkeleton />;
if (error) return <ErrorMessage />;
if (!student) return <NoDataMessage />;
```
- Loading states handled explicitly
- Error states displayed with messages
- Missing data handled gracefully

### 3. Display Name Generation
```typescript
const displayName = locale === 'ar'
  ? [student.firstNameArabic, student.middleNameArabic, student.lastNameArabic]
      .filter(Boolean).join(' ')
  : [student.firstNameEnglish, ..., student.familyNameEnglish]
      .filter(Boolean).join(' ');
```
- Filters out empty/null values
- Joins with spaces
- Locale-aware selection

### 4. Active Status Check
```typescript
{student.isActive !== undefined && (
  <Badge variant={student.isActive ? "default" : "secondary"}>
    {student.isActive ? 'Active' : 'Inactive'}
  </Badge>
)}
```
- Only shows badge if status is defined
- Conditional styling based on status

## 🔄 State Management

### SWR Cache Management
```typescript
const swrKey = sourcedId 
  ? `/api/PP/student/${encodeURIComponent(sourcedId)}` 
  : null;
const { data: student, error, isLoading, mutate } = useSWR<StudentProfileV1>(
  swrKey, 
  jsonFetcher
);
```

### Academic Year State
```typescript
const [year, setYear] = React.useState<string>(activeAcademicYear);

React.useEffect(() => {
  if (activeYearData?.yearValue) {
    setYear(String(activeYearData.yearValue));
  }
}, [activeYearData]);
```
- Syncs with active academic year from API
- User can manually change via dropdown

### Sync Data Transformation
```typescript
const handleSyncData = (syncResponse: any) => {
  if (syncResponse?.students && Array.isArray(syncResponse.students)) {
    const syncedStudent = syncResponse.students.find(
      (s: StudentProfileV1) => s.id === sourcedId
    );
    if (syncedStudent) {
      mutate(syncedStudent, false); // Update cache
    }
  }
  return syncResponse;
};
```
- Extracts current student from synced children array
- Updates only this student's cache
- Doesn't trigger revalidation

## 🎨 UI Components

### Layout Structure
```
┌─────────────────────────────────┐
│ Sticky Header                   │
│ - Breadcrumb navigation         │
│ - RefreshBar                    │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ Student Profile Card            │
│ - Avatar with initial           │
│ - Name (localized)              │
│ - Badges (ID, Role, Status)     │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ Parent Actions Banner           │
│ - Sign Conduct button           │
│ - (Only if isActive = true)     │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ Information Tabs                │
│ - Info Tab (default)            │
│   - Personal details            │
│   - Contact information         │
└─────────────────────────────────┘
```

### Custom Components Used

1. **RefreshBar**
   - Purpose: Manual data sync
   - Props: swrKey, meta, onAfterFetch, labels
   - Location: `@/components/RefreshBar`

2. **SignConductSection**
   - Purpose: Conduct document signing
   - Props: locale, studentId, studentNumber, academicYear
   - Location: `./components/SignConductSection`

3. **InfoTab**
   - Purpose: Display student information
   - Props: person, t, locale
   - Location: `./components/InfoTab`

4. **LoadingSkeleton**
   - Purpose: Loading state placeholder
   - Props: locale
   - Location: `./components/LoadingSkeleton`

5. **SchoolInfo**
   - Purpose: School details display
   - Location: `./SchoolInfo`

6. **StreamGrades**
   - Purpose: Grade information
   - Location: `./StreamGrades`

### UI Component Library
- **Card** - Profile container
- **Badge** - Status indicators
- **Tabs** - Content organization
- **Select** - Year dropdown
- **Button** - Actions (Link component)

## 🌐 Internationalization

### Supported Languages
- **English** (en) - LTR layout
- **Arabic** (ar) - RTL layout with `direction-rtl` class

### Translation Keys
```typescript
// Child-specific
t.child.child_profile
t.child.no_data_available_for_child

// RefreshBar labels
{
  lastUpdated: locale === 'ar' ? 'آخر تحديث:' : 'Last updated:',
  confirm: locale === 'ar' ? 'جلب بيانات حديثة؟' : 'Fetch fresh data?',
  refresh: locale === 'ar' ? 'تحديث' : 'Refresh',
  refreshing: locale === 'ar' ? 'جاري التحديث…' : 'Refreshing…',
  unknown: locale === 'ar' ? 'غير معروف' : 'unknown'
}

// Navigation
locale === 'ar' ? 'الرئيسية' : 'Home'
locale === 'ar' ? 'ملف الطالب' : 'Student'

// Actions
locale === 'ar' ? 'إجراءات ولي الأمر' : 'Parent Actions'
locale === 'ar' ? 'طالب' : 'Student'
locale === 'ar' ? 'نشط' : 'Active'
locale === 'ar' ? 'غير نشط' : 'Inactive'
```

### Name Localization
- **Arabic**: Uses `firstNameArabic`, `middleNameArabic`, `lastNameArabic`
- **English**: Uses full English name fields
- Fallback handling for missing translations

## 📱 Responsive Design

### Mobile (< 640px)
- Single column layout
- Compact profile header (w-16 h-16 avatar)
- Stacked badges
- Touch-optimized buttons
- Bottom navigation priority

### Tablet (640px - 1024px)
- Two-column grid in info sections
- Larger avatar (w-20 h-20)
- Side-by-side action buttons
- Better spacing

### Desktop (> 1024px)
- Three-column layouts where applicable
- Full-sized avatar
- Expanded information display
- Desktop navigation patterns

### Responsive Classes
```typescript
// Avatar sizing
className="w-16 h-16 md:w-20 md:h-20"

// Container padding
className="px-3 sm:px-6 lg:px-8"

// Text sizing
className="text-lg md:text-xl font-bold"
```

## 🚦 Navigation Flow

### Incoming Routes
- From `/dashboard` - ChildCards click
- From `/parent/applications` - "View Profile" button
- From `/child/[id]/update-info` - After submission
- From `/child/[id]/parent-conduct` - After signing

### Outgoing Routes
- **Back to Dashboard**: Breadcrumb navigation
  ```typescript
  <Link href="/dashboard">Home</Link>
  ```
- **Update Info**: Only if student is active
  ```typescript
  // Available in actions banner or tabs
  ```
- **Parent Conduct**: SignConductSection component
  ```typescript
  <SignConductSection 
    studentId={student.id}
    academicYear={activeAcademicYear}
  />
  ```

### Breadcrumb Structure
```
Home > Student
  ↓      ↓
/dashboard → Current page
```

## ⚠️ Error Handling

### Loading States
```typescript
if (isLoading) {
  return <LoadingSkeleton locale={locale} />;
}
```
- Full-page skeleton shown during initial load
- Matches page layout structure

### Error States
```typescript
if (error) {
  const errorMessage = error?.message || String(error);
  return (
    <div className="text-center py-10">
      <div className="mb-4 text-destructive ...">
        {errorMessage}
      </div>
    </div>
  );
}
```
- Displays error message to user
- Red styling for visibility
- Fallback to string representation

### No Data State
```typescript
if (!student) {
  return (
    <div className="text-center py-10">
      {t.child.no_data_available_for_child}
    </div>
  );
}
```
- Localized message
- Clear indication of missing data

### Sync Failures
- Handled by RefreshBar component
- Original cached data remains displayed
- User can retry

## 🔐 Security Considerations

### Authorization
- Server validates parent-child relationship via Emirates ID
- OneRoster API enforces data access rules
- Session tokens validated on every request

### Data Privacy
- Only shows data for authorized students
- Conduct documents include parent verification
- No data exposed to unauthorized users

### URL Parameter Validation
- Student ID validated server-side
- Invalid IDs return 404 or error state
- No SQL injection risk (OneRoster IDs are UUIDs)

## 🧪 Testing Considerations

### Test Scenarios
1. ✅ Load page with valid student ID
2. ✅ Display student information correctly
3. ✅ Show active/inactive status appropriately
4. ✅ Render conduct signing for active students only
5. ✅ Handle missing student data
6. ✅ Sync data manually
7. ✅ Navigate back to dashboard
8. ✅ RTL layout for Arabic
9. ✅ Responsive design on all breakpoints

### Edge Cases
- Student with incomplete data
- No academic year configured
- Expired cache during load
- Network failure during sync
- Invalid student ID in URL
- Parent accessing unauthorized student

## 🔗 Related Pages

- **Dashboard** (`/dashboard`) - Parent hub, navigation origin
- **Update Info** (`/child/[id]/update-info`) - Edit student information
- **Parent Conduct** (`/child/[id]/parent-conduct`) - Conduct agreement page
- **Applications** (`/parent/applications`) - Can navigate here

## 📝 Configuration

### Environment Variables
Required for API functionality:
- `ONEROSTER_BASE` - OneRoster API base URL
- `ONEROSTER_READ_CLIENT_ID` - API client ID
- `ONEROSTER_READ_CLIENT_SECRET` - API secret
- `NEXTAUTH_URL` - Auth base URL
- `NEXTAUTH_SECRET` - Session encryption

### Academic Year Configuration
- Stored in database (Prisma)
- Admin-configurable via `/admin/eid`
- Falls back to current year if not set

## 🎯 Key Takeaways

1. **Comprehensive Profile**: All student data in one place
2. **Real-Time Sync**: Manual refresh with cache management
3. **Action-Oriented**: Conduct signing, info updates
4. **Mobile-First**: Fully responsive design
5. **Bilingual**: Complete Arabic/English support with RTL
6. **Authorization**: Server-side parent-child validation
7. **Performance**: Efficient caching with SWR
8. **UX Focus**: Loading states, error handling, clear navigation

## 🔍 Code Location

```
app/
  └── child/
      └── [id]/
          ├── page.tsx                     ← Main component
          ├── SchoolInfo.tsx
          ├── StreamGrades.tsx
          └── components/
              ├── SignConductSection.tsx   ← Conduct signing
              ├── LoadingSkeleton.tsx      ← Loading state
              └── InfoTab.tsx              ← Student info display
```

## 📚 Dependencies

- `next/navigation` - Dynamic routing, useParams
- `next-auth/react` - Session management
- `swr` - Data fetching and caching
- `@/lib/swr` - Custom fetcher
- `@/app/i18n/I18nProvider` - i18n
- `@/components/RefreshBar` - Data sync UI
- `@/components/ui/*` - UI component library
- `clsx` - Conditional CSS classes
