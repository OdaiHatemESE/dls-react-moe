import { NextResponse } from 'next/server';
import { cacheGetJSON, cacheSetJSON } from '@/lib/cache';

type PPLoginResponse = {
  accessToken?: string;
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
      return NextResponse.json({ accessToken: cached.token });
    }

    const username = process.env.PP_USERNAME;
    const password = process.env.PP_PASSWORD;
    const base = process.env.PP_BASE_URL;

    if (!base || !username || !password) {
      return NextResponse.json({ error: 'Missing PP_BASE_URL or credentials in env' }, { status: 500 });
    }

    const upstreamUrl = `${base.replace(/\/$/, '')}/auth/login`;

    const res = await fetch(upstreamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = (await res.json().catch(() => null)) as PPLoginResponse | null;

    if (!res.ok) {
      return NextResponse.json({ error: data ?? `Upstream returned ${res.status}` }, { status: res.status });
    }

    const accessToken = data?.accessToken ?? data?.token ?? data?.access_token ?? data;

    if (!accessToken) {
      return NextResponse.json({ error: 'No access token in response' }, { status: 500 });
    }

    // Cache token with 50-minute TTL (similar to OneRoster pattern)
    const exp = now + 50 * 60;
    await cacheSetJSON(PP_CACHE_KEY, { token: accessToken, exp }, { ttlSeconds: 50 * 60 });

    return NextResponse.json({ accessToken });
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
