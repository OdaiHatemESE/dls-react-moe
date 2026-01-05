/**
 * IDH Request Queue Manager
 * 
 * Prevents 429 rate limiting errors by:
 * - Limiting concurrent requests
 * - Implementing exponential backoff
 * - Queueing requests when limits are reached
 * - Tracking request metrics for monitoring
 */

import PQueue from 'p-queue';
import pRetry, { AbortError } from 'p-retry';
import { FetchTimeoutError } from './fetch-with-timeout';
import { resilienceStorage } from './resilience-storage';

// Configuration based on observed IDH API limits
const IDH_QUEUE_CONFIG = {
  // Maximum concurrent requests to IDH API
  concurrency: 3, // Conservative: allows 3 parallel requests max
  
  // Request interval (minimum time between starting requests)
  intervalCap: 5,     // Max 5 requests...
  interval: 1000,     // ...per 1 second (5 req/s)
  
  // Queue timeout
  timeout: 30000, // 30 seconds max in queue before failing
} as const;

// Retry configuration for failed requests
const IDH_RETRY_CONFIG = {
  retries: 2, // Reduced from 3 to prevent queue timeout
  factor: 2, // Exponential backoff factor
  minTimeout: 1000, // Increased from 500ms
  maxTimeout: 3000, // Reduced from 5000ms to prevent timeout stacking
  randomize: true, // Add jitter to prevent thundering herd
  
  // Only retry on rate limit or transient errors
  onFailedAttempt: (error: any) => {
    const status = error?.response?.status || error?.status;
    console.warn(`[IDH Queue] Retry attempt ${error.attemptNumber} failed:`, {
      status,
      retriesLeft: error.retriesLeft,
      message: error.message,
    });
  },
} as const;

/**
 * Singleton queue instance for IDH requests
 * Ensures all IDH API calls go through a single bottleneck
 */
class IdhQueueManager {
  private queue: PQueue;
  private metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    retriedRequests: 0,
    queuedRequests: 0,
    rateLimitHits: 0,
    lastResetTime: Date.now(),
  };

  constructor() {
    this.queue = new PQueue({
      concurrency: IDH_QUEUE_CONFIG.concurrency,
      intervalCap: IDH_QUEUE_CONFIG.intervalCap,
      interval: IDH_QUEUE_CONFIG.interval,
      timeout: IDH_QUEUE_CONFIG.timeout,
      throwOnTimeout: true,
    });

    // Log queue status periodically in development
    if (process.env.NODE_ENV !== 'production') {
      setInterval(() => {
        if (this.queue.size > 0 || this.queue.pending > 0) {
          console.log('[IDH Queue] Status:', {
            queued: this.queue.size,
            pending: this.queue.pending,
            ...this.getMetrics(),
          });
        }
      }, 5000);
    }
  }

  /**
   * Execute an IDH API request through the queue with retry logic
   */
  async execute<T>(
    requestFn: () => Promise<T>,
    options: {
      studentId?: string;
      priority?: number; // Higher = executed first (0-10)
    } = {}
  ): Promise<T> {
    const { studentId, priority = 5 } = options;
    
    this.metrics.totalRequests++;
    this.metrics.queuedRequests = this.queue.size;

    const startTime = Date.now();
    const queueStartSize = this.queue.size;
    const queueStartPending = this.queue.pending;
    
    console.log('[IDH Queue] Request starting', {
      studentId,
      queueSize: queueStartSize,
      pending: queueStartPending,
      totalRequests: this.metrics.totalRequests,
    });

    try {
      const result = await this.queue.add(
        () => pRetry(
          async () => {
            try {
              return await requestFn();
            } catch (error: any) {
              const status = error?.response?.status || error?.status;
              
              // Track rate limit hits
              if (status === 429) {
                this.metrics.rateLimitHits++;
                console.warn('[IDH Queue] Rate limit hit - will retry', {
                  studentId,
                  waitTime: `${(Date.now() - startTime) / 1000}s`,
                });
              }
              
              // Don't retry timeout errors - fail fast
              if (error instanceof FetchTimeoutError) {
                console.warn('[IDH Queue] Request timeout - not retrying', {
                  studentId,
                  timeout: error.timeoutMs,
                });
                throw new AbortError(error.message);
              }
              
              // Only retry on rate limits and 5xx errors
              if (status === 429 || (status >= 500 && status < 600)) {
                this.metrics.retriedRequests++;
                throw error; // Will trigger retry
              }
              
              // Don't retry client errors (4xx except 429)
              if (status >= 400 && status < 500) {
                throw new AbortError(error.message);
              }
              
              throw error;
            }
          },
          IDH_RETRY_CONFIG
        ),
        { priority }
      );

      this.metrics.successfulRequests++;
      
      const duration = Date.now() - startTime;
      if (duration > 5000) {
        console.warn('[IDH Queue] Slow request detected', {
          studentId,
          duration: `${duration}ms`,
          queueWait: `${duration - (Date.now() - startTime)}ms`,
        });
      }

      return result as T;
    } catch (error: any) {
      this.metrics.failedRequests++;
      const duration = Date.now() - startTime;
      
      console.error('[IDH Queue] Request failed after retries', {
        studentId,
        error: error.message,
        errorType: error.name,
        duration: `${duration}ms`,
        queueSizeAtStart: queueStartSize,
        queueSizeNow: this.queue.size,
        metrics: this.getMetrics(),
      });
      throw error;
    }
  }

  /**
   * Execute multiple IDH requests with smart batching
   * Automatically manages queue to prevent overwhelming the API
   */
  async executeMany<T>(
    requests: Array<{
      fn: () => Promise<T>;
      studentId?: string;
      priority?: number;
    }>
  ): Promise<Array<{ success: boolean; data?: T; error?: Error }>> {
    console.log(`[IDH Queue] Batch executing ${requests.length} requests`);
    
    const results = await Promise.allSettled(
      requests.map(req => 
        this.execute(req.fn, {
          studentId: req.studentId,
          priority: req.priority,
        })
      )
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return { success: true, data: result.value };
      } else {
        console.error(`[IDH Queue] Batch item ${index} failed:`, {
          studentId: requests[index].studentId,
          error: result.reason?.message,
        });
        return { success: false, error: result.reason };
      }
    });
  }

  /**
   * Get current queue metrics for monitoring
   */
  getMetrics() {
    const uptime = Date.now() - this.metrics.lastResetTime;
    const metrics = {
      ...this.metrics,
      uptimeMs: uptime,
      successRate: this.metrics.totalRequests > 0
        ? ((this.metrics.successfulRequests / this.metrics.totalRequests) * 100).toFixed(2) + '%'
        : 'N/A',
      currentQueueSize: this.queue.size,
      currentPending: this.queue.pending,
    };
    
    // Periodically persist to database (every 50 requests)
    if (this.metrics.totalRequests % 50 === 0 && this.metrics.totalRequests > 0) {
      resilienceStorage.saveQueueSnapshot('IDH-Queue', metrics).catch((err) => {
        console.error('[IDH Queue] Failed to persist metrics:', err);
      });
    }
    
    return metrics;
  }

  /**
   * Reset metrics (useful for testing or periodic resets)
   */
  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retriedRequests: 0,
      queuedRequests: 0,
      rateLimitHits: 0,
      lastResetTime: Date.now(),
    };
  }

  /**
   * Pause queue (for maintenance)
   */
  pause() {
    this.queue.pause();
    console.log('[IDH Queue] Paused');
  }

  /**
   * Resume queue
   */
  resume() {
    this.queue.start();
    console.log('[IDH Queue] Resumed');
  }

  /**
   * Clear pending queue (emergency measure)
   */
  clear() {
    this.queue.clear();
    console.warn('[IDH Queue] Cleared all pending requests');
  }
}

// Export singleton instance
export const idhQueue = new IdhQueueManager();

// Export for testing/monitoring
export { IdhQueueManager };
