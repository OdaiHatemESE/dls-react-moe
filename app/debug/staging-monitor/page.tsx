'use client';

/**
 * Staging Environment Monitor
 * 
 * Test PP API connectivity and performance in real-time
 */

import { useState } from 'react';

interface TestResult {
  timestamp: string;
  totalDuration: number;
  timings: Array<{
    operation: string;
    duration: number;
    status?: number;
    success: boolean;
    error?: string;
    details?: any;
  }>;
  queueMetrics: any;
  summary: any;
}

export default function StagingMonitorPage() {
  const [studentPersonId, setStudentPersonId] = useState('SST-1-1-Pers-1687158');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `/api/debug/pp-connection?studentPersonId=${encodeURIComponent(studentPersonId)}&detailed=true`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  const getDurationColor = (duration: number) => {
    if (duration < 1000) return 'text-green-600';
    if (duration < 3000) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Staging Environment Monitor</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">PP API Connection Test</h2>
        
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={studentPersonId}
            onChange={(e) => setStudentPersonId(e.target.value)}
            placeholder="Student Person ID"
            className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={runTest}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Testing...' : 'Run Test'}
          </button>
        </div>

        <p className="text-sm text-gray-600">
          This will test token fetch, IDH API connectivity, and measure performance.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 font-semibold mb-2">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600">Total Duration:</span>
                <span className={`ml-2 font-mono font-bold ${getDurationColor(result.totalDuration)}`}>
                  {result.totalDuration}ms
                </span>
              </div>
              <div>
                <span className="text-gray-600">All Tests Passed:</span>
                <span className={`ml-2 font-bold ${getStatusColor(result.summary.allTestsPassed)}`}>
                  {result.summary.allTestsPassed ? '✓ YES' : '✗ NO'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Slowest Operation:</span>
                <span className="ml-2 font-mono">
                  {result.summary.slowestOperation.operation} ({result.summary.slowestOperation.duration}ms)
                </span>
              </div>
              <div>
                <span className="text-gray-600">Timestamp:</span>
                <span className="ml-2 text-sm">{new Date(result.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {/* Timings */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Operation Timings</h3>
            <div className="space-y-4">
              {result.timings.map((timing, index) => (
                <div key={index} className="border rounded p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{timing.operation}</h4>
                    <span className={`font-mono font-bold ${getStatusColor(timing.success)}`}>
                      {timing.success ? '✓ SUCCESS' : '✗ FAILED'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <span className={`ml-2 font-mono ${getDurationColor(timing.duration)}`}>
                        {timing.duration}ms
                      </span>
                    </div>
                    {timing.status && (
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span className="ml-2 font-mono">{timing.status}</span>
                      </div>
                    )}
                  </div>

                  {timing.error && (
                    <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                      {timing.error}
                    </div>
                  )}

                  {timing.details && (
                    <details className="mt-2">
                      <summary className="text-sm text-gray-600 cursor-pointer">Show details</summary>
                      <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto">
                        {JSON.stringify(timing.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Queue Metrics */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">IDH Queue Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Requests:</span>
                <span className="ml-2 font-mono">{result.queueMetrics.totalRequests}</span>
              </div>
              <div>
                <span className="text-gray-600">Success Rate:</span>
                <span className="ml-2 font-mono">{result.queueMetrics.successRate}</span>
              </div>
              <div>
                <span className="text-gray-600">Failed Requests:</span>
                <span className="ml-2 font-mono">{result.queueMetrics.failedRequests}</span>
              </div>
              <div>
                <span className="text-gray-600">Retried Requests:</span>
                <span className="ml-2 font-mono">{result.queueMetrics.retriedRequests}</span>
              </div>
              <div>
                <span className="text-gray-600">Rate Limit Hits:</span>
                <span className="ml-2 font-mono">{result.queueMetrics.rateLimitHits}</span>
              </div>
              <div>
                <span className="text-gray-600">Queue Size:</span>
                <span className="ml-2 font-mono">{result.queueMetrics.currentQueueSize}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold mb-2">Debugging Tips:</h3>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li><strong>Token Fetch &gt; 3s:</strong> Check internal API routing or IIS configuration</li>
          <li><strong>IDH Fetch &gt; 5s:</strong> Check PP API gateway performance or network latency</li>
          <li><strong>Total Duration &gt; 10s:</strong> Check if requests are being queued (high queue size)</li>
          <li><strong>High retry count:</strong> PP API may be returning 429 or 5xx errors</li>
          <li><strong>Circuit breaker open:</strong> Too many consecutive failures - check external API health</li>
        </ul>
      </div>
    </div>
  );
}
