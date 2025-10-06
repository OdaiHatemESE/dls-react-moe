import { getServerSession } from "next-auth";
import { authOptions, fetchIdentityProfile } from "./auth";
import { redis } from "./redis";
import type { JWT } from "next-auth/jwt";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

/**
 * Server-side utility to get the full JWT token with access tokens and identity profile
 * Use this when you need access to sensitive data that shouldn't be in the session cookie
 */
type Token = JWT & {
  accessToken?: string;
  idToken?: string;
  emiratesId?: string;
  identityProfile?: Record<string, unknown>;
};

export async function getServerToken(req?: NextRequest): Promise<Token | null> {
  if (req) {
    // For API routes or middleware
    const tok = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    return tok as Token | null;
  } else {
    // For server components
    const session = await getServerSession(authOptions);
    if (!session) return null;
    
    // This is a simplified approach - in a real app, you might want to store the token
    // in a secure server-side cache or database and retrieve it by session ID
    const tok = await getToken({ 
      // Minimal object to satisfy typing; we don't use cookies here
      req: { headers: { cookie: "" } } as unknown as NextRequest,
      secret: process.env.NEXTAUTH_SECRET 
    });
    return tok as Token | null;
  }
}

/**
 * Get the access token for making API calls to external services
 */
export async function getAccessToken(req?: NextRequest): Promise<string | null> {
  const token = await getServerToken(req);
  const atKey = (token as Token | null)?.atKey;
  if (!atKey) return null;
  try {
    const accessToken = await redis.get(atKey);
    return accessToken ?? null;
  } catch {
    return null;
  }
}

/**
 * Get the full identity profile for the current user
 */
export async function getIdentityProfile(req?: NextRequest): Promise<Record<string, unknown> | null> {
  const token = await getServerToken(req);
  if (!token) return null;
  // Legacy support if identityProfile was previously stored
  if (token.identityProfile) return token.identityProfile as Record<string, unknown>;
  const accessToken = await getAccessToken(req);
  if (accessToken) return await fetchIdentityProfile(accessToken);
  return null;
}