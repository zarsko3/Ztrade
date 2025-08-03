import { useEffect, useState, useCallback, useRef } from 'react';
import { websocketService, RealTimeMarketData, TradeUpdate, PerformanceUpdate } from '@/services/websocket-service';

export interface UseWebSocketOptions {
  autoConnect?: boolean;
  marketDataSymbols?: string[];
  enableTradeUpdates?: boolean;
  enablePerformanceUpdates?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    autoConnect = true,
    marketDataSymbols = [],
    enableTradeUpdates = true,
    enablePerformanceUpdates = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [marketData, setMarketData] = useState<RealTimeMarketData[]>([]);
  const [tradeUpdates, setTradeUpdates] = useState<TradeUpdate[]>([]);
  const [performanceUpdates, setPerformanceUpdates] = useState<PerformanceUpdate | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  const marketDataRef = useRef<RealTimeMarketData[]>([]);
  const tradeUpdatesRef = useRef<TradeUpdate[]>([]);

  // Update refs when state changes
  useEffect(() => {
    marketDataRef.current = marketData;
  }, [marketData]);

  useEffect(() => {
    tradeUpdatesRef.current = tradeUpdates;
  }, [tradeUpdates]);

  // Connection status management
  const updateConnectionStatus = useCallback((status: 'connecting' | 'connected' | 'disconnected' | 'error') => {
    setConnectionStatus(status);
    setIsConnected(status === 'connected');
  }, []);

  // Market data handlers
  const handleMarketDataUpdate = useCallback((data: RealTimeMarketData[]) => {
    setMarketData(prevData => {
      const newData = [...prevData];
      
      data.forEach(update => {
        const existingIndex = newData.findIndex(item => item.symbol === update.symbol);
        if (existingIndex >= 0) {
          newData[existingIndex] = update;
        } else {
          newData.push(update);
        }
      });
      
      return newData;
    });
  }, []);

  // Trade update handlers
  const handleTradeUpdate = useCallback((update: TradeUpdate) => {
    setTradeUpdates(prevUpdates => {
      const newUpdates = [update, ...prevUpdates.slice(0, 9)]; // Keep last 10 updates
      return newUpdates;
    });
  }, []);

  // Performance update handlers
  const handlePerformanceUpdate = useCallback((update: PerformanceUpdate) => {
    setPerformanceUpdates(update);
  }, []);

  // Subscribe to market data
  const subscribeToMarketData = useCallback(async (symbols: string[]) => {
    try {
      await websocketService.subscribeToMarketData(symbols);
    } catch (error) {
      console.error('Error subscribing to market data:', error);
    }
  }, []);

  // Emit trade update
  const emitTradeUpdate = useCallback((update: TradeUpdate) => {
    websocketService.emitTradeUpdate(update);
  }, []);

  // Emit performance update
  const emitPerformanceUpdate = useCallback((update: PerformanceUpdate) => {
    websocketService.emitPerformanceUpdate(update);
  }, []);

  // Initialize WebSocket connection and event listeners
  useEffect(() => {
    if (!autoConnect) return;

    updateConnectionStatus('connecting');

    // Set up event listeners
    websocketService.onMarketDataUpdate(handleMarketDataUpdate);
    websocketService.onTradeUpdate(handleTradeUpdate);
    websocketService.onPerformanceUpdate(handlePerformanceUpdate);

    // Set up connection status listener
    websocketService.onConnectionChange((connected) => {
      updateConnectionStatus(connected ? 'connected' : 'disconnected');
    });

    // Subscribe to channels if symbols are provided
    if (marketDataSymbols.length > 0) {
      subscribeToMarketData(marketDataSymbols);
    }

    if (enableTradeUpdates) {
      websocketService.subscribeToTradeUpdates();
    }

    if (enablePerformanceUpdates) {
      websocketService.subscribeToPerformanceUpdates();
    }

    // Cleanup function
    return () => {
      // Note: We don't disconnect the socket here as it's a singleton
      // that should persist across component unmounts
    };
  }, [autoConnect, marketDataSymbols, enableTradeUpdates, enablePerformanceUpdates]);

  // Update subscriptions when symbols change
  useEffect(() => {
    if (isConnected && marketDataSymbols.length > 0) {
      subscribeToMarketData(marketDataSymbols);
    }
  }, [isConnected, marketDataSymbols, subscribeToMarketData]);

  // Manual connection management
  const connect = useCallback(() => {
    updateConnectionStatus('connecting');
    // The socket auto-connects, so we just need to wait for the connection event
  }, [updateConnectionStatus]);

  const disconnect = useCallback(() => {
    websocketService.disconnect();
    updateConnectionStatus('disconnected');
  }, [updateConnectionStatus]);

  // Utility functions
  const getMarketDataForSymbol = useCallback((symbol: string) => {
    return marketData.find(data => data.symbol === symbol);
  }, [marketData]);

  const clearTradeUpdates = useCallback(() => {
    setTradeUpdates([]);
  }, []);

  return {
    // Connection state
    isConnected,
    connectionStatus,
    
    // Data
    marketData,
    tradeUpdates,
    performanceUpdates,
    
    // Actions
    connect,
    disconnect,
    subscribeToMarketData,
    emitTradeUpdate,
    emitPerformanceUpdate,
    
    // Utilities
    getMarketDataForSymbol,
    clearTradeUpdates,
  };
} 