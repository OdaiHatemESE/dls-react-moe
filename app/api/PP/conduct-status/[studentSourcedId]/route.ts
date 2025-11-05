import { NextResponse } from 'next/server';

type PPTokenResponse = {
  accessToken?: string;
  error?: string;
};

/**
 * POST /api/PP/conduct-status/[studentSourcedId]
 * Updates student conduct agreement status via PP API
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ studentSourcedId: string }> }
) {
  try {
    const { studentSourcedId } = await params;

    if (!studentSourcedId) {
      return NextResponse.json(
        { error: 'Student sourced ID is required' },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: 'PP_BASE_URL not configured' },
        { status: 500 }
      );
    }

    // Prepare payload with dynamic timestamp
    const payload = {
      isConductAgreementSigned: true,
      conductAgreementSignedAt: new Date().toISOString(),
    };

    // Call PP API endpoint
    const ppUrl = `${baseUrl.replace(/\/$/, '')}/oneroster/students/${studentSourcedId}/conduct-status`;
    
    const ppRes = await fetch(ppUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!ppRes.ok) {
      const errorData = await ppRes.json().catch(() => null);
      return NextResponse.json(
        { error: errorData ?? `Upstream returned ${ppRes.status}` },
        { status: ppRes.status }
      );
    }

    const result = await ppRes.json();

    return NextResponse.json({
      success: true,
      data: result,
      payload,
      meta: {
        studentSourcedId,
        signedAt: payload.conductAgreementSignedAt,
      },
    });
  } catch (err: any) {
    console.error('[PP Conduct Status]', err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
