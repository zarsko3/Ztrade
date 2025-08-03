'use client';

import { useState, useEffect } from 'react';
import { 
  PieChart, 
  BarChart3, 
  TrendingUp, 
  DollarSign,
  Target,
  Briefcase,
  Filter
} from 'lucide-react';
import TickerLogo from '@/components/ui/TickerLogo';

interface Trade {
  id: number;
  ticker: string;
  entryDate: string;
  entryPrice: number;
  exitDate?: string;
  exitPrice?: number;
  quantity: number;
  fees: number;
  notes?: string;
  tags?: string[];
  isShort: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PortfolioAllocation {
  ticker: string;
  totalValue: number;
  totalPnL: number;
  percentageOfPortfolio: number;
  tradeCount: number;
  averagePositionSize: number;
  isShort: boolean;
  sector?: string;
  marketCap?: string;
}

interface SectorAllocation {
  sector: string;
  totalValue: number;
  totalPnL: number;
  percentageOfPortfolio: number;
  tradeCount: number;
  averageReturn: number;
}

export default function PortfolioPage() {
  const [, setTrades] = useState<Trade[]>([]);
  const [allocation, setAllocation] = useState<PortfolioAllocation[]>([]);
  const [sectorAllocation, setSectorAllocation] = useState<SectorAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'ticker' | 'sector'>('ticker');

  // Mock sector data (in a real app, this would come from an API)
  const sectorData: { [key: string]: string } = {
    'AAPL': 'Technology',
    'MSFT': 'Technology',
    'GOOGL': 'Technology',
    'AMZN': 'Consumer Discretionary',
    'TSLA': 'Consumer Discretionary',
    'NVDA': 'Technology',
    'META': 'Technology',
    'NFLX': 'Communication Services',
    'SPY': 'ETF',
    'QQQ': 'ETF',
    'IWM': 'ETF',
    'GLD': 'Commodities',
    'SLV': 'Commodities',
    'BTC': 'Cryptocurrency',
    'ETH': 'Cryptocurrency'
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      const response = await fetch('/api/trades');
      if (!response.ok) throw new Error('Failed to fetch trades');
      const data = await response.json();
      setTrades(data.trades || []);
      calculateAllocation(data.trades || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trades');
    } finally {
      setLoading(false);
    }
  };

  const calculateAllocation = (trades: Trade[]) => {
    // Group trades by ticker
    const tickerGroups: { [key: string]: Trade[] } = {};
    
    trades.forEach(trade => {
      if (!tickerGroups[trade.ticker]) {
        tickerGroups[trade.ticker] = [];
      }
      tickerGroups[trade.ticker].push(trade);
    });

    // Calculate allocation for each ticker
    const allocations: PortfolioAllocation[] = Object.entries(tickerGroups).map(([ticker, tickerTrades]) => {
      const totalValue = tickerTrades.reduce((sum, trade) => {
        const currentPrice = trade.exitPrice || trade.entryPrice;
        return sum + (currentPrice * trade.quantity);
      }, 0);

      const totalPnL = tickerTrades.reduce((sum, trade) => {
        if (trade.exitPrice) {
          const grossPnL = trade.isShort 
            ? (trade.entryPrice - trade.exitPrice) * trade.quantity
            : (trade.exitPrice - trade.entryPrice) * trade.quantity;
          return sum + grossPnL - trade.fees;
        }
        return sum;
      }, 0);

      const averagePositionSize = totalValue / tickerTrades.length;
      const isShort = tickerTrades.some(trade => trade.isShort);

      return {
        ticker,
        totalValue,
        totalPnL,
        percentageOfPortfolio: 0, // Will be calculated after total portfolio value
        tradeCount: tickerTrades.length,
        averagePositionSize,
        isShort,
        sector: sectorData[ticker] || 'Other'
      };
    });

    // Calculate total portfolio value and percentages
    const totalPortfolioValue = allocations.reduce((sum, alloc) => sum + alloc.totalValue, 0);
    
    allocations.forEach(alloc => {
      alloc.percentageOfPortfolio = totalPortfolioValue > 0 ? (alloc.totalValue / totalPortfolioValue) * 100 : 0;
    });

    // Sort by portfolio percentage (descending)
    allocations.sort((a, b) => b.percentageOfPortfolio - a.percentageOfPortfolio);
    setAllocation(allocations);

    // Calculate sector allocation
    const sectorGroups: { [key: string]: PortfolioAllocation[] } = {};
    allocations.forEach(alloc => {
      const sector = alloc.sector || 'Other';
      if (!sectorGroups[sector]) {
        sectorGroups[sector] = [];
      }
      sectorGroups[sector].push(alloc);
    });

    const sectorAllocations: SectorAllocation[] = Object.entries(sectorGroups).map(([sector, sectorAllocs]) => {
      const totalValue = sectorAllocs.reduce((sum, alloc) => sum + alloc.totalValue, 0);
      const totalPnL = sectorAllocs.reduce((sum, alloc) => sum + alloc.totalPnL, 0);
      const tradeCount = sectorAllocs.reduce((sum, alloc) => sum + alloc.tradeCount, 0);
      const averageReturn = totalValue > 0 ? (totalPnL / totalValue) * 100 : 0;

      return {
        sector,
        totalValue,
        totalPnL,
        percentageOfPortfolio: totalPortfolioValue > 0 ? (totalValue / totalPortfolioValue) * 100 : 0,
        tradeCount,
        averageReturn
      };
    });

    // Sort sectors by portfolio percentage (descending)
    sectorAllocations.sort((a, b) => b.percentageOfPortfolio - a.percentageOfPortfolio);
    setSectorAllocation(sectorAllocations);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getPerformanceColor = (pnl: number) => {
    if (pnl > 0) return 'text-green-600 dark:text-green-400';
    if (pnl < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getSectorColor = (sector: string) => {
    const colors: { [key: string]: string } = {
      'Technology': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
      'Consumer Discretionary': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
      'Communication Services': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200',
      'ETF': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
      'Commodities': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200',
      'Cryptocurrency': 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-200',
      'Other': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
    };
    return colors[sector] || colors['Other'];
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

  const totalPortfolioValue = allocation.reduce((sum, alloc) => sum + alloc.totalValue, 0);
  const totalPortfolioPnL = allocation.reduce((sum, alloc) => sum + alloc.totalPnL, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Portfolio</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Portfolio allocation and performance overview
        </p>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Value</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(totalPortfolioValue)}
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total P&L</h3>
          <p className={`text-2xl font-bold ${totalPortfolioPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(totalPortfolioPnL)}
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Holdings</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {allocation.length}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Unique positions
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Avg Return</h3>
          <p className={`text-2xl font-bold ${totalPortfolioValue > 0 ? getPerformanceColor(totalPortfolioPnL) : 'text-gray-900 dark:text-white'}`}>
            {totalPortfolioValue > 0 ? formatPercentage((totalPortfolioPnL / totalPortfolioValue) * 100) : '0%'}
          </p>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Allocation View</h3>
            </div>
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
              <button
                onClick={() => setViewMode('ticker')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === 'ticker'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Ticker</span>
                </div>
              </button>
              <button
                onClick={() => setViewMode('sector')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === 'sector'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <PieChart className="w-4 h-4" />
                  <span>Sector</span>
                </div>
              </button>
            </div>
          </div>
        </div>
        <div className="card-body">
          {viewMode === 'ticker' ? (
            <div className="space-y-4">
              {allocation.length > 0 ? (
                allocation.map((item) => (
                  <div key={item.ticker} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-center space-x-4">
                      <TickerLogo ticker={item.ticker} size="md" showTicker={false} />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{item.ticker}</h4>
                          <span className={`badge ${item.isShort ? 'badge-danger' : 'badge-success'}`}>
                            {item.isShort ? 'Short' : 'Long'}
                          </span>
                          <span className={`badge ${getSectorColor(item.sector || 'Other')}`}>
                            {item.sector || 'Other'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.tradeCount} trades • {formatCurrency(item.averagePositionSize)} avg
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(item.totalValue)}
                      </p>
                      <p className={`text-sm ${getPerformanceColor(item.totalPnL)}`}>
                        {formatCurrency(item.totalPnL)} ({formatPercentage(item.percentageOfPortfolio)})
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">No portfolio data available</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {sectorAllocation.length > 0 ? (
                sectorAllocation.map((item) => (
                  <div key={item.sector} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-xl flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                          {item.sector.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{item.sector}</h4>
                          <span className="badge badge-neutral">{item.tradeCount} trades</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Avg Return: {formatPercentage(item.averageReturn)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(item.totalValue)}
                      </p>
                      <p className={`text-sm ${getPerformanceColor(item.totalPnL)}`}>
                        {formatCurrency(item.totalPnL)} ({formatPercentage(item.percentageOfPortfolio)})
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <PieChart className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">No sector data available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 