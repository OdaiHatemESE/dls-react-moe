import type { NextAuthOptions, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Auth0Provider from "next-auth/providers/auth0";
import Credentials from "next-auth/providers/credentials";

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

async function fetchIdentityProfile(
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

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
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
        const sub = claims.sub || "unknown";
        const name = claims.name || "Mobile User";
        const email = claims.email as string | undefined;
  const emiratesId = normalizeEmiratesId(claims.emiratesId || claims.EID);

        return {
          id: sub,
          name,
          email,
          accessToken,
          emiratesId,
        };
      },
    }),
  ],

 

  callbacks: {
    async jwt({ token, account, user }): Promise<JWT> {
      // From OIDC flow
      if (account?.access_token) {
        const t = token as JWT & { accessToken?: string; idToken?: string; emiratesId?: string; identityProfile?: Record<string, unknown> };
        t.accessToken = account.access_token;
        // Persist id_token if available and extract claims we care about
        if (account.id_token) {
          t.idToken = account.id_token;
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

        // Fetch identity profile once per login (avoid re-fetch if already present on token)
        if (!t.identityProfile) {
          t.identityProfile = await fetchIdentityProfile(t.accessToken) || undefined;
        }
      }
      // From mobile-token (credentials) flow
      if (user) {
        const u = user as User & { accessToken?: string; emiratesId?: string };
        const t = token as JWT & { accessToken?: string; emiratesId?: string; identityProfile?: Record<string, unknown> };
        t.accessToken = u.accessToken || t.accessToken;
        t.emiratesId = normalizeEmiratesId(u.emiratesId) || t.emiratesId;

        // If we have an access token from mobile, try to fetch identity profile once
        if (t.accessToken && !t.identityProfile) {
          t.identityProfile = await fetchIdentityProfile(t.accessToken) || undefined;
        }
      }
      return token;
    },

    async session({ session, token }): Promise<Session> {
      const t = token as JWT & { accessToken?: string; idToken?: string; emiratesId?: string; sub?: string; identityProfile?: Record<string, unknown> };
      // Attach custom fields to session for client-side access
      (session as Session & { accessToken?: string; idToken?: string }).accessToken = t.accessToken;
      (session as Session & { accessToken?: string; idToken?: string }).idToken = t.idToken;
      // Expose identity profile on the session
      (session as Session & { identityProfile?: Record<string, unknown> }).identityProfile = t.identityProfile;
      const u = (session.user ?? {}) as User & { id?: string; emiratesId?: string };
      if (t.sub) u.id = t.sub;
      if (t.emiratesId) u.emiratesId = normalizeEmiratesId(t.emiratesId);
      session.user = u;
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Support custom logout flow via /api/auth/logout or /api/auth/signout
      if (url === "/api/auth/logout" || url === "/api/auth/signout") {
        const logoutBase = process.env.OIDC_LOGOUT_URL || (OIDC_ISSUER ? `${OIDC_ISSUER.replace(/\/$/, "")}/v2/logout` : "");
        const returnTo = process.env.OIDC_LOGOUT_RETURN_TO || baseUrl;
        if (logoutBase && OIDC_CLIENT_ID) {
          return `${logoutBase}?client_id=${encodeURIComponent(OIDC_CLIENT_ID)}&returnTo=${encodeURIComponent(returnTo)}`;
        }
        // Fallback to base sign-out
        return baseUrl;
      }

      // Allow absolute URLs
      if (url.startsWith("http")) return url;
      return `${baseUrl}${url}`;
    },
  },

  debug: true,
  // debug: process.env.NODE_ENV !== "production",
};
