'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TradeWithCalculations } from '@/types/trade';
import { TradeReturnData, MarketDataService } from '@/services/market-data-service';
import { useRouter } from 'next/navigation';
import { CloseTradeModal } from './CloseTradeModal';

const marketDataService = MarketDataService.getInstance();

interface TradeListResponse {
  trades: TradeWithCalculations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface TradeListProps {
  className?: string;
}

interface TradeWithReturns extends TradeWithCalculations {
  returnData?: TradeReturnData;
  isLoadingReturns?: boolean;
}

export function TradeList({ className = '' }: TradeListProps) {
  const router = useRouter();
  const [trades, setTrades] = useState<TradeWithCalculations[]>([]);
  const [tradesWithReturns, setTradesWithReturns] = useState<TradeWithReturns[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    ticker: '',
    status: 'all' as 'all' | 'open' | 'closed',
    search: ''
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; isOpen: boolean } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [closeTradeModal, setCloseTradeModal] = useState<{ isOpen: boolean; trade: TradeWithCalculations | null }>({
    isOpen: false,
    trade: null
  });
  const [closingTrade, setClosingTrade] = useState<number | null>(null);

  // Memoize the fetchTrades function to prevent unnecessary re-renders
  const fetchTrades = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: 'entryDate',
        sortOrder: 'desc',
        ...(filters.ticker && { ticker: filters.ticker }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`/api/trades?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch trades: ${response.statusText}`);
      }

      const data: TradeListResponse = await response.json();
      setTrades(data.trades);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trades');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters.ticker, filters.status, filters.search]);

  // Memoize the loadReturnData function
  const loadReturnData = useCallback(async (tradesToProcess: TradeWithCalculations[]) => {
    if (tradesToProcess.length === 0) {
      setTradesWithReturns([]);
      return;
    }

    // Set initial loading state
    setTradesWithReturns(tradesToProcess.map(trade => ({
      ...trade,
      returnData: undefined,
      isLoadingReturns: true
    })));

    // Process trades in batches to avoid overwhelming the API
    const batchSize = 3;
    const processedTrades: TradeWithReturns[] = [];

    for (let i = 0; i < tradesToProcess.length; i += batchSize) {
      const batch = tradesToProcess.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (trade) => {
          try {
            const returnData = await marketDataService.getTradeReturnData({
              entryPrice: trade.entryPrice,
              exitPrice: trade.exitPrice,
              isShort: trade.isShort,
              entryDate: typeof trade.entryDate === 'string' ? trade.entryDate : trade.entryDate.toISOString(),
              exitDate: trade.exitDate ? (typeof trade.exitDate === 'string' ? trade.exitDate : trade.exitDate.toISOString()) : undefined,
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
      
      processedTrades.push(...batchResults);
      
      // Update state incrementally to show progress
      setTradesWithReturns(prev => {
        const newTrades = [...prev];
        batchResults.forEach((result, index) => {
          const globalIndex = i + index;
          if (globalIndex < newTrades.length) {
            newTrades[globalIndex] = result;
          }
        });
        return newTrades;
      });

      // Small delay between batches to avoid API rate limiting
      if (i + batchSize < tradesToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }, []);

  // Fetch trades when pagination or filters change
  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  // Load return data when trades change, but only if trades actually changed
  useEffect(() => {
    const tradeIds = trades.map(t => t.id).join(',');
    const memoKey = `${tradeIds}-${trades.length}`;
    
    // Use a ref to track the last processed trades to avoid unnecessary processing
    const lastProcessedKey = sessionStorage.getItem('lastProcessedTrades');
    
    if (lastProcessedKey !== memoKey) {
      sessionStorage.setItem('lastProcessedTrades', memoKey);
      loadReturnData(trades);
    }
  }, [trades, loadReturnData]);

  // Refresh trades when the component mounts or when returning from other pages
  useEffect(() => {
    const handleFocus = () => {
      // Only refresh if the component is still mounted and not already loading
      if (!loading) {
        fetchTrades();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchTrades, loading]);

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleTradeClick = (tradeId: number) => {
    router.push(`/trades/${tradeId}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, tradeId: number, isOpen: boolean) => {
    e.stopPropagation();
    setDeleteConfirm({ id: tradeId, isOpen });
  };

  const handleDeleteConfirm = async (tradeId: number) => {
    try {
      setDeleting(tradeId);
      
      const response = await fetch(`/api/trades/${tradeId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete trade');
      }

      // Remove the trade from the list
      setTrades(prev => prev.filter(trade => trade.id !== tradeId));
      setTradesWithReturns(prev => prev.filter(trade => trade.id !== tradeId));
      
      // Show success message (you can implement a toast notification here)
      console.log('Trade deleted successfully');
    } catch (error) {
      console.error('Error deleting trade:', error);
      setError('Failed to delete trade');
    } finally {
      setDeleting(null);
      setDeleteConfirm(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  const handleCloseTradeClick = (e: React.MouseEvent, trade: TradeWithCalculations) => {
    e.stopPropagation();
    setCloseTradeModal({ isOpen: true, trade });
  };

  const handleCloseTradeConfirm = async (exitDate: string, exitPrice: number) => {
    if (!closeTradeModal.trade) return;

    try {
      setClosingTrade(closeTradeModal.trade.id);
      
      const response = await fetch(`/api/trades/${closeTradeModal.trade.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exitDate,
          exitPrice
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to close trade');
      }

      // Refresh the trades list to show updated data
      await fetchTrades();
      
      // Close the modal
      setCloseTradeModal({ isOpen: false, trade: null });
      setClosingTrade(null);
      
      // Show success message (you can implement a toast notification here)
      console.log('Trade closed successfully');
    } catch (error) {
      console.error('Error closing trade:', error);
      throw error; // Re-throw to let the modal handle the error
    } finally {
      setClosingTrade(null);
    }
  };

  const handleCloseTradeCancel = () => {
    setCloseTradeModal({ isOpen: false, trade: null });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const getReturnColor = (percentage: number) => {
    if (percentage > 0) return 'text-green-600';
    if (percentage < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // Memoize the filtered and sorted trades to prevent unnecessary re-renders
  const displayTrades = useMemo(() => {
    return tradesWithReturns;
  }, [tradesWithReturns]);

  if (loading && trades.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="text-red-600">
          <div className="font-medium">Error loading trades</div>
          <div className="text-sm">{error}</div>
          <button 
            onClick={fetchTrades}
            className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Trades</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchTrades}
              disabled={loading}
              className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Trades List */}
      <div className="divide-y divide-gray-200">
        {displayTrades.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No trades found
          </div>
        ) : (
          displayTrades.map((trade) => (
            <div
              key={trade.id}
              onClick={() => handleTradeClick(trade.id)}
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="font-medium text-gray-900">{trade.ticker}</div>
                    <div className="text-sm text-gray-500">
                      {trade.isShort ? 'SHORT' : 'LONG'}
                    </div>
                    {trade.isOpen ? (
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                        Open
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        Closed
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-1 text-sm text-gray-600">
                    {formatDate(trade.entryDate)} - {trade.exitDate ? formatDate(trade.exitDate) : 'Open'}
                  </div>
                  
                  <div className="mt-1 text-sm">
                    <span className="text-gray-600">
                      {trade.quantity.toFixed(4)} shares @ {formatCurrency(trade.entryPrice)}
                    </span>
                    {trade.exitPrice && (
                      <span className="ml-2 text-gray-600">
                        → {formatCurrency(trade.exitPrice)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  {trade.isLoadingReturns ? (
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                  ) : trade.returnData ? (
                    <div>
                      <div className={`font-medium ${getReturnColor(trade.returnData.tradeReturnPercentage)}`}>
                        {formatCurrency(trade.returnData.tradeReturn)}
                      </div>
                      <div className={`text-sm ${getReturnColor(trade.returnData.tradeReturnPercentage)}`}>
                        {formatPercentage(trade.returnData.tradeReturnPercentage)}
                      </div>
                      {trade.returnData.outperformance !== 0 && (
                        <div className={`text-xs ${getReturnColor(trade.returnData.outperformance)}`}>
                          {formatPercentage(trade.returnData.outperformance)} vs S&P 500
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm">No data</div>
                  )}
                </div>

                <div className="ml-4 flex items-center space-x-2">
                  {trade.isOpen && (
                    <button
                      onClick={(e) => handleCloseTradeClick(e, trade)}
                      className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                      disabled={closingTrade === trade.id}
                    >
                      {closingTrade === trade.id ? 'Closing...' : 'Close Trade'}
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDeleteClick(e, trade.id, trade.isOpen)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    disabled={deleting === trade.id}
                  >
                    {deleting === trade.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} trades
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete Trade
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this trade? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConfirm(deleteConfirm.id)}
                disabled={deleting === deleteConfirm.id}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50"
              >
                {deleting === deleteConfirm.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Trade Modal */}
      {closeTradeModal.trade && (
        <CloseTradeModal
          isOpen={closeTradeModal.isOpen}
          onClose={handleCloseTradeCancel}
          onConfirm={handleCloseTradeConfirm}
          trade={closeTradeModal.trade}
          loading={closingTrade === closeTradeModal.trade.id}
        />
      )}
    </div>
  );
} 