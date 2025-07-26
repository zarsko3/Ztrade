'use client';

import Link from 'next/link';
import { SimpleThemeToggle } from '@/components/ui/SimpleThemeToggle';
import { NotificationBell } from '@/components/NotificationSystem';

export function Header() {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
            Trade-Tracker
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
            Dashboard
          </Link>
          <Link href="/trades" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
            Trades
          </Link>
          <Link href="/charts" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
            Charts
          </Link>
          <Link href="/analytics" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
            Analytics
          </Link>
          <Link href="/risk" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
            Risk
          </Link>
          <Link href="/portfolio" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
            Portfolio
          </Link>
          <Link href="/benchmark" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
            Benchmark
          </Link>
          <Link href="/export" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
            Export
          </Link>
          <Link href="/test" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
            Test
          </Link>
          <Link href="/settings" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
            Settings
          </Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          <NotificationBell />
          <SimpleThemeToggle />
        </div>
      </div>
    </header>
  );
} 