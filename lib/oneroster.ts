// lib/oneroster.ts
// Server-side helper to: (1) login with read/write credentials via JSON body,
// (2) cache tokens per kind, and (3) make authenticated OneRoster requests.
// Ensures server-only usage and robust handling of token expiry/refresh.

// Enforce server-only usage in Next.js app router environments
// (no-op outside Next.js, but safe to import).
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import "server-only";
import { fetchWithTimeout } from "./fetch-with-timeout";

type TokenKind = "read" | "write";

type AuthResponse =
  | { accessToken: string; expiresIn?: number }
  | { token: string; expiresIn?: number }
  | { jwt: string; expiresIn?: number }
  | { bearerToken: string; expiresIn?: number }
  | Record<string, unknown>;

const AUTH_URL = process.env.ONEROSTER_AUTH_URL || "";
const BASE_URL = process.env.ONEROSTER_BASE || "";

function getCreds(kind: TokenKind) {
  if (kind === "read") {
    const u = process.env.ONEROSTER_READ_USERNAME!;
    const p = process.env.ONEROSTER_READ_PASSWORD!;
    const s = process.env.ONEROSTER_READ_SITE_UID!;
    if (!u || !p || !s)
      throw new Error("OneRoster READ credentials are not configured. Please set ONEROSTER_READ_USERNAME, ONEROSTER_READ_PASSWORD, and ONEROSTER_READ_SITE_UID.");
    return { username: u, password: p, siteUid: s };
  } else {
    const u = process.env.ONEROSTER_WRITE_USERNAME!;
    const p = process.env.ONEROSTER_WRITE_PASSWORD!;
    const s = process.env.ONEROSTER_WRITE_SITE_UID!;
    if (!u || !p || !s)
      throw new Error("OneRoster WRITE credentials are not configured. Please set ONEROSTER_WRITE_USERNAME, ONEROSTER_WRITE_PASSWORD, and ONEROSTER_WRITE_SITE_UID.");
    return { username: u, password: p, siteUid: s };
  }
}

const cache: Record<TokenKind, { token: string; exp: number } | undefined> = {
  read: undefined,
  write: undefined,
};

// Deduplicate concurrent token requests per kind
const inflight: Record<TokenKind, Promise<string> | null> = {
  read: null,
  write: null,
};

function pickFirst(obj: unknown, keys: string[]): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  const rec = obj as Record<string, unknown>;
  for (const k of keys) {
    if (k in rec && rec[k] !== undefined) return rec[k];
  }
  return undefined;
}

function extractToken(json: AuthResponse): string | undefined {
  const val = pickFirst(json, [
    "accessToken",
    "token",
    "jwt",
    "bearerToken",
  ]);
  return typeof val === "string" ? val : undefined;
}

function extractExpiry(json: AuthResponse, now: number): number {
  const raw = pickFirst(json, [
    "expiresIn",
    "expires_in",
    "expiry",
    "expires",
    "expiresAt",
    "expiration",
  ]);

  // Numeric handling: could be TTL seconds, absolute seconds, or ms
  if (typeof raw === "number" && isFinite(raw) && raw > 0) {
    // If it's a large number (likely ms since epoch), convert to seconds
    if (raw > 1e12) {
      return Math.floor(raw / 1000);
    }
    // If it's in the near future relative to now (absolute seconds)
    if (raw > now + 60) {
      return Math.floor(raw);
    }
    // Otherwise treat as TTL seconds
    return now + Math.floor(raw);
  }

  // String handling: ISO date/time
  if (typeof raw === "string" && raw.trim()) {
    const parsed = Date.parse(raw);
    if (!Number.isNaN(parsed)) {
      return Math.floor(parsed / 1000);
    }
    const asNum = Number(raw);
    if (Number.isFinite(asNum) && asNum > 0) {
      // Same numeric rules as above
      if (asNum > 1e12) return Math.floor(asNum / 1000);
      if (asNum > now + 60) return Math.floor(asNum);
      return now + Math.floor(asNum);
    }
  }

  // Fallback TTL: 50 minutes
  return now + 50 * 60;
}

async function getToken(kind: TokenKind): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const hit = cache[kind];
  if (hit && hit.exp - 30 > now) return hit.token;

  if (inflight[kind]) return inflight[kind]!;

  inflight[kind] = (async () => {
    const { username, password, siteUid } = getCreds(kind);

    const resp = await fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ImsCredentials: { username, password, siteUid },
      }),
      cache: "no-store",
    });

    const text = await resp.text();
    if (!resp.ok) {
      throw new Error(`Auth (${kind}) failed: ${resp.status} ${text}`);
    }

    let json: AuthResponse = {};
    try {
      json = text ? (JSON.parse(text) as AuthResponse) : {};
    } catch {
      throw new Error(`Auth (${kind}) returned non-JSON: ${text}`);
    }

    const token = extractToken(json);
    if (!token)
      throw new Error(
        `Auth (${kind}) succeeded but no token field found: ${JSON.stringify(json)}`
      );

    const exp = extractExpiry(json, now);
    cache[kind] = { token, exp };
    return token;
  })();

  try {
    return await inflight[kind]!;
  } finally {
    inflight[kind] = null;
  }
}

function joinBaseAndPath(base: string, path: string): string {
  const b = base.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function headersToObject(h?: HeadersInit): Record<string, string> {
  if (!h) return {};
  if (h instanceof Headers) {
    const obj: Record<string, string> = {};
    h.forEach((v, k) => {
      obj[k] = v;
    });
    return obj;
  }
  if (Array.isArray(h)) {
    return Object.fromEntries(h.map(([k, v]) => [k, String(v)]));
  }
  return Object.fromEntries(
    Object.entries(h as Record<string, string | number | boolean>).map(
      ([k, v]) => [k, String(v)]
    )
  );
}

/**
 * Authenticated fetch to OneRoster.
 * @param path e.g. "/students/123" or "/persons?eid=ABC"
 * @param kind "read" (default) or "write"
 * @param init Optional RequestInit with optional timeoutMs property
 */
export async function orFetch<T>(
  path: string, 
  kind: TokenKind = "read", 
  init?: RequestInit & { timeoutMs?: number }
): Promise<T> {
  if (!AUTH_URL || !BASE_URL) {
    throw new Error("OneRoster endpoints are not configured. Please set ONEROSTER_AUTH_URL and ONEROSTER_BASE.");
  }
  
  const timeoutMs = init?.timeoutMs ?? 15000; // Default 15 seconds for OneRoster
  
  const makeReq = async (retry: boolean): Promise<T> => {
    const token = await getToken(kind);
    const url = joinBaseAndPath(BASE_URL, path);
    const other = headersToObject(init?.headers);
    // Allow callers to set headers, but always enforce Authorization from our token
    const headers: HeadersInit = {
      Accept: other["Accept"] ?? "application/json",
      ...other,
      Authorization: `Bearer ${token}`,
    };

    const res = await fetchWithTimeout(url, {
      ...init,
      headers,
      cache: "no-store",
      timeoutMs,
    });

    const text = await res.text();
    if (!res.ok) {
      // If unauthorized/forbidden, invalidate token and retry once
      if ((res.status === 401 || res.status === 403) && retry) {
        cache[kind] = undefined;
        return makeReq(false);
      }
      throw new Error(`OneRoster ${res.status} for ${path}: ${text}`);
    }

    // Try JSON parse when content exists and looks like JSON; else return as any
    if (!text) return undefined as unknown as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      // Not JSON; return raw text as any
      return text as unknown as T;
    }
  };

  return makeReq(true);
}
