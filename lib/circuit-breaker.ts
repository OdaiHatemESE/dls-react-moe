/**
 * Circuit Breaker Pattern for PP API Resilience
 * 
 * Prevents cascade failures by:
 * - Tracking failure rates
 * - Opening circuit after threshold failures
 * - Allowing periodic retry attempts
 * - Providing fast-fail responses when circuit is open
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Too many failures, requests fail immediately
 * - HALF_OPEN: Testing if service recovered, limited requests allowed
 */

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  
  /** Success rate threshold (0-1) to keep circuit closed */
  successThreshold: number;
  
  /** Time window to measure failures (ms) */
  timeout: number;
  
  /** Time to wait before attempting half-open (ms) */
  resetTimeout: number;
  
  /** Name for logging */
  name?: string;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  rejections: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  nextAttemptTime: number | null;
}

export class CircuitBreakerError extends Error {
  constructor(public readonly circuitName: string, public readonly stats: CircuitBreakerStats) {
    super(`Circuit breaker '${circuitName}' is OPEN - too many failures detected`);
    this.name = 'CircuitBreakerError';
  }
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private rejections: number = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private nextAttemptTime: number | null = null;
  private failureTimestamps: number[] = [];
  
  constructor(private options: CircuitBreakerOptions) {
    const name = options.name || 'unknown';
    console.log(`[Circuit Breaker: ${name}] Initialized`, {
      failureThreshold: options.failureThreshold,
      successThreshold: options.successThreshold,
      timeout: `${options.timeout}ms`,
      resetTimeout: `${options.resetTimeout}ms`,
    });
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();

    // Check if circuit should transition from OPEN to HALF_OPEN
    if (this.state === CircuitState.OPEN) {
      if (this.nextAttemptTime && now >= this.nextAttemptTime) {
        this.transitionToHalfOpen();
      } else {
        this.rejections++;
        throw new CircuitBreakerError(
          this.options.name || 'unknown',
          this.getStats()
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful request
   */
  private onSuccess() {
    this.successes++;
    this.lastSuccessTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      const successRate = this.calculateSuccessRate();
      if (successRate >= this.options.successThreshold) {
        this.transitionToClosed();
      }
    }
  }

  /**
   * Handle failed request
   */
  private onFailure() {
    const now = Date.now();
    this.failures++;
    this.lastFailureTime = now;
    this.failureTimestamps.push(now);

    // Remove old failures outside the time window
    this.failureTimestamps = this.failureTimestamps.filter(
      timestamp => now - timestamp < this.options.timeout
    );

    // Check if we should open the circuit
    if (this.failureTimestamps.length >= this.options.failureThreshold) {
      this.transitionToOpen();
    }
  }

  /**
   * Transition to CLOSED state
   */
  private transitionToClosed() {
    const name = this.options.name || 'unknown';
    console.log(`[Circuit Breaker: ${name}] HALF_OPEN → CLOSED (service recovered)`, {
      failures: this.failures,
      successes: this.successes,
      successRate: `${(this.calculateSuccessRate() * 100).toFixed(2)}%`,
    });

    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.rejections = 0;
    this.failureTimestamps = [];
    this.nextAttemptTime = null;
  }

  /**
   * Transition to OPEN state
   */
  private transitionToOpen() {
    const name = this.options.name || 'unknown';
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = Date.now() + this.options.resetTimeout;

    console.error(`[Circuit Breaker: ${name}] CLOSED → OPEN (too many failures)`, {
      failures: this.failureTimestamps.length,
      threshold: this.options.failureThreshold,
      timeWindow: `${this.options.timeout}ms`,
      nextAttempt: new Date(this.nextAttemptTime).toISOString(),
    });
  }

  /**
   * Transition to HALF_OPEN state
   */
  private transitionToHalfOpen() {
    const name = this.options.name || 'unknown';
    this.state = CircuitState.HALF_OPEN;
    this.failures = 0;
    this.successes = 0;

    console.log(`[Circuit Breaker: ${name}] OPEN → HALF_OPEN (testing service)`, {
      previousFailures: this.failureTimestamps.length,
      downtime: this.lastFailureTime ? `${Date.now() - this.lastFailureTime}ms` : 'N/A',
    });
  }

  /**
   * Calculate current success rate
   */
  private calculateSuccessRate(): number {
    const total = this.successes + this.failures;
    if (total === 0) return 1;
    return this.successes / total;
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      rejections: this.rejections,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttemptTime: this.nextAttemptTime,
    };
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Force reset circuit breaker (for testing/manual intervention)
   */
  reset() {
    const name = this.options.name || 'unknown';
    console.log(`[Circuit Breaker: ${name}] Manual reset`);
    
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.rejections = 0;
    this.failureTimestamps = [];
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.nextAttemptTime = null;
  }

  /**
   * Force open circuit (for maintenance)
   */
  forceOpen() {
    const name = this.options.name || 'unknown';
    console.warn(`[Circuit Breaker: ${name}] Forced OPEN (maintenance mode)`);
    
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = Date.now() + this.options.resetTimeout;
  }
}

// Pre-configured circuit breakers for different services
export const ppApiCircuitBreaker = new CircuitBreaker({
  name: 'PP-API',
  failureThreshold: 5,      // Open after 5 failures
  successThreshold: 0.8,    // Need 80% success rate to close
  timeout: 10000,           // Within 10 second window
  resetTimeout: 30000,      // Try again after 30 seconds
});

export const idhApiCircuitBreaker = new CircuitBreaker({
  name: 'IDH-API',
  failureThreshold: 3,      // More aggressive (IDH is critical)
  successThreshold: 0.9,    // Need 90% success
  timeout: 5000,            // 5 second window
  resetTimeout: 20000,      // 20 second cooldown
});

export const oneRosterCircuitBreaker = new CircuitBreaker({
  name: 'OneRoster-API',
  failureThreshold: 10,     // More tolerant
  successThreshold: 0.7,    // 70% success acceptable
  timeout: 30000,           // 30 second window
  resetTimeout: 60000,      // 1 minute cooldown
});

// Export circuit breaker class for custom instances
export { CircuitBreaker };
