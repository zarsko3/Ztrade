'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import TickerLogo from '@/components/ui/TickerLogo';

interface Trade {
  id: number;
  ticker: string;
  entryDate: string;
  entryPrice: number;
  exitDate?: string;
  exitPrice?: number;
  quantity: number;
  fees?: number;
  notes?: string;
  tags?: string;
  isShort: boolean;
  createdAt: string;
  updatedAt: string;
  performance?: unknown;
  metrics?: {
    profitLoss: number | null;
    profitLossPercentage: number | null;
    holdingPeriod: number | null;
    isOpen: boolean;
    entryValue?: number;
    exitValue?: number;
    totalReturn?: number;
  };
}

interface TradeDetailViewProps {
  trade: Trade;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export default function TradeDetailView({
  trade,
  onEdit,
  onDelete,
  onClose,
  onBack,
  isLoading = false
}: TradeDetailViewProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = () => {
    const isOpen = !trade.exitDate;
    return (
      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
        isOpen
          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      }`}>
        {isOpen ? 'Open' : 'Closed'}
      </span>
    );
  };

  const getPositionTypeBadge = () => {
    return (
      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
        trade.isShort
          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      }`}>
        {trade.isShort ? 'Short' : 'Long'}
      </span>
    );
  };

  const renderTags = () => {
    if (!trade.tags) return null;
    
    const tagList = trade.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    return (
      <div className="flex flex-wrap gap-2">
        {tagList.map((tag, index) => (
          <span
            key={index}
            className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={onBack}
              variant="secondary"
              size="sm"
            >
              ← Back
            </Button>
            <TickerLogo ticker={trade.ticker} size="lg" showTicker={false} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {trade.ticker}
              </h1>
              <div className="flex items-center space-x-3 mt-2">
                {getStatusBadge()}
                {getPositionTypeBadge()}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={onEdit}
              variant="secondary"
              size="sm"
            >
              Edit
            </Button>
            
            {!trade.exitDate ? (
              <Button
                onClick={onClose}
                variant="secondary"
                size="sm"
              >
                Close Trade
              </Button>
            ) : (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="secondary"
                size="sm"
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Trade Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Entry Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Entry Information
          </h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Entry Price</span>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(trade.entryPrice)}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Quantity</span>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {trade.quantity.toLocaleString()} shares
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Entry Date</span>
              <div className="text-sm text-gray-900 dark:text-white">
                {formatDate(trade.entryDate)}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Entry Value</span>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(trade.entryPrice * trade.quantity)}
              </div>
            </div>
          </div>
        </div>

        {/* Exit Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Exit Information
          </h3>
          {trade.exitDate && trade.exitPrice ? (
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Exit Price</span>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(trade.exitPrice)}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Exit Date</span>
                <div className="text-sm text-gray-900 dark:text-white">
                  {formatDate(trade.exitDate)}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Exit Value</span>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(trade.exitPrice * trade.quantity)}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Holding Period</span>
                <div className="text-sm text-gray-900 dark:text-white">
                  {trade.metrics?.holdingPeriod} days
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 dark:text-gray-500 text-sm">
                Trade is still open
              </div>
            </div>
          )}
        </div>

        {/* Profit & Loss */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Profit & Loss
          </h3>
                     {trade.metrics?.profitLoss !== null ? (
             <div className="space-y-3">
               <div>
                 <span className="text-sm text-gray-500 dark:text-gray-400">Total P&L</span>
                 <div className={`text-2xl font-bold ${
                   (trade.metrics?.profitLoss || 0) >= 0 
                     ? 'text-green-600 dark:text-green-400' 
                     : 'text-red-600 dark:text-red-400'
                 }`}>
                   {formatCurrency(trade.metrics?.profitLoss || 0)}
                 </div>
               </div>
               <div>
                 <span className="text-sm text-gray-500 dark:text-gray-400">Return %</span>
                 <div className={`text-lg font-semibold ${
                   (trade.metrics?.profitLossPercentage || 0) >= 0 
                     ? 'text-green-600 dark:text-green-400' 
                     : 'text-red-600 dark:text-red-400'
                 }`}>
                   {(trade.metrics?.profitLossPercentage || 0).toFixed(2)}%
                 </div>
               </div>
               <div>
                 <span className="text-sm text-gray-500 dark:text-gray-400">Fees</span>
                 <div className="text-sm text-gray-900 dark:text-white">
                   {formatCurrency(trade.fees || 0)}
                 </div>
               </div>
             </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 dark:text-gray-500 text-sm">
                P&L will be calculated when trade is closed
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Notes
          </h3>
          {trade.notes ? (
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {trade.notes}
            </p>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 italic">
              No notes added
            </p>
          )}
        </div>

        {/* Tags */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Tags
          </h3>
          {trade.tags ? (
            renderTags()
          ) : (
            <p className="text-gray-400 dark:text-gray-500 italic">
              No tags added
            </p>
          )}
        </div>
      </div>

      {/* Trade Metadata */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Trade Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Trade ID</span>
            <div className="text-sm text-gray-900 dark:text-white">
              #{trade.id}
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Created</span>
            <div className="text-sm text-gray-900 dark:text-white">
              {formatDateTime(trade.createdAt)}
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Last Updated</span>
            <div className="text-sm text-gray-900 dark:text-white">
              {formatDateTime(trade.updatedAt)}
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Position Type</span>
            <div className="text-sm text-gray-900 dark:text-white">
              {trade.isShort ? 'Short' : 'Long'}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Delete Trade
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this trade? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete();
                }}
                variant="primary"
                size="sm"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 