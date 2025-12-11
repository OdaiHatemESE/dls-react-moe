import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { cacheGetJSON, cacheSetJSON } from '@/lib/cache';
import { getActiveAcademicYearValue } from '@/lib/admin-config';
import { fetchWithTimeout, FetchTimeoutError } from '@/lib/fetch-with-timeout';
import type { StudentProfileV1 } from '@/app/types/studentprofile';

type PPTokenResponse = {
  accessToken?: string;
  error?: string;
};

const TOKEN_TIMEOUT_MS = 8000;
const PROFILES_TIMEOUT_MS = 25000; // Increased from 15s to 25s for slower upstream responses

type SchoolResponse = {
  sourcedId: string;
  identifier: string;
  metadata: {
    shortName: string;
    englishName: string;
    addresses?: Array<{
      country: string;
      city: string;
      state: string;
      region: string;
      zipCode: string;
      addressLine1: string;
      addressLine2: string;
      addressLine3: string;
      latitude: string;
      longitude: string;
    }>;
  };
  name: string;
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Get active academic year
    const activeAcademicYear = await getActiveAcademicYearValue();
    const effectiveYear = schoolYear || String(activeAcademicYear);

    const cacheKey = `pp:student:${studentId}:enrollments:year:${effectiveYear}`;
    
    type Wrapped<T> = { data: T; fetchedAt: string };
    
    // Check cache first (unless nocache is requested)
    if (!skipCache) {
      const cachedAny = await cacheGetJSON<unknown>(cacheKey);
      if (cachedAny) {
        if (
          typeof cachedAny === "object" && cachedAny !== null &&
          "data" in cachedAny && "fetchedAt" in cachedAny
        ) {
          const wrapped = cachedAny as Wrapped<any>;
          return NextResponse.json({
            ...wrapped.data,
            meta: {
              cache: {
                source: "cache",
                lastUpdated: wrapped.fetchedAt ?? null,
              },
            },
          });
        }
        // Backwards compatibility: old cache format without wrapper
        return NextResponse.json({
          ...(cachedAny as any),
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
      console.error('[PP Student Enrollments] Invalid token type:', typeof accessToken);
      return NextResponse.json({ 
        error: 'Invalid token format received from auth endpoint',
        tokenType: typeof accessToken 
      }, { status: 500 });
    }

    // Fetch all student profiles for the parent
    const profilesUrl = `${baseUrl.replace(/\/$/, '')}/oneroster/students/profiles?EmirateId=${eid}`;
    
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
        
        console.error('[PP Student Enrollments] Profiles fetch error:', {
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
      console.error('[PP Student Enrollments] Profiles fetch failed:', {
        status: profilesRes.status,
        error: errorData,
      });
      return NextResponse.json(
        { error: errorData ?? `Upstream returned ${profilesRes.status}` },
        { status: profilesRes.status }
      );
    }

    const studentList: StudentProfileV1[] = await profilesRes.json();

    // Find the specific student by ID
    const student = studentList.find(s => s.id === studentId);

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found or not authorized' },
        { status: 404 }
      );
    }

    // Filter enrollments by year
    const enrollments = student.enrollment?.filter(
      enr => enr.schoolYear === effectiveYear
    ) || [];

    // Collect unique school IDs from enrollments
    const schoolIDs = Array.from(
      new Set(
        enrollments
          .map((e) => e.schoolId)
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      )
    );

    // Fetch school info for all schools
    let schoolInfos: SchoolResponse[] = [];
    if (schoolIDs.length > 0) {
      const results = await Promise.all(
        schoolIDs.map(async (id) => {
          try {
            const schoolUrl = `${baseUrl.replace(/\/$/, '')}/oneroster/schools/${encodeURIComponent(id)}`;
            const schoolRes = await fetchWithTimeout(schoolUrl, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              cache: 'no-store',
              timeoutMs: 10000,
            });

            if (!schoolRes.ok) {
              console.error(`[PP Student Enrollments] Failed to fetch school ${id}`);
              return null;
            }

            return await schoolRes.json() as SchoolResponse;
          } catch (error) {
            console.error(`[PP Student Enrollments] Error fetching school ${id}:`, error);
            return null;
          }
        })
      );
      schoolInfos = results.filter((s): s is SchoolResponse => s !== null);
    }

    const schoolID = schoolIDs[0] ?? null;
    const schoolInfo = schoolInfos[0] ?? null;

    const responseData = {
      enrollments,
      count: enrollments.length,
      studentId,
      schoolYear: effectiveYear,
      schoolID,
      schoolInfo,
      schoolIDs,
      schoolInfos,
    };

    // Cache the enrollment data for 5 minutes
    const fetchedAt = new Date().toISOString();
    await cacheSetJSON<Wrapped<typeof responseData>>(
      cacheKey,
      { data: responseData, fetchedAt },
      { ttlSeconds: 300 }
    );

    return NextResponse.json({
      ...responseData,
      meta: {
        cache: {
          source: "upstream",
          lastUpdated: fetchedAt,
        },
      },
    });
  } catch (err: any) {
    console.error('[PP Student Enrollments] Unexpected error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
