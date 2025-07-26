'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { TradeDetail } from '@/components/trades/TradeDetail';
import Link from 'next/link';

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

interface TradeDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function TradeDetailPage({ params }: TradeDetailPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const tradeId = parseInt(id);
  const [trade, setTrade] = useState<Trade | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleEdit = () => {
    router.push(`/trades/${tradeId}/edit`);
  };

  const handleDelete = async () => {
    try {
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
      setError(err instanceof Error ? err.message : 'Failed to delete trade');
    }
  };

  const handleClose = () => {
    router.push(`/trades/${tradeId}/close`);
  };

  const handleBack = () => {
    router.push('/trades');
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trade Details</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              View detailed information about trade #{tradeId}
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/trades"
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Back to Trades
            </Link>
            {trade && !trade.exitDate && (
              <Link
                href={`/trades/${tradeId}/close`}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
              >
                Close Trade
              </Link>
            )}
            <Link
              href={`/trades/${tradeId}/edit`}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              Edit Trade
            </Link>
          </div>
        </div>
      </div>
      
      {/* Trade Detail Component */}
      <TradeDetail tradeId={tradeId} />
    </div>
  );
} 