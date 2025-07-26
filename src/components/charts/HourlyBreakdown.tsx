import React from 'react';
import { Clock } from 'lucide-react';

interface HourlyData {
  hour: string;
  pnl: number;
  percentage: number;
}

interface HourlyBreakdownProps {
  data: HourlyData[];
}

export default function HourlyBreakdown({ data }: HourlyBreakdownProps) {
  const formatCurrency = (amount: number) => {
    if (amount === 0) return '$0';
    const absAmount = Math.abs(amount);
    if (absAmount >= 1000) {
      return `${amount >= 0 ? '+' : '-'}$${(absAmount / 1000).toFixed(2)}k`;
    }
    return `${amount >= 0 ? '+' : '-'}$${absAmount.toFixed(2)}`;
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const getMaxValue = () => {
    return Math.max(...data.map(d => Math.abs(d.pnl)));
  };

  const maxValue = getMaxValue();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-2 mb-6">
        <Clock className="w-5 h-5 text-gray-500" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Hourly</h2>
      </div>

      <div className="space-y-3">
        {data.map((hour, index) => (
          <div key={index} className="flex items-center space-x-4">
            {/* Hour */}
            <div className="w-12 text-sm font-medium text-gray-900 dark:text-white">
              {hour.hour}
            </div>

            {/* P&L Amount */}
            <div className="w-24 text-sm font-medium">
              <span
                className={
                  hour.pnl > 0
                    ? 'text-green-600 dark:text-green-400'
                    : hour.pnl < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-600 dark:text-gray-400'
                }
              >
                {formatCurrency(hour.pnl)}
              </span>
            </div>

            {/* Percentage */}
            <div className="w-16 text-sm text-gray-500 dark:text-gray-400">
              {formatPercentage(hour.percentage)}
            </div>

            {/* Horizontal Bar */}
            <div className="flex-1">
              <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                {hour.pnl !== 0 && (
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      hour.pnl > 0
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    }`}
                    style={{
                      width: `${Math.abs(hour.pnl) / maxValue * 100}%`
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No hourly data available</p>
        </div>
      )}
    </div>
  );
} 