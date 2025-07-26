import { TradeList } from '@/components/trades/TradeList';
import MarketDataStatus from '@/components/ui/MarketDataStatus';
import Link from 'next/link';
import { Plus, Download } from 'lucide-react';

export default function TradesPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trades</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View and manage your stock trades
          </p>
          <MarketDataStatus className="mt-2" />
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/export"
            className="btn btn-outline flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Link>
          <Link
            href="/trades/add"
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Trade</span>
          </Link>
        </div>
      </div>
      
      <TradeList />
    </div>
  );
} 