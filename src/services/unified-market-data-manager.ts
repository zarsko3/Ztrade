import { marketDataOptimizer, OptimizedMarketData } from './market-data-optimizer';

export interface UnifiedMarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
  lastUpdated: string;
  dataQuality: 'live' | 'cached' | 'mock';
  source: 'yahoo' | 'alpha-vantage' | 'cache' | 'fallback';
}

class UnifiedMarketDataManager {
  private static instance: UnifiedMarketDataManager;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private subscribers: Set<(data: UnifiedMarketData[]) => void> = new Set();
  private currentData: Map<string, UnifiedMarketData> = new Map();
  private defaultSymbols = ['^GSPC', 'AAPL', 'GOOGL', 'MSFT', 'TSLA'];
  private isUpdating = false;

  static getInstance(): UnifiedMarketDataManager {
    if (!UnifiedMarketDataManager.instance) {
      UnifiedMarketDataManager.instance = new UnifiedMarketDataManager();
    }
    return UnifiedMarketDataManager.instance;
  }

  /**
   * Initialize the unified data manager
   */
  async initialize(symbols: string[] = []): Promise<void> {
    // If already initialized, return immediately
    if (this.isInitialized) {
      return;
    }

    // If initialization is in progress, wait for it
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Start initialization
    this.initializationPromise = this.performInitialization(symbols);
    await this.initializationPromise;
  }

  private async performInitialization(symbols: string[] = []): Promise<void> {
    try {
      const symbolsToTrack = symbols.length > 0 ? symbols : this.defaultSymbols;
      console.log('Initializing Unified Market Data Manager with symbols:', symbolsToTrack);

      // Initial data fetch
      await this.updateMarketData(symbolsToTrack);

      // Set up unified update interval (90 seconds)
      this.updateInterval = setInterval(async () => {
        await this.updateMarketData(symbolsToTrack);
      }, 90000); // 90 seconds - Yahoo Finance recommended refresh rate

      this.isInitialized = true;
      console.log('Unified Market Data Manager initialized');
    } catch (error) {
      console.error('Failed to initialize Unified Market Data Manager:', error);
      this.isInitialized = false;
      this.initializationPromise = null;
      throw error;
    }
  }

  /**
   * Subscribe to market data updates
   */
  subscribe(callback: (data: UnifiedMarketData[]) => void): () => void {
    this.subscribers.add(callback);
    
    // Immediately send current data to new subscriber
    const currentDataArray = Array.from(this.currentData.values());
    if (currentDataArray.length > 0) {
      callback(currentDataArray);
    }

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Update market data for all tracked symbols
   */
  private async updateMarketData(symbols: string[]): Promise<void> {
    if (this.isUpdating) {
      console.log('Market data update already in progress, skipping...');
      return;
    }

    this.isUpdating = true;
    
    try {
      console.log(`Updating market data for ${symbols.length} symbols`);
      
      // Use the optimized market data service
      const optimizedData = await marketDataOptimizer.getMarketData(symbols);
      
      // Convert to unified format
      const unifiedData: UnifiedMarketData[] = optimizedData.map(data => ({
        symbol: data.symbol,
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        volume: data.volume,
        timestamp: data.timestamp,
        lastUpdated: data.lastUpdated,
        dataQuality: data.dataQuality,
        source: data.source
      }));

      // Update current data
      unifiedData.forEach(data => {
        this.currentData.set(data.symbol, data);
      });

      // Notify all subscribers
      this.notifySubscribers(unifiedData);
      
      console.log(`Market data updated for ${unifiedData.length} symbols`);
    } catch (error) {
      console.error('Error updating market data:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Notify all subscribers of new data
   */
  private notifySubscribers(data: UnifiedMarketData[]): void {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }

  /**
   * Get current market data for specific symbols
   */
  getMarketData(symbols: string[]): UnifiedMarketData[] {
    return symbols
      .map(symbol => this.currentData.get(symbol))
      .filter(Boolean) as UnifiedMarketData[];
  }

  /**
   * Get data for a specific symbol, fetching it if not available
   */
  async getSymbolData(symbol: string): Promise<UnifiedMarketData | null> {
    // Check if we already have the data
    let data = this.currentData.get(symbol);
    
    if (data) {
      return data;
    }

    // If not available, try to fetch it
    console.log(`Symbol ${symbol} not in current data, fetching...`);
    try {
      // Add symbol to tracked symbols
      const currentSymbols = Array.from(this.currentData.keys());
      const updatedSymbols = [...new Set([...currentSymbols, symbol])];
      await this.updateSymbols(updatedSymbols);
      
      // Get the data again
      data = this.currentData.get(symbol);
      return data || null;
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get all current market data
   */
  getAllMarketData(): UnifiedMarketData[] {
    return Array.from(this.currentData.values());
  }

  /**
   * Update symbols to track
   */
  async updateSymbols(symbols: string[]): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize(symbols);
      return;
    }

    // Get current symbols
    const currentSymbols = new Set(this.currentData.keys());
    const newSymbols = new Set(symbols);
    
    // Find symbols to remove
    const symbolsToRemove = Array.from(currentSymbols).filter(symbol => !newSymbols.has(symbol));
    
    // Find symbols to add
    const symbolsToAdd = Array.from(newSymbols).filter(symbol => !currentSymbols.has(symbol));
    
    // Remove symbols no longer being tracked
    for (const symbol of symbolsToRemove) {
      this.currentData.delete(symbol);
    }

    // If we have new symbols to add, fetch their data immediately
    if (symbolsToAdd.length > 0) {
      console.log(`Adding new symbols: ${symbolsToAdd.join(', ')}`);
      try {
        // Fetch data for new symbols only
        const optimizedData = await marketDataOptimizer.getMarketData(symbolsToAdd);
        
        // Convert to unified format and add to current data
        const unifiedData: UnifiedMarketData[] = optimizedData.map(data => ({
          symbol: data.symbol,
          price: data.price,
          change: data.change,
          changePercent: data.changePercent,
          volume: data.volume,
          timestamp: data.timestamp,
          lastUpdated: data.lastUpdated,
          dataQuality: data.dataQuality,
          source: data.source
        }));

        // Update current data with new symbols
        unifiedData.forEach(data => {
          this.currentData.set(data.symbol, data);
        });

        // Notify subscribers of new data
        this.notifySubscribers(unifiedData);
        
        console.log(`Added data for ${unifiedData.length} new symbols`);
      } catch (error) {
        console.error('Error adding new symbols:', error);
        // Even if there's an error, we should still have fallback data from the optimizer
      }
    }
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus() {
    return marketDataOptimizer.getRateLimitStatus();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return marketDataOptimizer.getCacheStats();
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.subscribers.clear();
    this.currentData.clear();
    this.isInitialized = false;
    this.initializationPromise = null; // Reset initialization promise on cleanup
    console.log('Unified Market Data Manager cleaned up');
  }

  /**
   * Check if manager is initialized
   */
  isManagerInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current status
   */
  getStatus(): {
    initialized: boolean;
    isUpdating: boolean;
    trackedSymbols: number;
    subscribers: number;
    lastUpdate: string | null;
  } {
    const lastData = Array.from(this.currentData.values())[0];
    return {
      initialized: this.isInitialized,
      isUpdating: this.isUpdating,
      trackedSymbols: this.currentData.size,
      subscribers: this.subscribers.size,
      lastUpdate: lastData?.timestamp || null
    };
  }
}

export const unifiedMarketDataManager = UnifiedMarketDataManager.getInstance(); 