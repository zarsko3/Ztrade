import React from 'react';

interface TradeIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TradeIcon({ size = 'md', className = '' }: TradeIconProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <img 
      src="/LOGO.png" 
      alt="Trade Icon" 
      className={`${sizeClasses[size]} ${className}`}
    />
  );
} 