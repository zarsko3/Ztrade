'use client';

import React from 'react';
import { RealTimeDashboard } from '@/components/dashboard/RealTimeDashboard';

export default function TestPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          WebSocket Real-time Testing
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          This page tests the WebSocket integration for real-time market data, trade updates, and performance metrics.
        </p>
        <div className="text-sm text-gray-500 dark:text-gray-500">
          <p>• Market data updates every 30 seconds</p>
          <p>• Trade updates are emitted when trades are created, updated, or closed</p>
          <p>• Performance metrics are updated in real-time</p>
        </div>
      </div>

      <RealTimeDashboard 
        defaultSymbols={['^GSPC', 'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA']}
        showMarketData={true}
        showTradeUpdates={true}
        showPerformanceMetrics={true}
      />
    </div>
  );
} 