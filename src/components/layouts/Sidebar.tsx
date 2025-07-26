'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  TrendingUp, 
  PieChart, 
  Shield, 
  Briefcase, 
  Target, 
  Download, 
  Settings,
  Menu,
  X,
  BarChart3,
  Brain,
  ChevronDown,
  ChevronRight,
  Home
} from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const topNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Trades', href: '/trades', icon: TrendingUp },
];

const basicNavigation = [
  { name: 'Analytics', href: '/analytics', icon: PieChart },
  { name: 'Performance', href: '/performance', icon: BarChart3 },
  { name: 'Risk', href: '/risk', icon: Shield },
  { name: 'Portfolio', href: '/portfolio', icon: Briefcase },
  { name: 'Benchmark', href: '/benchmark', icon: Target },
];

const navigation = [
  { name: 'Export', href: '/export', icon: Download },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Test News', href: '/test-news', icon: Settings },
];

const aiNavigation = [
  { name: 'AI Dashboard', href: '/ai-dashboard', icon: Brain },
  { name: 'AI Patterns', href: '/ai-patterns', icon: Brain },
  { name: 'AI Predictive', href: '/ai-predictive', icon: Brain },
  { name: 'AI ML', href: '/ai-ml', icon: Brain },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBasicCollapsed, setIsBasicCollapsed] = useState(false);
  const [isAICollapsed, setIsAICollapsed] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          )}
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 shadow-sm z-40
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">TradeTracker</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-6">
            {/* Top Navigation - Dashboard and Trades */}
            <div className="space-y-2">
              {topNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                      ${isActive 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      }
                    `}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Basic Section */}
            <div>
              <button
                onClick={() => setIsBasicCollapsed(!isBasicCollapsed)}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${pathname === '/analytics' || pathname === '/performance' || pathname === '/risk' || pathname === '/portfolio' || pathname === '/benchmark'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <Home className={`w-5 h-5 ${pathname === '/analytics' || pathname === '/performance' || pathname === '/risk' || pathname === '/portfolio' || pathname === '/benchmark' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                  <span>Basic</span>
                </div>
                {isBasicCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                )}
              </button>

              {/* Basic Submenu */}
              {!isBasicCollapsed && (
                <div className="mt-2 ml-4 space-y-1">
                  {basicNavigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`
                          flex items-center space-x-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                          ${isActive 
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                          }
                        `}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AI Section */}
            <div>
              <button
                onClick={() => setIsAICollapsed(!isAICollapsed)}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${pathname.startsWith('/ai') 
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <Brain className={`w-5 h-5 ${pathname.startsWith('/ai') ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`} />
                  <span>AI</span>
                </div>
                {isAICollapsed ? (
                  <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                )}
              </button>

              {/* AI Submenu */}
              {!isAICollapsed && (
                <div className="mt-2 ml-4 space-y-1">
                  {aiNavigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`
                          flex items-center space-x-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                          ${isActive 
                            ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800' 
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                          }
                        `}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon className={`w-4 h-4 ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`} />
                        <span>{item.name.replace('AI ', '')}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Export and Settings buttons side by side */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex space-x-2 mb-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex-1 flex items-center justify-center space-x-2 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200
                      ${isActive 
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      }
                    `}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className={`w-4 h-4 ${isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
            
            {/* Theme Toggle */}
            <div className="flex justify-center">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 