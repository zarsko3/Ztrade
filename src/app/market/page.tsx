'use client';

import { useState } from 'react';
import { SP500Widget } from '@/components/market/SP500Widget';

export default function MarketPage() {
  const [key, setKey] = useState(0); // For forcing refresh

  const handleRefresh = () => {
    setKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Market Data</h1>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Refresh Data
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SP500Widget key={key} />
        
        {/* Placeholder for additional market widgets */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">NASDAQ</h3>
          <div className="text-gray-500">Coming soon...</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">DOW Jones</h3>
          <div className="text-gray-500">Coming soon...</div>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">Market Data Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-blue-700 mb-2">Real-time Data</h4>
            <ul className="text-blue-600 space-y-1">
              <li>• Current S&P 500 price and change</li>
              <li>• Real-time market updates</li>
              <li>• Historical price data</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-700 mb-2">Performance Analysis</h4>
            <ul className="text-blue-600 space-y-1">
              <li>• S&P 500 return calculations</li>
              <li>• Trade performance comparison</li>
              <li>• Benchmark analysis</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-100 rounded">
          <p className="text-blue-700 text-sm">
            <strong>Note:</strong> This demo uses mock data. For live market data, you'll need to sign up for an Alpha Vantage API key at{' '}
            <a href="https://www.alphavantage.co" target="_blank" rel="noopener noreferrer" className="underline">
              alphavantage.co
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 