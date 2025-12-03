import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getToken } from 'next-auth/jwt';

const OIDC_ISSUER = process.env.OIDC_ISSUER || process.env.AUTH0_ISSUER || "";

export async function GET(req: NextRequest) {
  try {
    // Get the session token to retrieve id_token
    const token = await getToken({ 
      req: req as any,
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    const baseUrl = process.env.NEXTAUTH_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const logoutBase = process.env.OIDC_LOGOUT_URL || (OIDC_ISSUER ? `${OIDC_ISSUER.replace(/\/$/, "")}/connect/endsession` : "");
    const returnTo = process.env.OIDC_LOGOUT_RETURN_TO || `${baseUrl}/login`;
    
    if (!logoutBase) {
      // No OIDC logout URL configured, just redirect to login
      return NextResponse.redirect(new URL('/login', baseUrl));
    }

    // Build logout URL with id_token_hint if available
    const params = new URLSearchParams();
    params.set('post_logout_redirect_uri', returnTo);
    
    // Add id_token_hint from the token if available
    const extendedToken = token as any;
    if (extendedToken?.idTokenKey) {
      const { getIdTokenFromKey } = await import('@/lib/auth');
      const idToken = await getIdTokenFromKey(extendedToken.idTokenKey);
      if (idToken) {
        params.set('id_token_hint', idToken);
      }
    }
    
    const logoutUrl = `${logoutBase}?${params.toString()}`;
    
    // Clear NextAuth session cookies before redirecting
    const response = NextResponse.redirect(logoutUrl);
    
    // Clear session cookies
    response.cookies.delete('next-auth.session-token');
    response.cookies.delete('__Secure-next-auth.session-token');
    response.cookies.delete('next-auth.csrf-token');
    response.cookies.delete('__Secure-next-auth.csrf-token');
    response.cookies.delete('next-auth.callback-url');
    response.cookies.delete('__Secure-next-auth.callback-url');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:4200';
    return NextResponse.redirect(new URL('/login', baseUrl));
  }
}
