/**
 * Utility to build internal API URLs that work on both dev and staging/production
 * 
 * On staging/production servers, using the external domain for internal API calls
 * can fail due to:
 * - DNS loopback issues (server can't resolve its own external domain)
 * - SSL certificate validation failures
 * - Network configuration restrictions
 * 
 * This helper uses localhost for same-server API calls when running on
 * known production/staging domains.
 */

/**
 * Get the appropriate origin URL for internal API calls
 * @param requestOrigin - The origin from the incoming request
 * @returns The origin to use for internal API calls (localhost on prod/staging)
 */
export function getInternalApiOrigin(requestOrigin: string): string {
  // List of external domains that should use localhost for internal calls
  const externalDomains = [
    'parent-stg.moe.gov.ae',
    'parent.moe.gov.ae',
    'moe.gov.ae', // Catch any subdomain
  ];
  
  // Always use localhost for same-server API calls to avoid DNS/network issues
  // Only use the original origin if it's already localhost/127.0.0.1
  const isLocalhost = requestOrigin.includes('localhost') || 
                      requestOrigin.includes('127.0.0.1');
  
  if (isLocalhost) {
    return requestOrigin;
  }
  
  // For all non-localhost origins, use localhost to avoid loopback issues
  // This is safe because these are internal API calls on the same server
  const port = process.env.PORT || '4200';
  return `http://localhost:${port}`;
}

/**
 * Build an internal API URL
 * @param requestOrigin - The origin from the incoming request
 * @param path - The API path (should start with /)
 * @returns The full URL for the internal API call
 */
export function buildInternalApiUrl(requestOrigin: string, path: string): string {
  const origin = getInternalApiOrigin(requestOrigin);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${normalizedPath}`;
}
