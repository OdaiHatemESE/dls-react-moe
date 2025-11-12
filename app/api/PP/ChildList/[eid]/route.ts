import { NextResponse } from 'next/server';
import type { StudentProfileV1 } from '@/app/types/studentprofile';
import { cacheGetJSON, cacheSetJSON } from '@/lib/cache';
import { getActiveAcademicYearValue } from '@/lib/admin-config';

type PPTokenResponse = {
  accessToken?: string;
  error?: string;
};

type StudentWithActiveStatus = StudentProfileV1 & {
  isActive: boolean;
  hasActiveEnrollment: boolean;
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ eid: string }> }
) {
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
              const isNotPrivate = enr.educationType?.toLowerCase() !== 'private';
              return matchesYear && isNotPrivate;
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

    // Get PP token from our token endpoint
    const tokenUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:4200'}/api/PP/auth/token`;
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

    // Fetch student profiles using the PP token
    const profilesUrl = `${baseUrl.replace(/\/$/, '')}/oneroster/students/profiles?EmirateId=${eid}`;
    
    const profilesRes = await fetch(profilesUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!profilesRes.ok) {
      const errorData = await profilesRes.json().catch(() => null);
      console.error('[PP ChildList] Profiles fetch failed:', {
        status: profilesRes.status,
        error: errorData,
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

    // Enhance student list with active status
    const studentsWithStatus: StudentWithActiveStatus[] = studentList.map((student) => {
      let hasActiveEnrollment = false;
      
      if (student.enrollment && student.enrollment.length > 0 && activeYearStr) {
        // Check if student has enrollment matching active academic year with non-private education type
        hasActiveEnrollment = student.enrollment.some((enr) => {
          const matchesYear = enr.schoolYear === activeYearStr;
          const isNotPrivate = enr.educationType?.toLowerCase() !== 'private';
          return matchesYear && isNotPrivate;
        });
      }

      return {
        ...student,
        isActive: hasActiveEnrollment,
        hasActiveEnrollment,
      };
    });

    // Cache the student list for 5 minutes with metadata
    const fetchedAt = new Date().toISOString();
    await cacheSetJSON<Wrapped<StudentWithActiveStatus[]>>(
      cacheKey,
      { data: studentsWithStatus, fetchedAt },
      { ttlSeconds: 300 }
    );

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
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
