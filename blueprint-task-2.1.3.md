# Blueprint: Task 2.1.3 - Implement POST /api/trades Endpoint

## Overview
This blueprint outlines the implementation of the POST /api/trades endpoint for creating new trades in the Trade-Tracker MVP application. This endpoint will handle trade creation with validation, data processing, and proper error handling.

## Requirements Analysis

### Functional Requirements
- Create new trade entries with all required fields
- Validate input data for completeness and correctness
- Handle both open and closed trades
- Support long and short positions
- Include optional fields like notes and tags
- Return created trade with calculated fields
- Handle database constraints and errors

### Technical Requirements
- Implement proper input validation
- Use Prisma ORM for database operations
- Return appropriate HTTP status codes
- Include TypeScript types for request/response
- Handle validation errors gracefully
- Ensure data consistency

## Implementation Plan

### 1. API Route Structure
- Extend `/api/trades/route.ts` with POST method
- Implement request body validation
- Add trade creation logic
- Implement error handling

### 2. Request/Response Structure
- Define CreateTradeRequest interface
- Validate required and optional fields
- Return created trade with calculations
- Include proper error responses

### 3. Integration Points
- Connect with existing trade service
- Use existing calculation methods
- Maintain consistency with other endpoints
- Follow established patterns

## Detailed Implementation

### Step 1: Update Trade Types

#### src/types/trade.ts
Add new interfaces for trade creation:

```typescript
// Add to existing types
export interface CreateTradeRequest {
  ticker: string;
  entryDate: string;
  entryPrice: number;
  quantity: number;
  isShort: boolean;
  fees?: number;
  notes?: string;
  tags?: string;
  exitDate?: string;
  exitPrice?: number;
}

export interface CreateTradeResponse {
  success: boolean;
  trade: TradeWithCalculations;
  message?: string;
}

export interface TradeError {
  success: false;
  error: string;
  details?: string;
  field?: string;
}
```

### Step 2: Update Trade Service

#### src/services/trade-service.ts
Add createTrade method:

```typescript
// Add to TradeService class
async createTrade(data: CreateTradeRequest): Promise<TradeWithCalculations> {
  try {
    // Validate required fields
    if (!data.ticker || !data.entryDate || !data.entryPrice || !data.quantity) {
      throw new Error('Missing required fields: ticker, entryDate, entryPrice, quantity');
    }

    // Validate numeric fields
    if (data.entryPrice <= 0 || data.quantity <= 0) {
      throw new Error('Entry price and quantity must be positive numbers');
    }

    // Validate dates
    const entryDate = new Date(data.entryDate);
    if (isNaN(entryDate.getTime())) {
      throw new Error('Invalid entry date format');
    }

    // Validate exit data if provided
    if (data.exitDate && data.exitPrice) {
      const exitDate = new Date(data.exitDate);
      if (isNaN(exitDate.getTime())) {
        throw new Error('Invalid exit date format');
      }
      if (data.exitPrice <= 0) {
        throw new Error('Exit price must be a positive number');
      }
      if (exitDate < entryDate) {
        throw new Error('Exit date cannot be before entry date');
      }
    }

    // Create trade in database
    const trade = await prisma.trade.create({
      data: {
        ticker: data.ticker.toUpperCase(),
        entryDate: entryDate,
        entryPrice: data.entryPrice,
        quantity: data.quantity,
        isShort: data.isShort,
        fees: data.fees || 0,
        notes: data.notes || null,
        tags: data.tags || null,
        exitDate: data.exitDate ? new Date(data.exitDate) : null,
        exitPrice: data.exitPrice || null,
      },
    });

    // Calculate additional fields
    return this.calculateTradeFields(trade);
  } catch (error) {
    console.error('Error creating trade:', error);
    throw error;
  }
}
```

### Step 3: Update API Route

#### src/app/api/trades/route.ts
Add POST method:

```typescript
// Add POST method to existing route
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ['ticker', 'entryDate', 'entryPrice', 'quantity'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate data types
    if (typeof body.ticker !== 'string' || body.ticker.trim() === '') {
      return NextResponse.json(
        { error: 'Ticker must be a non-empty string' },
        { status: 400 }
      );
    }

    if (typeof body.entryPrice !== 'number' || body.entryPrice <= 0) {
      return NextResponse.json(
        { error: 'Entry price must be a positive number' },
        { status: 400 }
      );
    }

    if (typeof body.quantity !== 'number' || body.quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be a positive number' },
        { status: 400 }
      );
    }

    if (typeof body.isShort !== 'boolean') {
      return NextResponse.json(
        { error: 'isShort must be a boolean value' },
        { status: 400 }
      );
    }

    // Create trade using service
    const trade = await tradeService.createTrade(body);

    return NextResponse.json(
      { 
        success: true,
        trade,
        message: 'Trade created successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/trades:', error);
    
    // Handle specific validation errors
    if (error instanceof Error) {
      if (error.message.includes('Missing required fields')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      if (error.message.includes('Invalid') || error.message.includes('must be')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create trade',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

### Step 4: Create Trade Entry Form Component

#### src/components/trades/TradeEntryForm.tsx
```typescript
'use client';

import { useState } from 'react';
import { CreateTradeRequest } from '@/types/trade';

interface TradeEntryFormProps {
  onSubmit: (data: CreateTradeRequest) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

export function TradeEntryForm({ onSubmit, onCancel, className = '' }: TradeEntryFormProps) {
  const [formData, setFormData] = useState<CreateTradeRequest>({
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

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof CreateTradeRequest, value: any) => {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Add New Trade
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
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Long</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={formData.isShort}
                  onChange={() => handleInputChange('isShort', true)}
                  className="mr-2"
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
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
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Trade'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

### Step 5: Create Add Trade Page

#### src/app/trades/add/page.tsx
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
      <TradeEntryForm onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  );
}
```

## Testing Strategy

### Unit Tests
- Test trade service createTrade function
- Test input validation logic
- Test database operations
- Test calculation functions

### Integration Tests
- Test API endpoint with valid trade data
- Test API endpoint with invalid data
- Test required field validation
- Test error handling

### Manual Testing
- Test trade creation form
- Test validation messages
- Test navigation flow
- Test responsive design

## Validation Criteria

### Functional Validation
- [ ] Trade creation form displays correctly
- [ ] All required fields are validated
- [ ] Trade is created successfully in database
- [ ] User is redirected to trade detail page
- [ ] Error messages are displayed properly

### Performance Validation
- [ ] Form submission completes within 2 seconds
- [ ] Database operations are efficient
- [ ] No unnecessary re-renders
- [ ] Smooth user experience

### Error Handling Validation
- [ ] Invalid data shows appropriate error messages
- [ ] Database errors are handled gracefully
- [ ] Network errors show user-friendly messages
- [ ] Form validation prevents invalid submissions

## Next Steps

After completing this task:
1. **Task 2.1.4**: Implement PUT /api/trades/:id endpoint
2. **Task 2.1.5**: Implement DELETE /api/trades/:id endpoint
3. **Task 2.2.4**: Implement form validation
4. **Task 2.3.3**: Create Edit Trade page 