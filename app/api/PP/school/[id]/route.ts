import { NextResponse } from 'next/server';
import { cacheGetJSON, cacheSetJSON } from '@/lib/cache';
import { fetchWithTimeout, FetchTimeoutError } from '@/lib/fetch-with-timeout';
import { ppApiCircuitBreaker, CircuitBreakerError } from '@/lib/circuit-breaker';

type PPTokenResponse = {
  accessToken?: string;
  error?: string;
};

const TOKEN_TIMEOUT_MS = 8000;
const SCHOOL_TIMEOUT_MS = 10000;
const MAX_RETRIES = 1; // Retry once on timeout

type SchoolAddress = {
  country: string;
  zipCode: string;
  city: string;
  isVerified: boolean;
  latitude: string;
  poBox: string;
  roadNumber: string;
  plotId: string;
  addressLine1: string;
  plotNumber: string;
  addressLine2: string;
  addressLine3: string;
  state: string;
  region: string;
  sector: string;
  longitude: string;
};

type SchoolContact = {
  note: string;
  contactType: string;
  isPrivate: boolean;
  value: string;
};

type SchoolMetadata = {
  shortName: string;
  contacts: SchoolContact[];
  addresses: SchoolAddress[];
  englishName: string;
};

type SchoolResponse = {
  sourcedId: string;
  identifier: string;
  metadata: SchoolMetadata;
  name: string;
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: schoolId } = await params;

    if (!schoolId) {
      return NextResponse.json({ error: 'School ID is required' }, { status: 400 });
    }

    // Check if nocache parameter is present
    const url = new URL(req.url);
    const nocache = url.searchParams.get('nocache');
    const skipCache = nocache === '1' || nocache === 'true';

    const cacheKey = `pp:school:${schoolId}`;
    
    type Wrapped<T> = { data: T; fetchedAt: string };
    
    // Check cache first (unless nocache is requested)
    if (!skipCache) {
      const cachedAny = await cacheGetJSON<unknown>(cacheKey);
      if (cachedAny) {
        // Check if it's the new wrapped format with metadata
        if (
          typeof cachedAny === "object" && cachedAny !== null &&
          "data" in cachedAny && "fetchedAt" in cachedAny
        ) {
          const wrapped = cachedAny as Wrapped<SchoolResponse>;
          return NextResponse.json({
            ...wrapped.data,
            meta: {
              cache: {
                source: "cache",
                lastUpdated: wrapped.fetchedAt ?? null,
              },
            },
          });
        }
        // Backwards compatibility: old cache format without wrapper
        return NextResponse.json({
          ...(cachedAny as SchoolResponse),
          meta: {
            cache: {
              source: "cache",
              lastUpdated: null,
            },
          },
        });
      }
    }

    // Get PP token from our token endpoint
    const internalApiBaseUrl = process.env.PUBLIC_URL || process.env.NEXTAUTH_URL || 'http://localhost:4200';
    const tokenUrl = `${internalApiBaseUrl}/api/PP/auth/token`;
    
    let tokenRes: Response;
    let tokenData: PPTokenResponse | null = null;

    try {
      tokenRes = await fetchWithTimeout(tokenUrl, {
        cache: 'no-store',
        timeoutMs: TOKEN_TIMEOUT_MS,
      });
      tokenData = (await tokenRes.json().catch(() => null)) as PPTokenResponse | null;
    } catch (error) {
      const status = error instanceof FetchTimeoutError ? 504 : 502;
      const message =
        error instanceof FetchTimeoutError
          ? 'Timed out while requesting PP token'
          : 'Failed to reach PP token endpoint';
      console.error('[PP School] Token fetch error:', { schoolId, error: message });
      return NextResponse.json({ error: message }, { status });
    }
    if (!tokenRes.ok || !tokenData?.accessToken) {
      console.error('[PP School] Token request failed:', { 
        schoolId, 
        status: tokenRes.status,
        error: tokenData?.error 
      });
      return NextResponse.json(
        { error: tokenData?.error || 'Failed to get PP access token' },
        { status: 500 }
      );
    }

    const accessToken = tokenData.accessToken;
    const baseUrl = process.env.PP_BASE_URL;

    if (!baseUrl) {
      return NextResponse.json({ error: 'PP_BASE_URL not configured' }, { status: 500 });
    }

    // Validate token is a string
    if (typeof accessToken !== 'string' || !accessToken) {
      console.error('[PP School] Invalid token type:', { 
        schoolId,
        tokenType: typeof accessToken 
      });
      return NextResponse.json({ 
        error: 'Invalid token format received from auth endpoint',
        tokenType: typeof accessToken 
      }, { status: 500 });
    }

    // Fetch school data using the PP token with circuit breaker and retry
    const schoolUrl = `${baseUrl.replace(/\/$/, '')}/oneroster/schools/${encodeURIComponent(schoolId)}`;
    
    let schoolRes: Response | null = null;
    try {
      schoolRes = await ppApiCircuitBreaker.execute(async () => {
        for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
          try {
            const res = await fetchWithTimeout(schoolUrl, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              cache: 'no-store',
              timeoutMs: SCHOOL_TIMEOUT_MS,
            });
            return res;
          } catch (error) {
            if (attempt < MAX_RETRIES + 1 && error instanceof FetchTimeoutError) {
              console.log(`[PP School] Retry ${attempt}/${MAX_RETRIES} after timeout for ${schoolId}`);
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
        console.error('[PP School] Circuit breaker open:', {
          schoolId,
          state: error.stats.state,
        });
        return NextResponse.json(
          { error: 'School service temporarily unavailable. Please try again shortly.' },
          { status: 503 }
        );
      }
      const status = error instanceof FetchTimeoutError ? 504 : 502;
      const message =
        error instanceof FetchTimeoutError
          ? 'Timed out while fetching school data'
          : 'Failed to reach PP school endpoint';
      console.error('[PP School] School fetch error:', { schoolId, error: message });
      return NextResponse.json({ error: message }, { status });
    }
    
    if (!schoolRes) {
      return NextResponse.json(
        { error: 'Failed to fetch school data' },
        { status: 502 }
      );
    }

    if (!schoolRes.ok) {
      const errorData = await schoolRes.json().catch(() => null);
      console.error('[PP School] School data fetch failed:', {
        schoolId,
        status: schoolRes.status,
        error: errorData,
      });
      return NextResponse.json(
        { error: errorData ?? `Upstream returned ${schoolRes.status}` },
        { status: schoolRes.status }
      );
    }

    const school: SchoolResponse = await schoolRes.json();

    // Cache the school data for 1 hour (schools don't change frequently)
    const fetchedAt = new Date().toISOString();
    await cacheSetJSON<Wrapped<SchoolResponse>>(
      cacheKey,
      { data: school, fetchedAt },
      { ttlSeconds: 3600 }
    );

    return NextResponse.json({
      ...school,
      meta: {
        cache: {
          source: "upstream",
          lastUpdated: fetchedAt,
        },
      },
    });
  } catch (err: any) {
    console.error('[PP School] Unexpected error:', { schoolId: (await params).id, error: String(err) });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
