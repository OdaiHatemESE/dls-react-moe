import { NextResponse } from 'next/server';
import type { StudentProfileV1 } from '@/app/types/studentprofile';
import { cacheGetJSON, cacheSetJSON } from '@/lib/cache';
import { getActiveAcademicYearValue } from '@/lib/admin-config';
import { fetchWithTimeout, FetchTimeoutError } from '@/lib/fetch-with-timeout';
import { metricsTracker } from '@/lib/metrics-tracker';

type PPTokenResponse = {
  accessToken?: string;
  error?: string;
};

type StudentWithActiveStatus = StudentProfileV1 & {
  isActive: boolean;
  hasActiveEnrollment: boolean;
};

// Timeout configuration
const TOKEN_TIMEOUT_MS = 8000;  // 8 seconds for token fetch
const CHILDLIST_TIMEOUT_MS = 20000; // 20 seconds for child list (may fetch multiple students)
const MAX_RETRIES = 1; // Retry once on timeout

export async function GET(
  req: Request,
  { params }: { params: Promise<{ eid: string }> }
) {
  const startTime = Date.now();
  const endpoint = '/api/PP/ChildList/[eid]';
  
  try {
    const { eid } = await params;

    if (!eid) {
      return NextResponse.json({ error: 'Emirates ID is required' }, { status: 400 });
    }

    // Check if nocache parameter is present
    const url = new URL(req.url);
    const nocache = url.searchParams.get('nocache');
    const skipCache = nocache === '1' || nocache === 'true';

    const cacheKey = `pp:childlist:${eid}`;
    
    // Track cache metadata
    let source: "cache" | "upstream" = "cache";
    let lastUpdated: string | null = null;
    
    type Wrapped<T> = { data: T; fetchedAt: string };
    
    // Check cache first (unless nocache is requested)
    if (!skipCache) {
      const cachedAny = await cacheGetJSON<unknown>(cacheKey);
      if (cachedAny) {
        // Check if it's the new wrapped format with metadata
        if (
          typeof cachedAny === "object" && cachedAny !== null &&
          "data" in cachedAny && "fetchedAt" in cachedAny
        ) {
          const wrapped = cachedAny as Wrapped<StudentWithActiveStatus[]>;
          return NextResponse.json({
            students: wrapped.data,
            meta: {
              cache: {
                source: "cache",
                lastUpdated: wrapped.fetchedAt ?? null,
              },
            },
          });
        }
        // Backwards compatibility: old cache format without wrapper
        // For old cache, we need to recalculate active status
        const activeAcademicYear = await getActiveAcademicYearValue();
        const activeYearStr = activeAcademicYear ? String(activeAcademicYear) : null;
        const oldStudents = cachedAny as StudentProfileV1[];
        const studentsWithStatus: StudentWithActiveStatus[] = oldStudents.map((student) => {
          let hasActiveEnrollment = false;
          
          if (student.enrollment && student.enrollment.length > 0 && activeYearStr) {
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
        
        return NextResponse.json({
          students: studentsWithStatus,
          meta: {
            cache: {
              source: "cache",
              lastUpdated: null,
            },
          },
        });
      }
    }

    // Get PP token from our token endpoint with timeout
    const internalApiBaseUrl = process.env.PUBLIC_URL || process.env.NEXTAUTH_URL || 'http://localhost:4200';
    const tokenUrl = `${internalApiBaseUrl}/api/PP/auth/token`;
    
    let tokenRes;
    let tokenData: PPTokenResponse;
    
    try {
      tokenRes = await fetchWithTimeout(tokenUrl, {
        timeoutMs: TOKEN_TIMEOUT_MS,
      });
      tokenData = await tokenRes.json();
    } catch (err: any) {
      console.error('[PP ChildList] Token fetch failed:', err.message);
      
      if (err instanceof FetchTimeoutError) {
        return NextResponse.json(
          { error: 'Authentication request timed out. Please try again.' },
          { status: 504 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to get authentication token. Please try again.',
          details: err.message
        },
        { status: 503 }
      );
    }

    if (!tokenRes.ok || !tokenData.accessToken) {
      console.error('[PP ChildList] Token validation failed:', { status: tokenRes.status, error: tokenData.error });
      return NextResponse.json(
        { error: tokenData.error || 'Failed to get PP access token' },
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
      console.error('[PP ChildList] Invalid token type:', typeof accessToken);
      return NextResponse.json({ 
        error: 'Invalid token format received from auth endpoint',
        tokenType: typeof accessToken 
      }, { status: 500 });
    }

    // Fetch student profiles using the PP token with timeout and retry
    // Use /sync endpoint to get fresh data from database with correct isPrimary values
    const profilesUrl = `${baseUrl.replace(/\/$/, '')}/oneroster/students/profiles?emirateId=${eid}`;
    
    let profilesRes: Response | null = null;
    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        profilesRes = await fetchWithTimeout(profilesUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeoutMs: CHILDLIST_TIMEOUT_MS,
        });
        break; // Success, exit retry loop
      } catch (err: any) {
        console.error(`[PP ChildList] Profiles fetch attempt ${attempt} failed:`, err.message);
        
        if (attempt < MAX_RETRIES + 1 && err instanceof FetchTimeoutError) {
          // Retry on timeout with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
          continue;
        }
        
        // Last attempt failed or non-timeout error
        if (err instanceof FetchTimeoutError) {
          return NextResponse.json(
            { error: 'Request timed out while fetching student profiles. Please try again.' },
            { status: 504 }
          );
        }
        
        return NextResponse.json(
          { 
            error: 'Failed to fetch student profiles. Please try again.',
            details: err.message
          },
          { status: 503 }
        );
      }
    }
    
    if (!profilesRes) {
      return NextResponse.json(
        { error: 'Failed to fetch student profiles after retries' },
        { status: 503 }
      );
    }

    if (!profilesRes.ok) {
      const errorData = await profilesRes.json().catch(() => null);
      console.error('[PP ChildList] Profiles fetch failed:', {
        status: profilesRes.status,
        error: errorData,
        eid: eid.slice(0, 6) + '***', // Log partial EID for debugging
      });
      
      // For 404 errors, indicate that sync is needed
      if (profilesRes.status === 404) {
        return NextResponse.json(
          { 
            error: errorData ?? 'Student profiles not found',
            needsSync: true,
            emirateId: eid
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: errorData ?? `Upstream returned ${profilesRes.status}` },
        { status: profilesRes.status }
      );
    }

    const studentList: StudentProfileV1[] = await profilesRes.json();

    // Get active academic year to determine student active status
    const activeAcademicYear = await getActiveAcademicYearValue();
    const activeYearStr = activeAcademicYear ? String(activeAcademicYear) : null;

    // Enhance student list with active status and ensure isPrimary is always present
    const studentsWithStatus: StudentWithActiveStatus[] = studentList.map((student) => {
      let hasActiveEnrollment = false;
      
      if (student.enrollment && student.enrollment.length > 0 && activeYearStr) {
        // Check if student has enrollment matching active academic year (including private education)
        // and no exit date (or empty exit date means still enrolled)
        hasActiveEnrollment = student.enrollment.some((enr) => {
          const matchesYear = enr.schoolYear === activeYearStr;
          const hasNotExited = !enr.exitDate || enr.exitDate.trim() === '';
          return matchesYear && hasNotExited;
        });
      }

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

      return {
        ...student,
        contacts,
        addresses,
        isActive: hasActiveEnrollment,
        hasActiveEnrollment,
      };
    });

    // Cache the student list for 5 minutes with metadata
    const fetchedAt = new Date().toISOString();
    const wrappedData: Wrapped<StudentWithActiveStatus[]> = {
      data: studentsWithStatus,
      fetchedAt: fetchedAt
    };
    await cacheSetJSON(cacheKey, wrappedData, { ttlSeconds: 300 });

    return NextResponse.json({
      students: studentsWithStatus,
      meta: {
        cache: {
          source: "upstream",
          lastUpdated: fetchedAt,
        },
      },
    });
  } catch (err: any) {
    console.error('[PP ChildList] Unexpected error:', {
      message: err.message,
      stack: err.stack?.split('\n').slice(0, 3), // Log first 3 lines of stack
    });
    metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, { statusCode: 500 });
    return NextResponse.json({ 
      error: 'An unexpected error occurred. Please try again.',
      details: err.message 
    }, { status: 500 });
  }
}
