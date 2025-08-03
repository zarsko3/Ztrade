import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface WinLossData {
  category: string;
  value: number;
  color: string;
}

interface WinLossComparisonProps {
  winningAverage: number;
  losingAverage: number;
  winningCount: number;
  losingCount: number;
}

export default function WinLossComparison({
  winningAverage,
  losingAverage,
  winningCount,
  losingCount
}: WinLossComparisonProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const data: WinLossData[] = [
    {
      category: 'Winning',
      value: Math.abs(winningAverage),
      color: '#10b981'
    },
    {
      category: 'Losing',
      value: Math.abs(losingAverage),
      color: '#ef4444'
    }
  ];

  const maxValue = Math.max(winningAverage, Math.abs(losingAverage));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Average: {formatCurrency(data.payload.value)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Count: {data.payload.category === 'Winning' ? winningCount : losingCount}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Average Winning VS Losing Trade
        </h2>
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <TrendingDown className="w-4 h-4 text-red-500" />
        </div>
      </div>

      <div className="space-y-4">
        {/* Chart */}
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="horizontal"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                type="number"
                domain={[0, maxValue * 1.1]}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                stroke="#6b7280"
              />
              <YAxis
                type="category"
                dataKey="category"
                stroke="#6b7280"
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                fill="#10b981"
                radius={[0, 4, 4, 0]}
                animationDuration={1000}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Winning</span>
            </div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {formatCurrency(winningAverage)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {winningCount} trades
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Losing</span>
            </div>
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
              {formatCurrency(losingAverage)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {losingCount} trades
            </div>
          </div>
        </div>

        {/* Ratio */}
        <div className="text-center pt-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">Win/Loss Ratio</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {(winningAverage / Math.abs(losingAverage)).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
} 