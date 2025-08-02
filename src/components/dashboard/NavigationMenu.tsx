'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  TrendingUp, 
  PieChart, 
  Download, 
  Settings,
  BarChart3,
  Brain,
  ChevronRight,
  Plus,
  Search,
  Bell,
  User
} from 'lucide-react';
import { useState } from 'react';

interface NavigationMenuProps {
  showBreadcrumbs?: boolean;
  showQuickActions?: boolean;
  className?: string;
}

interface BreadcrumbItem {
  name: string;
  href: string;
  current: boolean;
}

export default function NavigationMenu({ 
  showBreadcrumbs = true, 
  showQuickActions = true,
  className = ""
}: NavigationMenuProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Home', href: '/', current: pathname === '/' }
    ];

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const name = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      breadcrumbs.push({
        name,
        href: currentPath,
        current: index === segments.length - 1
      });
    });

    return breadcrumbs;
  };

  // Quick navigation items
  const quickNavItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, color: 'text-blue-600' },
    { name: 'Trades', href: '/trades', icon: TrendingUp, color: 'text-green-600' },
    { name: 'Analytics', href: '/analytics', icon: PieChart, color: 'text-purple-600' },
    { name: 'Performance', href: '/performance', icon: BarChart3, color: 'text-orange-600' },
    { name: 'AI Dashboard', href: '/ai-dashboard', icon: Brain, color: 'text-indigo-600' },
  ];

  // Quick action items
  const quickActions = [
    { name: 'Add Trade', href: '/trades/add', icon: Plus, color: 'bg-green-500 hover:bg-green-600' },
    { name: 'Export Data', href: '/export', icon: Download, color: 'bg-blue-500 hover:bg-blue-600' },
    { name: 'Settings', href: '/settings', icon: Settings, color: 'bg-gray-500 hover:bg-gray-600' },
  ];

  const breadcrumbs = generateBreadcrumbs();

  return (
    <div className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left side - Breadcrumbs */}
          {showBreadcrumbs && (
            <nav className="flex items-center space-x-4">
              <ol className="flex items-center space-x-2">
                {breadcrumbs.map((item, index) => (
                  <li key={item.name} className="flex items-center">
                    {index > 0 && (
                      <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
                    )}
                    <Link
                      href={item.href}
                      className={`text-sm font-medium transition-colors ${
                        item.current
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {/* Center - Search (optional) */}
          <div className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search trades, stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Right side - Quick actions and user menu */}
          <div className="flex items-center space-x-4">
            
            {/* Quick Navigation */}
            {showQuickActions && (
              <div className="hidden md:flex items-center space-x-2">
                {quickNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                      title={item.name}
                    >
                      <item.icon className="w-5 h-5" />
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Quick Actions */}
            {showQuickActions && (
              <div className="hidden lg:flex items-center space-x-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.name}
                    href={action.href}
                    className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors ${action.color}`}
                  >
                    <action.icon className="w-4 h-4 mr-2" />
                    {action.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Notifications */}
            <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Simple Theme Toggle */}
            <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <div className="w-5 h-5">🌙</div>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button className="flex items-center space-x-2 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <User className="w-5 h-5" />
                <span className="hidden sm:block text-sm font-medium">User</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Quick Actions */}
      {showQuickActions && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-around py-2">
            {quickActions.slice(0, 2).map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors ${action.color}`}
              >
                <action.icon className="w-4 h-4 mr-2" />
                {action.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 