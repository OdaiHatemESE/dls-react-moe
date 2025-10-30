import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { StudentProfileV1 } from '@/app/types/studentprofile';
import { cacheGetJSON, cacheSetJSON } from '@/lib/cache';

type PPTokenResponse = {
  accessToken?: string;
  error?: string;
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
        // Check if it's the new wrapped format with metadata
        if (
          typeof cachedAny === "object" && cachedAny !== null &&
          "data" in cachedAny && "fetchedAt" in cachedAny
        ) {
          const wrapped = cachedAny as Wrapped<StudentProfileV1>;
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
          ...(cachedAny as StudentProfileV1),
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

    // Fetch all student profiles for the parent
    const profilesUrl = `${baseUrl.replace(/\/$/, '')}/oneroster/students/profiles?EmirateId=${eid}`;
    
    const profilesRes = await fetch(profilesUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

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

    // Cache the student data for 5 minutes with metadata
    const fetchedAt = new Date().toISOString();
    await cacheSetJSON<Wrapped<StudentProfileV1>>(
      cacheKey,
      { data: student, fetchedAt },
      { ttlSeconds: 300 }
    );

    return NextResponse.json({
      ...student,
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
