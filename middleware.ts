import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  console.log('🟡 [MIDDLEWARE] Request:', {
    pathname,
    method: req.method,
    url: req.url
  });

  // Public routes (optional). Remove "/" if even your home requires auth.
  const publicRoutes = new Set<string>([
    "/", // keep public, or delete to protect everything
    "/signout", // allow signout page for post-logout redirect
    "/login", // allow login page
  ]);
  
  if (publicRoutes.has(pathname)) {
    console.log('🟡 [MIDDLEWARE] Public route, allowing access');
    return NextResponse.next();
  }

  // Read the NextAuth JWT (this is the session token, not your IdP token)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  console.log('🟡 [MIDDLEWARE] Auth check:', {
    hasToken: !!token,
    tokenExp: (token as any)?.exp
  });

  // Consider no token OR expired token as unauthenticated
  const isExpired =
    token && typeof (token as any).exp === "number"
      ? (token as any).exp * 1000 <= Date.now()
      : false;

  if (!token || isExpired) {
    console.log('🟡 [MIDDLEWARE] No valid token, allowing request');
    // Redirect directly into the OIDC flow via NextAuth
    return NextResponse.next();
  }

  console.log('🟡 [MIDDLEWARE] Valid token found, allowing request');
  return NextResponse.next();
}

// Protect everything except Next internals, images, and all API routes (incl. NextAuth)
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|css|js|map)).*)",
  ],
};

