'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Target,
  Activity
} from 'lucide-react';

interface Trade {
  id: number;
  ticker: string;
  entryDate: string;
  entryPrice: number;
  exitDate?: string;
  exitPrice?: number;
  quantity: number;
  fees: number;
  notes?: string;
  tags?: string[];
  isShort: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RiskMetrics {
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
  totalPnL: number;
  maxDrawdown: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  maxConsecutiveLosses: number;
  maxConsecutiveWins: number;
  currentDrawdown: number;
  riskOfRuin: number;
  kellyCriterion: number;
  expectedValue: number;
  volatility: number;
}

export default function RiskPage() {
  const [, setTrades] = useState<Trade[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      const response = await fetch('/api/trades');
      if (!response.ok) throw new Error('Failed to fetch trades');
      const data = await response.json();
      setTrades(data.trades || []);
      calculateRiskMetrics(data.trades || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trades');
    } finally {
      setLoading(false);
    }
  };

  const calculateRiskMetrics = (trades: Trade[]) => {
    const closedTrades = trades.filter(trade => trade.exitDate && trade.exitPrice);
    const openTrades = trades.filter(trade => !trade.exitDate);

    if (closedTrades.length === 0) {
      setRiskMetrics(null);
      return;
    }

    // Calculate individual trade returns
    const returns = closedTrades.map(trade => {
      const grossPnL = trade.isShort 
        ? (trade.entryPrice - trade.exitPrice!) * trade.quantity
        : (trade.exitPrice! - trade.entryPrice) * trade.quantity;
      return grossPnL - trade.fees;
    });

    const totalPnL = returns.reduce((sum, ret) => sum + ret, 0);
    const winningTrades = returns.filter(ret => ret > 0);
    const losingTrades = returns.filter(ret => ret < 0);
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
    const averageWin = winningTrades.length > 0 ? winningTrades.reduce((sum, ret) => sum + ret, 0) / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, ret) => sum + ret, 0) / losingTrades.length) : 0;

    // Calculate drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let currentDrawdown = 0;
    let runningTotal = 0;

    returns.forEach(ret => {
      runningTotal += ret;
      if (runningTotal > peak) {
        peak = runningTotal;
      }
      const drawdown = (peak - runningTotal) / peak * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
      currentDrawdown = (peak - runningTotal) / peak * 100;
    });

    // Calculate consecutive wins/losses
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let currentWins = 0;
    let currentLosses = 0;

    returns.forEach(ret => {
      if (ret > 0) {
        currentWins++;
        currentLosses = 0;
        if (currentWins > maxConsecutiveWins) {
          maxConsecutiveWins = currentWins;
        }
      } else {
        currentLosses++;
        currentWins = 0;
        if (currentLosses > maxConsecutiveLosses) {
          maxConsecutiveLosses = currentLosses;
        }
      }
    });

    // Calculate volatility (standard deviation of returns)
    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);

    // Calculate Sharpe Ratio (assuming risk-free rate of 0 for simplicity)
    const sharpeRatio = volatility > 0 ? meanReturn / volatility : 0;

    // Calculate Sortino Ratio (downside deviation)
    const downsideReturns = returns.filter(ret => ret < 0);
    const downsideVariance = downsideReturns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
    const downsideDeviation = Math.sqrt(downsideVariance);
    const sortinoRatio = downsideDeviation > 0 ? meanReturn / downsideDeviation : 0;

    // Calculate Calmar Ratio
    const calmarRatio = maxDrawdown > 0 ? (totalPnL / closedTrades.length) / (maxDrawdown / 100) : 0;

    // Calculate Profit Factor
    const grossProfit = winningTrades.reduce((sum, ret) => sum + ret, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, ret) => sum + ret, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

    // Calculate Kelly Criterion
    const kellyCriterion = winRate > 0 && averageLoss > 0 
      ? (winRate * averageWin - (100 - winRate) * averageLoss) / averageWin 
      : 0;

    // Calculate Expected Value
    const expectedValue = (winRate / 100) * averageWin - ((100 - winRate) / 100) * averageLoss;

    // Calculate Risk of Ruin (simplified)
    const riskOfRuin = losingTrades.length > 0 && winningTrades.length > 0
      ? Math.pow(losingTrades.length / closedTrades.length, maxConsecutiveLosses)
      : 0;

    setRiskMetrics({
      totalTrades: trades.length,
      closedTrades: closedTrades.length,
      openTrades: openTrades.length,
      totalPnL,
      maxDrawdown,
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      winRate,
      averageWin,
      averageLoss,
      profitFactor,
      maxConsecutiveLosses,
      maxConsecutiveWins,
      currentDrawdown,
      riskOfRuin: riskOfRuin * 100,
      kellyCriterion: kellyCriterion * 100,
      expectedValue,
      volatility
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatNumber = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals);
  };

  const getRiskLevel = (value: number, thresholds: { low: number; medium: number }) => {
    if (value <= thresholds.low) return { level: 'Low', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/20' };
    if (value <= thresholds.medium) return { level: 'Medium', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/20' };
    return { level: 'High', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/20' };
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-xl w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
        <p className="text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  if (!riskMetrics) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Risk Analysis</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Comprehensive risk metrics and analysis
          </p>
        </div>
        
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">No closed trades available for risk analysis</p>
        </div>
      </div>
    );
  }

  const drawdownRisk = getRiskLevel(riskMetrics.maxDrawdown, { low: 10, medium: 20 });
  const sharpeRisk = getRiskLevel(riskMetrics.sharpeRatio, { low: 1, medium: 0.5 });
  const profitFactorRisk = getRiskLevel(riskMetrics.profitFactor, { low: 1.5, medium: 1.2 });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Risk Analysis</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Comprehensive risk metrics and analysis
        </p>
      </div>

      {/* Key Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Max Drawdown</h3>
          <p className={`text-2xl font-bold ${drawdownRisk.color}`}>
            {formatPercentage(riskMetrics.maxDrawdown)}
          </p>
          <span className={`badge ${drawdownRisk.bg} ${drawdownRisk.color}`}>
            {drawdownRisk.level} Risk
          </span>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Sharpe Ratio</h3>
          <p className={`text-2xl font-bold ${sharpeRisk.color}`}>
            {formatNumber(riskMetrics.sharpeRatio)}
          </p>
          <span className={`badge ${sharpeRisk.bg} ${sharpeRisk.color}`}>
            {sharpeRisk.level} Risk
          </span>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Profit Factor</h3>
          <p className={`text-2xl font-bold ${profitFactorRisk.color}`}>
            {formatNumber(riskMetrics.profitFactor)}
          </p>
          <span className={`badge ${profitFactorRisk.bg} ${profitFactorRisk.color}`}>
            {profitFactorRisk.level} Risk
          </span>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Win Rate</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatPercentage(riskMetrics.winRate)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {riskMetrics.closedTrades} closed trades
          </p>
        </div>
      </div>

      {/* Detailed Risk Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Metrics</h3>
          </div>
          <div className="card-body space-y-4">
            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total P&L</span>
              <span className={`font-medium ${riskMetrics.totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(riskMetrics.totalPnL)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Average Win</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {formatCurrency(riskMetrics.averageWin)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Average Loss</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {formatCurrency(riskMetrics.averageLoss)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Expected Value</span>
              <span className={`font-medium ${riskMetrics.expectedValue >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(riskMetrics.expectedValue)}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Risk Metrics</h3>
          </div>
          <div className="card-body space-y-4">
            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sortino Ratio</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatNumber(riskMetrics.sortinoRatio)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Calmar Ratio</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatNumber(riskMetrics.calmarRatio)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Kelly Criterion</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatPercentage(riskMetrics.kellyCriterion)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">Risk of Ruin</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatPercentage(riskMetrics.riskOfRuin)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Consecutive Trades */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Consecutive Trades</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Max Consecutive Wins</span>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {riskMetrics.maxConsecutiveWins}
              </p>
            </div>
            
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">Max Consecutive Losses</span>
              </div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {riskMetrics.maxConsecutiveLosses}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 