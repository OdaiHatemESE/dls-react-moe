import { useState } from 'react';
import useSWR from 'swr';
import { jsonFetcher } from '@/lib/swr';

interface CircuitBreakerStats {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  successes: number;
  rejections: number;
  uptimePercentage: string;
  lastFailureAgo?: string;
  lastSuccessAgo?: string;
  nextAttemptIn?: string;
  name: string;
  description: string;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  score: number;
  issues: string[];
}

interface ResilienceMetrics {
  timestamp: string;
  systemHealth: SystemHealth;
  circuitBreakers: {
    ppApi: CircuitBreakerStats;
    idhApi: CircuitBreakerStats;
    oneRoster: CircuitBreakerStats;
  };
  queues: any;
  endpoints: {
    count: number;
    global: any;
    problematic: Array<{ endpoint: string; errorRate: number; summary: any }>;
    healthScores: Array<{ endpoint: string; score: number; trend: string }>;
  };
  recommendations: string[];
}

export function ResilienceDashboard() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { data, error, isLoading, mutate } = useSWR<ResilienceMetrics>(
    '/api/admin/resilience-metrics',
    jsonFetcher,
    {
      refreshInterval: autoRefresh ? 10000 : 0, // Refresh every 10 seconds
      revalidateOnFocus: true,
    }
  );

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Metrics</h2>
          <p className="text-red-700">{error.message || 'Failed to load resilience metrics'}</p>
          <button
            onClick={() => mutate()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { systemHealth, circuitBreakers, queues, endpoints, recommendations } = data;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">API Resilience Dashboard</h1>
          <p className="text-gray-600">
            Last updated: {new Date(data.timestamp).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Auto-refresh (10s)</span>
          </label>
          <button
            onClick={() => mutate()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* System Health */}
      <div className={`mb-8 p-6 rounded-lg border-2 ${
        systemHealth.status === 'healthy' ? 'bg-green-50 border-green-200' :
        systemHealth.status === 'degraded' ? 'bg-yellow-50 border-yellow-200' :
        'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">
            System Health: {systemHealth.status.toUpperCase()}
          </h2>
          <div className="text-4xl font-bold">
            {systemHealth.score}/100
          </div>
        </div>
        {systemHealth.issues.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Active Issues:</h3>
            <ul className="list-disc list-inside space-y-1">
              {systemHealth.issues.map((issue, i) => (
                <li key={i} className="text-sm">{issue}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Circuit Breakers */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Circuit Breakers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(circuitBreakers).map(([key, cb]) => (
            <CircuitBreakerCard key={key} data={cb} />
          ))}
        </div>
      </div>

      {/* Queue Metrics */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Request Queues</h2>
        <QueueCard data={queues.idh} />
      </div>

      {/* Endpoint Statistics */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Endpoint Performance</h2>
        
        {/* Global Stats */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Global Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Requests" value={endpoints.global.totalRequests.toLocaleString()} />
            <StatCard label="Success Rate" value={endpoints.global.successRate} />
            <StatCard label="Avg Response Time" value={endpoints.global.averageResponseTime} />
            <StatCard label="P95 Response Time" value={endpoints.global.p95ResponseTime} />
          </div>
        </div>

        {/* Problematic Endpoints */}
        {endpoints.problematic.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-red-900">Problematic Endpoints</h3>
            <div className="space-y-4">
              {endpoints.problematic.map((ep, i) => (
                <div key={i} className="bg-white rounded p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-sm font-semibold">{ep.endpoint}</span>
                    <span className="text-red-600 font-bold">{ep.errorRate.toFixed(1)}% errors</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
                    <div>Success: {ep.summary.successRate}</div>
                    <div>P95: {ep.summary.p95ResponseTime}</div>
                    <div>Retries: {ep.summary.retrySuccessRate}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Health Scores */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Endpoint Health Scores</h3>
          <div className="space-y-2">
            {endpoints.healthScores.slice(0, 10).map((ep, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex-1 font-mono text-sm">{ep.endpoint}</div>
                <div className="w-24 bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${
                      ep.score >= 80 ? 'bg-green-500' :
                      ep.score >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${ep.score}%` }}
                  ></div>
                </div>
                <div className="w-12 text-right font-semibold">{ep.score}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-blue-900">Recommendations</h2>
          <ul className="space-y-2">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-blue-600 font-bold">→</span>
                <span className="text-blue-900">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CircuitBreakerCard({ data }: { data: CircuitBreakerStats }) {
  const stateColor = 
    data.state === 'CLOSED' ? 'bg-green-100 border-green-300 text-green-800' :
    data.state === 'HALF_OPEN' ? 'bg-yellow-100 border-yellow-300 text-yellow-800' :
    'bg-red-100 border-red-300 text-red-800';

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg">{data.name}</h3>
          <p className="text-sm text-gray-600">{data.description}</p>
        </div>
        <span className={`px-3 py-1 rounded-full border text-sm font-semibold ${stateColor}`}>
          {data.state}
        </span>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Uptime:</span>
          <span className="font-semibold">{data.uptimePercentage}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Successes:</span>
          <span className="text-green-600 font-semibold">{data.successes}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Failures:</span>
          <span className="text-red-600 font-semibold">{data.failures}</span>
        </div>
        {data.rejections > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Rejections:</span>
            <span className="text-orange-600 font-semibold">{data.rejections}</span>
          </div>
        )}
        {data.lastSuccessAgo && (
          <div className="flex justify-between text-xs text-gray-500">
            <span>Last success:</span>
            <span>{data.lastSuccessAgo}</span>
          </div>
        )}
        {data.lastFailureAgo && (
          <div className="flex justify-between text-xs text-gray-500">
            <span>Last failure:</span>
            <span>{data.lastFailureAgo}</span>
          </div>
        )}
        {data.nextAttemptIn && (
          <div className="flex justify-between text-xs text-yellow-700">
            <span>Next attempt:</span>
            <span>{data.nextAttemptIn}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function QueueCard({ data }: { data: any }) {
  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="font-bold text-lg mb-4">{data.name}</h3>
      <p className="text-sm text-gray-600 mb-4">{data.description}</p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard label="Pending" value={data.currentPending} />
        <StatCard label="Active" value={data.currentQueueSize} />
        <StatCard label="Completed" value={data.successfulRequests.toLocaleString()} />
        <StatCard label="Failed" value={data.failedRequests} />
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Success Rate:</span>
          <span className="ml-2 font-semibold">{data.successRate}</span>
        </div>
        <div>
          <span className="text-gray-600">Retried:</span>
          <span className="ml-2 font-semibold">{data.retriedRequests}</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}
