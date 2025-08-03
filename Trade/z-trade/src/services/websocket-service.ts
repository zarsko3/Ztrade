// Import Socket.IO - using require to avoid type conflicts
const { io } = require('socket.io-client');

// Import unified market data manager
import { unifiedMarketDataManager, UnifiedMarketData } from './unified-market-data-manager';

export interface RealTimeMarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
}

export interface TradeUpdate {
  id: string;
  action: 'created' | 'updated' | 'closed' | 'deleted';
  trade: any;
  timestamp: string;
}

export interface PerformanceUpdate {
  totalReturn: number;
  totalReturnPercent: number;
  winRate: number;
  totalTrades: number;
  openTrades: number;
  timestamp: string;
}

class WebSocketService {
  private socket: any = null;
  private marketDataInterval: NodeJS.Timeout | null = null;
  private marketDataUnsubscribe: (() => void) | null = null;
  private subscribedSymbols: string[] = [];
  private isConnected = false;
  private connectionCallbacks: ((connected: boolean) => void)[] = [];

  constructor() {
    // Delay initialization to ensure server is ready
    setTimeout(() => {
      this.initializeSocket();
    }, 1000);
  }

  private initializeSocket() {
    console.log('Initializing WebSocket connection...');
    
    this.socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      transports: ['polling'], // Start with polling only for better compatibility
      autoConnect: true,
      timeout: 5000, // 5 second connection timeout
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 2,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.notifyConnectionChange(true);
      this.resubscribeToChannels();
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.isConnected = false;
      this.notifyConnectionChange(false);
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('WebSocket connection error:', error);
      this.isConnected = false;
      this.notifyConnectionChange(false);
    });

    this.socket.on('connect_timeout', () => {
      console.error('WebSocket connection timeout');
      this.isConnected = false;
      this.notifyConnectionChange(false);
    });
  }

  private resubscribeToChannels() {
    if (this.subscribedSymbols.length > 0) {
      this.subscribeToMarketData(this.subscribedSymbols);
    }
    this.subscribeToTradeUpdates();
    this.subscribeToPerformanceUpdates();
  }

  // Connection status management
  private notifyConnectionChange(connected: boolean) {
    this.connectionCallbacks.forEach(callback => callback(connected));
  }

  // Market Data Methods
  async subscribeToMarketData(symbols: string[]) {
    if (!this.socket) return;

    this.subscribedSymbols = symbols;
    this.socket.emit('subscribe-market-data', symbols);

    // Start real-time market data updates
    this.startMarketDataUpdates(symbols);
  }

  private async startMarketDataUpdates(symbols: string[]) {
    if (this.marketDataInterval) {
      clearInterval(this.marketDataInterval);
    }

    // Initialize unified market data manager
    await unifiedMarketDataManager.initialize(symbols);

    // Subscribe to unified market data updates
    const unsubscribe = unifiedMarketDataManager.subscribe((data: UnifiedMarketData[]) => {
      this.emitMarketDataUpdate(data);
    });

    // Store unsubscribe function for cleanup
    this.marketDataUnsubscribe = unsubscribe;
  }

  private emitMarketDataUpdate(data: UnifiedMarketData[]) {
    if (!this.socket) return;

    // Convert to RealTimeMarketData format
    const marketData: (RealTimeMarketData & { error?: boolean; mock?: boolean; dataQuality?: string; source?: string })[] = data.map(item => ({
      symbol: item.symbol,
      price: item.price,
      change: item.change,
      changePercent: item.changePercent,
      volume: item.volume,
      timestamp: item.timestamp,
      error: item.dataQuality === 'mock',
      mock: item.dataQuality === 'mock',
      dataQuality: item.dataQuality,
      source: item.source
    }));
    
    if (marketData.length > 0) {
      console.log(`Emitting ${marketData.length} market data updates via WebSocket`);
      this.socket.emit('market-data-update', marketData);
    }
  }

  // Trade Updates Methods
  subscribeToTradeUpdates() {
    if (!this.socket) return;
    this.socket.emit('subscribe-trade-updates');
  }

  emitTradeUpdate(update: TradeUpdate) {
    if (!this.socket) return;
    this.socket.emit('trade-update', update);
  }

  // Performance Updates Methods
  subscribeToPerformanceUpdates() {
    if (!this.socket) return;
    this.socket.emit('subscribe-performance-updates');
  }

  emitPerformanceUpdate(update: PerformanceUpdate) {
    if (!this.socket) return;
    this.socket.emit('performance-update', update);
  }

  // Event Listeners
  onMarketDataUpdate(callback: (data: RealTimeMarketData[]) => void) {
    if (!this.socket) return;
    this.socket.on('market-data-update', callback);
  }

  onTradeUpdate(callback: (update: TradeUpdate) => void) {
    if (!this.socket) return;
    this.socket.on('trade-update', callback);
  }

  onPerformanceUpdate(callback: (update: PerformanceUpdate) => void) {
    if (!this.socket) return;
    this.socket.on('performance-update', callback);
  }

  // Cleanup
  disconnect() {
    if (this.marketDataInterval) {
      clearInterval(this.marketDataInterval);
      this.marketDataInterval = null;
    }

    if (this.marketDataUnsubscribe) {
      this.marketDataUnsubscribe();
      this.marketDataUnsubscribe = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnected = false;
    this.notifyConnectionChange(false);
  }

  onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionCallbacks.push(callback);
    // Immediately call with current status
    callback(this.isConnected);
  }

  // Utility methods
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected;
  }

  getSubscribedSymbols(): string[] {
    return [...this.subscribedSymbols];
  }

  private getMockPrice(symbol: string): number {
    // Return realistic mock prices for common symbols
    const mockPrices: { [key: string]: number } = {
      '^GSPC': 5000, // S&P 500
      'AAPL': 180,
      'GOOGL': 140,
      'MSFT': 400,
      'TSLA': 250,
      'AMZN': 150,
      'NVDA': 800,
      'META': 300,
    };
    
    return mockPrices[symbol] || 100; // Default price for unknown symbols
  }
}

// Export singleton instance
export const websocketService = new WebSocketService(); 