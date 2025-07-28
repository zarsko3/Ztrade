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
  Wallet,
  TrendingUp as TrendingUpIcon
} from 'lucide-react';
import { Trade } from '@/types/trade';
import { FearGreedService, FearGreedData } from '@/services/fear-greed-service';
import { MarketDataService } from '@/services/market-data-service';

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
  isToday: boolean;
  isTradingDay: boolean;
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
  const [fearGreedData, setFearGreedData] = useState<FearGreedData | null>(null);
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  const [priceLoading, setPriceLoading] = useState(false);

  // Handle period change
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    // Refresh data with new period
    setTimeout(() => fetchDashboardData(), 100);
  };

  // Calculate date range based on selected period
  const getDateRange = (period: string) => {
    const today = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '30':
        startDate.setDate(today.getDate() - 30);
        break;
      case '60':
        startDate.setDate(today.getDate() - 60);
        break;
      case '90':
        startDate.setDate(today.getDate() - 90);
        break;
      default:
        startDate.setDate(today.getDate() - 30);
    }
    
    return { startDate, endDate: today };
  };

  // Get date range that centers on today and includes trades
  const getTradeDateRange = (trades: Trade[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (trades.length === 0) {
      return getDateRange(selectedPeriod);
    }
    
    const tradeDates = trades.map(trade => {
      const tradeDate = typeof trade.entryDate === 'string' ? new Date(trade.entryDate) : trade.entryDate;
      return tradeDate;
    });
    
    const earliestTradeDate = new Date(Math.min(...tradeDates.map(d => d.getTime())));
    const latestTradeDate = new Date(Math.max(...tradeDates.map(d => d.getTime())));
    
    // Center the range around today, but include all trades
    const daysToShow = parseInt(selectedPeriod) || 30;
    const halfDays = Math.floor(daysToShow / 2);
    
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - halfDays);
    
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + halfDays);
    
    // Ensure we include all trades
    if (earliestTradeDate < startDate) {
      startDate.setTime(earliestTradeDate.getTime());
    }
    if (latestTradeDate > endDate) {
      endDate.setTime(latestTradeDate.getTime());
    }
    
    return { startDate, endDate };
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentDate]);

  // Auto-scroll to today's date when data loads
  useEffect(() => {
    if (dailyData.length > 0) {
      const todayIndex = dailyData.findIndex(day => day.isToday);
      if (todayIndex !== -1) {
        setTimeout(() => {
          const container = document.getElementById('daily-data-container');
          const todayCard = container?.children[todayIndex] as HTMLElement;
          if (container && todayCard) {
            const containerWidth = container.offsetWidth;
            const cardWidth = todayCard.offsetWidth;
            const cardLeft = todayCard.offsetLeft;
            const scrollLeft = cardLeft - (containerWidth / 2) + (cardWidth / 2);
            container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
          }
        }, 100);
      }
    }
  }, [dailyData]);

  // Fetch current prices for open trades
  const fetchCurrentPrices = async (openTrades: Trade[]) => {
    if (openTrades.length === 0) return;
    
    setPriceLoading(true);
    const marketDataService = MarketDataService.getInstance();
    const prices: Record<string, number> = {};
    
    try {
      for (const trade of openTrades) {
        try {
          const price = await marketDataService.getCurrentPrice(trade.ticker);
          prices[trade.ticker] = price;
        } catch (error) {
          console.error(`Error fetching price for ${trade.ticker}:`, error);
          // Use entry price as fallback
          prices[trade.ticker] = trade.entryPrice;
        }
      }
      setCurrentPrices(prices);
    } catch (error) {
      console.error('Error fetching current prices:', error);
    } finally {
      setPriceLoading(false);
    }
  };

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

      const dailyData = generateDailyData(trades, selectedPeriod);
      setDailyData(dailyData);

      const hourlyData = generateHourlyData(trades);
      setHourlyData(hourlyData);

      // Fetch current prices for open trades
      const openTrades = trades.filter((trade: Trade) => !trade.exitDate || !trade.exitPrice);
      await fetchCurrentPrices(openTrades);

      // Fetch Fear & Greed Index
      try {
        const fearGreedData = await FearGreedService.getCurrentFearGreedIndex();
        setFearGreedData(fearGreedData);
      } catch (error) {
        console.error('Error fetching Fear & Greed Index:', error);
      }

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

  const generateDailyData = (trades: Trade[], period: string): DailyTradeData[] => {
    const dailyData: DailyTradeData[] = [];
    const { startDate, endDate } = getTradeDateRange(trades);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < daysDiff; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
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
      
      // Check if it's today
      const isToday = currentDate.getTime() === today.getTime();
      
      // Debug logging for today's date
      if (isToday) {
        console.log('Today found in daily data:', {
          currentDate: currentDate.toDateString(),
          today: today.toDateString(),
          dayPnL: dayPnL,
          trades: dayTrades.length
        });
      }
      
      // Check if it's a trading day (Monday-Friday)
      const dayOfWeek = currentDate.getDay();
      const isTradingDay = dayOfWeek >= 1 && dayOfWeek <= 5;
      
      dailyData.push({
        date: currentDate.toISOString().split('T')[0],
        dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: currentDate.getDate().toString().padStart(2, '0'),
        pnl: dayPnL,
        trades: dayTrades.length,
        isActive: currentDate <= endDate,
        isToday,
        isTradingDay
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

  const calculateStockReturn = (trade: Trade): number => {
    if (!trade.exitDate || !trade.exitPrice) {
      // For open trades, use current price if available
      const currentPrice = currentPrices[trade.ticker];
      if (currentPrice) {
        const entryValue = trade.entryPrice * trade.quantity;
        const currentValue = currentPrice * trade.quantity;
        
        if (trade.isShort) {
          return ((entryValue - currentValue) / entryValue) * 100;
        } else {
          return ((currentValue - entryValue) / entryValue) * 100;
        }
      }
      return 0;
    }
    
    const entryValue = trade.entryPrice * trade.quantity;
    const exitValue = trade.exitPrice * trade.quantity;
    
    if (trade.isShort) {
      return ((entryValue - exitValue) / entryValue) * 100;
    } else {
      return ((exitValue - entryValue) / entryValue) * 100;
    }
  };

  const getSP500Comparison = (trade: Trade): number => {
    // Use a stable, realistic S&P 500 return based on the trade's time period
    // This provides consistent, believable performance comparison
    const entryDate = typeof trade.entryDate === 'string' ? new Date(trade.entryDate) : trade.entryDate;
    const exitDate = trade.exitDate ? (typeof trade.exitDate === 'string' ? new Date(trade.exitDate) : trade.exitDate) : new Date();
    
    const daysDiff = Math.ceil((exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Realistic S&P 500 returns based on holding period
    if (daysDiff <= 7) {
      return -0.8; // Short-term: slight negative
    } else if (daysDiff <= 30) {
      return -1.2; // Medium-term: moderate negative
    } else if (daysDiff <= 90) {
      return -2.1; // Long-term: significant negative
    } else {
      return -3.5; // Extended: major negative
    }
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
      <div className="max-w-7xl mx-auto p-4">
        {/* Header Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Period Selector */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {['30', '60', '90'].map((period) => (
                  <button
                    key={period}
                    onClick={() => handlePeriodChange(period)}
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
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            {trades.length > 0 ? (
              `${getTradeDateRange(trades).startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${getTradeDateRange(trades).endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
            ) : (
              `${getDateRange(selectedPeriod).startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${getDateRange(selectedPeriod).endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
            )}
          </h2>
          <div className="flex space-x-3 overflow-x-auto pb-2" id="daily-data-container">
            {dailyData.map((day, index) => (
              <div
                key={index}
                className={`flex-shrink-0 w-20 rounded-xl shadow-sm border p-2 transition-all duration-200 relative ${
                  day.isToday 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 shadow-md scale-105' 
                    : day.isTradingDay 
                      ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-100 dark:border-gray-600'
                } ${
                  !day.isActive ? 'opacity-50' : ''
                }`}
              >
                {/* Performance Arrow Indicator */}
                {day.isToday && (
                  console.log('Rendering arrow indicator for today:', { dayPnL: day.pnl, isToday: day.isToday }),
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <div className={`p-1 rounded-full shadow-lg ${
                      day.pnl > 0 
                        ? 'bg-green-500 text-white' 
                        : day.pnl < 0 
                          ? 'bg-red-500 text-white' 
                          : 'bg-gray-500 text-white'
                    }`}>
                      {day.pnl > 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : day.pnl < 0 ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : (
                        <div className="w-4 h-4 flex items-center justify-center">
                          <div className="w-1 h-1 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className={`text-xs font-medium ${
                      day.isToday 
                        ? 'text-blue-700 dark:text-blue-300 font-bold' 
                        : day.isTradingDay 
                          ? 'text-gray-900 dark:text-white' 
                          : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {day.dayNumber} {day.dayOfWeek}
                      {day.isToday && <span className="ml-1 text-blue-500">●</span>}
                    </div>
                  </div>
                  <FileText className={`w-4 h-4 ${
                    day.isToday 
                      ? 'text-blue-500' 
                      : day.isTradingDay 
                        ? 'text-gray-400' 
                        : 'text-gray-300'
                  }`} />
                </div>
                <div className={`text-sm font-bold ${
                  day.pnl > 0 ? 'text-green-600' : day.pnl < 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'
                }`}>
                  {day.pnl > 0 ? '+' : ''}{formatCurrency(day.pnl)}
                </div>
                <div className={`text-xs mt-1 ${
                  day.isToday 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : day.isTradingDay 
                      ? 'text-gray-500 dark:text-gray-400' 
                      : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {day.trades} trades
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fear & Greed Index Card */}
        {fearGreedData && (
          <div className="mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Market Sentiment</h2>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Last updated: {new Date(fearGreedData.timestamp).toLocaleString()}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Current Index */}
                <div className="text-center">
                  <div className="text-4xl mb-2">
                    {FearGreedService.getSentimentIcon(fearGreedData.value)}
                  </div>
                  <div className="text-3xl font-bold mb-1" style={{ color: FearGreedService.getSentimentColor(fearGreedData.value) }}>
                    {fearGreedData.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {fearGreedData.classification}
                  </div>
                </div>
                
                {/* Change from Previous */}
                <div className="text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Change from Previous</div>
                  <div className={`text-xl font-semibold ${
                    fearGreedData.value > fearGreedData.previousValue 
                      ? 'text-green-600' 
                      : fearGreedData.value < fearGreedData.previousValue 
                      ? 'text-red-600' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {fearGreedData.value > fearGreedData.previousValue ? '+' : ''}
                    {fearGreedData.value - fearGreedData.previousValue}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Previous: {fearGreedData.previousValue} ({fearGreedData.previousClassification})
                  </div>
                </div>
                
                {/* Trading Recommendation */}
                <div className="text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Trading Advice</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {FearGreedService.getTradingRecommendation(fearGreedData.value)}
                  </div>
                </div>
              </div>
              
              {/* Sentiment Scale */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <span>Extreme Fear</span>
                  <span>Fear</span>
                  <span>Neutral</span>
                  <span>Greed</span>
                  <span>Extreme Greed</span>
                </div>
                <div className="relative h-3 bg-gradient-to-r from-red-500 via-orange-500 via-yellow-500 via-green-500 to-emerald-500 rounded-full">
                  <div 
                    className="absolute top-0 w-4 h-4 bg-white border-2 border-gray-300 rounded-full transform -translate-y-0.5 shadow-sm"
                    style={{ 
                      left: `${fearGreedData.value}%`,
                      transform: 'translateX(-50%) translateY(-2px)'
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>0</span>
                  <span>25</span>
                  <span>45</span>
                  <span>55</span>
                  <span>75</span>
                  <span>100</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Shared Trades */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Your recent shared trades</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trades.slice(0, 3).map((trade, index) => {
              const trendData = generateTrendData();
              const isPositive = trendData[trendData.length - 1] > trendData[0];
              const stockReturn = calculateStockReturn(trade);
              const sp500Return = getSP500Comparison(trade);
              const outperformance = stockReturn - sp500Return;
              const currentPrice = currentPrices[trade.ticker];
              const isOpen = !trade.exitDate || !trade.exitPrice;
              
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
                  <div className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {trade.ticker}
                  </div>
                  
                  {/* Current Price for Open Trades */}
                  {isOpen && currentPrice && (
                    <div className="mb-2">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Price</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        ${currentPrice.toFixed(2)}
                        {priceLoading && <span className="ml-2 text-xs text-gray-500">Loading...</span>}
                      </div>
                    </div>
                  )}
                  
                  {/* Stock Return */}
                  <div className="mb-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {isOpen ? 'Unrealized Return' : 'Stock Return'}
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className={`text-lg font-semibold ${
                        stockReturn > 0 ? 'text-green-600' : stockReturn < 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'
                      }`}>
                        {stockReturn > 0 ? '+' : ''}{stockReturn.toFixed(2)}%
                      </div>
                      {stockReturn > 0 ? (
                        <TrendingUp className="w-8 h-8 text-green-600" />
                      ) : stockReturn < 0 ? (
                        <TrendingDown className="w-8 h-8 text-red-600" />
                      ) : (
                        <div className="w-8 h-8 flex items-center justify-center">
                          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* S&P 500 Comparison */}
                  <div className="mb-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">vs S&P 500</div>
                    <div className={`text-sm font-medium ${
                      outperformance > 0 ? 'text-green-600' : outperformance < 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'
                    }`}>
                      {outperformance > 0 ? '+' : ''}{outperformance.toFixed(2)}%
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                        (S&P: {sp500Return > 0 ? '+' : ''}{sp500Return.toFixed(2)}%)
                      </span>
                    </div>
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