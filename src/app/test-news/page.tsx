'use client';

import { useState, useEffect } from 'react';
import { finnhubService, FinnhubNewsItem } from '@/services/finnhub-service';

export default function TestNewsPage() {
  const [news, setNews] = useState<FinnhubNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const financialNews = await finnhubService.fetchFinancialNews(5);
      setNews(financialNews);
      
      // Test each URL
      testNewsUrls(financialNews);
      
    } catch (error) {
      console.error('Error fetching news:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const testNewsUrls = async (newsItems: FinnhubNewsItem[]) => {
    const results: string[] = [];
    
    for (const item of newsItems) {
      try {
        // Test URL format
        const url = new URL(item.url);
        results.push(`✅ ${item.title}: Valid URL (${url.hostname})`);
        
        // Test if URL is accessible (head request)
        try {
          const response = await fetch(item.url, { method: 'HEAD', mode: 'no-cors' });
          results.push(`✅ ${item.title}: URL accessible`);
        } catch (fetchError) {
          results.push(`⚠️ ${item.title}: URL may not be accessible (CORS or network issue)`);
        }
        
      } catch (urlError) {
        results.push(`❌ ${item.title}: Invalid URL format`);
      }
    }
    
    setTestResults(results);
  };

  const handleNewsClick = (url: string, title: string) => {
    try {
      const urlObj = new URL(url);
      console.log(`Opening article: ${title} at ${url}`);
      
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      
      if (!newWindow) {
        alert('Popup blocked. Please allow popups or right-click and select "Open in new tab".');
        return;
      }
      
      // Log success
      console.log(`Successfully opened: ${title}`);
      
    } catch (error) {
      console.error('Error opening news article:', error);
      alert(`Error opening article: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4">Testing News Functionality</h1>
          <div className="animate-pulse">Loading news...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4">Testing News Functionality</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Error</h2>
            <p className="text-red-700">{error}</p>
            <button 
              onClick={fetchNews}
              className="mt-2 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-4">Testing News Functionality</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* News Articles */}
          <div>
            <h2 className="text-xl font-semibold mb-4">News Articles</h2>
            <div className="space-y-4">
              {news.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {item.summary}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <span>{item.source}</span>
                    <span>{new Date(item.publishedAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      {item.url}
                    </span>
                    <button
                      onClick={() => handleNewsClick(item.url, item.title)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Test Link
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test Results */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm">
                    {result}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-medium mb-2">Troubleshooting Tips:</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• If URLs show as invalid, check the news service configuration</li>
                  <li>• If URLs are not accessible, it may be due to CORS restrictions</li>
                  <li>• External news sites may block automated requests</li>
                  <li>• Try clicking "Test Link" to manually test each article</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={fetchNews}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh News & Re-test
          </button>
        </div>
      </div>
    </div>
  );
} 