import React, { useState, useEffect } from 'react';
import { MoreVertical, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import TickerLogo from '@/components/ui/TickerLogo';
import marketDataService, { TradeReturnData } from '@/services/market-data-service';

interface TradeWithChart {
  id: number;
  ticker: string;
  entryDate: string;
  entryPrice: number;
  exitPrice?: number;
  exitDate?: string;
  quantity: number;
  isShort: boolean;
  pnl?: number;
  trend: number[]; // Price data points for mini chart
}

interface TradeWithReturns extends TradeWithChart {
  returnData?: TradeReturnData;
  isLoadingReturns?: boolean;
}

interface RecentTradesWithChartsProps {
  trades: TradeWithChart[];
}

export default function RecentTradesWithCharts({ trades }: RecentTradesWithChartsProps) {
  const [tradesWithReturns, setTradesWithReturns] = useState<TradeWithReturns[]>([]);

  useEffect(() => {
    const loadReturnData = async () => {
      // Set initial loading state
      setTradesWithReturns(trades.map(trade => ({
        ...trade,
        returnData: undefined,
        isLoadingReturns: true
      })));

      const tradesWithData = await Promise.all(
        trades.map(async (trade) => {
          try {
            const returnData = await marketDataService.getTradeReturnData({
              entryPrice: trade.entryPrice,
              exitPrice: trade.exitPrice,
              isShort: trade.isShort,
              entryDate: trade.entryDate,
              exitDate: trade.exitDate,
              ticker: trade.ticker
            });
            
            return {
              ...trade,
              returnData,
              isLoadingReturns: false
            };
          } catch (error) {
            console.error('Error loading return data for trade:', trade.id, error);
            return {
              ...trade,
              returnData: undefined,
              isLoadingReturns: false
            };
          }
        })
      );
      
      setTradesWithReturns(tradesWithData);
    };

    loadReturnData();
  }, [trades]);
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const getReturnColor = (percentage: number) => {
    if (percentage > 0) return 'text-green-600 dark:text-green-400';
    if (percentage < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getTrendColor = (trade: TradeWithChart) => {
    if (!trade.pnl) return 'text-gray-400';
    return trade.pnl > 0 ? 'text-green-500' : 'text-red-500';
  };

  const getTrendIcon = (trade: TradeWithChart) => {
    if (!trade.pnl) return null;
    return trade.pnl > 0 ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            ${payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Your recent shared trades
        </h2>
        <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {tradesWithReturns.map((trade) => (
          <div
            key={trade.id}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <TickerLogo ticker={trade.ticker} size="sm" showTicker={false} />
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {trade.ticker}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(trade.entryDate)}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Mini Chart */}
              <div className="w-20 h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trade.trend.map((value, index) => ({ price: value, time: index }))}>
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke={trade.pnl && trade.pnl > 0 ? '#10b981' : '#ef4444'}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Returns and S&P 500 Comparison */}
              <div className="flex flex-col items-end space-y-1">
                {trade.isLoadingReturns ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-500">Calculating...</span>
                  </div>
                ) : (
                  <>
                    {/* Trade Return */}
                    {trade.returnData && (
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${getReturnColor(trade.returnData.tradeReturnPercentage)}`}>
                          {formatPercentage(trade.returnData.tradeReturnPercentage)}
                        </span>
                        {getTrendIcon(trade)}
                      </div>
                    )}
                    
                    {/* S&P 500 Comparison */}
                    {trade.returnData && (
                      <div className="flex items-center space-x-1 text-xs">
                        <BarChart3 className="w-3 h-3 text-gray-400" />
                        <span className={`${getReturnColor(trade.returnData.sp500ReturnPercentage)}`}>
                          S&P 500: {formatPercentage(trade.returnData.sp500ReturnPercentage)}
                        </span>
                      </div>
                    )}
                    
                    {/* Outperformance */}
                    {trade.returnData && (
                      <div className="text-xs">
                        <span className={`${getReturnColor(trade.returnData.outperformance)}`}>
                          {trade.returnData.outperformance > 0 ? '+' : ''}{trade.returnData.outperformance.toFixed(2)}% vs S&P
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {tradesWithReturns.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No recent trades to display</p>
        </div>
      )}
    </div>
  );
} 