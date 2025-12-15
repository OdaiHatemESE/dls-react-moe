import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ppApiCircuitBreaker, idhApiCircuitBreaker, oneRosterCircuitBreaker } from '@/lib/circuit-breaker';
import { idhQueue } from '@/lib/idh-queue';
import { metricsTracker } from '@/lib/metrics-tracker';
import { metricsStorage } from '@/lib/metrics-storage';
import { resilienceStorage } from '@/lib/resilience-storage';
import { prismaParent } from '@/lib/prisma-parent';

export const dynamic = 'force-dynamic';

// Helper functions - defined before use

function calculateGlobalSummaryFromDbMetrics(dbMetrics: any[]): any {
  const totalRequests = dbMetrics.reduce((sum, m) => sum + m.totalRequests, 0);
  const successfulRequests = dbMetrics.reduce((sum, m) => sum + m.successfulRequests, 0);
  const failedRequests = dbMetrics.reduce((sum, m) => sum + m.failedRequests, 0);
  
  // Weighted average response time
  const totalWeightedAvg = dbMetrics.reduce((sum, m) => sum + (m.avgResponseTime * m.totalRequests), 0);
  const avgResponseTime = totalRequests > 0 ? Math.round(totalWeightedAvg / totalRequests) : 0;
  
  // Calculate overall P95 (approximation)
  const totalWeightedP95 = dbMetrics.reduce((sum, m) => sum + ((m.p95ResponseTime || m.avgResponseTime) * m.totalRequests), 0);
  const p95ResponseTime = totalRequests > 0 ? Math.round(totalWeightedP95 / totalRequests) : 0;
  
  const successRate = totalRequests > 0 ? ((successfulRequests / totalRequests) * 100).toFixed(2) + '%' : '0.00%';
  
  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    successRate,
    averageResponseTime: avgResponseTime + 'ms',
    p95ResponseTime: p95ResponseTime + 'ms',
  };
}

function calculateProblematicEndpointsFromDb(dbMetrics: any[], limit: number): Array<{ endpoint: string; errorRate: number; summary: any }> {
  return dbMetrics
    .map(metric => {
      const errorRate = metric.totalRequests > 0 
        ? (metric.failedRequests / metric.totalRequests) * 100 
        : 0;
      
      return {
        endpoint: metric.endpoint,
        errorRate,
        summary: {
          successRate: ((metric.successfulRequests / metric.totalRequests) * 100).toFixed(1) + '%',
          p95ResponseTime: (metric.p95ResponseTime || metric.avgResponseTime) + 'ms',
          retrySuccessRate: 'N/A',
        },
      };
    })
    .filter(ep => ep.errorRate > 5) // Only endpoints with >5% error rate
    .sort((a, b) => b.errorRate - a.errorRate) // Highest error rate first
    .slice(0, limit);
}

function calculateHealthScoreFromDbMetric(metric: any): number {
  if (metric.totalRequests === 0) return 0;

  // Factors:
  // 1. Availability (40%): Success rate
  // 2. Performance (30%): Response time vs baseline
  // 3. Reliability (20%): Based on failures
  // 4. Resilience (10%): Circuit breaker rejections

  const successRate = (metric.successfulRequests / metric.totalRequests) * 100;
  const availabilityScore = successRate;

  // Performance: Assume baseline is 2s, score decreases as P95 increases
  const p95 = metric.p95ResponseTime || metric.avgResponseTime;
  const baselineMs = 2000;
  const performanceScore = Math.max(0, 100 - ((p95 - baselineMs) / baselineMs) * 100);

  // Reliability: Based on failure rate
  const failureRate = (metric.failedRequests / metric.totalRequests) * 100;
  const reliabilityScore = Math.max(0, 100 - failureRate * 2);

  // Resilience: Low circuit breaker rejections is good
  const rejectionRate = ((metric.circuitBreakerRejections || 0) / metric.totalRequests) * 100;
  const resilienceScore = Math.max(0, 100 - rejectionRate * 10);

  const healthScore = 
    (availabilityScore * 0.4) +
    (performanceScore * 0.3) +
    (reliabilityScore * 0.2) +
    (resilienceScore * 0.1);

  return Math.round(healthScore);
}

/**
 * GET /api/admin/resilience-metrics
 * 
 * Returns comprehensive metrics about API resilience:
 * - Circuit breaker states
 * - Queue metrics
 * - Endpoint performance
 * - Health scores
 * 
 * Requires admin authentication
 */
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    // TODO: Add proper admin role check
    // For now, just require authentication
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Gather circuit breaker metrics (current + database history)
    const [cbSnapshots, queueSnapshots] = await Promise.all([
      resilienceStorage.getLatestCircuitBreakerSnapshots(),
      resilienceStorage.getLatestQueueSnapshots(),
    ]);
    
    const circuitBreakers = {
      ppApi: {
        ...ppApiCircuitBreaker.getStats(),
        name: 'PP API',
        description: 'Parent Portal API circuit breaker',
        dbSnapshot: cbSnapshots.find((s: any) => s.Name === 'PP-API'),
      },
      idhApi: {
        ...idhApiCircuitBreaker.getStats(),
        name: 'IDH API',
        description: 'Student status/transportation API circuit breaker',
        dbSnapshot: cbSnapshots.find((s: any) => s.Name === 'IDH-API'),
      },
      oneRoster: {
        ...oneRosterCircuitBreaker.getStats(),
        name: 'OneRoster API',
        description: 'Enrollment data API circuit breaker',
        dbSnapshot: cbSnapshots.find((s: any) => s.Name === 'OneRoster-API'),
      },
    };

    // Calculate uptime percentages
    Object.values(circuitBreakers).forEach((cb: any) => {
      const total = cb.successes + cb.failures;
      cb.uptimePercentage = total > 0 
        ? ((cb.successes / total) * 100).toFixed(2) + '%'
        : 'N/A';
      
      // Format timestamps
      if (cb.lastFailureTime) {
        cb.lastFailureAgo = formatTimeAgo(cb.lastFailureTime);
      }
      if (cb.lastSuccessTime) {
        cb.lastSuccessAgo = formatTimeAgo(cb.lastSuccessTime);
      }
      if (cb.nextAttemptTime) {
        cb.nextAttemptIn = formatTimeUntil(cb.nextAttemptTime);
      }
    });

    // Gather queue metrics (current + database history)
    const queueMetrics = {
      idh: {
        ...idhQueue.getMetrics(),
        name: 'IDH Request Queue',
        description: 'Rate-limited queue for IDH API requests',
        dbSnapshot: queueSnapshots.find((s: any) => s.QueueName === 'IDH-Queue'),
      },
    };

    // Gather endpoint metrics from in-memory tracker
    const endpointMetrics: Record<string, any> = {};
    const allMetrics = metricsTracker.getAllMetrics();
    
    for (const [endpoint, metrics] of allMetrics.entries()) {
      const summary = metricsTracker.getEndpointSummary(endpoint);
      const healthScore = metricsTracker.calculateHealthScore(endpoint);
      
      endpointMetrics[endpoint] = {
        ...metrics,
        summary,
        healthScore,
        responseTimes: undefined, // Don't send raw data (too large)
      };
    }

    // Fetch database metrics (last 24 hours)
    const dbMetrics = await metricsStorage.getEndpointSummary(24);
    const dbEndpointMetrics: Record<string, any> = {};
    
    for (const dbMetric of dbMetrics) {
      dbEndpointMetrics[dbMetric.endpoint] = {
        endpoint: dbMetric.endpoint,
        serviceName: dbMetric.serviceName,
        totalRequests: dbMetric.totalRequests,
        successfulRequests: dbMetric.successfulRequests,
        failedRequests: dbMetric.failedRequests,
        avgResponseTime: dbMetric.avgResponseTime,
        p95ResponseTime: dbMetric.p95ResponseTime,
        timeoutErrors: dbMetric.timeoutErrors,
        circuitBreakerRejections: dbMetric.circuitBreakerRejections,
        source: 'database',
      };
    }

    // Get global summary
    let globalSummary = metricsTracker.getGlobalSummary();

    // If no in-memory data, calculate from database metrics
    if (globalSummary.totalRequests === 0 && dbMetrics.length > 0) {
      globalSummary = calculateGlobalSummaryFromDbMetrics(dbMetrics);
    }

    // Get problematic endpoints
    let problematicEndpoints = metricsTracker.getProblematicEndpoints(5);

    // If no in-memory problematic endpoints, calculate from database metrics
    if (problematicEndpoints.length === 0 && dbMetrics.length > 0) {
      problematicEndpoints = calculateProblematicEndpointsFromDb(dbMetrics, 5);
    }

    // Get health scores from in-memory tracker
    let healthScores = metricsTracker.getAllHealthScores();

    // If no in-memory health scores, calculate from database metrics
    if (healthScores.length === 0 && dbMetrics.length > 0) {
      healthScores = dbMetrics.map(metric => ({
        endpoint: metric.endpoint,
        score: calculateHealthScoreFromDbMetric(metric),
        trend: 'stable',
      })).sort((a, b) => a.score - b.score); // Worst first
    }

    // System health assessment
    const systemHealth = calculateSystemHealth(circuitBreakers, queueMetrics, healthScores);

    const response = {
      timestamp: new Date().toISOString(),
      systemHealth,
      circuitBreakers,
      queues: queueMetrics,
      endpoints: {
        count: allMetrics.size,
        metrics: endpointMetrics,
        databaseMetrics: dbEndpointMetrics,
        global: globalSummary,
        problematic: problematicEndpoints,
        healthScores,
      },
      recommendations: generateRecommendations(circuitBreakers, problematicEndpoints, healthScores),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Admin Resilience Metrics] Error:', error);
    return NextResponse.json(
      { error: 'Failed to gather metrics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/resilience-metrics/reset
 * 
 * Reset metrics for testing or periodic cleanup
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { action, target } = body;

    if (action === 'persist') {
      // Manually trigger persistence to database
      await metricsTracker.persistNow();
      await metricsStorage.flush();
      return NextResponse.json({ message: 'Metrics persisted to database successfully' });
    }

    if (action === 'reset') {
      if (target === 'metrics') {
        // Persist before reset (optional - saves current state)
        await metricsTracker.persistNow();
        metricsTracker.resetAll();
        return NextResponse.json({ message: 'In-memory metrics reset successfully' });
      } else if (target === 'database') {
        // Clear database metrics (last 24 hours data)
        try {
          // Delete old metrics from database
          const hoursCutoff = parseInt(body.hours || '24');
          const cutoffDate = new Date(Date.now() - hoursCutoff * 60 * 60 * 1000);
          
          const [deletedMetrics, deletedCB, deletedQueue] = await Promise.all([
            prismaParent.apiMetrics.deleteMany({
              where: {
                Timestamp: { gte: cutoffDate }
              }
            }),
            prismaParent.circuitBreakerMetrics.deleteMany({
              where: {
                Timestamp: { gte: cutoffDate }
              }
            }),
            prismaParent.queueMetrics.deleteMany({
              where: {
                Timestamp: { gte: cutoffDate }
              }
            }),
          ]);
          
          return NextResponse.json({ 
            message: `Database metrics cleared successfully`, 
            deleted: {
              apiMetrics: deletedMetrics.count,
              circuitBreaker: deletedCB.count,
              queue: deletedQueue.count,
            }
          });
        } catch (err) {
          console.error('Error clearing database metrics:', err);
          return NextResponse.json({ error: 'Failed to clear database metrics' }, { status: 500 });
        }
      } else if (target === 'all') {
        // Reset both in-memory and database
        metricsTracker.resetAll();
        
        const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        await Promise.all([
          prismaParent.apiMetrics.deleteMany({
            where: { Timestamp: { gte: cutoffDate } }
          }),
          prismaParent.circuitBreakerMetrics.deleteMany({
            where: { Timestamp: { gte: cutoffDate } }
          }),
          prismaParent.queueMetrics.deleteMany({
            where: { Timestamp: { gte: cutoffDate } }
          }),
        ]);
        
        return NextResponse.json({ message: 'All metrics (memory + database) reset successfully' });
      } else if (target === 'queue') {
        idhQueue.resetMetrics();
        return NextResponse.json({ message: 'Queue metrics reset successfully' });
      } else if (target === 'circuitBreaker') {
        const { name } = body;
        if (name === 'ppApi') {
          ppApiCircuitBreaker.reset();
        } else if (name === 'idhApi') {
          idhApiCircuitBreaker.reset();
        } else if (name === 'oneRoster') {
          oneRosterCircuitBreaker.reset();
        }
        return NextResponse.json({ message: `Circuit breaker ${name} reset successfully` });
      }
    }

    return NextResponse.json({ error: 'Invalid action or target' }, { status: 400 });
  } catch (error) {
    console.error('[Admin Resilience Metrics] Reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset metrics' },
      { status: 500 }
    );
  }
}

// Helper functions (remaining utilities)

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatTimeUntil(timestamp: number): string {
  const seconds = Math.floor((timestamp - Date.now()) / 1000);
  
  if (seconds < 0) return 'now';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function calculateSystemHealth(
  circuitBreakers: any,
  queueMetrics: any,
  healthScores: Array<{ endpoint: string; score: number }>
): {
  status: 'healthy' | 'degraded' | 'critical';
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let totalScore = 100;

  // Check circuit breakers
  let openCircuits = 0;
  for (const [key, cb] of Object.entries(circuitBreakers)) {
    if ((cb as any).state === 'OPEN') {
      openCircuits++;
      issues.push(`${(cb as any).name} circuit breaker is OPEN`);
      totalScore -= 30;
    } else if ((cb as any).state === 'HALF_OPEN') {
      issues.push(`${(cb as any).name} is testing recovery`);
      totalScore -= 10;
    }
  }

  // Check queue
  const idhQueueData = queueMetrics.idh;
  if (idhQueueData.currentPending > 50) {
    issues.push(`IDH queue has ${idhQueueData.currentPending} pending requests`);
    totalScore -= 15;
  }

  // Check endpoint health scores
  const lowScoreEndpoints = healthScores.filter(e => e.score < 70);
  if (lowScoreEndpoints.length > 0) {
    issues.push(`${lowScoreEndpoints.length} endpoints with health score < 70`);
    totalScore -= lowScoreEndpoints.length * 5;
  }

  totalScore = Math.max(0, totalScore);

  let status: 'healthy' | 'degraded' | 'critical';
  if (totalScore >= 80) {
    status = 'healthy';
  } else if (totalScore >= 50) {
    status = 'degraded';
  } else {
    status = 'critical';
  }

  return { status, score: totalScore, issues };
}

function generateRecommendations(
  circuitBreakers: any,
  problematicEndpoints: Array<{ endpoint: string; errorRate: number; summary: any }>,
  healthScores: Array<{ endpoint: string; score: number }>
): string[] {
  const recommendations: string[] = [];

  // Circuit breaker recommendations
  for (const [key, cb] of Object.entries(circuitBreakers)) {
    if ((cb as any).state === 'OPEN') {
      recommendations.push(
        `${(cb as any).name}: Circuit breaker is open. Check upstream service health and wait for automatic recovery in ${(cb as any).nextAttemptIn || '60s'}.`
      );
    }
    
    const failureRate = (cb as any).failures / ((cb as any).successes + (cb as any).failures || 1);
    if (failureRate > 0.1 && (cb as any).state === 'CLOSED') {
      recommendations.push(
        `${(cb as any).name}: High failure rate (${(failureRate * 100).toFixed(1)}%). Monitor for potential service degradation.`
      );
    }
  }

  // Endpoint recommendations
  for (const endpoint of problematicEndpoints.slice(0, 3)) {
    if (endpoint.errorRate > 20) {
      recommendations.push(
        `${endpoint.endpoint}: High error rate (${endpoint.errorRate.toFixed(1)}%). Actions: Review logs for common errors, add retry logic, validate upstream service health, or adjust circuit breaker thresholds.`
      );
    }
    
    // Handle both string (e.g., "5000ms") and number formats
    const p95String = endpoint.summary.p95ResponseTime;
    const p95 = typeof p95String === 'string' ? parseInt(p95String) : p95String;
    if (!isNaN(p95) && p95 > 10000) {
      recommendations.push(
        `${endpoint.endpoint}: Very slow (${endpoint.summary.p95ResponseTime} P95). Actions: Increase timeout from current setting, optimize database queries, implement background jobs, or add response streaming.`
      );
    }
  }

  // Low health scores
  const criticalEndpoints = healthScores.filter(e => e.score < 50);
  if (criticalEndpoints.length > 0) {
    const endpointList = criticalEndpoints.slice(0, 3).map(e => e.endpoint).join(', ');
    const more = criticalEndpoints.length > 3 ? ` and ${criticalEndpoints.length - 3} more` : '';
    recommendations.push(
      `URGENT: ${criticalEndpoints.length} critical endpoints (${endpointList}${more}). Actions: Investigate immediately, check upstream services, review recent deployments, enable detailed logging, or temporarily disable non-essential features.`
    );
  }

  // Medium health scores - warning
  const warningEndpoints = healthScores.filter(e => e.score >= 50 && e.score < 70);
  if (warningEndpoints.length > 0) {
    const endpointList = warningEndpoints.slice(0, 3).map(e => e.endpoint).join(', ');
    const more = warningEndpoints.length > 3 ? ` and ${warningEndpoints.length - 3} more` : '';
    recommendations.push(
      `Monitor these endpoints closely: ${endpointList}${more}. Actions: Check error rates, optimize response times, or review upstream dependencies.`
    );
  }

  // Slow endpoints (even if not problematic)
  const slowEndpoints = problematicEndpoints.filter(ep => {
    const p95String = ep.summary.p95ResponseTime;
    const p95 = typeof p95String === 'string' ? parseInt(p95String) : p95String;
    return !isNaN(p95) && p95 > 5000 && p95 <= 10000;
  });
  if (slowEndpoints.length > 0) {
    const endpointList = slowEndpoints.slice(0, 2).map(e => e.endpoint).join(', ');
    recommendations.push(
      `Optimize slow endpoints (${endpointList}): Add database indexes, implement Redis caching, use pagination, or increase concurrent request limits.`
    );
  }

  // Overall health assessment with actionable advice
  if (healthScores.length > 0) {
    const avgHealthScore = healthScores.reduce((sum, ep) => sum + ep.score, 0) / healthScores.length;
    if (avgHealthScore < 80 && recommendations.length === 0) {
      const actionableSteps: string[] = [];
      
      // Analyze what's affecting the score
      const lowSuccessRate = healthScores.filter(ep => ep.score < 80).length;
      const hasSlowEndpoints = problematicEndpoints.some(ep => {
        const p95String = ep.summary.p95ResponseTime;
        const p95 = typeof p95String === 'string' ? parseInt(p95String) : p95String;
        return !isNaN(p95) && p95 > 3000;
      });
      
      if (lowSuccessRate > healthScores.length * 0.3) {
        actionableSteps.push('Review error logs and implement better error handling');
      }
      if (hasSlowEndpoints) {
        actionableSteps.push('Optimize database queries, add caching, or increase timeouts for slow endpoints');
      }
      if (actionableSteps.length === 0) {
        actionableSteps.push('Monitor response times and implement caching where possible');
      }
      
      recommendations.push(
        `Average health score is ${avgHealthScore.toFixed(1)}. Recommended actions: ${actionableSteps.join('; ')}.`
      );
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('All systems operating normally. No recommendations at this time.');
  }

  return recommendations;
}
