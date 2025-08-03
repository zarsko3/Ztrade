// Deployment script for Vercel
const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing app for Vercel deployment...');

// Create a minimal .env.local for Vercel
const envContent = `# Database (SQLite for local testing)
DATABASE_URL="file:./dev.db"

# App Configuration
NEXT_PUBLIC_APP_NAME="Trade"
NEXT_PUBLIC_API_URL=""

# Optional API Keys (can be added later)
CHART_IMG_API_KEY=""
ALPHA_VANTAGE_API_KEY=""

# Redis (Optional)
REDIS_URL=""
REDIS_PASSWORD=""
`;

try {
  fs.writeFileSync('.env.local', envContent);
  console.log('✅ Created .env.local');
} catch (error) {
  console.log('⚠️  Could not create .env.local:', error.message);
}

// Create a Vercel-specific next.config
const nextConfigContent = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['@tensorflow/tfjs'],
  },
};

export default nextConfig;
`;

try {
  fs.writeFileSync('next.config.vercel.ts', nextConfigContent);
  console.log('✅ Created next.config.vercel.ts');
} catch (error) {
  console.log('⚠️  Could not create next.config.vercel.ts:', error.message);
}

console.log('🎉 App prepared for Vercel deployment!');
console.log('📝 Next steps:');
console.log('   1. Run: vercel --prod');
console.log('   2. Set environment variables in Vercel dashboard');
console.log('   3. Test the deployed app'); 