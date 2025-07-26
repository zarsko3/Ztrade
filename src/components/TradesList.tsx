'use client';

import { useState, useEffect } from 'react';
import { SP500Service } from '@/services/sp500-service';

interface Trade {
  id: number;
  ticker: string;
  entryDate: string;
  entryPrice: number;
  exitDate?: string | null;
  exitPrice?: number | null;
  quantity: number;
  notes?: string | null;
}

export default function TradesList() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [benchmarks, setBenchmarks] = useState<{[key: number]: any}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrades() {
      try {
        const response = await fetch('/api/trades');
        const result = await response.json();
        
        if (result.status === 'success') {
          setTrades(result.data);
          
          // Calculate benchmarks for closed trades
          const benchmarkData: {[key: number]: any} = {};
          for (const trade of result.data || []) {
            if (trade.exitPrice && trade.exitDate) {
              const benchmark = await calculateBenchmark(trade);
              if (benchmark) {
                benchmarkData[trade.id] = benchmark;
              }
            }
          }
          setBenchmarks(benchmarkData);
        } else {
          setError(result.message || 'Failed to fetch trades');
        }
      } catch (err) {
        setError('Error fetching trades: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setLoading(false);
      }
    }

    fetchTrades();
  }, []);

  // Calculate profit/loss for a trade
  const calculateProfitLoss = (trade: Trade) => {
    if (!trade.exitPrice) return null;
    const totalEntry = trade.entryPrice * trade.quantity;
    const totalExit = trade.exitPrice * trade.quantity;
    return totalExit - totalEntry;
  };

  // Calculate S&P 500 benchmark for a trade
  const calculateBenchmark = async (trade: Trade) => {
    if (!trade.exitPrice || !trade.exitDate) return null;
    
    const totalEntry = trade.entryPrice * trade.quantity;
    const totalExit = trade.exitPrice * trade.quantity;
    const tradeReturn = ((totalExit - totalEntry) / totalEntry) * 100;
    
    try {
      const sp500Return = await SP500Service.calculateSP500Return(trade.entryDate, trade.exitDate);
      const alpha = tradeReturn - sp500Return;
      
      return {
        tradeReturn,
        sp500Return,
        alpha,
        outperformance: alpha > 0
      };
    } catch (error) {
      console.error('Error calculating S&P 500 benchmark:', error);
      return null;
    }
  };

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div className="text-center p-4">Loading trades...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 p-4">{error}</div>;
  }

  if (trades.length === 0) {
    return <div className="text-center p-4">No trades found. Add your first trade to get started.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            <th className="py-2 px-4 text-left">Ticker</th>
            <th className="py-2 px-4 text-left">Entry Date</th>
            <th className="py-2 px-4 text-left">Entry Price</th>
            <th className="py-2 px-4 text-left">Exit Date</th>
            <th className="py-2 px-4 text-left">Exit Price</th>
            <th className="py-2 px-4 text-left">Quantity</th>
            <th className="py-2 px-4 text-left">P/L</th>
            <th className="py-2 px-4 text-left">vs S&P 500</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => {
            const profitLoss = calculateProfitLoss(trade);
            const benchmark = benchmarks[trade.id];
            const isProfitable = profitLoss !== null && profitLoss > 0;
            const isLoss = profitLoss !== null && profitLoss < 0;
            
            return (
              <tr key={trade.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                <td className="py-2 px-4 font-medium">{trade.ticker}</td>
                <td className="py-2 px-4">{formatDate(trade.entryDate)}</td>
                <td className="py-2 px-4">${trade.entryPrice.toFixed(2)}</td>
                <td className="py-2 px-4">{formatDate(trade.exitDate)}</td>
                <td className="py-2 px-4">
                  {trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : 'N/A'}
                </td>
                <td className="py-2 px-4">{trade.quantity}</td>
                <td className={`py-2 px-4 ${isProfitable ? 'text-green-600 dark:text-green-400' : ''} ${isLoss ? 'text-red-600 dark:text-red-400' : ''}`}>
                  {profitLoss !== null ? `$${profitLoss.toFixed(2)}` : 'Open'}
                </td>
                <td className="py-2 px-4">
                  {benchmark ? (
                    <div className="text-sm">
                      <div className={`font-medium ${benchmark.outperformance ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {benchmark.alpha > 0 ? '+' : ''}{benchmark.alpha.toFixed(2)}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        S&P: {benchmark.sp500Return.toFixed(2)}%
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400">Open</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
} 