/**
 * Student Authorization Utilities
 * 
 * Server-side validation to ensure parents can only access and modify
 * their own children's data, and only when appropriate (active enrollment, etc.)
 */

import type { StudentProfileV1 } from '@/app/types/studentprofile';
import { getActiveAcademicYearValue } from '@/lib/admin-config';

export type AuthorizationError = {
  code: 'UNAUTHORIZED' | 'NOT_FOUND' | 'INACTIVE_STUDENT' | 'NO_ACTIVE_ENROLLMENT' | 'INVALID_STUDENT_ID' | 'PRIVATE_EDUCATION';
  message: string;
  status: number;
};

export type AuthorizationResult = 
  | { authorized: true; student: StudentProfileV1 }
  | { authorized: false; error: AuthorizationError };

/**
 * Validates that:
 * 1. Parent has access to this student (ownership check)
 * 2. Student has an active enrollment for the current academic year
 * 3. Student is marked as active
 * 
 * @param studentId - The student's sourcedId/personId
 * @param parentEid - The parent's Emirates ID from session
 * @param accessToken - PP API access token
 * @returns Authorization result with student data or error
 */
export async function authorizeStudentAccess(
  studentId: string,
  parentEid: string,
  accessToken: string
): Promise<AuthorizationResult> {
  if (!studentId || !studentId.trim()) {
    return {
      authorized: false,
      error: {
        code: 'INVALID_STUDENT_ID',
        message: 'Student ID is required',
        status: 400,
      },
    };
  }

  if (!parentEid || !parentEid.trim()) {
    return {
      authorized: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Parent Emirates ID not found in session',
        status: 401,
      },
    };
  }

  const baseUrl = process.env.PP_BASE_URL;
  if (!baseUrl) {
    return {
      authorized: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'PP_BASE_URL not configured',
        status: 500,
      },
    };
  }

  try {
    // Fetch all students for this parent (ownership validation)
    const profilesUrl = `${baseUrl.replace(/\/$/, '')}/oneroster/students/profiles?EmirateId=${parentEid}`;
    
    const profilesRes = await fetch(profilesUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!profilesRes.ok) {
      return {
        authorized: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Failed to fetch parent\'s children',
          status: profilesRes.status,
        },
      };
    }

    const studentList: StudentProfileV1[] = await profilesRes.json();

    // Find the specific student (ownership check)
    const student = studentList.find(s => s.id === studentId);

    if (!student) {
      return {
        authorized: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Student not found or not authorized for this parent',
          status: 404,
        },
      };
    }

    // Get active academic year
    const activeAcademicYear = await getActiveAcademicYearValue();
    const activeYearStr = activeAcademicYear ? String(activeAcademicYear) : null;

    // Check for enrollment in current academic year
    const currentYearEnrollments = student.enrollment?.filter(
      (enr) => enr.schoolYear === activeYearStr
    ) ?? [];

    if (currentYearEnrollments.length === 0) {
      return {
        authorized: false,
        error: {
          code: 'NO_ACTIVE_ENROLLMENT',
          message: 'Student does not have an enrollment for the current academic year',
          status: 403,
        },
      };
    }

    // Check if all enrollments are private education (not allowed)
    const hasNonPrivateEnrollment = currentYearEnrollments.some(
      (enr) => enr.educationType?.toLowerCase() !== 'private'
    );

    if (!hasNonPrivateEnrollment) {
      return {
        authorized: false,
        error: {
          code: 'PRIVATE_EDUCATION',
          message: 'This service is not available for students enrolled in private education',
          status: 403,
        },
      };
    }

    // Additional check: if student has isActive property, validate it
    const studentWithActive = student as StudentProfileV1 & { isActive?: boolean };
    if ('isActive' in studentWithActive && studentWithActive.isActive === false) {
      return {
        authorized: false,
        error: {
          code: 'INACTIVE_STUDENT',
          message: 'Student is not currently active',
          status: 403,
        },
      };
    }

    // All checks passed
    return {
      authorized: true,
      student,
    };
  } catch (error) {
    console.error('Student authorization error:', error);
    return {
      authorized: false,
      error: {
        code: 'UNAUTHORIZED',
        message: error instanceof Error ? error.message : 'Authorization failed',
        status: 500,
      },
    };
  }
}

/**
 * Simplified check that only validates ownership without enrollment checks.
 * Use this for read-only operations where we want to allow viewing inactive students.
 */
export async function authorizeStudentOwnership(
  studentId: string,
  parentEid: string,
  accessToken: string
): Promise<AuthorizationResult> {
  if (!studentId || !studentId.trim()) {
    return {
      authorized: false,
      error: {
        code: 'INVALID_STUDENT_ID',
        message: 'Student ID is required',
        status: 400,
      },
    };
  }

  if (!parentEid || !parentEid.trim()) {
    return {
      authorized: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Parent Emirates ID not found in session',
        status: 401,
      },
    };
  }

  const baseUrl = process.env.PP_BASE_URL;
  if (!baseUrl) {
    return {
      authorized: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'PP_BASE_URL not configured',
        status: 500,
      },
    };
  }

  try {
    const profilesUrl = `${baseUrl.replace(/\/$/, '')}/oneroster/students/profiles?EmirateId=${parentEid}`;
    
    const profilesRes = await fetch(profilesUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!profilesRes.ok) {
      return {
        authorized: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Failed to fetch parent\'s children',
          status: profilesRes.status,
        },
      };
    }

    const studentList: StudentProfileV1[] = await profilesRes.json();
    const student = studentList.find(s => s.id === studentId);

    if (!student) {
      return {
        authorized: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Student not found or not authorized for this parent',
          status: 404,
        },
      };
    }

    return {
      authorized: true,
      student,
    };
  } catch (error) {
    console.error('Student ownership check error:', error);
    return {
      authorized: false,
      error: {
        code: 'UNAUTHORIZED',
        message: error instanceof Error ? error.message : 'Ownership verification failed',
        status: 500,
      },
    };
  }
}
