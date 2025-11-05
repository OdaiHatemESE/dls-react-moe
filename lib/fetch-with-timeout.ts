/**
 * Fetch wrapper with timeout support
 */

export class FetchTimeoutError extends Error {
  constructor(message: string, public readonly url: string, public readonly timeoutMs: number) {
    super(message);
    this.name = 'FetchTimeoutError';
  }
}

export interface FetchWithTimeoutOptions extends RequestInit {
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Fetch with timeout support
 * @param url - URL to fetch
 * @param options - Fetch options with optional timeoutMs
 * @returns Promise<Response>
 * @throws FetchTimeoutError if request times out
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new FetchTimeoutError(
        `Request timeout after ${timeoutMs}ms`,
        url,
        timeoutMs
      );
    }
    
    throw error;
  }
}
