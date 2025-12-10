import { NextResponse } from 'next/server';

type PPTokenResponse = {
  accessToken?: string;
  error?: string;
};

/**
 * PATCH /api/PP/conduct-status/[studentSourcedId]
 * Updates student conduct agreement status via PP API
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

    // Parse request body to get dynamic status and isConductAgreementSigned flag
    const body = await req.json().catch(() => ({}));
    const status = typeof body.status === 'number' ? body.status : null;
    const isConductAgreementSigned = typeof body.isConductAgreementSigned === 'boolean' ? body.isConductAgreementSigned : true;

    // Get PP token from our token endpoint with timeout
    const internalApiBaseUrl = process.env.PUBLIC_URL || process.env.NEXTAUTH_URL || 'http://localhost:4200';
    const tokenUrl = `${internalApiBaseUrl}/api/PP/auth/token`;
    
    let tokenRes;
    let tokenData: PPTokenResponse;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      tokenRes = await fetch(tokenUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      tokenData = await tokenRes.json();
    } catch (err: any) {
      console.error('[PP Conduct Status] Token fetch failed:', err.message);
      return NextResponse.json(
        { 
          error: 'Failed to get authentication token. Please try again.',
          details: err.name === 'AbortError' ? 'Request timeout' : err.message
        },
        { status: 503 }
      );
    }

    if (!tokenRes.ok || !tokenData.accessToken) {
      console.error('[PP Conduct Status] Token validation failed:', { status: tokenRes.status });
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
      isConductAgreementSigned: boolean;
      conductAgreementSignedAt: string;
 
    } = {
      isConductAgreementSigned,
      conductAgreementSignedAt: new Date().toISOString(),
    };

    // Call PP API endpoint with timeout
    const ppUrl = `${baseUrl.replace(/\/$/, '')}/oneroster/students/${studentSourcedId}/status`;
    
    let ppRes;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      ppRes = await fetch(ppUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (err: any) {
      console.error('[PP Conduct Status] API call failed:', err.message);
      return NextResponse.json(
        { 
          error: 'Failed to update conduct status. Please try again.',
          details: err.name === 'AbortError' ? 'Request timeout' : err.message
        },
        { status: 503 }
      );
    }

    if (!ppRes.ok) {
      const errorData = await ppRes.json().catch(() => null);
      console.error('[PP Conduct Status] API error:', {
        status: ppRes.status,
        error: errorData,
        studentSourcedId: studentSourcedId.slice(0, 10) + '***',
      });
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
    console.error('[PP Conduct Status] Unexpected error:', {
      message: err.message,
      stack: err.stack?.split('\n').slice(0, 3),
    });
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred. Please try again.',
        details: err.message 
      },
      { status: 500 }
    );
  }
}
