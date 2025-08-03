'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Database, Clock, AlertTriangle } from 'lucide-react';

interface MarketDataStatus {
  rateLimits: {
    requestsThisMinute: number;
    requestsThisHour: number;
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
    remainingThisMinute: number;
    remainingThisHour: number;
    utilizationPercent: {
      minute: number;
      hour: number;
    };
  };
  cache: {
    size: number;
    hitRate: number;
    symbols: string[];
  };
  service: {
    status: string;
    lastUpdated: string;
    uptime: number;
  };
}

export function MarketDataStatus() {
  const [status, setStatus] = useState<MarketDataStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/market-data/status');
      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }
      const data = await response.json();
      setStatus(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium">Error loading market data status</span>
        </div>
        <p className="text-sm text-red-500 dark:text-red-400 mt-1">{error}</p>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const getUtilizationColor = (percent: number) => {
    if (percent < 50) return 'text-green-600 dark:text-green-400';
    if (percent < 80) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getUtilizationBgColor = (percent: number) => {
    if (percent < 50) return 'bg-green-100 dark:bg-green-900/20';
    if (percent < 80) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Market Data Service Status
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rate Limits */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Rate Limits
          </h4>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">This Minute:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {status.rateLimits.requestsThisMinute}/{status.rateLimits.maxRequestsPerMinute}
                </span>
                <div className={`w-16 h-2 rounded-full ${getUtilizationBgColor(status.rateLimits.utilizationPercent.minute)}`}>
                  <div 
                    className={`h-2 rounded-full ${getUtilizationColor(status.rateLimits.utilizationPercent.minute).replace('text-', 'bg-')}`}
                    style={{ width: `${Math.min(status.rateLimits.utilizationPercent.minute, 100)}%` }}
                  ></div>
                </div>
                <span className={`text-xs ${getUtilizationColor(status.rateLimits.utilizationPercent.minute)}`}>
                  {status.rateLimits.utilizationPercent.minute}%
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">This Hour:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {status.rateLimits.requestsThisHour}/{status.rateLimits.maxRequestsPerHour}
                </span>
                <div className={`w-16 h-2 rounded-full ${getUtilizationBgColor(status.rateLimits.utilizationPercent.hour)}`}>
                  <div 
                    className={`h-2 rounded-full ${getUtilizationColor(status.rateLimits.utilizationPercent.hour).replace('text-', 'bg-')}`}
                    style={{ width: `${Math.min(status.rateLimits.utilizationPercent.hour, 100)}%` }}
                  ></div>
                </div>
                <span className={`text-xs ${getUtilizationColor(status.rateLimits.utilizationPercent.hour)}`}>
                  {status.rateLimits.utilizationPercent.hour}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cache Status */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Cache Status
          </h4>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Cached Symbols:</span>
              <span className="text-sm font-medium">{status.cache.size}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Hit Rate:</span>
              <span className="text-sm font-medium">{status.cache.hitRate}%</span>
            </div>

            {status.cache.symbols.length > 0 && (
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Recent Symbols:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {status.cache.symbols.slice(0, 5).map((symbol) => (
                    <span 
                      key={symbol}
                      className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
                    >
                      {symbol}
                    </span>
                  ))}
                  {status.cache.symbols.length > 5 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      +{status.cache.symbols.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service Status */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              status.service.status === 'operational' 
                ? 'bg-green-500' 
                : 'bg-red-500'
            }`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Service: {status.service.status}
            </span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Uptime: {Math.floor(status.service.uptime / 60)}m {Math.floor(status.service.uptime % 60)}s
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Last updated: {new Date(status.service.lastUpdated).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
} 