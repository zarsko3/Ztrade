# Trade-Tracker MVP

A comprehensive web application for tracking stock trades, analyzing performance against market benchmarks, visualizing trading data with technical indicators, and gaining AI-powered insights into trading behavior.

## Features

### ✅ Completed Features
- **Project Setup**: Next.js 14 with TypeScript, Tailwind CSS, and App Router
- **Database**: SQLite with Prisma ORM for Trade and Performance models
- **Chart Integration**: Chart-img API integration with caching and technical indicators
- **Market Data**: Alpha Vantage API integration for S&P 500 data and performance benchmarking

### 🚧 In Progress
- Trade management API endpoints and UI components
- Performance analysis features
- Excel export functionality
- Real-time market data integration

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Prisma ORM, SQLite
- **External APIs**: Chart-img (charts), Alpha Vantage (market data)
- **Caching**: Redis (Upstash)
- **Data Export**: SheetJS

## Getting Started

### Prerequisites
- Node.js 18.17.0 or later
- npm 9.6.7 or later

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd trade-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:

```env
# Application Configuration
NEXT_PUBLIC_APP_NAME="Trade-Tracker MVP"

# Database Configuration
DATABASE_URL="file:./dev.db"

# Chart-img API Configuration
CHART_IMG_API_KEY="your_chart_img_api_key_here"
CHART_IMG_BASE_URL="https://api.chart-img.com/v1"

# Alpha Vantage API Configuration
ALPHA_VANTAGE_API_KEY="your_alpha_vantage_api_key_here"
ALPHA_VANTAGE_BASE_URL="https://www.alphavantage.co/query"

# Redis Configuration (for caching)
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD="your_redis_password_here"

# Chart Configuration
CHART_CACHE_TTL="3600"
CHART_MAX_RETRIES="3"
CHART_RETRY_DELAY="1000"

# Market Data Configuration
MARKET_DATA_CACHE_TTL="1800"
MARKET_DATA_MAX_RETRIES="3"
MARKET_DATA_RETRY_DELAY="1000"
```

4. Set up the database:
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Integration Setup

### Chart-img API
The application integrates with Chart-img API for generating professional stock charts with technical indicators.

**Features:**
- Candlestick charts with EMA-20, EMA-50, and RSI indicators
- Multiple timeframes (1D, 1W, 1M, 3M, 1Y)
- Trade entry/exit point markers
- Redis caching for improved performance
- Error handling and retry logic

**Setup:**
1. Sign up for a Chart-img API key at [chart-img.com](https://chart-img.com)
2. Add your API key to the `.env.local` file
3. Configure Redis for caching (optional but recommended)

**Usage:**
- Visit `/charts` to test chart generation
- Use the API endpoint `/api/charts/[ticker]` for programmatic access
- Charts are automatically cached to reduce API calls

### Alpha Vantage API
The application integrates with Alpha Vantage API for retrieving real-time and historical market data.

**Features:**
- Real-time S&P 500 index data
- Historical market performance data
- S&P 500 return calculations
- Trade performance benchmarking
- Redis caching for improved performance
- Error handling and retry logic

**Setup:**
1. Sign up for an Alpha Vantage API key at [alphavantage.co](https://www.alphavantage.co)
2. Add your API key to the `.env.local` file
3. Configure Redis for caching (optional but recommended)

**Usage:**
- Visit `/market` to view S&P 500 data
- Use the API endpoint `/api/market/sp500` for programmatic access
- Market data is automatically cached to reduce API calls

### Testing API Integrations
```bash
# Test the chart service
npx ts-node scripts/test-chart-api.ts

# Test the market data service
npx ts-node scripts/test-market-api.ts

# Test the API endpoints
curl "http://localhost:3000/api/charts/test"
curl "http://localhost:3000/api/market/test"
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── charts/        # Chart generation endpoints
│   │   └── trades/        # Trade management endpoints
│   ├── charts/            # Chart visualization pages
│   ├── dashboard/         # Main dashboard
│   └── trades/            # Trade management pages
├── components/            # React components
│   ├── charts/           # Chart-related components
│   ├── trades/           # Trade-related components
│   └── ui/               # Reusable UI components
├── lib/                  # Utility libraries
├── services/             # External API services
├── types/                # TypeScript type definitions
└── prisma/               # Database schema and migrations
```

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma:studio` - Open Prisma Studio
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed database with sample data

### Database Management
```bash
# Reset database
npm run reset-db

# View database in Prisma Studio
npm run prisma:studio
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
