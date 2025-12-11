import { useState, useMemo } from 'react';
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
        
        {/* Database Metrics (Last 24 Hours) */}
        {endpoints.databaseMetrics && Object.keys(endpoints.databaseMetrics).length > 0 && (
          <DatabaseMetricsTable metrics={Object.values(endpoints.databaseMetrics)} />
        )}
        
        {/* Global Stats */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Global Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
              label="Total Requests" 
              value={endpoints.global?.totalRequests?.toLocaleString() || '0'} 
            />
            <StatCard 
              label="Success Rate" 
              value={endpoints.global?.successRate || 'N/A'} 
            />
            <StatCard 
              label="Avg Response Time" 
              value={endpoints.global?.averageResponseTime || 'N/A'} 
            />
            <StatCard 
              label="P95 Response Time" 
              value={endpoints.global?.p95ResponseTime || 'N/A'} 
            />
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
          <h2 className="text-xl font-bold mb-4 text-blue-900">💡 Recommendations</h2>
          <ul className="space-y-3">
            {recommendations.map((rec, i) => {
              // Determine priority based on keywords
              const isUrgent = rec.includes('URGENT') || rec.includes('critical');
              const isWarning = rec.includes('High error rate') || rec.includes('Very slow');
              
              const itemClass = isUrgent 
                ? 'bg-red-50 border border-red-200 rounded-lg p-3'
                : isWarning
                ? 'bg-yellow-50 border border-yellow-200 rounded-lg p-3'
                : 'bg-white border border-blue-100 rounded-lg p-3';
              
              const iconColor = isUrgent ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-blue-600';
              const textColor = isUrgent ? 'text-red-900' : isWarning ? 'text-yellow-900' : 'text-blue-900';
              
              return (
                <li key={i} className={itemClass}>
                  <div className="flex gap-3">
                    <span className={`${iconColor} font-bold flex-shrink-0`}>
                      {isUrgent ? '⚠️' : isWarning ? '⚡' : '→'}
                    </span>
                    <span className={`${textColor} text-sm leading-relaxed`}>{rec}</span>
                  </div>
                </li>
              );
            })}
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

  const totalRequests = (data.successes || 0) + (data.failures || 0);
  const hasActivity = totalRequests > 0;

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
      
      {!hasActivity && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
          ℹ️ No requests processed yet
        </div>
      )}
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Uptime:</span>
          <span className="font-semibold">{data.uptimePercentage || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Successes:</span>
          <span className="text-green-600 font-semibold">{data.successes || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Failures:</span>
          <span className="text-red-600 font-semibold">{data.failures || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Rejections:</span>
          <span className={`font-semibold ${(data.rejections || 0) > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
            {data.rejections || 0}
          </span>
        </div>
        {data.lastSuccessAgo && (
          <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
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
  const totalProcessed = (data.successfulRequests || 0) + (data.failedRequests || 0);
  const hasActivity = totalProcessed > 0;

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="font-bold text-lg mb-4">{data.name || 'Queue'}</h3>
      <p className="text-sm text-gray-600 mb-4">{data.description || 'Request queue metrics'}</p>
      
      {!hasActivity && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
          ℹ️ No requests processed yet
        </div>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard label="Pending" value={data.currentPending || 0} />
        <StatCard label="Active" value={data.currentQueueSize || 0} />
        <StatCard label="Completed" value={(data.successfulRequests || 0).toLocaleString()} />
        <StatCard label="Failed" value={data.failedRequests || 0} />
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Success Rate:</span>
          <span className="ml-2 font-semibold">{data.successRate || 'N/A'}</span>
        </div>
        <div>
          <span className="text-gray-600">Retried:</span>
          <span className="ml-2 font-semibold">{data.retriedRequests || 0}</span>
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

function DatabaseMetricsTable({ metrics }: { metrics: any[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'endpoint' | 'totalRequests' | 'successRate' | 'avgResponseTime'>('totalRequests');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 10;

  // Filter and sort metrics
  const filteredAndSortedMetrics = useMemo(() => {
    let filtered = metrics.filter((metric) =>
      metric.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (metric.serviceName && metric.serviceName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'endpoint':
          aValue = a.endpoint;
          bValue = b.endpoint;
          break;
        case 'totalRequests':
          aValue = a.totalRequests;
          bValue = b.totalRequests;
          break;
        case 'successRate':
          aValue = (a.successfulRequests / a.totalRequests) * 100;
          bValue = (b.successfulRequests / b.totalRequests) * 100;
          break;
        case 'avgResponseTime':
          aValue = a.avgResponseTime;
          bValue = b.avgResponseTime;
          break;
        default:
          aValue = a.totalRequests;
          bValue = b.totalRequests;
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [metrics, searchTerm, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedMetrics.length / itemsPerPage);
  const paginatedMetrics = filteredAndSortedMetrics.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ column }: { column: typeof sortBy }) => {
    if (sortBy !== column) return <span className="text-gray-400">↕</span>;
    return <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-purple-900">📊 Database Metrics (Last 24 Hours)</h3>
        <div className="text-sm text-purple-700">
          {filteredAndSortedMetrics.length} endpoint{filteredAndSortedMetrics.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Search Filter */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by endpoint or service name..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-purple-100">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-purple-900 uppercase tracking-wider cursor-pointer hover:bg-purple-200"
                  onClick={() => handleSort('endpoint')}
                >
                  <div className="flex items-center gap-1">
                    Endpoint <SortIcon column="endpoint" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-purple-900 uppercase tracking-wider">
                  Service
                </th>
                <th 
                  className="px-4 py-3 text-right text-xs font-medium text-purple-900 uppercase tracking-wider cursor-pointer hover:bg-purple-200"
                  onClick={() => handleSort('totalRequests')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Total <SortIcon column="totalRequests" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-right text-xs font-medium text-purple-900 uppercase tracking-wider cursor-pointer hover:bg-purple-200"
                  onClick={() => handleSort('successRate')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Success <SortIcon column="successRate" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-right text-xs font-medium text-purple-900 uppercase tracking-wider cursor-pointer hover:bg-purple-200"
                  onClick={() => handleSort('avgResponseTime')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Avg (ms) <SortIcon column="avgResponseTime" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-purple-900 uppercase tracking-wider">
                  P95 (ms)
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-purple-900 uppercase tracking-wider">
                  Failures
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedMetrics.map((metric: any, i: number) => {
                const successRate = ((metric.successfulRequests / metric.totalRequests) * 100);
                const isHealthy = successRate >= 95;
                const isWarning = successRate >= 80 && successRate < 95;
                
                return (
                  <tr key={i} className="hover:bg-purple-50 transition-colors">
                    <td className="px-4 py-3 text-sm">
                      <span className="font-mono font-medium text-gray-900">{metric.endpoint}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {metric.serviceName && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                          {metric.serviceName}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                      {metric.totalRequests.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={`font-semibold ${
                        isHealthy ? 'text-green-600' : 
                        isWarning ? 'text-yellow-600' : 
                        'text-red-600'
                      }`}>
                        {successRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-700">
                      {metric.avgResponseTime.toFixed(0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-700">
                      {metric.p95ResponseTime ? metric.p95ResponseTime.toFixed(0) : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="font-semibold text-red-600">
                        {metric.failedRequests}
                        {metric.timeoutErrors > 0 && (
                          <span className="text-xs text-gray-500 ml-1">({metric.timeoutErrors}t)</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredAndSortedMetrics.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredAndSortedMetrics.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    ←
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    →
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded p-3 border border-purple-200">
          <div className="text-xs text-gray-500">Total Requests</div>
          <div className="text-lg font-bold text-purple-900">
            {metrics.reduce((sum, m) => sum + m.totalRequests, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded p-3 border border-purple-200">
          <div className="text-xs text-gray-500">Avg Success Rate</div>
          <div className="text-lg font-bold text-green-600">
            {(
              (metrics.reduce((sum, m) => sum + m.successfulRequests, 0) /
                metrics.reduce((sum, m) => sum + m.totalRequests, 0)) *
              100
            ).toFixed(1)}%
          </div>
        </div>
        <div className="bg-white rounded p-3 border border-purple-200">
          <div className="text-xs text-gray-500">Avg Response Time</div>
          <div className="text-lg font-bold text-blue-600">
            {(
              metrics.reduce((sum, m) => sum + m.avgResponseTime * m.totalRequests, 0) /
              metrics.reduce((sum, m) => sum + m.totalRequests, 0)
            ).toFixed(0)}ms
          </div>
        </div>
        <div className="bg-white rounded p-3 border border-purple-200">
          <div className="text-xs text-gray-500">Total Failures</div>
          <div className="text-lg font-bold text-red-600">
            {metrics.reduce((sum, m) => sum + m.failedRequests, 0).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
