import { NextResponse } from 'next/server';
import type { StudentProfileV1 } from '@/app/types/studentprofile';

type PPTokenResponse = {
  accessToken?: string;
  error?: string;
};

export async function GET(
  req: Request,
  { params }: { params: { eid: string } }
) {
  try {
    const { eid } = params;

    if (!eid) {
      return NextResponse.json({ error: 'Emirates ID is required' }, { status: 400 });
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
      return NextResponse.json(
        { error: errorData ?? `Upstream returned ${profilesRes.status}` },
        { status: profilesRes.status }
      );
    }

    const studentList: StudentProfileV1[] = await profilesRes.json();

    return NextResponse.json(studentList);
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
