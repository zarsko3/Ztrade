import React from 'react';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';

interface DailyTradeData {
  date: string;
  dayOfWeek: string;
  pnl: number;
  trades: number;
}

interface DailySummaryProps {
  data: DailyTradeData[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export default function DailySummary({ data, currentDate, onDateChange }: DailySummaryProps) {
  const formatCurrency = (amount: number) => {
    if (amount === 0) return '$0';
    const absAmount = Math.abs(amount);
    if (absAmount >= 1000) {
      return `${amount >= 0 ? '+' : '-'}$${(absAmount / 1000).toFixed(2)}k`;
    }
    return `${amount >= 0 ? '+' : '-'}$${absAmount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    return `${day} ${dayName}`;
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    onDateChange(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const isToday = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousWeek}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
          >
            Today
          </button>
          <button
            onClick={goToNextWeek}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3">
        {data.map((day, index) => (
          <div
            key={index}
            className={`relative p-4 rounded-lg border transition-all ${
              isToday(day.date)
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(day.date)}
              </span>
              <Calendar className="w-4 h-4 text-gray-400" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">P&L</span>
                <span
                  className={`text-sm font-semibold ${
                    day.pnl > 0
                      ? 'text-green-600 dark:text-green-400'
                      : day.pnl < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {formatCurrency(day.pnl)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Trades</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {day.trades}
                </span>
              </div>
            </div>

            {day.pnl !== 0 && (
              <div className="absolute top-2 right-2">
                {day.pnl > 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 