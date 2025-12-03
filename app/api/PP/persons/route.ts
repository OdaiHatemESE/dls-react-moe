import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

export const dynamic = 'force-dynamic';

/**
 * GET /api/PP/oneroster/persons?eid=<EID>
 * 
 * Proxies request to PP backend OneRoster persons endpoint
 * PP_BASE_URL/Oneroster/persons?eid=<EID>
 */
export async function GET(req: NextRequest) {
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
    
    const tokenRes = await fetchWithTimeout(tokenUrl, {
      cache: 'no-store',
      timeoutMs: 8000,
    });

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

    // Call PP backend OneRoster persons endpoint
    const ppUrl = `${ppBaseUrl.replace(/\/$/, '')}/Oneroster/persons?emirateId=${encodeURIComponent(eid)}`;
    console.log('[PP OneRoster Persons] Fetching from PP URL:', ppUrl);
    
    const ppRes = await fetchWithTimeout(ppUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      timeoutMs: 30000, // Increased to 30 seconds
    });

    if (!ppRes.ok) {
      const errorText = await ppRes.text();
      return NextResponse.json(
        { error: `PP API returned ${ppRes.status}`, details: errorText },
        { status: ppRes.status }
      );
    }

    const data = await ppRes.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[PP OneRoster Persons] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
