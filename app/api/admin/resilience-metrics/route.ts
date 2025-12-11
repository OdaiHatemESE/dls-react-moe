import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ppApiCircuitBreaker, idhApiCircuitBreaker, oneRosterCircuitBreaker } from '@/lib/circuit-breaker';
import { idhQueue } from '@/lib/idh-queue';
import { metricsTracker } from '@/lib/metrics-tracker';
import { metricsStorage } from '@/lib/metrics-storage';
import { resilienceStorage } from '@/lib/resilience-storage';

export const dynamic = 'force-dynamic';

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
    const globalSummary = metricsTracker.getGlobalSummary();

    // Get problematic endpoints
    const problematicEndpoints = metricsTracker.getProblematicEndpoints(5);

    // Get health scores
    const healthScores = metricsTracker.getAllHealthScores();

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
        // Persist before reset
        await metricsTracker.persistNow();
        metricsTracker.resetAll();
        return NextResponse.json({ message: 'All metrics reset successfully' });
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

// Helper functions

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
        `${endpoint.endpoint}: High error rate (${endpoint.errorRate.toFixed(1)}%). Review timeout configuration and upstream service.`
      );
    }
    
    const p95 = parseInt(endpoint.summary.p95ResponseTime);
    if (p95 > 10000) {
      recommendations.push(
        `${endpoint.endpoint}: Slow P95 response time (${endpoint.summary.p95ResponseTime}). Consider increasing timeout or optimizing upstream.`
      );
    }
  }

  // Low health scores
  const criticalEndpoints = healthScores.filter(e => e.score < 50);
  if (criticalEndpoints.length > 0) {
    recommendations.push(
      `${criticalEndpoints.length} endpoints have critical health scores (< 50). Immediate investigation recommended.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('All systems operating normally. No recommendations at this time.');
  }

  return recommendations;
}
