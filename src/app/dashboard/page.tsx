'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingDown, 
  Activity
} from 'lucide-react';
import DistributionChart from '@/components/charts/DistributionChart';
import DailySummary from '@/components/charts/DailySummary';
import RecentTradesWithCharts from '@/components/charts/RecentTradesWithCharts';

import EnhancedGaugeChart from '@/components/charts/EnhancedGaugeChart';
import WinLossComparison from '@/components/charts/WinLossComparison';
import MarketDataStatus from '@/components/ui/MarketDataStatus';
import { RealTimeDashboard } from '@/components/dashboard/RealTimeDashboard';
import { EconomicNews } from '@/components/market/EconomicNews';
import { Trade } from '@/types/trade';

interface DashboardStats {
  totalTrades: number;
  totalPnL: number;
  winRate: number;
  averageHoldingPeriod: number;
  bestTrade: number;
  worstTrade: number;
  totalVolume: number;
  averageTradeSize: number;
}

interface DailyTradeData {
  date: string;
  dayOfWeek: string;
  pnl: number;
  trades: number;
}





export default function DashboardPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dailyData, setDailyData] = useState<DailyTradeData[]>([]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [currentDate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching trades from API...');
      const tradesResponse = await fetch('/api/trades');

      console.log('Response status:', tradesResponse.status);
      
      if (!tradesResponse.ok) {
        const errorText = await tradesResponse.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to fetch trades: ${tradesResponse.status} ${tradesResponse.statusText}`);
      }

      const tradesData = await tradesResponse.json();
      console.log('Trades data received:', tradesData);
      
      const trades = tradesData.trades || [];
      setTrades(trades);

      // Calculate dashboard stats
      const stats = calculateDashboardStats(trades);
      setStats(stats);

      // Generate daily summary data
      const dailyData = generateDailyData(trades, currentDate);
      setDailyData(dailyData);



      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      setLoading(false);
    }
  };

  const calculateDashboardStats = (trades: Trade[]): DashboardStats => {
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        totalPnL: 0,
        winRate: 0,
        averageHoldingPeriod: 0,
        bestTrade: 0,
        worstTrade: 0,
        totalVolume: 0,
        averageTradeSize: 0
      };
    }

    const closedTrades = trades.filter(trade => trade.exitDate && trade.exitPrice);
    const totalPnL = closedTrades.reduce((sum, trade) => {
      const pnl = trade.isShort 
        ? (trade.entryPrice - trade.exitPrice!) * trade.quantity
        : (trade.exitPrice! - trade.entryPrice) * trade.quantity;
      return sum + pnl;
    }, 0);

    const winningTrades = closedTrades.filter(trade => {
      const pnl = trade.isShort 
        ? (trade.entryPrice - trade.exitPrice!) * trade.quantity
        : (trade.exitPrice! - trade.entryPrice) * trade.quantity;
      return pnl > 0;
    });

    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

    const holdingPeriods = closedTrades.map(trade => {
      const entryDate = typeof trade.entryDate === 'string' ? new Date(trade.entryDate) : trade.entryDate;
      const exitDate = typeof trade.exitDate === 'string' ? new Date(trade.exitDate!) : trade.exitDate!;
      return Math.ceil((exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
    });

    const averageHoldingPeriod = holdingPeriods.length > 0 
      ? holdingPeriods.reduce((sum, days) => sum + days, 0) / holdingPeriods.length 
      : 0;

    const tradePnLs = closedTrades.map(trade => {
      return trade.isShort 
        ? (trade.entryPrice - trade.exitPrice!) * trade.quantity
        : (trade.exitPrice! - trade.entryPrice) * trade.quantity;
    });

    const bestTrade = tradePnLs.length > 0 ? Math.max(...tradePnLs) : 0;
    const worstTrade = tradePnLs.length > 0 ? Math.min(...tradePnLs) : 0;

    const totalVolume = trades.reduce((sum, trade) => sum + (trade.entryPrice * trade.quantity), 0);
    const averageTradeSize = trades.length > 0 ? totalVolume / trades.length : 0;

    return {
      totalTrades: trades.length,
      totalPnL,
      winRate,
      averageHoldingPeriod,
      bestTrade,
      worstTrade,
      totalVolume,
      averageTradeSize
    };
  };

  const generateDailyData = (trades: Trade[], date: Date): DailyTradeData[] => {
    const dailyData: DailyTradeData[] = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      
      const dayTrades = trades.filter(trade => {
        const tradeDate = typeof trade.entryDate === 'string' ? new Date(trade.entryDate) : trade.entryDate;
        return tradeDate.toDateString() === currentDate.toDateString();
      });
      
      const dayPnL = dayTrades.reduce((sum, trade) => {
        if (trade.exitDate && trade.exitPrice) {
          const pnl = trade.isShort 
            ? (trade.entryPrice - trade.exitPrice) * trade.quantity
            : (trade.exitPrice - trade.entryPrice) * trade.quantity;
          return sum + pnl;
        }
        return sum;
      }, 0);
      
      dailyData.push({
        date: currentDate.toISOString().split('T')[0],
        dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        pnl: dayPnL,
        trades: dayTrades.length
      });
    }
    
    return dailyData;
  };



  const generateTrendData = (trade: Trade): number[] => {
    // Generate mock trend data for the mini chart
    const basePrice = trade.entryPrice;
    const dataPoints = [];
    
    for (let i = 0; i < 10; i++) {
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
      dataPoints.push(basePrice * (1 + variation));
    }
    
    return dataPoints;
  };

  const calculateProfitFactor = (trades: Trade[]): number => {
    const closedTrades = trades.filter(trade => trade.exitDate && trade.exitPrice);
    const winningTrades = closedTrades.filter(trade => {
      const pnl = trade.isShort 
        ? (trade.entryPrice - trade.exitPrice!) * trade.quantity
        : (trade.exitPrice! - trade.entryPrice) * trade.quantity;
      return pnl > 0;
    });
    
    const losingTrades = closedTrades.filter(trade => {
      const pnl = trade.isShort 
        ? (trade.entryPrice - trade.exitPrice!) * trade.quantity
        : (trade.exitPrice! - trade.entryPrice) * trade.quantity;
      return pnl < 0;
    });
    
    const totalWins = winningTrades.reduce((sum, trade) => {
      const pnl = trade.isShort 
        ? (trade.entryPrice - trade.exitPrice!) * trade.quantity
        : (trade.exitPrice! - trade.entryPrice) * trade.quantity;
      return sum + pnl;
    }, 0);
    
    const totalLosses = losingTrades.reduce((sum, trade) => {
      const pnl = trade.isShort 
        ? (trade.entryPrice - trade.exitPrice!) * trade.quantity
        : (trade.exitPrice! - trade.entryPrice) * trade.quantity;
      return sum + Math.abs(pnl);
    }, 0);
    
    return totalLosses > 0 ? totalWins / totalLosses : 0;
  };

  const calculateAverageWinningTrade = (trades: Trade[]): number => {
    const closedTrades = trades.filter(trade => trade.exitDate && trade.exitPrice);
    const winningTrades = closedTrades.filter(trade => {
      const pnl = trade.isShort 
        ? (trade.entryPrice - trade.exitPrice!) * trade.quantity
        : (trade.exitPrice! - trade.entryPrice) * trade.quantity;
      return pnl > 0;
    });
    
    if (winningTrades.length === 0) return 0;
    
    const totalWins = winningTrades.reduce((sum, trade) => {
      const pnl = trade.isShort 
        ? (trade.entryPrice - trade.exitPrice!) * trade.quantity
        : (trade.exitPrice! - trade.entryPrice) * trade.quantity;
      return sum + pnl;
    }, 0);
    
    return totalWins / winningTrades.length;
  };

  const calculateAverageLosingTrade = (trades: Trade[]): number => {
    const closedTrades = trades.filter(trade => trade.exitDate && trade.exitPrice);
    const losingTrades = closedTrades.filter(trade => {
      const pnl = trade.isShort 
        ? (trade.entryPrice - trade.exitPrice!) * trade.quantity
        : (trade.exitPrice! - trade.entryPrice) * trade.quantity;
      return pnl < 0;
    });
    
    if (losingTrades.length === 0) return 0;
    
    const totalLosses = losingTrades.reduce((sum, trade) => {
      const pnl = trade.isShort 
        ? (trade.entryPrice - trade.exitPrice!) * trade.quantity
        : (trade.exitPrice! - trade.entryPrice) * trade.quantity;
      return sum + Math.abs(pnl);
    }, 0);
    
    return totalLosses / losingTrades.length;
  };

  const calculateWinningTrades = (trades: Trade[]): number => {
    const closedTrades = trades.filter(trade => trade.exitDate && trade.exitPrice);
    return closedTrades.filter(trade => {
      const pnl = trade.isShort 
        ? (trade.entryPrice - trade.exitPrice!) * trade.quantity
        : (trade.exitPrice! - trade.entryPrice) * trade.quantity;
      return pnl > 0;
    }).length;
  };

  const calculateLosingTrades = (trades: Trade[]): number => {
    const closedTrades = trades.filter(trade => trade.exitDate && trade.exitPrice);
    return closedTrades.filter(trade => {
      const pnl = trade.isShort 
        ? (trade.entryPrice - trade.exitPrice!) * trade.quantity
        : (trade.exitPrice! - trade.entryPrice) * trade.quantity;
      return pnl < 0;
    }).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <TrendingDown className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Error Loading Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Trading Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-3 text-lg">
              Monitor your trading performance and portfolio insights
            </p>
            <div className="mt-4">
              <MarketDataStatus className="mt-2" />
            </div>
          </div>
          <button
            onClick={() => router.push('/trades/add')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl flex items-center space-x-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Activity className="w-5 h-5" />
            <span className="font-medium">Add Trade</span>
          </button>
        </div>

        {/* Daily Summary */}
        <div className="mb-12">
          <DailySummary
            data={dailyData}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
          />
        </div>

        {/* Economic News */}
        <div className="mb-12">
          <EconomicNews />
        </div>

        {/* Recent Trades with Charts */}
        <div className="mb-12">
          <RecentTradesWithCharts
            trades={trades.slice(0, 3).map(trade => ({
              ...trade,
              entryDate: typeof trade.entryDate === 'string' ? trade.entryDate : trade.entryDate.toISOString(),
              exitDate: trade.exitDate ? (typeof trade.exitDate === 'string' ? trade.exitDate : trade.exitDate.toISOString()) : undefined,
              trend: generateTrendData(trade),
              pnl: trade.exitDate && trade.exitPrice ? 
                (trade.isShort ? 
                  (trade.entryPrice - trade.exitPrice) * trade.quantity :
                  (trade.exitPrice - trade.entryPrice) * trade.quantity
                ) : undefined
            }))}
          />
        </div>

        {/* Real-time Dashboard */}
        <div className="mb-12">
          <RealTimeDashboard 
            defaultSymbols={['^GSPC', 'AAPL', 'GOOGL', 'MSFT', 'TSLA']}
            showMarketData={true}
            showTradeUpdates={true}
            showPerformanceMetrics={true}
          />
        </div>

        {/* Performance Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <EnhancedGaugeChart
            title="Profit Factor"
            value={calculateProfitFactor(trades)}
            maxValue={3}
            type="profit-factor"
            size="md"
          />
          
          <EnhancedGaugeChart
            title="Win Rate"
            value={stats?.winRate || 0}
            maxValue={100}
            type="win-rate"
            size="md"
          />
          
          <EnhancedGaugeChart
            title="Total P&L"
            value={stats?.totalPnL || 0}
            maxValue={Math.max(Math.abs(stats?.totalPnL || 0) * 1.2, 1000)}
            type="pnl"
            size="md"
          />
          
          <EnhancedGaugeChart
            title="Total Trades"
            value={stats?.totalTrades || 0}
            maxValue={Math.max(stats?.totalTrades || 0, 50)}
            type="trades"
            size="md"
          />
        </div>



        {/* Win/Loss Comparison */}
        <div className="mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Win/Loss Comparison
            </h3>
            <WinLossComparison
              winningAverage={calculateAverageWinningTrade(trades)}
              losingAverage={calculateAverageLosingTrade(trades)}
              winningCount={calculateWinningTrades(trades)}
              losingCount={calculateLosingTrades(trades)}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 