'use client';

import { useState, useEffect } from 'react';
import { AddToPositionRequest, AddToPositionFormProps, Position } from '@/types/trade';
import { X, Plus, DollarSign, Calendar, Hash, FileText, Tag } from 'lucide-react';

export function AddToPositionForm({ 
  ticker, 
  existingPosition, 
  onSubmit, 
  onCancel, 
  className = '', 
  isLoading = false 
}: AddToPositionFormProps) {
  const [formData, setFormData] = useState<AddToPositionRequest>({
    ticker: ticker,
    entryDate: new Date().toISOString().split('T')[0],
    entryPrice: 0,
    quantity: 0,
    fees: 0,
    notes: '',
    tags: ''
  });

  const [investmentAmount, setInvestmentAmount] = useState<number>(0);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate investment amount when form data changes
  useEffect(() => {
    if (formData.entryPrice > 0 && formData.quantity > 0) {
      const calculatedAmount = formData.entryPrice * formData.quantity;
      setInvestmentAmount(calculatedAmount);
    }
  }, [formData.entryPrice, formData.quantity]);

  // Fetch current market price
  useEffect(() => {
    fetchCurrentPrice(ticker);
  }, [ticker]);

  const fetchCurrentPrice = async (ticker: string) => {
    try {
      setLoadingPrice(true);
      const response = await fetch(`/api/market-data/quote?symbol=${ticker.toUpperCase()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.data) {
          setCurrentPrice(data.data.price);
          // Auto-fill entry price if it's not set
          if (!formData.entryPrice) {
            setFormData(prev => ({ ...prev, entryPrice: data.data.price }));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching current price:', error);
    } finally {
      setLoadingPrice(false);
    }
  };

  const handleInputChange = (field: keyof AddToPositionRequest, value: any) => {
    const safeValue = value === undefined || value === null ? '' : value;
    setFormData(prev => ({ ...prev, [field]: safeValue }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleInvestmentAmountChange = (amount: number) => {
    if (formData.entryPrice > 0) {
      const newQuantity = amount / formData.entryPrice;
      setFormData(prev => ({ ...prev, quantity: newQuantity }));
    }
  };

  const handleEntryPriceChange = (price: number) => {
    setFormData(prev => ({ ...prev, entryPrice: price }));
    // Recalculate quantity if investment amount is set
    if (investmentAmount > 0) {
      const newQuantity = investmentAmount / price;
      setFormData(prev => ({ ...prev, quantity: newQuantity }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.ticker.trim()) {
      newErrors.ticker = 'Ticker is required';
    }

    if (!formData.entryDate) {
      newErrors.entryDate = 'Entry date is required';
    }

    if (formData.entryPrice <= 0) {
      newErrors.entryPrice = 'Entry price must be greater than 0';
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (formData.fees && formData.fees < 0) {
      newErrors.fees = 'Fees cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(num);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Add to Position: {ticker}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Add additional shares to your existing position
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Current Position Summary */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Current Position Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Shares</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatNumber(existingPosition.totalQuantity)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Avg Entry Price</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatCurrency(existingPosition.averageEntryPrice)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Investment</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatCurrency(existingPosition.totalInvestment)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Current Value</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {existingPosition.currentValue ? formatCurrency(existingPosition.currentValue) : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Entry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Entry Date
            </label>
            <input
              type="date"
              value={formData.entryDate}
              onChange={(e) => handleInputChange('entryDate', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                errors.entryDate 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
            />
            {errors.entryDate && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.entryDate}</p>
            )}
          </div>

          {/* Entry Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Entry Price
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.entryPrice || ''}
                onChange={(e) => handleEntryPriceChange(parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                  errors.entryPrice 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                placeholder="0.00"
              />
              {loadingPrice && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                </div>
              )}
            </div>
            {currentPrice && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Current price: {formatCurrency(currentPrice)}
              </p>
            )}
            {errors.entryPrice && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.entryPrice}</p>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Hash className="w-4 h-4 inline mr-2" />
              Quantity
            </label>
            <input
              type="number"
              step="0.0001"
              min="0"
              value={formData.quantity || ''}
              onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                errors.quantity 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder="0.0000"
            />
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.quantity}</p>
            )}
          </div>

          {/* Investment Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Investment Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={investmentAmount || ''}
              onChange={(e) => handleInvestmentAmountChange(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="0.00"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Auto-calculated from price × quantity
            </p>
          </div>

          {/* Fees */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Fees (Optional)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.fees || ''}
              onChange={(e) => handleInputChange('fees', parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                errors.fees 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder="0.00"
            />
            {errors.fees && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fees}</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <FileText className="w-4 h-4 inline mr-2" />
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Add any notes about this addition to your position..."
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Tag className="w-4 h-4 inline mr-2" />
            Tags (Optional)
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => handleInputChange('tags', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="dca, dip-buying, etc."
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Comma-separated tags for categorization
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>{isLoading ? 'Adding...' : 'Add to Position'}</span>
          </button>
        </div>
      </form>
    </div>
  );
} 