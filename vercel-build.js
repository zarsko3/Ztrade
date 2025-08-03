const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing app for Vercel deployment...');

// Create a simplified package.json for Vercel
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
    "@prisma/client": "^6.12.0",
    "@stagewise-plugins/react": "^0.6.2",
    "@stagewise/toolbar-next": "^0.6.2",
    "@tensorflow/tfjs": "^4.22.0",
    "axios": "^1.10.0",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.525.0",
    "moment": "^2.30.1",
    "next": "^15.4.1",
    "next-themes": "^0.4.6",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "recharts": "^3.1.0",
    "sharp": "^0.34.3",
    "simple-statistics": "^7.8.8",
    "socket.io-client": "^4.8.1",
    "technicalindicators": "^3.1.0",
    "xlsx": "^0.18.5",
    "yahoo-finance2": "^2.13.3"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@tailwindcss/postcss": "^4",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/jest": "^30.0.0",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@types/socket.io-client": "^1.4.36",
    "eslint": "^9",
    "eslint-config-next": "15.4.1",
    "jest": "^30.0.5",
    "jest-environment-jsdom": "^30.0.5",
    "prisma": "^6.12.0",
    "tailwindcss": "^4",
    "ts-node": "^10.9.2",
    "typescript": "^5"
  }
};

// Write the simplified package.json
fs.writeFileSync('package.json.vercel', JSON.stringify(packageJson, null, 2));

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
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }
    return config;
  },
};

export default nextConfig;
`;

fs.writeFileSync('next.config.vercel.ts', nextConfigContent);

console.log('✅ Created Vercel-compatible configuration files');
console.log('📝 Next steps:');
console.log('   1. Copy package.json.vercel to package.json');
console.log('   2. Copy next.config.vercel.ts to next.config.ts');
console.log('   3. Commit and push changes');
console.log('   4. Deploy with: vercel --prod'); 