'use client';

import { useState } from 'react';
import { Download, Calendar, Filter, FileSpreadsheet } from 'lucide-react';

export interface ExportOptionsProps {
  onExport: (options: ExportConfig) => void;
  loading?: boolean;
  availableTickers?: string[];
}

export interface ExportConfig {
  type: 'trades' | 'performance' | 'analytics';
  dateRange?: {
    start: Date;
    end: Date;
  };
  ticker?: string;
  includeOpenPositions: boolean;
}

export default function ExportOptions({ onExport, loading = false, availableTickers = [] }: ExportOptionsProps) {
  const [exportType, setExportType] = useState<'trades' | 'performance' | 'analytics'>('trades');
  const [useDateRange, setUseDateRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTicker, setSelectedTicker] = useState('all');
  const [includeOpenPositions, setIncludeOpenPositions] = useState(true);

  const handleExport = () => {
    const config: ExportConfig = {
      type: exportType,
      includeOpenPositions
    };

    if (useDateRange && startDate && endDate) {
      config.dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    }

    if (selectedTicker !== 'all') {
      config.ticker = selectedTicker;
    }

    onExport(config);
  };

  const isFormValid = () => {
    if (useDateRange) {
      if (!startDate || !endDate) return false;
      if (new Date(startDate) > new Date(endDate)) return false;
    }
    return true;
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center space-x-2">
          <FileSpreadsheet className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export Options</h3>
        </div>
      </div>
      <div className="card-body space-y-6">
        {/* Export Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Export Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setExportType('trades')}
              className={`p-4 rounded-xl border-2 transition-all ${
                exportType === 'trades'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="font-medium">Trades</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  All trade data
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setExportType('performance')}
              className={`p-4 rounded-xl border-2 transition-all ${
                exportType === 'performance'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="text-center">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Download className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="font-medium">Performance</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Performance metrics
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setExportType('analytics')}
              className={`p-4 rounded-xl border-2 transition-all ${
                exportType === 'analytics'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="text-center">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Filter className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="font-medium">Analytics</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Complete analysis
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Date Range Filter */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Date Range (Optional)
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={useDateRange}
                onChange={(e) => setUseDateRange(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Filter by date range</span>
            </label>
          </div>
          
          {useDateRange && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input"
                  max={endDate || undefined}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input"
                  min={startDate || undefined}
                />
              </div>
            </div>
          )}
        </div>

        {/* Ticker Filter */}
        {availableTickers.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ticker Filter (Optional)
            </label>
            <select
              value={selectedTicker}
              onChange={(e) => setSelectedTicker(e.target.value)}
              className="input"
            >
              <option value="all">All Tickers</option>
              {availableTickers.map(ticker => (
                <option key={ticker} value={ticker}>{ticker}</option>
              ))}
            </select>
          </div>
        )}

        {/* Include Open Positions (for trades export) */}
        {exportType === 'trades' && (
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={includeOpenPositions}
                onChange={(e) => setIncludeOpenPositions(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Include open positions
              </span>
            </label>
          </div>
        )}

        {/* Export Button */}
        <div className="pt-4">
          <button
            onClick={handleExport}
            disabled={loading || !isFormValid()}
            className="w-full btn btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating Export...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export to Excel</span>
              </>
            )}
          </button>
        </div>

        {/* Export Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-start space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">Export Information:</p>
              <ul className="space-y-1 text-xs">
                {exportType === 'trades' && (
                  <>
                    <li>• Complete trade history with P&L calculations</li>
                    <li>• Entry/exit dates, prices, and quantities</li>
                    <li>• Fees, notes, and tags included</li>
                    {includeOpenPositions && <li>• Open positions will be included</li>}
                  </>
                )}
                {exportType === 'performance' && (
                  <>
                    <li>• Performance summary metrics</li>
                    <li>• Monthly performance breakdown</li>
                    <li>• Ticker-specific performance data</li>
                  </>
                )}
                {exportType === 'analytics' && (
                  <>
                    <li>• Complete analytics package</li>
                    <li>• Trades data + performance metrics</li>
                    <li>• Multiple sheets for comprehensive analysis</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 