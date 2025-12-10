import type { NextAuthOptions, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Auth0Provider from "next-auth/providers/auth0";
import Credentials from "next-auth/providers/credentials";
import { redis } from "./redis";
import crypto from "crypto";

// Support both OIDC_* and legacy AUTH0_* environment variables
const OIDC_ISSUER = process.env.OIDC_ISSUER || process.env.AUTH0_ISSUER || "";
const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID || process.env.AUTH0_CLIENT_ID || "";
const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET || process.env.AUTH0_CLIENT_SECRET || "";

// Build the OIDC/Auth0 provider (id: "oidc")
const oidcProvider = Auth0Provider({
  id: "oidc",
  issuer: OIDC_ISSUER,
  clientId: OIDC_CLIENT_ID,
  clientSecret: OIDC_CLIENT_SECRET,
  authorization: {
    params: {
      // Request standard OIDC scopes. Include email to receive email claim via userinfo/id_token
      scope: "openid profile  IdentityServerApi",
    },
  },
  // Increase timeout for discovery and other HTTP requests (default is 3500ms)
  httpOptions: {
    timeout: 10000, // 10 seconds
  },
  // If no client secret is provided, configure as a public client using PKCE
  ...(OIDC_CLIENT_SECRET
    ? {}
    : {
        client: {
          token_endpoint_auth_method: "none" as const,
        },
      }),
  // Map userinfo profile to NextAuth user and try to surface emiratesId if present
  profile(profile) {
    const claims = profile as Record<string, unknown>;
    const emiratesId = extractEmiratesId(claims);
    // Return object compatible with NextAuth User/AdapterUser
    const mapped: Partial<User> & { id: string; emiratesId?: string } = {
      id: (claims.sub as string) || "",
      name: (claims.name as string) || undefined,
      email: (claims.email as string) || undefined,
      image: (claims.picture as string) || undefined,
      emiratesId,
    };
    return mapped as User;
  },
});

type MobileClaims = {
  sub?: string;
  name?: string;
  email?: string;
  emiratesId?: string;
  EID?: string;
  [key: string]: unknown;
};

function decodeJwtPayload(token: string): MobileClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Normalize Emirates ID by removing dashes and spaces
function normalizeEmiratesId(value: unknown): string | undefined {
  const s = typeof value === "string" ? value : typeof value === "number" ? String(value) : undefined;
  if (!s) return undefined;
  return s.replace(/[-\s]/g, "").trim();
}

// Try to pull emiratesId/EID from a JWT claims object regardless of naming/namespace
function extractEmiratesId(claims?: Record<string, unknown>): string | undefined {
  if (!claims) return undefined;
  const rec = claims as Record<string, unknown>;
  const direct = normalizeEmiratesId(rec["emiratesId"]) || normalizeEmiratesId(rec["EID"]);
  if (direct) return direct;
  // Search namespaced/custom claim keys, case-insensitive match for emiratesId/EID
  for (const [k, v] of Object.entries(claims)) {
    const key = k.toLowerCase();
    const val = normalizeEmiratesId(v);
    if (!val) continue;
    // Allow keys that end with emiratesid or eid regardless of separator
    if (
      key === "emiratesid" ||
      key === "eid" ||
      key.endsWith("/emiratesid") ||
      key.endsWith(":emiratesid") ||
      key.endsWith(".emiratesid") ||
      key.endsWith("emiratesid") ||
      key.endsWith("/eid") ||
      key.endsWith(":eid") ||
      key.endsWith(".eid") ||
      key.endsWith("eid")
    ) {
      return val;
    }
  }
  return undefined;
}

// Identity profile endpoint (can be overridden via env); requires Bearer access token from IdP
const IDENTITY_PROFILE_URL =
  process.env.IDENTITY_PROFILE_URL?.trim() || "https://stg-login.moe.gov.ae/en/api/users/profile";

export async function fetchIdentityProfile(
  accessToken?: string
): Promise<Record<string, unknown> | null> {
  if (!accessToken) return null;
  try {
    const res = await fetch(IDENTITY_PROFILE_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      // Never cache identity profile calls
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) {
      // Non-fatal: just skip attaching identity profile on failure
      return null;
    }
    if (!text) return {};
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      // If the endpoint returns non-JSON, expose raw text for debugging
      return { raw: text } as unknown as Record<string, unknown>;
    }
  } catch {
    return null;
  }
}

// Helper to retrieve id_token from Redis using the stored key
export async function getIdTokenFromKey(idTokenKey?: string): Promise<string | null> {
  if (!idTokenKey) return null;
  try {
    const token = await redis.get(idTokenKey);
    return token;
  } catch {
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  session: { 
    strategy: "jwt",
    // Reduce session max age to encourage more frequent refreshes with smaller tokens
    maxAge: 24 * 60 * 60, // 24 hours instead of default 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  
  // Configure cookies to handle chunking gracefully
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Allow chunking when cookies exceed size limits
      }
    }
  },
  providers: [
    oidcProvider,
    Credentials({
      id: "mobile-token",
      name: "ExternalToken",
      credentials: {
        accessToken: { label: "Access Token", type: "text" },
      },
  async authorize(creds) {
        const accessToken = (creds?.accessToken || "").trim();
        if (!accessToken) return null;

        // NOTE: For production, verify the token signature/claims against your IdP
        // Here we minimally decode to extract claims. Replace with a call to your
        // verifier if available (e.g., verifyExternalToken(accessToken)).
        const claims = decodeJwtPayload(accessToken) || {};
        const sub = typeof claims.sub === "string" ? claims.sub : "unknown";
        const name: string =
          typeof (claims as Record<string, unknown>).FullNameAr === "string"
            ? ((claims as Record<string, unknown>).FullNameAr as string)
            : typeof claims.name === "string"
            ? (claims.name as string)
            : "Mobile User";
        const email = typeof claims.email === "string" ? (claims.email as string) : undefined;
        const emiratesId = normalizeEmiratesId(
          (claims as Record<string, unknown>).EmiratesId ?? claims.EID
        );

        const user: User & { accessToken?: string; emiratesId?: string } = {
          id: sub,
          name,
          email,
          accessToken,
          emiratesId,
        };
        return user;
      },
    }),
  ],

 

  callbacks: {
    async jwt({ token, account, user }): Promise<JWT> {
      // Helper to store large secrets in Redis and keep only a reference in the JWT
      async function persistAccessToken(accessToken: string | undefined, subject?: string): Promise<string | undefined> {
        if (!accessToken) return undefined;
        try {
          const key = `na:at:${subject ?? token.sub ?? "anon"}:${crypto.randomBytes(8).toString("hex")}`;
          const ttlSeconds = 24 * 60 * 60; // match session.maxAge
          await redis.set(key, accessToken, "EX", ttlSeconds);
          return key;
        } catch {
          // If Redis fails, we will NOT attach the raw access token to JWT to avoid large cookies
          return undefined;
        }
      }
      // From OIDC flow
      if (account?.access_token) {
        const t = token as JWT & { emiratesId?: string; atKey?: string; idTokenKey?: string };
        // Store access token in Redis and keep only a small key reference in JWT
        t.atKey = await persistAccessToken(account.access_token, token.sub as string | undefined);
        // Persist id_token if available and extract claims we care about
        if (account.id_token) {
          // Store id_token in Redis for logout
          t.idTokenKey = await persistAccessToken(account.id_token, token.sub as string | undefined);
          const idClaims = decodeJwtPayload(account.id_token) || {};
          const maybeEmiratesId = extractEmiratesId(idClaims as Record<string, unknown>);
          if (maybeEmiratesId) t.emiratesId = normalizeEmiratesId(maybeEmiratesId);
          // If token doesn't have sub/name/email yet, hydrate from id_token claims
          token.sub = token.sub || (idClaims.sub as string | undefined);
          if (!t.name && typeof idClaims.name === "string") t.name = idClaims.name as string;
          if (!t.email && typeof idClaims.email === "string") t.email = idClaims.email as string;
        }
        // Some IdPs include custom claims in access_token instead; try as a fallback
        if (!t.emiratesId) {
          const atClaims = decodeJwtPayload(account.access_token) || {};
          const maybeEmiratesId = extractEmiratesId(atClaims as Record<string, unknown>);
          if (maybeEmiratesId) t.emiratesId = normalizeEmiratesId(maybeEmiratesId);
        }
      }
      // From mobile-token (credentials) flow
      if (user) {
        const u = user as User & { accessToken?: string; emiratesId?: string };
        const t = token as JWT & { emiratesId?: string; atKey?: string };
        if (u.accessToken) {
          t.atKey = await persistAccessToken(u.accessToken, token.sub as string | undefined);
        }
        t.emiratesId = normalizeEmiratesId(u.emiratesId) || t.emiratesId;
      }
      return token;
    },

    async session({ session, token }): Promise<Session> {
  const t = token as JWT & { emiratesId?: string; sub?: string; atKey?: string };
      
      // Only expose essential user information in the session to keep cookie size small
      // Access tokens and large objects should be accessed via server-side API calls when needed
      const u = (session.user ?? {}) as User & { id?: string; emiratesId?: string };
      if (t.sub) u.id = t.sub;
      if (t.emiratesId) u.emiratesId = normalizeEmiratesId(t.emiratesId);
  // Keep standard small profile fields
  const name = (t as Partial<JWT>).name as unknown;
  const email = (t as Partial<JWT> & { email?: unknown }).email;
  if (typeof name === 'string') u.name = name;
  if (typeof email === 'string') u.email = email;
      
      session.user = u;
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Support custom logout flow via /api/auth/logout or /api/auth/signout
      if (url === "/api/auth/logout" || url === "/api/auth/signout") {
        // Use OIDC end session endpoint: /connect/endsession
        const logoutBase = process.env.OIDC_LOGOUT_URL || (OIDC_ISSUER ? `${OIDC_ISSUER.replace(/\/$/, "")}/connect/endsession` : "");
        const returnTo = process.env.OIDC_LOGOUT_RETURN_TO || `${baseUrl}/login`;
        
        if (logoutBase) {
          // Build OIDC logout URL with id_token_hint and post_logout_redirect_uri
          const params = new URLSearchParams();
          params.set('post_logout_redirect_uri', returnTo);
          
          // Note: id_token_hint will be appended by the logout button since we need access to the session
          return `${logoutBase}?${params.toString()}`;
        }
        // Fallback to login page
        return `${baseUrl}/login`;
      }

      // Allow absolute URLs
      if (url.startsWith("http")) return url;
      return `${baseUrl}${url}`;
    },
  },

  // Clean up server-stored secrets on sign-out when possible
  events: {
    async signOut({ token }) {
      const t = token as JWT & { atKey?: string; idTokenKey?: string };
      const keysToDelete = [];
      if (t?.atKey) keysToDelete.push(t.atKey);
      if (t?.idTokenKey) keysToDelete.push(t.idTokenKey);
      
      if (keysToDelete.length > 0) {
        try {
          await redis.del(...keysToDelete);
        } catch {
          // non-fatal
        }
      }
    },
  },

  debug: true,
  // debug: process.env.NODE_ENV !== "production",
};
