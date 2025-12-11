import { NextResponse } from 'next/server';
import { cacheGetJSON, cacheSetJSON } from '@/lib/cache';
import { fetchWithTimeout, FetchTimeoutError } from '@/lib/fetch-with-timeout';
import { metricsTracker } from '@/lib/metrics-tracker';

type PPLoginResponse = {
  accessToken?: string;
  tokenType?: string;
  expiresIn?: number;
  scope?: string;
  refreshToken?: string | null;
  [key: string]: any;
};

type PPTokenCache = {
  token: string;
  exp: number;
};

const PP_CACHE_KEY = 'pp:auth:token';

export async function GET() {
  const startTime = Date.now();
  const endpoint = '/api/PP/auth/token';
  
  try {
    const now = Math.floor(Date.now() / 1000);
    
    // Check cache first
    const cached = await cacheGetJSON<PPTokenCache>(PP_CACHE_KEY);
    if (cached && cached.exp - 30 > now) {
      // Ensure we return a string, not an object
      const tokenString = typeof cached.token === 'string' ? cached.token : String(cached.token);
      metricsTracker.recordRequest(endpoint, true, Date.now() - startTime);
      return NextResponse.json({ accessToken: tokenString });
    }

    const clientId = process.env.PP_CLIENT_ID;
    const clientSecret = process.env.PP_CLIENT_SECRET;
    const base = process.env.PP_BASE_URL;

    if (!base || !clientId || !clientSecret) {
      return NextResponse.json({ error: 'Missing PP_BASE_URL, PP_CLIENT_ID, or PP_CLIENT_SECRET in env' }, { status: 500 });
    }

    const upstreamUrl = `${base.replace(/\/$/, '')}/auth/login`;
    
    const res = await fetchWithTimeout(upstreamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret }),
      timeoutMs: 10000,
    });

    const data = (await res.json().catch(() => null)) as PPLoginResponse | null;
    
    if (!res.ok) {
      console.error('[PP Auth] Login failed:', {
        status: res.status,
        statusText: res.statusText,
        url: upstreamUrl,
        response: data,
      });
      return NextResponse.json({ 
        error: data ?? `Upstream returned ${res.status}`,
        details: {
          url: upstreamUrl,
          status: res.status,
          statusText: res.statusText,
        }
      }, { status: res.status });
    }
    
    // Extract access token from response
    const accessToken = data?.accessToken;

    if (!accessToken || typeof accessToken !== 'string') {
      console.error('[PP Auth] No valid token in response:', data);
      return NextResponse.json({ error: 'No access token in response', received: data }, { status: 500 });
    }

    // Use expiresIn from response, or default to 50 minutes
    const expiresIn = data?.expiresIn || 3000; // default to 50 minutes (3000 seconds)
    const exp = now + expiresIn;
    
    // Cache token with TTL based on expiresIn
    await cacheSetJSON(PP_CACHE_KEY, { token: accessToken, exp }, { ttlSeconds: expiresIn });

    // Return just the token string, not the entire response object
    metricsTracker.recordRequest(endpoint, true, Date.now() - startTime);
    return NextResponse.json({ accessToken });
  } catch (err: any) {
    const status = err instanceof FetchTimeoutError ? 504 : 500;
    metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, { 
      statusCode: status,
      timeout: err instanceof FetchTimeoutError 
    });
    return NextResponse.json({ error: String(err) }, { status });
  }
}
