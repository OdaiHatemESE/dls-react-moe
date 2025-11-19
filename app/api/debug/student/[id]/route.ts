import { NextResponse } from 'next/server';
import type { StudentProfileV1 } from '@/app/types/studentprofile';
import { fetchWithTimeout, FetchTimeoutError } from '@/lib/fetch-with-timeout';

type PPTokenResponse = {
  accessToken?: string;
  error?: string;
};

const TOKEN_TIMEOUT_MS = 8000;
const PROFILES_TIMEOUT_MS = 15000;

/**
 * DEBUG ENDPOINT - NO AUTHORIZATION
 * Fetches student data directly from PP API without parent validation
 * USE ONLY FOR DEBUGGING
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const url = new URL(req.url);
    const parentEid = url.searchParams.get('parentEid');
    
    if (!parentEid) {
      return NextResponse.json({ 
        error: 'parentEid query parameter is required for debugging' 
      }, { status: 400 });
    }

    // Get PP token
    const internalApiBaseUrl = process.env.PUBLIC_URL || process.env.NEXTAUTH_URL || 'http://localhost:4200';
    const tokenUrl = `${internalApiBaseUrl}/api/PP/auth/token`;
    let tokenRes: Response;
    let tokenData: PPTokenResponse | null = null;

    try {
      tokenRes = await fetchWithTimeout(tokenUrl, {
        cache: 'no-store',
        timeoutMs: TOKEN_TIMEOUT_MS,
      });
      tokenData = (await tokenRes.json().catch(() => null)) as PPTokenResponse | null;
    } catch (error) {
      const status = error instanceof FetchTimeoutError ? 504 : 502;
      const message =
        error instanceof FetchTimeoutError
          ? 'Timed out while requesting PP token'
          : 'Failed to reach PP token endpoint';
      return NextResponse.json({ error: message }, { status });
    }

    if (!tokenRes.ok || !tokenData?.accessToken) {
      return NextResponse.json(
        { error: tokenData?.error || 'Failed to get PP access token' },
        { status: 500 }
      );
    }

    const accessToken = tokenData.accessToken;
    const baseUrl = process.env.PP_BASE_URL;

    if (!baseUrl) {
      return NextResponse.json({ error: 'PP_BASE_URL not configured' }, { status: 500 });
    }

    // Fetch all student profiles for the specified parent EID
    const profilesUrl = `${baseUrl.replace(/\/$/, '')}/oneroster/students/profiles?EmirateId=${parentEid}`;
    
    console.log('[DEBUG] Fetching profiles for EID:', parentEid);
    console.log('[DEBUG] Looking for student ID:', studentId);
    
    let profilesRes: Response;
    try {
      profilesRes = await fetchWithTimeout(profilesUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        timeoutMs: PROFILES_TIMEOUT_MS,
      });
    } catch (error) {
      const status = error instanceof FetchTimeoutError ? 504 : 502;
      const message =
        error instanceof FetchTimeoutError
          ? 'Timed out while fetching student profiles'
          : 'Failed to reach PP student profiles endpoint';
      return NextResponse.json({ error: message }, { status });
    }

    if (!profilesRes.ok) {
      const errorData = await profilesRes.json().catch(() => null);
      console.error('[DEBUG] Profiles fetch failed:', {
        status: profilesRes.status,
        error: errorData,
      });
      return NextResponse.json(
        { 
          error: errorData ?? `Upstream returned ${profilesRes.status}`,
          upstream: {
            url: profilesUrl,
            status: profilesRes.status,
          }
        },
        { status: profilesRes.status }
      );
    }

    const studentList: StudentProfileV1[] = await profilesRes.json();

    console.log('[DEBUG] Found students count:', studentList.length);
    console.log('[DEBUG] Student IDs in response:', studentList.map(s => s.id));

    // Find the specific student by ID
    const student = studentList.find(s => s.id === studentId);

    if (!student) {
      return NextResponse.json(
        { 
          error: 'Student not found in parent\'s children',
          debug: {
            requestedStudentId: studentId,
            parentEid: parentEid,
            availableStudentIds: studentList.map(s => s.id),
            totalStudents: studentList.length,
          }
        },
        { status: 404 }
      );
    }

    // Return full student data with debug info
    return NextResponse.json({
      success: true,
      student: student,
      debug: {
        parentEid: parentEid,
        studentId: studentId,
        enrollmentCount: student.enrollment?.length ?? 0,
        enrollments: student.enrollment?.map(e => ({
          schoolYear: e.schoolYear,
          schoolId: e.schoolId,
          educationType: e.educationType,
          streamGradeId: e.streamGradeId,
          entryDate: e.entryDate,
          exitDate: e.exitDate,
        })) ?? [],
        contacts: student.contacts?.length ?? 0,
        addresses: student.addresses?.length ?? 0,
        hasParentInfo: !!student.parent,
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[DEBUG] Unexpected error:', err);
    return NextResponse.json({ 
      error: String(err),
      stack: err.stack,
    }, { status: 500 });
  }
}
