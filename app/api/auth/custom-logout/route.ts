import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getToken } from 'next-auth/jwt';

// Force dynamic rendering - never cache this endpoint
export const dynamic = 'force-dynamic';

const OIDC_ISSUER = process.env.OIDC_ISSUER || process.env.AUTH0_ISSUER || "";

export async function GET(req: NextRequest) {
  try {
    console.log('🔴 [LOGOUT] Step 1: Custom logout endpoint called');
    
    // Get the session token to retrieve id_token
    const token = await getToken({ 
      req: req as any,
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    console.log('🔴 [LOGOUT] Step 2: Token retrieved:', {
      hasToken: !!token,
      idTokenKey: (token as any)?.idTokenKey ? 'present' : 'missing'
    });
    
    const baseUrl = process.env.NEXTAUTH_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const logoutBase = 'https://stg-login.moe.gov.ae/connect/endsession';
    console.log('🔴 [LOGOUT] OIDC_ISSUER:', logoutBase);
    const returnTo = process.env.OIDC_LOGOUT_RETURN_TO || `${baseUrl}/signout`;
    
    console.log('🔴 [LOGOUT] Step 3: URLs configured:', {
      baseUrl,
      logoutBase,
      returnTo,
      OIDC_ISSUER
    });
    
    if (!logoutBase) {
      console.log('🔴 [LOGOUT] No logout URL configured, redirecting to /login');
      return NextResponse.redirect(new URL('/login', baseUrl));
    }

    // Build logout URL with id_token_hint if available
    const params = new URLSearchParams();
    params.set('post_logout_redirect_uri', returnTo);
    
    // Add id_token_hint from the token if available
    const extendedToken = token as any;
    if (extendedToken?.idTokenKey) {
      console.log('🔴 [LOGOUT] Step 4: Retrieving id_token from Redis...');
      const { getIdTokenFromKey } = await import('@/lib/auth');
      const idToken = await getIdTokenFromKey(extendedToken.idTokenKey);
      if (idToken) {
        params.set('id_token_hint', idToken);
        console.log('🔴 [LOGOUT] id_token added to params (first 50 chars):', idToken.substring(0, 50) + '...');
      } else {
        console.log('🔴 [LOGOUT] Warning: id_token not found in Redis');
      }
    } else {
      console.log('🔴 [LOGOUT] Warning: No idTokenKey in token');
    }
    
    const logoutUrl = `${logoutBase}?${params.toString()}`;
    console.log('🔴 [LOGOUT] Step 5: Full logout URL:', logoutUrl);
    console.log('🔴 [LOGOUT] logoutBase:', logoutBase);
    console.log('🔴 [LOGOUT] params:', params.toString());
    
    // Validate that logout URL is absolute and external
    if (!logoutUrl.startsWith('http://') && !logoutUrl.startsWith('https://')) {
      console.error('🔴 [LOGOUT] ERROR: Logout URL is not absolute:', logoutUrl);
      return NextResponse.redirect(new URL('/login', baseUrl));
    }
    
    // Clear NextAuth session cookies and use 307 redirect to external URL
    // CRITICAL: NextResponse.redirect with string URL is treated as relative
    // We must use NextResponse with proper headers for external redirect
    const response = NextResponse.redirect(new URL(logoutUrl), { status: 307 });

    
    // Clear session cookies
    response.cookies.delete('next-auth.session-token');
    response.cookies.delete('__Secure-next-auth.session-token');
    response.cookies.delete('next-auth.csrf-token');
    response.cookies.delete('__Secure-next-auth.csrf-token');
    response.cookies.delete('next-auth.callback-url');
    response.cookies.delete('__Secure-next-auth.callback-url');
    
    console.log('🔴 [LOGOUT] Step 6: Session cookies cleared, redirecting to OIDC provider at:', logoutUrl);
    
    return response;
  } catch (error) {
    console.error('🔴 [LOGOUT] ERROR:', error);
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:4200';
    return NextResponse.redirect(new URL('/login', baseUrl));
  }
}

