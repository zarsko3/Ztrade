'use client';

import { useState, useEffect } from 'react';
import {
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { TrendingUp, TrendingDown, Target, DollarSign } from 'lucide-react';

interface GaugeChartProps {
  value: number;
  maxValue?: number;
  minValue?: number;
  title: string;
  subtitle?: string;
  type?: 'radial' | 'pie' | 'donut';
  size?: 'sm' | 'md' | 'lg';
  color?: 'auto' | 'green' | 'red' | 'blue' | 'purple';
  showValue?: boolean;
  formatValue?: (value: number) => string;
  className?: string;
}

const COLORS = {
  positive: '#10b981',
  negative: '#ef4444',
  neutral: '#6b7280',
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  warning: '#f59e0b',
  success: '#10b981'
};

const SIZES = {
  sm: { width: 120, height: 120, fontSize: 14 },
  md: { width: 160, height: 160, fontSize: 18 },
  lg: { width: 200, height: 200, fontSize: 24 }
};

export default function GaugeChart({
  value,
  maxValue = 100,
  minValue = 0,
  title,
  subtitle,
  type = 'radial',
  size = 'md',
  color = 'auto',
  showValue = true,
  formatValue,
  className = ''
}: GaugeChartProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    // Animate the value
    const duration = 1000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setAnimatedValue(value);
        clearInterval(timer);
      } else {
        setAnimatedValue(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const getColor = () => {
    if (color !== 'auto') {
      return COLORS[color as keyof typeof COLORS] || COLORS.primary;
    }
    
    const percentage = (value - minValue) / (maxValue - minValue);
    if (percentage >= 0.7) return COLORS.success;
    if (percentage >= 0.4) return COLORS.warning;
    return COLORS.negative;
  };

  const formatDisplayValue = (val: number) => {
    if (formatValue) return formatValue(val);
    if (title.toLowerCase().includes('rate') || title.toLowerCase().includes('percentage')) {
      return `${val.toFixed(1)}%`;
    }
    if (title.toLowerCase().includes('pnl') || title.toLowerCase().includes('profit')) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(val);
    }
    return val.toFixed(1);
  };

  const renderRadialGauge = () => {
    const percentage = Math.min(Math.max((animatedValue - minValue) / (maxValue - minValue), 0), 1);
    const data = [
      {
        name: 'value',
        value: percentage * 100,
        fill: getColor()
      },
      {
        name: 'background',
        value: 100 - (percentage * 100),
        fill: '#e5e7eb'
      }
    ];

    return (
      <RadialBarChart
        width={SIZES[size].width}
        height={SIZES[size].height}
        data={data}
        innerRadius="60%"
        outerRadius="90%"
        startAngle={180}
        endAngle={0}
      >
        <RadialBar
          dataKey="value"
          cornerRadius={10}
          fill={getColor()}
          animationDuration={1000}
        />
        <Tooltip
          content={({ payload }) => {
            if (payload && payload.length > 0) {
              return (
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDisplayValue(animatedValue)}
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
      </RadialBarChart>
    );
  };

  const renderPieGauge = () => {
    const percentage = Math.min(Math.max((animatedValue - minValue) / (maxValue - minValue), 0), 1);
    const data = [
      {
        name: 'value',
        value: percentage * 100,
        fill: getColor()
      },
      {
        name: 'background',
        value: 100 - (percentage * 100),
        fill: '#e5e7eb'
      }
    ];

    return (
      <PieChart
        width={SIZES[size].width}
        height={SIZES[size].height}
      >
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={type === 'donut' ? '60%' : 0}
          outerRadius="90%"
          paddingAngle={2}
          dataKey="value"
          animationDuration={1000}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          content={({ payload }) => {
            if (payload && payload.length > 0) {
              return (
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDisplayValue(animatedValue)}
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
      </PieChart>
    );
  };

  const getIcon = () => {
    if (title.toLowerCase().includes('pnl') || title.toLowerCase().includes('profit')) {
      return <DollarSign className="w-4 h-4" />;
    }
    if (title.toLowerCase().includes('rate') || title.toLowerCase().includes('percentage')) {
      return <Target className="w-4 h-4" />;
    }
    if (value >= 0) {
      return <TrendingUp className="w-4 h-4" />;
    }
    return <TrendingDown className="w-4 h-4" />;
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${className} ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } transition-all duration-1000 ease-in-out`}
    >
      <div className="flex flex-col items-center">
        {/* Title */}
        <div className="flex items-center space-x-2 mb-2">
          {getIcon()}
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {title}
          </h3>
        </div>

        {/* Chart */}
        <div className="relative">
          <ResponsiveContainer width="100%" height={SIZES[size].height}>
            {type === 'radial' ? renderRadialGauge() : renderPieGauge()}
          </ResponsiveContainer>
          
          {/* Center Value */}
          {showValue && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div
                  className="font-bold text-gray-900 dark:text-white"
                  style={{ fontSize: SIZES[size].fontSize }}
                >
                  {formatDisplayValue(animatedValue)}
                </div>
                {subtitle && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {subtitle}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Range Labels */}
        <div className="flex justify-between w-full mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{formatDisplayValue(minValue)}</span>
          <span>{formatDisplayValue(maxValue)}</span>
        </div>
      </div>
    </div>
  );
} 