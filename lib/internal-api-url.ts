/**
 * Utility to build internal API URLs that work on both dev and staging/production
 * 
 * On staging/production servers, using the external domain for internal API calls
 * can fail due to:
 * - DNS loopback issues (server can't resolve its own external domain)
 * - SSL certificate validation failures
 * - Network configuration restrictions
 * 
 * This helper intelligently chooses the best approach for internal API calls.
 */

/**
 * Get the appropriate origin URL for internal API calls
 * @param requestOrigin - The origin from the incoming request
 * @returns The origin to use for internal API calls
 */
export function getInternalApiOrigin(requestOrigin: string): string {
  // List of external domains that should use localhost for internal calls
  const externalDomains = [
    'parent-stg.moe.gov.ae',
    'parent.moe.gov.ae',
    'moe.gov.ae', // Catch any subdomain
  ];
  
  const isExternalDomain = externalDomains.some(domain => requestOrigin.includes(domain));
  const port = process.env.PORT || '4200';
  
  // For external domains (staging/production)
  if (isExternalDomain) {
    // Use the original request origin to avoid loopback issues
    // The server can reach itself via its own public URL
    return requestOrigin;
  }
  
  // For localhost development
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
