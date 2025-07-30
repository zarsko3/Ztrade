'use client';

import { useState, useEffect } from 'react';
import { CreateTradeRequest, UpdateTradeRequest, TradeFormData, TradeEntryFormProps } from '@/types/trade';
import { X } from 'lucide-react';
import { StockLogoCompact } from '@/components/ui/stock-logo';

export function TradeEntryForm({ 
  mode, 
  onSubmit, 
  onCancel, 
  className = '', 
  initialData,
  isLoading = false,
  title
}: TradeEntryFormProps) {
  const [formData, setFormData] = useState<TradeFormData>({
    ticker: '',
    entryDate: new Date().toISOString().split('T')[0],
    entryPrice: 0,
    quantity: 0,
    isShort: false,
    fees: 0,
    notes: '',
    tags: '',
    exitDate: '',
    exitPrice: 0
  });

  const [investmentAmount, setInvestmentAmount] = useState<number>(0);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [existingPosition, setExistingPosition] = useState<any>(null);
  const [checkingPosition, setCheckingPosition] = useState(false);

  // Calculate initial investment amount when form data changes
  useEffect(() => {
    if (formData.entryPrice > 0 && formData.quantity > 0) {
      const calculatedAmount = formData.entryPrice * formData.quantity;
      setInvestmentAmount(calculatedAmount);
    }
  }, [formData.entryPrice, formData.quantity]);

  // Fetch current market price and check position when ticker changes
  useEffect(() => {
    if (formData.ticker && formData.ticker.length >= 1) {
      fetchCurrentPrice(formData.ticker);
      checkExistingPosition(formData.ticker);
    } else {
      setExistingPosition(null);
    }
  }, [formData.ticker]);

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

  const checkExistingPosition = async (ticker: string) => {
    try {
      setCheckingPosition(true);
      const response = await fetch(`/api/trades/position/${ticker}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.position) {
          setExistingPosition(data.position);
        } else {
          setExistingPosition(null);
        }
      } else {
        setExistingPosition(null);
      }
    } catch (error) {
      console.error('Error checking existing position:', error);
      setExistingPosition(null);
    } finally {
      setCheckingPosition(false);
    }
  };

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with initial data when provided
  useEffect(() => {
    if (initialData) {
      // Ensure all values are properly defined to prevent controlled/uncontrolled input switching
      const safeInitialData = {
        ticker: initialData.ticker || '',
        entryDate: initialData.entryDate || new Date().toISOString().split('T')[0],
        entryPrice: initialData.entryPrice || 0,
        quantity: initialData.quantity || 0,
        isShort: initialData.isShort || false,
        fees: initialData.fees || 0,
        notes: initialData.notes || '',
        tags: initialData.tags || '',
        exitDate: initialData.exitDate || '',
        exitPrice: initialData.exitPrice || 0
      };
      
      setFormData(safeInitialData);
      // Calculate investment amount from quantity and price
      if (safeInitialData.quantity > 0 && safeInitialData.entryPrice > 0) {
        setInvestmentAmount(safeInitialData.quantity * safeInitialData.entryPrice);
      }
    }
  }, [initialData]);

  const handleInputChange = (field: keyof TradeFormData, value: any) => {
    // Ensure value is always defined to prevent controlled/uncontrolled switching
    const safeValue = value === undefined || value === null ? '' : value;
    setFormData(prev => ({ ...prev, [field]: safeValue }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleInvestmentAmountChange = (amount: number) => {
    const safeAmount = isNaN(amount) ? 0 : amount;
    setInvestmentAmount(safeAmount);
    if (formData.entryPrice > 0 && safeAmount > 0) {
      const calculatedQuantity = safeAmount / formData.entryPrice;
      setFormData(prev => ({ ...prev, quantity: calculatedQuantity }));
    }
  };

  const handleEntryPriceChange = (price: number) => {
    const safePrice = isNaN(price) ? 0 : price;
    setFormData(prev => ({ ...prev, entryPrice: safePrice }));
    if (investmentAmount > 0 && safePrice > 0) {
      const calculatedQuantity = investmentAmount / safePrice;
      setFormData(prev => ({ ...prev, quantity: calculatedQuantity }));
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

    if (investmentAmount <= 0) {
      newErrors.investmentAmount = 'Investment amount must be greater than 0';
    }

    // Validate quantity is a positive number (supports fractional shares)
    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (formData.exitDate && !formData.exitPrice) {
      newErrors.exitPrice = 'Exit price is required when exit date is provided';
    }

    if (formData.exitDate && formData.exitPrice <= 0) {
      newErrors.exitPrice = 'Exit price must be greater than 0';
    }

    // Additional validation for edit mode
    if (mode === 'edit') {
      if (formData.exitDate && formData.entryDate) {
        const entryDate = new Date(formData.entryDate);
        const exitDate = new Date(formData.exitDate);
        
        // Check if dates are valid
        if (isNaN(entryDate.getTime())) {
          newErrors.entryDate = 'Invalid entry date format';
        } else if (isNaN(exitDate.getTime())) {
          newErrors.exitDate = 'Invalid exit date format';
        } else if (exitDate <= entryDate) {
          newErrors.exitDate = 'Exit date must be after entry date';
        }
      }
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
      // Ensure quantity is properly calculated from investment amount (supports fractional shares)
      const finalFormData = {
        ...formData,
        quantity: investmentAmount / formData.entryPrice
      };

      console.log('Form data before submission:', formData);
      console.log('Investment amount:', investmentAmount);
      console.log('Calculated quantity:', finalFormData.quantity);

      // Convert form data to appropriate request format
      const requestData = mode === 'create' 
        ? finalFormData as CreateTradeRequest
        : finalFormData as UpdateTradeRequest;
      
      await onSubmit(requestData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const getTitle = () => {
    if (title) return title;
    return mode === 'create' ? 'Add New Trade' : 'Edit Trade';
  };

  const getButtonText = () => {
    if (isLoading) {
      return mode === 'create' ? 'Creating...' : 'Updating...';
    }
    return mode === 'create' ? 'Create Trade' : 'Update Trade';
  };

  return (
    <div className={`card max-w-4xl mx-auto ${className}`}>
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {getTitle()}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card-body space-y-8">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ticker *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.ticker || ''}
                onChange={(e) => handleInputChange('ticker', e.target.value.toUpperCase())}
                className={`input pl-12 ${errors.ticker ? 'border-red-300 dark:border-red-500 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/20' : ''}`}
                placeholder="e.g., AAPL"
                disabled={isLoading}
              />
              {formData.ticker && (
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <StockLogoCompact 
                    ticker={formData.ticker} 
                    size="sm" 
                  />
                </div>
              )}
            </div>
            {errors.ticker && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.ticker}</p>
            )}
            {existingPosition && (
              <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <StockLogoCompact 
                        ticker={formData.ticker} 
                        size="sm" 
                      />
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Existing position found:</strong> You already have an open position for {formData.ticker} with {existingPosition.totalQuantity.toFixed(4)} shares at an average price of ${existingPosition.averageEntryPrice.toFixed(2)}.
                      </p>
                    </div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Consider using "Add to Position" instead of creating a new trade.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Position Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!formData.isShort}
                  onChange={() => handleInputChange('isShort', false)}
                  className="mr-2 w-4 h-4 text-green-600 border-gray-300 dark:border-gray-600 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-800"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Long</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={formData.isShort}
                  onChange={() => handleInputChange('isShort', true)}
                  className="mr-2 w-4 h-4 text-green-600 border-gray-300 dark:border-gray-600 focus:ring-green-500 dark:focus:ring-green-400 bg-white dark:bg-gray-800"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Short</span>
              </label>
            </div>
          </div>
        </div>

        {/* Entry Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Entry Date *
            </label>
            <input
              type="date"
              value={formData.entryDate || ''}
              onChange={(e) => handleInputChange('entryDate', e.target.value)}
              className={`input ${errors.entryDate ? 'border-red-300 dark:border-red-500 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/20' : ''}`}
              disabled={isLoading}
            />
            {errors.entryDate && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.entryDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Entry Price *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={formData.entryPrice || ''}
                onChange={(e) => handleEntryPriceChange(parseFloat(e.target.value) || 0)}
                className={`input pr-20 ${errors.entryPrice ? 'border-red-300 dark:border-red-500 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/20' : ''}`}
                placeholder="0.00"
                disabled={isLoading}
              />
              {currentPrice && (
                <button
                  type="button"
                  onClick={() => handleEntryPriceChange(currentPrice)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                  disabled={isLoading}
                >
                  Use ${currentPrice.toFixed(2)}
                </button>
              )}
              {loadingPrice && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            {currentPrice && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Current price: ${currentPrice.toFixed(2)}
              </p>
            )}
            {errors.entryPrice && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.entryPrice}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Investment Amount *
            </label>
            <input
              type="number"
              step="0.01"
              value={investmentAmount || ''}
              onChange={(e) => handleInvestmentAmountChange(parseFloat(e.target.value) || 0)}
              className={`input ${errors.investmentAmount ? 'border-red-300 dark:border-red-500 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/20' : ''}`}
              placeholder="0.00"
              disabled={isLoading}
            />
            {errors.investmentAmount && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.investmentAmount}</p>
            )}
            {formData.entryPrice > 0 && investmentAmount > 0 && (
              <div className="mt-1 space-y-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Shares: {formData.quantity.toFixed(6)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Exact investment: ${(formData.quantity * formData.entryPrice).toFixed(2)}
                </p>
              </div>
            )}
            {errors.quantity && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.quantity}</p>
            )}
          </div>
        </div>

        {/* Exit Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Exit Date
            </label>
            <input
              type="date"
              value={formData.exitDate || ''}
              onChange={(e) => handleInputChange('exitDate', e.target.value)}
              className={`input ${errors.exitDate ? 'border-red-300 dark:border-red-500 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/20' : ''}`}
              disabled={isLoading}
            />
            {errors.exitDate && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.exitDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Exit Price
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.exitPrice || ''}
              onChange={(e) => handleInputChange('exitPrice', parseFloat(e.target.value) || 0)}
              className={`input ${errors.exitPrice ? 'border-red-300 dark:border-red-500 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/20' : ''}`}
              placeholder="0.00"
              disabled={isLoading}
            />
            {errors.exitPrice && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.exitPrice}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fees
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.fees || ''}
              onChange={(e) => handleInputChange('fees', parseFloat(e.target.value) || 0)}
              className="input"
              placeholder="0.00"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="input resize-none"
              placeholder="Add notes about this trade..."
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <input
              type="text"
              value={formData.tags || ''}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              className="input"
              placeholder="e.g., tech, growth, dividend"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
          >
            {getButtonText()}
          </button>
        </div>
      </form>
    </div>
  );
}

// Default export for backward compatibility
export default TradeEntryForm; 