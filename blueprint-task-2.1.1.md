# Blueprint: Task 2.1.1 - Implement GET /api/trades Endpoint

## Overview
This blueprint outlines the implementation of the GET /api/trades endpoint for retrieving a paginated list of trades with filtering, sorting, and search capabilities for the Trade-Tracker MVP application.

## Requirements Analysis

### Functional Requirements
- Retrieve paginated list of all trades
- Support filtering by ticker symbol, date range, and trade status
- Support sorting by various fields (date, ticker, profit/loss, etc.)
- Support search functionality across trade fields
- Include calculated profit/loss for each trade
- Support both open and closed trades
- Return metadata for pagination

### Technical Requirements
- Implement proper error handling and validation
- Use Prisma ORM for database queries
- Support query parameters for filtering and pagination
- Implement efficient database queries with proper indexing
- Add TypeScript types for request/response
- Include proper HTTP status codes

## Implementation Plan

### 1. API Route Structure
- Create `/api/trades` route with GET method
- Implement query parameter parsing
- Add request validation
- Implement database queries with Prisma

### 2. Query Parameters Support
- Pagination: page, limit
- Sorting: sortBy, sortOrder
- Filtering: ticker, startDate, endDate, status
- Search: search query across multiple fields

### 3. Response Structure
- Trades array with calculated fields
- Pagination metadata
- Total count and page information
- Error handling and validation

## Detailed Implementation

### Step 1: Create Trade Types

#### src/types/trade.ts
```typescript
export interface Trade {
  id: number;
  ticker: string;
  entryDate: Date;
  entryPrice: number;
  exitDate?: Date;
  exitPrice?: number;
  quantity: number;
  fees?: number;
  notes?: string;
  tags?: string;
  isShort: boolean;
  createdAt: Date;
  updatedAt: Date;
  performanceId?: number;
}

export interface TradeWithCalculations extends Trade {
  profitLoss?: number;
  profitLossPercentage?: number;
  isOpen: boolean;
  holdingPeriod?: number;
}

export interface TradeListRequest {
  page?: number;
  limit?: number;
  sortBy?: 'entryDate' | 'ticker' | 'profitLoss' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  ticker?: string;
  startDate?: string;
  endDate?: string;
  status?: 'open' | 'closed' | 'all';
  search?: string;
}

export interface TradeListResponse {
  trades: TradeWithCalculations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface TradeError {
  code: string;
  message: string;
  details?: any;
}
```

### Step 2: Create Trade Service

#### src/services/trade-service.ts
```typescript
import { PrismaClient } from '@prisma/client';
import { Trade, TradeWithCalculations, TradeListRequest, TradeListResponse } from '@/types/trade';

export class TradeService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get paginated list of trades with filtering and sorting
   */
  async getTrades(request: TradeListRequest): Promise<TradeListResponse> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'entryDate',
      sortOrder = 'desc',
      ticker,
      startDate,
      endDate,
      status = 'all',
      search
    } = request;

    // Build where clause for filtering
    const where: any = {};

    if (ticker) {
      where.ticker = { contains: ticker.toUpperCase() };
    }

    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) {
        where.entryDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.entryDate.lte = new Date(endDate);
      }
    }

    if (status !== 'all') {
      if (status === 'open') {
        where.exitDate = null;
      } else if (status === 'closed') {
        where.exitDate = { not: null };
      }
    }

    if (search) {
      where.OR = [
        { ticker: { contains: search.toUpperCase() } },
        { notes: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await this.prisma.trade.count({ where });

    // Get trades with pagination
    const trades = await this.prisma.trade.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        performance: true
      }
    });

    // Calculate additional fields for each trade
    const tradesWithCalculations = trades.map(trade => 
      this.calculateTradeFields(trade)
    );

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      trades: tradesWithCalculations,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev
      }
    };
  }

  /**
   * Get a single trade by ID
   */
  async getTradeById(id: number): Promise<TradeWithCalculations | null> {
    const trade = await this.prisma.trade.findUnique({
      where: { id },
      include: {
        performance: true
      }
    });

    if (!trade) {
      return null;
    }

    return this.calculateTradeFields(trade);
  }

  /**
   * Calculate additional fields for a trade
   */
  private calculateTradeFields(trade: any): TradeWithCalculations {
    const isOpen = !trade.exitDate;
    let profitLoss: number | undefined;
    let profitLossPercentage: number | undefined;
    let holdingPeriod: number | undefined;

    if (!isOpen && trade.exitPrice) {
      const totalEntry = trade.entryPrice * trade.quantity;
      const totalExit = trade.exitPrice * trade.quantity;
      const fees = trade.fees || 0;

      if (trade.isShort) {
        profitLoss = totalEntry - totalExit - fees;
      } else {
        profitLoss = totalExit - totalEntry - fees;
      }

      profitLossPercentage = (profitLoss / totalEntry) * 100;

      // Calculate holding period in days
      const entryDate = new Date(trade.entryDate);
      const exitDate = new Date(trade.exitDate);
      holdingPeriod = Math.ceil((exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
      ...trade,
      profitLoss,
      profitLossPercentage,
      isOpen,
      holdingPeriod
    };
  }

  /**
   * Get trade statistics
   */
  async getTradeStats(): Promise<{
    totalTrades: number;
    openTrades: number;
    closedTrades: number;
    totalProfitLoss: number;
    averageProfitLoss: number;
    winRate: number;
  }> {
    const [totalTrades, openTrades, closedTrades] = await Promise.all([
      this.prisma.trade.count(),
      this.prisma.trade.count({ where: { exitDate: null } }),
      this.prisma.trade.count({ where: { exitDate: { not: null } } })
    ]);

    // Calculate profit/loss for closed trades
    const closedTradesData = await this.prisma.trade.findMany({
      where: { exitDate: { not: null } }
    });

    let totalProfitLoss = 0;
    let winningTrades = 0;

    closedTradesData.forEach(trade => {
      if (trade.exitPrice) {
        const totalEntry = trade.entryPrice * trade.quantity;
        const totalExit = trade.exitPrice * trade.quantity;
        const fees = trade.fees || 0;

        let profitLoss: number;
        if (trade.isShort) {
          profitLoss = totalEntry - totalExit - fees;
        } else {
          profitLoss = totalExit - totalEntry - fees;
        }

        totalProfitLoss += profitLoss;
        if (profitLoss > 0) {
          winningTrades++;
        }
      }
    });

    const averageProfitLoss = closedTrades > 0 ? totalProfitLoss / closedTrades : 0;
    const winRate = closedTrades > 0 ? (winningTrades / closedTrades) * 100 : 0;

    return {
      totalTrades,
      openTrades,
      closedTrades,
      totalProfitLoss,
      averageProfitLoss,
      winRate
    };
  }
}

// Export singleton instance
export const tradeService = new TradeService();
```

### Step 3: Create API Route

#### src/app/api/trades/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { tradeService } from '@/services/trade-service';
import { TradeListRequest } from '@/types/trade';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const tradeRequest: TradeListRequest = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
      sortBy: searchParams.get('sortBy') as any || 'entryDate',
      sortOrder: searchParams.get('sortOrder') as any || 'desc',
      ticker: searchParams.get('ticker') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      status: searchParams.get('status') as any || 'all',
      search: searchParams.get('search') || undefined
    };

    // Validate parameters
    if (tradeRequest.page < 1) {
      return NextResponse.json(
        { error: 'Page must be greater than 0' },
        { status: 400 }
      );
    }

    if (tradeRequest.limit < 1 || tradeRequest.limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (tradeRequest.sortBy && !['entryDate', 'ticker', 'profitLoss', 'createdAt'].includes(tradeRequest.sortBy)) {
      return NextResponse.json(
        { error: 'Invalid sortBy parameter' },
        { status: 400 }
      );
    }

    if (tradeRequest.sortOrder && !['asc', 'desc'].includes(tradeRequest.sortOrder)) {
      return NextResponse.json(
        { error: 'Invalid sortOrder parameter' },
        { status: 400 }
      );
    }

    if (tradeRequest.status && !['open', 'closed', 'all'].includes(tradeRequest.status)) {
      return NextResponse.json(
        { error: 'Invalid status parameter' },
        { status: 400 }
      );
    }

    // Get trades from service
    const result = await tradeService.getTrades(tradeRequest);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/trades:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve trades',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

### Step 4: Create Trade List Component

#### src/components/trades/TradeList.tsx
```typescript
'use client';

import { useState, useEffect } from 'react';
import { TradeWithCalculations, TradeListResponse } from '@/types/trade';

interface TradeListProps {
  className?: string;
}

export function TradeList({ className = '' }: TradeListProps) {
  const [trades, setTrades] = useState<TradeWithCalculations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [filters, setFilters] = useState({
    ticker: '',
    status: 'all' as 'open' | 'closed' | 'all',
    search: ''
  });

  useEffect(() => {
    fetchTrades();
  }, [pagination.page, filters]);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: 'entryDate',
        sortOrder: 'desc',
        ...(filters.ticker && { ticker: filters.ticker }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`/api/trades?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch trades: ${response.statusText}`);
      }

      const data: TradeListResponse = await response.json();
      setTrades(data.trades);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trades');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
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
          <div className="font-medium">Error loading trades</div>
          <div className="text-sm">{error}</div>
          <button 
            onClick={fetchTrades}
            className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ticker
            </label>
            <input
              type="text"
              value={filters.ticker}
              onChange={(e) => handleFilterChange('ticker', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Filter by ticker"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Trades</option>
              <option value="open">Open Trades</option>
              <option value="closed">Closed Trades</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search trades..."
            />
          </div>
        </div>
      </div>

      {/* Trades Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ticker
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Entry Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Entry Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Exit Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Exit Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                P&L
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {trades.map((trade) => (
              <tr key={trade.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {trade.ticker}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(trade.entryDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(trade.entryPrice)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {trade.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {trade.exitDate ? formatDate(trade.exitDate) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {trade.exitPrice ? formatCurrency(trade.exitPrice) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {trade.profitLoss !== undefined ? (
                    <span className={trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(trade.profitLoss)}
                      {trade.profitLossPercentage !== undefined && (
                        <span className="ml-1 text-xs">
                          ({trade.profitLossPercentage >= 0 ? '+' : ''}{trade.profitLossPercentage.toFixed(2)}%)
                        </span>
                      )}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    trade.isOpen 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {trade.isOpen ? 'Open' : 'Closed'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} trades
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Step 5: Update Trades Page

#### src/app/trades/page.tsx
```typescript
import { TradeList } from '@/components/trades/TradeList';

export default function TradesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Trades</h1>
        <p className="mt-2 text-gray-600">
          View and manage your stock trades
        </p>
      </div>
      
      <TradeList />
    </div>
  );
}
```

## Testing Strategy

### Unit Tests
- Test trade service functions
- Test parameter validation
- Test database queries
- Test calculation functions

### Integration Tests
- Test API endpoint with various parameters
- Test pagination functionality
- Test filtering and sorting
- Test error scenarios

### Manual Testing
- Test trade list display
- Test filtering by ticker and status
- Test pagination controls
- Test search functionality

## Validation Criteria

### Functional Validation
- [ ] Trades list displays correctly
- [ ] Pagination works properly
- [ ] Filtering by ticker works
- [ ] Filtering by status works
- [ ] Search functionality works
- [ ] Sorting works for all fields
- [ ] Profit/loss calculations are accurate
- [ ] Open/closed trade status is correct

### Performance Validation
- [ ] Page loads within 2 seconds
- [ ] Pagination is efficient
- [ ] Database queries are optimized
- [ ] Large datasets handle properly

### Error Handling Validation
- [ ] Invalid parameters return proper errors
- [ ] Database errors are handled gracefully
- [ ] Network errors show user-friendly messages
- [ ] Validation prevents invalid requests

## Next Steps

After completing this task:
1. **Task 2.1.2**: Implement GET /api/trades/:id endpoint
2. **Task 2.1.3**: Implement POST /api/trades endpoint
3. **Task 2.1.4**: Implement PUT /api/trades/:id endpoint
4. **Task 2.1.5**: Implement DELETE /api/trades/:id endpoint 