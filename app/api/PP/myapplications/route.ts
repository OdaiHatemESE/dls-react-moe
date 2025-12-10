import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

export const dynamic = 'force-dynamic';

/**
 * POST /api/PP/myapplications
 * 
 * Accepts array of student source IDs and returns their application data
 * Request body: { "sourceIds": ["SST-1-1-Pers-28503", "SST-1-1-Pers-28535"] }
 * 
 * Proxies request to PP backend applications endpoint
 * PP_BASE_URL/Idh/applications
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sourceIds } = body;

    if (!sourceIds || !Array.isArray(sourceIds) || sourceIds.length === 0) {
      return NextResponse.json(
        { error: 'sourceIds array is required and must not be empty' },
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

    // Call PP backend applications endpoint
    const ppUrl = `${ppBaseUrl.replace(/\/$/, '')}/Idh/applications`;
    console.log('[PP My Applications] Posting to PP URL:', ppUrl);
    console.log('[PP My Applications] Request payload:', { sourceIds });
    
    const ppRes = await fetchWithTimeout(ppUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sourceIds }),
      cache: 'no-store',
      timeoutMs: 30000, // 30 seconds
    });

    if (!ppRes.ok) {
      const errorText = await ppRes.text();
      console.error('[PP My Applications] PP API error:', {
        status: ppRes.status,
        statusText: ppRes.statusText,
        error: errorText,
      });
      return NextResponse.json(
        { error: `PP API returned ${ppRes.status}`, details: errorText },
        { status: ppRes.status }
      );
    }

    const data = await ppRes.json();
    console.log('[PP My Applications] Success, returned', data?.data?.length || 0, 'applications');
    return NextResponse.json(data);
  } catch (error) {
    console.error('[PP My Applications] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
