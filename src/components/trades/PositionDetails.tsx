'use client';

import { useState, useEffect } from 'react';
import { Position, TradeWithCalculations } from '@/types/trade';
import { X, TrendingUp, TrendingDown, DollarSign, Calendar, Hash, FileText } from 'lucide-react';

interface PositionDetailsProps {
  position: Position;
  onClose: () => void;
  className?: string;
}

export function PositionDetails({ position, onClose, className = '' }: PositionDetailsProps) {
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  // Fetch current market price
  useEffect(() => {
    fetchCurrentPrice();
  }, [position.ticker]);

  const fetchCurrentPrice = async () => {
    try {
      setLoadingPrice(true);
      const response = await fetch(`/api/market-data/quote?symbol=${position.ticker}`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.data) {
          setCurrentPrice(data.data.price);
        }
      }
    } catch (error) {
      console.error('Error fetching current price:', error);
    } finally {
      setLoadingPrice(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(num);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const getPnLColor = (value: number) => {
    return value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Position Details: {position.ticker}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {position.isShort ? 'Short' : 'Long'} Position • {position.trades.length} entries
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Position Summary */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
          Position Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Shares</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatNumber(position.totalQuantity)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Average Entry Price</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(position.averageEntryPrice)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Investment</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(position.totalInvestment)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Fees</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(position.totalFees)}
            </p>
          </div>
        </div>

        {/* Current Value and P&L */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Current Price</p>
            <div className="flex items-center space-x-2">
              {loadingPrice ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
              ) : currentPrice ? (
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(currentPrice)}
                </p>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">N/A</p>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Current Value</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {position.currentValue ? formatCurrency(position.currentValue) : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Unrealized P&L</p>
            <div>
              <p className={`text-lg font-semibold ${getPnLColor(position.unrealizedPnL || 0)}`}>
                {position.unrealizedPnL !== undefined ? formatCurrency(position.unrealizedPnL) : 'N/A'}
              </p>
              {position.unrealizedPnLPercentage !== undefined && (
                <p className={`text-sm ${getPnLColor(position.unrealizedPnLPercentage)}`}>
                  {formatPercentage(position.unrealizedPnLPercentage)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Individual Entries */}
      <div className="p-6">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
          Individual Entries
        </h3>
        <div className="space-y-4">
          {position.trades.map((trade, index) => (
            <div
              key={trade.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Entry #{index + 1}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(trade.entryDate)}
                    </span>
                    {trade.isShort ? (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Quantity</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatNumber(trade.quantity)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Entry Price</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(trade.entryPrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Investment</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(trade.entryPrice * trade.quantity)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Fees</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(trade.fees || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Notes and Tags */}
                  {(trade.notes || trade.tags) && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      {trade.notes && (
                        <div className="flex items-start space-x-2 mb-2">
                          <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {trade.notes}
                          </p>
                        </div>
                      )}
                      {trade.tags && (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Tags:</span>
                          <div className="flex flex-wrap gap-1">
                            {trade.tags.split(',').map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full"
                              >
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
} 