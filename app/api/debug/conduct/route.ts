import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type PPTokenResponse = {
  accessToken?: string;
  error?: string;
};

/**
 * DEBUG ENDPOINT - Tests the conduct aggregation flow step-by-step
 * USE ONLY FOR DEBUGGING
 * 
 * Query params:
 * - studentPersonId (required)
 * - parentEid (required)
 * - nocache (optional)
 * - schoolYear (optional)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const studentPersonId = searchParams.get("studentPersonId");
  const parentEid = searchParams.get("parentEid");
  
  if (!studentPersonId) {
    return NextResponse.json(
      { ok: false, error: "studentPersonId query parameter is required" },
      { status: 400 },
    );
  }

  if (!parentEid) {
    return NextResponse.json(
      { ok: false, error: "parentEid query parameter is required for debugging" },
      { status: 400 },
    );
  }

  const origin = req.nextUrl.origin;
  const nocache = searchParams.get("nocache");
  const schoolYear = searchParams.get("schoolYear");
  
  const debugInfo: any = {
    request: {
      origin,
      studentPersonId,
      parentEid,
      nocache,
      schoolYear,
    },
    steps: {},
    errors: [],
    warnings: [],
  };

  try {
    // Step 1: Get PP token
    debugInfo.steps.tokenFetch = { status: 'started', timestamp: new Date().toISOString() };
    const internalApiBaseUrl = process.env.PUBLIC_URL || process.env.NEXTAUTH_URL || 'http://localhost:4200';
    const tokenUrl = `${internalApiBaseUrl}/api/PP/auth/token`;
    debugInfo.steps.tokenFetch.url = tokenUrl;
    
    const tokenRes = await fetch(tokenUrl, { cache: 'no-store' });
    const tokenData: PPTokenResponse = await tokenRes.json();
    
    debugInfo.steps.tokenFetch.status = tokenRes.ok ? 'success' : 'failed';
    debugInfo.steps.tokenFetch.httpStatus = tokenRes.status;
    debugInfo.steps.tokenFetch.hasToken = !!tokenData.accessToken;
    
    if (!tokenRes.ok || !tokenData.accessToken) {
      debugInfo.errors.push({
        step: 'tokenFetch',
        error: tokenData.error || 'Failed to get PP access token',
      });
      return NextResponse.json({ ok: false, debug: debugInfo }, { status: 500 });
    }

    // Step 2: Test student endpoint
    debugInfo.steps.studentFetch = { status: 'started', timestamp: new Date().toISOString() };
    
    const queryParams = new URLSearchParams();
    if (nocache) queryParams.set("nocache", nocache);
    if (schoolYear) queryParams.set("schoolYear", schoolYear);
    const querySuffix = queryParams.toString() ? `?${queryParams.toString()}` : "";
    
    const studentUrl = `${internalApiBaseUrl}/api/PP/student/${encodeURIComponent(studentPersonId)}${querySuffix}`;
    debugInfo.steps.studentFetch.url = studentUrl;
    
    const studentRes = await fetch(studentUrl, {
      headers: { cookie: req.headers.get("cookie") ?? "" },
      cache: 'no-store',
    });
    
    debugInfo.steps.studentFetch.httpStatus = studentRes.status;
    
    let studentData = null;
    try {
      studentData = await studentRes.json();
      debugInfo.steps.studentFetch.status = studentRes.ok ? 'success' : 'failed';
      debugInfo.steps.studentFetch.responseSize = JSON.stringify(studentData).length;
      
      if (studentRes.ok) {
        debugInfo.steps.studentFetch.hasEnrollments = !!studentData.enrollment?.length;
        debugInfo.steps.studentFetch.enrollmentCount = studentData.enrollment?.length ?? 0;
        debugInfo.steps.studentFetch.hasParent = !!studentData.parent;
      } else {
        debugInfo.errors.push({
          step: 'studentFetch',
          error: studentData.error || `HTTP ${studentRes.status}`,
        });
      }
    } catch (e) {
      debugInfo.steps.studentFetch.status = 'parse_error';
      debugInfo.errors.push({
        step: 'studentFetch',
        error: 'Failed to parse JSON response',
      });
    }

    // Step 3: Test school endpoint (if student has enrollments)
    if (studentData?.enrollment?.length > 0) {
      debugInfo.steps.schoolFetch = { status: 'started', timestamp: new Date().toISOString() };
      
      const latestEnrollment = studentData.enrollment[0];
      const schoolId = latestEnrollment.schoolId;
      
      debugInfo.steps.schoolFetch.schoolId = schoolId;
      debugInfo.steps.schoolFetch.enrollmentDetails = {
        schoolYear: latestEnrollment.schoolYear,
        educationType: latestEnrollment.educationType,
        streamGradeId: latestEnrollment.streamGradeId,
      };
      
      if (schoolId) {
        const schoolUrl = `${internalApiBaseUrl}/api/PP/school/${encodeURIComponent(schoolId)}`;
        debugInfo.steps.schoolFetch.url = schoolUrl;
        
        try {
          const schoolRes = await fetch(schoolUrl, {
            headers: { cookie: req.headers.get("cookie") ?? "" },
            cache: 'no-store',
          });
          
          debugInfo.steps.schoolFetch.httpStatus = schoolRes.status;
          
          const schoolData = await schoolRes.json();
          debugInfo.steps.schoolFetch.status = schoolRes.ok ? 'success' : 'failed';
          debugInfo.steps.schoolFetch.responseSize = JSON.stringify(schoolData).length;
          
          if (!schoolRes.ok) {
            debugInfo.errors.push({
              step: 'schoolFetch',
              schoolId,
              error: schoolData.error || `HTTP ${schoolRes.status}`,
            });
          } else {
            debugInfo.steps.schoolFetch.schoolName = schoolData.name;
            debugInfo.steps.schoolFetch.hasMetadata = !!schoolData.metadata;
          }
        } catch (e: any) {
          debugInfo.steps.schoolFetch.status = 'error';
          debugInfo.errors.push({
            step: 'schoolFetch',
            schoolId,
            error: e.message || String(e),
          });
        }
      } else {
        debugInfo.warnings.push('Latest enrollment has no schoolId');
      }
    } else {
      debugInfo.warnings.push('Student has no enrollments');
    }

    // Step 4: Environment check
    debugInfo.environment = {
      PP_BASE_URL: process.env.PP_BASE_URL ? '✓ configured' : '✗ missing',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ? '✓ configured' : '✗ missing',
      PORT: process.env.PORT || '4200',
      NODE_ENV: process.env.NODE_ENV,
    };

    const allStepsSucceeded = Object.values(debugInfo.steps).every(
      (step: any) => step.status === 'success'
    );

    return NextResponse.json({
      ok: allStepsSucceeded,
      message: allStepsSucceeded 
        ? 'All steps completed successfully' 
        : 'Some steps failed - check debug info',
      debug: debugInfo,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    debugInfo.errors.push({
      step: 'unexpected',
      error: error.message || String(error),
      stack: error.stack,
    });

    return NextResponse.json({
      ok: false,
      error: 'Unexpected error during debug',
      debug: debugInfo,
    }, { status: 500 });
  }
}
