'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TradeEntryForm } from '@/components/trades/TradeEntryForm';
import { CreateTradeRequest, UpdateTradeRequest } from '@/types/trade';

export default function AddTradePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateTradeRequest | UpdateTradeRequest) => {
    try {
      setError(null);

      // For create mode, we know it's CreateTradeRequest
      const createData = data as CreateTradeRequest;

      console.log('Submitting trade data:', createData);

      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Trade creation failed:', errorData);
        throw new Error(errorData.error || 'Failed to create trade');
      }

      const result = await response.json();
      console.log('Trade created successfully:', result);
      
      // Redirect to the new trade's detail page
      router.push(`/trades/${result.trade.id}`);
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'Failed to create trade');
    }
  };

  const handleCancel = () => {
    router.push('/trades');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add New Trade</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Enter the details for your new trade
            </p>
          </div>
          <Link
            href="/trades"
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Back to Trades
          </Link>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="text-red-600 dark:text-red-400">
            <div className="font-medium">Error creating trade</div>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      )}

      {/* Trade Entry Form */}
      <TradeEntryForm 
        mode="create"
        onSubmit={handleSubmit} 
        onCancel={handleCancel} 
      />
    </div>
  );
} 