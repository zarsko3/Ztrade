// Fear & Greed Index service for market sentiment analysis

export interface FearGreedData {
  value: number;
  classification: string;
  timestamp: string;
  previousClose: number;
  previousValue: number;
  previousClassification: string;
}

export interface FearGreedHistory {
  date: string;
  value: number;
  classification: string;
}

export class FearGreedService {
  private static cache: FearGreedData | null = null;
  private static cacheExpiry: number = 0;
  private static readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  // Get current Fear & Greed Index
  static async getCurrentFearGreedIndex(): Promise<FearGreedData> {
    const now = Date.now();
    
    // Check cache first
    if (this.cache && this.cacheExpiry > now) {
      return this.cache;
    }

    try {
      // Use Alternative.me API for Fear & Greed Index
      const response = await fetch('https://api.alternative.me/fng/');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Fear & Greed Index: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
        throw new Error('Invalid Fear & Greed Index data format');
      }

      const currentData = data.data[0];
      const previousData = data.data[1] || currentData;

      const fearGreedData: FearGreedData = {
        value: parseInt(currentData.value),
        classification: currentData.value_classification,
        timestamp: currentData.timestamp,
        previousClose: parseInt(previousData.value),
        previousValue: parseInt(previousData.value),
        previousClassification: previousData.value_classification
      };

      // Cache the data
      this.cache = fearGreedData;
      this.cacheExpiry = now + this.CACHE_DURATION;

      return fearGreedData;
    } catch (error) {
      console.error('Error fetching Fear & Greed Index:', error);
      // Return fallback data if API fails
      return this.getFallbackFearGreedData();
    }
  }

  // Get Fear & Greed Index history
  static async getFearGreedHistory(days: number = 30): Promise<FearGreedHistory[]> {
    try {
      const response = await fetch(`https://api.alternative.me/fng/?limit=${days}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Fear & Greed history: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid Fear & Greed history data format');
      }

      return data.data.map((item: any) => ({
        date: item.timestamp,
        value: parseInt(item.value),
        classification: item.value_classification
      }));
    } catch (error) {
      console.error('Error fetching Fear & Greed history:', error);
      return this.getFallbackFearGreedHistory(days);
    }
  }

  // Get sentiment color based on value
  static getSentimentColor(value: number): string {
    if (value >= 0 && value <= 25) return '#EF4444'; // Extreme Fear - Red
    if (value >= 26 && value <= 45) return '#F97316'; // Fear - Orange
    if (value >= 46 && value <= 55) return '#EAB308'; // Neutral - Yellow
    if (value >= 56 && value <= 75) return '#22C55E'; // Greed - Green
    if (value >= 76 && value <= 100) return '#10B981'; // Extreme Greed - Emerald
    return '#6B7280'; // Default gray
  }

  // Get sentiment icon based on value
  static getSentimentIcon(value: number): string {
    if (value >= 0 && value <= 25) return '😱'; // Extreme Fear
    if (value >= 26 && value <= 45) return '😨'; // Fear
    if (value >= 46 && value <= 55) return '😐'; // Neutral
    if (value >= 56 && value <= 75) return '😏'; // Greed
    if (value >= 76 && value <= 100) return '🤪'; // Extreme Greed
    return '😐'; // Default neutral
  }

  // Get trading recommendation based on Fear & Greed Index
  static getTradingRecommendation(value: number): string {
    if (value >= 0 && value <= 25) {
      return 'Extreme Fear - Consider buying opportunities';
    } else if (value >= 26 && value <= 45) {
      return 'Fear - Look for undervalued stocks';
    } else if (value >= 46 && value <= 55) {
      return 'Neutral - Market is balanced';
    } else if (value >= 56 && value <= 75) {
      return 'Greed - Be cautious with new positions';
    } else if (value >= 76 && value <= 100) {
      return 'Extreme Greed - Consider taking profits';
    }
    return 'Market sentiment unclear';
  }

  // Calculate sentiment change
  static calculateSentimentChange(current: number, previous: number): {
    change: number;
    direction: 'up' | 'down' | 'unchanged';
    percentage: number;
  } {
    const change = current - previous;
    const percentage = previous > 0 ? (change / previous) * 100 : 0;
    
    return {
      change,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'unchanged',
      percentage: Math.abs(percentage)
    };
  }

  // Fallback data when API is unavailable
  private static getFallbackFearGreedData(): FearGreedData {
    const mockValue = Math.floor(Math.random() * 100) + 1;
    const mockPrevious = Math.max(1, mockValue + (Math.random() > 0.5 ? 5 : -5));
    
    return {
      value: mockValue,
      classification: this.getValueClassification(mockValue),
      timestamp: new Date().toISOString(),
      previousClose: mockPrevious,
      previousValue: mockPrevious,
      previousClassification: this.getValueClassification(mockPrevious)
    };
  }

  // Fallback history data
  private static getFallbackFearGreedHistory(days: number): FearGreedHistory[] {
    const history: FearGreedHistory[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const value = Math.floor(Math.random() * 100) + 1;
      history.push({
        date: date.toISOString().split('T')[0],
        value,
        classification: this.getValueClassification(value)
      });
    }
    
    return history;
  }

  // Helper method to get value classification
  private static getValueClassification(value: number): string {
    if (value >= 0 && value <= 25) return 'Extreme Fear';
    if (value >= 26 && value <= 45) return 'Fear';
    if (value >= 46 && value <= 55) return 'Neutral';
    if (value >= 56 && value <= 75) return 'Greed';
    if (value >= 76 && value <= 100) return 'Extreme Greed';
    return 'Neutral';
  }

  // Clear cache
  static clearCache(): void {
    this.cache = null;
    this.cacheExpiry = 0;
  }
} 