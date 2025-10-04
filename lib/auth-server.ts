import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import type { JWT } from "next-auth/jwt";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

/**
 * Server-side utility to get the full JWT token with access tokens and identity profile
 * Use this when you need access to sensitive data that shouldn't be in the session cookie
 */
export async function getServerToken(req?: NextRequest): Promise<(JWT & { 
  accessToken?: string; 
  idToken?: string; 
  emiratesId?: string; 
  identityProfile?: Record<string, unknown>;
}) | null> {
  if (req) {
    // For API routes or middleware
    return await getToken({ req, secret: process.env.NEXTAUTH_SECRET }) as any;
  } else {
    // For server components
    const session = await getServerSession(authOptions);
    if (!session) return null;
    
    // This is a simplified approach - in a real app, you might want to store the token
    // in a secure server-side cache or database and retrieve it by session ID
    return await getToken({ 
      req: { headers: { cookie: "" } } as any, 
      secret: process.env.NEXTAUTH_SECRET 
    }) as any;
  }
}

/**
 * Get the access token for making API calls to external services
 */
export async function getAccessToken(req?: NextRequest): Promise<string | null> {
  const token = await getServerToken(req);
  return token?.accessToken || null;
}

/**
 * Get the full identity profile for the current user
 */
export async function getIdentityProfile(req?: NextRequest): Promise<Record<string, unknown> | null> {
  const token = await getServerToken(req);
  return token?.identityProfile || null;
}