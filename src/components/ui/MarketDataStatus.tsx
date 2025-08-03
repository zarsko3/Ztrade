'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Wifi, WifiOff } from 'lucide-react';

interface MarketDataStatusProps {
  className?: string;
}

export default function MarketDataStatus({ className = '' }: MarketDataStatusProps) {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const checkMarketDataStatus = async () => {
      try {
        const response = await fetch('/api/market-data/test?symbol=AAPL');
        if (response.ok) {
          setStatus('connected');
          setLastUpdate(new Date());
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Market data status check failed:', error);
        setStatus('error');
      }
    };

    checkMarketDataStatus();
    
    // Check status every 5 minutes
    const interval = setInterval(checkMarketDataStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi className="w-4 h-4" />;
      case 'error':
        return <WifiOff className="w-4 h-4" />;
      default:
        return <TrendingUp className="w-4 h-4 animate-pulse" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Live Market Data';
      case 'error':
        return 'Market Data Unavailable';
      default:
        return 'Connecting...';
    }
  };

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      {getStatusIcon()}
      <span className={getStatusColor()}>
        {getStatusText()}
      </span>
      {lastUpdate && status === 'connected' && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
} 