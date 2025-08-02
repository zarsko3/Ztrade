export interface Trade {
  id: number;
  ticker: string;
  entryDate: Date | string;
  entryPrice: number;
  exitDate?: Date | string;
  exitPrice?: number;
  quantity: number;
  fees?: number;
  notes?: string;
  tags?: string;
  isShort: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  performanceId?: number;
}

export interface TradeWithCalculations extends Trade {
  profitLoss?: number;
  profitLossPercentage?: number;
  isOpen: boolean;
  holdingPeriod?: number;
}

// New interfaces for position management
export interface Position {
  ticker: string;
  totalQuantity: number;
  averageEntryPrice: number;
  totalInvestment: number;
  totalFees: number;
  isShort: boolean;
  isOpen: boolean;
  trades: TradeWithCalculations[];
  currentValue?: number;
  unrealizedPnL?: number;
  unrealizedPnLPercentage?: number;
}

export interface AddToPositionRequest {
  ticker: string;
  entryDate: string;
  entryPrice: number;
  quantity: number;
  fees?: number;
  notes?: string;
  tags?: string;
}

export interface AddToPositionResponse {
  success: boolean;
  position: Position;
  message?: string;
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
  userId?: string;
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
  userId?: string;
}

export interface CreateTradeResponse {
  success: boolean;
  trade: TradeWithCalculations;
  message?: string;
}

export interface TradeError {
  code: string;
  message: string;
  details?: any;
}

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

// New interface for Add to Position form
export interface AddToPositionFormProps {
  ticker: string;
  existingPosition: Position;
  onSubmit: (data: AddToPositionRequest) => Promise<void>;
  onCancel: () => void;
  className?: string;
  isLoading?: boolean;
} 