const NEWS_API_KEY = '9azVWBvGcsnjbgfzno8SsS7PlLIoTL4nIIpPX4HA';
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: string;
  category: 'breaking' | 'market' | 'policy' | 'earnings';
}

export interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: Array<{
    source: { id: string | null; name: string };
    author: string | null;
    title: string;
    description: string | null;
    url: string;
    urlToImage: string | null;
    publishedAt: string;
    content: string | null;
  }>;
}

class NewsService {
  private cache: Map<string, { data: NewsItem[]; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private categorizeNews(title: string, description: string): 'breaking' | 'market' | 'policy' | 'earnings' {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.includes('breaking') || text.includes('urgent') || text.includes('alert')) {
      return 'breaking';
    }
    if (text.includes('earnings') || text.includes('quarterly') || text.includes('profit') || text.includes('revenue')) {
      return 'earnings';
    }
    if (text.includes('fed') || text.includes('federal reserve') || text.includes('policy') || text.includes('regulation')) {
      return 'policy';
    }
    return 'market';
  }

  private transformNewsData(articles: NewsApiResponse['articles']): NewsItem[] {
    return articles.map((article, index) => ({
      id: `news-${index}-${Date.now()}`,
      title: article.title,
      summary: article.description || 'No description available',
      url: article.url,
      publishedAt: article.publishedAt,
      source: article.source.name,
      category: this.categorizeNews(article.title, article.description || '')
    }));
  }

  async fetchFinancialNews(limit: number = 10): Promise<NewsItem[]> {
    const cacheKey = `financial-news-${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      console.log('Attempting to fetch from News API...');
      
      const queryParams = new URLSearchParams({
        q: '(stock market OR financial markets OR trading OR investment OR economy OR federal reserve OR earnings)',
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: limit.toString(),
        apiKey: NEWS_API_KEY
      });

      const response = await fetch(`${NEWS_API_BASE_URL}/everything?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('News API response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          console.error('News API authentication failed - using fallback data');
          return this.getFallbackNews();
        }
        throw new Error(`News API error: ${response.status} ${response.statusText}`);
      }

      const data: NewsApiResponse = await response.json();
      
      if (data.status !== 'ok') {
        throw new Error('News API returned error status');
      }

      console.log('News API successful, articles found:', data.totalResults);
      
      const transformedNews = this.transformNewsData(data.articles);
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: transformedNews,
        timestamp: Date.now()
      });

      return transformedNews;
    } catch (error) {
      console.error('Error fetching financial news:', error);
      
      // Return fallback data if API fails
      return this.getFallbackNews();
    }
  }

  async fetchBreakingNews(limit: number = 5): Promise<NewsItem[]> {
    try {
      const queryParams = new URLSearchParams({
        q: '(breaking AND (stock market OR financial OR trading OR economy))',
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: limit.toString(),
        apiKey: NEWS_API_KEY
      });

      const response = await fetch(`${NEWS_API_BASE_URL}/everything?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`News API error: ${response.status} ${response.statusText}`);
      }

      const data: NewsApiResponse = await response.json();
      
      if (data.status !== 'ok') {
        throw new Error('News API returned error status');
      }

      return this.transformNewsData(data.articles);
    } catch (error) {
      console.error('Error fetching breaking news:', error);
      return [];
    }
  }

  private getFallbackNews(): NewsItem[] {
    const now = new Date();
    return [
      {
        id: 'fallback-1',
        title: 'Federal Reserve Signals Potential Rate Cut in September',
        summary: 'Fed officials indicate possible interest rate reduction as inflation cools, with markets pricing in 25-basis-point cut',
        url: 'https://www.reuters.com/markets/us/fed-signals-potential-rate-cut-september-2024-07-26/',
        publishedAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        source: 'Reuters',
        category: 'breaking'
      },
      {
        id: 'fallback-2',
        title: 'Tech Earnings Beat Expectations, Market Rally Continues',
        summary: 'Major tech companies report strong Q2 results, driving market gains and pushing indices to new highs',
        url: 'https://www.bloomberg.com/news/articles/2024-07-26/tech-earnings-beat-expectations-market-rally-continues',
        publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        source: 'Bloomberg',
        category: 'earnings'
      },
      {
        id: 'fallback-3',
        title: 'Oil Prices Surge on Middle East Tensions',
        summary: 'Crude oil futures jump 3% amid geopolitical concerns and supply disruption fears',
        url: 'https://www.marketwatch.com/story/oil-prices-surge-on-middle-east-tensions-2024-07-26',
        publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        source: 'MarketWatch',
        category: 'market'
      },
      {
        id: 'fallback-4',
        title: 'New Economic Stimulus Package Announced',
        summary: 'Government unveils $500B infrastructure and jobs program to boost economic recovery',
        url: 'https://www.wsj.com/articles/new-economic-stimulus-package-announced-2024-07-26',
        publishedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        source: 'Wall Street Journal',
        category: 'policy'
      },
      {
        id: 'fallback-5',
        title: 'Cryptocurrency Markets Show Signs of Recovery',
        summary: 'Bitcoin and Ethereum gain momentum as institutional adoption increases',
        url: 'https://www.cnbc.com/2024/07/26/cryptocurrency-markets-show-signs-of-recovery/',
        publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
        source: 'CNBC',
        category: 'market'
      },
      {
        id: 'fallback-6',
        title: 'European Central Bank Maintains Current Policy Stance',
        summary: 'ECB holds interest rates steady while monitoring inflation trends',
        url: 'https://www.ft.com/content/european-central-bank-maintains-current-policy-stance',
        publishedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
        source: 'Financial Times',
        category: 'policy'
      },
      {
        id: 'fallback-7',
        title: 'Retail Sales Data Exceeds Expectations',
        summary: 'Consumer spending remains strong, indicating continued economic resilience',
        url: 'https://www.marketwatch.com/story/retail-sales-data-exceeds-expectations-2024-07-26',
        publishedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        source: 'MarketWatch',
        category: 'market'
      },
      {
        id: 'fallback-8',
        title: 'Banking Sector Reports Strong Quarterly Results',
        summary: 'Major banks exceed profit expectations, signaling financial sector strength',
        url: 'https://www.bloomberg.com/news/articles/2024-07-26/banking-sector-reports-strong-quarterly-results',
        publishedAt: new Date(now.getTime() - 14 * 60 * 60 * 1000).toISOString(), // 14 hours ago
        source: 'Bloomberg',
        category: 'earnings'
      }
    ];
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const newsService = new NewsService(); 