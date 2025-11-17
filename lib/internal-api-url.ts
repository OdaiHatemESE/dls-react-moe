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
  
  // Always use HTTP localhost for same-server API calls to avoid DNS/SSL issues
  // Even if the request origin is localhost, normalize to HTTP to prevent SSL errors
  const isLocalhost = requestOrigin.includes('localhost') || 
                      requestOrigin.includes('127.0.0.1');
  
  // For all origins (localhost or external), use HTTP localhost for internal calls
  // This prevents SSL certificate issues and DNS loopback problems
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
