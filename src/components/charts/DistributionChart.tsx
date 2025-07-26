'use client';

import { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Treemap
} from 'recharts';
import { PieChart as PieIcon, BarChart3, Square } from 'lucide-react';

interface DistributionData {
  name: string;
  value: number;
  percentage?: number;
  color?: string;
}

interface DistributionChartProps {
  data: DistributionData[];
  type?: 'pie' | 'donut' | 'bar' | 'treemap';
  title: string;
  subtitle?: string;
  height?: number;
  showLegend?: boolean;
  showPercentage?: boolean;
  animate?: boolean;
  className?: string;
}

const COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
  '#14b8a6', '#fbbf24', '#f43f5e', '#8b5cf6', '#06b6d4'
];

export default function DistributionChart({
  data,
  type = 'pie',
  title,
  subtitle,
  height = 300,
  showLegend = true,
  showPercentage = true,

  className = ''
}: DistributionChartProps) {
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {data.name}
          </p>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: data.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Value:
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatCurrency(data.value)}
              </span>
            </div>
            {showPercentage && data.payload.percentage && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formatPercentage(data.payload.percentage)}
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderPieChart = () => {
    return (
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={type === 'donut' ? '60%' : 0}
          outerRadius="80%"
          paddingAngle={2}
          dataKey="value"
          animationDuration={1000}
          animationBegin={0}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        {showLegend && (
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: any) => (
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {value}
              </span>
            )}
          />
        )}
      </PieChart>
    );
  };

  const renderBarChart = () => {
    return (
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatCurrency}
        />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend />}
        <Bar
          dataKey="value"
          fill="#3b82f6"
          radius={[4, 4, 0, 0]}
          animationDuration={1000}
        />
      </BarChart>
    );
  };

  const renderTreemap = () => {
    return (
      <Treemap
        data={data as any}
        dataKey="value"
        aspectRatio={4 / 3}
        stroke="#fff"
        fill="#3b82f6"
        animationDuration={1000}
        content={({ depth, x, y, width, height, index, payload, colors, name }: any) => {
          return (
            <g>
              <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                  fill: colors[index % colors.length],
                  stroke: '#fff',
                  strokeWidth: 2 / (depth + 1e-10),
                  strokeOpacity: 1 / (depth + 1e-10),
                }}
              />
              {depth === 1 ? (
                <text
                  x={x + width / 2}
                  y={y + height / 2 + 7}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize={14}
                  fontWeight="bold"
                >
                  {name}
                </text>
              ) : null}
              {depth === 1 ? (
                <text
                  x={x + width / 2}
                  y={y + height / 2 - 7}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize={12}
                >
                  {formatCurrency(payload.value)}
                </text>
              ) : null}
            </g>
          );
        }}
      />
    );
  };

  const getIcon = () => {
    switch (type) {
      case 'pie':
      case 'donut':
        return <PieIcon className="w-4 h-4" />;
      case 'bar':
        return <BarChart3 className="w-4 h-4" />;
      case 'treemap':
        return <Square className="w-4 h-4" />;
      default:
        return <PieIcon className="w-4 h-4" />;
    }
  };

  if (!data || data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <PieIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No distribution data available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${className} ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } transition-all duration-1000 ease-in-out`}
      style={{ height }}
    >
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        {getIcon()}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height="calc(100% - 60px)">
        {type === 'pie' || type === 'donut'
          ? renderPieChart()
          : type === 'bar'
          ? renderBarChart()
          : renderTreemap()}
      </ResponsiveContainer>
    </div>
  );
} 