'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface StockLogoProps {
  ticker: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTicker?: boolean;
}

const sizeClasses = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8'
};

const textSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base'
};

export function StockLogo({ 
  ticker, 
  size = 'md', 
  className,
  showTicker = false 
}: StockLogoProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Clean ticker symbol (remove any special characters)
  const cleanTicker = ticker.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  
  // Multiple logo sources for better reliability
  const logoUrls = [
    // Primary: TradingView (most reliable)
    `https://s3-symbol-logo.tradingview.com/country/US/${cleanTicker}.svg`,
    // Fallback: Alternative TradingView format
    `https://s3-symbol-logo.tradingview.com/${cleanTicker.toLowerCase()}.svg`,
    // Secondary: Financial Modeling Prep API (requires API key but more reliable)
    `https://financialmodelingprep.com/image-stock/${cleanTicker}.png`,
    // Tertiary: Simple logo service
    `https://logo.clearbit.com/${cleanTicker.toLowerCase()}.com`
  ];

  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);

  const handleImageError = () => {
    if (currentUrlIndex < logoUrls.length - 1) {
      // Try next URL
      setCurrentUrlIndex(prev => prev + 1);
      setImageError(false);
      setIsLoading(true);
    } else {
      // All URLs failed, show fallback
      setImageError(true);
      setIsLoading(false);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    setIsLoading(false);
  };

  // Reset state when ticker changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
    setIsLoading(true);
    setCurrentUrlIndex(0);
  }, [ticker]);

  // Fallback to a simple colored circle with ticker initials if image fails
  const getInitials = (symbol: string) => {
    return symbol.slice(0, 2).toUpperCase();
  };

  const getColorFromTicker = (symbol: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-orange-500',
      'bg-red-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-yellow-500',
      'bg-teal-500',
      'bg-cyan-500'
    ];
    const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('relative flex-shrink-0', sizeClasses[size])}>
        {/* Loading spinner */}
        {isLoading && !imageError && (
          <div className={cn(
            'absolute inset-0 flex items-center justify-center',
            sizeClasses[size]
          )}>
            <div className="animate-spin rounded-full border-2 border-gray-300 border-t-blue-500 w-3 h-3"></div>
          </div>
        )}

        {/* Real logo image */}
        {!imageError && (
          <img
            src={logoUrls[currentUrlIndex]}
            alt={`${cleanTicker} logo`}
            className={cn(
              'rounded object-contain transition-opacity duration-200',
              sizeClasses[size],
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading="lazy"
            crossOrigin="anonymous"
          />
        )}
        
        {/* Fallback circle with initials - only show when all images fail */}
        {imageError && !isLoading && (
          <div
            className={cn(
              'flex items-center justify-center rounded-full text-white font-semibold',
              sizeClasses[size],
              getColorFromTicker(cleanTicker)
            )}
          >
            <span className={cn('leading-none', textSizes[size])}>
              {getInitials(cleanTicker)}
            </span>
          </div>
        )}
      </div>
      
      {showTicker && (
        <span className={cn('font-medium', textSizes[size])}>
          {cleanTicker}
        </span>
      )}
    </div>
  );
}

// Compact version for tables and tight spaces
export function StockLogoCompact({ 
  ticker, 
  size = 'sm',
  className 
}: Omit<StockLogoProps, 'showTicker'>) {
  return (
    <StockLogo 
      ticker={ticker} 
      size={size} 
      className={className}
      showTicker={false}
    />
  );
}

// With ticker text for cards and larger displays
export function StockLogoWithText({ 
  ticker, 
  size = 'md',
  className 
}: Omit<StockLogoProps, 'showTicker'>) {
  return (
    <StockLogo 
      ticker={ticker} 
      size={size} 
      className={className}
      showTicker={true}
    />
  );
} 