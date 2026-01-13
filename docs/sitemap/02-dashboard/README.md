# Dashboard Page (/dashboard)

**Route**: `/dashboard`  
**File**: `app/dashboard/page.tsx`  
**Access**: Protected (requires authentication & Emirates ID)

## 📋 Business Purpose

The dashboard is the **main hub** of the Parent Portal application. It provides parents with:
- Overview of all their children's information
- Quick access to each child's detailed profile
- Recent announcements and upcoming events
- Data refresh capabilities with cache management
- Real-time sync with OneRoster data

## 🎯 User Stories

- As a **parent**, I want to see all my children in one place
- As a **parent**, I want to know when my data was last updated
- As a **parent**, I want to manually refresh my children's data
- As a **parent**, I want to quickly navigate to any child's profile
- As a **parent**, I want to see my data in my preferred language (English/Arabic)

## 🔧 Technical Implementation

### Component Type
- **Client Component** (`"use client"`)
- Uses SWR for data fetching and caching
- Responsive mobile-first design

### Key Features
1. **Children List Display**: Cards showing all enrolled students
2. **Data Sync**: Manual refresh with background synchronization
3. **Cache Management**: Displays last update time
4. **Responsive Header**: Sticky header with mobile optimization
5. **Internationalization**: Full RTL support for Arabic

### Code Flow
```
User lands on /dashboard
    ↓
Extract Emirates ID from session
    ↓
Fetch children list from API (cached)
    ↓
Display children cards
    ↓
User can trigger sync
    ↓
Update cache with fresh data
```

## 🔌 API Endpoints Used

### 1. **GET /api/PP/ChildList/:eid**
**Purpose**: Fetch list of children for a parent
- **Method**: GET
- **Auth**: Required (session)
- **Parameters**:
  - `eid` (path): Parent's Emirates ID
- **Response**:
  ```typescript
  {
    students: StudentProfileV1[],
    meta: {
      cache: {
        cachedAt?: string,
        source: 'cache' | 'api'
      }
    }
  }
  ```
- **Used For**: Initial children list display

### 2. **GET /api/PP/child/sync?emirateId=:eid**
**Purpose**: Sync fresh data from OneRoster
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
- **Used For**: Manual refresh, updating stale data

## 📊 Data Dependencies

### Session Data (Required)
- **Emirates ID**: `session?.user?.emiratesId`
  - Source: NextAuth session
  - Critical: Page cannot function without it
  - Used to identify parent and fetch their children

### Children Data Structure
```typescript
interface StudentProfileV1 {
  id: string;                    // OneRoster sourcedId
  emirateId: string;
  studentNumber: string;
  firstNameEnglish: string;
  middleNameEnglish: string;
  thirdNameEnglish: string;
  fourthNameEnglish: string;
  familyNameEnglish: string;
  firstNameArabic: string;
  middleNameArabic: string;
  lastNameArabic: string;
  status: 'active' | 'inactive';
  isActive: boolean;
  role: string;
  // ... more fields
}
```

### Cache Metadata
```typescript
interface CacheMeta {
  cachedAt?: string;           // ISO timestamp
  source: 'cache' | 'api';     // Data source
}
```

## ✅ Validation & Checks

### Authentication Check
```typescript
const { data: session } = useSession();
const eid = session?.user?.emiratesId;
```
- **Required**: User must be authenticated
- **Required**: Emirates ID must exist in session
- **Fallback**: If no EID, API call is skipped (swrKey = null)

### Data Validation
1. **Children Array**: Defaults to empty array if undefined
   ```typescript
   const children = childrenData?.students ?? [];
   ```

2. **Meta Extraction**: Safe access to nested metadata
   ```typescript
   const meta = childrenData?.meta;
   ```

3. **Display Name**: Locale-based name selection with fallbacks
   ```typescript
   const displayName = locale === 'ar'
     ? [arabic_names].filter(Boolean).join(' ')
     : [english_names].filter(Boolean).join(' ');
   ```

## 🔄 State Management

### SWR Cache Management
```typescript
const swrKey = eid ? `/api/PP/ChildList/${encodeURIComponent(eid)}` : null;
const { data: childrenData, mutate } = useSWR<any>(swrKey, jsonFetcher);
```

### Sync Data Transformation
```typescript
const handleSyncData = (syncResponse: any) => {
  if (syncResponse?.students) {
    mutate({
      students: syncResponse.students,
      meta: syncResponse.meta
    }, false); // Don't revalidate, use provided data
  }
  return syncResponse;
};
```

### Refresh Bar Integration
- **Component**: `<RefreshBar />`
- **Props**:
  - `swrKey`: Sync endpoint
  - `meta`: Cache metadata
  - `onAfterFetch`: Transform function
  - `labels`: Localized strings

## 🎨 UI Components

### Layout Structure
```
┌─────────────────────────────────┐
│ Sticky Header                   │
│ - Dashboard title               │
│ - RefreshBar component          │
│ - Date info                     │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ Welcome Card                    │
│ - User greeting                 │
│ - Profile info                  │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ Children Section                │
│ - Section header                │
│ - Status badge                  │
│ - ChildCards component          │
└─────────────────────────────────┘
```

### Custom Components Used
1. **RefreshBar** - Data sync UI
   - From: `@/components/RefreshBar`
   - Purpose: Manual data refresh
   
2. **ChildCards** - Children list
   - From: `./components/ChildCards`
   - Purpose: Display children cards
   
3. **Card/CardContent** - UI containers
   - From: `@/components/ui/card`
   
4. **Badge** - Status indicators
   - From: `@/components/ui/badge`

### Styling Classes
- **Gradient Background**: `from-background via-background to-primary/5`
- **Sticky Header**: `sticky top-0 z-10`
- **Backdrop Blur**: `backdrop-blur-md`
- **Mobile Optimization**: `px-3 sm:px-6 lg:px-8`

## 🌐 Internationalization

### Supported Languages
- **English** (en)
- **Arabic** (ar) with RTL layout

### Translation Keys
```typescript
t.dashboard.welcome              // Welcome message
t.home.redirecting              // Fallback text
// RefreshBar labels:
{
  lastUpdated: 'Last updated:' | 'آخر تحديث:',
  confirm: 'Fetch fresh data?' | 'جلب بيانات حديثة؟',
  refresh: 'Refresh' | 'تحديث',
  refreshing: 'Refreshing…' | 'جاري التحديث…',
  unknown: 'unknown' | 'غير معروف'
}
```

### RTL Handling
```typescript
className={clsx(
  "...",
  locale === 'ar' && 'direction-rtl'
)}
```

## 📱 Responsive Design

### Mobile (< 640px)
- Compact header with smaller icons
- Single column child cards
- Bottom navigation priority
- Touch-optimized buttons

### Tablet (640px - 1024px)
- Two-column grid for children
- Expanded header information
- Balanced layout

### Desktop (> 1024px)
- Three-column grid maximum
- Full header with date display
- Spacious card layout
- Enhanced hover states

## 🚦 Navigation Flow

### Incoming Routes
- From `/` (home redirect)
- From `/login` (after authentication)
- From child detail pages (back navigation)
- From profile/settings

### Outgoing Routes
- To `/child/[id]` - View child details (via ChildCards)
- To `/profile` - Via header navigation
- To `/notifications` - Via header notification icon

## ⚠️ Error Handling

### No Emirates ID
- API calls are skipped (swrKey is null)
- Empty state is shown in ChildCards
- No error message (handled by middleware redirect)

### API Failures
- SWR handles errors gracefully
- Cached data is still displayed
- Refresh button allows retry

### Sync Failures
- RefreshBar shows error state
- Original cached data remains
- User can retry sync

## 🔐 Security Considerations

### Authentication
- Protected by NextAuth middleware
- Session token validated server-side
- Emirates ID required for API access

### Data Access
- Parents can only see their own children
- Emirates ID used as authorization key
- Server validates parent-child relationship

## 🧪 Testing Considerations

### Test Scenarios
1. ✅ Load dashboard with valid Emirates ID
2. ✅ Display children from cache
3. ✅ Trigger manual refresh
4. ✅ Update cache after sync
5. ✅ Show last updated timestamp
6. ✅ Handle empty children list
7. ✅ RTL layout for Arabic
8. ✅ Responsive design on mobile

### Edge Cases
- Parent with no children
- Expired cache
- Network failure during sync
- Incomplete child data

## 🔗 Related Pages

- **Child Detail** (`/child/[id]`) - Navigate to via ChildCards
- **Profile** (`/profile`) - Parent information
- **Home** (`/`) - Redirects here

## 📝 Configuration

### Environment Variables
Required for API calls (not directly used in component):
- `NEXTAUTH_URL` - Base URL for auth
- `NEXTAUTH_SECRET` - Session encryption
- `ONEROSTER_*` - OneRoster API credentials

### Feature Flags
None currently implemented.

## 🎯 Key Takeaways

1. **Main Hub**: Primary entry point after login
2. **Data Sync**: Intelligent caching with manual refresh
3. **Mobile-First**: Optimized for all screen sizes
4. **Bilingual**: Full English/Arabic support
5. **Performance**: Uses SWR for efficient data fetching
6. **UX Focus**: Clear visual hierarchy, loading states, error handling

## 🔍 Code Location

```
app/
  └── dashboard/
      ├── page.tsx                 ← Main dashboard component
      └── components/
          ├── ChildCards.tsx       ← Children list display
          ├── RecentAnnouncements.tsx
          └── UpcomingEvents.tsx
```

## 📚 Dependencies

- `next-auth/react` - Session management
- `swr` - Data fetching and caching
- `@/lib/swr` - Custom SWR configuration
- `@/app/i18n/I18nProvider` - Internationalization
- `@/components/RefreshBar` - Data refresh UI
- `@/components/ui/*` - UI components
- `clsx` - Conditional classes
