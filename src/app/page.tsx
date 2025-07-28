import { TradeIcon } from '@/components/ui/TradeIcon';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <TradeIcon size="lg" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Trade
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Your trading application is successfully deployed!
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-4">Features Available:</h2>
            <ul className="text-left space-y-2">
              <li>✅ Basic UI Components</li>
              <li>✅ Dark/Light Theme</li>
              <li>✅ Responsive Design</li>
              <li>🔄 Database Integration (Coming Soon)</li>
              <li>🔄 Real-time Data (Coming Soon)</li>
              <li>🔄 AI Features (Coming Soon)</li>
            </ul>
          </div>
          <p className="mt-8 text-sm text-gray-500">
            This is a simplified version for deployment. Full features will be added in future updates.
          </p>
        </div>
      </div>
    </div>
  );
}
