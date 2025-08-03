'use client';

import { useAuth } from '@/lib/auth-context';
import { Sidebar } from './Sidebar';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const { user, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      </div>
    );
  }

  // For authenticated users, show sidebar layout
  if (user) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 lg:ml-72 overflow-auto bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/50">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    );
  }

  // For unauthenticated users, show full-width content
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
} 