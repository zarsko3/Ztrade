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
  Home,
  User,
  LogOut
} from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { TradeLogo } from '@/components/ui/TradeLogo';
import { TradeIcon } from '@/components/ui/TradeIcon';

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
          className="p-2.5 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          ) : (
            <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          )}
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-lg z-40
        transform transition-all duration-300 ease-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <Link href="/" className="group">
              <div className="flex items-center space-x-3 shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105 rounded-xl p-2">
                <TradeIcon size="md" />
                <span className="text-xl font-bold text-gray-900 dark:text-white">Trade</span>
              </div>
            </Link>
          </div>



          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-6">
            {/* Menu Label */}
            <div className="px-3">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Menu</h3>
            </div>

            {/* Top Navigation - Dashboard and Trades */}
            <div className="space-y-1">
              {topNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive 
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                      }
                    `}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`} />
                      <span>{item.name}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </Link>
                );
              })}
            </div>

            {/* Basic Section */}
            <div className="space-y-1">
              <button
                onClick={() => setIsBasicCollapsed(!isBasicCollapsed)}
                className={`
                  w-full group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${pathname === '/analytics' || pathname === '/performance' || pathname === '/risk' || pathname === '/portfolio' || pathname === '/benchmark'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <Home className={`w-4 h-4 ${pathname === '/analytics' || pathname === '/performance' || pathname === '/risk' || pathname === '/portfolio' || pathname === '/benchmark' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`} />
                  <span>Basic</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">5</span>
                  {isBasicCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  )}
                </div>
              </button>

              {/* Basic Submenu */}
              {!isBasicCollapsed && (
                <div className="ml-6 space-y-1 mt-2">
                  {basicNavigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`
                          group flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                          ${isActive 
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' 
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                          }
                        `}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AI Section */}
            <div className="space-y-1">
              <button
                onClick={() => setIsAICollapsed(!isAICollapsed)}
                className={`
                  w-full group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${pathname.startsWith('/ai') 
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <Brain className={`w-4 h-4 ${pathname.startsWith('/ai') ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`} />
                  <span>AI</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">4</span>
                  {isAICollapsed ? (
                    <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  )}
                </div>
              </button>

              {/* AI Submenu */}
              {!isAICollapsed && (
                <div className="ml-6 space-y-1 mt-2">
                  {aiNavigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`
                          group flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                          ${isActive 
                            ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' 
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                          }
                        `}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span>{item.name.replace('AI ', '')}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Additional Navigation Items */}
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive 
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                      }
                    `}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`} />
                      <span>{item.name}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Bottom Section */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
            {/* User Profile */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Trader</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">trader@ztrade.com</p>
              </div>
            </div>

            {/* Logout Button */}
            <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200">
              <div className="flex items-center space-x-3">
                <LogOut className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span>Logout</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </button>
            

          </div>
        </div>
      </div>
    </>
  );
} 