import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getChildActionsSummary } from "@/lib/child-actions";
import { getActiveAcademicYearValue } from "@/lib/admin-config";
import { fetchStudentProfile } from "@/lib/fetch-student-profile";
import { fetchWithTimeout, FetchTimeoutError } from "@/lib/fetch-with-timeout";
import { buildInternalApiUrl } from "@/lib/internal-api-url";
import Logger, { createScopedLogger } from "@/lib/logger";
import { safeValidateChildActionResponse } from "@/lib/child-actions-schema";
import type { StudentProfileV1 } from "@/app/types/studentprofile";
import type {
  ChildActionIdhDebug,
  ChildActionIdhDebugShape,
  ChildActionIdhDebugSource,
  ChildActionResponse,
} from "@/types/child-actions";

export const dynamic = "force-dynamic";

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const ALLOWED_DEBUG_USERS = new Set(process.env.ALLOWED_DEBUG_USER_IDS?.split(',').map(id => id.trim()) ?? []);
const REQUEST_TIMEOUT_MS = 15000; // 15 seconds for student profile
const IDH_TIMEOUT_MS = 10000; // 10 seconds for IDH

Logger.debug("child-actions route loaded");
export async function GET(req: Request) {
  const startTime = Date.now();
  const correlationId = Logger.generateCorrelationId();
  const log = createScopedLogger(correlationId, { endpoint: '/api/parent/child-actions' });

  try {
    log.info('Incoming request');

    const session = await getServerSession(authOptions);
    if (!session) {
      log.warn('Unauthorized request - no session');
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const { searchParams } = url;
    const studentPersonId = searchParams.get("studentPersonId")?.trim();
    const requestedParentId = searchParams.get("parentPersonId")?.trim() || null;
    const studentEmirateId = searchParams.get("studentEmirateId")?.trim() || null;
    const debugParamRequested = TRUE_VALUES.has((searchParams.get("idhDebug") ?? "").toLowerCase());
    const sessionParentId = session.user?.emiratesId?.trim() || null;

    // Allow idhDebug for authorized users only
    const includeIdhDebug = debugParamRequested && (
      ALLOWED_DEBUG_USERS.size === 0 || 
      ALLOWED_DEBUG_USERS.has(sessionParentId ?? '')
    );

    if (debugParamRequested && !includeIdhDebug) {
      log.warn('idhDebug requested but user not authorized', { userId: sessionParentId ?? undefined });
    }

    if (!studentPersonId) {
      log.warn('Missing required parameter: studentPersonId');
      return NextResponse.json({ ok: false, error: "studentPersonId is required" }, { status: 400 });
    }

    if (!sessionParentId) {
      log.warn('Parent identity missing in session');
      return NextResponse.json({ ok: false, error: "Parent identity missing in session" }, { status: 403 });
    }

    if (requestedParentId && requestedParentId !== sessionParentId) {
      log.warn('Forbidden: Parent ID mismatch', { 
        requested: requestedParentId, 
        session: sessionParentId 
      });
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    log.info('Request validated', { 
      studentPersonId, 
      parentPersonId: sessionParentId,
      includeIdhDebug 
    });

    const parentPersonId = sessionParentId;
    const origin = url.origin;

    log.debug('Fetching parallel data', { studentPersonId, parentPersonId });

    const fetchStart = Date.now();
    const activeAcademicYearPromise = getActiveAcademicYearValue();
    const studentProfilePromise = fetchStudentProfile({
      origin,
      studentPersonId,
      cookieHeader: req.headers.get("cookie") ?? undefined,
      timeoutMs: REQUEST_TIMEOUT_MS,
      retries: 1,
    });

    const idhPromise = fetchIdhStatus(studentPersonId, req, { 
      debug: includeIdhDebug,
      timeoutMs: IDH_TIMEOUT_MS,
    });

    const [activeAcademicYear, studentProfileResult, idh] = await Promise.all([
      activeAcademicYearPromise,
      studentProfilePromise,
      idhPromise,
    ]);

    const fetchDuration = Date.now() - fetchStart;
    log.logDuration('Parallel fetches completed', fetchDuration, {
      studentProfileOk: studentProfileResult.ok,
      idhStatusId: idh.statusId,
    });

    if (!studentProfileResult.ok) {
      const upstreamStatus = studentProfileResult.status;
      const status = upstreamStatus === 401 ? 403 : upstreamStatus;
      const message =
        upstreamStatus === 404
          ? "Student not found or not associated with this account"
          : studentProfileResult.message;

      log.error('Student profile fetch failed', { 
        status: upstreamStatus, 
        message 
      });

      return NextResponse.json({ ok: false, error: message }, { status });
    }

    const studentData = studentProfileResult.profile;

    let educationType: string | null = null;
    let schoolYear: string | null = null;

    if (studentData) {
      const activeYearStr = activeAcademicYear ? String(activeAcademicYear) : null;
      const matchingEnrollment = studentData.enrollment?.find((enr) => enr.schoolYear === activeYearStr);

      if (matchingEnrollment) {
        educationType = matchingEnrollment.educationType;
        schoolYear = matchingEnrollment.schoolYear;
        log.debug('Using active year enrollment', { educationType, schoolYear });
      } else if (studentData.enrollment?.length) {
        const sorted = [...studentData.enrollment].sort((a, b) => {
          const aYear = a.schoolYear ? parseInt(a.schoolYear, 10) : 0;
          const bYear = b.schoolYear ? parseInt(b.schoolYear, 10) : 0;
          return bYear - aYear;
        });
        educationType = sorted[0].educationType;
        schoolYear = sorted[0].schoolYear;
        log.debug('Using most recent enrollment', { educationType, schoolYear });
      } else {
        log.warn('No enrollment data found for student');
      }
    }

    // Always fetch IDH data
    const idhStatusId = idh.statusId;
    const idhFetchedAt = idh.fetchedAt;
    const idhTrace = idh.trace;

    log.debug('Generating child actions summary', { idhStatusId, idhFetchedAt });

    const payload = await getChildActionsSummary({
      studentPersonId,
      parentPersonId,
      studentEmirateId,
      educationTypeHint: educationType,
      schoolYearHint: schoolYear,
      idhStatusId,
      idhFetchedAt,
      activeAcademicYear,
    });

    if (includeIdhDebug && idhTrace) {
      payload.idhDebug = idhTrace;
      log.debug('IDH debug info included in response');
    }

    // Validate response schema
    const validationResult = safeValidateChildActionResponse(payload);
    if (!validationResult.success) {
      log.error('Response schema validation failed', { 
        errors: validationResult.errors.errors 
      });
      // Log but don't block - return payload anyway for backward compatibility
    }

    const totalDuration = Date.now() - startTime;
    log.logDuration('Request completed successfully', totalDuration, {
      actionCount: payload.actions?.length ?? 0,
    });

    return NextResponse.json(
      payload as ChildActionResponse,
      { headers: { 'x-correlation-id': correlationId } }
    );
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    const err = error instanceof Error ? error : new Error(String(error));
    
    log.error('Request failed', { duration: totalDuration }, err);
    
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = error instanceof FetchTimeoutError ? 504 : 500;
    
    return NextResponse.json(
      { ok: false, error: message },
      { 
        status,
        headers: { 'x-correlation-id': correlationId }
      }
    );
  }
}

type FetchIdhStatusOptions = {
  debug?: boolean;
  timeoutMs?: number;
};

type FetchIdhStatusResult = {
  statusId: number | null;
  fetchedAt: string | null;
  trace?: ChildActionIdhDebug;
};

async function fetchIdhStatus(studentPersonId: string, req: Request, options?: FetchIdhStatusOptions): Promise<FetchIdhStatusResult> {
  const debug = options?.debug ?? false;
  const timeoutMs = options?.timeoutMs ?? 10000;
  const trace: ChildActionIdhDebug | null = debug
    ? {
        statusId: null,
        fetchedAt: null,
        upstreamStatus: 0,
        parsedShape: "unknown",
        extractedFrom: "none",
      }
    : null;

  try {
    const baseUrl = process.env.PP_BASE_URL;
    if (!baseUrl) {
      Logger.warn("PP_BASE_URL missing; skipping IDH fetch");
      if (trace) {
        trace.warning = "PP_BASE_URL missing";
      }
      return { statusId: null, fetchedAt: null, trace: trace ?? undefined };
    }

    // Use localhost for internal API calls to avoid DNS/SSL issues on staging
    const origin = new URL(req.url).origin;
    const isExternalOrigin = origin.includes('parent-stg.moe.gov.ae') || 
                             origin.includes('parent.moe.gov.ae');
    const apiOrigin = isExternalOrigin 
      ? `http://localhost:${process.env.PORT || 4200}` 
      : origin;
      
    const tokenRes = await fetchWithTimeout(buildInternalApiUrl(origin, '/api/PP/auth/token'), { 
      cache: "no-store",
      timeoutMs: 5000 // 5 second timeout for token fetch
    });
    const tokenJson = (await tokenRes.json().catch(() => null)) as { accessToken?: string } | null;

    if (!tokenRes.ok || !tokenJson?.accessToken) {
      Logger.warn("Failed to retrieve PP token", { status: tokenRes.status });
      if (trace) {
        trace.warning = `Failed to retrieve PP token (${tokenRes.status})`;
        trace.parsedShape = "empty";
      }
      return { statusId: null, fetchedAt: null, trace: trace ?? undefined };
    }

    const accessToken = tokenJson.accessToken;
    const upstreamUrl = `${baseUrl.replace(/\/$/, "")}/idh?sourceId=${encodeURIComponent(studentPersonId)}`;
    const idhRes = await fetchWithTimeout(upstreamUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      timeoutMs,
    });

    if (trace) {
      trace.upstreamStatus = idhRes.status;
    }

    if (idhRes.status === 404) {
      if (trace) {
        trace.parsedShape = "empty";
        trace.warning = "IDH record not found (404)";
      }
      return { statusId: null, fetchedAt: null, trace: trace ?? undefined };
    }

    const rawBody = await idhRes.text();
    const trimmedBody = rawBody.trim();
    const hasBody = trimmedBody.length > 0;

    if (!idhRes.ok) {
      Logger.warn("IDH fetch failed", { status: idhRes.status, hasBody });
      if (trace) {
        trace.parsedShape = hasBody ? "string" : "empty";
        trace.warning = `Upstream returned ${idhRes.status}`;
        trace.bodyPreview = debug && hasBody ? truncateForDebug(trimmedBody) : undefined;
      }
      return { statusId: null, fetchedAt: null, trace: trace ?? undefined };
    }

    if (!hasBody) {
      Logger.warn("IDH fetch returned empty body", { url: upstreamUrl });
      if (trace) {
        trace.parsedShape = "empty";
        trace.warning = "Empty body from upstream";
      }
      return { statusId: null, fetchedAt: null, trace: trace ?? undefined };
    }

    let parsed: unknown = null;
    try {
      parsed = JSON.parse(trimmedBody);
    } catch (error) {
      Logger.warn("Failed to parse IDH response JSON", {}, error instanceof Error ? error : undefined);
      if (trace) {
        trace.parsedShape = "string";
        trace.warning = "Failed to parse JSON body";
        trace.bodyPreview = debug ? truncateForDebug(trimmedBody) : undefined;
      }
      return { statusId: null, fetchedAt: null, trace: trace ?? undefined };
    }

    const extraction = extractIdhStatusPayload(parsed);

    if (trace) {
      trace.statusId = extraction.statusId;
      trace.fetchedAt = extraction.fetchedAt;
      trace.parsedShape = extraction.parsedShape;
      trace.extractedFrom = extraction.extractedFrom;
      trace.statusKey = extraction.statusKey ?? undefined;
      trace.keys = extraction.keys?.slice(0, 8);
      trace.arrayLength = typeof extraction.arrayLength === "number" ? extraction.arrayLength : undefined;
      trace.warning = extraction.warning;
      trace.bodyPreview = debug ? truncateForDebug(trimmedBody) : undefined;
    }

    const statusId = extraction.statusId;
    let fetchedAt = extraction.fetchedAt;
    if (!fetchedAt && statusId !== null) {
      fetchedAt = new Date().toISOString();
    }

    return {
      statusId,
      fetchedAt,
      trace: trace ?? undefined,
    };
  } catch (error) {
    Logger.warn("Error while fetching IDH status", {}, error instanceof Error ? error : undefined);
    if (trace) {
      trace.warning = error instanceof Error ? error.message : String(error);
    }
    return { statusId: null, fetchedAt: null, trace: trace ?? undefined };
  }
}

type ExtractedIdhStatus = {
  statusId: number | null;
  fetchedAt: string | null;
  parsedShape: ChildActionIdhDebugShape;
  extractedFrom: ChildActionIdhDebugSource;
  statusKey?: string | null;
  keys?: string[];
  arrayLength?: number;
  warning?: string;
};

const NESTED_IDH_KEYS = ["data", "Data", "result", "Result", "payload", "Payload", "records", "Records", "items", "Items", "student", "Student"];

function extractIdhStatusPayload(payload: unknown): ExtractedIdhStatus {
  if (payload === null || payload === undefined) {
    return { statusId: null, fetchedAt: null, parsedShape: "empty", extractedFrom: "none", warning: "Empty response" };
  }

  if (Array.isArray(payload)) {
    const arrayLength = payload.length;
    for (const entry of payload) {
      const nested = extractIdhStatusPayload(entry);
      if (nested.statusId !== null) {
        return {
          ...nested,
          parsedShape: "array",
          extractedFrom: nested.extractedFrom === "none" ? "array" : nested.extractedFrom,
          arrayLength,
        };
      }
    }
    return {
      statusId: null,
      fetchedAt: null,
      parsedShape: "array",
      extractedFrom: "array",
      arrayLength,
      warning: arrayLength ? "statusId missing in array entries" : "Empty array response",
    };
  }

  if (typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    const keys = Object.keys(obj);

    const statusLookup = resolveStatusFromObject(obj);
    const directStatus = coerceNumber(statusLookup?.value);

    if (directStatus !== null) {
      const fetchedAt =
        coerceDatetime(
          obj.datetime ??
            obj.datetimeAt ??
            obj.fetchedAt ??
            obj.fetched_at ??
            obj.updatedAt ??
            obj.updated_at ??
            obj.lastUpdated ??
            obj.last_updated ??
            obj.insertedAt ??
            obj.inserted_at ??
            obj.Datetime ??
            obj.datetimeUTC ??
            obj.DateTime ??
            obj.dateTime
        ) ?? null;

      return {
        statusId: directStatus,
        fetchedAt,
        parsedShape: "object",
        extractedFrom: "root",
        statusKey: statusLookup?.key ?? null,
        keys,
      };
    }

    for (const key of NESTED_IDH_KEYS) {
      if (key in obj) {
        const nested = extractIdhStatusPayload(obj[key]);
        if (nested.statusId !== null) {
          const extractedFrom = key === "data" || key === "Data"
            ? "data"
            : nested.extractedFrom === "none"
              ? "data"
              : nested.extractedFrom;

          return {
            ...nested,
            parsedShape: "object",
            extractedFrom,
            statusKey: nested.statusKey ?? statusLookup?.key ?? key,
            keys,
          };
        }
      }
    }

    return {
      statusId: null,
      fetchedAt: null,
      parsedShape: "object",
      extractedFrom: "none",
      statusKey: statusLookup?.key ?? null,
      keys,
      warning: keys.length ? "statusId not found in object" : "Empty object response",
    };
  }

  if (typeof payload === "string") {
    const status = coerceNumber(payload);
    if (status !== null) {
      return {
        statusId: status,
        fetchedAt: null,
        parsedShape: "string",
        extractedFrom: "root",
      };
    }
    return { statusId: null, fetchedAt: null, parsedShape: "string", extractedFrom: "none", warning: "String payload without statusId" };
  }

  if (typeof payload === "number") {
    if (Number.isFinite(payload)) {
      return { statusId: payload, fetchedAt: null, parsedShape: "number", extractedFrom: "root" };
    }
    return { statusId: null, fetchedAt: null, parsedShape: "number", extractedFrom: "none", warning: "Non-finite numeric payload" };
  }

  if (typeof payload === "boolean") {
    return { statusId: null, fetchedAt: null, parsedShape: "boolean", extractedFrom: "none", warning: "Boolean payload" };
  }

  return { statusId: null, fetchedAt: null, parsedShape: "unknown", extractedFrom: "none", warning: "Unrecognized payload shape" };
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

function coerceDatetime(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const timestamp = Date.parse(trimmed);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return new Date(timestamp).toISOString();
}

type ResolvedStatus = { key: string; value: unknown } | null;

const STATUS_KEY_CANDIDATES = [
  "statusId",
  "status_id",
  "StatusId",
  "StatusID",
  "Status_Id",
  "Status_ID",
  "status_Id",
  "status_ID",
  "Status",
  "status",
];

function resolveStatusFromObject(obj: Record<string, unknown>): ResolvedStatus {
  for (const key of STATUS_KEY_CANDIDATES) {
    if (key in obj) {
      return { key, value: obj[key] };
    }
  }

  for (const [key, value] of Object.entries(obj)) {
    const normalized = normalizeKeyName(key);
    if (normalized === "statusid" || normalized === "status") {
      return { key, value };
    }
  }

  return null;
}

function normalizeKeyName(key: string): string {
  return key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

function truncateForDebug(body: string, limit = 400): string {
  if (body.length <= limit) {
    return body;
  }

  return `${body.slice(0, limit)}...`;
}
