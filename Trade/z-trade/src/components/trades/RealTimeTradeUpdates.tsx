'use client';

import React, { useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { TradeUpdate } from '@/services/websocket-service';
import { Bell, X, Plus, Edit, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

interface RealTimeTradeUpdatesProps {
  maxUpdates?: number;
  autoConnect?: boolean;
  showConnectionStatus?: boolean;
}

export function RealTimeTradeUpdates({ 
  maxUpdates = 10,
  autoConnect = true,
  showConnectionStatus = true 
}: RealTimeTradeUpdatesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    isConnected,
    connectionStatus,
    tradeUpdates,
    clearTradeUpdates,
  } = useWebSocket({
    autoConnect,
    marketDataSymbols: [],
    enableTradeUpdates: true,
    enablePerformanceUpdates: false,
  });

  const getActionIcon = (action: TradeUpdate['action']) => {
    switch (action) {
      case 'created':
        return <Plus className="w-4 h-4 text-green-500" />;
      case 'updated':
        return <Edit className="w-4 h-4 text-blue-500" />;
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-purple-500" />;
      case 'deleted':
        return <Trash2 className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActionColor = (action: TradeUpdate['action']) => {
    switch (action) {
      case 'created':
        return 'text-green-600 dark:text-green-400';
      case 'updated':
        return 'text-blue-600 dark:text-blue-400';
      case 'closed':
        return 'text-purple-600 dark:text-purple-400';
      case 'deleted':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getActionText = (action: TradeUpdate['action']) => {
    switch (action) {
      case 'created':
        return 'Trade Created';
      case 'updated':
        return 'Trade Updated';
      case 'closed':
        return 'Trade Closed';
      case 'deleted':
        return 'Trade Deleted';
      default:
        return 'Trade Modified';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'connecting':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />;
      case 'error':
        return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Live';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Error';
      default:
        return 'Offline';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Trade Updates
          </h3>
          {showConnectionStatus && (
            <div className="flex items-center space-x-1 text-xs">
              {getConnectionStatusIcon()}
              <span className="text-gray-600 dark:text-gray-400">
                {getConnectionStatusText()}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {tradeUpdates.length > 0 && (
            <button
              onClick={clearTradeUpdates}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Clear
            </button>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Trade Updates List */}
      <div className="p-4">
        {tradeUpdates.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p>No trade updates yet</p>
            <p className="text-sm">Trade updates will appear here in real-time</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tradeUpdates.slice(0, isExpanded ? undefined : 3).map((update, index) => (
              <div
                key={`${update.id}-${update.timestamp}`}
                className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex-shrink-0 mt-1">
                  {getActionIcon(update.action)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${getActionColor(update.action)}`}>
                      {getActionText(update.action)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(update.timestamp)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-900 dark:text-white font-medium">
                    {update.trade.ticker} - {update.trade.shares} shares
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Entry: {formatCurrency(update.trade.entryPrice)}
                    {update.trade.exitPrice && (
                      <span> • Exit: {formatCurrency(update.trade.exitPrice)}</span>
                    )}
                  </div>
                  
                  {update.trade.notes && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                      {update.trade.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {!isExpanded && tradeUpdates.length > 3 && (
              <div className="text-center py-2">
                <button
                  onClick={() => setIsExpanded(true)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Show {tradeUpdates.length - 3} more updates
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 