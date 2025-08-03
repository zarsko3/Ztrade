'use client';

import { useState } from 'react';
import { X, Calendar, DollarSign } from 'lucide-react';

interface CloseTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (exitDate: string, exitPrice: number) => Promise<void>;
  trade: {
    id: number;
    ticker: string;
    entryDate: string | Date;
    entryPrice: number;
    quantity: number;
    isShort: boolean;
  };
  loading?: boolean;
}

export function CloseTradeModal({ isOpen, onClose, onConfirm, trade, loading = false }: CloseTradeModalProps) {
  const [exitDate, setExitDate] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate inputs
    if (!exitDate) {
      setError('Exit date is required');
      return;
    }

    if (!exitPrice) {
      setError('Exit price is required');
      return;
    }

    const price = parseFloat(exitPrice);
    if (isNaN(price) || price <= 0) {
      setError('Exit price must be a positive number');
      return;
    }

    // Validate that exit date is after entry date
    const entryDate = typeof trade.entryDate === 'string' ? new Date(trade.entryDate) : trade.entryDate;
    const exitDateObj = new Date(exitDate);
    if (exitDateObj <= entryDate) {
      setError('Exit date must be after entry date');
      return;
    }

    try {
      await onConfirm(exitDate, price);
      // Reset form on success
      setExitDate('');
      setExitPrice('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close trade');
    }
  };

  const handleClose = () => {
    setExitDate('');
    setExitPrice('');
    setError('');
    onClose();
  };

  // Calculate potential P&L
  const calculatePnL = () => {
    if (!exitPrice) return null;
    const price = parseFloat(exitPrice);
    if (isNaN(price)) return null;

    const entryValue = trade.entryPrice * trade.quantity;
    const exitValue = price * trade.quantity;
    
    if (trade.isShort) {
      return entryValue - exitValue;
    } else {
      return exitValue - entryValue;
    }
  };

  const pnl = calculatePnL();
  const pnlPercentage = pnl ? (pnl / (trade.entryPrice * trade.quantity)) * 100 : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Close Trade - {trade.ticker}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <div className="flex justify-between mb-1">
              <span>Entry Date:</span>
              <span>{typeof trade.entryDate === 'string' ? new Date(trade.entryDate).toLocaleDateString() : trade.entryDate.toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Entry Price:</span>
              <span>${trade.entryPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Quantity:</span>
              <span>{trade.quantity} shares</span>
            </div>
            <div className="flex justify-between">
              <span>Position:</span>
              <span className={`font-medium ${trade.isShort ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {trade.isShort ? 'SHORT' : 'LONG'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Exit Date</span>
              </div>
            </label>
            <input
              type="date"
              value={exitDate}
              onChange={(e) => setExitDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4" />
                <span>Exit Price</span>
              </div>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="0.00"
              required
            />
          </div>

          {/* P&L Preview */}
          {pnl !== null && (
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <div className="flex justify-between mb-1">
                  <span>Potential P&L:</span>
                  <span className={`font-medium ${pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    ${pnl.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Return:</span>
                  <span className={`font-medium ${pnlPercentage! >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {pnlPercentage! >= 0 ? '+' : ''}{pnlPercentage!.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !exitDate || !exitPrice}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Closing...' : 'Close Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 