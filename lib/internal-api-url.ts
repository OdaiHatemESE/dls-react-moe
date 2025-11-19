/**
 * Utility to build internal API URLs for server-to-server calls within Next.js
 * 
 * Uses PUBLIC_URL or NEXTAUTH_URL environment variable to determine the base URL.
 * This is especially important when running behind a reverse proxy (IIS) where
 * the request URL might show localhost but the app is accessed via a public domain.
 * 
 * Priority order:
 * 1. PUBLIC_URL (explicit override for internal API calls)
 * 2. NEXTAUTH_URL (already configured for NextAuth)
 * 3. Request origin as fallback
 */

/**
 * Get the base URL for internal API calls
 * @param requestOrigin - The origin from the incoming request (fallback only)
 * @returns The base URL to use for internal API calls
 */
export function getInternalApiOrigin(requestOrigin?: string): string {
  // First priority: Explicit PUBLIC_URL for internal API calls
  if (process.env.PUBLIC_URL) {
    return process.env.PUBLIC_URL.replace(/\/$/, '');
  }
  
  // Second priority: NEXTAUTH_URL (already configured for auth)
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, '');
  }
  
  // Fallback: Use the request origin if provided
  if (requestOrigin) {
    return requestOrigin;
  }
  
  // Last resort: localhost with PORT
  const port = process.env.PORT || '4200';
  return `http://localhost:${port}`;
}

/**
 * Build an internal API URL for server-to-server calls
 * @param path - The API path (e.g., '/api/PP/student/123')
 * @param requestOrigin - Optional request origin as fallback
 * @returns The full URL for the internal API call
 */
export function buildInternalApiUrl(path: string, requestOrigin?: string): string {
  const origin = getInternalApiOrigin(requestOrigin);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${normalizedPath}`;
}
