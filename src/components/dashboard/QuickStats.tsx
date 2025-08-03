'use client';

import { TrendingUp, TrendingDown, DollarSign, Target, Activity, BarChart3 } from 'lucide-react';
import { Trade } from '@/types/trade';

interface QuickStatsProps {
  trades: Trade[];
  currentPrices: Record<string, number>;
  lastUpdated: Date;
}

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function StatCard({ title, value, change, changeType = 'neutral', icon, color, bgColor }: StatCardProps) {
  return (
    <div className={`bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 p-4 sm:p-6 transform hover:scale-105 hover:shadow-xl transition-all duration-300`}>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className={`p-2 sm:p-3 rounded-xl ${bgColor}`}>
          <div className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`}>
            {icon}
          </div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
          {change && (
            <span className={`${
              changeType === 'positive' ? 'text-green-600' : 
              changeType === 'negative' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {change}
            </span>
          )}
        </div>
      </div>
      
      <div className="mb-2">
        <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </h3>
      </div>
      
      <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </div>
    </div>
  );
}

export default function QuickStats({ trades, currentPrices, lastUpdated }: QuickStatsProps) {
  const calculateTotalPnL = (): number => {
    return trades.reduce((total, trade) => {
      if (!trade.entryPrice) return total;
      
      const currentPrice = currentPrices[trade.ticker];
      const exitPrice = trade.exitPrice;
      
      if (exitPrice) {
        // Closed trade
        const pnl = (exitPrice - trade.entryPrice) * (trade.shares || 1);
        return total + pnl;
      } else if (currentPrice) {
        // Open trade with current price
        const pnl = (currentPrice - trade.entryPrice) * (trade.shares || 1);
        return total + pnl;
      }
      
      return total;
    }, 0);
  };

  const calculateWinRate = (): number => {
    const closedTrades = trades.filter(trade => trade.exitPrice && trade.entryPrice);
    if (closedTrades.length === 0) return 0;
    
    const winningTrades = closedTrades.filter(trade => 
      (trade.exitPrice! - trade.entryPrice!) > 0
    );
    
    return (winningTrades.length / closedTrades.length) * 100;
  };

  const calculateAverageReturn = (): number => {
    const closedTrades = trades.filter(trade => trade.exitPrice && trade.entryPrice);
    if (closedTrades.length === 0) return 0;
    
    const totalReturn = closedTrades.reduce((total, trade) => {
      const returnPercent = ((trade.exitPrice! - trade.entryPrice!) / trade.entryPrice!) * 100;
      return total + returnPercent;
    }, 0);
    
    return totalReturn / closedTrades.length;
  };

  const getOpenTradesCount = (): number => {
    return trades.filter(trade => !trade.exitDate || !trade.exitPrice).length;
  };

  const totalPnL = calculateTotalPnL();
  const winRate = calculateWinRate();
  const avgReturn = calculateAverageReturn();
  const openTrades = getOpenTradesCount();

  const stats = [
    {
      title: "Total P&L",
      value: `$${totalPnL.toFixed(2)}`,
      change: totalPnL > 0 ? "+" : "",
      changeType: totalPnL > 0 ? 'positive' : totalPnL < 0 ? 'negative' : 'neutral',
      icon: <DollarSign className="w-full h-full" />,
      color: totalPnL > 0 ? "text-green-600" : totalPnL < 0 ? "text-red-600" : "text-gray-600",
      bgColor: totalPnL > 0 ? "bg-green-100 dark:bg-green-900/30" : totalPnL < 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-gray-100 dark:bg-gray-700"
    },
    {
      title: "Win Rate",
      value: `${winRate.toFixed(1)}%`,
      change: winRate > 50 ? "Good" : winRate > 30 ? "Fair" : "Poor",
      changeType: winRate > 50 ? 'positive' : winRate > 30 ? 'neutral' : 'negative',
      icon: <Target className="w-full h-full" />,
      color: winRate > 50 ? "text-green-600" : winRate > 30 ? "text-yellow-600" : "text-red-600",
      bgColor: winRate > 50 ? "bg-green-100 dark:bg-green-900/30" : winRate > 30 ? "bg-yellow-100 dark:bg-yellow-900/30" : "bg-red-100 dark:bg-red-900/30"
    },
    {
      title: "Avg Return",
      value: `${avgReturn.toFixed(2)}%`,
      change: avgReturn > 0 ? "+" : "",
      changeType: avgReturn > 0 ? 'positive' : avgReturn < 0 ? 'negative' : 'neutral',
      icon: <TrendingUp className="w-full h-full" />,
      color: avgReturn > 0 ? "text-green-600" : avgReturn < 0 ? "text-red-600" : "text-gray-600",
      bgColor: avgReturn > 0 ? "bg-green-100 dark:bg-green-900/30" : avgReturn < 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-gray-100 dark:bg-gray-700"
    },
    {
      title: "Open Trades",
      value: openTrades.toString(),
      change: openTrades > 0 ? "Active" : "None",
      changeType: openTrades > 0 ? 'positive' : 'neutral',
      icon: <Activity className="w-full h-full" />,
      color: openTrades > 0 ? "text-blue-600" : "text-gray-600",
      bgColor: openTrades > 0 ? "bg-blue-100 dark:bg-blue-900/30" : "bg-gray-100 dark:bg-gray-700"
    }
  ];

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Quick Stats</h2>
        </div>
        <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs self-start sm:self-auto">
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            changeType={stat.changeType}
            icon={stat.icon}
            color={stat.color}
            bgColor={stat.bgColor}
          />
        ))}
      </div>
    </div>
  );
} 