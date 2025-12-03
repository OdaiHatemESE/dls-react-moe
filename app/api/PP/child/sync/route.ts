import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { StudentProfileV1 } from '@/app/types/studentprofile';
import { cacheSetJSON } from '@/lib/cache';
import { getActiveAcademicYearValue } from '@/lib/admin-config';

type PPTokenResponse = {
  accessToken?: string;
  error?: string;
};

type Wrapped<T> = { data: T; fetchedAt: string };

type StudentWithActiveStatus = StudentProfileV1 & {
  isActive: boolean;
  hasActiveEnrollment: boolean;
};

/**
 * GET/POST /api/PP/child/sync
 * 
 * Syncs student profiles from upstream PP API and updates cache.
 * Accepts emirateId and optional schoolYear as query parameters.
 * 
 * Query Parameters:
 * - emirateId: Emirates ID of the parent (required)
 * - schoolYear: Optional school year to filter enrollments
 * 
 * Returns: Fresh student profiles from upstream API
 */
async function handleSync(req: Request) {
  try {
    const url = new URL(req.url);
    const emirateId = url.searchParams.get('emirateId');
    const schoolYear = url.searchParams.get('schoolYear');

    if (!emirateId) {
      return NextResponse.json(
        { error: 'Emirates ID is required' },
        { status: 400 }
      );
    }

    // Verify session
    const session = await getServerSession(authOptions);
    const sessionEid = session?.user?.emiratesId;

    if (!sessionEid) {
      return NextResponse.json(
        { error: 'Unauthorized: No session found' },
        { status: 401 }
      );
    }

    // Ensure the user can only sync their own data
    if (sessionEid !== emirateId) {
      return NextResponse.json(
        { error: 'Unauthorized: Cannot sync data for another user' },
        { status: 403 }
      );
    }

    // Get PP token from our token endpoint
    const internalApiBaseUrl = process.env.PUBLIC_URL || process.env.NEXTAUTH_URL || 'http://localhost:4200';
    const tokenUrl = `${internalApiBaseUrl}/api/PP/auth/token`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData: PPTokenResponse = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.accessToken) {
      return NextResponse.json(
        { error: tokenData.error || 'Failed to get PP access token' },
        { status: 500 }
      );
    }

    const accessToken = tokenData.accessToken;
    const baseUrl = process.env.PP_BASE_URL;

    if (!baseUrl) {
      return NextResponse.json(
        { error: 'PP_BASE_URL not configured' },
        { status: 500 }
      );
    }

    // Validate token
    if (typeof accessToken !== 'string' || !accessToken) {
      console.error('[PP Child Sync] Invalid token type:', typeof accessToken);
      return NextResponse.json(
        { error: 'Invalid token format received from auth endpoint' },
        { status: 500 }
      );
    }

    // Fetch fresh student profiles from upstream PP API sync endpoint
    const profilesUrl = `${baseUrl.replace(/\/$/, '')}/oneroster/students/profiles/sync?EmirateId=${emirateId}`;

    const profilesRes = await fetch(profilesUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Force fresh data
    });

    if (!profilesRes.ok) {
      const errorData = await profilesRes.json().catch(() => null);
      console.error('[PP Child Sync] Profiles fetch failed:', {
        status: profilesRes.status,
        error: errorData,
      });
      return NextResponse.json(
        { error: errorData ?? `Upstream returned ${profilesRes.status}` },
        { status: profilesRes.status }
      );
    }

    const responseData = await profilesRes.json();
    
    // Handle different response formats - sync endpoint might return {students: [...]} or just [...]
    let studentList: StudentProfileV1[];
    if (Array.isArray(responseData)) {
      studentList = responseData;
    } else if (responseData && Array.isArray(responseData.students)) {
      studentList = responseData.students;
    } else {
      console.error('[PP Child Sync] Unexpected response format:', responseData);
      return NextResponse.json(
        { error: 'Unexpected response format from upstream API' },
        { status: 500 }
      );
    }
    
    const fetchedAt = new Date().toISOString();

    // Get active academic year to determine student active status
    const activeAcademicYear = await getActiveAcademicYearValue();
    const activeYearStr = activeAcademicYear ? String(activeAcademicYear) : null;

    // Enhance student list with active status
    const studentsWithStatus: StudentWithActiveStatus[] = studentList.map((student) => {
      let hasActiveEnrollment = false;
      
      if (student.enrollment && student.enrollment.length > 0 && activeYearStr) {
        // Check if student has enrollment matching active academic year
        // and no exit date (or empty exit date means still enrolled)
        hasActiveEnrollment = student.enrollment.some((enr) => {
          const matchesYear = enr.schoolYear === activeYearStr;
          const hasNotExited = !enr.exitDate || enr.exitDate.trim() === '';
          return matchesYear && hasNotExited;
        });
      }

      return {
        ...student,
        isActive: hasActiveEnrollment,
        hasActiveEnrollment,
      };
    });

    // Cache each student profile individually
    for (const student of studentsWithStatus) {
      let filteredStudent = student;

      // Filter enrollments by schoolYear if provided
      if (schoolYear && student.enrollment) {
        filteredStudent = {
          ...student,
          enrollment: student.enrollment.filter(
            enr => enr.schoolYear === schoolYear
          ),
        };
      }

      // Cache with and without school year
      const baseCacheKey = `pp:student:${student.id}`;
      const yearCacheKey = schoolYear 
        ? `pp:student:${student.id}:year:${schoolYear}`
        : null;

      // Update base cache
      await cacheSetJSON<Wrapped<StudentWithActiveStatus>>(
        baseCacheKey,
        { data: filteredStudent, fetchedAt },
        { ttlSeconds: 300 }
      );

      // Update year-specific cache if schoolYear is provided
      if (yearCacheKey) {
        await cacheSetJSON<Wrapped<StudentWithActiveStatus>>(
          yearCacheKey,
          { data: filteredStudent, fetchedAt },
          { ttlSeconds: 300 }
        );
      }
    }

    // Also update the childlist cache
    const childListCacheKey = `pp:childlist:${emirateId}`;
    await cacheSetJSON<Wrapped<StudentWithActiveStatus[]>>(
      childListCacheKey,
      { data: studentsWithStatus, fetchedAt },
      { ttlSeconds: 300 }
    );

    // Return the synced data
    return NextResponse.json({
      success: true,
      students: studentsWithStatus,
      count: studentsWithStatus.length,
      meta: {
        cache: {
          source: 'upstream',
          lastUpdated: fetchedAt,
        },
      },
    });
  } catch (err: any) {
    console.error('[PP Child Sync] Error:', err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}

// Support both GET and POST
export async function GET(req: Request) {
  return handleSync(req);
}

export async function POST(req: Request) {
  return handleSync(req);
}
