'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TradeWithCalculations, Position, AddToPositionRequest } from '@/types/trade';
import { TradeReturnData, MarketDataService } from '@/services/market-data-service';
import { useRouter } from 'next/navigation';
import { CloseTradeModal } from './CloseTradeModal';
import { AddToPositionForm } from './AddToPositionForm';
import { PositionDetails } from './PositionDetails';

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

  // Add to Position state
  const [addToPositionModal, setAddToPositionModal] = useState<{
    isOpen: boolean;
    ticker: string;
    position: Position | null;
  }>({
    isOpen: false,
    ticker: '',
    position: null
  });
  const [addingToPosition, setAddingToPosition] = useState(false);
  const [positionCache, setPositionCache] = useState<Record<string, Position>>({});

  // Position Details state
  const [positionDetailsModal, setPositionDetailsModal] = useState<{
    isOpen: boolean;
    position: Position | null;
  }>({
    isOpen: false,
    position: null
  });

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

  // Check if a ticker has an open position
  const checkPosition = useCallback(async (ticker: string): Promise<Position | null> => {
    // Check cache first
    if (positionCache[ticker]) {
      return positionCache[ticker];
    }

    try {
      const response = await fetch(`/api/trades/position/${ticker}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.position) {
          setPositionCache(prev => ({ ...prev, [ticker]: data.position }));
          return data.position;
        }
      }
    } catch (error) {
      console.error('Error checking position:', error);
    }
    return null;
  }, [positionCache]);

  // Handle Add to Position button click
  const handleAddToPositionClick = async (e: React.MouseEvent, ticker: string) => {
    e.stopPropagation();
    
    try {
      const position = await checkPosition(ticker);
      if (position) {
        setAddToPositionModal({
          isOpen: true,
          ticker,
          position
        });
      }
    } catch (error) {
      console.error('Error opening add to position modal:', error);
    }
  };

  // Handle Add to Position form submission
  const handleAddToPositionSubmit = async (data: AddToPositionRequest) => {
    try {
      setAddingToPosition(true);
      
      const response = await fetch('/api/trades/add-to-position', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add to position');
      }

      const result = await response.json();
      
      // Clear position cache for this ticker
      setPositionCache(prev => {
        const newCache = { ...prev };
        delete newCache[data.ticker];
        return newCache;
      });

      // Close modal and refresh trades
      setAddToPositionModal({ isOpen: false, ticker: '', position: null });
      await fetchTrades();
      
    } catch (error) {
      console.error('Error adding to position:', error);
      alert(error instanceof Error ? error.message : 'Failed to add to position');
    } finally {
      setAddingToPosition(false);
    }
  };

  // Handle Add to Position modal close
  const handleAddToPositionCancel = () => {
    setAddToPositionModal({ isOpen: false, ticker: '', position: null });
  };

  // Handle View Position button click
  const handleViewPositionClick = async (e: React.MouseEvent, ticker: string) => {
    e.stopPropagation();
    
    try {
      const position = await checkPosition(ticker);
      if (position) {
        setPositionDetailsModal({
          isOpen: true,
          position
        });
      }
    } catch (error) {
      console.error('Error opening position details modal:', error);
    }
  };

  // Handle Position Details modal close
  const handlePositionDetailsClose = () => {
    setPositionDetailsModal({ isOpen: false, position: null });
  };

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

    // Load return data for each trade
    const tradesWithData = await Promise.all(
      tradesToProcess.map(async (trade) => {
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
          console.error(`Error loading return data for trade ${trade.id}:`, error);
          return {
            ...trade,
            returnData: undefined,
            isLoadingReturns: false
          };
        }
      })
    );

    setTradesWithReturns(tradesWithData);
  }, []);

  // Load return data when trades change
  useEffect(() => {
    if (trades.length > 0) {
      loadReturnData(trades);
    }
  }, [trades, loadReturnData]);

  // Load trades on mount and when filters change
  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const handleFocus = () => {
    // This function is called when the component gains focus
    // You can add any focus-related logic here
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleTradeClick = (tradeId: number) => {
    router.push(`/trades/${tradeId}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, tradeId: number, isOpen: boolean) => {
    e.stopPropagation();
    if (isOpen) {
      alert('Cannot delete an open trade. Please close it first.');
      return;
    }
    setDeleteConfirm({ id: tradeId, isOpen: true });
  };

  const handleDeleteConfirm = async (tradeId: number) => {
    try {
      setDeleting(tradeId);
      
      const response = await fetch(`/api/trades/${tradeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete trade');
      }

      // Refresh the trades list
      await fetchTrades();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting trade:', error);
      alert('Failed to delete trade');
    } finally {
      setDeleting(null);
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
      
      const response = await fetch(`/api/trades/${closeTradeModal.trade.id}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exitDate,
          exitPrice,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to close trade');
      }

      // Refresh the trades list
      await fetchTrades();
      setCloseTradeModal({ isOpen: false, trade: null });
    } catch (error) {
      console.error('Error closing trade:', error);
      alert('Failed to close trade');
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
    return percentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
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
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-black dark:bg-black">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Trades</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchTrades}
              disabled={loading}
              className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-300 rounded transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Trades List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {displayTrades.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No trades found
          </div>
        ) : (
          displayTrades.map((trade) => (
            <div
              key={trade.id}
              onClick={() => handleTradeClick(trade.id)}
              className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="font-semibold text-lg text-gray-900 dark:text-white">{trade.ticker}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {trade.isShort ? 'SHORT' : 'LONG'}
                    </div>
                    {trade.isOpen ? (
                      <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 rounded-full">
                        Open
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded-full">
                        Closed
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(trade.entryDate)} - {trade.exitDate ? formatDate(trade.exitDate) : 'Open'}
                  </div>
                  
                  <div className="mt-1 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {trade.quantity.toFixed(4)} shares @ {formatCurrency(trade.entryPrice)}
                    </span>
                    {trade.exitPrice && (
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
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

                <div className="ml-6 flex items-center space-x-3">
                  {trade.isOpen && (
                    <>
                      <button
                        onClick={(e) => handleViewPositionClick(e, trade.ticker)}
                        className="px-4 py-2 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:text-purple-400 rounded-lg transition-all duration-200 font-medium"
                      >
                        View Position
                      </button>
                      <button
                        onClick={(e) => handleAddToPositionClick(e, trade.ticker)}
                        className="px-4 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 rounded-lg transition-all duration-200 font-medium"
                      >
                        Add to Position
                      </button>
                      <button
                        onClick={(e) => handleCloseTradeClick(e, trade)}
                        className="px-4 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 rounded-lg transition-all duration-200 font-medium"
                        disabled={closingTrade === trade.id}
                      >
                        {closingTrade === trade.id ? 'Closing...' : 'Close Trade'}
                      </button>
                    </>
                  )}
                  <button
                    onClick={(e) => handleDeleteClick(e, trade.id, trade.isOpen)}
                    className="px-4 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 rounded-lg transition-all duration-200 font-medium"
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

      {/* Add to Position Modal */}
      {addToPositionModal.isOpen && addToPositionModal.position && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full max-h-full overflow-y-auto">
            <AddToPositionForm
              ticker={addToPositionModal.ticker}
              existingPosition={addToPositionModal.position}
              onSubmit={handleAddToPositionSubmit}
              onCancel={handleAddToPositionCancel}
              isLoading={addingToPosition}
            />
          </div>
        </div>
      )}

      {/* Position Details Modal */}
      {positionDetailsModal.isOpen && positionDetailsModal.position && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-full overflow-y-auto">
            <PositionDetails
              position={positionDetailsModal.position}
              onClose={handlePositionDetailsClose}
            />
          </div>
        </div>
      )}
    </div>
  );
} 