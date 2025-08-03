// AI-Powered Trade Analysis Type Definitions

// ============================================================================
// PATTERN ANALYSIS TYPES
// ============================================================================

export type PatternType = 'trend_following' | 'mean_reversion' | 'breakout' | 'volume' | 'support_resistance' | 'candlestick';

export type PatternDirection = 'bullish' | 'bearish' | 'neutral';

export interface TradingPattern {
  id: string;
  type: PatternType;
  name: string;
  direction: PatternDirection;
  confidence: number; // 0-1
  trades: number[]; // Trade IDs that match this pattern
  description: string;
  performance: {
    winRate: number;
    avgReturn: number;
    totalTrades: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };
  timeframe: 'short' | 'medium' | 'long';
  marketConditions: MarketConditions;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatternMatch {
  patternId: string;
  tradeId: number;
  confidence: number;
  matchedAt: Date;
  expectedOutcome: 'profit' | 'loss' | 'neutral';
  expectedReturn: number;
}

// ============================================================================
// INSIGHT TYPES
// ============================================================================

export type InsightType = 'performance' | 'risk' | 'pattern' | 'behavioral' | 'market' | 'technical';

export interface TradeInsight {
  id: string;
  tradeId: number;
  type: InsightType;
  title: string;
  text: string;
  confidence: number; // 0-1
  category: 'positive' | 'negative' | 'neutral' | 'warning';
  actionable: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  createdAt: Date;
}

export interface BehavioralInsight {
  emotionalState: 'confident' | 'fearful' | 'greedy' | 'neutral' | 'anxious';
  decisionFatigue: number; // 0-100 scale
  tradingFrequency: number;
  positionSizingConsistency: number; // 0-100 scale
  riskTolerance: number; // 0-100 scale
  patternAdherence: number; // 0-100 scale
  overconfidence: number; // 0-100 scale
  fomoBehavior: number; // 0-100 scale
  revengeTrading: number; // 0-100 scale
}

// ============================================================================
// PREDICTION TYPES
// ============================================================================

export type PredictionType = 'entry' | 'exit' | 'price' | 'risk' | 'volatility' | 'trend';

export interface TradePrediction {
  id: string;
  tradeId: number;
  type: PredictionType;
  predictedValue: number;
  actualValue?: number;
  confidence: number; // 0-1
  timeframe: 'short' | 'medium' | 'long';
  model: string;
  features: Record<string, number>;
  createdAt: Date;
  validatedAt?: Date;
  accuracy?: number;
}

export interface PricePrediction {
  symbol: string;
  currentPrice: number;
  predictedPrice: number;
  confidence: number;
  timeframe: number; // days
  direction: 'up' | 'down' | 'sideways';
  volatility: number;
  support: number;
  resistance: number;
}

// ============================================================================
// RECOMMENDATION TYPES
// ============================================================================

export type RecommendationType = 'entry' | 'exit' | 'position_size' | 'risk_management' | 'portfolio_rebalance';

export type RecommendationAction = 'buy' | 'sell' | 'hold' | 'reduce' | 'increase' | 'close';

export interface TradeRecommendation {
  id: string;
  type: RecommendationType;
  ticker: string;
  action: RecommendationAction;
  confidence: number; // 0-1
  reasoning: string;
  expectedReturn: number;
  riskLevel: 'low' | 'medium' | 'high';
  timeHorizon: 'short' | 'medium' | 'long';
  urgency: 'low' | 'medium' | 'high';
  alternatives: TradeRecommendation[];
  createdAt: Date;
  expiresAt: Date;
}

// ============================================================================
// MARKET CONDITIONS TYPES
// ============================================================================

export interface MarketConditions {
  volatility: number; // Historical volatility
  volume: number; // Relative volume
  trend: 'bullish' | 'bearish' | 'sideways';
  sector: string;
  marketCap: 'small' | 'mid' | 'large';
  timeOfDay: 'pre_market' | 'market_open' | 'lunch' | 'market_close' | 'after_hours';
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
  economicEvents: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  vix: number; // Volatility index
  sp500Return: number; // S&P 500 return for the period
}

// ============================================================================
// TECHNICAL INDICATORS TYPES
// ============================================================================

export interface TechnicalIndicators {
  rsi: number; // Relative Strength Index
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    width: number;
    position: number; // 0-1, where 0 is at lower band, 1 is at upper band
  };
  movingAverages: {
    sma20: number;
    sma50: number;
    sma200: number;
    ema12: number;
    ema26: number;
  };
  volume: {
    current: number;
    average: number;
    ratio: number; // current / average
  };
  support: number;
  resistance: number;
}

// ============================================================================
// ML MODEL TYPES
// ============================================================================

export type ModelType = 'pattern_classification' | 'prediction' | 'clustering' | 'regression' | 'classification';

export interface MLModel {
  id: string;
  name: string;
  version: string;
  type: ModelType;
  accuracy: number; // 0-1
  lastTrained: Date;
  isActive: boolean;
  parameters: Record<string, any>;
  features: string[];
  performance: {
    precision: number;
    recall: number;
    f1Score: number;
    auc: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// FEATURE ENGINEERING TYPES
// ============================================================================

export interface TradeFeatures {
  // Basic trade features
  ticker: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  isShort: boolean;
  
  // Calculated features
  return?: number;
  returnPercentage?: number;
  holdingPeriod: number; // days
  
  // Technical features
  technicalIndicators: TechnicalIndicators;
  
  // Market features
  marketConditions: MarketConditions;
  
  // Behavioral features
  behavioral: {
    tradeNumber: number; // nth trade of the day
    consecutiveWins: number;
    consecutiveLosses: number;
    dailyPnL: number;
    weeklyPnL: number;
    positionSize: number; // relative to portfolio
  };
  
  // Temporal features
  temporal: {
    hour: number;
    dayOfWeek: number;
    month: number;
    quarter: number;
    isMonthEnd: boolean;
    isQuarterEnd: boolean;
    isYearEnd: boolean;
  };
}

// ============================================================================
// PERFORMANCE ANALYTICS TYPES
// ============================================================================

export interface AdvancedPerformanceMetrics {
  // Risk-adjusted returns
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  informationRatio: number;
  
  // Risk metrics
  volatility: number;
  maxDrawdown: number;
  var95: number; // Value at Risk (95%)
  cvar95: number; // Conditional Value at Risk (95%)
  
  // Performance metrics
  totalReturn: number;
  annualizedReturn: number;
  winRate: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  
  // Factor analysis
  alpha: number;
  beta: number;
  correlation: number;
  
  // Behavioral metrics
  behavioral: BehavioralInsight;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface PatternAnalysisRequest {
  trades: number[];
  patternTypes?: PatternType[];
  minConfidence?: number;
  timeframe?: 'short' | 'medium' | 'long';
}

export interface InsightGenerationRequest {
  tradeId: number;
  insightTypes?: InsightType[];
  includeBehavioral?: boolean;
  includeTechnical?: boolean;
}

export interface PredictionRequest {
  symbol: string;
  predictionType: PredictionType;
  timeframe: 'short' | 'medium' | 'long';
  features?: Record<string, number>;
}

export interface RecommendationRequest {
  portfolio: {
    ticker: string;
    quantity: number;
    entryPrice: number;
  }[];
  availableCapital: number;
  riskTolerance: 'low' | 'medium' | 'high';
  timeHorizon: 'short' | 'medium' | 'long';
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface AIDashboardData {
  patterns: TradingPattern[];
  insights: TradeInsight[];
  recommendations: TradeRecommendation[];
  predictions: TradePrediction[];
  performance: AdvancedPerformanceMetrics;
  behavioral: BehavioralInsight;
  marketConditions: MarketConditions;
  recentActivity: {
    type: 'pattern' | 'insight' | 'recommendation' | 'prediction';
    title: string;
    description: string;
    timestamp: Date;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'very_high';

export interface ConfidenceScore {
  value: number; // 0-1
  level: ConfidenceLevel;
  factors: {
    factor: string;
    weight: number;
    contribution: number;
  }[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
} 