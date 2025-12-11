import { NextResponse } from 'next/server';
import { fetchWithTimeout, FetchTimeoutError } from '@/lib/fetch-with-timeout';
import { metricsTracker } from '@/lib/metrics-tracker';

type PPTokenResponse = {
  accessToken?: string;
  error?: string;
};

// Timeout configuration
const TOKEN_TIMEOUT_MS = 8000;  // 8 seconds for token fetch
const STATUS_UPDATE_TIMEOUT_MS = 15000; // 15 seconds for status update
const MAX_RETRIES = 1; // Retry once on timeout

/**
 * PATCH /api/PP/information-status/[studentSourcedId]
 * Updates student information status via PP API
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ studentSourcedId: string }> }
) {
  const startTime = Date.now();
  const endpoint = '/api/PP/information-status/[studentSourcedId]';
  
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
      console.error('[PP Information Status] Token fetch failed:', err.message);
      
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
      console.error('[PP Information Status] Token validation failed:', { status: tokenRes.status });
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

    // Call PP API endpoint with timeout and retry
    const ppUrl = `${baseUrl.replace(/\/$/, '')}/oneroster/students/${studentSourcedId}/status`;
    
    let ppRes: Response | null = null;
    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        ppRes = await fetchWithTimeout(ppUrl, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          timeoutMs: STATUS_UPDATE_TIMEOUT_MS,
        });
        break; // Success, exit retry loop
      } catch (err: any) {
        console.error(`[PP Information Status] API call attempt ${attempt} failed:`, err.message);
        
        if (attempt < MAX_RETRIES + 1 && err instanceof FetchTimeoutError) {
          // Retry on timeout with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
          continue;
        }
        
        // Last attempt failed or non-timeout error
        if (err instanceof FetchTimeoutError) {
          return NextResponse.json(
            { error: 'Request timed out. Please try again.' },
            { status: 504 }
          );
        }
        
        return NextResponse.json(
          { 
            error: 'Failed to update status. Please try again.',
            details: err.message
          },
          { status: 503 }
        );
      }
    }
    
    if (!ppRes) {
      return NextResponse.json(
        { error: 'Failed to update status after retries' },
        { status: 503 }
      );
    }

    if (!ppRes.ok) {
      const errorData = await ppRes.json().catch(() => null);
      console.error('[PP Information Status] API error:', {
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

    metricsTracker.recordRequest(endpoint, true, Date.now() - startTime);
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
    console.error('[PP Information Status] Unexpected error:', {
      message: err.message,
      stack: err.stack?.split('\n').slice(0, 3),
    });
    metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, { statusCode: 500 });
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred. Please try again.',
        details: err.message 
      },
      { status: 500 }
    );
  }
}
