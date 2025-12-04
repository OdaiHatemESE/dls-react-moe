# PP School Enrollment Migration

## Overview
This document describes the migration from OneRoster API to PP (Parent Portal) API for school enrollment information, and the integration with the admin-configured active academic year system.

## Changes Made

### 1. New PP Enrollment API Endpoint
**File**: `/app/api/PP/student/[id]/enrollments/route.ts`

A new API endpoint that:
- Fetches student enrollment data from the PP API
- Filters enrollments by academic year (using active academic year from admin config by default)
- Fetches complete school information for all enrolled schools
- Caches results with metadata for 5 minutes
- Returns structured data compatible with the existing SchoolInfo component

**Key Features**:
- Uses active academic year from admin config when no year is specified
- Supports `?schoolYear=YYYY` parameter for filtering by specific year
- Supports `?nocache=1` parameter to bypass cache
- Returns both single school (backwards compatible) and multiple schools data
- Includes cache metadata (source, lastUpdated)

### 2. Active Academic Year API
**File**: `/app/api/admin/academic-year/active/route.ts`

New endpoint that:
- Fetches the active academic year from the admin configuration
- Returns current year as fallback if no active year is configured
- Provides structured response with academic year metadata

**Response Structure**:
```typescript
{
  id?: number;
  academicYear?: string;        // e.g., "2025-2026"
  yearValue: number;             // e.g., 2025
  isActive?: boolean;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  isDefault: boolean;            // true if using fallback
  message?: string;              // informational message
  error?: string;                // error message if any
}
```

### 3. Updated SchoolInfo Component
**File**: `/app/child/[id]/SchoolInfo.tsx`

Changed to use PP API instead of OneRoster:
- **Before**: `/api/oneroster/schoolenrollments?studentId=...`
- **After**: `/api/PP/student/{id}/enrollments?schoolYear=...`

The component now:
- Uses PP API for enrollment data
- Automatically uses active academic year from admin config
- Maintains backwards compatibility with existing UI

### 4. Updated Child Detail Page
**File**: `/app/child/[id]/page.tsx`

Major changes:
- **Removed** hardcoded academic year derivation logic
- **Added** SWR hook to fetch active academic year from admin API
- **Updated** year state to use active academic year by default
- **Simplified** code by removing unused helper functions:
  - `parseEntryDate()`
  - `resolveLatestEnrollment()`
  - `normalizeAcademicYear()`
  - `deriveAcademicYear()`
- **Updated** conduct section to use active academic year instead of derived year

## Data Flow

### Previous Flow (OneRoster)
```
Child Detail Page
  └─> OneRoster API (/api/oneroster/schoolenrollments)
      └─> SQL Server Database (OneRoster tables)
```

### New Flow (PP API)
```
Child Detail Page
  ├─> Active Academic Year API (/api/admin/academic-year/active)
  │   └─> Prisma → AcademicYearConfig table
  │
  └─> PP Student Enrollment API (/api/PP/student/[id]/enrollments)
      └─> PP Service (via Bearer token)
          └─> External PP API
```

## Benefits

1. **Centralized Academic Year Management**
   - Admins can configure the active academic year in one place
   - All enrollment queries automatically use the correct year
   - No need to derive year from enrollment data

2. **Consistent Data Source**
   - Uses PP API across the entire child profile
   - Eliminates discrepancies between different data sources
   - Better alignment with PP data structure

3. **Improved Performance**
   - Efficient caching with metadata
   - Reduced database queries
   - Faster response times

4. **Better User Experience**
   - Accurate enrollment information
   - Consistent year selection across the app
   - Proper active enrollment detection

## API Usage Examples

### Fetch Enrollments for Active Year
```typescript
// Automatically uses active academic year
const { data } = useSWR(`/api/PP/student/${studentId}/enrollments`);
```

### Fetch Enrollments for Specific Year
```typescript
// Override with specific year
const { data } = useSWR(`/api/PP/student/${studentId}/enrollments?schoolYear=2024`);
```

### Bypass Cache
```typescript
// Force fresh data
const { data } = useSWR(`/api/PP/student/${studentId}/enrollments?nocache=1`);
```

### Get Active Academic Year
```typescript
const { data } = useSWR('/api/admin/academic-year/active');
// data.yearValue contains the active year number
```

## Configuration Requirements

### Environment Variables
Same as existing PP API configuration:
- `PP_BASE_URL`: Base URL for PP service
- `PUBLIC_URL` or `NEXTAUTH_URL`: Internal API base URL
- `DATABASE_URL`: Database connection string

### Database Setup
Requires the `AcademicYearConfig` table in the parent-portal database:
```sql
-- Table should already exist from previous migrations
-- Ensure there's at least one active academic year:
SELECT * FROM AcademicYearConfig WHERE isActive = 1;
```

If no active year exists, the API will fallback to the current year.

## Migration Notes

### Backwards Compatibility
- SchoolInfo component maintains the same UI and props interface
- Existing cache keys are different, so old cached data won't conflict
- API responses include both single school (schoolInfo) and multiple schools (schoolInfos) for compatibility

### Breaking Changes
None. The changes are internal to the implementation and don't affect the component API.

### Testing Checklist
- [ ] Verify enrollment data displays correctly
- [ ] Test year selector functionality
- [ ] Confirm active academic year is used by default
- [ ] Check school information accuracy
- [ ] Test cache refresh functionality
- [ ] Verify fallback when no active year is configured
- [ ] Test with multiple enrollments across different years
- [ ] Verify conduct section uses correct year

## Future Enhancements

1. **Admin UI for Academic Year Management**
   - Create admin interface to set active academic year
   - Add year management (create, edit, activate/deactivate)

2. **Enhanced Enrollment Display**
   - Show year-over-year enrollment history
   - Add enrollment status indicators
   - Display transfer information

3. **Performance Optimizations**
   - Implement parallel school info fetching
   - Add prefetching for likely navigation paths
   - Optimize cache TTL based on usage patterns

## Related Documentation
- [Parent Portal API Integration](./PP_API_INTEGRATION.md) (if exists)
- [Admin Academic Year Config](./ADMIN_ACADEMIC_YEAR_CONFIG.md)
- [School Enrollments API](./SCHOOL_ENROLLMENTS_API.md)
