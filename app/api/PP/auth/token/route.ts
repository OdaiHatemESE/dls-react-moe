import { NextResponse } from 'next/server';
import { cacheGetJSON, cacheSetJSON } from '@/lib/cache';

type PPLoginResponse = {
  accessToken?: string;
  AccessToken?: string;  // PP API returns capital A
  token?: string;
  access_token?: string;
  [key: string]: any;
};

type PPTokenCache = {
  token: string;
  exp: number;
};

const PP_CACHE_KEY = 'pp:auth:token';

export async function GET() {
  try {
    const now = Math.floor(Date.now() / 1000);
    
    // Check cache first
    const cached = await cacheGetJSON<PPTokenCache>(PP_CACHE_KEY);
    if (cached && cached.exp - 30 > now) {
      console.log('[PP Auth] Returning cached token, type:', typeof cached.token);
      // Ensure we return a string, not an object
      const tokenString = typeof cached.token === 'string' ? cached.token : String(cached.token);
      return NextResponse.json({ accessToken: tokenString });
    }

    const username = process.env.PP_USERNAME;
    const password = process.env.PP_PASSWORD;
    const base = process.env.PP_BASE_URL;

    if (!base || !username || !password) {
      return NextResponse.json({ error: 'Missing PP_BASE_URL or credentials in env' }, { status: 500 });
    }

    const upstreamUrl = `${base.replace(/\/$/, '')}/auth/login`;

    console.log('[PP Auth] Attempting login to:', upstreamUrl);
    console.log('[PP Auth] Using username:', username);
    
    const res = await fetch(upstreamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = (await res.json().catch(() => null)) as PPLoginResponse | null;
    
    if (!res.ok) {
      console.error('[PP Auth] Login failed:', {
        status: res.status,
        statusText: res.statusText,
        url: upstreamUrl,
        username,
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
    
    console.log('[PP Auth] Login successful, token received');
    console.log('[PP Auth] Response data:', JSON.stringify(data).substring(0, 200));

    // PP API returns AccessToken (capital A), also check other common formats
    const accessToken = data?.AccessToken ?? data?.accessToken ?? data?.token ?? data?.access_token;

    console.log('[PP Auth] Extracted token type:', typeof accessToken);
    console.log('[PP Auth] Token preview:', typeof accessToken === 'string' ? accessToken.substring(0, 30) : JSON.stringify(accessToken));

    if (!accessToken || typeof accessToken !== 'string') {
      console.error('[PP Auth] No valid token in response:', data);
      return NextResponse.json({ error: 'No access token in response', received: data }, { status: 500 });
    }

    // Cache token with 50-minute TTL (similar to OneRoster pattern)
    const exp = now + 50 * 60;
    console.log('[PP Auth] Caching token, type before cache:', typeof accessToken);
    await cacheSetJSON(PP_CACHE_KEY, { token: accessToken, exp }, { ttlSeconds: 50 * 60 });

    // Return just the token string, not the entire response object
    console.log('[PP Auth] Returning fresh token, type:', typeof accessToken);
    return NextResponse.json({ accessToken });
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
