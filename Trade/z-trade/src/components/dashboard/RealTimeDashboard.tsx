'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';


import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';

interface RealTimeDashboardProps {
  defaultSymbols?: string[];
  showMarketData?: boolean;
  showTradeUpdates?: boolean;
  showPerformanceMetrics?: boolean;
}

export function RealTimeDashboard({
  defaultSymbols = ['^GSPC', 'AAPL', 'GOOGL', 'MSFT'],
  showMarketData = true,
  showTradeUpdates = true,
  showPerformanceMetrics = true,
}: RealTimeDashboardProps) {
  const {
    performanceUpdates,
  } = useWebSocket({
    autoConnect: true,
    marketDataSymbols: [],
    enableTradeUpdates: showTradeUpdates,
    enablePerformanceUpdates: showPerformanceMetrics,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">


      {/* Performance Metrics */}
      {showPerformanceMetrics && performanceUpdates && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Live Performance Metrics
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Return
                </span>
              </div>
              <div className={`text-2xl font-bold ${
                performanceUpdates.totalReturn >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(performanceUpdates.totalReturn)}
              </div>
              <div className={`text-sm ${
                performanceUpdates.totalReturnPercent >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatPercentage(performanceUpdates.totalReturnPercent)}
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Win Rate
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {(performanceUpdates.winRate * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {performanceUpdates.totalTrades} total trades
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Open Trades
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {performanceUpdates.openTrades}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Active positions
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingDown className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Last Update
                </span>
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {new Date(performanceUpdates.timestamp).toLocaleTimeString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Real-time
              </div>
            </div>
          </div>
        </div>
      )}






    </div>
  );
} 