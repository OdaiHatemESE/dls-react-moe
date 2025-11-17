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
  ];
  
  // Check if the origin matches any external domain
  const isExternalOrigin = externalDomains.some(domain => 
    requestOrigin.includes(domain)
  );
  
  // For external domains, use localhost; otherwise use the original origin
  if (isExternalOrigin) {
    const port = process.env.PORT || '4200';
    return `http://localhost:${port}`;
  }
  
  return requestOrigin;
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
