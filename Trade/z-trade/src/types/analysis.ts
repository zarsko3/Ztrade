// src/types/analysis.ts

export interface TradeInsight {
  type: 'performance' | 'pattern' | 'risk' | 'opportunity';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  actionable: boolean;
  action?: string;
}

export interface TradeAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  patterns: string[];
  suggestions: string[];
  metrics: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    averageWin: number;
    averageLoss: number;
    profitFactor: number;
    maxDrawdown: number;
    sharpeRatio: number;
  };
}

export interface AnalysisRequest {
  timeframe?: 'all' | 'week' | 'month' | 'quarter' | 'year';
  ticker?: string;
} 