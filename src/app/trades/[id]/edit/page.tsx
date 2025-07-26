'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { TradeEntryForm } from '@/components/trades/TradeEntryForm';
import { UpdateTradeRequest, TradeFormData, CreateTradeRequest } from '@/types/trade';

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
}

export default function EditTradePage() {
  const router = useRouter();
  const params = useParams();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setTrade(data);
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

  const handleSubmit = async (data: CreateTradeRequest | UpdateTradeRequest) => {
    try {
      setIsSaving(true);
      setError(null);

      // For edit mode, we know it's UpdateTradeRequest
      const updateData = data as UpdateTradeRequest;

      const response = await fetch(`/api/trades/${tradeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update trade');
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        // Redirect to the trade detail page
        router.push(`/trades/${tradeId}`);
      } else {
        throw new Error(result.message || 'Failed to update trade');
      }
    } catch (err) {
      console.error('Error updating trade:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while updating the trade');
    } finally {
      setIsSaving(false);
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

  // Helper function to safely convert date to YYYY-MM-DD format
  const formatDateForInput = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  // Convert trade data to form data format
  const initialFormData: TradeFormData = {
    ticker: trade.ticker,
    entryDate: formatDateForInput(trade.entryDate),
    entryPrice: trade.entryPrice,
    quantity: trade.quantity,
    exitDate: formatDateForInput(trade.exitDate),
    exitPrice: trade.exitPrice || 0,
    fees: trade.fees || 0,
    notes: trade.notes || '',
    tags: trade.tags || '',
    isShort: trade.isShort,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                Edit Trade
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Update the details for {trade.ticker}
              </p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error updating trade
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trade Entry Form */}
        <TradeEntryForm
          mode="edit"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isSaving}
          initialData={initialFormData}
        />
      </div>
    </div>
  );
} 