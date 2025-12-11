import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { authorizeStudentAccess } from "@/lib/student-authorization";
import { fetchWithTimeout, FetchTimeoutError } from "@/lib/fetch-with-timeout";
import type { StudentProfileV1 } from "@/app/types/studentprofile";

export const dynamic = "force-dynamic";

type CharterPayload = {
  academicyear?: string;
  studentNumber?: string;
  attachment01?: string;
  datetime?: string;
};

type PPTokenResponse = {
  accessToken?: string;
  error?: string;
};

type CharterRecord = {
  academicyear?: string;
  studentNumber?: string;
  attachment01?: string | null;
  datetime?: string | null;
};

const TOKEN_TIMEOUT_MS = 8000;
const CHARTER_TIMEOUT_MS = 15000;
const PROFILES_TIMEOUT_MS = 25000; // Increased from 15s to 25s for slower upstream responses

function buildTokenUrl(req: Request): string {
  const origin = new URL(req.url).origin;
  const internalApiBaseUrl = process.env.PUBLIC_URL || process.env.NEXTAUTH_URL || 'http://localhost:4200';
  return `${internalApiBaseUrl}/api/PP/auth/token`;
}

function normalizeCharter(input: unknown): CharterRecord | null {
  if (!input) return null;

  if (Array.isArray(input)) {
    return input.length ? normalizeCharter(input[0]) : null;
  }

  if (typeof input === "object") {
    const record = input as Record<string, unknown>;
    if (record.data) return normalizeCharter(record.data);
    if (record.Data) return normalizeCharter(record.Data);

    const readString = (keys: string[]): string | undefined => {
      for (const key of keys) {
        const value = record[key];
        if (typeof value === "string" && value.trim().length > 0) {
          return value.trim();
        }
      }
      return undefined;
    };

    const academicyear = readString(["academicyear", "Academicyear", "AcademicYear", "academyYear"]);
    const studentNumber = readString(["studentNumber", "StudentNumber"]);
    const attachment01 = readString(["attachment01", "Attachment01"]);
    const datetime = readString(["datetime", "Datetime", "dateTime"]);

    return {
      academicyear,
      studentNumber,
      attachment01: attachment01 ?? null,
      datetime,
    };
  }

  if (typeof input === "string" && input.trim().length > 0) {
    return {
      attachment01: input.trim(),
    };
  }

  return null;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
 
    const { searchParams } = new URL(req.url);
    const studentNumber = searchParams.get("studentNumber")?.trim();
    const academicyear = searchParams.get("academicyear")?.trim() || '2025-2026';
    if (!studentNumber) {
      return NextResponse.json({ ok: false, error: "studentNumber is required" }, { status: 400 });
    }

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
      return NextResponse.json({ ok: false, error: message }, { status });
    }

    if (!tokenRes.ok || !tokenData?.accessToken) {
      return NextResponse.json(
        { ok: false, error: tokenData?.error || "Failed to acquire PP token" },
        { status: 500 },
      );
    }

    const baseUrl = process.env.PP_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json({ ok: false, error: "PP_BASE_URL not configured" }, { status: 500 });
    }

    const upstreamUrl = `${baseUrl.replace(/\/$/, "")}/Idh/students-partnership-charter?studentNumber=${encodeURIComponent(studentNumber)}&academicyear=${encodeURIComponent(academicyear)}`;
    let upstreamRes: Response;
    try {
      upstreamRes = await fetchWithTimeout(upstreamUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tokenData.accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
        timeoutMs: CHARTER_TIMEOUT_MS,
      });
    } catch (error) {
      const status = error instanceof FetchTimeoutError ? 504 : 502;
      const message =
        error instanceof FetchTimeoutError
          ? "Timed out while fetching partnership charter"
          : "Failed to reach partnership charter endpoint";
      return NextResponse.json({ ok: false, error: message }, { status });
    }

    const rawText = await upstreamRes.text();
    let parsed: unknown = null;
    if (rawText) {
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = rawText;
      }
    }

    if (upstreamRes.status === 404) {
      return NextResponse.json({
        ok: true,
        data: null,
        meta: {
          studentNumber,
          fetchedAt: new Date().toISOString(),
        },
      });
    }

    if (!upstreamRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: typeof parsed === "string" && parsed.trim().length > 0
            ? parsed
            : `Upstream returned ${upstreamRes.status}`,
          upstream: parsed,
        },
        { status: upstreamRes.status },
      );
    }

    const normalized = normalizeCharter(parsed);

    return NextResponse.json({
      ok: true,
      data: normalized,
      meta: {
        studentNumber,
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";
    const status = error instanceof FetchTimeoutError ? 504 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as CharterPayload;
    const academicyear = body?.academicyear?.trim();
    const studentNumber = body?.studentNumber?.trim();
    const attachment01 = body?.attachment01;
    const datetime = body?.datetime?.trim();

    if (!academicyear) {
      return NextResponse.json({ ok: false, error: "academicyear is required" }, { status: 400 });
    }

    if (!studentNumber) {
      return NextResponse.json({ ok: false, error: "studentNumber is required" }, { status: 400 });
    }

    if (!attachment01) {
      return NextResponse.json({ ok: false, error: "attachment01 is required" }, { status: 400 });
    }

    if (!datetime) {
      return NextResponse.json({ ok: false, error: "datetime is required" }, { status: 400 });
    }

    // Get parent's Emirates ID from session
    const parentEid = session?.user?.emiratesId;
    if (!parentEid) {
      return NextResponse.json(
        { ok: false, error: "Parent Emirates ID not found in session" },
        { status: 401 },
      );
    }

    // Get PP token first for authorization check
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
      return NextResponse.json({ ok: false, error: message }, { status });
    }

    if (!tokenRes.ok || !tokenData?.accessToken) {
      return NextResponse.json(
        { ok: false, error: tokenData?.error || "Failed to acquire PP token" },
        { status: 500 },
      );
    }

    // Find student by studentNumber to get their ID for authorization
    // Fetch all students for this parent
    const baseUrl = process.env.PP_BASE_URL;
    if (!baseUrl) {
      return NextResponse.json({ ok: false, error: "PP_BASE_URL not configured" }, { status: 500 });
    }

    const profilesUrl = `${baseUrl.replace(/\/$/, '')}/oneroster/students/profiles?EmirateId=${parentEid}`;
    let profilesRes: Response;
    let lastError: Error | null = null;
    const MAX_RETRIES = 1; // Retry once on timeout/error
    
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        profilesRes = await fetchWithTimeout(profilesUrl, {
          headers: {
            'Authorization': `Bearer ${tokenData.accessToken}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
          timeoutMs: PROFILES_TIMEOUT_MS,
        });
        break; // Success, exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        console.error('[Partnership Charter] Profiles fetch error:', {
          url: profilesUrl,
          attempt: attempt + 1,
          maxAttempts: MAX_RETRIES + 1,
          error: error instanceof FetchTimeoutError ? 'timeout' : 'network',
        });
        
        // Retry on last attempt
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
          continue;
        }
        
        // All retries exhausted
        const status = error instanceof FetchTimeoutError ? 504 : 502;
        const message =
          error instanceof FetchTimeoutError
            ? 'Timed out while fetching parent students'
            : 'Failed to reach PP student profiles endpoint';
        return NextResponse.json({ ok: false, error: message }, { status });
      }
    }
    
    // Check if we have a response (should always be true here)
    if (!profilesRes!) {
      return NextResponse.json(
        { ok: false, error: lastError?.message || 'Failed to fetch profiles' },
        { status: 502 }
      );
    }

    if (!profilesRes.ok) {
      return NextResponse.json(
        { ok: false, error: "Failed to fetch parent's children" },
        { status: profilesRes.status },
      );
    }

    const studentList: StudentProfileV1[] = await profilesRes.json();
    const student = studentList.find(s => s.studentNumber === studentNumber);

    if (!student) {
      return NextResponse.json(
        { ok: false, error: "Student not found or not authorized for this parent" },
        { status: 404 },
      );
    }

    // Now authorize with the student ID
    const authResult = await authorizeStudentAccess(
      student.id,
      parentEid,
      tokenData.accessToken
    );

    if (!authResult.authorized) {
      return NextResponse.json(
        { ok: false, error: authResult.error.message },
        { status: authResult.error.status },
      );
    }

    // Use token and baseUrl from authorization check
    const upstreamUrl = `${baseUrl.replace(/\/$/, "")}/idh/students-partnership-charter`;
    let upstreamRes: Response;
    try {
      upstreamRes = await fetchWithTimeout(upstreamUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenData.accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
        timeoutMs: CHARTER_TIMEOUT_MS,
        body: JSON.stringify({ academicyear, studentNumber, attachment01, datetime }),
      });
    } catch (error) {
      const status = error instanceof FetchTimeoutError ? 504 : 502;
      const message =
        error instanceof FetchTimeoutError
          ? "Timed out while submitting partnership charter"
          : "Failed to reach partnership charter endpoint";
      return NextResponse.json({ ok: false, error: message }, { status });
    }

    const upstreamJson = await upstreamRes.json().catch(() => null);

    if (!upstreamRes.ok) {
      return NextResponse.json(
        { ok: false, error: upstreamJson ?? `Upstream returned ${upstreamRes.status}` },
        { status: upstreamRes.status },
      );
    }

    return NextResponse.json({
      ok: true,
      data: upstreamJson,
      meta: {
        forwardedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";
    const status = error instanceof FetchTimeoutError ? 504 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
