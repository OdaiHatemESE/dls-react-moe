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
  { params }: { params: { id: string } }
) {
  try {
    const { id: studentId } = params;

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

    const cacheKey = `pp:student:${studentId}`;
    
    // Check cache first (unless nocache is requested)
    if (!skipCache) {
      const cached = await cacheGetJSON<StudentProfileV1>(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
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
    const student = studentList.find(s => s.id === studentId);

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found or not authorized' },
        { status: 404 }
      );
    }

    // Cache the student data for 5 minutes
    await cacheSetJSON(cacheKey, student, { ttlSeconds: 300 });

    return NextResponse.json(student);
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
