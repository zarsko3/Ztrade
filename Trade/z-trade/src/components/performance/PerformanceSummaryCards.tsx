'use client';

import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Activity, 
  Calendar,
  BarChart3,
  Percent,
  Shield,
  Award
} from 'lucide-react';

interface PerformanceMetric {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  description?: string;
  trend?: 'up' | 'down' | 'flat';
  color: 'green' | 'red' | 'blue' | 'purple' | 'orange' | 'indigo';
}

interface PerformanceSummaryCardsProps {
  metrics: {
    totalPnL: number;
    winRate: number;
    totalTrades: number;
    profitFactor: number;
    averageReturn: number;
    maxDrawdown: number;
    sharpeRatio: number;
    averageHoldingPeriod: number;
    totalVolume: number;
    largestWin: number;
    largestLoss: number;
    calmarRatio: number;
  };
  comparisonPeriod?: string;
  showComparison?: boolean;
  previousMetrics?: {
    totalPnL: number;
    winRate: number;
    totalTrades: number;
    profitFactor: number;
  };
}

export default function PerformanceSummaryCards({ 
  metrics, 
  comparisonPeriod = 'last period',
  showComparison = false,
  previousMetrics 
}: PerformanceSummaryCardsProps) {
  
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const formatNumber = (value: number, decimals: number = 1): string => {
    return value.toFixed(decimals);
  };

  const calculateChange = (current: number, previous: number): { value: number; type: 'positive' | 'negative' | 'neutral' } => {
    if (!previous || previous === 0) return { value: 0, type: 'neutral' };
    const change = ((current - previous) / Math.abs(previous)) * 100;
    return {
      value: Math.abs(change),
      type: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'
    };
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'flat') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <BarChart3 className="w-4 h-4 text-gray-500" />;
    }
  };

  const performanceMetrics: PerformanceMetric[] = [
    {
      title: 'Total P&L',
      value: formatCurrency(metrics.totalPnL),
      icon: <DollarSign className="w-6 h-6" />,
      color: metrics.totalPnL >= 0 ? 'green' : 'red',
      description: 'Total profit/loss across all trades',
      trend: metrics.totalPnL > 0 ? 'up' : metrics.totalPnL < 0 ? 'down' : 'flat',
      ...(showComparison && previousMetrics ? {
        ...calculateChange(metrics.totalPnL, previousMetrics.totalPnL)
      } : {})
    },
    {
      title: 'Win Rate',
      value: formatPercentage(metrics.winRate),
      icon: <Target className="w-6 h-6" />,
      color: 'blue',
      description: 'Percentage of profitable trades',
      trend: metrics.winRate >= 60 ? 'up' : metrics.winRate >= 40 ? 'flat' : 'down',
      ...(showComparison && previousMetrics ? {
        ...calculateChange(metrics.winRate, previousMetrics.winRate)
      } : {})
    },
    {
      title: 'Total Trades',
      value: metrics.totalTrades,
      icon: <Activity className="w-6 h-6" />,
      color: 'purple',
      description: 'Total number of trades executed',
      trend: 'flat',
      ...(showComparison && previousMetrics ? {
        ...calculateChange(metrics.totalTrades, previousMetrics.totalTrades)
      } : {})
    },
    {
      title: 'Profit Factor',
      value: formatNumber(metrics.profitFactor, 2),
      icon: <Award className="w-6 h-6" />,
      color: 'indigo',
      description: 'Ratio of gross profit to gross loss',
      trend: metrics.profitFactor > 1.5 ? 'up' : metrics.profitFactor > 1 ? 'flat' : 'down',
      ...(showComparison && previousMetrics ? {
        ...calculateChange(metrics.profitFactor, previousMetrics.profitFactor)
      } : {})
    },
    {
      title: 'Average Return',
      value: formatCurrency(metrics.averageReturn),
      icon: <Percent className="w-6 h-6" />,
      color: metrics.averageReturn >= 0 ? 'green' : 'red',
      description: 'Average profit/loss per trade',
      trend: metrics.averageReturn > 0 ? 'up' : metrics.averageReturn < 0 ? 'down' : 'flat'
    },
    {
      title: 'Max Drawdown',
      value: formatCurrency(metrics.maxDrawdown),
      icon: <TrendingDown className="w-6 h-6" />,
      color: 'red',
      description: 'Maximum peak-to-trough decline',
      trend: 'down'
    },
    {
      title: 'Sharpe Ratio',
      value: formatNumber(metrics.sharpeRatio, 2),
      icon: <Shield className="w-6 h-6" />,
      color: 'blue',
      description: 'Risk-adjusted return measure',
      trend: metrics.sharpeRatio > 1 ? 'up' : metrics.sharpeRatio > 0 ? 'flat' : 'down'
    },
    {
      title: 'Avg Hold Time',
      value: `${Math.round(metrics.averageHoldingPeriod)} days`,
      icon: <Calendar className="w-6 h-6" />,
      color: 'orange',
      description: 'Average holding period per trade',
      trend: 'flat'
    },
    {
      title: 'Total Volume',
      value: formatCurrency(metrics.totalVolume),
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'purple',
      description: 'Total trading volume',
      trend: 'flat'
    },
    {
      title: 'Largest Win',
      value: formatCurrency(metrics.largestWin),
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'green',
      description: 'Best performing single trade',
      trend: 'up'
    },
    {
      title: 'Largest Loss',
      value: formatCurrency(Math.abs(metrics.largestLoss)),
      icon: <TrendingDown className="w-6 h-6" />,
      color: 'red',
      description: 'Worst performing single trade',
      trend: 'down'
    },
    {
      title: 'Calmar Ratio',
      value: formatNumber(metrics.calmarRatio, 2),
      icon: <Shield className="w-6 h-6" />,
      color: 'indigo',
      description: 'Return relative to maximum drawdown',
      trend: metrics.calmarRatio > 0.5 ? 'up' : metrics.calmarRatio > 0 ? 'flat' : 'down'
    }
  ];

  const getCardColorClasses = (color: string) => {
    const colorMap = {
      green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
      orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
      indigo: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getIconColorClasses = (color: string) => {
    const colorMap = {
      green: 'text-green-600 dark:text-green-400',
      red: 'text-red-600 dark:text-red-400',
      blue: 'text-blue-600 dark:text-blue-400',
      purple: 'text-purple-600 dark:text-purple-400',
      orange: 'text-orange-600 dark:text-orange-400',
      indigo: 'text-indigo-600 dark:text-indigo-400'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getChangeColorClasses = (changeType: 'positive' | 'negative' | 'neutral') => {
    const colorMap = {
      positive: 'text-green-600 dark:text-green-400',
      negative: 'text-red-600 dark:text-red-400',
      neutral: 'text-gray-600 dark:text-gray-400'
    };
    return colorMap[changeType];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {performanceMetrics.map((metric, index) => (
        <div 
          key={index}
          className={`
            bg-white dark:bg-gray-800 rounded-xl p-6 border shadow-sm transition-all duration-200 hover:shadow-md
            ${getCardColorClasses(metric.color)}
          `}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center
              ${getCardColorClasses(metric.color)}
            `}>
              <div className={getIconColorClasses(metric.color)}>
                {metric.icon}
              </div>
            </div>
            {metric.trend && (
              <div className="flex items-center space-x-1">
                {getTrendIcon(metric.trend)}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {metric.title}
            </h3>
            
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {metric.value}
              </span>
              
              {showComparison && metric.change !== undefined && metric.changeType && (
                <div className={`flex items-center space-x-1 ${getChangeColorClasses(metric.changeType)}`}>
                  {metric.changeType === 'positive' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : metric.changeType === 'negative' ? (
                    <TrendingDown className="w-3 h-3" />
                  ) : null}
                  <span className="text-xs font-medium">
                    {formatPercentage(metric.change)}
                  </span>
                </div>
              )}
            </div>
            
            {metric.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {metric.description}
              </p>
            )}
            
            {showComparison && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                vs {comparisonPeriod}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 