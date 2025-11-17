import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { authorizeStudentAccess, authorizeStudentOwnership } from './student-authorization';
import type { StudentProfileV1 } from '@/app/types/studentprofile';

// Mock the admin-config module
vi.mock('./admin-config', () => ({
  getActiveAcademicYearValue: vi.fn(),
}));

// Import the mocked function
import { getActiveAcademicYearValue } from './admin-config';

describe('Student Authorization', () => {
  // Store original environment
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock environment variables
    process.env = { ...originalEnv };
    process.env.PP_BASE_URL = 'https://api.example.com';

    // Default mock for academic year
    vi.mocked(getActiveAcademicYearValue).mockResolvedValue(2025);

    // Mock global fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  // Helper: Create a valid student profile
  const createStudentProfile = (overrides: Partial<StudentProfileV1> = {}): StudentProfileV1 => ({
    id: 'student-123',
    username: 'ahmed.mohammed',
    status: 'active',
    role: 'student',
    firstNameArabic: 'أحمد',
    middleNameArabic: 'محمد',
    lastNameArabic: 'السعيد',
    firstNameEnglish: 'Ahmed',
    middleNameEnglish: 'Mohammed',
    thirdNameEnglish: null,
    fourthNameEnglish: null,
    familyNameEnglish: 'Al-Saeed',
    gender: 'Male',
    dateOfBirth: '2010-05-15',
    religion: null,
    emirateId: '784-1234-5678901-2',
    studentNumber: 'STU-2025-123',
    userIds: ['user-123'],
    NationalityAR: 'الإمارات',
    NationalityEN: 'UAE',
    CitizenshipStatus: 'Citizen',
    birthPlaceCityAr: null,
    birthPlaceCityEn: null,
    birthPlaceCountryAr: null,
    birthPlaceCountryEn: null,
    contacts: [],
    addresses: [],
    enrollment: [
      {
        id: 'enr-1',
        type: 'Enrollment',
        entryType: 'New Student',
        entryDate: '2024-09-01',
        exitDate: null,
        exitType: null,
        exitReason: null,
        isMandatoryEducation: true,
        isSpecialNeed: false,
        educationType: 'government',
        schoolId: 'school-789',
        streamGradeId: 'grade-8',
        schoolYear: '2025',
      },
    ],
    ...overrides,
  });

  describe('authorizeStudentAccess (full validation)', () => {
    describe('Input validation', () => {
      test('rejects empty student ID', async () => {
        const result = await authorizeStudentAccess('', 'parent-eid-123', 'token');

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.error.code).toBe('INVALID_STUDENT_ID');
          expect(result.error.message).toBe('Student ID is required');
          expect(result.error.status).toBe(400);
        }
      });

      test('rejects whitespace-only student ID', async () => {
        const result = await authorizeStudentAccess('   ', 'parent-eid-123', 'token');

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.error.code).toBe('INVALID_STUDENT_ID');
        }
      });

      test('rejects empty parent EID', async () => {
        const result = await authorizeStudentAccess('student-123', '', 'token');

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.error.code).toBe('UNAUTHORIZED');
          expect(result.error.message).toBe('Parent Emirates ID not found in session');
          expect(result.error.status).toBe(401);
        }
      });

      test('rejects whitespace-only parent EID', async () => {
        const result = await authorizeStudentAccess('student-123', '   ', 'token');

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.error.code).toBe('UNAUTHORIZED');
        }
      });

      test('rejects when PP_BASE_URL not configured', async () => {
        delete process.env.PP_BASE_URL;

        const result = await authorizeStudentAccess('student-123', 'parent-eid-123', 'token');

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.error.code).toBe('UNAUTHORIZED');
          expect(result.error.message).toBe('PP_BASE_URL not configured');
          expect(result.error.status).toBe(500);
        }
      });
    });

    describe('Successful authorization', () => {
      test('authorizes valid parent-child relationship with active enrollment', async () => {
        const student = createStudentProfile();

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => [student],
        } as Response);

        const result = await authorizeStudentAccess('student-123', 'parent-eid-123', 'token');

        expect(result.authorized).toBe(true);
        if (result.authorized) {
          expect(result.student.id).toBe('student-123');
          expect(result.student.firstNameEnglish).toBe('Ahmed');
        }

        // Verify API call
        expect(fetch).toHaveBeenCalledWith(
          'https://api.example.com/oneroster/students/profiles?EmirateId=parent-eid-123',
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer token',
              'Content-Type': 'application/json',
            }),
          })
        );
      });

      test('handles trailing slash in PP_BASE_URL', async () => {
        process.env.PP_BASE_URL = 'https://api.example.com/';
        const student = createStudentProfile();

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => [student],
        } as Response);

        await authorizeStudentAccess('student-123', 'parent-eid-123', 'token');

        expect(fetch).toHaveBeenCalledWith(
          'https://api.example.com/oneroster/students/profiles?EmirateId=parent-eid-123',
          expect.anything()
        );
      });

      test('authorizes student with multiple enrollments in current year', async () => {
        const student = createStudentProfile({
          enrollment: [
            {
              id: 'enr-1',
              type: 'Enrollment',
              entryType: 'New Student',
              entryDate: '2024-09-01',
              exitDate: null,
              exitType: null,
              exitReason: null,
              isMandatoryEducation: true,
              isSpecialNeed: false,
              educationType: 'government',
              schoolId: 'school-1',
              streamGradeId: 'grade-8',
              schoolYear: '2025',
            },
            {
              id: 'enr-2',
              type: 'Enrollment',
              entryType: 'Transfer',
              entryDate: '2024-09-01',
              exitDate: null,
              exitType: null,
              exitReason: null,
              isMandatoryEducation: true,
              isSpecialNeed: false,
              educationType: 'government',
              schoolId: 'school-2',
              streamGradeId: 'grade-8',
              schoolYear: '2025',
            },
          ],
        });

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => [student],
        } as Response);

        const result = await authorizeStudentAccess('student-123', 'parent-eid-123', 'token');

        expect(result.authorized).toBe(true);
      });
    });

    describe('Ownership validation', () => {
      test('rejects when student not in parent list (wrong parent)', async () => {
        const otherStudent = createStudentProfile({ id: 'other-student-999' });

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => [otherStudent], // Different student
        } as Response);

        const result = await authorizeStudentAccess('student-123', 'parent-eid-123', 'token');

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.error.code).toBe('NOT_FOUND');
          expect(result.error.message).toBe('Student not found or not authorized for this parent');
          expect(result.error.status).toBe(404);
        }
      });

      test('rejects when parent has no students', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => [], // Empty array
        } as Response);

        const result = await authorizeStudentAccess('student-123', 'parent-eid-123', 'token');

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.error.code).toBe('NOT_FOUND');
        }
      });

      test('finds correct student when parent has multiple children', async () => {
        const targetStudent = createStudentProfile({ id: 'student-123' });
        const otherStudent1 = createStudentProfile({ id: 'student-111' });
        const otherStudent2 = createStudentProfile({ id: 'student-222' });

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => [otherStudent1, targetStudent, otherStudent2],
        } as Response);

        const result = await authorizeStudentAccess('student-123', 'parent-eid-123', 'token');

        expect(result.authorized).toBe(true);
        if (result.authorized) {
          expect(result.student.id).toBe('student-123');
        }
      });
    });

    describe('Enrollment validation', () => {
      test('rejects student with no enrollments', async () => {
        const student = createStudentProfile({ enrollment: [] });

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => [student],
        } as Response);

        const result = await authorizeStudentAccess('student-123', 'parent-eid-123', 'token');

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.error.code).toBe('NO_ACTIVE_ENROLLMENT');
          expect(result.error.message).toBe('Student does not have an enrollment for the current academic year');
          expect(result.error.status).toBe(403);
        }
      });

      test('rejects student with only old year enrollments', async () => {
        const student = createStudentProfile({
          enrollment: [
            {
              id: 'enr-old',
              type: 'Enrollment',
              entryType: 'New Student',
              entryDate: '2023-09-01',
              exitDate: null,
              exitType: null,
              exitReason: null,
              isMandatoryEducation: true,
              isSpecialNeed: false,
              educationType: 'government',
              schoolId: 'school-1',
              streamGradeId: 'grade-7',
              schoolYear: '2024', // Old year
            },
          ],
        });

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => [student],
        } as Response);

        const result = await authorizeStudentAccess('student-123', 'parent-eid-123', 'token');

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.error.code).toBe('NO_ACTIVE_ENROLLMENT');
        }
      });

      test('handles null academic year from config', async () => {
        vi.mocked(getActiveAcademicYearValue).mockResolvedValue(null);
        
        const student = createStudentProfile({
          enrollment: [
            {
              id: 'enr-1',
              type: 'Enrollment',
              entryType: 'New Student',
              entryDate: '2024-09-01',
              exitDate: null,
              exitType: null,
              exitReason: null,
              isMandatoryEducation: true,
              isSpecialNeed: false,
              educationType: 'government',
              schoolId: 'school-1',
              streamGradeId: 'grade-8',
              schoolYear: '2025',
            },
          ],
        });

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => [student],
        } as Response);

        const result = await authorizeStudentAccess('student-123', 'parent-eid-123', 'token');

        // Should reject when no active year configured
        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.error.code).toBe('NO_ACTIVE_ENROLLMENT');
        }
      });
    });

    describe('Private education validation', () => {
      test('rejects student with only private education enrollment', async () => {
        const student = createStudentProfile({
          enrollment: [
            {
              id: 'enr-1',
              type: 'Enrollment',
              entryType: 'New Student',
              entryDate: '2024-09-01',
              exitDate: null,
              exitType: null,
              exitReason: null,
              isMandatoryEducation: true,
              isSpecialNeed: false,
              educationType: 'private', // Private only
              schoolId: 'school-1',
              streamGradeId: 'grade-8',
              schoolYear: '2025',
            },
          ],
        });

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => [student],
        } as Response);

        const result = await authorizeStudentAccess('student-123', 'parent-eid-123', 'token');

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.error.code).toBe('PRIVATE_EDUCATION');
          expect(result.error.message).toBe('This service is not available for students enrolled in private education');
          expect(result.error.status).toBe(403);
        }
      });

      test('rejects student with mixed private/government but only private in current year', async () => {
        const student = createStudentProfile({
          enrollment: [
            {
              id: 'enr-old',
              type: 'Enrollment',
              entryType: 'New Student',
              entryDate: '2023-09-01',
              exitDate: null,
              exitType: null,
              exitReason: null,
              isMandatoryEducation: true,
              isSpecialNeed: false,
              educationType: 'government', // Old government
              schoolId: 'school-1',
              streamGradeId: 'grade-7',
              schoolYear: '2024',
            },
            {
              id: 'enr-new',
              type: 'Enrollment',
              entryType: 'Transfer',
              entryDate: '2024-09-01',
              exitDate: null,
              exitType: null,
              exitReason: null,
              isMandatoryEducation: true,
              isSpecialNeed: false,
              educationType: 'private', // Current private
              schoolId: 'school-2',
              streamGradeId: 'grade-8',
              schoolYear: '2025',
            },
          ],
        });

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => [student],
        } as Response);

        const result = await authorizeStudentAccess('student-123', 'parent-eid-123', 'token');

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.error.code).toBe('PRIVATE_EDUCATION');
        }
      });

      test('authorizes student with at least one government enrollment in current year', async () => {
        const student = createStudentProfile({
          enrollment: [
            {
              id: 'enr-1',
              type: 'Enrollment',
              entryType: 'New Student',
              entryDate: '2024-09-01',
              exitDate: null,
              exitType: null,
              exitReason: null,
              isMandatoryEducation: true,
              isSpecialNeed: false,
              educationType: 'private',
              schoolId: 'school-1',
              streamGradeId: 'grade-8',
              schoolYear: '2025',
            },
            {
              id: 'enr-2',
              type: 'Enrollment',
              entryType: 'Transfer',
              entryDate: '2024-09-01',
              exitDate: null,
              exitType: null,
              exitReason: null,
              isMandatoryEducation: true,
              isSpecialNeed: false,
              educationType: 'government', // At least one government
              schoolId: 'school-2',
              streamGradeId: 'grade-8',
              schoolYear: '2025',
            },
          ],
        });

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => [student],
        } as Response);

        const result = await authorizeStudentAccess('student-123', 'parent-eid-123', 'token');

        expect(result.authorized).toBe(true);
      });

      test('handles case-insensitive education type check', async () => {
        const student = createStudentProfile({
          enrollment: [
            {
              id: 'enr-1',
              type: 'Enrollment',
              entryType: 'New Student',
              entryDate: '2024-09-01',
              exitDate: null,
              exitType: null,
              exitReason: null,
              isMandatoryEducation: true,
              isSpecialNeed: false,
              educationType: 'PRIVATE', // Uppercase
              schoolId: 'school-1',
              streamGradeId: 'grade-8',
              schoolYear: '2025',
            },
          ],
        });

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => [student],
        } as Response);

        const result = await authorizeStudentAccess('student-123', 'parent-eid-123', 'token');

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.error.code).toBe('PRIVATE_EDUCATION');
        }
      });
    });

    describe('Student active status validation', () => {
      test('rejects inactive student when isActive is false', async () => {
        const student = createStudentProfile();
        (student as any).isActive = false; // Add isActive property

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => [student],
        } as Response);

        const result = await authorizeStudentAccess('student-123', 'parent-eid-123', 'token');

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.error.code).toBe('INACTIVE_STUDENT');
          expect(result.error.message).toBe('Student is not currently active');
          expect(result.error.status).toBe(403);
        }
      });

      test('authorizes when isActive is true', async () => {
        const student = createStudentProfile();
        (student as any).isActive = true;

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => [student],
        } as Response);

        const result = await authorizeStudentAccess('student-123', 'parent-eid-123', 'token');

        expect(result.authorized).toBe(true);
      });

      test('authorizes when isActive property not present', async () => {
        const student = createStudentProfile();
        // No isActive property

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => [student],
        } as Response);

        const result = await authorizeStudentAccess('student-123', 'parent-eid-123', 'token');

        expect(result.authorized).toBe(true);
      });
    });

    describe('API error handling', () => {
      test('rejects when API returns 401 Unauthorized', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: false,
          status: 401,
        } as Response);

        const result = await authorizeStudentAccess('student-123', 'parent-eid-123', 'token');

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.error.code).toBe('UNAUTHORIZED');
          expect(result.error.message).toBe("Failed to fetch parent's children");
          expect(result.error.status).toBe(401);
        }
      });

      test('rejects when API returns 404 Not Found', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: false,
          status: 404,
        } as Response);

        const result = await authorizeStudentAccess('student-123', 'parent-eid-123', 'token');

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.error.status).toBe(404);
        }
      });

      test('rejects when API returns 500 Server Error', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as Response);

        const result = await authorizeStudentAccess('student-123', 'parent-eid-123', 'token');

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.error.status).toBe(500);
        }
      });

      test('handles network errors gracefully', async () => {
        vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

        const result = await authorizeStudentAccess('student-123', 'parent-eid-123', 'token');

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.error.code).toBe('UNAUTHORIZED');
          expect(result.error.message).toBe('Network error');
          expect(result.error.status).toBe(500);
        }
      });

      test('handles malformed JSON response', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => {
            throw new Error('Invalid JSON');
          },
        } as unknown as Response);

        const result = await authorizeStudentAccess('student-123', 'parent-eid-123', 'token');

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.error.code).toBe('UNAUTHORIZED');
        }
      });

      test('handles non-Error exceptions', async () => {
        vi.mocked(fetch).mockRejectedValueOnce('String error');

        const result = await authorizeStudentAccess('student-123', 'parent-eid-123', 'token');

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.error.code).toBe('UNAUTHORIZED');
          expect(result.error.message).toBe('Authorization failed');
        }
      });
    });
  });

  describe('authorizeStudentOwnership (simplified check)', () => {
    test('authorizes valid ownership without enrollment checks', async () => {
      const student = createStudentProfile({
        enrollment: [], // No enrollments - should still pass
      });

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [student],
      } as Response);

      const result = await authorizeStudentOwnership('student-123', 'parent-eid-123', 'token');

      expect(result.authorized).toBe(true);
      if (result.authorized) {
        expect(result.student.id).toBe('student-123');
      }

      // Should NOT call getActiveAcademicYearValue
      expect(getActiveAcademicYearValue).not.toHaveBeenCalled();
    });

    test('authorizes student with only private education', async () => {
      const student = createStudentProfile({
        enrollment: [
          {
            id: 'enr-1',
            type: 'Enrollment',
            entryType: 'New Student',
            entryDate: '2024-09-01',
            exitDate: null,
            exitType: null,
            exitReason: null,
            isMandatoryEducation: true,
            isSpecialNeed: false,
            educationType: 'private', // Private - should still pass
            schoolId: 'school-1',
            streamGradeId: 'grade-8',
            schoolYear: '2025',
          },
        ],
      });

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [student],
      } as Response);

      const result = await authorizeStudentOwnership('student-123', 'parent-eid-123', 'token');

      expect(result.authorized).toBe(true);
    });

    test('rejects empty student ID', async () => {
      const result = await authorizeStudentOwnership('', 'parent-eid-123', 'token');

      expect(result.authorized).toBe(false);
      if (!result.authorized) {
        expect(result.error.code).toBe('INVALID_STUDENT_ID');
      }
    });

    test('rejects empty parent EID', async () => {
      const result = await authorizeStudentOwnership('student-123', '', 'token');

      expect(result.authorized).toBe(false);
      if (!result.authorized) {
        expect(result.error.code).toBe('UNAUTHORIZED');
      }
    });

    test('rejects when student not owned by parent', async () => {
      const otherStudent = createStudentProfile({ id: 'other-student' });

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [otherStudent],
      } as Response);

      const result = await authorizeStudentOwnership('student-123', 'parent-eid-123', 'token');

      expect(result.authorized).toBe(false);
      if (!result.authorized) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    test('handles API errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('API error'));

      const result = await authorizeStudentOwnership('student-123', 'parent-eid-123', 'token');

      expect(result.authorized).toBe(false);
      if (!result.authorized) {
        expect(result.error.code).toBe('UNAUTHORIZED');
        expect(result.error.message).toBe('API error');
      }
    });

    test('handles non-Error exceptions', async () => {
      vi.mocked(fetch).mockRejectedValueOnce('String error');

      const result = await authorizeStudentOwnership('student-123', 'parent-eid-123', 'token');

      expect(result.authorized).toBe(false);
      if (!result.authorized) {
        expect(result.error.message).toBe('Ownership verification failed');
      }
    });
  });
});
