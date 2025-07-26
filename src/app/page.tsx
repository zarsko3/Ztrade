'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard after a brief delay
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Trade-Tracker
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Professional Trading Performance Analytics
        </p>
        <div className="animate-pulse">
          <p className="text-gray-500 dark:text-gray-500 mb-6">
            Redirecting to dashboard...
          </p>
        </div>
        <div className="flex justify-center gap-4">
          <Link href="/dashboard">
            <Button variant="primary">Go to Dashboard</Button>
          </Link>
          <Link href="/trades">
            <Button variant="outline">View Trades</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
