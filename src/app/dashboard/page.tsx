'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingDown, 
  Activity,
  Edit3,
  ChevronLeft,
  ChevronRight,
  FileText,
  MoreVertical,
  TrendingUp,
  TrendingDown as TrendingDownIcon,
  Wallet
} from 'lucide-react';
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
  dayNumber: string;
  pnl: number;
  trades: number;
  isActive: boolean;
}

interface HourlyData {
  time: string;
  pnl: number;
  percentage: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dailyData, setDailyData] = useState<DailyTradeData[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
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
      
      const tradesResponse = await fetch('/api/trades');
      
      if (!tradesResponse.ok) {
        throw new Error(`Failed to fetch trades: ${tradesResponse.status}`);
      }

      const tradesData = await tradesResponse.json();
      const trades = tradesData.trades || [];
      setTrades(trades);

      const stats = calculateDashboardStats(trades);
      setStats(stats);

      const dailyData = generateDailyData(trades, currentDate);
      setDailyData(dailyData);

      const hourlyData = generateHourlyData(trades);
      setHourlyData(hourlyData);

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
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() - 13 + i);
      
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
        dayNumber: currentDate.getDate().toString().padStart(2, '0'),
        pnl: dayPnL,
        trades: dayTrades.length,
        isActive: currentDate <= today
      });
    }
    
    return dailyData;
  };

  const generateHourlyData = (trades: Trade[]): HourlyData[] => {
    const hourlyData: HourlyData[] = [];
    
    for (let hour = 0; hour < 24; hour++) {
      const hourTrades = trades.filter(trade => {
        const tradeDate = typeof trade.entryDate === 'string' ? new Date(trade.entryDate) : trade.entryDate;
        return tradeDate.getHours() === hour;
      });
      
      const hourPnL = hourTrades.reduce((sum, trade) => {
        if (trade.exitDate && trade.exitPrice) {
          const pnl = trade.isShort 
            ? (trade.entryPrice - trade.exitPrice) * trade.quantity
            : (trade.exitPrice - trade.entryPrice) * trade.quantity;
          return sum + pnl;
        }
        return sum;
      }, 0);
      
      const percentage = trades.length > 0 ? (hourTrades.length / trades.length) * 100 : 0;
      
      hourlyData.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        pnl: hourPnL,
        percentage: percentage
      });
    }
    
    return hourlyData.slice(0, 8); // Show first 8 hours
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

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(2)}k`;
    }
    return `$${amount.toFixed(2)}`;
  };

  const generateTrendData = (): number[] => {
    return Array.from({ length: 10 }, () => Math.random() * 100 + 50);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <button className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <Edit3 className="w-4 h-4" />
                <span>Edit layout</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Period Selector */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {['30', '60', '90', 'Custom'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      selectedPeriod === period
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {period === 'Custom' ? period : `${period} days`}
                  </button>
                ))}
              </div>
              
              {/* Navigation Controls */}
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md text-sm font-medium">
                  Today
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Performance Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">May, 2024</h2>
          <div className="flex space-x-3 overflow-x-auto pb-2">
            {dailyData.map((day, index) => (
              <div
                key={index}
                className={`flex-shrink-0 w-24 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 ${
                  !day.isActive ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {day.dayNumber} {day.dayOfWeek}
                    </div>
                  </div>
                  <FileText className="w-4 h-4 text-gray-400" />
                </div>
                <div className={`text-lg font-bold ${
                  day.pnl > 0 ? 'text-green-600' : day.pnl < 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'
                }`}>
                  {day.pnl > 0 ? '+' : ''}{formatCurrency(day.pnl)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {day.trades} trades
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Shared Trades */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your recent shared trades</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trades.slice(0, 3).map((trade, index) => {
              const trendData = generateTrendData();
              const isPositive = trendData[trendData.length - 1] > trendData[0];
              
              return (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {new Date(trade.entryDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                                     <div className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                     {trade.ticker}
                   </div>
                  <div className="h-12 flex items-center">
                    <svg className="w-full h-8" viewBox="0 0 100 30">
                      <polyline
                        fill="none"
                        stroke={isPositive ? '#10B981' : '#EF4444'}
                        strokeWidth="2"
                        points={trendData.map((value, i) => `${i * 10},${30 - (value / 150) * 30}`).join(' ')}
                      />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </div>


      </div>
    </div>
  );
} 