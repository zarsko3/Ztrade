# Z-Trade

A comprehensive web application designed to help traders track their stock trades, analyze performance against market benchmarks, and visualize trading data with technical indicators.

## Features

- **Trade Management**: Add, edit, and close trades with detailed tracking
- **Performance Analytics**: Compare your performance against S&P 500 and other benchmarks
- **Real-time Market Data**: Live stock quotes and market status
- **Technical Analysis**: Candlestick charts with technical indicators
- **AI-Powered Insights**: Pattern recognition and predictive analytics
- **Portfolio Management**: Comprehensive portfolio tracking and analysis
- **Export Capabilities**: Download trade data and performance reports

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- SQLite (for local development)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd z-trade
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_APP_NAME="Z-Trade"
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run dev:next` - Start Next.js development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run prisma:studio` - Open Prisma Studio
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed database with sample data

## Project Structure

```
z-trade/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   ├── lib/                 # Utility functions and configurations
│   ├── services/            # API services and business logic
│   └── types/               # TypeScript type definitions
├── prisma/                  # Database schema and migrations
├── public/                  # Static assets
└── scripts/                 # Utility scripts
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
