'use client';

import Link from 'next/link';
import { SimpleThemeToggle } from '@/components/ui/SimpleThemeToggle';
import { NotificationBell } from '@/components/NotificationSystem';
import { TrendingUp } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Z-Trade
          </h1>
        </div>
        
        <nav className="hidden lg:flex items-center space-x-1">
          <Link href="/" className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200">
            Dashboard
          </Link>
          <Link href="/trades" className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200">
            Trades
          </Link>
          <Link href="/analytics" className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200">
            Analytics
          </Link>
          <Link href="/performance" className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200">
            Performance
          </Link>
          <Link href="/portfolio" className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200">
            Portfolio
          </Link>
          <Link href="/export" className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200">
            Export
          </Link>
        </nav>
        
        <div className="flex items-center space-x-3">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-1">
            <NotificationBell />
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-1">
            <SimpleThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
} 