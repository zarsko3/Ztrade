#!/bin/bash

echo "🚀 Trading App Deployment Script"
echo "================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
else
    echo "✅ Vercel CLI found"
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found. Creating template..."
    cat > .env.local << EOF
# Database (Update with your Supabase URL)
DATABASE_URL="postgresql://..."

# Redis (Optional)
REDIS_URL="redis://..."
REDIS_PASSWORD=""

# API Keys (Optional)
CHART_IMG_API_KEY=""
ALPHA_VANTAGE_API_KEY=""

# App Configuration
NEXT_PUBLIC_APP_NAME="Trade"
NEXT_PUBLIC_API_URL=""
EOF
    echo "📝 Created .env.local template. Please update with your values."
fi

# Check if database is ready
echo "🔍 Checking database configuration..."
if grep -q "sqlite" prisma/schema.prisma; then
    echo "⚠️  Database is still SQLite. Consider migrating to PostgreSQL for production."
    echo "   See DEPLOYMENT_GUIDE.md for instructions."
fi

# Build the app
echo "🔨 Building the app..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed. Please fix errors before deploying."
    exit 1
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "🎉 Deployment complete!"
echo "📋 Next steps:"
echo "   1. Set environment variables in Vercel dashboard"
echo "   2. Test the deployed app"
echo "   3. Share the URL with friends"
echo "   4. Monitor usage and performance"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT_GUIDE.md" 