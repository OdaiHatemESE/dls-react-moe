import { NextResponse } from 'next/server';

type PPLoginResponse = {
  accessToken?: string;
  token?: string;
  access_token?: string;
  [key: string]: any;
};

export async function GET() {
  try {
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

    return NextResponse.json({ accessToken });
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
