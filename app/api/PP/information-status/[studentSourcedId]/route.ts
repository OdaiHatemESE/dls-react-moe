import { NextResponse } from 'next/server';

type PPTokenResponse = {
  accessToken?: string;
  error?: string;
};

/**
 * PATCH /api/PP/information-status/[studentSourcedId]
 * Updates student information status via PP API
 */
export async function PATCH(
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

    // Parse request body to get dynamic status and isInformationUpdated flag
    const body = await req.json().catch(() => ({}));
    const status = typeof body.status === 'number' ? body.status : null;
    const isInformationUpdated = typeof body.isInformationUpdated === 'boolean' ? body.isInformationUpdated : true;

    // Get PP token from our token endpoint
    const internalApiBaseUrl = process.env.PUBLIC_URL || process.env.NEXTAUTH_URL || 'http://localhost:4200';
    const tokenUrl = `${internalApiBaseUrl}/api/PP/auth/token`;
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

    // Prepare payload with dynamic timestamp and status
    const payload: {
      isInformationUpdated: boolean;
      informationUpdatedAt: string;
      informationUpdateStatus: number | null;
    } = {
      isInformationUpdated,
      informationUpdatedAt: new Date().toISOString(),
      informationUpdateStatus: status,
    };

    // Call PP API endpoint
    const ppUrl = `${baseUrl.replace(/\/$/, '')}/oneroster/students/${studentSourcedId}/status`;
    
    const ppRes = await fetch(ppUrl, {
      method: 'PATCH',
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
        updatedAt: payload.informationUpdatedAt,
      },
    });
  } catch (err: any) {
    console.error('[PP Information Status]', err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
