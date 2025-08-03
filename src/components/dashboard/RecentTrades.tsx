'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Trade } from '@/types/trade';
import { StockLogoWithText } from '@/components/ui/stock-logo';

interface RecentTradesProps {
  trades: Trade[];
  currentPrices: Record<string, number>;
  priceLoading: boolean;
  lastUpdated: Date;
  maxTrades?: number;
}

export default function RecentTrades({
  trades,
  currentPrices,
  priceLoading,
  lastUpdated,
  maxTrades = 3
}: RecentTradesProps) {
  const calculateStockReturn = (trade: Trade): number => {
    if (!trade.entryPrice) return 0;
    
    const currentPrice = currentPrices[trade.ticker];
    const exitPrice = trade.exitPrice;
    
    if (exitPrice) {
      // Closed trade
      return ((exitPrice - trade.entryPrice) / trade.entryPrice) * 100;
    } else if (currentPrice) {
      // Open trade with current price
      return ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100;
    }
    
    return 0;
  };

  const getSP500Comparison = (trade: Trade): number => {
    // This is a simplified version - in a real app, you'd fetch S&P 500 data
    // For now, we'll return a mock value
    const entryDate = new Date(trade.entryDate);
    const currentDate = new Date();
    const daysDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Mock S&P 500 return (roughly 0.1% per day on average)
    return daysDiff * 0.1;
  };

  if (trades.length === 0) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Recent Trades</h2>
          </div>
          <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs">
            Last updated: {lastUpdated.toLocaleString()}
          </div>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400 text-lg">
            No trades found. Start trading to see your recent activity here.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Your Recent Trades</h2>
        </div>
        <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs self-start sm:self-auto">
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {trades.slice(0, maxTrades).map((trade, index) => {
          const stockReturn = calculateStockReturn(trade);
          const sp500Return = getSP500Comparison(trade);
          const outperformance = stockReturn - sp500Return;
          const currentPrice = currentPrices[trade.ticker];
          const isOpen = !trade.exitDate || !trade.exitPrice;
          
          return (
            <div key={index} className="group bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 p-4 sm:p-6 transform hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
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
              <div className="mb-3 sm:mb-4">
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">
                  {isOpen ? 'Unrealized Return' : 'Stock Return'}
                </div>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className={`text-xl sm:text-2xl font-bold ${
                    stockReturn > 0 ? 'text-green-600' : stockReturn < 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'
                  }`}>
                    {stockReturn > 0 ? '+' : ''}{stockReturn.toFixed(2)}%
                  </div>
                  {stockReturn > 0 ? (
                    <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    </div>
                  ) : stockReturn < 0 ? (
                    <div className="p-1.5 sm:p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                      <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-400 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Enhanced S&P 500 Comparison */}
              <div className="p-2.5 sm:p-3 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-700 dark:to-slate-700 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1.5 sm:mb-2 font-medium">vs S&P 500</div>
                <div className={`text-base sm:text-lg font-bold ${
                  outperformance > 0 ? 'text-green-600' : outperformance < 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'
                }`}>
                  {outperformance > 0 ? '+' : ''}{outperformance.toFixed(2)}%
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 ml-1 sm:ml-2 font-normal">
                    (S&P: {sp500Return > 0 ? '+' : ''}{sp500Return.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 