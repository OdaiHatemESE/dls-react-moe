import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchWithTimeout, FetchTimeoutError } from "@/lib/fetch-with-timeout";
import { idhQueue } from "@/lib/idh-queue";
import { metricsTracker } from "@/lib/metrics-tracker";

export const dynamic = "force-dynamic";

type PPTokenResponse = {
  accessToken?: string;
  error?: string;
};

const TOKEN_TIMEOUT_MS = 8000;
const APPLICATIONS_TIMEOUT_MS = 20000;

function buildTokenUrl(req: Request): string {
  const internalApiBaseUrl = process.env.PUBLIC_URL || process.env.NEXTAUTH_URL || 'http://localhost:4200';
  return `${internalApiBaseUrl}/api/PP/auth/token`;
}

/**
 * GET /api/idh/applications
 * Returns all IDH applications from the Parent Portal API
 * Admin endpoint for viewing all update information requests
 */
export async function GET(req: Request) {
  const startTime = Date.now();
  const endpoint = '/api/idh/applications';

  try {
    // Require authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, { statusCode: 401 });
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get PP token
    const tokenUrl = buildTokenUrl(req);
    let tokenRes: Response;
    let tokenData: PPTokenResponse | null = null;

    try {
      tokenRes = await fetchWithTimeout(tokenUrl, {
        cache: "no-store",
        timeoutMs: TOKEN_TIMEOUT_MS,
      });
      tokenData = (await tokenRes.json().catch(() => null)) as PPTokenResponse | null;
    } catch (error) {
      const status = error instanceof FetchTimeoutError ? 504 : 502;
      const message =
        error instanceof FetchTimeoutError
          ? "Timed out while requesting PP token"
          : "Failed to reach PP token endpoint";
      
      metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, { statusCode: status });
      return NextResponse.json({ ok: false, error: message }, { status });
    }

    if (!tokenRes.ok || !tokenData?.accessToken) {
      metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, { statusCode: 500 });
      return NextResponse.json(
        { ok: false, error: tokenData?.error || "Failed to acquire PP token" },
        { status: 500 }
      );
    }

    // Get PP base URL
    const baseUrl = process.env.PP_BASE_URL;
    if (!baseUrl) {
      metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, { statusCode: 500 });
      return NextResponse.json({ ok: false, error: "PP_BASE_URL not configured" }, { status: 500 });
    }

    // Call PP API to get all applications
    const upstreamUrl = `${baseUrl.replace(/\/$/, "")}/idh/applications`;
    
    console.log('[IDH Applications] Fetching all applications from PP API', {
      url: upstreamUrl,
      sessionUser: session.user?.email || session.user?.name,
    });

    let upstreamRes: Response;
    try {
      upstreamRes = await idhQueue.execute(
        () => fetchWithTimeout(upstreamUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${tokenData.accessToken}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
          timeoutMs: APPLICATIONS_TIMEOUT_MS,
        }),
        { priority: 7 } // Higher priority for admin requests
      );
    } catch (error) {
      const status = error instanceof FetchTimeoutError ? 504 : 502;
      const message =
        error instanceof FetchTimeoutError
          ? "Timed out while fetching applications from PP API"
          : "Failed to reach PP applications endpoint";
      
      console.error('[IDH Applications] Failed to fetch', {
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      });
      
      metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, { statusCode: status });
      return NextResponse.json({ ok: false, error: message }, { status });
    }

    // Parse response
    const rawText = await upstreamRes.text();
    let parsed: unknown = null;
    
    if (rawText) {
      try {
        parsed = JSON.parse(rawText);
      } catch (parseError) {
        console.error('[IDH Applications] Failed to parse PP response', {
          error: parseError instanceof Error ? parseError.message : String(parseError),
          responsePreview: rawText.substring(0, 500),
        });
        
        metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, { statusCode: 500 });
        return NextResponse.json(
          { ok: false, error: "Invalid JSON from PP API" },
          { status: 500 }
        );
      }
    }

    if (!upstreamRes.ok) {
      console.error('[IDH Applications] PP API error response', {
        status: upstreamRes.status,
        statusText: upstreamRes.statusText,
        response: parsed,
      });
      
      metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, { 
        statusCode: upstreamRes.status 
      });
      
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to fetch applications from PP API",
          details: parsed,
        },
        { status: upstreamRes.status }
      );
    }

    // Extract data array from response
    let applications = parsed;
    
    // Handle wrapped response (e.g., { data: [...] })
    if (parsed && typeof parsed === 'object' && 'data' in parsed) {
      applications = (parsed as { data: unknown }).data;
    }
    
    // Ensure we have an array
    if (!Array.isArray(applications)) {
      applications = [];
    }

    console.log('[IDH Applications] Successfully fetched applications', {
      count: applications.length,
      duration: Date.now() - startTime,
    });

    metricsTracker.recordRequest(endpoint, true, Date.now() - startTime);
    
    return NextResponse.json({
      ok: true,
      data: applications,
      count: applications.length,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    
    console.error('[IDH Applications] Unexpected error', {
      error: message,
      duration: Date.now() - startTime,
    });
    
    metricsTracker.recordRequest(endpoint, false, Date.now() - startTime, { statusCode: 500 });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
