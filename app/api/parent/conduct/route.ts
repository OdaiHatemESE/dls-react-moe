import { NextRequest, NextResponse } from "next/server";
import type {
  BasicInfoResponse,
  ParentConductAggregatedResponse,
  SchoolEnrollmentResponse,
  UpdateInfoRow,
} from "@/lib/parent-conduct";

export const dynamic = "force-dynamic";

class UpstreamFetchError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly path: string,
    public readonly upstreamPayload: unknown,
  ) {
    super(message);
    this.name = "UpstreamFetchError";
  }
}

async function fetchJson<T>(
  origin: string,
  path: string,
  cookie: string,
): Promise<T> {
  const res = await fetch(`${origin}${path}`, {
    headers: cookie ? { cookie } : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new UpstreamFetchError(
        `Failed to parse JSON from ${path}: ${text}`,
        res.status,
        path,
        text,
      );
    }
  }

  if (!res.ok) {
    const upstreamError =
      typeof parsed === "object" && parsed !== null && "error" in parsed
        ? (parsed as { error: unknown }).error
        : text || `Status ${res.status}`;
    throw new UpstreamFetchError(
      typeof upstreamError === "string" ? upstreamError : String(upstreamError),
      res.status,
      path,
      parsed,
    );
  }

  return parsed as T;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const studentPersonId = searchParams.get("studentPersonId");
  if (!studentPersonId) {
    return NextResponse.json(
      { ok: false, error: "studentPersonId query parameter is required" },
      { status: 400 },
    );
  }

  const nocache = searchParams.get("nocache");
  const nocacheSuffix = nocache ? `&nocache=${encodeURIComponent(nocache)}` : "";
  const cookie = req.headers.get("cookie") ?? "";
  const origin = req.nextUrl.origin;

  try {
    const [studentInfo, parentInfo, enrollmentInfo, updateInfo] = await Promise.all([
      fetchJson<BasicInfoResponse>(`${origin}`, `/api/oneroster/basic-info-full?sourcedId=${encodeURIComponent(studentPersonId)}${nocacheSuffix}`, cookie).catch((error) => {
        if (error instanceof UpstreamFetchError && error.status === 404) {
          return null;
        }
        throw error;
      }),
      fetchJson<BasicInfoResponse>(`${origin}`, `/api/oneroster/basic-info-full${nocacheSuffix ? `?nocache=${encodeURIComponent(nocache ?? "")}` : ""}`, cookie).catch((error) => {
        if (error instanceof UpstreamFetchError && (error.status === 401 || error.status === 404)) {
          return null;
        }
        throw error;
      }),
      fetchJson<SchoolEnrollmentResponse>(`${origin}`, `/api/oneroster/schoolenrollments?studentId=${encodeURIComponent(studentPersonId)}${nocacheSuffix}`, cookie).catch((error) => {
        if (error instanceof UpstreamFetchError && (error.status === 404 || error.status === 204)) {
          return null;
        }
        throw error;
      }),
      fetchJson<{ ok: boolean; data?: UpdateInfoRow }>(`${origin}`, `/api/parent/update-information-requests?studentPersonId=${encodeURIComponent(studentPersonId)}`, cookie).catch((error) => {
        if (error instanceof UpstreamFetchError && error.status === 404) {
          return null;
        }
        throw error;
      }),
    ]);

    const payload: ParentConductAggregatedResponse = {
      studentInfo,
      parentInfo,
      enrollmentInfo,
      updateInfo,
    };

    return NextResponse.json({
      ok: true,
      data: payload,
      meta: { aggregatedAt: new Date().toISOString() },
    });
  } catch (error) {
    if (error instanceof UpstreamFetchError) {
      console.error("Parent conduct aggregation failed", {
        path: error.path,
        status: error.status,
        upstream: error.upstreamPayload,
      });
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          upstream: { path: error.path, status: error.status },
        },
        { status: error.status >= 400 ? error.status : 500 },
      );
    }

    console.error("Parent conduct aggregation unexpected error", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
