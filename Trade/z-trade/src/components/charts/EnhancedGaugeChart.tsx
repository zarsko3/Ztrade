import React, { useState, useEffect } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';
import { Target, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';

interface GaugeData {
  name: string;
  value: number;
  fill: string;
}

interface EnhancedGaugeChartProps {
  title: string;
  value: number;
  maxValue: number;
  formatValue?: (value: number) => string;
  type?: 'profit-factor' | 'win-rate' | 'pnl' | 'trades';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export default function EnhancedGaugeChart({
  title,
  value,
  maxValue,
  formatValue,
  type = 'pnl',
  size = 'md',
  showIcon = true
}: EnhancedGaugeChartProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);

  const getIcon = () => {
    switch (type) {
      case 'profit-factor':
        return <Target className="w-4 h-4" />;
      case 'win-rate':
        return <TrendingUp className="w-4 h-4" />;
      case 'pnl':
        return <DollarSign className="w-4 h-4" />;
      case 'trades':
        return <BarChart3 className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'profit-factor':
        return ['#10b981', '#ef4444', '#6b7280'];
      case 'win-rate':
        return ['#10b981', '#ef4444', '#6b7280'];
      case 'pnl':
        return value >= 0 ? ['#10b981', '#6b7280'] : ['#ef4444', '#6b7280'];
      case 'trades':
        return ['#3b82f6', '#6b7280'];
      default:
        return ['#10b981', '#ef4444', '#6b7280'];
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return { container: 'h-32', chart: 'h-24', text: 'text-sm' };
      case 'md':
        return { container: 'h-40', chart: 'h-32', text: 'text-base' };
      case 'lg':
        return { container: 'h-48', chart: 'h-40', text: 'text-lg' };
      default:
        return { container: 'h-40', chart: 'h-32', text: 'text-base' };
    }
  };

  const sizeClasses = getSizeClasses();
  const colors = getColors();
  const percentage = Math.min((animatedValue / maxValue) * 100, 100);

  const data: GaugeData[] = [
    {
      name: 'value',
      value: percentage,
      fill: colors[0]
    },
    {
      name: 'remaining',
      value: 100 - percentage,
      fill: colors[1]
    }
  ];

  const formatDisplayValue = (val: number) => {
    if (formatValue) return formatValue(val);
    
    switch (type) {
      case 'profit-factor':
        return val.toFixed(2);
      case 'win-rate':
        return `${val.toFixed(1)}%`;
      case 'pnl':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val);
      case 'trades':
        return val.toString();
      default:
        return val.toString();
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {formatDisplayValue(animatedValue)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-semibold text-gray-900 dark:text-white ${sizeClasses.text}`}>
          {title}
        </h3>
        {showIcon && (
          <div className="text-gray-400">
            {getIcon()}
          </div>
        )}
      </div>

      <div className={`relative ${sizeClasses.container} flex items-center justify-center`}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              fill={colors[0]}
              animationDuration={1000}
              animationBegin={200}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Center Value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`font-bold text-gray-900 dark:text-white ${sizeClasses.text}`}>
            {formatDisplayValue(animatedValue)}
          </div>
          {type === 'profit-factor' && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Target: 2.0
            </div>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>0</span>
          <span>{maxValue}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
          <div
            className={`h-1 rounded-full transition-all duration-1000 ease-out ${
              type === 'pnl' && value < 0 ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
} 