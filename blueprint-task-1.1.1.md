# Blueprint: Task 1.1.1 - Create Next.js 14 Project with TypeScript and App Router

## Overview
This blueprint outlines the steps to create a new Next.js 14 project with TypeScript and the App Router for the Trade-Tracker MVP application.

## Prerequisites
- Node.js (v18.17.0 or later)
- npm (v9.6.7 or later)
- Git

## Step-by-Step Instructions

### 1. Create a new Next.js project

```bash
# Navigate to your desired parent directory
cd /path/to/your/projects

# Create a new Next.js project with TypeScript
npx create-next-app@latest trade-tracker --typescript --eslint --tailwind --app --src-dir
```

When prompted, select the following options:
- Would you like to use TypeScript? › Yes
- Would you like to use ESLint? › Yes
- Would you like to use Tailwind CSS? › Yes
- Would you like to use `src/` directory? › Yes
- Would you like to use App Router? (recommended) › Yes
- Would you like to customize the default import alias (@/*)? › Yes (use @/)

### 2. Navigate to the project directory

```bash
cd trade-tracker
```

### 3. Update dependencies to ensure compatibility

```bash
# Update Next.js to the latest version
npm install next@latest react@latest react-dom@latest
```

### 4. Configure TypeScript for strict type checking

Update the `tsconfig.json` file to include stricter type checking:

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    },
    "forceConsistentCasingInFileNames": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 5. Create the basic directory structure for the app

```bash
# Create directories for components, hooks, utils, and types
mkdir -p src/components/ui
mkdir -p src/components/forms
mkdir -p src/components/charts
mkdir -p src/components/layouts
mkdir -p src/hooks
mkdir -p src/utils
mkdir -p src/types
mkdir -p src/lib
mkdir -p src/services
mkdir -p src/app/api
```

### 6. Set up the basic app structure with App Router

Create or update the following files:

#### src/app/layout.tsx
```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Trade-Tracker MVP',
  description: 'Track your stock trades and benchmark against the S&P 500',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  );
}
```

#### src/app/page.tsx
```tsx
export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Trade-Tracker MVP
      </h1>
      <p className="text-center text-gray-600">
        Track your stock trades, benchmark against the S&P 500, and gain insights into your trading behavior.
      </p>
    </div>
  );
}
```

### 7. Create a basic component to test the setup

#### src/components/ui/Button.tsx
```tsx
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'font-medium rounded-lg focus:ring-2 focus:outline-none';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-300',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-300',
    outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-300',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
```

### 8. Update the home page to use the Button component

#### src/app/page.tsx (updated)
```tsx
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Trade-Tracker MVP
      </h1>
      <p className="text-center text-gray-600 mb-8">
        Track your stock trades, benchmark against the S&P 500, and gain insights into your trading behavior.
      </p>
      <div className="flex justify-center gap-4">
        <Button variant="primary">View Trades</Button>
        <Button variant="outline">Add New Trade</Button>
      </div>
    </div>
  );
}
```

### 9. Create a simple environment configuration file

#### src/lib/env.ts
```typescript
export const env = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Trade-Tracker MVP',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || '',
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
};
```

### 10. Create a .env.local file for local development

```bash
touch .env.local
```

Add the following content to `.env.local`:
```
NEXT_PUBLIC_APP_NAME="Trade-Tracker MVP"
```

### 11. Test the application

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser to ensure the application is running correctly.

### 12. Initialize Git repository (if not already done by create-next-app)

```bash
git init
git add .
git commit -m "Initial commit: Set up Next.js 14 with TypeScript and App Router"
```

## Expected Project Structure

After completing this task, your project structure should look like this:

```
trade-tracker/
├── .env.local
├── .eslintrc.json
├── .gitignore
├── next.config.js
├── package-lock.json
├── package.json
├── postcss.config.js
├── public/
│   ├── next.svg
│   └── vercel.svg
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── charts/
│   │   ├── forms/
│   │   ├── layouts/
│   │   └── ui/
│   │       └── Button.tsx
│   ├── hooks/
│   ├── lib/
│   │   └── env.ts
│   ├── services/
│   ├── types/
│   └── utils/
├── tailwind.config.ts
└── tsconfig.json
```

## Next Steps

After completing this task, you should proceed to Task 1.1.2: Set up Tailwind CSS (which is already done by create-next-app) and Task 1.1.3: Configure ESLint and Prettier. 