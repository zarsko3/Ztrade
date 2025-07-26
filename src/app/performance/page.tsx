'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  Target,
  DollarSign,
  Activity
} from 'lucide-react';
import PerformanceSummaryCards from '@/components/performance/PerformanceSummaryCards';
import PerformanceCharts from '@/components/performance/PerformanceCharts';
import { performanceAnalysisService } from '@/services/performance-analysis-service';
import ExportButton from '@/components/export/ExportButton';

interface PerformancePageState {
  timeframe: 'weekly' | 'monthly' | 'yearly';
  year: number;
  ticker: string;
  loading: boolean;
  error: string | null;
  data: {
    weekly?: any;
    monthly?: any;
    yearly?: any;
    summary?: any;
  };
}

export default function PerformancePage() {
  const [state, setState] = useState<PerformancePageState>({
    timeframe: 'monthly',
    year: new Date().getFullYear(),
    ticker: 'all',
    loading: true,
    error: null,
    data: {}
  });

  const [trades, setTrades] = useState([]);

  useEffect(() => {
    fetchPerformanceData();
  }, [state.timeframe, state.year, state.ticker]);

  const fetchPerformanceData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Fetch trades first
      const tradesResponse = await fetch('/api/trades');
      if (!tradesResponse.ok) throw new Error('Failed to fetch trades');
      const tradesData = await tradesResponse.json();
      const allTrades = tradesData.trades || [];
      setTrades(allTrades);

      // Fetch performance data based on timeframe
      let performanceResponse;
      const params = new URLSearchParams();
      
      if (state.ticker !== 'all') params.append('ticker', state.ticker);
      
      switch (state.timeframe) {
        case 'weekly':
          params.append('year', state.year.toString());
          performanceResponse = await fetch(`/api/performance/weekly?${params}`);
          break;
        case 'monthly':
          params.append('year', state.year.toString());
          performanceResponse = await fetch(`/api/performance/monthly?${params}`);
          break;
        case 'yearly':
          performanceResponse = await fetch(`/api/performance/yearly?${params}`);
          break;
      }

      if (!performanceResponse?.ok) {
        throw new Error(`Failed to fetch ${state.timeframe} performance data`);
      }

      const performanceData = await performanceResponse.json();

      // Calculate summary metrics using the service
      const metrics = performanceAnalysisService.calculatePerformanceMetrics(allTrades);

      setState(prev => ({
        ...prev,
        loading: false,
        data: {
          ...prev.data,
          [state.timeframe]: performanceData,
          summary: metrics
        }
      }));

    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load performance data'
      }));
    }
  };

  const handleTimeframeChange = (newTimeframe: 'weekly' | 'monthly' | 'yearly') => {
    setState(prev => ({ ...prev, timeframe: newTimeframe }));
  };

  const handleYearChange = (newYear: number) => {
    setState(prev => ({ ...prev, year: newYear }));
  };

  const handleTickerChange = (newTicker: string) => {
    setState(prev => ({ ...prev, ticker: newTicker }));
  };

  const handleExportSuccess = (filename: string) => {
    console.log(`Performance data exported successfully: ${filename}`);
  };

  const handleExportError = (error: string) => {
    console.error('Export failed:', error);
  };

  const formatChartData = () => {
    const currentData = state.data[state.timeframe];
    if (!currentData) return [];

    switch (state.timeframe) {
      case 'weekly':
        return currentData.weeks?.map((week: any, index: number) => ({
          period: week.week,
          totalPnL: week.totalPnL,
          cumulativePnL: currentData.weeks.slice(0, index + 1).reduce((sum: number, w: any) => sum + w.totalPnL, 0),
          trades: week.totalTrades,
          winRate: week.winRate
        })) || [];
      
      case 'monthly':
        return currentData.months?.map((month: any, index: number) => ({
          period: month.month,
          totalPnL: month.totalPnL,
          cumulativePnL: currentData.months.slice(0, index + 1).reduce((sum: number, m: any) => sum + m.totalPnL, 0),
          trades: month.totalTrades,
          winRate: month.winRate
        })) || [];
      
      case 'yearly':
        return currentData.years?.map((year: any, index: number) => ({
          period: year.year.toString(),
          totalPnL: year.totalPnL,
          cumulativePnL: currentData.years.slice(0, index + 1).reduce((sum: number, y: any) => sum + y.totalPnL, 0),
          trades: year.totalTrades,
          winRate: year.winRate
        })) || [];
      
      default:
        return [];
    }
  };

  const getTickerOptions = () => {
    // Extract unique tickers from trades
    const tickers = [...new Set(trades.map((trade: any) => trade.ticker))];
    return ['all', ...tickers.sort()];
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= currentYear - 10; year--) {
      years.push(year);
    }
    return years;
  };

  const currentData = state.data[state.timeframe];
  const chartData = formatChartData();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Performance Analysis
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Comprehensive trading performance metrics and insights
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <ExportButton
              type="performance"
              variant="outline"
              ticker={state.ticker !== 'all' ? state.ticker : undefined}
              onSuccess={handleExportSuccess}
              onError={handleExportError}
            >
              Export Performance
            </ExportButton>
            
            <button
              onClick={fetchPerformanceData}
              disabled={state.loading}
              className="btn-primary flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${state.loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Timeframe Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Timeframe
              </label>
              <div className="flex items-center space-x-1">
                {(['weekly', 'monthly', 'yearly'] as const).map(timeframe => (
                  <button
                    key={timeframe}
                    onClick={() => handleTimeframeChange(timeframe)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors flex items-center space-x-2
                      ${state.timeframe === timeframe 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }
                    `}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{timeframe}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Year Selection */}
            {(state.timeframe === 'weekly' || state.timeframe === 'monthly') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Year
                </label>
                <select
                  value={state.year}
                  onChange={(e) => handleYearChange(parseInt(e.target.value))}
                  className="input w-full"
                >
                  {getYearOptions().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Ticker Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ticker
              </label>
              <select
                value={state.ticker}
                onChange={(e) => handleTickerChange(e.target.value)}
                className="input w-full"
              >
                {getTickerOptions().map(ticker => (
                  <option key={ticker} value={ticker}>
                    {ticker === 'all' ? 'All Tickers' : ticker}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {state.loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading performance data...</span>
          </div>
        )}

        {/* Error State */}
        {state.error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-red-800 dark:text-red-200 font-medium">Error</span>
            </div>
            <p className="text-red-700 dark:text-red-300 mt-2">{state.error}</p>
            <button
              onClick={fetchPerformanceData}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Performance Summary Cards */}
        {!state.loading && !state.error && state.data.summary && (
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <Target className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Performance Summary
              </h2>
            </div>
            <PerformanceSummaryCards 
              metrics={state.data.summary}
              showComparison={false}
            />
          </div>
        )}

        {/* Performance Charts */}
        {!state.loading && !state.error && chartData.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Performance Analysis Charts
              </h2>
            </div>
            <PerformanceCharts
              data={chartData}
              timeframe={state.timeframe}
              height={400}
              showCumulative={true}
            />
          </div>
        )}

        {/* Summary Statistics */}
        {!state.loading && !state.error && currentData && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 mb-6">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {state.timeframe.charAt(0).toUpperCase() + state.timeframe.slice(1)} Summary
              </h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentData.summary?.totalPnL ? 
                    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(currentData.summary.totalPnL) :
                    'N/A'
                  }
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total P&L</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentData.summary?.totalTrades || 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Trades</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentData.summary?.overallWinRate ? 
                    `${currentData.summary.overallWinRate.toFixed(1)}%` : 
                    'N/A'
                  }
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Win Rate</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentData.summary?.sharpeRatio ? 
                    currentData.summary.sharpeRatio.toFixed(2) : 
                    'N/A'
                  }
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sharpe Ratio</p>
              </div>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!state.loading && !state.error && (!currentData || chartData.length === 0) && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Performance Data Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No {state.timeframe} performance data found for the selected filters.
            </p>
            <button
              onClick={() => {
                setState(prev => ({ ...prev, ticker: 'all', year: new Date().getFullYear() }));
              }}
              className="btn-primary"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 