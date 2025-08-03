# Blueprint: Task 2.1.2 - Implement GET /api/trades/:id Endpoint

## Overview
This blueprint outlines the implementation of the GET /api/trades/:id endpoint for retrieving detailed information about a specific trade, including calculated fields and related data for the Trade-Tracker MVP application.

## Requirements Analysis

### Functional Requirements
- Retrieve a single trade by its unique ID
- Include calculated profit/loss and percentage data
- Include holding period calculation for closed trades
- Include trade status (open/closed)
- Return detailed trade information with all fields
- Handle trade not found scenarios gracefully
- Include performance metrics if available

### Technical Requirements
- Implement proper error handling and validation
- Use Prisma ORM for database queries
- Validate trade ID parameter
- Return appropriate HTTP status codes
- Include TypeScript types for response
- Efficient database queries with proper relationships

## Implementation Plan

### 1. API Route Structure
- Create `/api/trades/[id]/route.ts` with GET method
- Implement parameter validation
- Add trade ID parsing and validation
- Implement database queries with Prisma

### 2. Response Structure
- Complete trade data with all fields
- Calculated profit/loss and percentage
- Holding period for closed trades
- Trade status information
- Performance data if linked
- Error handling for not found cases

### 3. Integration Points
- Connect with existing trade service
- Use existing calculation methods
- Integrate with performance data
- Maintain consistency with list endpoint

## Detailed Implementation

### Step 1: Create Individual Trade API Route

#### src/app/api/trades/[id]/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { tradeService } from '@/services/trade-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate trade ID
    const tradeId = parseInt(id);
    if (isNaN(tradeId) || tradeId <= 0) {
      return NextResponse.json(
        { error: 'Invalid trade ID. Must be a positive integer.' },
        { status: 400 }
      );
    }

    // Get trade from service
    const trade = await tradeService.getTradeById(tradeId);

    if (!trade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(trade);
  } catch (error) {
    console.error('Error in GET /api/trades/[id]:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve trade',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

### Step 2: Create Trade Detail Component

#### src/components/trades/TradeDetail.tsx
```typescript
'use client';

import { useState, useEffect } from 'react';
import { TradeWithCalculations } from '@/types/trade';

interface TradeDetailProps {
  tradeId: number;
  className?: string;
}

export function TradeDetail({ tradeId, className = '' }: TradeDetailProps) {
  const [trade, setTrade] = useState<TradeWithCalculations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrade();
  }, [tradeId]);

  const fetchTrade = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/trades/${tradeId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Trade not found');
        }
        throw new Error(`Failed to fetch trade: ${response.statusText}`);
      }

      const data: TradeWithCalculations = await response.json();
      setTrade(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trade');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="text-red-600">
          <div className="font-medium">Error loading trade</div>
          <div className="text-sm">{error}</div>
          <button 
            onClick={fetchTrade}
            className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="text-yellow-800">
          <div className="font-medium">Trade not found</div>
          <div className="text-sm">The requested trade could not be found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {trade.ticker}
            </h2>
            <p className="text-sm text-gray-600">
              Trade #{trade.id}
            </p>
          </div>
          <div className="text-right">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              trade.isOpen 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {trade.isOpen ? 'Open' : 'Closed'}
            </span>
          </div>
        </div>
      </div>

      {/* Trade Details */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Entry Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Entry Information</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Entry Date</dt>
                <dd className="text-sm text-gray-900">{formatDate(trade.entryDate)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Entry Price</dt>
                <dd className="text-sm text-gray-900">{formatCurrency(trade.entryPrice)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Quantity</dt>
                <dd className="text-sm text-gray-900">{trade.quantity} shares</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Position Type</dt>
                <dd className="text-sm text-gray-900">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                    trade.isShort 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {trade.isShort ? 'Short' : 'Long'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Fees</dt>
                <dd className="text-sm text-gray-900">
                  {trade.fees ? formatCurrency(trade.fees) : 'None'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Exit Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Exit Information</h3>
            <dl className="space-y-3">
              {trade.exitDate ? (
                <>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Exit Date</dt>
                    <dd className="text-sm text-gray-900">{formatDate(trade.exitDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Exit Price</dt>
                    <dd className="text-sm text-gray-900">{formatCurrency(trade.exitPrice!)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Holding Period</dt>
                    <dd className="text-sm text-gray-900">
                      {trade.holdingPeriod} days
                    </dd>
                  </div>
                </>
              ) : (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="text-sm text-gray-900">Position is still open</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Profit/Loss Information */}
        {trade.profitLoss !== undefined && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Profit/Loss Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Total P&L</dt>
                <dd className={`text-lg font-semibold ${
                  trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(trade.profitLoss)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">P&L Percentage</dt>
                <dd className={`text-lg font-semibold ${
                  trade.profitLossPercentage! >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercentage(trade.profitLossPercentage!)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Return on Investment</dt>
                <dd className={`text-lg font-semibold ${
                  trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercentage(trade.profitLossPercentage!)}
                </dd>
              </div>
            </div>
          </div>
        )}

        {/* Additional Information */}
        {(trade.notes || trade.tags) && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
            <div className="space-y-4">
              {trade.notes && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-2">Notes</dt>
                  <dd className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                    {trade.notes}
                  </dd>
                </div>
              )}
              {trade.tags && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-2">Tags</dt>
                  <dd className="flex flex-wrap gap-2">
                    {trade.tags.split(',').map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
            <div>
              <span className="font-medium">Created:</span> {formatDate(trade.createdAt)}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span> {formatDate(trade.updatedAt)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Step 3: Create Trade Detail Page

#### src/app/trades/[id]/page.tsx
```typescript
import { TradeDetail } from '@/components/trades/TradeDetail';
import Link from 'next/link';

interface TradeDetailPageProps {
  params: {
    id: string;
  };
}

export default function TradeDetailPage({ params }: TradeDetailPageProps) {
  const tradeId = parseInt(params.id);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trade Details</h1>
            <p className="mt-2 text-gray-600">
              View detailed information about trade #{tradeId}
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/trades"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back to Trades
            </Link>
            <Link
              href={`/trades/${tradeId}/edit`}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              Edit Trade
            </Link>
          </div>
        </div>
      </div>
      
      {/* Trade Detail Component */}
      <TradeDetail tradeId={tradeId} />
    </div>
  );
}
```

### Step 4: Update Trade List to Link to Details

#### Update src/components/trades/TradeList.tsx
Add click handlers to make trade rows clickable:

```typescript
// Add to imports
import { useRouter } from 'next/navigation';

// Add inside component
const router = useRouter();

const handleTradeClick = (tradeId: number) => {
  router.push(`/trades/${tradeId}`);
};

// Update table row to be clickable
<tr 
  key={trade.id} 
  className="hover:bg-gray-50 cursor-pointer"
  onClick={() => handleTradeClick(trade.id)}
>
  {/* ... existing row content ... */}
</tr>
```

## Testing Strategy

### Unit Tests
- Test trade service getTradeById function
- Test parameter validation
- Test database queries
- Test calculation functions

### Integration Tests
- Test API endpoint with valid trade ID
- Test API endpoint with invalid trade ID
- Test trade not found scenarios
- Test error handling

### Manual Testing
- Test trade detail page display
- Test navigation from trade list
- Test responsive design
- Test all calculated fields

## Validation Criteria

### Functional Validation
- [ ] Trade detail page displays correctly
- [ ] All trade information is shown accurately
- [ ] Profit/loss calculations are correct
- [ ] Holding period is calculated correctly
- [ ] Trade status is displayed properly
- [ ] Navigation works from trade list

### Performance Validation
- [ ] Page loads within 2 seconds
- [ ] Database queries are efficient
- [ ] No unnecessary re-renders
- [ ] Smooth navigation experience

### Error Handling Validation
- [ ] Invalid trade ID returns proper error
- [ ] Trade not found shows appropriate message
- [ ] Database errors are handled gracefully
- [ ] Network errors show user-friendly messages

## Next Steps

After completing this task:
1. **Task 2.1.3**: Implement POST /api/trades endpoint
2. **Task 2.1.4**: Implement PUT /api/trades/:id endpoint
3. **Task 2.1.5**: Implement DELETE /api/trades/:id endpoint
4. **Task 2.2.1**: Create Trade Entry Form component 