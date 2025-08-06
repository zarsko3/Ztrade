'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Target,
  Calendar,
  DollarSign,
  Filter,
  Download
} from 'lucide-react';

interface PerformanceData {
  summary: {
    totalTrades: number;
    openTrades: number;
    closedTrades: number;
    totalPnL: number;
    winRate: number;
    averageReturn: number;
    totalVolume: number;
    averageHoldingPeriod: number;
    portfolioReturn: number;
  };
  bestTrade: {
    id: number;
    ticker: string;
    pnl: number;
    entryDate: string;
    exitDate: string;
  } | null;
  worstTrade: {
    id: number;
    ticker: string;
    pnl: number;
    entryDate: string;
    exitDate: string;
  } | null;
  monthlyPerformance: Record<string, { pnl: number; trades: number; wins: number }>;
  tickerPerformance: Record<string, { pnl: number; trades: number; wins: number; volume: number }>;
  positionTypePerformance: {
    long: { trades: number; pnl: number; winRate: number };
    short: { trades: number; pnl: number; winRate: number };
  };
  sp500Comparison: {
    portfolioReturn: number;
    sp500Return: number;
    alpha: number;
    outperformance: boolean;
    startDate: string;
    endDate: string;
    period: string;
  } | null;
  filters: {
    period: string;
    ticker: string;
  };
}

function AnalyticsPageContent() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedTicker, setSelectedTicker] = useState('all');

  useEffect(() => {
    fetchPerformanceData();
  }, [selectedPeriod, selectedTicker]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching analytics data...');
      
      const params = new URLSearchParams();
      if (selectedPeriod !== 'all') params.append('period', selectedPeriod);
      if (selectedTicker !== 'all') params.append('ticker', selectedTicker);

      const response = await fetch(`/api/analytics/performance?${params}`);
      console.log('Analytics response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Analytics API failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Analytics data:', data);
      setPerformanceData(data);
      console.log('Analytics data loaded successfully');
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.0%';
    }
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-xl w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
        <p className="text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-gray-600 dark:text-gray-400">No performance data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Detailed performance analysis and insights
          </p>
        </div>
        <a
          href="/export?type=analytics"
          className="btn btn-outline flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Export Analytics</span>
        </a>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="flex flex-wrap gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time Period
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="input"
              >
                <option value="all">All Time</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ticker
              </label>
              <select
                value={selectedTicker}
                onChange={(e) => setSelectedTicker(e.target.value)}
                className="input"
              >
                <option value="all">All Tickers</option>
                {Object.keys(performanceData.tickerPerformance).map(ticker => (
                  <option key={ticker} value={ticker}>{ticker}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total P&L</h3>
          <p className={`text-2xl font-bold ${performanceData.summary.totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(performanceData.summary.totalPnL)}
          </p>
          <p className={`text-sm ${performanceData.summary.portfolioReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatPercentage(performanceData.summary.portfolioReturn)} return
          </p>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Win Rate</h3>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatPercentage(performanceData.summary.winRate)}
          </p>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Trades</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {performanceData.summary.totalTrades}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {performanceData.summary.openTrades} open, {performanceData.summary.closedTrades} closed
          </p>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Avg Hold Time</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.round(performanceData.summary.averageHoldingPeriod)} days
          </p>
        </div>
      </div>

      {/* S&P 500 Comparison */}
      {performanceData.sp500Comparison && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">S&P 500 Benchmark Comparison</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Analysis Period: {performanceData.sp500Comparison.period} ({performanceData.sp500Comparison.startDate} to {performanceData.sp500Comparison.endDate})
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Portfolio Return</p>
                  <p className={`text-2xl font-bold ${performanceData.sp500Comparison.portfolioReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatPercentage(performanceData.sp500Comparison.portfolioReturn)}
                  </p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">S&P 500 Return</p>
                  <p className={`text-2xl font-bold ${performanceData.sp500Comparison.sp500Return >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatPercentage(performanceData.sp500Comparison.sp500Return)}
                  </p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Alpha (Outperformance)</p>
                  <p className={`text-2xl font-bold ${performanceData.sp500Comparison.alpha >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatPercentage(performanceData.sp500Comparison.alpha)}
                  </p>
                </div>
              </div>
              
              <div className="text-center">
                <p className={`text-lg font-semibold ${performanceData.sp500Comparison.outperformance ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  {performanceData.sp500Comparison.outperformance 
                    ? `✅ Your portfolio outperformed the S&P 500 by ${formatPercentage(Math.abs(performanceData.sp500Comparison.alpha))}`
                    : `❌ Your portfolio underperformed the S&P 500 by ${formatPercentage(Math.abs(performanceData.sp500Comparison.alpha))}`
                  }
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  This comparison uses the same investment period as your trades for accurate benchmarking.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Best & Worst Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Best & Worst Trades</h3>
          </div>
          <div className="card-body space-y-6">
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Best Trade</span>
              </div>
              {performanceData.bestTrade ? (
                <>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {performanceData.bestTrade.ticker}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {formatCurrency(performanceData.bestTrade.pnl)}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {new Date(performanceData.bestTrade.entryDate).toLocaleDateString()} - {new Date(performanceData.bestTrade.exitDate).toLocaleDateString()}
                  </p>
                </>
              ) : (
                <p className="text-sm text-green-600 dark:text-green-400">No closed trades</p>
              )}
            </div>
            
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">Worst Trade</span>
              </div>
              {performanceData.worstTrade ? (
                <>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    {performanceData.worstTrade.ticker}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {formatCurrency(performanceData.worstTrade.pnl)}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {new Date(performanceData.worstTrade.entryDate).toLocaleDateString()} - {new Date(performanceData.worstTrade.exitDate).toLocaleDateString()}
                  </p>
                </>
              ) : (
                <p className="text-sm text-red-600 dark:text-red-400">No closed trades</p>
              )}
            </div>
          </div>
        </div>

        {/* Position Type Performance */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Position Type Performance</h3>
          </div>
          <div className="card-body space-y-6">
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Long Positions</span>
                <span className="badge badge-success">{performanceData.positionTypePerformance.long.trades} trades</span>
              </div>
              <p className={`text-lg font-bold ${performanceData.positionTypePerformance.long.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(performanceData.positionTypePerformance.long.pnl)}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Win Rate: {formatPercentage(performanceData.positionTypePerformance.long.winRate)}
              </p>
            </div>
            
            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Short Positions</span>
                <span className="badge badge-success">{performanceData.positionTypePerformance.short.trades} trades</span>
              </div>
              <p className={`text-lg font-bold ${performanceData.positionTypePerformance.short.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(performanceData.positionTypePerformance.short.pnl)}
              </p>
              <p className="text-sm text-purple-600 dark:text-purple-400">
                Win Rate: {formatPercentage(performanceData.positionTypePerformance.short.winRate)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ticker Performance */}
      {Object.keys(performanceData.tickerPerformance).length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ticker Performance</h3>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ticker
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      P&L
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Trades
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Win Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Volume
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {Object.entries(performanceData.tickerPerformance).map(([ticker, data]) => (
                    <tr key={ticker} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {ticker}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${data.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(data.pnl)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {data.trades}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatPercentage((data.wins / data.trades) * 100)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatCurrency(data.volume)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <AnalyticsPageContent />
    </ProtectedRoute>
  );
}