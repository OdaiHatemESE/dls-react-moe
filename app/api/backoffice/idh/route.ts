import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { IDHStudent } from '@/app/types/idh';
import { authorizeStudentAccess } from '@/lib/student-authorization';
import { fetchWithTimeout, FetchTimeoutError } from '@/lib/fetch-with-timeout';
import { idhQueue } from '@/lib/idh-queue';
import { metricsTracker } from '@/lib/metrics-tracker';

type PPTokenResponse = {
  accessToken?: string;
  error?: string;
};

// Timeout configuration
const TOKEN_TIMEOUT_MS = 8000;  // 8 seconds for token fetch
const IDH_TIMEOUT_MS = 12000;   // 12 seconds for IDH GET requests
const IDH_POST_TIMEOUT_MS = 15000; // 15 seconds for IDH POST (writes are slower)

export const dynamic = 'force-dynamic';

async function requireSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions);
  return session;
}

function buildTokenUrl(req: Request): string {
  const origin = new URL(req.url).origin;
  const internalApiBaseUrl = process.env.PUBLIC_URL || process.env.NEXTAUTH_URL || 'http://localhost:4200';
  return `${internalApiBaseUrl}/api/PP/auth/token`;
}

/**
 * GET /api/backoffice/idh?sourceId=xxx
 * Fetches IDH student data by sourceId (student person ID)
 */
export async function GET(req: Request) {
  const startTime = Date.now();
  const endpoint = '/api/backoffice/idh';
  
  try {
    const session = await requireSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sourceId = searchParams.get('sourceId');

    if (!sourceId) {
      return NextResponse.json({ error: 'sourceId query parameter is required' }, { status: 400 });
    }

    // Get PP token from our token endpoint with timeout
    const tokenUrl = buildTokenUrl(req);
    const tokenRes = await fetchWithTimeout(tokenUrl, {
      timeoutMs: TOKEN_TIMEOUT_MS,
    });
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

    // Fetch IDH data for the student using query parameter with queue and timeout
    const idhUrl = `${baseUrl.replace(/\/$/, '')}/idh?sourceId=${encodeURIComponent(sourceId)}`;
    const idhRes = await idhQueue.execute(
      () => fetchWithTimeout(idhUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        timeoutMs: IDH_TIMEOUT_MS,
      }),
      { studentId: sourceId }
    );

    if (!idhRes.ok) {
      // If 404, return empty data (no IDH record exists yet)
      if (idhRes.status === 404) {
        return NextResponse.json({
          ok: true,
          data: null,
          meta: {
            sourceId,
            fetchedAt: new Date().toISOString(),
          },
        });
      }

      const errorData = await idhRes.json().catch(() => null);
      return NextResponse.json(
        { error: errorData ?? `Upstream returned ${idhRes.status}` },
        { status: idhRes.status }
      );
    }

    // Normalize upstream to our IDHStudent shape (upstream often uses PascalCase)
    const raw: unknown = await idhRes.json();

    // Some PP endpoints wrap payloads as { ok, data } or { Data }, sometimes arrays
    const unwrap = (input: unknown): unknown => {
      if (input && typeof input === 'object') {
        const obj = input as Record<string, unknown>;
        const inner = obj['data'] ?? obj['Data'];
        if (Array.isArray(inner)) return inner[0] ?? {};
        if (inner && typeof inner === 'object') return inner;
      }
      return input;
    };

    const normalize = (input: unknown): IDHStudent => {
      const obj = (input ?? {}) as Record<string, unknown>;
      const getStr = (keys: string[]): string => {
        for (const k of keys) {
          const v = obj[k];
          if (typeof v === 'string') return v;
          if (typeof v === 'number' && Number.isFinite(v)) return String(v);
        }
        return '';
      };
      const getNum = (keys: string[]): number => {
        for (const k of keys) {
          const v = obj[k];
          if (typeof v === 'number' && Number.isFinite(v)) return v;
          if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
        }
        return 0;
      };

      return {
        studentNumber: getStr(['studentNumber', 'StudentNumber']),
        schoolId: getStr(['schoolId', 'School_ID', 'SchoolId']),
        sourceId: getStr(['sourceId', 'Source_ID', 'SourceId']),
        primaryPhone: getStr(['primaryPhone', 'PrimaryPhone']),
        otherPhone: getStr(['otherPhone', 'OtherPhone']),
        transportationType: getStr(['transportationType', 'TransportationType']),
        emirate: getStr(['emirate', 'Emirate']),
        area: getStr(['area', 'Area']),
        street: getStr(['street', 'Street']),
        houseBuilding: getStr(['houseBuilding', 'HouseBuilding']),
        region: getStr(['region', 'Region']),
        zone: getStr(['zone', 'Zone']),
        plot: getStr(['plot', 'Plot']),
        mainPlot: getStr(['mainPlot', 'MainPlot']),
        premises: getStr(['premises', 'Premises']),
        latitude: getStr(['latitude', 'Latitude']),
        longitude: getStr(['longitude', 'Longitude']),
        attachment01: getStr(['attachment01', 'Attachment01']),
        statusId: getNum(['statusId', 'status_ID', 'Status_ID', 'StatusId']),
        datetime: getStr(['datetime', 'Datetime']),
        ReturnComment: getStr(['ReturnComment', 'returnComment']) || undefined,
        stateID: getStr(['stateID', 'StateID', 'stateId']) || undefined,
        cityID: getStr(['cityID', 'CityID', 'cityId']) || undefined,
        regionID: getStr(['regionID', 'RegionID', 'regionId']) || undefined,
        sectorID: getStr(['sectorID', 'SectorID', 'sectorId']) || undefined,
      };
    };

    const unwrapped = unwrap(raw);
    const idhData: IDHStudent = normalize(unwrapped);

    const response = NextResponse.json({
      ok: true,
      data: idhData,
      meta: {
        sourceId,
        fetchedAt: new Date().toISOString(),
      },
    });
    
    // Track successful request
    metricsTracker.recordRequest(endpoint, true, Date.now() - startTime);
    return response;
  } catch (err: unknown) {
    console.error('Error fetching IDH data:', err);
    
    // Track failed request with error details
    const isTimeout = err instanceof FetchTimeoutError;
    metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, {
      timeout: isTimeout,
      statusCode: isTimeout ? 504 : 500,
    });
    
    // Handle timeout errors specifically
    if (err instanceof FetchTimeoutError) {
      return NextResponse.json(
        { ok: false, error: 'Request timed out. Please try again.' },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { ok: false, error: (typeof err === 'object' && err && 'message' in err) ? String((err as any).message) : String(err) },
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
  const startTime = Date.now();
  const endpoint = '/api/backoffice/idh [POST]';
  
  try {
    const session = await requireSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: IDHStudent = await req.json();

    if (!body.sourceId) {
      return NextResponse.json(
        { error: 'sourceId is required in request body' },
        { status: 400 }
      );
    }

    // Get parent's Emirates ID from session
    const parentEid = session?.user?.emiratesId;
    if (!parentEid) {
      return NextResponse.json(
        { error: 'Parent Emirates ID not found in session' },
        { status: 401 }
      );
    }

    // Get PP token first for authorization check with timeout
    const tokenUrl = buildTokenUrl(req);
    const tokenRes = await fetchWithTimeout(tokenUrl, {
      timeoutMs: TOKEN_TIMEOUT_MS,
    });
    const tokenData: PPTokenResponse = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.accessToken) {
      return NextResponse.json(
        { error: tokenData.error || 'Failed to get PP access token' },
        { status: 500 }
      );
    }

    // Authorize: Check student ownership and active enrollment
    const authResult = await authorizeStudentAccess(
      body.sourceId,
      parentEid,
      tokenData.accessToken
    );

    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error.message },
        { status: authResult.error.status }
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

    // Use token from authorization check
    const accessToken = tokenData.accessToken;
    const baseUrl = process.env.PP_BASE_URL;

    if (!baseUrl) {
      return NextResponse.json({ error: 'PP_BASE_URL not configured' }, { status: 500 });
    }

    // Insert/update IDH data with queue, timeout, and retry
    const idhUrl = `${baseUrl.replace(/\/$/, '')}/idh`;
    const MAX_RETRIES = 1;
    
    let idhRes: Response | null = null;
    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        idhRes = await idhQueue.execute(
          () => fetchWithTimeout(idhUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            cache: 'no-store',
            timeoutMs: IDH_POST_TIMEOUT_MS,
          }),
          { studentId: body.sourceId, priority: 7 } // Higher priority for writes
        );
        break; // Success, exit retry loop
      } catch (error) {
        if (attempt < MAX_RETRIES + 1 && error instanceof FetchTimeoutError) {
          // Retry on timeout with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        throw error; // Give up, let outer catch handle it
      }
    }
    
    if (!idhRes) {
      throw new Error('IDH request failed after retries');
    }

    if (!idhRes.ok) {
      const errorData = await idhRes.json().catch(() => null);
      return NextResponse.json(
        { error: errorData ?? `Upstream returned ${idhRes.status}` },
        { status: idhRes.status }
      );
    }

    const responseData = await idhRes.json();

    const response = NextResponse.json({
      ok: true,
      data: responseData,
      meta: {
        sourceId: body.sourceId,
        insertedAt: new Date().toISOString(),
      },
    });
    
    // Track successful request
    metricsTracker.recordRequest(endpoint, true, Date.now() - startTime);
    return response;
  } catch (err: unknown) {
    console.error('Error inserting IDH data:', err);
    
    // Track failed request with error details
    const isTimeout = err instanceof FetchTimeoutError;
    metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, {
      timeout: isTimeout,
      statusCode: isTimeout ? 504 : 500,
    });
    
    // Handle timeout errors specifically
    if (err instanceof FetchTimeoutError) {
      return NextResponse.json(
        { ok: false, error: 'Request timed out. Please try again.' },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { ok: false, error: (typeof err === 'object' && err && 'message' in err) ? String((err as any).message) : String(err) },
      { status: 500 }
    );
  }
}
