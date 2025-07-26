'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingDown, 
  Activity
} from 'lucide-react';
import PerformanceChart from '@/components/charts/PerformanceChart';
import DistributionChart from '@/components/charts/DistributionChart';
import DailySummary from '@/components/charts/DailySummary';
import RecentTradesWithCharts from '@/components/charts/RecentTradesWithCharts';

import EnhancedGaugeChart from '@/components/charts/EnhancedGaugeChart';
import WinLossComparison from '@/components/charts/WinLossComparison';
import MarketDataStatus from '@/components/ui/MarketDataStatus';
import { RealTimeDashboard } from '@/components/dashboard/RealTimeDashboard';
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

interface PerformanceData {
  date: string;
  pnl: number;
  cumulative: number;
  trades: number;
  winRate: number;
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
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
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

      // Generate performance data for charts
      const performanceData = generatePerformanceData(trades);
      setPerformanceData(performanceData);

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

  const generatePerformanceData = (trades: Trade[]): PerformanceData[] => {
    if (trades.length === 0) return [];

    // Group trades by month
    const monthlyData = new Map<string, { pnl: number; trades: number; wins: number }>();
    
    trades.forEach(trade => {
      if (trade.exitDate && trade.exitPrice) {
        const date = typeof trade.exitDate === 'string' ? new Date(trade.exitDate) : trade.exitDate;
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const pnl = trade.isShort 
          ? (trade.entryPrice - trade.exitPrice) * trade.quantity
          : (trade.exitPrice - trade.entryPrice) * trade.quantity;
        
        const existing = monthlyData.get(monthKey) || { pnl: 0, trades: 0, wins: 0 };
        existing.pnl += pnl;
        existing.trades += 1;
        if (pnl > 0) existing.wins += 1;
        
        monthlyData.set(monthKey, existing);
      }
    });

    // Convert to array and sort by date
    const sortedData = Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        pnl: data.pnl,
        trades: data.trades,
        winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0
      }));

    // Calculate cumulative P&L
    let cumulative = 0;
    return sortedData.map(item => {
      cumulative += item.pnl;
      return {
        ...item,
        cumulative
      };
    });
  };



  const getWinLossDistribution = () => {
    const closedTrades = trades.filter(trade => trade.exitDate && trade.exitPrice);
    const wins = closedTrades.filter(trade => {
      const pnl = trade.isShort 
        ? (trade.entryPrice - trade.exitPrice!) * trade.quantity
        : (trade.exitPrice! - trade.entryPrice) * trade.quantity;
      return pnl > 0;
    }).length;
    
    const losses = closedTrades.length - wins;
    
    return [
      { name: 'Winning Trades', value: wins, color: '#10b981' },
      { name: 'Losing Trades', value: losses, color: '#ef4444' }
    ];
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Trading Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Monitor your trading performance and portfolio insights
            </p>
            <MarketDataStatus className="mt-2" />
          </div>
          <button
            onClick={() => router.push('/trades/add')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Activity className="w-5 h-5" />
            <span>Add Trade</span>
          </button>
        </div>

        {/* Daily Summary */}
        <div className="mb-8">
          <DailySummary
            data={dailyData}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
          />
        </div>

        {/* Recent Trades with Charts */}
        <div className="mb-8">
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
        <div className="mb-8">
          <RealTimeDashboard 
            defaultSymbols={['^GSPC', 'AAPL', 'GOOGL', 'MSFT', 'TSLA']}
            showMarketData={true}
            showTradeUpdates={true}
            showPerformanceMetrics={true}
          />
        </div>

        {/* Performance Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

        {/* Performance Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Win/Loss Comparison */}
          <WinLossComparison
            winningAverage={calculateAverageWinningTrade(trades)}
            losingAverage={calculateAverageLosingTrade(trades)}
            winningCount={calculateWinningTrades(trades)}
            losingCount={calculateLosingTrades(trades)}
          />

          {/* Win/Loss Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Winning VS Losing Trades
            </h2>
            <DistributionChart
              data={getWinLossDistribution()}
              type="donut"
              title="Trade Outcomes"
              height={250}
              showLegend={true}
              showPercentage={true}
            />
          </div>
        </div>



        {/* Performance Over Time */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Performance Over Time
          </h2>
          <PerformanceChart
            data={performanceData}
            type="composed"
            height={300}
            showGrid={true}
            showLegend={true}
            animate={true}
          />
        </div>
      </div>
    </div>
  );
} 