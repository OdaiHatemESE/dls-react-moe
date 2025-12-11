import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { StudentProfileV1 } from '@/app/types/studentprofile';
import { cacheGetJSON, cacheSetJSON } from '@/lib/cache';
import { getActiveAcademicYearValue } from '@/lib/admin-config';
import { fetchWithTimeout, FetchTimeoutError } from '@/lib/fetch-with-timeout';
import { metricsTracker } from '@/lib/metrics-tracker';

type PPTokenResponse = {
  accessToken?: string;
  error?: string;
};

const TOKEN_TIMEOUT_MS = 8000;
const PROFILES_TIMEOUT_MS = 25000; // Increased from 15s to 25s for slower upstream responses

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const endpoint = '/api/PP/student/[id]';
  
  try {
    const { id: studentId } = await params;

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Get session to retrieve parent's EID
    const session = await getServerSession(authOptions);
    const eid = session?.user?.emiratesId;

    if (!eid) {
      return NextResponse.json({ error: 'Unauthorized: No Emirates ID in session' }, { status: 401 });
    }

    // Check if nocache parameter is present
    const url = new URL(req.url);
    const nocache = url.searchParams.get('nocache');
    const skipCache = nocache === '1' || nocache === 'true';
    const schoolYear = url.searchParams.get('schoolYear');

    const cacheKey = schoolYear 
      ? `pp:student:${studentId}:year:${schoolYear}`
      : `pp:student:${studentId}`;
    
    // Track cache metadata
    let source: "cache" | "upstream" = "cache";
    let lastUpdated: string | null = null;
    
    type Wrapped<T> = { data: T; fetchedAt: string };
    
    // Check cache first (unless nocache is requested)
    if (!skipCache) {
      const cachedAny = await cacheGetJSON<unknown>(cacheKey);
      if (cachedAny) {
        // Get active academic year for isActive calculation
        const activeAcademicYear = await getActiveAcademicYearValue();
        const activeYearStr = String(activeAcademicYear);
        
        // Check if it's the new wrapped format with metadata
        if (
          typeof cachedAny === "object" && cachedAny !== null &&
          "data" in cachedAny && "fetchedAt" in cachedAny
        ) {
          const wrapped = cachedAny as Wrapped<StudentProfileV1>;
          const cachedStudent = wrapped.data;
          
          // Calculate isActive for cached data if not present
          const hasActiveEnrollment = cachedStudent.enrollment?.some(
            (enr) => 
              enr.schoolYear === activeYearStr && 
              (!enr.exitDate || enr.exitDate.trim() === '')
          ) ?? false;
          
          // Ensure isPrimary is always present in contacts and convert from bit (1/0) to boolean
          const contacts = (cachedStudent.contacts || []).map(contact => ({
            ...contact,
            isPrimary: Boolean(contact.isPrimary)
          }));

          // Ensure isPrimary is always present in addresses and convert from bit (1/0) to boolean
          const addresses = (cachedStudent.addresses || []).map(address => ({
            ...address,
            isPrimary: Boolean(address.isPrimary)
          }));
          
          return NextResponse.json({
            ...cachedStudent,
            contacts,
            addresses,
            isActive: hasActiveEnrollment,
            hasActiveEnrollment: hasActiveEnrollment,
            meta: {
              cache: {
                source: "cache",
                lastUpdated: wrapped.fetchedAt ?? null,
              },
            },
          });
        }
        // Backwards compatibility: old cache format without wrapper
        const cachedStudent = cachedAny as StudentProfileV1;
        
        // Calculate isActive for old cached data
        const hasActiveEnrollment = cachedStudent.enrollment?.some(
          (enr) => 
            enr.schoolYear === activeYearStr && 
            (!enr.exitDate || enr.exitDate.trim() === '')
        ) ?? false;
        
        // Ensure isPrimary is always present in contacts and convert from bit (1/0) to boolean
        const contacts = (cachedStudent.contacts || []).map(contact => ({
          ...contact,
          isPrimary: Boolean(contact.isPrimary)
        }));

        // Ensure isPrimary is always present in addresses and convert from bit (1/0) to boolean
        const addresses = (cachedStudent.addresses || []).map(address => ({
          ...address,
          isPrimary: Boolean(address.isPrimary)
        }));
        
        return NextResponse.json({
          ...cachedStudent,
          contacts,
          addresses,
          isActive: hasActiveEnrollment,
          hasActiveEnrollment: hasActiveEnrollment,
          meta: {
            cache: {
              source: "cache",
              lastUpdated: null,
            },
          },
        });
      }
    }

    // Get PP token from our token endpoint
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

    // Validate token is a string
    if (typeof accessToken !== 'string' || !accessToken) {
      return NextResponse.json({ 
        error: 'Invalid token format received from auth endpoint',
        tokenType: typeof accessToken 
      }, { status: 500 });
    }

    // Fetch all student profiles for the parent
    // Use /sync endpoint to get fresh data from database with correct isPrimary values
    const profilesUrl = `${baseUrl.replace(/\/$/, '')}/oneroster/students/profiles?emirateId=${eid}`;
    
    let profilesRes: Response;
    let lastError: Error | null = null;
    const MAX_RETRIES = 1; // Retry once on timeout/error
    
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        profilesRes = await fetchWithTimeout(profilesUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
          timeoutMs: PROFILES_TIMEOUT_MS,
        });
        break; // Success, exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        console.error('Student profiles fetch error:', {
          url: profilesUrl,
          attempt: attempt + 1,
          maxAttempts: MAX_RETRIES + 1,
          error: error instanceof FetchTimeoutError ? 'timeout' : 'network',
        });
        
        // Retry on last attempt
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
          continue;
        }
        
        // All retries exhausted
        const status = error instanceof FetchTimeoutError ? 504 : 502;
        const message =
          error instanceof FetchTimeoutError
            ? 'Timed out while fetching student profiles'
            : 'Failed to reach PP student profiles endpoint';
        return NextResponse.json({ error: message }, { status });
      }
    }
    
    // Check if we have a response (should always be true here)
    if (!profilesRes!) {
      return NextResponse.json(
        { error: lastError?.message || 'Failed to fetch profiles' },
        { status: 502 }
      );
    }

    if (!profilesRes.ok) {
      const errorData = await profilesRes.json().catch(() => null);
      return NextResponse.json(
        { error: errorData ?? `Upstream returned ${profilesRes.status}` },
        { status: profilesRes.status }
      );
    }

    const studentList: StudentProfileV1[] = await profilesRes.json();
    
    // Find the specific student by ID
    let student = studentList.find(s => s.id === studentId);

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found or not authorized' },
        { status: 404 }
      );
    }
    
    // Filter enrollments by schoolYear if provided
    if (schoolYear && student.enrollment) {
      student = {
        ...student,
        enrollment: student.enrollment.filter(
          enr => enr.schoolYear === schoolYear
        ),
      };
    }

    // Calculate isActive and hasActiveEnrollment
    const activeAcademicYear = await getActiveAcademicYearValue();
    const activeYearStr = String(activeAcademicYear);
    
    const hasActiveEnrollment = student.enrollment?.some(
      (enr) => 
        enr.schoolYear === activeYearStr && 
        (!enr.exitDate || enr.exitDate.trim() === '')
    ) ?? false;

    // Ensure isPrimary is always present in contacts and convert from bit (1/0) to boolean
    const contacts = (student.contacts || []).map(contact => ({
      ...contact,
      isPrimary: Boolean(contact.isPrimary)
    }));

    // Ensure isPrimary is always present in addresses and convert from bit (1/0) to boolean
    const addresses = (student.addresses || []).map(address => ({
      ...address,
      isPrimary: Boolean(address.isPrimary)
    }));

    // Add isActive and hasActiveEnrollment to student object
    const studentWithActiveStatus = {
      ...student,
      contacts,
      addresses,
      isActive: hasActiveEnrollment,
      hasActiveEnrollment: hasActiveEnrollment,
    };

    // Cache the student data for 5 minutes with metadata
    const fetchedAt = new Date().toISOString();
    await cacheSetJSON<Wrapped<StudentProfileV1>>(
      cacheKey,
      { data: studentWithActiveStatus, fetchedAt },
      { ttlSeconds: 300 }
    );

    const response = NextResponse.json({
      ...studentWithActiveStatus,
      meta: {
        cache: {
          source: "upstream",
          lastUpdated: fetchedAt,
        },
      },
    });
    
    // Track successful request
    metricsTracker.recordRequest(endpoint, true, Date.now() - startTime);
    return response;
  } catch (err: any) {
    // Track failed request
    metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, {
      statusCode: 500,
    });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
