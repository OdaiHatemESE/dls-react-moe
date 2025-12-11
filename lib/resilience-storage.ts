/**
 * Storage layer for circuit breaker and queue metrics
 * Persists resilience data to SQL Server database
 */

import { PrismaClient as ParentPortalPrisma } from '@prisma/client-parent-portal';

const prismaParent = new ParentPortalPrisma();

export class ResilienceStorage {
  /**
   * Save circuit breaker snapshot to database
   */
  async saveCircuitBreakerSnapshot(name: string, stats: any) {
    try {
      await prismaParent.circuitBreakerMetrics.create({
        data: {
          Name: name,
          State: stats.state,
          Failures: stats.failures || 0,
          Successes: stats.successes || 0,
          Rejections: stats.rejections || 0,
          LastFailureTime: stats.lastFailureTime ? new Date(stats.lastFailureTime) : null,
          LastSuccessTime: stats.lastSuccessTime ? new Date(stats.lastSuccessTime) : null,
          NextAttemptTime: stats.nextAttemptTime ? new Date(stats.nextAttemptTime) : null,
        },
      });
    } catch (error) {
      console.error(`[ResilienceStorage] Failed to save circuit breaker ${name}:`, error);
    }
  }

  /**
   * Save queue metrics snapshot to database
   */
  async saveQueueSnapshot(queueName: string, metrics: any) {
    try {
      await prismaParent.queueMetrics.create({
        data: {
          QueueName: queueName,
          CurrentPending: metrics.currentPending || 0,
          CurrentQueueSize: metrics.currentQueueSize || 0,
          SuccessfulRequests: metrics.successfulRequests || 0,
          FailedRequests: metrics.failedRequests || 0,
          RetriedRequests: metrics.retriedRequests || 0,
          SuccessRate: metrics.successRate || 'N/A',
        },
      });
    } catch (error) {
      console.error(`[ResilienceStorage] Failed to save queue ${queueName}:`, error);
    }
  }

  /**
   * Get latest circuit breaker metrics (last 24 hours)
   */
  async getCircuitBreakerHistory(name?: string, hoursBack: number = 24) {
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    try {
      const metrics = await prismaParent.circuitBreakerMetrics.findMany({
        where: {
          ...(name && { Name: name }),
          Timestamp: { gte: since },
        },
        orderBy: { Timestamp: 'desc' },
      });

      return metrics;
    } catch (error) {
      console.error('[ResilienceStorage] Failed to fetch circuit breaker history:', error);
      return [];
    }
  }

  /**
   * Get latest queue metrics (last 24 hours)
   */
  async getQueueHistory(queueName?: string, hoursBack: number = 24) {
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    try {
      const metrics = await prismaParent.queueMetrics.findMany({
        where: {
          ...(queueName && { QueueName: queueName }),
          Timestamp: { gte: since },
        },
        orderBy: { Timestamp: 'desc' },
      });

      return metrics;
    } catch (error) {
      console.error('[ResilienceStorage] Failed to fetch queue history:', error);
      return [];
    }
  }

  /**
   * Get latest snapshot for each circuit breaker
   */
  async getLatestCircuitBreakerSnapshots() {
    try {
      // Get latest for each circuit breaker name
      const allNames = await prismaParent.circuitBreakerMetrics.findMany({
        select: { Name: true },
        distinct: ['Name'],
      });

      const latestSnapshots = await Promise.all(
        allNames.map(async ({ Name }) => {
          return await prismaParent.circuitBreakerMetrics.findFirst({
            where: { Name },
            orderBy: { Timestamp: 'desc' },
          });
        })
      );

      return latestSnapshots.filter(Boolean);
    } catch (error) {
      console.error('[ResilienceStorage] Failed to fetch latest circuit breaker snapshots:', error);
      return [];
    }
  }

  /**
   * Get latest snapshot for each queue
   */
  async getLatestQueueSnapshots() {
    try {
      // Get latest for each queue name
      const allNames = await prismaParent.queueMetrics.findMany({
        select: { QueueName: true },
        distinct: ['QueueName'],
      });

      const latestSnapshots = await Promise.all(
        allNames.map(async ({ QueueName }) => {
          return await prismaParent.queueMetrics.findFirst({
            where: { QueueName },
            orderBy: { Timestamp: 'desc' },
          });
        })
      );

      return latestSnapshots.filter(Boolean);
    } catch (error) {
      console.error('[ResilienceStorage] Failed to fetch latest queue snapshots:', error);
      return [];
    }
  }

  /**
   * Clean up old metrics (keep last 7 days)
   */
  async cleanupOldMetrics(daysToKeep: number = 7) {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    try {
      const [cbDeleted, qDeleted] = await Promise.all([
        prismaParent.circuitBreakerMetrics.deleteMany({
          where: { Timestamp: { lt: cutoffDate } },
        }),
        prismaParent.queueMetrics.deleteMany({
          where: { Timestamp: { lt: cutoffDate } },
        }),
      ]);

      console.log(
        `[ResilienceStorage] Cleanup: Deleted ${cbDeleted.count} circuit breaker records and ${qDeleted.count} queue records older than ${daysToKeep} days`
      );

      return { circuitBreakers: cbDeleted.count, queues: qDeleted.count };
    } catch (error) {
      console.error('[ResilienceStorage] Failed to cleanup old metrics:', error);
      return { circuitBreakers: 0, queues: 0 };
    }
  }
}

export const resilienceStorage = new ResilienceStorage();
