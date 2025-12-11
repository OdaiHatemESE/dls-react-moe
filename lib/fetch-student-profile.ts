/**
 * Shared utility for fetching student profile data from PP API
 * with timeout, retry, circuit breaker, and consistent error handling
 */

import type { StudentProfileV1 } from '@/app/types/studentprofile';
import { fetchWithTimeout, FetchTimeoutError } from './fetch-with-timeout';
import { ppApiCircuitBreaker, CircuitBreakerError } from './circuit-breaker';

export type StudentProfileFetchResult =
  | { ok: true; profile: StudentProfileV1 }
  | { ok: false; status: number; message: string };

export interface FetchStudentProfileOptions {
  /** Origin URL (e.g., https://example.com) */
  origin: string;
  /** Student person ID */
  studentPersonId: string;
  /** Cookie header to forward */
  cookieHeader?: string;
  /** Request timeout in milliseconds (default: 15000) */
  timeoutMs?: number;
  /** Number of retry attempts (default: 1) */
  retries?: number;
}

const DEFAULT_TIMEOUT_MS = 15000; // 15 seconds
const DEFAULT_RETRIES = 1;
const RETRY_DELAY_MS = 500;

/**
 * Fetches student profile from PP API with timeout and retry support
 */
export async function fetchStudentProfile(
  options: FetchStudentProfileOptions
): Promise<StudentProfileFetchResult> {
  const {
    origin,
    studentPersonId,
    cookieHeader,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
  } = options;

  // Use PUBLIC_URL or NEXTAUTH_URL for internal API calls
  const internalApiBaseUrl = process.env.PUBLIC_URL || process.env.NEXTAUTH_URL || origin || 'http://localhost:4200';
  const url = `${internalApiBaseUrl}/api/PP/student/${encodeURIComponent(studentPersonId)}`;
  let lastError: Error | null = null;

  // Debug logging to help diagnose staging issues
  console.log('[fetchStudentProfile] Request origin:', origin);
  console.log('[fetchStudentProfile] Resolved URL:', url);
  console.log('[fetchStudentProfile] NODE_ENV:', process.env.NODE_ENV);
  console.log('[fetchStudentProfile] PORT env:', process.env.PORT);

  // Wrap entire fetch logic in circuit breaker
  try {
    return await ppApiCircuitBreaker.execute(async () => {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const headers: Record<string, string> = {};
          if (cookieHeader) {
            headers.cookie = cookieHeader;
          }

          const studentRes = await fetchWithTimeout(url, {
            headers,
            cache: 'no-store',
            timeoutMs,
          });

      if (studentRes.ok) {
        const data = (await studentRes.json()) as StudentProfileV1;
        return { ok: true, profile: data };
      }

      // Non-2xx response
      const errorBody = await studentRes.json().catch(() => null);
      
      // Extract detailed error message
      let message: string;
      if (errorBody && typeof errorBody === 'object' && errorBody !== null && 'error' in errorBody) {
        message = typeof (errorBody as { error?: unknown }).error === 'string'
          ? (errorBody as { error: string }).error
          : JSON.stringify(errorBody);
      } else {
        message = `PP student fetch failed with status ${studentRes.status}`;
      }

      // Log for debugging
      console.error('Student profile fetch error:', {
        status: studentRes.status,
        url,
        attempt: attempt + 1,
        maxAttempts: retries + 1,
        errorBody,
      });

      // Don't retry client errors (4xx)
      if (studentRes.status >= 400 && studentRes.status < 500) {
        return { ok: false, status: studentRes.status, message };
      }

      // Retry server errors (5xx)
      lastError = new Error(message);
      
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
        continue;
      }

      return { ok: false, status: studentRes.status, message };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Log timeout errors for debugging
      if (error instanceof FetchTimeoutError) {
        console.error('Student profile fetch timeout:', {
          url,
          attempt: attempt + 1,
          maxAttempts: retries + 1,
          timeoutMs,
        });

        // Retry timeout errors (changed behavior)
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
          continue;
        }

        // Final attempt failed due to timeout
        return {
          ok: false,
          status: 504,
          message: `Student profile request timed out after ${timeoutMs}ms (${retries + 1} attempts)`,
        };
      }

      // Retry network errors
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
        continue;
      }

      return {
        ok: false,
        status: 502,
        message: 'Failed to reach PP student profile endpoint',
      };
    }
  }

      // Should not reach here, but handle edge case
      return {
        ok: false,
        status: 502,
        message: lastError?.message ?? 'Unknown error fetching student profile',
      };
    });
  } catch (error) {
    // Handle circuit breaker open state
    if (error instanceof CircuitBreakerError) {
      console.error('[fetchStudentProfile] Circuit breaker open:', {
        state: error.stats.state,
        nextAttempt: error.stats.nextAttemptTime,
      });
      return {
        ok: false,
        status: 503,
        message: 'Student service temporarily unavailable. Please try again shortly.',
      };
    }
    throw error;
  }
}
