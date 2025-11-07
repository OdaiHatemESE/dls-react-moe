import { NextRequest, NextResponse } from "next/server";
import type {
  ParentConductAggregatedResponse,
} from "@/lib/parent-conduct";
import type { StudentProfileV1 } from "@/app/types/studentprofile";

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
  const schoolYear = searchParams.get("schoolYear");
  
  // Build query string for student API
  const queryParams = new URLSearchParams();
  if (nocache) queryParams.set("nocache", nocache);
  if (schoolYear) queryParams.set("schoolYear", schoolYear);
  const querySuffix = queryParams.toString() ? `?${queryParams.toString()}` : "";
  console.log('Query suffix for student API:', schoolYear, nocache, querySuffix);
   
  const cookie = req.headers.get("cookie") ?? "";
  const origin = req.nextUrl.origin;

  try {
    // Fetch student info from PP API instead of OneRoster
    const studentInfo = await fetchJson<StudentProfileV1>(`${origin}`, `/api/PP/student/${encodeURIComponent(studentPersonId)}${querySuffix}`, cookie).catch((error) => {
      if (error instanceof UpstreamFetchError && error.status === 404) {
        return null;
      }
      throw error;
    });

    // Extract parent info from student data
    const parentInfo = studentInfo?.parent ?? null;

    // Extract schoolId from student's enrollment data
    let schoolInfo = null;
    
    if (studentInfo && studentInfo.enrollment && studentInfo.enrollment.length > 0) {
      // Get the most recent enrollment (you can adjust this logic if needed)
      console.clear();
      console.log('Student enrollments:', studentInfo.enrollment);
      const latestEnrollment = studentInfo.enrollment[0];
      const schoolId = latestEnrollment.schoolId;
      
      if (schoolId) {
        // Fetch school information
        console.clear();
        console.log('Fetching school info for schoolId:', schoolId);
        schoolInfo = await fetchJson<unknown>(`${origin}`, `/api/PP/school/${encodeURIComponent(schoolId)}`, cookie).catch((error) => {
          console.warn(`Failed to fetch school info for schoolId ${schoolId}:`, error);
          return null;
        });
      }
    }

    const payload: ParentConductAggregatedResponse = {
      studentInfo,
      parentInfo,
      schoolInfo,
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
