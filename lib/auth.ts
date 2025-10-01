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
      scope: "openid profile",
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

// Try to pull emiratesId/EID from a JWT claims object regardless of naming/namespace
function extractEmiratesId(claims?: Record<string, unknown>): string | undefined {
  if (!claims) return undefined;
  const direct = (claims.emiratesId || claims.EID) as string | undefined;
  if (direct) return direct;
  // Search namespaced/custom claim keys, case-insensitive match for emiratesId/EID
  for (const [k, v] of Object.entries(claims)) {
    const key = k.toLowerCase();
    if ((key.endsWith("/emiratesid") || key === "emiratesid" || key === "eid") && typeof v === "string") {
      return v;
    }
  }
  return undefined;
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
        const emiratesId = claims.emiratesId || claims.EID;

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

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, account, user }): Promise<JWT> {
      // From OIDC flow
      if (account?.access_token) {
        const t = token as JWT & { accessToken?: string; idToken?: string; emiratesId?: string };
        t.accessToken = account.access_token;
        // Persist id_token if available and extract claims we care about
        if (account.id_token) {
          t.idToken = account.id_token;
          const idClaims = decodeJwtPayload(account.id_token) || {};
          const maybeEmiratesId = extractEmiratesId(idClaims as Record<string, unknown>);
          if (maybeEmiratesId) t.emiratesId = maybeEmiratesId;
          // If token doesn't have sub/name/email yet, hydrate from id_token claims
          token.sub = token.sub || (idClaims.sub as string | undefined);
          if (!t.name && typeof idClaims.name === "string") t.name = idClaims.name as string;
          if (!t.email && typeof idClaims.email === "string") t.email = idClaims.email as string;
        }
        // Some IdPs include custom claims in access_token instead; try as a fallback
        if (!t.emiratesId) {
          const atClaims = decodeJwtPayload(account.access_token) || {};
          const maybeEmiratesId = extractEmiratesId(atClaims as Record<string, unknown>);
          if (maybeEmiratesId) t.emiratesId = maybeEmiratesId;
        }
      }
      // From mobile-token (credentials) flow
      if (user) {
        const u = user as User & { accessToken?: string; emiratesId?: string };
        const t = token as JWT & { accessToken?: string; emiratesId?: string };
        t.accessToken = u.accessToken || t.accessToken;
        t.emiratesId = u.emiratesId || t.emiratesId;
      }
      return token;
    },

    async session({ session, token }): Promise<Session> {
      const t = token as JWT & { accessToken?: string; idToken?: string; emiratesId?: string; sub?: string };
      // Attach custom fields to session for client-side access
      (session as Session & { accessToken?: string; idToken?: string }).accessToken = t.accessToken;
      (session as Session & { accessToken?: string; idToken?: string }).idToken = t.idToken;
      const u = (session.user ?? {}) as User & { id?: string; emiratesId?: string };
      if (t.sub) u.id = t.sub;
      if (t.emiratesId) u.emiratesId = t.emiratesId;
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
