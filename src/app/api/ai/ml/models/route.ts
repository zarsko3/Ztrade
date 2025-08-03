import { NextRequest, NextResponse } from 'next/server';
import { MachineLearningService } from '@/services/ai/machine-learning';

const mlService = new MachineLearningService();

export interface MLModelsResponse {
  models: any[];
  summary: {
    totalModels: number;
    readyModels: number;
    trainingModels: number;
    averageAccuracy: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');
    const includePerformance = searchParams.get('includePerformance') === 'true';

    if (modelId) {
      // Get specific model
      const models = mlService.getModels();
      const model = models.find(m => m.id === modelId);
      
      if (!model) {
        return NextResponse.json(
          { error: 'Model not found' },
          { status: 404 }
        );
      }

      let response: any = { model };

      if (includePerformance) {
        const performance = await mlService.getModelPerformance(modelId);
        response.performance = performance;
      }

      return NextResponse.json({
        status: 'success',
        data: response
      });
    }

    // Get all models
    const models = mlService.getModels();
    
    const summary = {
      totalModels: models.length,
      readyModels: models.filter(m => m.status === 'ready').length,
      trainingModels: models.filter(m => m.status === 'training').length,
      averageAccuracy: models.length > 0 
        ? models.reduce((sum, m) => sum + m.accuracy, 0) / models.length 
        : 0
    };

    return NextResponse.json({
      status: 'success',
      data: {
        models,
        summary
      }
    });

  } catch (error) {
    console.error('Error fetching ML models:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch ML models',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'train':
        const { modelType, features, hyperparameters } = params;
        if (!modelType || !features) {
          return NextResponse.json(
            { error: 'modelType and features are required for training' },
            { status: 400 }
          );
        }

        const model = await mlService.trainModel(modelType, features, hyperparameters);
        return NextResponse.json({
          status: 'success',
          data: { model },
          message: 'Model training started'
        });

      case 'predict':
        const { symbol, modelId } = params;
        if (!symbol || !modelId) {
          return NextResponse.json(
            { error: 'symbol and modelId are required for prediction' },
            { status: 400 }
          );
        }

        const prediction = await mlService.predict(symbol, modelId);
        return NextResponse.json({
          status: 'success',
          data: { prediction }
        });

      case 'optimize':
        const { modelId: optModelId } = params;
        if (!optModelId) {
          return NextResponse.json(
            { error: 'modelId is required for optimization' },
            { status: 400 }
          );
        }

        const optimizedModel = await mlService.optimizeModel(optModelId);
        return NextResponse.json({
          status: 'success',
          data: { model: optimizedModel },
          message: 'Model optimization completed'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: train, predict, optimize' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in ML model operation:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to perform ML model operation',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 