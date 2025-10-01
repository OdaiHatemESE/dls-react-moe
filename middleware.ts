import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public, non-authenticated routes that should NOT trigger a redirect
  // Add any other public paths you want to allow here
  const publicRoutes = new Set<string>([
    "/", // Home page should be publicly accessible
    "/login", // Example public login landing page (if you add one)
  ]);

  if (publicRoutes.has(pathname)) {
    return NextResponse.next();
  }

  // Try to read the JWT session from cookies
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // If a session exists, continue
  if (token) return NextResponse.next();

  // Otherwise, redirect to a custom login page with callback to the current URL
  // Redirect directly to the OIDC provider via NextAuth sign-in endpoint
  const signinUrl = new URL("/api/auth/signin/oidc", req.url);
  signinUrl.searchParams.set("callbackUrl", req.nextUrl.href);
  return NextResponse.redirect(signinUrl);
}

// Protect everything except Next internals, images, and all API routes (including NextAuth routes)
export const config = {
  matcher: [
    // Exclude API routes, Next internals, favicon, and common static asset extensions
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|css|js|map)).*)",
  ],
};
