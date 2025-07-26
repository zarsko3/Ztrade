'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface PerformanceData {
  date: string;
  pnl: number;
  cumulative: number;
  trades: number;
  winRate: number;
}

interface PerformanceChartProps {
  data: PerformanceData[];
  type?: 'line' | 'area' | 'bar' | 'composed';
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  animate?: boolean;
  className?: string;
}

const COLORS = {
  positive: '#10b981',
  negative: '#ef4444',
  neutral: '#6b7280',
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  background: '#f8fafc',
  grid: '#e2e8f0'
};

export default function PerformanceChart({
  data,
  type = 'line',
  height = 300,
  showGrid = true,
  showLegend = true,
  animate = true,
  className = ''
}: PerformanceChartProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string; payload: any }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              {label ? new Date(label).toLocaleDateString() : ''}
            </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {entry.name}:
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {entry.name === 'P&L' || entry.name === 'Cumulative'
                  ? formatCurrency(entry.value)
                  : entry.name === 'Win Rate'
                  ? formatPercentage(entry.value)
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
      className: animate ? 'transition-all duration-1000 ease-in-out' : ''
    };

    switch (type) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
            )}
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: COLORS.neutral }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis
              tick={{ fontSize: 12, fill: COLORS.neutral }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Area
              type="monotone"
              dataKey="cumulative"
              stackId="1"
              stroke={COLORS.primary}
              fill={COLORS.primary}
              fillOpacity={0.3}
              strokeWidth={2}
              name="Cumulative P&L"
            />
            <Area
              type="monotone"
              dataKey="pnl"
              stackId="2"
              stroke={COLORS.secondary}
              fill={COLORS.secondary}
              fillOpacity={0.2}
              strokeWidth={2}
              name="Daily P&L"
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
            )}
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: COLORS.neutral }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis
              tick={{ fontSize: 12, fill: COLORS.neutral }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Bar
              dataKey="pnl"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              name="Daily P&L"
            />
          </BarChart>
        );

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
            )}
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: COLORS.neutral }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12, fill: COLORS.neutral }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCurrency}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: COLORS.neutral }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatPercentage}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="cumulative"
              stroke={COLORS.primary}
              strokeWidth={3}
              dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
              name="Cumulative P&L"
            />
            <Bar
              yAxisId="left"
              dataKey="pnl"
              fill="#3b82f6"
              radius={[2, 2, 0, 0]}
              opacity={0.7}
              name="Daily P&L"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="winRate"
              stroke={COLORS.secondary}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Win Rate"
            />
          </ComposedChart>
        );

      default: // line
        return (
          <LineChart {...commonProps}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
            )}
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: COLORS.neutral }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis
              tick={{ fontSize: 12, fill: COLORS.neutral }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Line
              type="monotone"
              dataKey="cumulative"
              stroke={COLORS.primary}
              strokeWidth={3}
              dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
              name="Cumulative P&L"
            />
            <Line
              type="monotone"
              dataKey="pnl"
              stroke={COLORS.secondary}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: COLORS.secondary, strokeWidth: 1, r: 3 }}
              name="Daily P&L"
            />
          </LineChart>
        );
    }
  };

  if (!data || data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <TrendingUp className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No performance data available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${className} ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
} 