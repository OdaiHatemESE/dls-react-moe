/**
 * Debug endpoint to test PP API connectivity and performance
 * 
 * Usage:
 * GET /api/debug/pp-connection?studentPersonId=SST-1-1-Pers-1234&detailed=true
 * 
 * This endpoint helps diagnose:
 * - Network connectivity to PP API
 * - Token fetch performance
 * - IDH endpoint performance
 * - DNS resolution issues
 * - Timeout problems
 */

import { NextResponse } from "next/server";
import { fetchWithTimeout, FetchTimeoutError } from "@/lib/fetch-with-timeout";
import { idhQueue } from "@/lib/idh-queue";

export const dynamic = "force-dynamic";

interface TimingMetric {
  operation: string;
  duration: number;
  status?: number;
  success: boolean;
  error?: string;
  details?: Record<string, any>;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const studentPersonId = url.searchParams.get("studentPersonId") || "SST-1-1-Pers-TEST";
  const detailed = url.searchParams.get("detailed") === "true";
  
  const timings: TimingMetric[] = [];
  const startTime = Date.now();

  // Check environment variables
  const envCheck = {
    PP_BASE_URL: !!process.env.PP_BASE_URL,
    PP_CLIENT_ID: !!process.env.PP_CLIENT_ID,
    PP_CLIENT_SECRET: !!process.env.PP_CLIENT_SECRET,
    PUBLIC_URL: process.env.PUBLIC_URL || null,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || null,
    NODE_ENV: process.env.NODE_ENV,
  };

  if (!process.env.PP_BASE_URL) {
    return NextResponse.json({
      ok: false,
      error: "PP_BASE_URL not configured",
      envCheck,
    }, { status: 500 });
  }

  const baseUrl = process.env.PP_BASE_URL;
  const internalApiBaseUrl = process.env.PUBLIC_URL || process.env.NEXTAUTH_URL || 'http://localhost:4200';

  // Test 1: Fetch PP Token
  console.log('[PP Debug] Testing token fetch...');
  let accessToken: string | null = null;
  try {
    const tokenStart = Date.now();
    const tokenRes = await fetchWithTimeout(`${internalApiBaseUrl}/api/PP/auth/token`, {
      cache: "no-store",
      timeoutMs: 10000,
    });
    const tokenDuration = Date.now() - tokenStart;

    if (tokenRes.ok) {
      const tokenJson = (await tokenRes.json().catch(() => null)) as { accessToken?: string } | null;
      accessToken = tokenJson?.accessToken || null;
      
      timings.push({
        operation: "PP Token Fetch",
        duration: tokenDuration,
        status: tokenRes.status,
        success: !!accessToken,
        details: detailed ? {
          url: `${internalApiBaseUrl}/api/PP/auth/token`,
          hasToken: !!accessToken,
          tokenLength: accessToken?.length || 0,
        } : undefined,
      });
    } else {
      timings.push({
        operation: "PP Token Fetch",
        duration: tokenDuration,
        status: tokenRes.status,
        success: false,
        error: `HTTP ${tokenRes.status}`,
      });
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    timings.push({
      operation: "PP Token Fetch",
      duration: 0,
      success: false,
      error: err.message,
      details: {
        errorType: err.name,
        isTimeout: error instanceof FetchTimeoutError,
      },
    });
  }

  // Test 2: Fetch IDH Status (if we have token)
  if (accessToken) {
    console.log('[PP Debug] Testing IDH fetch...');
    try {
      const upstreamUrl = `${baseUrl.replace(/\/$/, "")}/idh?sourceId=${encodeURIComponent(studentPersonId)}`;
      
      const idhStart = Date.now();
      const idhRes = await idhQueue.execute(
        () => fetchWithTimeout(upstreamUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
          timeoutMs: 15000,
        }),
        { studentId: studentPersonId }
      );
      const idhDuration = Date.now() - idhStart;

      const responseBody = await idhRes.text();
      
      timings.push({
        operation: "IDH Fetch",
        duration: idhDuration,
        status: idhRes.status,
        success: idhRes.ok,
        details: detailed ? {
          url: upstreamUrl.replace(/sourceId=.+/, 'sourceId=***'),
          bodyLength: responseBody.length,
          bodyPreview: responseBody.substring(0, 200),
        } : undefined,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      timings.push({
        operation: "IDH Fetch",
        duration: 0,
        success: false,
        error: err.message,
        details: {
          errorType: err.name,
          isTimeout: error instanceof FetchTimeoutError,
        },
      });
    }
  } else {
    timings.push({
      operation: "IDH Fetch",
      duration: 0,
      success: false,
      error: "Skipped - no access token",
    });
  }

  // Test 3: Queue metrics
  const queueMetrics = idhQueue.getMetrics();

  const totalDuration = Date.now() - startTime;

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    totalDuration,
    environment: envCheck,
    configuration: {
      PP_BASE_URL: baseUrl,
      internalApiBaseUrl,
      studentPersonId,
    },
    timings,
    queueMetrics,
    summary: {
      allTestsPassed: timings.every(t => t.success),
      slowestOperation: timings.reduce((max, t) => t.duration > max.duration ? t : max, timings[0]),
      totalOperationTime: timings.reduce((sum, t) => sum + t.duration, 0),
    },
  });
}
