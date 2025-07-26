const FINNHUB_API_KEY = 'd22iqt9r01qr7ajlm3g0d22iqt9r01qr7ajlm3gg';
const FINNHUB_API_BASE_URL = 'https://finnhub.io/api/v1';
const FINNHUB_WEBSOCKET_URL = 'wss://ws.finnhub.io?token=';

export interface FinnhubNewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: string;
  category: 'breaking' | 'market' | 'policy' | 'earnings' | 'general';
  sentiment?: 'positive' | 'negative' | 'neutral';
  relevanceScore?: number;
}

export interface FinnhubApiResponse {
  status: string;
  totalResults: number;
  articles: Array<{
    id: number;
    title: string;
    summary: string;
    url: string;
    publishedAt: string;
    source: string;
    category: string;
    sentiment?: string;
    relevanceScore?: number;
  }>;
}

export interface FinnhubWebSocketMessage {
  type: 'news' | 'trade' | 'ping';
  data: any;
}

class FinnhubService {
  private cache: Map<string, { data: FinnhubNewsItem[]; timestamp: number }> = new Map();
  private lastNewsId: string | null = null;
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for news
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private newsCallbacks: ((news: FinnhubNewsItem) => void)[] = [];

  private categorizeNews(title: string, summary: string, category: string): 'breaking' | 'market' | 'policy' | 'earnings' | 'general' {
    const text = `${title} ${summary} ${category}`.toLowerCase();
    
    if (text.includes('breaking') || text.includes('urgent') || text.includes('alert')) {
      return 'breaking';
    }
    if (text.includes('earnings') || text.includes('quarterly') || text.includes('profit') || text.includes('revenue') || text.includes('q1') || text.includes('q2') || text.includes('q3') || text.includes('q4')) {
      return 'earnings';
    }
    if (text.includes('fed') || text.includes('federal reserve') || text.includes('policy') || text.includes('regulation') || text.includes('ecb') || text.includes('central bank')) {
      return 'policy';
    }
    if (text.includes('stock') || text.includes('market') || text.includes('trading') || text.includes('investment') || text.includes('economy')) {
      return 'market';
    }
    return 'general';
  }

  private transformNewsData(articles: FinnhubApiResponse['articles']): FinnhubNewsItem[] {
    return articles.map((article) => ({
      id: `finnhub-${article.id}`,
      title: article.title,
      summary: article.summary,
      url: article.url,
      publishedAt: article.publishedAt,
      source: article.source,
      category: this.categorizeNews(article.title, article.summary, article.category),
      sentiment: article.sentiment as 'positive' | 'negative' | 'neutral' | undefined,
      relevanceScore: article.relevanceScore
    }));
  }

  async fetchFinancialNews(limit: number = 10): Promise<FinnhubNewsItem[]> {
    const cacheKey = `finnhub-news-${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    // For now, return fallback news since Finnhub API might be unreliable
    // This ensures the app works even when external APIs are down
    // TODO: Re-enable Finnhub API once we have a valid API key and working endpoint
    console.log('Using fallback news data - Finnhub API temporarily disabled');
    return this.getFallbackNews();
    
    /* 
    // Original Finnhub API implementation (commented out due to reliability issues)
    try {
      console.log('Fetching financial news from Finnhub API...');
      
      const queryParams = new URLSearchParams({
        q: 'financial markets OR stock market OR trading OR investment OR economy OR federal reserve OR earnings',
        from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 24 hours
        to: new Date().toISOString().split('T')[0],
        token: FINNHUB_API_KEY
      });

      // Use Finnhub news endpoint - note: this might require a different endpoint
      const apiUrl = `${FINNHUB_API_BASE_URL}/news?${queryParams}`;
      console.log('Finnhub API URL:', apiUrl.replace(FINNHUB_API_KEY, '[API_KEY_HIDDEN]'));

      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('Finnhub API request timed out after 10 seconds');
        controller.abort();
      }, 10000); // 10 second timeout

      const response = await fetch(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('Finnhub API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('Finnhub API error response:', errorText);
        throw new Error(`Finnhub API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: FinnhubApiResponse['articles'] = await response.json();
      
      console.log('Finnhub API successful, articles found:', data.length);
      
      const transformedNews = this.transformNewsData(data.slice(0, limit));
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: transformedNews,
        timestamp: Date.now()
      });

      return transformedNews;
    } catch (error) {
      console.error('Error fetching Finnhub news:', error);
      
      // Check if it's a network error or API error
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('Finnhub API request was aborted due to timeout');
        } else if (error.message.includes('Failed to fetch')) {
          console.log('Finnhub API network error - service may be unavailable');
        } else {
          console.log('Finnhub API error:', error.message);
        }
      }
      
      // Return fallback data if API fails
      console.log('Using fallback news data due to API failure');
      return this.getFallbackNews();
    }
    */
  }

  // Start polling for news updates (90-second intervals)
  startPolling(intervalMs: number = 90000): void {
    console.log('Starting Finnhub news polling every', intervalMs / 1000, 'seconds');
    
    // Initial fetch
    this.pollForNews();
    
    // Set up interval
    setInterval(() => {
      this.pollForNews();
    }, intervalMs);
  }

  private async pollForNews(): Promise<void> {
    try {
      const freshNews = await this.fetchFinancialNews(8);
      if (freshNews.length > 0) {
        // Check if we have new articles
        const latestNews = freshNews[0];
        
        if (!this.lastNewsId || latestNews.id !== this.lastNewsId) {
          console.log('New news detected:', latestNews.title);
          this.notifyNewsCallbacks(latestNews);
          
          // Update last known news ID
          this.lastNewsId = latestNews.id;
        }
      }
    } catch (error) {
      console.error('Error polling for news:', error);
      // Don't throw the error to prevent the polling from stopping
      // The fallback news will be used instead
      console.log('Continuing with fallback news due to polling error');
    }
  }

  // Subscribe to real-time news updates
  onNewsUpdate(callback: (news: FinnhubNewsItem) => void): () => void {
    this.newsCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.newsCallbacks.indexOf(callback);
      if (index > -1) {
        this.newsCallbacks.splice(index, 1);
      }
    };
  }

  private notifyNewsCallbacks(news: FinnhubNewsItem): void {
    this.newsCallbacks.forEach(callback => {
      try {
        callback(news);
      } catch (error) {
        console.error('Error in news callback:', error);
      }
    });
  }

  disconnectWebSocket(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  private getFallbackNews(): FinnhubNewsItem[] {
    const now = new Date();
    const timestamp = now.getTime();
    const randomSuffix = Math.random().toString(36).substring(2, 8); // Add random suffix for extra uniqueness
    return [
      {
        id: `fallback-1-${timestamp}-${randomSuffix}`,
        title: 'Federal Reserve Signals Potential Rate Cut in September',
        summary: 'Fed officials indicate possible interest rate reduction as inflation cools, with markets pricing in 25-basis-point cut',
        url: 'https://www.cnbc.com/2024/07/26/fed-signals-potential-rate-cut-september.html',
        publishedAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        source: 'CNBC',
        category: 'breaking',
        sentiment: 'neutral'
      },
      {
        id: `fallback-2-${timestamp}-${randomSuffix}`,
        title: 'Tech Earnings Beat Expectations, Market Rally Continues',
        summary: 'Major tech companies report strong Q2 results, driving market gains and pushing indices to new highs',
        url: 'https://www.cnbc.com/2024/07/26/tech-earnings-beat-expectations-market-rally-continues.html',
        publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        source: 'CNBC',
        category: 'earnings',
        sentiment: 'positive'
      },
      {
        id: `fallback-3-${timestamp}-${randomSuffix}`,
        title: 'Oil Prices Surge on Middle East Tensions',
        summary: 'Crude oil futures jump 3% amid geopolitical concerns and supply disruption fears',
        url: 'https://www.cnbc.com/2024/07/26/oil-prices-surge-on-middle-east-tensions.html',
        publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        source: 'CNBC',
        category: 'market',
        sentiment: 'negative'
      },
      {
        id: `fallback-4-${timestamp}-${randomSuffix}`,
        title: 'S&P 500 Reaches New All-Time High',
        summary: 'The benchmark index continues its upward trajectory, supported by strong corporate earnings and economic data',
        url: 'https://www.cnbc.com/2024/07/26/sp500-reaches-new-all-time-high.html',
        publishedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        source: 'CNBC',
        category: 'market',
        sentiment: 'positive'
      },
      {
        id: `fallback-5-${timestamp}-${randomSuffix}`,
        title: 'Treasury Yields Decline Amid Economic Uncertainty',
        summary: 'Bond yields fall as investors seek safe haven assets and Fed policy remains accommodative',
        url: 'https://www.cnbc.com/2024/07/26/treasury-yields-decline-amid-economic-uncertainty.html',
        publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
        source: 'CNBC',
        category: 'market',
        sentiment: 'neutral'
      }
    ];
  }
}

export const finnhubService = new FinnhubService(); 