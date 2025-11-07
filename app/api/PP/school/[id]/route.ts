import { NextResponse } from 'next/server';
import { cacheGetJSON, cacheSetJSON } from '@/lib/cache';

type PPTokenResponse = {
  accessToken?: string;
  error?: string;
};

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
    const tokenUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:4200'}/api/PP/auth/token`;
    const tokenRes = await fetch(tokenUrl);
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

    // Validate token is a string
    if (typeof accessToken !== 'string' || !accessToken) {
      console.error('[PP School] Invalid token type:', typeof accessToken);
      return NextResponse.json({ 
        error: 'Invalid token format received from auth endpoint',
        tokenType: typeof accessToken 
      }, { status: 500 });
    }



    // Fetch school data using the PP token
    const schoolUrl = `${baseUrl.replace(/\/$/, '')}/oneroster/schools/${encodeURIComponent(schoolId)}`;
    const schoolRes = await fetch(schoolUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!schoolRes.ok) {
      const errorData = await schoolRes.json().catch(() => null);
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
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
