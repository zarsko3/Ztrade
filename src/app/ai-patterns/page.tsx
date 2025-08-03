'use client';

import { useState, useEffect } from 'react';
import { TradingPattern, PatternDetectionResult } from '@/services/ai/pattern-recognition';

interface PatternAnalysisData {
  patterns: TradingPattern[];
  summary: {
    totalPatterns: number;
    mostProfitablePattern: string;
    averageConfidence: number;
    patternDistribution: Record<string, number>;
  };
  recommendations: string[];
  analysis: {
    totalTradesAnalyzed: number;
    closedTrades: number;
    openTrades: number;
    tickersAnalyzed: string[];
    dateRange: {
      start: string;
      end: string;
    };
  };
}

export default function AIPatternsPage() {
  const [patternData, setPatternData] = useState<PatternAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    ticker: '',
    minConfidence: 0.5,
    patternType: 'all'
  });

  useEffect(() => {
    fetchPatternAnalysis();
  }, [filters]);

  const fetchPatternAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        minConfidence: filters.minConfidence.toString(),
        limit: '50'
      });

      if (filters.ticker) {
        params.append('ticker', filters.ticker);
      }

      const response = await fetch(`/api/ai/patterns?${params}`);
      const result = await response.json();

      if (result.status === 'success') {
        setPatternData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch pattern analysis');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pattern analysis');
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const getPatternTypeColor = (type: string) => {
    switch (type) {
      case 'trend_following': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'mean_reversion': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'breakout': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'volume': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="text-red-600 dark:text-red-400">
            <div className="font-medium">Error loading pattern analysis</div>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Pattern Analysis</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Discover trading patterns and get AI-powered insights
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ticker Filter
            </label>
            <input
              type="text"
              value={filters.ticker}
              onChange={(e) => setFilters(prev => ({ ...prev, ticker: e.target.value.toUpperCase() }))}
              className="input"
              placeholder="e.g., AAPL"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Minimum Confidence
            </label>
            <select
              value={filters.minConfidence}
              onChange={(e) => setFilters(prev => ({ ...prev, minConfidence: parseFloat(e.target.value) }))}
              className="input"
            >
              <option value={0.3}>30%</option>
              <option value={0.5}>50%</option>
              <option value={0.7}>70%</option>
              <option value={0.8}>80%</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pattern Type
            </label>
            <select
              value={filters.patternType}
              onChange={(e) => setFilters(prev => ({ ...prev, patternType: e.target.value }))}
              className="input"
            >
              <option value="all">All Patterns</option>
              <option value="trend_following">Trend Following</option>
              <option value="mean_reversion">Mean Reversion</option>
              <option value="breakout">Breakout</option>
              <option value="volume">Volume</option>
            </select>
          </div>
        </div>
      </div>

      {patternData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Patterns</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{patternData.summary.totalPatterns}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Most Profitable</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{patternData.summary.mostProfitablePattern}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Confidence</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatPercentage(patternData.summary.averageConfidence)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Trades Analyzed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{patternData.analysis.totalTradesAnalyzed}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pattern Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pattern Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(patternData.summary.patternDistribution).map(([type, count]) => (
                <div key={type} className="text-center">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPatternTypeColor(type)}`}>
                    {type.replace('_', ' ').toUpperCase()}
                  </div>
                  <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendations */}
          {patternData.recommendations.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI Recommendations</h3>
              <div className="space-y-3">
                {patternData.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    </div>
                    <p className="ml-3 text-gray-700 dark:text-gray-300">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pattern List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Detected Patterns</h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {patternData.patterns.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No patterns detected with current filters.</p>
                </div>
              ) : (
                patternData.patterns.map((pattern) => (
                  <div key={pattern.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPatternTypeColor(pattern.type)}`}>
                            {pattern.type.replace('_', ' ').toUpperCase()}
                          </span>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{pattern.name}</h4>
                          <span className={`text-sm font-medium ${getConfidenceColor(pattern.confidence)}`}>
                            {formatPercentage(pattern.confidence)} confidence
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">{pattern.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Win Rate</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatPercentage(pattern.performance.winRate)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Avg Return</p>
                            <p className={`text-lg font-semibold ${pattern.performance.avgReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {formatCurrency(pattern.performance.avgReturn)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Trades</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">{pattern.performance.totalTrades}</p>
                          </div>
                        </div>

                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <p>Tickers: {pattern.trades.map(t => t.ticker).join(', ')}</p>
                          <p>Period: {new Date(pattern.metadata.startDate).toLocaleDateString()} - {new Date(pattern.metadata.endDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 