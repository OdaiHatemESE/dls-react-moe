# Student Authorization Security

## Overview

This document describes the server-side authorization system implemented to secure parent-student data access and modifications.

## Security Problem Addressed

**Vulnerability**: Parents could potentially manipulate URL parameters to access or modify data for:
- Students that don't belong to them
- Students with inactive enrollments
- Students who are no longer active in the system

**Solution**: Server-side validation at API endpoints to enforce authorization rules before processing any requests.

---

## Authorization Levels

### 1. Ownership Validation (`authorizeStudentOwnership`)
**Use Case**: Read-only operations where viewing inactive students is acceptable

**Checks**:
- ✅ Student belongs to the authenticated parent (via Emirates ID)
- ✅ Valid student ID provided
- ✅ Parent has valid session

**Does NOT check**:
- ❌ Active enrollment status
- ❌ Current academic year

**Used in**:
- `/api/parent/conduct` (GET) - Viewing conduct information

---

### 2. Active Student Validation (`authorizeStudentAccess`)
**Use Case**: Modify operations that should only work with active students

**Checks**:
- ✅ All ownership checks (from level 1)
- ✅ Student has enrollment for current academic year
- ✅ At least one enrollment is NOT marked as "private" education type
- ✅ Student's `isActive` flag is true (if present)

**Validation Logic**:
1. First checks if student has ANY enrollment for current academic year
2. Then validates at least one enrollment is non-private education
3. Provides specific error messages for each failure case

**Used in**:
- `/api/backoffice/idh` (POST) - Updating student information
- `/api/parent/students-partnership-charter` (POST) - Signing conduct charter

---

## Implementation Details

### Authorization Utility Module
**Location**: `/lib/student-authorization.ts`

```typescript
// Full active student check (for modifications)
const authResult = await authorizeStudentAccess(
  studentId,
  parentEid,
  accessToken
);

// Ownership check only (for reads)
const authResult = await authorizeStudentOwnership(
  studentId,
  parentEid,
  accessToken
);
```

### Response Structure
```typescript
// Success
{
  authorized: true,
  student: StudentProfileV1
}

// Failure
{
  authorized: false,
  error: {
    code: 'UNAUTHORIZED' | 'NOT_FOUND' | 'INACTIVE_STUDENT' | 'NO_ACTIVE_ENROLLMENT' | 'PRIVATE_EDUCATION',
    message: string,
    status: number
  }
}
```

---

## Protected Endpoints

### 1. Update Student Information
**Endpoint**: `POST /api/backoffice/idh`

**Authorization**: Active Student Validation

**Flow**:
1. Verify user session exists
2. Extract parent Emirates ID from session
3. Get PP API access token
4. **Authorize**: Validate student ownership + active enrollment
5. Validate required fields
6. Submit to upstream IDH API

**Error Responses**:
- `401`: No session or invalid parent EID
- `403`: Student inactive, no active enrollment, or enrolled in private education only
- `404`: Student not found for this parent
- `400`: Missing required fields

**Specific Error Messages**:
- `NO_ACTIVE_ENROLLMENT`: "Student does not have an enrollment for the current academic year"
- `PRIVATE_EDUCATION`: "This service is not available for students enrolled in private education"

---

### 2. Sign Conduct Charter
**Endpoint**: `POST /api/parent/students-partnership-charter`

**Authorization**: Active Student Validation

**Flow**:
1. Verify user session exists
2. Extract parent Emirates ID from session
3. Validate required payload fields
4. Get PP API access token
5. Fetch all students for parent (by Emirates ID)
6. Find student by `studentNumber`
7. **Authorize**: Validate student ownership + active enrollment
8. Submit charter to upstream API

**Error Responses**:
- `401`: No session or invalid parent EID
- `403`: Student inactive, no active enrollment, or enrolled in private education only
- `404`: Student not found for this parent
- `400`: Missing required fields

**Specific Error Messages**:
- `NO_ACTIVE_ENROLLMENT`: "Student does not have an enrollment for the current academic year"
- `PRIVATE_EDUCATION`: "This service is not available for students enrolled in private education"

---

### 3. View Conduct Information
**Endpoint**: `GET /api/parent/conduct`

**Authorization**: Ownership Validation (read-only)

**Flow**:
1. Verify user session exists
2. Extract parent Emirates ID from session
3. Get PP API access token
4. **Authorize**: Validate student ownership only
5. Fetch student and school information
6. Aggregate and return data

**Error Responses**:
- `401`: No session or invalid parent EID
- `404`: Student not found for this parent

**Note**: Uses ownership-only check to allow viewing conduct for inactive students (historical data access).

---

## Active Academic Year Integration

The authorization system integrates with the admin configuration to determine active enrollments:

```typescript
// From lib/admin-config.ts
const activeAcademicYear = await getActiveAcademicYearValue();
// Returns: 2026 (for academic year 2025-2026)

// Check student has enrollment for current year
const currentYearEnrollments = student.enrollment?.filter(
  (enr) => enr.schoolYear === String(activeAcademicYear)
) ?? [];

if (currentYearEnrollments.length === 0) {
  // Error: NO_ACTIVE_ENROLLMENT
}

// Check at least one enrollment is non-private
const hasNonPrivateEnrollment = currentYearEnrollments.some(
  (enr) => enr.educationType?.toLowerCase() !== 'private'
);

if (!hasNonPrivateEnrollment) {
  // Error: PRIVATE_EDUCATION
}
```

---

## Security Best Practices Applied

✅ **Defense in Depth**: Authorization at API layer even though UI hides actions
✅ **Principle of Least Privilege**: Only parents can access their own children
✅ **Separation of Concerns**: Dedicated authorization module
✅ **Fail Secure**: Default deny, explicit allow
✅ **Centralized Logic**: Reusable authorization functions
✅ **Detailed Error Codes**: Specific error types for debugging

---

## Testing Authorization

### Manual Testing

```bash
# Get your session token from browser dev tools
# Try accessing another parent's student

curl -X POST https://your-domain/api/backoffice/idh \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceId": "DIFFERENT_STUDENT_ID",
    "studentNumber": "12345",
    "schoolId": "SCH123",
    "primaryPhone": "0501234567"
  }'

# Expected: 404 Not Found - "Student not found or not authorized for this parent"
```

### Test Scenarios

1. **Valid Active Student**: Should succeed
2. **Inactive Student**: Should return 403 with `NO_ACTIVE_ENROLLMENT`
3. **Private Education Student**: Should return 403 with `PRIVATE_EDUCATION`
4. **Another Parent's Student**: Should return 404
5. **Invalid Student ID**: Should return 400
6. **No Session**: Should return 401

---

## Migration Notes

### Before (Vulnerable)
```typescript
// Old code - no authorization check
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await req.json();
  // Directly submit to upstream without checking student ownership!
  // 🚨 SECURITY ISSUE
}
```

### After (Secure)
```typescript
// New code - with authorization
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await req.json();
  
  // Get parent EID and token
  const parentEid = session?.user?.emiratesId;
  const tokenData = await fetchToken();
  
  // Authorize student access
  const authResult = await authorizeStudentAccess(
    body.sourceId,
    parentEid,
    tokenData.accessToken
  );
  
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error.message },
      { status: authResult.error.status }
    );
  }
  
  // ✅ SECURE - Now submit to upstream
}
```

---

## Related Documentation

- [Child Actions System](./CHILD_ACTIONS_QUICK_REFERENCE.md) - UI-level action availability
- [Admin Configuration](./ADMIN_CONFIG_SYSTEM.md) - Academic year management
- [IDH API Implementation](./IDH_API_IMPLEMENTATION.md) - Student information updates

---

## Maintenance

When adding new parent-facing endpoints that access student data:

1. ✅ Import authorization utilities
2. ✅ Extract parent EID from session
3. ✅ Get PP API access token
4. ✅ Call appropriate authorization function
5. ✅ Handle authorization errors
6. ✅ Only proceed if authorized

**Example Template**:
```typescript
import { authorizeStudentAccess } from '@/lib/student-authorization';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.emiratesId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await req.json();
  const token = await getToken();
  
  const authResult = await authorizeStudentAccess(
    body.studentId,
    session.user.emiratesId,
    token
  );
  
  if (!authResult.authorized) {
    return NextResponse.json(
      { error: authResult.error.message },
      { status: authResult.error.status }
    );
  }
  
  // Process authorized request...
}
```
