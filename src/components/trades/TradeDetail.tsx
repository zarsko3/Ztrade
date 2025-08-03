'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Define interface that matches the actual API response
interface TradeData {
  id: string;
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
  totalCost?: number;
  totalValue?: number;
  profitLoss?: number;
  profitLossPercent?: number;
  isOpen?: boolean;
  duration?: number;
}
import TickerLogo from '@/components/ui/TickerLogo';
import { Trash2, Edit, X } from 'lucide-react';

interface TradeDetailProps {
  tradeId: string;
  className?: string;
}

export function TradeDetail({ tradeId, className = '' }: TradeDetailProps) {
  const router = useRouter();
  const [trade, setTrade] = useState<TradeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTrade();
  }, [tradeId]);

  const fetchTrade = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/trades/${tradeId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Trade not found');
        }
        throw new Error(`Failed to fetch trade: ${response.statusText}`);
      }

      const responseData = await response.json();
      
      if (responseData.status === 'success') {
        setTrade(responseData.data);
      } else {
        throw new Error(responseData.message || 'Failed to fetch trade');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trade');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPercentage = (percentage: number | null | undefined) => {
    if (percentage === null || percentage === undefined) {
      return 'N/A';
    }
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/trades/${tradeId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete trade');
      }

      // Redirect to trades list
      router.push('/trades');
    } catch (err) {
      console.error('Error deleting trade:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete trade');
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const handleEdit = () => {
    router.push(`/trades/${tradeId}/edit`);
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`}>
        <div className="text-red-600 dark:text-red-400">
          <div className="font-medium">Error loading trade</div>
          <div className="text-sm">{error}</div>
          <button 
            onClick={fetchTrade}
            className="mt-2 px-3 py-1 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 rounded text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className={`bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 ${className}`}>
        <div className="text-yellow-800 dark:text-yellow-200">
          <div className="font-medium">Trade not found</div>
          <div className="text-sm">The requested trade could not be found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <TickerLogo ticker={trade.ticker} size="lg" showTicker={false} />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {trade.ticker}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Trade #{trade.id}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              trade.isOpen 
                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' 
                : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
            }`}>
              {trade.isOpen ? 'Open' : 'Closed'}
            </span>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleEdit}
                className="p-2 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors text-blue-600 dark:text-blue-400"
                title="Edit trade"
              >
                <Edit className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setDeleteConfirm(true)}
                disabled={deleting}
                className="p-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                title="Delete trade"
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trade Details */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Entry Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Entry Information</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Entry Date</dt>
                <dd className="text-sm text-gray-900 dark:text-white">{formatDate(trade.entryDate)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Entry Price</dt>
                <dd className="text-sm text-gray-900 dark:text-white">{formatCurrency(trade.entryPrice)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Quantity</dt>
                <dd className="text-sm text-gray-900 dark:text-white">{trade.quantity.toFixed(4)} shares</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Position Type</dt>
                <dd className="text-sm text-gray-900 dark:text-white">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                    trade.isShort 
                      ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' 
                      : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                  }`}>
                    {trade.isShort ? 'Short' : 'Long'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Fees</dt>
                <dd className="text-sm text-gray-900 dark:text-white">
                  {trade.fees ? formatCurrency(trade.fees) : 'None'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Exit Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Exit Information</h3>
            <dl className="space-y-3">
              {trade.exitDate ? (
                <>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Exit Date</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">{formatDate(trade.exitDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Exit Price</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">{formatCurrency(trade.exitPrice!)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Holding Period</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {trade.duration} days
                    </dd>
                  </div>
                </>
              ) : (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">Position is still open</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Profit/Loss Information */}
        {trade.profitLoss !== undefined && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Profit/Loss Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total P&L</dt>
                <dd className={`text-lg font-semibold ${
                  trade.profitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatCurrency(trade.profitLoss)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">P&L Percentage</dt>
                <dd className={`text-lg font-semibold ${
                  (trade.profitLossPercent ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatPercentage(trade.profitLossPercent)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Return on Investment</dt>
                <dd className={`text-lg font-semibold ${
                  trade.profitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatPercentage(trade.profitLossPercent)}
                </dd>
              </div>
            </div>
          </div>
        )}



        {/* Additional Information */}
        {(trade.notes || trade.tags) && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Information</h3>
            <div className="space-y-4">
              {trade.notes && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Notes</dt>
                  <dd className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    {trade.notes}
                  </dd>
                </div>
              )}
              {trade.tags && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Tags</dt>
                  <dd className="flex flex-wrap gap-2">
                    {trade.tags.split(',').map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div>
              <span className="font-medium">Created:</span> {formatDate(trade.createdAt)}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span> {formatDate(trade.updatedAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Trade</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              {trade?.isOpen 
                ? "Are you sure you want to delete this open trade? This will permanently remove it from your trading history."
                : "Are you sure you want to delete this trade? This will permanently remove it from your trading history."
              }
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 