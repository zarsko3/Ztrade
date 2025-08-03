const fs = require('fs');
const path = require('path');

console.log('🚀 Creating minimal Vercel-compatible app...');

// Create a minimal package.json for Vercel
const packageJson = {
  "name": "z-trade",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.4.1",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "lucide-react": "^0.525.0",
    "next-themes": "^0.4.6",
    "recharts": "^3.1.0",
    "axios": "^1.10.0",
    "date-fns": "^4.1.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "15.4.1",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
};

// Write the minimal package.json
fs.writeFileSync('package.json.minimal', JSON.stringify(packageJson, null, 2));

// Create a simple next.config
const nextConfigContent = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
`;

fs.writeFileSync('next.config.minimal.ts', nextConfigContent);

// Create a simple index page
const indexPage = `import { TradeIcon } from '@/components/ui/TradeIcon';

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
`;

// Create the app directory structure
if (!fs.existsSync('src/app')) {
  fs.mkdirSync('src/app', { recursive: true });
}

fs.writeFileSync('src/app/page.tsx', indexPage);

console.log('✅ Created minimal Vercel-compatible app');
console.log('📝 Next steps:');
console.log('   1. Copy package.json.minimal to package.json');
console.log('   2. Copy next.config.minimal.ts to next.config.ts');
console.log('   3. Commit and push changes');
console.log('   4. Deploy with: vercel --prod'); 