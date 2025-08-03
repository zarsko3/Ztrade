'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface Trade {
  id: number;
  ticker: string;
  entryDate: string;
  entryPrice: number;
  quantity: number;
  isShort: boolean;
}

export default function CloseTradePage() {
  const router = useRouter();
  const params = useParams();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    exitDate: new Date().toISOString().split('T')[0],
    exitPrice: ''
  });

  const tradeId = params?.id as string;

  useEffect(() => {
    const fetchTrade = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/trades/${tradeId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Trade not found');
          }
          throw new Error(`Failed to fetch trade: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.status === 'success') {
          setTrade(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch trade');
        }
      } catch (err) {
        console.error('Error fetching trade:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while loading the trade');
      } finally {
        setIsLoading(false);
      }
    };

    if (tradeId) {
      fetchTrade();
    }
  }, [tradeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.exitPrice || parseFloat(formData.exitPrice) <= 0) {
      setError('Please enter a valid exit price');
      return;
    }

    try {
      setIsClosing(true);
      setError(null);

      const response = await fetch(`/api/trades/${tradeId}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exitDate: formData.exitDate,
          exitPrice: parseFloat(formData.exitPrice)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to close trade');
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        // Redirect to the trade detail page
        router.push(`/trades/${tradeId}`);
      } else {
        throw new Error(result.message || 'Failed to close trade');
      }
    } catch (err) {
      console.error('Error closing trade:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while closing the trade');
    } finally {
      setIsClosing(false);
    }
  };

  const handleCancel = () => {
    router.push(`/trades/${tradeId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error loading trade
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => router.push('/trades')}
                    className="text-sm font-medium text-red-800 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100"
                  >
                    Back to Trades
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Trade not found
            </h2>
                          <p className="mt-2 text-gray-600 dark:text-gray-400">
                The trade you&apos;re looking for doesn&apos;t exist.
              </p>
            <button
              onClick={() => router.push('/trades')}
              className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              Back to Trades
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleCancel}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Close Trade
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Close your position in {trade.ticker}
              </p>
            </div>
          </div>
        </div>

        {/* Trade Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Trade Summary
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Ticker</span>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {trade.ticker}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Position</span>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {trade.isShort ? 'Short' : 'Long'}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Entry Price</span>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                ${trade.entryPrice.toFixed(2)}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Quantity</span>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {trade.quantity.toLocaleString()} shares
              </div>
            </div>
          </div>
        </div>

        {/* Close Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="exitDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Exit Date *
                </label>
                <input
                  type="date"
                  id="exitDate"
                  value={formData.exitDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, exitDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="exitPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Exit Price *
                </label>
                <input
                  type="number"
                  id="exitPrice"
                  value={formData.exitPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, exitPrice: e.target.value }))}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter exit price"
                  required
                />
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                onClick={handleCancel}
                variant="secondary"
                disabled={isClosing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isClosing}
              >
                {isClosing ? 'Closing...' : 'Close Trade'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 