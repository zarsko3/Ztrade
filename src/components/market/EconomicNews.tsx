'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, ExternalLink, Clock, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { finnhubService, FinnhubNewsItem } from '@/services/finnhub-service';

export function EconomicNews() {
  const [news, setNews] = useState<FinnhubNewsItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);

  // Fetch real financial news from Finnhub API and setup WebSocket
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching financial news from Finnhub API...');
        
        const financialNews = await finnhubService.fetchFinancialNews(8);
        console.log('News fetched successfully:', {
          count: financialNews.length,
          firstArticle: financialNews[0]?.title,
          sources: financialNews.map((n: FinnhubNewsItem) => n.source)
        });
        
        setNews(financialNews);
      } catch (error) {
        console.error('Error fetching news:', error);
        // The service should return fallback news, but if it doesn't, show empty state
        setNews([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();

    // Start polling for news updates (90-second intervals)
    finnhubService.startPolling(90000); // 90 seconds
    
    // Subscribe to news updates
    const unsubscribe = finnhubService.onNewsUpdate((newNews) => {
      console.log('New news received:', newNews.title);
      setNews(prevNews => [newNews, ...prevNews.slice(0, 7)]); // Keep max 8 articles
      setIsWebSocketConnected(true);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      finnhubService.clearCache(); // Clear cache to get fresh data
      const freshNews = await finnhubService.fetchFinancialNews(8);
      setNews(freshNews);
    } catch (error) {
      console.error('Error refreshing news:', error);
      // The service should return fallback news, but if it doesn't, keep current news
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewsClick = (url: string) => {
    try {
      // Clean and validate the URL
      let cleanUrl = url.trim();
      
      // Ensure URL has protocol
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = 'https://' + cleanUrl;
      }
      
      // Validate URL format
      const urlObj = new URL(cleanUrl);
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        console.error('Invalid URL protocol:', cleanUrl);
        alert('Invalid article URL. Please try again later.');
        return;
      }
      
      // Check if URL is from a known news source
      const validDomains = [
        'cnbc.com', 'reuters.com', 'bloomberg.com', 'marketwatch.com', 
        'wsj.com', 'ft.com', 'yahoo.com', 'finance.yahoo.com',
        'seekingalpha.com', 'investing.com', 'tradingview.com'
      ];
      
      const domain = urlObj.hostname.toLowerCase();
      const isValidDomain = validDomains.some(validDomain => 
        domain.includes(validDomain) || domain.endsWith('.' + validDomain)
      );
      
      if (!isValidDomain) {
        console.warn('URL from unknown domain:', domain);
        // Still allow opening, but log a warning
      }
      
      // Open in new tab with proper security attributes
      const newWindow = window.open(cleanUrl, '_blank', 'noopener,noreferrer');
      
      // Check if popup was blocked
      if (!newWindow) {
        alert('Popup blocked. Please allow popups for this site or right-click and select "Open in new tab".');
        return;
      }
      
      // Add error handling for the opened window
      newWindow.onerror = () => {
        console.error('Error loading article:', cleanUrl);
        alert('Unable to load article. The external site may be temporarily unavailable.');
      };
      
      console.log('Opening news article:', cleanUrl);
      
    } catch (error) {
      console.error('Error opening news article:', error);
      alert('Unable to open article. Please try again later.');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'breaking':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'market':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'policy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'earnings':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Economic News</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh news"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>
        <div className="p-3">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <TrendingUp className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Economic News</h3>
          <div className="flex items-center space-x-1">
            {isWebSocketConnected ? (
              <div title="Auto-refresh active (90s)">
                <Wifi className="w-4 h-4 text-green-500" />
              </div>
            ) : (
              <div title="Auto-refresh inactive">
                <WifiOff className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh news"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading financial news...</span>
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Unable to load financial news</p>
              <button
                onClick={handleRefresh}
                className="mt-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
              {news.slice(0, 3).map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  onClick={() => handleNewsClick(item.url)}
                  className="group cursor-pointer p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200"
                  title="Click to read full article (opens in new tab)"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(item.category)}`}>
                          {item.category.toUpperCase()}
                        </span>
                        {item.sentiment && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.sentiment === 'positive' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                            item.sentiment === 'negative' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}>
                            {item.sentiment.toUpperCase()}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(item.publishedAt)}
                        </span>
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-1">
                        {item.summary}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {item.source}
                        </span>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-blue-600 dark:text-blue-400">
                            External
                          </span>
                          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                          {!item.url.startsWith('http') && (
                            <span className="text-xs text-yellow-600 dark:text-yellow-400 ml-1">
                              (Demo)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {news.length > 3 && (
                <div className="text-center py-2 text-sm text-gray-500 dark:text-gray-400">
                  Scroll to see {news.length - 3} more articles
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 