# Blueprint: Task 2.3.3 - Enhance TradeEntryForm for Create and Edit Modes

## Overview
This blueprint outlines the enhancement of the TradeEntryForm component to support both creating new trades and editing existing trades. This will complete Task 2.3.3 (Edit Trade page) and improve Task 2.2.4 (form validation).

## Current State Analysis

### Existing Implementation
- TradeEntryForm component exists but only supports create mode
- Edit Trade page exists but can't work properly due to missing props
- Basic form validation is implemented
- API endpoints for CRUD operations are complete

### Issues to Address
1. TradeEntryForm doesn't support `initialData` prop for editing
2. TradeEntryForm doesn't support `isLoading` prop for edit mode
3. Form title and button text are hardcoded for create mode
4. Missing proper TypeScript interfaces for edit mode

## Requirements Analysis

### Functional Requirements
- Support both create and edit modes in single component
- Accept initial data for edit mode
- Show appropriate loading states
- Display correct titles and button text
- Maintain all existing validation logic
- Support all trade fields including optional ones

### Technical Requirements
- Extend component props to support edit mode
- Add proper TypeScript interfaces
- Maintain backward compatibility
- Ensure proper form state management
- Handle both create and update API calls

## Implementation Plan

### 1. Update TypeScript Interfaces
- Add new interfaces for edit mode props
- Extend existing CreateTradeRequest interface
- Add TradeFormData interface for internal form state

### 2. Enhance Component Props
- Add `mode` prop to distinguish create/edit
- Add `initialData` prop for edit mode
- Add `isLoading` prop for loading states
- Add `title` prop for customizable titles

### 3. Update Form Logic
- Initialize form with initial data when provided
- Handle both create and edit submissions
- Update validation logic for edit mode
- Improve error handling

### 4. Update UI Elements
- Dynamic titles based on mode
- Dynamic button text
- Loading states for both modes
- Proper form state management

## Detailed Implementation

### Step 1: Update TypeScript Interfaces

#### src/types/trade.ts
Add new interfaces for enhanced form support:

```typescript
// Add to existing types
export interface TradeFormData {
  ticker: string;
  entryDate: string;
  entryPrice: number;
  quantity: number;
  isShort: boolean;
  fees: number;
  notes: string;
  tags: string;
  exitDate: string;
  exitPrice: number;
}

export interface UpdateTradeRequest {
  ticker?: string;
  entryDate?: string;
  entryPrice?: number;
  quantity?: number;
  isShort?: boolean;
  fees?: number;
  notes?: string;
  tags?: string;
  exitDate?: string;
  exitPrice?: number;
}

export interface TradeEntryFormProps {
  mode: 'create' | 'edit';
  onSubmit: (data: CreateTradeRequest | UpdateTradeRequest) => Promise<void>;
  onCancel: () => void;
  className?: string;
  initialData?: TradeFormData;
  isLoading?: boolean;
  title?: string;
}
```

### Step 2: Enhanced TradeEntryForm Component

#### src/components/trades/TradeEntryForm.tsx
```typescript
'use client';

import { useState, useEffect } from 'react';
import { CreateTradeRequest, UpdateTradeRequest, TradeFormData, TradeEntryFormProps } from '@/types/trade';

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

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with initial data when provided
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleInputChange = (field: keyof TradeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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
        if (exitDate <= entryDate) {
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
      // Convert form data to appropriate request format
      const requestData = mode === 'create' 
        ? formData as CreateTradeRequest
        : formData as UpdateTradeRequest;
      
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
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {getTitle()}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ticker *
            </label>
            <input
              type="text"
              value={formData.ticker}
              onChange={(e) => handleInputChange('ticker', e.target.value.toUpperCase())}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.ticker ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="e.g., AAPL"
              disabled={isLoading}
            />
            {errors.ticker && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.ticker}</p>
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
                  className="mr-2"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Long</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={formData.isShort}
                  onChange={() => handleInputChange('isShort', true)}
                  className="mr-2"
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
              value={formData.entryDate}
              onChange={(e) => handleInputChange('entryDate', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.entryDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              disabled={isLoading}
            />
            {errors.entryDate && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.entryDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Entry Price *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.entryPrice}
              onChange={(e) => handleInputChange('entryPrice', parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.entryPrice ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="0.00"
              disabled={isLoading}
            />
            {errors.entryPrice && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.entryPrice}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quantity *
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.quantity ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="0"
              disabled={isLoading}
            />
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.quantity}</p>
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
              value={formData.exitDate}
              onChange={(e) => handleInputChange('exitDate', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.exitDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              disabled={isLoading}
            />
            {errors.exitDate && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.exitDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Exit Price
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.exitPrice}
              onChange={(e) => handleInputChange('exitPrice', parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.exitPrice ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="0.00"
              disabled={isLoading}
            />
            {errors.exitPrice && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.exitPrice}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fees
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.fees}
              onChange={(e) => handleInputChange('fees', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., tech, growth, dividend"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
```

### Step 3: Update Add Trade Page

#### src/app/trades/add/page.tsx
Update to use the enhanced form:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TradeEntryForm } from '@/components/trades/TradeEntryForm';
import { CreateTradeRequest } from '@/types/trade';

export default function AddTradePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateTradeRequest) => {
    try {
      setError(null);

      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create trade');
      }

      const result = await response.json();
      
      // Redirect to the new trade's detail page
      router.push(`/trades/${result.trade.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trade');
    }
  };

  const handleCancel = () => {
    router.push('/trades');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add New Trade</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Enter the details for your new trade
            </p>
          </div>
          <Link
            href="/trades"
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Back to Trades
          </Link>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="text-red-600 dark:text-red-400">
            <div className="font-medium">Error creating trade</div>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      )}

      {/* Trade Entry Form */}
      <TradeEntryForm 
        mode="create"
        onSubmit={handleSubmit} 
        onCancel={handleCancel} 
      />
    </div>
  );
}
```

### Step 4: Update Edit Trade Page

#### src/app/trades/[id]/edit/page.tsx
Update to use the enhanced form:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { TradeEntryForm } from '@/components/trades/TradeEntryForm';
import { UpdateTradeRequest, TradeFormData } from '@/types/trade';

interface Trade {
  id: number;
  ticker: string;
  entryDate: string;
  entryPrice: number;
  exitDate?: string;
  exitPrice?: number;
  quantity: number;
  fees?: number;
  notes?: string;
  tags?: string;
  isShort: boolean;
  createdAt: string;
  updatedAt: string;
  performance?: unknown;
}

export default function EditTradePage() {
  const router = useRouter();
  const params = useParams();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tradeId = params?.id as string;

  useEffect(() => {
    const fetchTrade = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/trades/${tradeId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Trade not found');
          }
          throw new Error(`Failed to fetch trade: ${response.statusText}`);
        }

        const data = await response.json();
        setTrade(data);
      } catch (err) {
        console.error('Error fetching trade:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while loading the trade');
      } finally {
        setIsLoading(false);
      }
    };

    if (tradeId) {
      fetchTrade();
    }
  }, [tradeId]);

  const handleSubmit = async (tradeData: UpdateTradeRequest) => {
    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(`/api/trades/${tradeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tradeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update trade');
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        // Redirect to the trade detail page
        router.push(`/trades/${tradeId}`);
      } else {
        throw new Error(result.message || 'Failed to update trade');
      }
    } catch (err) {
      console.error('Error updating trade:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while updating the trade');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/trades/${tradeId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error loading trade
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => router.push('/trades')}
                    className="text-sm font-medium text-red-800 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100"
                  >
                    Back to Trades
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Trade not found
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              The trade you&apos;re looking for doesn&apos;t exist.
            </p>
            <button
              onClick={() => router.push('/trades')}
              className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              Back to Trades
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Convert trade data to form data format
  const initialFormData: TradeFormData = {
    ticker: trade.ticker,
    entryDate: new Date(trade.entryDate).toISOString().split('T')[0],
    entryPrice: trade.entryPrice,
    quantity: trade.quantity,
    exitDate: trade.exitDate ? new Date(trade.exitDate).toISOString().split('T')[0] : '',
    exitPrice: trade.exitPrice || 0,
    fees: trade.fees || 0,
    notes: trade.notes || '',
    tags: trade.tags || '',
    isShort: trade.isShort,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleCancel}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Edit Trade
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Update the details for {trade.ticker}
              </p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error updating trade
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trade Entry Form */}
        <TradeEntryForm
          mode="edit"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isSaving}
          initialData={initialFormData}
        />
      </div>
    </div>
  );
}
```

## Testing Strategy

### Unit Tests
- Test form validation for both create and edit modes
- Test form initialization with initial data
- Test loading states
- Test error handling

### Integration Tests
- Test create trade flow
- Test edit trade flow
- Test form submission with valid/invalid data
- Test navigation between pages

### Manual Testing
- Test create trade form
- Test edit trade form
- Test validation messages
- Test loading states
- Test responsive design

## Validation Criteria

### Functional Validation
- [ ] Form works correctly in both create and edit modes
- [ ] Initial data is properly loaded in edit mode
- [ ] Validation works for both modes
- [ ] Loading states are displayed correctly
- [ ] Error handling works properly
- [ ] Navigation flows work correctly

### Performance Validation
- [ ] Form loads quickly with initial data
- [ ] No unnecessary re-renders
- [ ] Smooth user experience
- [ ] Proper loading indicators

### Error Handling Validation
- [ ] Validation errors are displayed properly
- [ ] API errors are handled gracefully
- [ ] Form state is maintained on errors
- [ ] User-friendly error messages

## Next Steps

After completing this task:
1. **Task 2.2.4**: Form validation is now enhanced ✅
2. **Task 2.3.3**: Edit Trade page is now fully functional ✅
3. **Task 2.3.5**: Navigation between trade pages is complete ✅
4. **Phase 3**: Move to Performance Analysis Features
   - **Task 3.1.1**: Implement GET /api/performance/weekly endpoint
   - **Task 3.1.2**: Implement GET /api/performance/monthly endpoint
   - **Task 3.1.3**: Implement GET /api/performance/yearly endpoint 