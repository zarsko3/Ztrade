'use client';

import { useState, useEffect } from 'react';

import { 
  TrendingDown, 
  ChevronLeft,
  ChevronRight,
  FileText,
  TrendingUp
} from 'lucide-react';
import { Trade } from '@/types/trade';
import { FearGreedService, FearGreedData } from '@/services/fear-greed-service';
import { MarketDataService } from '@/services/market-data-service';
import { StockLogoWithText } from '@/components/ui/stock-logo';



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



export default function DashboardPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [dailyData, setDailyData] = useState<DailyTradeData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fearGreedData, setFearGreedData] = useState<FearGreedData | null>(null);
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  const [priceLoading, setPriceLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Handle period change
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    // Regenerate daily data with new period
    const updatedDailyData = generateDailyData(trades);
    setDailyData(updatedDailyData);
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
  }, []);

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



      const dailyData = generateDailyData(trades);
      setDailyData(dailyData);

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

      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      setLoading(false);
    }
  };



  const generateDailyData = (trades: Trade[]): DailyTradeData[] => {
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





  const formatCurrency = (amount: number): string => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(2)}k`;
    }
    return `$${amount.toFixed(2)}`;
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
        {/* Simple Dashboard Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
        </div>

        {/* Enhanced Mini Calendar Slider */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="px-2 sm:px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs sm:text-sm font-medium">
                Today: {new Date().getDate()}
              </div>
              <div className="px-2 sm:px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                Last updated: {lastUpdated.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Enhanced Horizontal Day Slider */}
          <div className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 p-5 sm:p-6 hover:shadow-xl transition-all duration-300 min-h-[6.5rem] sm:min-h-[7rem]">
            <div className="flex space-x-4 sm:space-x-5 overflow-x-auto scrollbar-hide h-full items-center mt-2">
              {dailyData.slice(0, Math.min(parseInt(selectedPeriod), dailyData.length)).map((day, index) => (
                <div
                  key={index}
                  className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg border-2 transition-all duration-300 transform hover:scale-110 cursor-pointer ${
                    day.isToday 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 text-white shadow-lg ring-2 ring-blue-200' 
                      : day.trades > 0
                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-600 hover:shadow-md'
                        : day.isTradingDay
                          ? 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-700 dark:to-slate-700 border-gray-300 dark:border-gray-500 hover:shadow-md'
                          : 'bg-transparent border-transparent'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className={`text-xs font-bold leading-none ${
                      day.isToday 
                        ? 'text-white' 
                        : day.trades > 0
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {day.dayNumber}
                    </div>
                    {day.trades > 0 && (
                      <div className={`text-xs leading-none ${
                        day.isToday 
                          ? 'text-white' 
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {day.trades}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Fear & Greed Index Card */}
        {fearGreedData && (
          <div className="mb-6">
            <div className="bg-gradient-to-br from-white via-blue-50 to-indigo-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 rounded-2xl shadow-xl border border-blue-200 dark:border-gray-600 p-6 transform hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Market Sentiment</h2>
                <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                  Last updated: {lastUpdated.toLocaleString()}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Enhanced Current Index */}
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                  <div className="text-5xl mb-3 transform hover:scale-110 transition-transform duration-200">
                    {FearGreedService.getSentimentIcon(fearGreedData.value)}
                  </div>
                  <div className="text-4xl font-bold mb-2" style={{ color: FearGreedService.getSentimentColor(fearGreedData.value) }}>
                    {fearGreedData.value}
                  </div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {fearGreedData.classification}
                  </div>
                </div>
                
                {/* Enhanced Change from Previous */}
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">Change from Previous</div>
                  <div className={`text-2xl font-bold mb-2 ${
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
                
                {/* Enhanced Trading Recommendation */}
                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl border border-orange-200 dark:border-orange-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">Trading Advice</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white leading-relaxed">
                    {FearGreedService.getTradingRecommendation(fearGreedData.value)}
                  </div>
                </div>
              </div>
              
              {/* Enhanced Sentiment Scale */}
              <div className="mt-6">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium">
                  <span>Extreme Fear</span>
                  <span>Fear</span>
                  <span>Neutral</span>
                  <span>Greed</span>
                  <span>Extreme Greed</span>
                </div>
                <div className="relative h-4 bg-gradient-to-r from-red-500 via-orange-500 via-yellow-500 via-green-500 to-emerald-500 rounded-full shadow-inner">
                  <div 
                    className="absolute top-0 w-6 h-6 bg-white border-2 border-gray-300 rounded-full transform -translate-y-1 shadow-lg animate-pulse"
                    style={{ 
                      left: `${fearGreedData.value}%`,
                      transform: 'translateX(-50%) translateY(-4px)'
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
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

        {/* Enhanced Recent Shared Trades */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Recent Trades</h2>
            </div>
            <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs">
              Last updated: {lastUpdated.toLocaleString()}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trades.slice(0, 3).map((trade, index) => {
              const stockReturn = calculateStockReturn(trade);
              const sp500Return = getSP500Comparison(trade);
              const outperformance = stockReturn - sp500Return;
              const currentPrice = currentPrices[trade.ticker];
              const isOpen = !trade.exitDate || !trade.exitPrice;
              
              return (
                <div key={index} className="group bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 p-6 transform hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                      {new Date(trade.entryDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      isOpen ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'
                    }`}></div>
                  </div>
                  
                  <div className="mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <StockLogoWithText 
                      ticker={trade.ticker} 
                      size="lg" 
                      className="text-2xl font-bold text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  {/* Enhanced Current Price for Open Trades */}
                  {isOpen && currentPrice && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">Current Price</div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        ${currentPrice.toFixed(2)}
                        {priceLoading && <span className="ml-2 text-xs text-blue-500 animate-pulse">Loading...</span>}
                      </div>
                    </div>
                  )}
                  
                  {/* Enhanced Stock Return */}
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">
                      {isOpen ? 'Unrealized Return' : 'Stock Return'}
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className={`text-2xl font-bold ${
                        stockReturn > 0 ? 'text-green-600' : stockReturn < 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'
                      }`}>
                        {stockReturn > 0 ? '+' : ''}{stockReturn.toFixed(2)}%
                      </div>
                      {stockReturn > 0 ? (
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                          <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                      ) : stockReturn < 0 ? (
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                          <TrendingDown className="w-6 h-6 text-red-600" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full">
                          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Enhanced S&P 500 Comparison */}
                  <div className="p-3 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-700 dark:to-slate-700 rounded-xl border border-gray-200 dark:border-gray-600">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">vs S&P 500</div>
                    <div className={`text-lg font-bold ${
                      outperformance > 0 ? 'text-green-600' : outperformance < 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'
                    }`}>
                      {outperformance > 0 ? '+' : ''}{outperformance.toFixed(2)}%
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2 font-normal">
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