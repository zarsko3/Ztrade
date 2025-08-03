import { TradeList } from '@/components/trades/TradeList';
import MarketDataStatus from '@/components/ui/MarketDataStatus';
import Link from 'next/link';
import { Plus, Download } from 'lucide-react';

export default function TradesPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Trades</h1>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
            View and manage your stock trades
          </p>
          <MarketDataStatus className="mt-4" />
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/export"
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-2xl flex items-center space-x-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Download className="w-4 h-4" />
            <span className="font-medium">Export</span>
          </Link>
          <Link
            href="/trades/add"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-2xl flex items-center space-x-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add Trade</span>
          </Link>
        </div>
      </div>
      
      <TradeList />
    </div>
  );
} 