/**
 * Centralized Metrics Tracking for API Resilience
 * 
 * Tracks request metrics across all endpoints to provide:
 * - Success/failure rates
 * - Response time percentiles
 * - Timeout patterns
 * - Retry effectiveness
 */

export interface EndpointMetrics {
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  timeouts: number;
  retries: number;
  retrySuccesses: number;
  circuitBreakerRejections: number;
  responseTimes: number[]; // Store last 1000 for percentile calculation
  lastRequest: number;
  lastFailure: number | null;
  errors: {
    [statusCode: string]: number;
  };
}

export interface MetricsSummary {
  totalRequests: number;
  successRate: string;
  averageResponseTime: string;
  p95ResponseTime: string;
  p99ResponseTime: string;
  retrySuccessRate: string;
  topErrors: Array<{ status: string; count: number }>;
}

class MetricsTracker {
  private endpoints: Map<string, EndpointMetrics> = new Map();
  private maxResponseTimesSamples = 1000; // Keep last 1000 response times

  /**
   * Record a request for an endpoint
   */
  recordRequest(endpoint: string, success: boolean, responseTimeMs: number, metadata?: {
    timeout?: boolean;
    retry?: boolean;
    retrySuccess?: boolean;
    circuitBreakerRejection?: boolean;
    statusCode?: number;
  }) {
    const metrics = this.getOrCreateMetrics(endpoint);

    metrics.totalRequests++;
    metrics.lastRequest = Date.now();

    if (success) {
      metrics.successfulRequests++;
    } else {
      metrics.failedRequests++;
      metrics.lastFailure = Date.now();
    }

    // Track response time
    metrics.responseTimes.push(responseTimeMs);
    if (metrics.responseTimes.length > this.maxResponseTimesSamples) {
      metrics.responseTimes.shift(); // Remove oldest
    }

    // Track specific error types
    if (metadata?.timeout) {
      metrics.timeouts++;
    }

    if (metadata?.retry) {
      metrics.retries++;
      if (metadata.retrySuccess) {
        metrics.retrySuccesses++;
      }
    }

    if (metadata?.circuitBreakerRejection) {
      metrics.circuitBreakerRejections++;
    }

    if (metadata?.statusCode && !success) {
      const statusKey = metadata.statusCode.toString();
      metrics.errors[statusKey] = (metrics.errors[statusKey] || 0) + 1;
    }
  }

  /**
   * Get metrics for a specific endpoint
   */
  getEndpointMetrics(endpoint: string): EndpointMetrics | null {
    return this.endpoints.get(endpoint) || null;
  }

  /**
   * Get all endpoint metrics
   */
  getAllMetrics(): Map<string, EndpointMetrics> {
    return new Map(this.endpoints);
  }

  /**
   * Get summary statistics for an endpoint
   */
  getEndpointSummary(endpoint: string): MetricsSummary | null {
    const metrics = this.endpoints.get(endpoint);
    if (!metrics) return null;

    return this.calculateSummary(metrics);
  }

  /**
   * Get summary for all endpoints combined
   */
  getGlobalSummary(): MetricsSummary {
    const combined: EndpointMetrics = {
      endpoint: 'global',
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      timeouts: 0,
      retries: 0,
      retrySuccesses: 0,
      circuitBreakerRejections: 0,
      responseTimes: [],
      lastRequest: 0,
      lastFailure: null,
      errors: {},
    };

    for (const metrics of this.endpoints.values()) {
      combined.totalRequests += metrics.totalRequests;
      combined.successfulRequests += metrics.successfulRequests;
      combined.failedRequests += metrics.failedRequests;
      combined.timeouts += metrics.timeouts;
      combined.retries += metrics.retries;
      combined.retrySuccesses += metrics.retrySuccesses;
      combined.circuitBreakerRejections += metrics.circuitBreakerRejections;
      combined.responseTimes.push(...metrics.responseTimes);
      combined.lastRequest = Math.max(combined.lastRequest, metrics.lastRequest);
      
      if (metrics.lastFailure) {
        combined.lastFailure = combined.lastFailure 
          ? Math.max(combined.lastFailure, metrics.lastFailure)
          : metrics.lastFailure;
      }

      for (const [status, count] of Object.entries(metrics.errors)) {
        combined.errors[status] = (combined.errors[status] || 0) + count;
      }
    }

    return this.calculateSummary(combined);
  }

  /**
   * Reset metrics for an endpoint
   */
  resetEndpoint(endpoint: string) {
    this.endpoints.delete(endpoint);
  }

  /**
   * Reset all metrics
   */
  resetAll() {
    this.endpoints.clear();
  }

  /**
   * Get endpoints sorted by error rate
   */
  getProblematicEndpoints(limit = 10): Array<{ endpoint: string; errorRate: number; summary: MetricsSummary }> {
    const results = Array.from(this.endpoints.entries())
      .map(([endpoint, metrics]) => ({
        endpoint,
        errorRate: metrics.totalRequests > 0 
          ? (metrics.failedRequests / metrics.totalRequests) * 100
          : 0,
        summary: this.calculateSummary(metrics),
      }))
      .filter(item => item.errorRate > 0)
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, limit);

    return results;
  }

  /**
   * Calculate health score for an endpoint (0-100)
   */
  calculateHealthScore(endpoint: string): number | null {
    const metrics = this.endpoints.get(endpoint);
    if (!metrics || metrics.totalRequests === 0) return null;

    // Factors:
    // 1. Availability (40%): Success rate
    // 2. Performance (30%): Response time vs baseline
    // 3. Reliability (20%): Retry success rate
    // 4. Resilience (10%): Circuit breaker effectiveness

    const successRate = (metrics.successfulRequests / metrics.totalRequests) * 100;
    const availabilityScore = successRate;

    // Performance: Assume baseline is 2s, score decreases as P95 increases
    const p95 = this.calculatePercentile(metrics.responseTimes, 0.95);
    const baselineMs = 2000;
    const performanceScore = Math.max(0, 100 - ((p95 - baselineMs) / baselineMs) * 100);

    // Reliability: Retry success rate
    const reliabilityScore = metrics.retries > 0
      ? (metrics.retrySuccesses / metrics.retries) * 100
      : 100; // No retries needed = perfect

    // Resilience: Low circuit breaker rejections is good
    const rejectionRate = (metrics.circuitBreakerRejections / metrics.totalRequests) * 100;
    const resilienceScore = Math.max(0, 100 - rejectionRate * 10);

    const healthScore = 
      (availabilityScore * 0.4) +
      (performanceScore * 0.3) +
      (reliabilityScore * 0.2) +
      (resilienceScore * 0.1);

    return Math.round(healthScore);
  }

  /**
   * Get health scores for all endpoints
   */
  getAllHealthScores(): Array<{ endpoint: string; score: number; trend: string }> {
    return Array.from(this.endpoints.keys())
      .map(endpoint => ({
        endpoint,
        score: this.calculateHealthScore(endpoint) || 0,
        trend: 'stable', // TODO: Implement trend analysis
      }))
      .sort((a, b) => a.score - b.score); // Worst first
  }

  // Private helpers

  private getOrCreateMetrics(endpoint: string): EndpointMetrics {
    let metrics = this.endpoints.get(endpoint);
    if (!metrics) {
      metrics = {
        endpoint,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        timeouts: 0,
        retries: 0,
        retrySuccesses: 0,
        circuitBreakerRejections: 0,
        responseTimes: [],
        lastRequest: 0,
        lastFailure: null,
        errors: {},
      };
      this.endpoints.set(endpoint, metrics);
    }
    return metrics;
  }

  private calculateSummary(metrics: EndpointMetrics): MetricsSummary {
    const successRate = metrics.totalRequests > 0
      ? ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2)
      : '0.00';

    const avgResponseTime = metrics.responseTimes.length > 0
      ? (metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length).toFixed(0)
      : '0';

    const p95 = this.calculatePercentile(metrics.responseTimes, 0.95).toFixed(0);
    const p99 = this.calculatePercentile(metrics.responseTimes, 0.99).toFixed(0);

    const retrySuccessRate = metrics.retries > 0
      ? ((metrics.retrySuccesses / metrics.retries) * 100).toFixed(2)
      : 'N/A';

    const topErrors = Object.entries(metrics.errors)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalRequests: metrics.totalRequests,
      successRate: successRate + '%',
      averageResponseTime: avgResponseTime + 'ms',
      p95ResponseTime: p95 + 'ms',
      p99ResponseTime: p99 + 'ms',
      retrySuccessRate: retrySuccessRate === 'N/A' ? retrySuccessRate : retrySuccessRate + '%',
      topErrors,
    };
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[Math.max(0, index)];
  }
}

// Export singleton instance
export const metricsTracker = new MetricsTracker();

// Export class for testing
export { MetricsTracker };
