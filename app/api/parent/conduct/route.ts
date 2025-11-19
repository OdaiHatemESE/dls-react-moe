import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildInternalApiUrl } from "@/lib/internal-api-url";
import type {
  ParentConductAggregatedResponse,
} from "@/lib/parent-conduct";
import type { StudentProfileV1 } from "@/app/types/studentprofile";
import { authorizeStudentOwnership } from "@/lib/student-authorization";

export const dynamic = "force-dynamic";

type PPTokenResponse = {
  accessToken?: string;
  error?: string;
};

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

  // Get session and validate parent
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const parentEid = session?.user?.emiratesId;
  if (!parentEid) {
    return NextResponse.json(
      { ok: false, error: "Parent Emirates ID not found in session" },
      { status: 401 },
    );
  }

  // Get PP token for authorization
  const origin = req.nextUrl.origin;
  const tokenUrl = buildInternalApiUrl(origin, '/api/PP/auth/token');
  const tokenRes = await fetch(tokenUrl);
  const tokenData: PPTokenResponse = await tokenRes.json();

  if (!tokenRes.ok || !tokenData.accessToken) {
    return NextResponse.json(
      { ok: false, error: tokenData.error || 'Failed to get PP access token' },
      { status: 500 },
    );
  }

  // Authorize: Check student ownership (read-only, so just ownership not active enrollment)
  const authResult = await authorizeStudentOwnership(
    studentPersonId,
    parentEid,
    tokenData.accessToken
  );

  if (!authResult.authorized) {
    return NextResponse.json(
      { ok: false, error: authResult.error.message },
      { status: authResult.error.status },
    );
  }

  const nocache = searchParams.get("nocache");
  const schoolYear = searchParams.get("schoolYear");
  
  // Build query string for student API
  const queryParams = new URLSearchParams();
  if (nocache) queryParams.set("nocache", nocache);
  if (schoolYear) queryParams.set("schoolYear", schoolYear);
  const querySuffix = queryParams.toString() ? `?${queryParams.toString()}` : "";
   
  const cookie = req.headers.get("cookie") ?? "";

  try {
    // Fetch student info from PP API instead of OneRoster
    const studentInfoUrl = `/api/PP/student/${encodeURIComponent(studentPersonId)}${querySuffix}`;
    console.log('[Parent Conduct] Fetching student info:', { 
      studentPersonId, 
      url: studentInfoUrl,
      parentEid 
    });
    
    const studentInfo = await fetchJson<StudentProfileV1>(`${origin}`, studentInfoUrl, cookie).catch((error) => {
      if (error instanceof UpstreamFetchError && error.status === 404) {
        console.warn('[Parent Conduct] Student not found:', { studentPersonId, status: 404 });
        return null;
      }
      console.error('[Parent Conduct] Student fetch failed:', { 
        studentPersonId, 
        error: error.message,
        status: error.status 
      });
      throw error;
    });

    // Extract parent info from student data
    const parentInfo = studentInfo?.parent ?? null;

    // Extract schoolId from student's enrollment data
    let schoolInfo = null;
    
    if (studentInfo && studentInfo.enrollment && studentInfo.enrollment.length > 0) {
      // Get the most recent enrollment (you can adjust this logic if needed)
      const latestEnrollment = studentInfo.enrollment[0];
      const schoolId = latestEnrollment.schoolId;
      
      console.log('[Parent Conduct] Processing enrollments:', {
        studentPersonId,
        enrollmentCount: studentInfo.enrollment.length,
        latestSchoolId: schoolId,
        schoolYear: latestEnrollment.schoolYear
      });
      
      if (schoolId) {
        // Fetch school information
        const schoolUrl = `/api/PP/school/${encodeURIComponent(schoolId)}`;
        console.log('[Parent Conduct] Fetching school info:', { schoolId, url: schoolUrl });
        
        schoolInfo = await fetchJson<unknown>(`${origin}`, schoolUrl, cookie).catch((error) => {
          console.warn('[Parent Conduct] Failed to fetch school info:', { 
            schoolId, 
            error: error.message,
            status: error.status 
          });
          return null;
        });
        
        if (schoolInfo) {
          console.log('[Parent Conduct] School info fetched successfully:', { schoolId });
        }
      } else {
        console.warn('[Parent Conduct] No schoolId in latest enrollment:', { studentPersonId });
      }
    } else {
      console.warn('[Parent Conduct] No enrollments found for student:', { studentPersonId });
    }

    const payload: ParentConductAggregatedResponse = {
      studentInfo,
      parentInfo,
      schoolInfo,
    };

    console.log('[Parent Conduct] Aggregation successful:', {
      studentPersonId,
      hasStudentInfo: !!studentInfo,
      hasParentInfo: !!parentInfo,
      hasSchoolInfo: !!schoolInfo,
    });

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
