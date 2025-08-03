'use client';

import { useState, useEffect } from 'react';
import { SP500Data } from '@/types/market';

interface SP500WidgetProps {
  className?: string;
}

export function SP500Widget({ className = '' }: SP500WidgetProps) {
  const [data, setData] = useState<SP500Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSP500Data();
  }, []);

  const fetchSP500Data = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use test endpoint for now (replace with actual endpoint when API key is available)
      const response = await fetch('/api/market/test');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch S&P 500 data: ${response.statusText}`);
      }

      const sp500Data = await response.json();
      setData(sp500Data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch S&P 500 data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="text-red-600">
          <div className="font-medium">Error loading S&P 500 data</div>
          <div className="text-sm">{error}</div>
          <button 
            onClick={fetchSP500Data}
            className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="text-gray-500">No S&P 500 data available</div>
      </div>
    );
  }

  const isPositive = data.change >= 0;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{data.symbol}</h3>
        <span className="text-sm text-gray-500">
          Updated: {new Date(data.lastUpdated).toLocaleDateString()}
        </span>
      </div>
      
      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-bold text-gray-900">
          ${data.currentPrice.toFixed(2)}
        </span>
        <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{data.change.toFixed(2)} ({isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%)
        </span>
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}
      </div>
    </div>
  );
} 