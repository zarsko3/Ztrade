'use client';

import { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import ExportOptions, { ExportConfig } from '@/components/export/ExportOptions';

export default function ExportPage() {
  const [loading, setLoading] = useState(false);
  const [availableTickers, setAvailableTickers] = useState<string[]>([]);
  const [exportHistory, setExportHistory] = useState<Array<{
    id: string;
    type: string;
    timestamp: string;
    status: 'success' | 'error';
    filename?: string;
  }>>([]);

  useEffect(() => {
    fetchAvailableTickers();
    loadExportHistory();
  }, []);

  const fetchAvailableTickers = async () => {
    try {
      const response = await fetch('/api/trades');
      if (response.ok) {
        const data = await response.json();
        const tickers = [...new Set(data.trades.map((trade: any) => trade.ticker))] as string[];
        setAvailableTickers(tickers.sort());
      }
    } catch (error) {
      console.error('Error fetching tickers:', error);
    }
  };

  const loadExportHistory = () => {
    const history = localStorage.getItem('exportHistory');
    if (history) {
      setExportHistory(JSON.parse(history));
    }
  };

  const saveExportHistory = (history: typeof exportHistory) => {
    localStorage.setItem('exportHistory', JSON.stringify(history));
    setExportHistory(history);
  };

  const handleExport = async (config: ExportConfig) => {
    setLoading(true);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('type', config.type);
      
      if (config.dateRange) {
        params.append('startDate', config.dateRange.start.toISOString());
        params.append('endDate', config.dateRange.end.toISOString());
      }
      
      if (config.ticker) {
        params.append('ticker', config.ticker);
      }
      
      if (config.type === 'trades') {
        params.append('includeOpenPositions', config.includeOpenPositions.toString());
      }

      // Make export request
      const response = await fetch(`/api/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
        : `${config.type}_export_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Add to export history
      const newExport = {
        id: Date.now().toString(),
        type: config.type,
        timestamp: new Date().toISOString(),
        status: 'success' as const,
        filename
      };
      
      const updatedHistory = [newExport, ...exportHistory.slice(0, 9)]; // Keep last 10 exports
      saveExportHistory(updatedHistory);

    } catch (error) {
      console.error('Export error:', error);
      
      // Add error to export history
      const newExport = {
        id: Date.now().toString(),
        type: config.type,
        timestamp: new Date().toISOString(),
        status: 'error' as const
      };
      
      const updatedHistory = [newExport, ...exportHistory.slice(0, 9)];
      saveExportHistory(updatedHistory);
    } finally {
      setLoading(false);
    }
  };

  const clearExportHistory = () => {
    localStorage.removeItem('exportHistory');
    setExportHistory([]);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Export Data</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Export your trade data and analytics to Excel for further analysis
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Export Options */}
        <div className="lg:col-span-2">
          <ExportOptions
            onExport={handleExport}
            loading={loading}
            availableTickers={availableTickers}
          />
        </div>

        {/* Export History */}
        <div className="space-y-6">
          {/* Quick Export Buttons */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Export</h3>
            </div>
            <div className="card-body space-y-3">
              <button
                onClick={() => handleExport({ type: 'trades', includeOpenPositions: true })}
                disabled={loading}
                className="w-full btn btn-outline flex items-center justify-center space-x-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>All Trades</span>
              </button>
              
              <button
                onClick={() => handleExport({ type: 'performance', includeOpenPositions: false })}
                disabled={loading}
                className="w-full btn btn-outline flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Performance Report</span>
              </button>
              
              <button
                onClick={() => handleExport({ type: 'analytics', includeOpenPositions: true })}
                disabled={loading}
                className="w-full btn btn-outline flex items-center justify-center space-x-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Complete Analytics</span>
              </button>
            </div>
          </div>

          {/* Export History */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Exports</h3>
                {exportHistory.length > 0 && (
                  <button
                    onClick={clearExportHistory}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div className="card-body">
              {exportHistory.length === 0 ? (
                <div className="text-center py-8">
                  <FileSpreadsheet className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No recent exports</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {exportHistory.map((exportItem) => (
                    <div
                      key={exportItem.id}
                      className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800"
                    >
                      {exportItem.status === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {exportItem.type} Export
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(exportItem.timestamp).toLocaleString()}
                        </p>
                        {exportItem.filename && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                            {exportItem.filename}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Export Tips */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export Tips</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Use date filters to export specific time periods</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Performance exports include detailed metrics and breakdowns</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Analytics exports combine trades and performance data</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Files are automatically downloaded to your default folder</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 