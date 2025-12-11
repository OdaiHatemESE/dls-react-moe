/**
 * API Metrics Storage Layer
 * Persists metrics to SQL Server database via Prisma
 * 
 * Features:
 * - Batch inserts for performance (flush every 60s or 100 records)
 * - Non-blocking async writes (doesn't slow down API responses)
 * - Graceful error handling (metrics should never break the app)
 * - Automatic hourly/daily aggregations
 */

import { prismaParent } from './prisma-parent';
import type { EndpointMetrics } from './metrics-tracker';

/**
 * Calculate percentile from sorted array
 */
function calculatePercentile(sortedArray: number[], percentile: number): number | null {
  if (sortedArray.length === 0) return null;
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, index)];
}

/**
 * Calculate min/max/avg from array
 */
function calculateStats(array: number[]): { min: number; max: number; avg: number } {
  if (array.length === 0) return { min: 0, max: 0, avg: 0 };
  const min = Math.min(...array);
  const max = Math.max(...array);
  const avg = array.reduce((sum, val) => sum + val, 0) / array.length;
  return { min, max, avg };
}

// ============================================================================
// Types
// ============================================================================

interface MetricsBatch {
  Endpoint: string;
  ServiceName: string | null;
  AggregationPeriod: 'realtime' | 'hourly' | 'daily';
  Timestamp: Date;
  TotalRequests: number;
  SuccessfulRequests: number;
  FailedRequests: number;
  TimeoutErrors: number;
  CircuitBreakerRejections: number;
  NetworkErrors: number;
  TotalRetries: number;
  SuccessfulRetries: number;
  AvgResponseTime: number;
  MinResponseTime: number;
  MaxResponseTime: number;
  P50ResponseTime: number | null;
  P95ResponseTime: number | null;
  P99ResponseTime: number | null;
  StatusCodeBreakdown: string | null;
}

// ============================================================================
// Batch Queue
// ============================================================================

class MetricsStorage {
  private batchQueue: MetricsBatch[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL_MS = 60000; // 60 seconds

  constructor() {
    // Start auto-flush timer
    this.startAutoFlush();
  }

  /**
   * Start automatic batch flushing
   */
  private startAutoFlush(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    this.flushInterval = setInterval(() => {
      this.flush().catch((error) => {
        console.error('[MetricsStorage] Auto-flush failed:', error);
      });
    }, this.FLUSH_INTERVAL_MS);
  }

  /**
   * Add endpoint metrics to batch queue
   */
  async recordMetrics(
    endpoint: string,
    metrics: EndpointMetrics,
    serviceName?: string
  ): Promise<void> {
    try {
      // Determine service name from endpoint if not provided
      const service = serviceName || this.extractServiceName(endpoint);

      // Calculate percentiles and stats from response times
      const sortedTimes = [...metrics.responseTimes].sort((a, b) => a - b);
      const stats = calculateStats(metrics.responseTimes);
      const p50 = calculatePercentile(sortedTimes, 50);
      const p95 = calculatePercentile(sortedTimes, 95);
      const p99 = calculatePercentile(sortedTimes, 99);

      // Create batch entry
      const batch: MetricsBatch = {
        Endpoint: endpoint,
        ServiceName: service,
        AggregationPeriod: 'realtime',
        Timestamp: new Date(),
        TotalRequests: metrics.totalRequests,
        SuccessfulRequests: metrics.successfulRequests,
        FailedRequests: metrics.failedRequests,
        TimeoutErrors: metrics.timeouts,
        CircuitBreakerRejections: metrics.circuitBreakerRejections,
        NetworkErrors: 0,
        TotalRetries: metrics.retries,
        SuccessfulRetries: metrics.retrySuccesses,
        AvgResponseTime: stats.avg,
        MinResponseTime: stats.min,
        MaxResponseTime: stats.max,
        P50ResponseTime: p50,
        P95ResponseTime: p95,
        P99ResponseTime: p99,
        StatusCodeBreakdown: Object.keys(metrics.errors).length > 0
          ? JSON.stringify(metrics.errors)
          : null,
      };

      // Add to queue
      this.batchQueue.push(batch);

      // Flush if batch size reached
      if (this.batchQueue.length >= this.BATCH_SIZE) {
        await this.flush();
      }
    } catch (error) {
      // Log but don't throw - metrics should never break the app
      console.error('[MetricsStorage] Failed to record metrics:', error);
    }
  }

  /**
   * Extract service name from endpoint path
   */
  private extractServiceName(endpoint: string): string {
    if (endpoint.includes('/api/PP/')) return 'PP';
    if (endpoint.includes('/api/backoffice/idh/')) return 'IDH';
    if (endpoint.includes('/api/oneroster/')) return 'OneRoster';
    if (endpoint.includes('/api/admin/')) return 'Admin';
    return 'Unknown';
  }

  /**
   * Flush batch queue to database
   */
  async flush(): Promise<void> {
    if (this.batchQueue.length === 0) {
      return;
    }

    // Move current queue to local variable and reset
    const recordsToInsert = [...this.batchQueue];
    this.batchQueue = [];

    try {
      // Batch insert all records
      await prismaParent.apiMetrics.createMany({
        data: recordsToInsert,
      });

      console.log(
        `[MetricsStorage] Flushed ${recordsToInsert.length} metrics to database`
      );
    } catch (error) {
      console.error('[MetricsStorage] Batch insert failed:', error);
      // Put failed records back in queue for retry
      this.batchQueue.unshift(...recordsToInsert);
    }
  }

  /**
   * Force flush and cleanup
   */
  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    await this.flush();
  }

  /**
   * Get metrics for last N hours
   */
  async getRecentMetrics(hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    return await prismaParent.apiMetrics.findMany({
      where: {
        Timestamp: {
          gte: since,
        },
      },
      orderBy: {
        Timestamp: 'desc',
      },
    });
  }

  /**
   * Get aggregated metrics by endpoint
   */
  async getEndpointSummary(hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Use raw query for aggregation
    const results = await prismaParent.$queryRaw<
      Array<{
        endpoint: string;
        serviceName: string | null;
        totalRequests: bigint;
        successfulRequests: bigint;
        failedRequests: bigint;
        avgResponseTime: number;
        p95ResponseTime: number | null;
        timeoutErrors: bigint;
        circuitBreakerRejections: bigint;
      }>
    >`
      SELECT 
        Endpoint as endpoint,
        ServiceName as serviceName,
        SUM(TotalRequests) as totalRequests,
        SUM(SuccessfulRequests) as successfulRequests,
        SUM(FailedRequests) as failedRequests,
        AVG(AvgResponseTime) as avgResponseTime,
        MAX(P95ResponseTime) as p95ResponseTime,
        SUM(TimeoutErrors) as timeoutErrors,
        SUM(CircuitBreakerRejections) as circuitBreakerRejections
      FROM dbo.ApiMetrics
      WHERE Timestamp >= ${since}
      GROUP BY Endpoint, ServiceName
      ORDER BY totalRequests DESC
    `;

    // Convert BigInt to Number for JSON serialization
    return results.map((row) => ({
      ...row,
      totalRequests: Number(row.totalRequests),
      successfulRequests: Number(row.successfulRequests),
      failedRequests: Number(row.failedRequests),
      timeoutErrors: Number(row.timeoutErrors),
      circuitBreakerRejections: Number(row.circuitBreakerRejections),
    }));
  }

  /**
   * Create hourly aggregation
   * Should be run via cron job every hour
   */
  async aggregateHourly(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    try {
      // Aggregate last hour's realtime data
      const aggregated = await prismaParent.$queryRaw<
        Array<{
          endpoint: string;
          serviceName: string | null;
          totalRequests: bigint;
          successfulRequests: bigint;
          failedRequests: bigint;
          timeoutErrors: bigint;
          circuitBreakerRejections: bigint;
          networkErrors: bigint;
          totalRetries: bigint;
          successfulRetries: bigint;
          avgResponseTime: number;
          minResponseTime: number;
          maxResponseTime: number;
          p50ResponseTime: number | null;
          p95ResponseTime: number | null;
          p99ResponseTime: number | null;
        }>
      >`
        SELECT 
          Endpoint as endpoint,
          ServiceName as serviceName,
          SUM(TotalRequests) as totalRequests,
          SUM(SuccessfulRequests) as successfulRequests,
          SUM(FailedRequests) as failedRequests,
          SUM(TimeoutErrors) as timeoutErrors,
          SUM(CircuitBreakerRejections) as circuitBreakerRejections,
          SUM(NetworkErrors) as networkErrors,
          SUM(TotalRetries) as totalRetries,
          SUM(SuccessfulRetries) as successfulRetries,
          AVG(AvgResponseTime) as avgResponseTime,
          MIN(MinResponseTime) as minResponseTime,
          MAX(MaxResponseTime) as maxResponseTime,
          AVG(P50ResponseTime) as p50ResponseTime,
          MAX(P95ResponseTime) as p95ResponseTime,
          MAX(P99ResponseTime) as p99ResponseTime
        FROM dbo.ApiMetrics
        WHERE AggregationPeriod = 'realtime'
          AND Timestamp >= ${twoHoursAgo}
          AND Timestamp < ${oneHourAgo}
        GROUP BY Endpoint, ServiceName
      `;

      // Insert hourly aggregations
      for (const row of aggregated) {
        await prismaParent.apiMetrics.create({
          data: {
            Endpoint: row.endpoint,
            ServiceName: row.serviceName,
            AggregationPeriod: 'hourly',
            Timestamp: oneHourAgo,
            TotalRequests: Number(row.totalRequests),
            SuccessfulRequests: Number(row.successfulRequests),
            FailedRequests: Number(row.failedRequests),
            TimeoutErrors: Number(row.timeoutErrors),
            CircuitBreakerRejections: Number(row.circuitBreakerRejections),
            NetworkErrors: Number(row.networkErrors),
            TotalRetries: Number(row.totalRetries),
            SuccessfulRetries: Number(row.successfulRetries),
            AvgResponseTime: row.avgResponseTime,
            MinResponseTime: row.minResponseTime,
            MaxResponseTime: row.maxResponseTime,
            P50ResponseTime: row.p50ResponseTime,
            P95ResponseTime: row.p95ResponseTime,
            P99ResponseTime: row.p99ResponseTime,
            StatusCodeBreakdown: null,
          },
        });
      }

      console.log(
        `[MetricsStorage] Created ${aggregated.length} hourly aggregations`
      );
    } catch (error) {
      console.error('[MetricsStorage] Hourly aggregation failed:', error);
    }
  }

  /**
   * Cleanup old metrics based on retention policy
   * - Realtime: 7 days
   * - Hourly: 90 days
   * - Daily: 2 years
   */
  async cleanup(): Promise<void> {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const twoYearsAgo = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000);

      // Delete old realtime data
      const realtimeDeleted = await prismaParent.apiMetrics.deleteMany({
        where: {
          AggregationPeriod: 'realtime',
          Timestamp: {
            lt: sevenDaysAgo,
          },
        },
      });

      // Delete old hourly data
      const hourlyDeleted = await prismaParent.apiMetrics.deleteMany({
        where: {
          AggregationPeriod: 'hourly',
          Timestamp: {
            lt: ninetyDaysAgo,
          },
        },
      });

      // Delete old daily data
      const dailyDeleted = await prismaParent.apiMetrics.deleteMany({
        where: {
          AggregationPeriod: 'daily',
          Timestamp: {
            lt: twoYearsAgo,
          },
        },
      });

      console.log(
        `[MetricsStorage] Cleanup: ${realtimeDeleted.count} realtime, ${hourlyDeleted.count} hourly, ${dailyDeleted.count} daily records deleted`
      );
    } catch (error) {
      console.error('[MetricsStorage] Cleanup failed:', error);
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const metricsStorage = new MetricsStorage();

// Graceful shutdown handler
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    console.log('[MetricsStorage] SIGTERM received, flushing metrics...');
    await metricsStorage.shutdown();
  });

  process.on('SIGINT', async () => {
    console.log('[MetricsStorage] SIGINT received, flushing metrics...');
    await metricsStorage.shutdown();
  });
}
