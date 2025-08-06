'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdvancedPerformanceMetrics } from '@/services/ai/performance-analytics';
import { TradingInsight } from '@/app/api/ai/insights/route';

interface BehavioralAnalysis {
  emotionalState: 'confident' | 'fearful' | 'greedy' | 'neutral';
  decisionFatigue: number;
  tradingFrequency: number;
  positionSizingConsistency: number;
  riskTolerance: number;
  patternAdherence: number;
  tradingStyle: 'conservative' | 'moderate' | 'aggressive';
  timeOfDayPreference: string;
  dayOfWeekPreference: string;
  marketConditionAdaptation: number;
  stressIndicators: {
    overtrading: boolean;
    revengeTrading: boolean;
    fomoTrading: boolean;
    analysisParalysis: boolean;
  };
  improvementAreas: string[];
  strengths: string[];
}

interface InsightSummary {
  totalInsights: number;
  highPriorityInsights: number;
  positiveInsights: number;
  negativeInsights: number;
  insightTypes: Record<string, number>;
  averageConfidence: number;
}

function AIDashboardPageContent() {
  const [performanceMetrics, setPerformanceMetrics] = useState<AdvancedPerformanceMetrics | null>(null);
  const [behavioralAnalysis, setBehavioralAnalysis] = useState<BehavioralAnalysis | null>(null);
  const [insights, setInsights] = useState<TradingInsight[]>([]);
  const [insightSummary, setInsightSummary] = useState<InsightSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    period: 'all',
    includeInsights: true
  });

  useEffect(() => {
    fetchAIData();
  }, [filters]);

  const fetchAIData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching AI dashboard data...');

      // Fetch advanced performance metrics
      const performanceResponse = await fetch(`/api/ai/performance/advanced?period=${filters.period}&includeInsights=${filters.includeInsights}`);
      console.log('Performance response status:', performanceResponse.status);
      
      if (!performanceResponse.ok) {
        throw new Error(`Performance API failed: ${performanceResponse.status} ${performanceResponse.statusText}`);
      }
      
      const performanceData = await performanceResponse.json();
      console.log('Performance data:', performanceData);

      // Fetch behavioral analysis
      const behavioralResponse = await fetch(`/api/ai/performance/behavioral?period=${filters.period}`);
      console.log('Behavioral response status:', behavioralResponse.status);
      
      if (!behavioralResponse.ok) {
        throw new Error(`Behavioral API failed: ${behavioralResponse.status} ${behavioralResponse.statusText}`);
      }
      
      const behavioralData = await behavioralResponse.json();
      console.log('Behavioral data:', behavioralData);

      // Fetch AI insights
      const insightsResponse = await fetch(`/api/ai/insights?period=${filters.period}&limit=10`);
      console.log('Insights response status:', insightsResponse.status);
      
      if (!insightsResponse.ok) {
        throw new Error(`Insights API failed: ${insightsResponse.status} ${insightsResponse.statusText}`);
      }
      
      const insightsData = await insightsResponse.json();
      console.log('Insights data:', insightsData);

      if (performanceData.status === 'success' && behavioralData.status === 'success' && insightsData.status === 'success') {
        setPerformanceMetrics(performanceData.data.metrics);
        setBehavioralAnalysis(behavioralData.data.behavioralAnalysis);
        setInsights(insightsData.data.insights);
        setInsightSummary(insightsData.data.summary);
        console.log('AI dashboard data loaded successfully');
      } else {
        console.error('API responses:', { performanceData, behavioralData, insightsData });
        throw new Error('One or more API responses did not return success status');
      }
    } catch (err) {
      console.error('Error fetching AI dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch AI data');
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-green-600 dark:text-green-400';
      case 'negative': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getEmotionalStateColor = (state: string) => {
    switch (state) {
      case 'confident': return 'text-green-600 dark:text-green-400';
      case 'fearful': return 'text-red-600 dark:text-red-400';
      case 'greedy': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="text-red-600 dark:text-red-400">
            <div className="font-medium">Error loading AI dashboard</div>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Trading Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Advanced performance analytics, behavioral insights, and AI-powered recommendations
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Period
            </label>
            <select
              value={filters.period}
              onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
              className="input"
            >
              <option value="all">All Time</option>
              <option value="1m">Last Month</option>
              <option value="3m">Last 3 Months</option>
              <option value="6m">Last 6 Months</option>
              <option value="1y">Last Year</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.includeInsights}
                onChange={(e) => setFilters(prev => ({ ...prev, includeInsights: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Include AI Insights</span>
            </label>
          </div>
        </div>
      </div>

      {performanceMetrics && (
        <>
          {/* Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Basic Metrics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Trades</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{performanceMetrics.totalTrades}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Win Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatPercentage(performanceMetrics.winRate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total P&L</p>
                  <p className={`text-2xl font-bold ${performanceMetrics.totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(performanceMetrics.totalPnL)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Avg Return</p>
                  <p className={`text-2xl font-bold ${performanceMetrics.averageReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatPercentage(performanceMetrics.averageReturn)}
                  </p>
                </div>
              </div>
            </div>

            {/* Risk Metrics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Risk Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sharpe Ratio</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{performanceMetrics.sharpeRatio.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Max Drawdown</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatPercentage(performanceMetrics.maxDrawdownPercentage)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Volatility</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatPercentage(performanceMetrics.volatility)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sortino Ratio</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{performanceMetrics.sortinoRatio.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Factor Analysis */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Factor Analysis</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Market Timing</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{performanceMetrics.factorAnalysis.marketTiming.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Stock Selection</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{performanceMetrics.factorAnalysis.stockSelection.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Sector Allocation</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{performanceMetrics.factorAnalysis.sectorAllocation.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Size Factor</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{performanceMetrics.factorAnalysis.sizeFactor.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Momentum Factor</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{performanceMetrics.factorAnalysis.momentumFactor.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {behavioralAnalysis && (
        <>
          {/* Behavioral Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Trading Psychology */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trading Psychology</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Emotional State</p>
                  <p className={`text-lg font-semibold ${getEmotionalStateColor(behavioralAnalysis.emotionalState)}`}>
                    {behavioralAnalysis.emotionalState.charAt(0).toUpperCase() + behavioralAnalysis.emotionalState.slice(1)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Decision Fatigue</p>
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${behavioralAnalysis.decisionFatigue}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{behavioralAnalysis.decisionFatigue.toFixed(0)}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Trading Style</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">{behavioralAnalysis.tradingStyle}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Risk Tolerance</p>
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${behavioralAnalysis.riskTolerance * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{(behavioralAnalysis.riskTolerance * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trading Patterns */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trading Patterns</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Trading Frequency</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{behavioralAnalysis.tradingFrequency.toFixed(1)} trades/month</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Position Sizing Consistency</p>
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${behavioralAnalysis.positionSizingConsistency * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{(behavioralAnalysis.positionSizingConsistency * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Best Trading Time</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{behavioralAnalysis.timeOfDayPreference}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Best Trading Day</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{behavioralAnalysis.dayOfWeekPreference}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stress Indicators */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Stress Indicators</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${behavioralAnalysis.stressIndicators.overtrading ? 'bg-red-100 dark:bg-red-900' : 'bg-green-100 dark:bg-green-900'}`}>
                  <svg className={`w-6 h-6 ${behavioralAnalysis.stressIndicators.overtrading ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Overtrading</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{behavioralAnalysis.stressIndicators.overtrading ? 'Detected' : 'None'}</p>
              </div>
              <div className="text-center">
                <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${behavioralAnalysis.stressIndicators.revengeTrading ? 'bg-red-100 dark:bg-red-900' : 'bg-green-100 dark:bg-green-900'}`}>
                  <svg className={`w-6 h-6 ${behavioralAnalysis.stressIndicators.revengeTrading ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Revenge Trading</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{behavioralAnalysis.stressIndicators.revengeTrading ? 'Detected' : 'None'}</p>
              </div>
              <div className="text-center">
                <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${behavioralAnalysis.stressIndicators.fomoTrading ? 'bg-red-100 dark:bg-red-900' : 'bg-green-100 dark:bg-green-900'}`}>
                  <svg className={`w-6 h-6 ${behavioralAnalysis.stressIndicators.fomoTrading ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">FOMO Trading</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{behavioralAnalysis.stressIndicators.fomoTrading ? 'Detected' : 'None'}</p>
              </div>
              <div className="text-center">
                <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${behavioralAnalysis.stressIndicators.analysisParalysis ? 'bg-red-100 dark:bg-red-900' : 'bg-green-100 dark:bg-green-900'}`}>
                  <svg className={`w-6 h-6 ${behavioralAnalysis.stressIndicators.analysisParalysis ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Analysis Paralysis</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{behavioralAnalysis.stressIndicators.analysisParalysis ? 'Detected' : 'None'}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Insights & Recommendations</h3>
            {insightSummary && (
              <div className="mt-2 flex space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <span>{insightSummary.totalInsights} insights</span>
                <span>{insightSummary.highPriorityInsights} high priority</span>
                <span>{insightSummary.positiveInsights} positive</span>
                <span>{insightSummary.negativeInsights} negative</span>
              </div>
            )}
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {insights.map((insight) => (
              <div key={insight.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(insight.priority)}`}>
                        {insight.priority.toUpperCase()}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`}>
                        {insight.type.toUpperCase()}
                      </span>
                      <h4 className={`text-lg font-semibold ${getImpactColor(insight.impact)}`}>{insight.title}</h4>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">{insight.description}</p>
                    {insight.recommendation && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Recommendation:</strong> {insight.recommendation}
                        </p>
                      </div>
                    )}
                    {insight.actionItems && insight.actionItems.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Action Items:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          {insight.actionItems.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Confidence: {(insight.confidence * 100).toFixed(0)}% • {new Date(insight.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AIDashboardPage() {
  return (
    <ProtectedRoute>
      <AIDashboardPageContent />
    </ProtectedRoute>
  );
}