'use client';

import { useState } from 'react';
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
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ComposedChart
} from 'recharts';
import { TrendingUp, BarChart3, PieChartIcon, Activity, Calendar } from 'lucide-react';

interface PerformanceData {
  period: string;
  totalPnL: number;
  cumulativePnL: number;
  trades: number;
  winRate: number;
  date?: string;
  month?: string;
  year?: number;
}

interface TickerPerformance {
  ticker: string;
  pnl: number;
  trades: number;
  winRate: number;
  color: string;
}

interface DrawdownData {
  period: string;
  drawdown: number;
  underwater: number;
}

interface PerformanceChartsProps {
  data: PerformanceData[];
  tickerData?: TickerPerformance[];
  drawdownData?: DrawdownData[];
  chartType?: 'line' | 'area' | 'bar' | 'composed';
  showCumulative?: boolean;
  showDrawdown?: boolean;
  height?: number;
  timeframe?: 'weekly' | 'monthly' | 'yearly';
}

export default function PerformanceCharts({
  data,
  tickerData = [],
  drawdownData = [],
  chartType = 'composed',
  showCumulative = true,
  showDrawdown = false,
  height = 400,
  timeframe = 'monthly'
}: PerformanceChartsProps) {
  const [selectedChart, setSelectedChart] = useState(chartType);
  const [activeMetric, setActiveMetric] = useState<'pnl' | 'winRate' | 'trades'>('pnl');

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

  const formatPeriod = (period: string, timeframe: string) => {
    switch (timeframe) {
      case 'weekly':
        return `Week ${period.split('-')[1]}`;
      case 'monthly':
        const [year, month] = period.split('-');
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { 
          month: 'short', 
          year: '2-digit' 
        });
      case 'yearly':
        return period;
      default:
        return period;
    }
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {formatPeriod(label, timeframe)}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <div 
                className="w-3 h-3 rounded"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600 dark:text-gray-400">{entry.name}:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {entry.name.includes('Rate') || entry.name.includes('%') ? 
                  formatPercentage(entry.value) : 
                  entry.name.includes('P&L') || entry.name.includes('$') ? 
                    formatCurrency(entry.value) : 
                    entry.value
                }
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Performance over time chart
  const renderPerformanceChart = () => {
    switch (selectedChart) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatPeriod(value, timeframe)}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="totalPnL" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Period P&L"
                dot={{ r: 4 }}
              />
              {showCumulative && (
                <Line 
                  type="monotone" 
                  dataKey="cumulativePnL" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Cumulative P&L"
                  dot={{ r: 4 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatPeriod(value, timeframe)}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="totalPnL" 
                stroke="#3b82f6" 
                fillOpacity={0.3}
                fill="#3b82f6"
                name="Period P&L"
              />
              {showCumulative && (
                <Area 
                  type="monotone" 
                  dataKey="cumulativePnL" 
                  stroke="#10b981" 
                  fillOpacity={0.3}
                  fill="#10b981"
                  name="Cumulative P&L"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatPeriod(value, timeframe)}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
                             <Bar 
                 dataKey="totalPnL" 
                 name="Period P&L"
               >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.totalPnL >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'composed':
      default:
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatPeriod(value, timeframe)}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="totalPnL" 
                name="Period P&L"
                fill="#3b82f6"
                fillOpacity={0.8}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.totalPnL >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
              {showCumulative && (
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="cumulativePnL" 
                  stroke="#f59e0b" 
                  strokeWidth={3}
                  name="Cumulative P&L"
                  dot={{ r: 4 }}
                />
              )}
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="winRate" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Win Rate %"
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        );
    }
  };

  // Ticker performance pie chart
  const renderTickerChart = () => {
    if (!tickerData.length) return null;

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={tickerData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ ticker, pnl }) => `${ticker}: ${formatCurrency(pnl)}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="pnl"
          >
            {tickerData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: any, name: string) => [
              name === 'pnl' ? formatCurrency(value) : 
              name === 'winRate' ? formatPercentage(value) : value,
              name
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Drawdown chart
  const renderDrawdownChart = () => {
    if (!drawdownData.length) return null;

    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={drawdownData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis dataKey="period" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="drawdown" 
            stroke="#ef4444" 
            fillOpacity={0.6}
            fill="#ef4444"
            name="Drawdown"
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const chartTabs = [
    { id: 'composed', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'line', label: 'Line', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'area', label: 'Area', icon: <Activity className="w-4 h-4" /> },
    { id: 'bar', label: 'Bar', icon: <Calendar className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Chart Type:</span>
          <div className="flex items-center space-x-1">
            {chartTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedChart(tab.id as any)}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors
                  ${selectedChart === tab.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showCumulative}
              onChange={(e) => setSelectedChart(prev => prev)} // Placeholder for state update
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Show Cumulative</span>
          </label>
        </div>
      </div>

      {/* Main Performance Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Performance Over Time ({timeframe})
          </h3>
        </div>
        {renderPerformanceChart()}
      </div>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticker Performance */}
        {tickerData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 mb-4">
              <PieChartIcon className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Performance by Ticker
              </h3>
            </div>
            {renderTickerChart()}
          </div>
        )}

        {/* Drawdown Chart */}
        {showDrawdown && drawdownData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 mb-4">
              <Activity className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Drawdown Analysis
              </h3>
            </div>
            {renderDrawdownChart()}
          </div>
        )}
      </div>
    </div>
  );
} 