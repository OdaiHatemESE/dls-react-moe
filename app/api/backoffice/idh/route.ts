import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prismaParent } from '@/lib/prisma-parent';
import type { IDHStudent } from '@/app/types/idh';

type PPTokenResponse = {
  accessToken?: string;
  error?: string;
};

export const dynamic = 'force-dynamic';

type BackofficeSessionResult =
  | { session: Session }
  | { response: NextResponse };

async function requireBackofficeSession(): Promise<BackofficeSessionResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const rawEmiratesId = session.user.emiratesId ?? '';
  const normalizedEmiratesId = rawEmiratesId.replace(/[-\s]/g, '').trim();

  if (!normalizedEmiratesId) {
    return { response: NextResponse.json({ error: 'Forbidden - Backoffice access required' }, { status: 403 }) };
  }

  const adminUser = await prismaParent.adminUser.findFirst({
    where: {
      emirateId: normalizedEmiratesId,
      isActive: true,
    },
    select: { id: true },
  });

  if (!adminUser) {
    return { response: NextResponse.json({ error: 'Forbidden - Backoffice access required' }, { status: 403 }) };
  }

  session.user.emiratesId = normalizedEmiratesId;
  return { session };
}

function buildTokenUrl(req: Request): string {
  return new URL('/api/PP/auth/token', req.url).toString();
}

/**
 * GET /api/backoffice/idh?sourceId=xxx
 * Fetches IDH student data by sourceId (student person ID)
 */
export async function GET(req: Request) {
  try {
    const backofficeResult = await requireBackofficeSession();
    if ('response' in backofficeResult) {
      return backofficeResult.response;
    }

    const { searchParams } = new URL(req.url);
    const sourceId = searchParams.get('sourceId');

    if (!sourceId) {
      return NextResponse.json({ error: 'sourceId query parameter is required' }, { status: 400 });
    }

    // Get PP token from our token endpoint
    const tokenUrl = buildTokenUrl(req);
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

    // Fetch IDH data for the student using query parameter
    const idhUrl = `${baseUrl.replace(/\/$/, '')}/idh?sourceId=${encodeURIComponent(sourceId)}`;
    const idhRes = await fetch(idhUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!idhRes.ok) {
      const errorData = await idhRes.json().catch(() => null);
      return NextResponse.json(
        { error: errorData ?? `Upstream returned ${idhRes.status}` },
        { status: idhRes.status }
      );
    }

    const idhData: IDHStudent = await idhRes.json();

    return NextResponse.json({
      ok: true,
      data: idhData,
      meta: {
        sourceId,
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('Error fetching IDH data:', err);
    return NextResponse.json(
      { ok: false, error: err.message || String(err) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/backoffice/idh
 * Inserts or updates IDH student data
 * 
 * Request body should contain IDHStudent data including sourceId
 */
export async function POST(req: Request) {
  try {
    const backofficeResult = await requireBackofficeSession();
    if ('response' in backofficeResult) {
      return backofficeResult.response;
    }

    // Parse request body
    const body: IDHStudent = await req.json();

    if (!body.sourceId) {
      return NextResponse.json(
        { error: 'sourceId is required in request body' },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields: (keyof IDHStudent)[] = [
      'studentNumber',
      'schoolId',
      'sourceId',
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Get PP token from our token endpoint
    const tokenUrl = buildTokenUrl(req);
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

    // Insert/update IDH data
    const idhUrl = `${baseUrl.replace(/\/$/, '')}/idh`;
    
    const idhRes = await fetch(idhUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!idhRes.ok) {
      const errorData = await idhRes.json().catch(() => null);
      return NextResponse.json(
        { error: errorData ?? `Upstream returned ${idhRes.status}` },
        { status: idhRes.status }
      );
    }

    const responseData = await idhRes.json();

    return NextResponse.json({
      ok: true,
      data: responseData,
      meta: {
        sourceId: body.sourceId,
        insertedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('Error inserting IDH data:', err);
    return NextResponse.json(
      { ok: false, error: err.message || String(err) },
      { status: 500 }
    );
  }
}
