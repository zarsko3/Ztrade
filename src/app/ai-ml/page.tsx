'use client';

import { useState, useEffect } from 'react';
import { MLModel, MLPrediction, TradingStrategy, BacktestResult } from '@/services/ai/machine-learning';

interface ModelsData {
  models: MLModel[];
  summary: {
    totalModels: number;
    readyModels: number;
    trainingModels: number;
    averageAccuracy: number;
  };
}

interface StrategiesData {
  strategies: TradingStrategy[];
  summary: {
    totalStrategies: number;
    activeStrategies: number;
    averageReturn: number;
    bestStrategy: string;
  };
}

export default function AIMLPage() {
  const [modelsData, setModelsData] = useState<ModelsData | null>(null);
  const [strategiesData, setStrategiesData] = useState<StrategiesData | null>(null);
  const [selectedModel, setSelectedModel] = useState<MLModel | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<TradingStrategy | null>(null);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [prediction, setPrediction] = useState<MLPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'models' | 'strategies' | 'backtesting' | 'predictions'>('models');

  // Form states
  const [newModelForm, setNewModelForm] = useState({
    modelType: 'regression' as 'regression' | 'classification' | 'ensemble',
    features: ['rsi', 'macd', 'volume_ratio'],
    hyperparameters: {}
  });

  const [newStrategyForm, setNewStrategyForm] = useState({
    name: '',
    description: '',
    type: 'momentum' as 'momentum' | 'mean_reversion' | 'breakout' | 'ml_based' | 'hybrid',
    parameters: {}
  });

  const [predictionForm, setPredictionForm] = useState({
    symbol: 'AAPL',
    modelId: ''
  });

  const [backtestForm, setBacktestForm] = useState({
    strategyId: '',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    symbols: 'AAPL,GOOGL,MSFT'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [modelsResponse, strategiesResponse] = await Promise.all([
        fetch('/api/ai/ml/models'),
        fetch('/api/ai/ml/strategies')
      ]);

      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        setModelsData(modelsData.data);
      }

      if (strategiesResponse.ok) {
        const strategiesData = await strategiesResponse.json();
        setStrategiesData(strategiesData.data);
      }
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const trainNewModel = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/ml/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'train',
          ...newModelForm
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Model training started:', result);
        await fetchData(); // Refresh data
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to train model');
      }
    } catch (err) {
      setError('Failed to train model');
      console.error('Error training model:', err);
    } finally {
      setLoading(false);
    }
  };

  const createNewStrategy = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/ml/strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          ...newStrategyForm
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Strategy created:', result);
        await fetchData(); // Refresh data
        setNewStrategyForm({ name: '', description: '', type: 'momentum', parameters: {} });
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to create strategy');
      }
    } catch (err) {
      setError('Failed to create strategy');
      console.error('Error creating strategy:', err);
    } finally {
      setLoading(false);
    }
  };

  const generatePrediction = async () => {
    if (!predictionForm.modelId) {
      setError('Please select a model');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/ml/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'predict',
          ...predictionForm
        })
      });

      if (response.ok) {
        const result = await response.json();
        setPrediction(result.data.prediction);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to generate prediction');
      }
    } catch (err) {
      setError('Failed to generate prediction');
      console.error('Error generating prediction:', err);
    } finally {
      setLoading(false);
    }
  };

  const runBacktest = async () => {
    if (!backtestForm.strategyId) {
      setError('Please select a strategy');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/ml/strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'backtest',
          ...backtestForm
        })
      });

      if (response.ok) {
        const result = await response.json();
        setBacktestResult(result.data.backtestResult);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to run backtest');
      }
    } catch (err) {
      setError('Failed to run backtest');
      console.error('Error running backtest:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(2)}%`;
  const formatNumber = (value: number) => value.toFixed(2);
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-green-600';
      case 'training': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      case 'active': return 'text-green-600';
      case 'inactive': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI Machine Learning & Trading Strategies
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Advanced machine learning models, automated trading strategies, and comprehensive backtesting
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-8">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'models', label: 'ML Models' },
                { id: 'strategies', label: 'Trading Strategies' },
                { id: 'backtesting', label: 'Backtesting' },
                { id: 'predictions', label: 'Predictions' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Processing...</p>
          </div>
        )}

        {/* ML Models Tab */}
        {activeTab === 'models' && (
          <div className="space-y-8">
            {/* Models Summary */}
            {modelsData && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Total Models</h3>
                  <p className="text-3xl font-bold text-blue-600">{modelsData.summary.totalModels}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ready Models</h3>
                  <p className="text-3xl font-bold text-green-600">{modelsData.summary.readyModels}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Training</h3>
                  <p className="text-3xl font-bold text-yellow-600">{modelsData.summary.trainingModels}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Avg Accuracy</h3>
                  <p className="text-3xl font-bold text-purple-600">{formatPercentage(modelsData.summary.averageAccuracy)}</p>
                </div>
              </div>
            )}

            {/* Train New Model */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Train New Model</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Model Type
                  </label>
                  <select
                    value={newModelForm.modelType}
                    onChange={(e) => setNewModelForm({ ...newModelForm, modelType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="regression">Regression</option>
                    <option value="classification">Classification</option>
                    <option value="ensemble">Ensemble</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Features
                  </label>
                  <input
                    type="text"
                    value={newModelForm.features.join(', ')}
                    onChange={(e) => setNewModelForm({ ...newModelForm, features: e.target.value.split(', ').filter(f => f) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="rsi, macd, volume_ratio"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={trainNewModel}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    Train Model
                  </button>
                </div>
              </div>
            </div>

            {/* Models List */}
            {modelsData && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trained Models</h3>
                <div className="space-y-4">
                  {modelsData.models.map((model) => (
                    <div
                      key={model.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => setSelectedModel(model)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{model.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Type: {model.type}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Version: {model.version}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(model.status)}`}>
                            {model.status}
                          </span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Accuracy: {formatPercentage(model.accuracy)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trading Strategies Tab */}
        {activeTab === 'strategies' && (
          <div className="space-y-8">
            {/* Strategies Summary */}
            {strategiesData && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Total Strategies</h3>
                  <p className="text-3xl font-bold text-blue-600">{strategiesData.summary.totalStrategies}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Active</h3>
                  <p className="text-3xl font-bold text-green-600">{strategiesData.summary.activeStrategies}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Avg Return</h3>
                  <p className="text-3xl font-bold text-purple-600">{formatPercentage(strategiesData.summary.averageReturn)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Best Strategy</h3>
                  <p className="text-lg font-bold text-green-600">{strategiesData.summary.bestStrategy}</p>
                </div>
              </div>
            )}

            {/* Create New Strategy */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Strategy</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Strategy Name
                  </label>
                  <input
                    type="text"
                    value={newStrategyForm.name}
                    onChange={(e) => setNewStrategyForm({ ...newStrategyForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="My Trading Strategy"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Strategy Type
                  </label>
                  <select
                    value={newStrategyForm.type}
                    onChange={(e) => setNewStrategyForm({ ...newStrategyForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="momentum">Momentum</option>
                    <option value="mean_reversion">Mean Reversion</option>
                    <option value="breakout">Breakout</option>
                    <option value="ml_based">ML-Based</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newStrategyForm.description}
                    onChange={(e) => setNewStrategyForm({ ...newStrategyForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Describe your trading strategy..."
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    onClick={createNewStrategy}
                    disabled={loading || !newStrategyForm.name || !newStrategyForm.description}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    Create Strategy
                  </button>
                </div>
              </div>
            </div>

            {/* Strategies List */}
            {strategiesData && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trading Strategies</h3>
                <div className="space-y-4">
                  {strategiesData.strategies.map((strategy) => (
                    <div
                      key={strategy.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => setSelectedStrategy(strategy)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{strategy.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{strategy.description}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Type: {strategy.type.replace('_', ' ')}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(strategy.status)}`}>
                            {strategy.status}
                          </span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Return: {formatPercentage(strategy.performance.totalReturn)}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Sharpe: {formatNumber(strategy.performance.sharpeRatio)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Backtesting Tab */}
        {activeTab === 'backtesting' && (
          <div className="space-y-8">
            {/* Backtest Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Run Backtest</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Strategy
                  </label>
                  <select
                    value={backtestForm.strategyId}
                    onChange={(e) => setBacktestForm({ ...backtestForm, strategyId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Strategy</option>
                    {strategiesData?.strategies.map((strategy) => (
                      <option key={strategy.id} value={strategy.id}>{strategy.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={backtestForm.startDate}
                    onChange={(e) => setBacktestForm({ ...backtestForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={backtestForm.endDate}
                    onChange={(e) => setBacktestForm({ ...backtestForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={runBacktest}
                    disabled={loading || !backtestForm.strategyId}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    Run Backtest
                  </button>
                </div>
              </div>
            </div>

            {/* Backtest Results */}
            {backtestResult && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Backtest Results</h3>
                
                {/* Summary Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{backtestResult.totalTrades}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Trades</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{formatPercentage(backtestResult.winRate)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Win Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{formatPercentage(backtestResult.totalReturn)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Return</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{formatNumber(backtestResult.sharpeRatio)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Sharpe Ratio</p>
                  </div>
                </div>

                {/* Detailed Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Performance Metrics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Max Drawdown:</span>
                        <span className="font-medium">{formatPercentage(backtestResult.maxDrawdown)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Profit Factor:</span>
                        <span className="font-medium">{formatNumber(backtestResult.profitFactor)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Average Trade:</span>
                        <span className="font-medium">{formatPercentage(backtestResult.averageTrade)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Best Trade:</span>
                        <span className="font-medium text-green-600">{formatPercentage(backtestResult.bestTrade)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Worst Trade:</span>
                        <span className="font-medium text-red-600">{formatPercentage(backtestResult.worstTrade)}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Trade Breakdown</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Winning Trades:</span>
                        <span className="font-medium text-green-600">{backtestResult.winningTrades}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Losing Trades:</span>
                        <span className="font-medium text-red-600">{backtestResult.losingTrades}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Period:</span>
                        <span className="font-medium">{backtestResult.startDate} to {backtestResult.endDate}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sample Trades */}
                {backtestResult.trades.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Sample Trades</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Symbol</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Signal</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">P&L</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Confidence</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {backtestResult.trades.slice(0, 5).map((trade, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{trade.symbol}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">{trade.signal}</td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${trade.pnl > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(trade.pnl)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatPercentage(trade.confidence / 100)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Predictions Tab */}
        {activeTab === 'predictions' && (
          <div className="space-y-8">
            {/* Prediction Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Generate ML Prediction</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Symbol
                  </label>
                  <input
                    type="text"
                    value={predictionForm.symbol}
                    onChange={(e) => setPredictionForm({ ...predictionForm, symbol: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="AAPL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Model
                  </label>
                  <select
                    value={predictionForm.modelId}
                    onChange={(e) => setPredictionForm({ ...predictionForm, modelId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Model</option>
                    {modelsData?.models.filter(m => m.status === 'ready').map((model) => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={generatePrediction}
                    disabled={loading || !predictionForm.modelId}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    Generate Prediction
                  </button>
                </div>
              </div>
            </div>

            {/* Prediction Results */}
            {prediction && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">ML Prediction Results</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Prediction Summary</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Symbol:</span>
                        <span className="font-medium">{prediction.symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Predicted Change:</span>
                        <span className={`font-medium ${getDirectionColor(prediction.direction)}`}>
                          {formatPercentage(prediction.prediction / 100)} ({prediction.direction.toUpperCase()})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                        <span className="font-medium">{formatPercentage(prediction.confidence / 100)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Model:</span>
                        <span className="font-medium">{prediction.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Version:</span>
                        <span className="font-medium">{prediction.version}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Feature Importance</h4>
                    <div className="space-y-2">
                      {prediction.features.slice(0, 5).map((feature, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {feature.name.replace('_', ' ')}:
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{formatNumber(feature.value)}</span>
                            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${feature.importance * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 