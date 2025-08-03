import { TradeWithCalculations } from '@/types/trade';

export interface MLFeature {
  name: string;
  value: number;
  importance: number;
  type: 'technical' | 'fundamental' | 'behavioral' | 'market';
}

export interface MLPrediction {
  symbol: string;
  timestamp: string;
  prediction: number; // Predicted price change percentage
  confidence: number; // 0-100
  direction: 'up' | 'down' | 'sideways';
  features: MLFeature[];
  model: string;
  version: string;
}

export interface MLModel {
  id: string;
  name: string;
  type: 'regression' | 'classification' | 'ensemble';
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingDate: string;
  features: string[];
  hyperparameters: Record<string, any>;
  status: 'training' | 'ready' | 'failed';
}

export interface BacktestResult {
  modelId: string;
  startDate: string;
  endDate: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  profitFactor: number;
  averageTrade: number;
  bestTrade: number;
  worstTrade: number;
  trades: BacktestTrade[];
}

export interface BacktestTrade {
  symbol: string;
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPercentage: number;
  signal: 'buy' | 'sell';
  confidence: number;
}

export interface TradingStrategy {
  id: string;
  name: string;
  description: string;
  type: 'momentum' | 'mean_reversion' | 'breakout' | 'ml_based' | 'hybrid';
  parameters: Record<string, any>;
  performance: {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
  };
  status: 'active' | 'inactive' | 'testing';
}

export class MachineLearningService {
  private models: Map<string, MLModel> = new Map();
  private strategies: Map<string, TradingStrategy> = new Map();
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.initializeDefaultModels();
    this.initializeDefaultStrategies();
  }

  /**
   * Train a new machine learning model
   */
  async trainModel(
    modelType: 'regression' | 'classification' | 'ensemble',
    features: string[],
    hyperparameters: Record<string, any> = {}
  ): Promise<MLModel> {
    try {
      console.log(`Training ${modelType} model with ${features.length} features`);

      // Simulate model training process
      const modelId = `model_${Date.now()}`;
      const model: MLModel = {
        id: modelId,
        name: `${modelType}_model_${new Date().toISOString().split('T')[0]}`,
        type: modelType,
        version: '1.0.0',
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        trainingDate: new Date().toISOString(),
        features,
        hyperparameters,
        status: 'training'
      };

      this.models.set(modelId, model);

      // Simulate training process with realistic metrics
      await this.simulateTraining(model);

      return model;
    } catch (error) {
      console.error('Error training model:', error);
      throw new Error('Failed to train model');
    }
  }

  /**
   * Generate predictions using trained models
   */
  async predict(symbol: string, modelId: string): Promise<MLPrediction> {
    try {
      const model = this.models.get(modelId);
      if (!model || model.status !== 'ready') {
        throw new Error('Model not ready for predictions');
      }

      // Generate features for prediction
      const features = await this.generateFeatures(symbol);
      
      // Simulate ML prediction
      const prediction = this.simulatePrediction(features, model);
      
      return {
        symbol,
        timestamp: new Date().toISOString(),
        prediction: prediction.value,
        confidence: prediction.confidence,
        direction: prediction.direction,
        features: features.map(f => ({
          name: f.name,
          value: f.value,
          importance: f.importance,
          type: f.type
        })),
        model: model.name,
        version: model.version
      };
    } catch (error) {
      console.error('Error generating prediction:', error);
      throw new Error('Failed to generate prediction');
    }
  }

  /**
   * Backtest a trading strategy
   */
  async backtestStrategy(
    strategyId: string,
    startDate: string,
    endDate: string,
    symbols: string[] = []
  ): Promise<BacktestResult> {
    try {
      const strategy = this.strategies.get(strategyId);
      if (!strategy) {
        throw new Error('Strategy not found');
      }

      console.log(`Backtesting strategy: ${strategy.name}`);

      // Simulate backtesting process
      const result = await this.simulateBacktest(strategy, startDate, endDate, symbols);
      
      return result;
    } catch (error) {
      console.error('Error backtesting strategy:', error);
      throw new Error('Failed to backtest strategy');
    }
  }

  /**
   * Optimize model hyperparameters
   */
  async optimizeModel(modelId: string): Promise<MLModel> {
    try {
      const model = this.models.get(modelId);
      if (!model) {
        throw new Error('Model not found');
      }

      console.log(`Optimizing model: ${model.name}`);

      // Simulate hyperparameter optimization
      const optimizedModel = await this.simulateOptimization(model);
      
      this.models.set(modelId, optimizedModel);
      return optimizedModel;
    } catch (error) {
      console.error('Error optimizing model:', error);
      throw new Error('Failed to optimize model');
    }
  }

  /**
   * Create a new trading strategy
   */
  async createStrategy(
    name: string,
    description: string,
    type: 'momentum' | 'mean_reversion' | 'breakout' | 'ml_based' | 'hybrid',
    parameters: Record<string, any>
  ): Promise<TradingStrategy> {
    try {
      const strategyId = `strategy_${Date.now()}`;
      const strategy: TradingStrategy = {
        id: strategyId,
        name,
        description,
        type,
        parameters,
        performance: {
          totalReturn: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          winRate: 0
        },
        status: 'testing'
      };

      this.strategies.set(strategyId, strategy);
      return strategy;
    } catch (error) {
      console.error('Error creating strategy:', error);
      throw new Error('Failed to create strategy');
    }
  }

  /**
   * Get all trained models
   */
  getModels(): MLModel[] {
    return Array.from(this.models.values());
  }

  /**
   * Get all trading strategies
   */
  getStrategies(): TradingStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Get model performance metrics
   */
  async getModelPerformance(modelId: string): Promise<{
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    confusionMatrix: number[][];
  }> {
    try {
      const model = this.models.get(modelId);
      if (!model) {
        throw new Error('Model not found');
      }

      // Simulate performance metrics
      return {
        accuracy: model.accuracy,
        precision: model.precision,
        recall: model.recall,
        f1Score: model.f1Score,
        confusionMatrix: [
          [85, 15], // True Positives, False Positives
          [12, 88]  // False Negatives, True Negatives
        ]
      };
    } catch (error) {
      console.error('Error getting model performance:', error);
      throw new Error('Failed to get model performance');
    }
  }

  /**
   * Generate features for ML models
   */
  private async generateFeatures(symbol: string): Promise<MLFeature[]> {
    const features: MLFeature[] = [];

    // Technical features
    features.push(
      { name: 'rsi', value: this.generateRandomValue(20, 80), importance: 0.85, type: 'technical' },
      { name: 'macd', value: this.generateRandomValue(-2, 2), importance: 0.78, type: 'technical' },
      { name: 'bollinger_position', value: this.generateRandomValue(0, 1), importance: 0.72, type: 'technical' },
      { name: 'volume_ratio', value: this.generateRandomValue(0.5, 2.0), importance: 0.68, type: 'technical' },
      { name: 'price_momentum', value: this.generateRandomValue(-0.1, 0.1), importance: 0.75, type: 'technical' }
    );

    // Market features
    features.push(
      { name: 'market_volatility', value: this.generateRandomValue(0.01, 0.05), importance: 0.82, type: 'market' },
      { name: 'sector_performance', value: this.generateRandomValue(-0.05, 0.05), importance: 0.65, type: 'market' },
      { name: 'market_sentiment', value: this.generateRandomValue(-1, 1), importance: 0.70, type: 'market' }
    );

    // Behavioral features (if available)
    features.push(
      { name: 'trading_frequency', value: this.generateRandomValue(0, 10), importance: 0.45, type: 'behavioral' },
      { name: 'position_size_consistency', value: this.generateRandomValue(0, 1), importance: 0.55, type: 'behavioral' }
    );

    return features;
  }

  /**
   * Simulate ML prediction
   */
  private simulatePrediction(features: MLFeature[], model: MLModel): {
    value: number;
    confidence: number;
    direction: 'up' | 'down' | 'sideways';
  } {
    // Calculate weighted prediction based on features
    let weightedSum = 0;
    let totalWeight = 0;

    features.forEach(feature => {
      weightedSum += feature.value * feature.importance;
      totalWeight += feature.importance;
    });

    const prediction = weightedSum / totalWeight;
    const confidence = Math.max(30, Math.min(95, 50 + Math.abs(prediction) * 100));
    
    let direction: 'up' | 'down' | 'sideways';
    if (prediction > 0.02) direction = 'up';
    else if (prediction < -0.02) direction = 'down';
    else direction = 'sideways';

    return {
      value: prediction * 100, // Convert to percentage
      confidence,
      direction
    };
  }

  /**
   * Simulate model training
   */
  private async simulateTraining(model: MLModel): Promise<void> {
    // Simulate training time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate realistic training metrics
    model.accuracy = this.generateRandomValue(0.65, 0.85);
    model.precision = this.generateRandomValue(0.60, 0.80);
    model.recall = this.generateRandomValue(0.55, 0.75);
    model.f1Score = this.generateRandomValue(0.58, 0.78);
    model.status = 'ready';

    console.log(`Model training completed: ${model.name}`);
  }

  /**
   * Simulate hyperparameter optimization
   */
  private async simulateOptimization(model: MLModel): Promise<MLModel> {
    // Simulate optimization time
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Improve metrics slightly
    model.accuracy = Math.min(0.95, model.accuracy + this.generateRandomValue(0.02, 0.05));
    model.precision = Math.min(0.90, model.precision + this.generateRandomValue(0.02, 0.05));
    model.recall = Math.min(0.85, model.recall + this.generateRandomValue(0.02, 0.05));
    model.f1Score = Math.min(0.88, model.f1Score + this.generateRandomValue(0.02, 0.05));
    model.version = '1.1.0';

    console.log(`Model optimization completed: ${model.name}`);
    return model;
  }

  /**
   * Simulate backtesting
   */
  private async simulateBacktest(
    strategy: TradingStrategy,
    startDate: string,
    endDate: string,
    symbols: string[]
  ): Promise<BacktestResult> {
    // Simulate backtesting time
    await new Promise(resolve => setTimeout(resolve, 1500));

    const totalTrades = Math.floor(this.generateRandomValue(20, 100));
    const winningTrades = Math.floor(totalTrades * this.generateRandomValue(0.45, 0.65));
    const losingTrades = totalTrades - winningTrades;
    const winRate = winningTrades / totalTrades;
    const totalReturn = this.generateRandomValue(-0.2, 0.4);
    const sharpeRatio = this.generateRandomValue(0.5, 2.0);
    const maxDrawdown = this.generateRandomValue(-0.15, -0.05);
    const profitFactor = this.generateRandomValue(1.0, 2.5);
    const averageTrade = totalReturn / totalTrades;
    const bestTrade = this.generateRandomValue(0.05, 0.15);
    const worstTrade = this.generateRandomValue(-0.12, -0.03);

    // Generate sample trades
    const trades: BacktestTrade[] = [];
    for (let i = 0; i < Math.min(10, totalTrades); i++) {
      const symbol = symbols[i % symbols.length] || 'AAPL';
      const pnl = this.generateRandomValue(-0.1, 0.1);
      trades.push({
        symbol,
        entryDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        exitDate: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString(),
        entryPrice: this.generateRandomValue(100, 200),
        exitPrice: this.generateRandomValue(100, 200),
        quantity: Math.floor(this.generateRandomValue(10, 100)),
        pnl: pnl * 1000,
        pnlPercentage: pnl * 100,
        signal: pnl > 0 ? 'buy' : 'sell',
        confidence: this.generateRandomValue(60, 90)
      });
    }

    return {
      modelId: strategy.id,
      startDate,
      endDate,
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      totalReturn,
      sharpeRatio,
      maxDrawdown,
      profitFactor,
      averageTrade,
      bestTrade,
      worstTrade,
      trades
    };
  }

  /**
   * Initialize default models
   */
  private initializeDefaultModels(): void {
    const defaultModels: MLModel[] = [
      {
        id: 'default_regression',
        name: 'Price_Prediction_Regression',
        type: 'regression',
        version: '1.0.0',
        accuracy: 0.78,
        precision: 0.75,
        recall: 0.72,
        f1Score: 0.73,
        trainingDate: new Date().toISOString(),
        features: ['rsi', 'macd', 'volume_ratio', 'price_momentum', 'market_volatility'],
        hyperparameters: { learning_rate: 0.01, max_depth: 6, n_estimators: 100 },
        status: 'ready'
      },
      {
        id: 'default_classification',
        name: 'Direction_Classification',
        type: 'classification',
        version: '1.0.0',
        accuracy: 0.82,
        precision: 0.79,
        recall: 0.81,
        f1Score: 0.80,
        trainingDate: new Date().toISOString(),
        features: ['rsi', 'macd', 'bollinger_position', 'volume_ratio', 'market_sentiment'],
        hyperparameters: { C: 1.0, kernel: 'rbf', gamma: 'scale' },
        status: 'ready'
      }
    ];

    defaultModels.forEach(model => this.models.set(model.id, model));
  }

  /**
   * Initialize default strategies
   */
  private initializeDefaultStrategies(): void {
    const defaultStrategies: TradingStrategy[] = [
      {
        id: 'momentum_strategy',
        name: 'Momentum Trading Strategy',
        description: 'Buy stocks with strong upward momentum and sell when momentum weakens',
        type: 'momentum',
        parameters: {
          lookback_period: 20,
          momentum_threshold: 0.05,
          stop_loss: 0.03,
          take_profit: 0.08
        },
        performance: {
          totalReturn: 0.25,
          sharpeRatio: 1.8,
          maxDrawdown: -0.08,
          winRate: 0.62
        },
        status: 'active'
      },
      {
        id: 'mean_reversion_strategy',
        name: 'Mean Reversion Strategy',
        description: 'Buy oversold stocks and sell overbought stocks',
        type: 'mean_reversion',
        parameters: {
          rsi_oversold: 30,
          rsi_overbought: 70,
          bollinger_std: 2,
          holding_period: 5
        },
        performance: {
          totalReturn: 0.18,
          sharpeRatio: 1.4,
          maxDrawdown: -0.06,
          winRate: 0.58
        },
        status: 'active'
      },
      {
        id: 'ml_enhanced_strategy',
        name: 'ML-Enhanced Strategy',
        description: 'Combines traditional technical analysis with machine learning predictions',
        type: 'ml_based',
        parameters: {
          ml_confidence_threshold: 0.75,
          technical_weight: 0.6,
          ml_weight: 0.4,
          risk_management: 'dynamic'
        },
        performance: {
          totalReturn: 0.32,
          sharpeRatio: 2.1,
          maxDrawdown: -0.07,
          winRate: 0.68
        },
        status: 'active'
      }
    ];

    defaultStrategies.forEach(strategy => this.strategies.set(strategy.id, strategy));
  }

  /**
   * Generate random value within range
   */
  private generateRandomValue(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
} 