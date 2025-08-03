import React from 'react';

interface TradeLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function TradeLogo({ size = 'md', showText = true, className = '' }: TradeLogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <img 
        src="/LOGO.png" 
        alt="Trade Logo" 
        className={sizeClasses[size]}
      />
      {showText && (
        <span className={`font-bold text-gray-900 dark:text-white ${textSizes[size]}`}>
          Trade
        </span>
      )}
    </div>
  );
} 