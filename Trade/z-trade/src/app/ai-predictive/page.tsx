'use client';

import { useState, useEffect } from 'react';
import { MarketSentiment, MarketSignal, VolatilityForecast, TrendAnalysis, MarketCondition } from '@/services/ai/market-analysis';
import { PricePrediction, TradingSignal, PortfolioOptimization } from '@/services/ai/predictive-modeling';

interface MarketAnalysisData {
  symbol: string;
  timestamp: string;
  sentiment: MarketSentiment;
  volatility: VolatilityForecast;
  trend: TrendAnalysis;
  marketCondition: MarketCondition;
  summary: {
    overallSentiment: string;
    keySignals: string[];
    riskLevel: string;
    tradingRecommendation: string;
  };
}

interface PredictiveAnalysisData {
  symbol: string;
  timestamp: string;
  pricePrediction: PricePrediction;
  tradingSignals: TradingSignal[];
  portfolioOptimization?: PortfolioOptimization;
  summary: {
    overallOutlook: string;
    keySignals: string[];
    riskLevel: string;
    recommendedAction: string;
  };
}

export default function AIPredictivePage() {
  const [symbol, setSymbol] = useState('AAPL');
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysisData | null>(null);
  const [predictiveAnalysis, setPredictiveAnalysis] = useState<PredictiveAnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState<'market' | 'predictive' | 'both'>('both');

  useEffect(() => {
    if (symbol) {
      fetchAnalysis();
    }
  }, [symbol, analysisType]);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const promises = [];

      if (analysisType === 'market' || analysisType === 'both') {
        promises.push(
          fetch(`/api/ai/market/analysis?symbol=${symbol}&type=all`)
            .then(res => res.json())
            .then(data => data.data)
        );
      }

      if (analysisType === 'predictive' || analysisType === 'both') {
        promises.push(
          fetch(`/api/ai/predictive/signals?symbol=${symbol}&type=all`)
            .then(res => res.json())
            .then(data => data.data)
        );
      }

      const results = await Promise.all(promises);

      if (analysisType === 'market' || analysisType === 'both') {
        setMarketAnalysis(results[0]);
      }

      if (analysisType === 'predictive' || analysisType === 'both') {
        setPredictiveAnalysis(results[analysisType === 'both' ? 1 : 0]);
      }
    } catch (err) {
      setError('Failed to fetch analysis data');
      console.error('Error fetching analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatNumber = (value: number) => value.toFixed(2);
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'bullish': return 'text-green-600';
      case 'bearish': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal.toLowerCase()) {
      case 'buy': return 'text-green-600';
      case 'sell': return 'text-red-600';
      case 'hold': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI Predictive Analysis
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time market analysis and predictive modeling for intelligent trading decisions
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Symbol
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter symbol (e.g., AAPL)"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Analysis Type
              </label>
              <select
                value={analysisType}
                onChange={(e) => setAnalysisType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="both">Market & Predictive</option>
                <option value="market">Market Analysis Only</option>
                <option value="predictive">Predictive Analysis Only</option>
              </select>
            </div>

            <button
              onClick={fetchAnalysis}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-8">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Analyzing market data...</p>
          </div>
        )}

        {/* Market Analysis */}
        {(analysisType === 'market' || analysisType === 'both') && marketAnalysis && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Market Analysis - {marketAnalysis.symbol}
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sentiment Analysis */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Market Sentiment
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Overall Sentiment:</span>
                    <span className={`font-semibold ${getSentimentColor(marketAnalysis.sentiment.overall)}`}>
                      {marketAnalysis.sentiment.overall.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                    <span className="font-semibold">{formatPercentage(marketAnalysis.sentiment.confidence)}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Technical:</span>
                      <span className={marketAnalysis.sentiment.factors.technical > 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatNumber(marketAnalysis.sentiment.factors.technical)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Momentum:</span>
                      <span className={marketAnalysis.sentiment.factors.momentum > 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatNumber(marketAnalysis.sentiment.factors.momentum)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Volatility Forecast */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Volatility Forecast
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Current Volatility:</span>
                    <span className="font-semibold">{formatPercentage(marketAnalysis.volatility.current * 100)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Trend:</span>
                    <span className={`font-semibold ${marketAnalysis.volatility.trend === 'increasing' ? 'text-red-600' : 'text-green-600'}`}>
                      {marketAnalysis.volatility.trend}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">1 Day:</span>
                      <span className="font-semibold">{formatPercentage(marketAnalysis.volatility.forecast['1d'] * 100)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">1 Week:</span>
                      <span className="font-semibold">{formatPercentage(marketAnalysis.volatility.forecast['1w'] * 100)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trend Analysis */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Trend Analysis
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Direction:</span>
                    <span className={`font-semibold ${getSentimentColor(marketAnalysis.trend.direction)}`}>
                      {marketAnalysis.trend.direction.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Strength:</span>
                    <span className="font-semibold">{formatPercentage(marketAnalysis.trend.strength)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Support:</span>
                    <span className="font-semibold">{formatCurrency(marketAnalysis.trend.support)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Resistance:</span>
                    <span className="font-semibold">{formatCurrency(marketAnalysis.trend.resistance)}</span>
                  </div>
                </div>
              </div>

              {/* Market Condition */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Market Condition
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="font-semibold capitalize">{marketAnalysis.marketCondition.type}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Risk Level:</span>
                    <span className={`font-semibold ${getRiskColor(marketAnalysis.marketCondition.riskLevel)}`}>
                      {marketAnalysis.marketCondition.riskLevel.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p className="mb-2">{marketAnalysis.marketCondition.description}</p>
                    <p className="font-medium">Strategy: {marketAnalysis.marketCondition.tradingStrategy}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Market Summary
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Overall Sentiment:</span>
                  <span className="font-semibold">{marketAnalysis.summary.overallSentiment}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Risk Level:</span>
                  <span className={`font-semibold ${getRiskColor(marketAnalysis.summary.riskLevel)}`}>
                    {marketAnalysis.summary.riskLevel.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Key Signals:</span>
                  <ul className="mt-2 space-y-1">
                    {marketAnalysis.summary.keySignals.map((signal, index) => (
                      <li key={index} className="text-sm text-gray-700 dark:text-gray-300">• {signal}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Recommendation:</span>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">{marketAnalysis.summary.tradingRecommendation}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Predictive Analysis */}
        {(analysisType === 'predictive' || analysisType === 'both') && predictiveAnalysis && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Predictive Analysis - {predictiveAnalysis.symbol}
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Price Predictions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Price Predictions
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Current Price:</span>
                    <span className="font-semibold">{formatCurrency(predictiveAnalysis.pricePrediction.currentPrice)}</span>
                  </div>
                  {Object.entries(predictiveAnalysis.pricePrediction.predictions).map(([timeframe, pred]: [string, any]) => (
                    <div key={timeframe} className="border-t pt-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 dark:text-gray-400 capitalize">{timeframe}:</span>
                        <span className="font-semibold">{formatCurrency(pred.price)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Direction:</span>
                        <span className={getSentimentColor(pred.direction)}>{pred.direction.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Confidence:</span>
                        <span className="font-medium">{formatPercentage(pred.confidence)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Probability Distribution */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Probability Distribution
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Bullish:</span>
                    <span className="font-semibold text-green-600">{formatPercentage(predictiveAnalysis.pricePrediction.probability.bullish)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Bearish:</span>
                    <span className="font-semibold text-red-600">{formatPercentage(predictiveAnalysis.pricePrediction.probability.bearish)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Sideways:</span>
                    <span className="font-semibold text-gray-600">{formatPercentage(predictiveAnalysis.pricePrediction.probability.sideways)}</span>
                  </div>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Risk Assessment
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Risk Level:</span>
                    <span className={`font-semibold ${getRiskColor(predictiveAnalysis.pricePrediction.riskAssessment.level)}`}>
                      {predictiveAnalysis.pricePrediction.riskAssessment.level.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Max Loss:</span>
                    <span className="font-semibold text-red-600">{formatPercentage(predictiveAnalysis.pricePrediction.riskAssessment.maxLoss)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Max Gain:</span>
                    <span className="font-semibold text-green-600">{formatPercentage(predictiveAnalysis.pricePrediction.riskAssessment.maxGain)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Risk Factors:</span>
                    <ul className="mt-2 space-y-1">
                      {predictiveAnalysis.pricePrediction.riskAssessment.factors.map((factor, index) => (
                        <li key={index} className="text-sm text-gray-700 dark:text-gray-300">• {factor}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Technical Indicators */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Technical Indicators
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">RSI:</span>
                    <span className="font-semibold">{formatNumber(predictiveAnalysis.pricePrediction.technicalIndicators.rsi)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">MACD:</span>
                    <span className="font-semibold">{formatNumber(predictiveAnalysis.pricePrediction.technicalIndicators.macd)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">MA Trend:</span>
                    <span className={`font-semibold ${getSentimentColor(predictiveAnalysis.pricePrediction.technicalIndicators.movingAverages.trend)}`}>
                      {predictiveAnalysis.pricePrediction.technicalIndicators.movingAverages.trend.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trading Signals */}
            {predictiveAnalysis.tradingSignals.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Trading Signals
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {predictiveAnalysis.tradingSignals.map((signal, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className={`font-semibold ${getSignalColor(signal.signal)}`}>
                          {signal.signal.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {signal.timeframe}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Strength:</span>
                          <span className="font-medium capitalize">{signal.strength}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                          <span className="font-medium">{formatPercentage(signal.confidence)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Entry:</span>
                          <span className="font-medium">{formatCurrency(signal.entryPrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Target:</span>
                          <span className="font-medium">{formatCurrency(signal.targetPrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Stop Loss:</span>
                          <span className="font-medium">{formatCurrency(signal.stopLoss)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">R/R Ratio:</span>
                          <span className="font-medium">{formatNumber(signal.riskRewardRatio)}</span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {signal.reasoning.join(', ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Predictive Summary
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Overall Outlook:</span>
                  <span className="font-semibold">{predictiveAnalysis.summary.overallOutlook}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Risk Level:</span>
                  <span className={`font-semibold ${getRiskColor(predictiveAnalysis.summary.riskLevel)}`}>
                    {predictiveAnalysis.summary.riskLevel.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Key Signals:</span>
                  <ul className="mt-2 space-y-1">
                    {predictiveAnalysis.summary.keySignals.map((signal, index) => (
                      <li key={index} className="text-sm text-gray-700 dark:text-gray-300">• {signal}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Recommended Action:</span>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">{predictiveAnalysis.summary.recommendedAction}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 