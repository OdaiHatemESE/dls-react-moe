import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout, FetchTimeoutError } from '@/lib/fetch-with-timeout';
import { ppApiCircuitBreaker, CircuitBreakerError } from '@/lib/circuit-breaker';
import { metricsTracker } from '@/lib/metrics-tracker';

export const dynamic = 'force-dynamic';

const TOKEN_TIMEOUT_MS = 8000;
const PERSONS_TIMEOUT_MS = 30000; // 30 seconds for persons lookup
const MAX_RETRIES = 1; // Retry once on timeout

/**
 * GET /api/PP/oneroster/persons?eid=<EID>
 * 
 * Proxies request to PP backend OneRoster persons endpoint
 * PP_BASE_URL/Oneroster/persons?eid=<EID>
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const endpoint = '/api/PP/persons';
  
  try {
    const { searchParams } = new URL(req.url);
    const eid = searchParams.get('eid');

    if (!eid || !eid.trim()) {
      return NextResponse.json(
        { error: 'EID parameter is required' },
        { status: 400 }
      );
    }

    const ppBaseUrl = process.env.PP_BASE_URL;
    if (!ppBaseUrl) {
      return NextResponse.json(
        { error: 'PP_BASE_URL not configured' },
        { status: 500 }
      );
    }

    // Get PP API token
    const internalApiBaseUrl = process.env.PUBLIC_URL || process.env.NEXTAUTH_URL || 'http://localhost:4200';
    const tokenUrl = `${internalApiBaseUrl}/api/PP/auth/token`;
    
    let tokenRes: Response;
    try {
      tokenRes = await fetchWithTimeout(tokenUrl, {
        cache: 'no-store',
        timeoutMs: TOKEN_TIMEOUT_MS,
      });
    } catch (error) {
      const status = error instanceof FetchTimeoutError ? 504 : 502;
      const message =
        error instanceof FetchTimeoutError
          ? 'Timed out while requesting PP token'
          : 'Failed to reach PP token endpoint';
      console.error('[PP OneRoster Persons] Token fetch error:', { eid, error: message });
      return NextResponse.json({ error: message }, { status });
    }

    if (!tokenRes.ok) {
      return NextResponse.json(
        { error: 'Failed to obtain PP authentication token' },
        { status: 502 }
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.accessToken;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token received from PP' },
        { status: 502 }
      );
    }

    // Call PP backend OneRoster persons endpoint with circuit breaker and retry
    const ppUrl = `${ppBaseUrl.replace(/\/$/, '')}/Oneroster/persons?emirateId=${encodeURIComponent(eid)}`;
    console.log('[PP OneRoster Persons] Fetching from PP URL:', ppUrl);
    
    let ppRes: Response | null = null;
    try {
      ppRes = await ppApiCircuitBreaker.execute(async () => {
        for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
          try {
            const res = await fetchWithTimeout(ppUrl, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              cache: 'no-store',
              timeoutMs: PERSONS_TIMEOUT_MS,
            });
            return res;
          } catch (error) {
            if (attempt < MAX_RETRIES + 1 && error instanceof FetchTimeoutError) {
              console.log(`[PP OneRoster Persons] Retry ${attempt}/${MAX_RETRIES} after timeout for EID ${eid}`);
              await new Promise(resolve => setTimeout(resolve, 500 * attempt));
              continue;
            }
            throw error;
          }
        }
        throw new Error('Failed after retries');
      });
    } catch (error) {
      if (error instanceof CircuitBreakerError) {
        console.error('[PP OneRoster Persons] Circuit breaker open:', {
          eid,
          state: error.stats.state,
        });
        return NextResponse.json(
          { error: 'Persons service temporarily unavailable. Please try again shortly.' },
          { status: 503 }
        );
      }
      const status = error instanceof FetchTimeoutError ? 504 : 502;
      const message =
        error instanceof FetchTimeoutError
          ? 'Timed out while fetching persons data'
          : 'Failed to reach PP persons endpoint';
      console.error('[PP OneRoster Persons] Persons fetch error:', { eid, error: message });
      return NextResponse.json({ error: message }, { status });
    }
    
    if (!ppRes) {
      return NextResponse.json(
        { error: 'Failed to fetch persons data' },
        { status: 502 }
      );
    }

    if (!ppRes.ok) {
      const errorText = await ppRes.text();
      return NextResponse.json(
        { error: `PP API returned ${ppRes.status}`, details: errorText },
        { status: ppRes.status }
      );
    }

    const data = await ppRes.json();
    metricsTracker.recordRequest(endpoint, true, Date.now() - startTime);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[PP OneRoster Persons] Error:', error);
    metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, { statusCode: 500 });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
