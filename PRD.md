# Z-Trade: Product Requirements Document

## Executive Summary

The Z-Trade is a web application designed to help traders log their stock trades, compare performance against market benchmarks, visualize trading data with technical indicators, and gain insights through AI-powered analysis.

## Product Overview

Z-Trade is a Next.js 14 application that allows users to track stock trades, benchmark performance against the S&P 500, view performance summaries, generate candlestick charts with technical indicators, and export data for further analysis.

## 1. Introduction

### 1.1 Purpose
The Z-Trade MVP is a web application designed to help traders log their stock trades, compare performance against market benchmarks, visualize trading data with technical indicators, and gain insights into trading behavior. This document outlines the requirements and specifications for the initial version of the application.

### 1.2 Project Overview
Z-Trade MVP is a Next.js 14 application that allows users to track stock trades, benchmark performance against the S&P 500, view performance summaries, generate candlestick charts with technical indicators, export data to Excel, and receive AI-powered insights on trading behavior.

### 1.3 Scope
This MVP will focus on core functionality to track trades and provide basic analysis tools. Future versions may include additional features such as portfolio management, real-time data integration, and more advanced analytics.

## 2. Technical Stack

### 2.1 Frontend
- **Framework**: Next.js 14 with App Router
- **UI Library**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API / React Query

### 2.2 Backend
- **API Routes**: Next.js API routes
- **Database**: SQLite (with Prisma ORM)
- **Authentication**: Next-Auth (optional for MVP)

### 2.3 External Services
- **Chart Generation**: Chart-img API for candlestick charts with EMA and RSI
- **Market Data**: Alpha Vantage API or similar for S&P 500 historical data
- **AI Insights**: OpenAI GPT-4o API for trading behavior analysis
- **Data Export**: SheetJS for Excel export functionality
- **Caching**: Upstash Redis for performance optimization

## 3. User Stories & Requirements

### 3.1 Trade Logging
- **US-1.1**: As a user, I want to add a new trade with ticker symbol, entry/exit dates, and entry/exit prices.
- **US-1.2**: As a user, I want to view a list of all my trades.
- **US-1.3**: As a user, I want to edit or delete existing trades.
- **US-1.4**: As a user, I want to add notes to my trades.
- **US-1.5**: As a user, I want to see the profit/loss for each trade.

### 3.2 S&P 500 Benchmarking
- **US-2.1**: As a user, I want to see how my trade performed compared to the S&P 500 over the same period.
- **US-2.2**: As a user, I want to see the percentage difference between my trade performance and the S&P 500.
- **US-2.3**: As a user, I want to visualize the comparison in a chart.

### 3.3 Performance Summaries
- **US-3.1**: As a user, I want to see weekly summaries of my trading performance.
- **US-3.2**: As a user, I want to see monthly summaries of my trading performance.
- **US-3.3**: As a user, I want to see yearly summaries of my trading performance.
- **US-3.4**: As a user, I want to see my overall win rate and average profit/loss.

### 3.4 Candlestick Charts with Technical Indicators
- **US-4.1**: As a user, I want to see a candlestick chart for each of my trades.
- **US-4.2**: As a user, I want to see EMA-20 and EMA-50 indicators on the chart.
- **US-4.3**: As a user, I want to see RSI indicator on the chart.
- **US-4.4**: As a user, I want to see my entry and exit points marked on the chart.

### 3.5 Excel Export
- **US-5.1**: As a user, I want to export all my trades to an Excel file.
- **US-5.2**: As a user, I want to export performance summaries to Excel.
- **US-5.3**: As a user, I want to choose which data to include in the export.

### 3.6 AI Insights
- **US-6.1**: As a user, I want to receive GPT-4o powered insights on my trading behavior.
- **US-6.2**: As a user, I want to see patterns in my successful and unsuccessful trades.
- **US-6.3**: As a user, I want to receive suggestions for improving my trading strategy.

## 4. Data Models

### 4.1 Trade
```prisma
model Trade {
  id          Int      @id @default(autoincrement())
  ticker      String
  entryDate   DateTime
  entryPrice  Float
  exitDate    DateTime?
  exitPrice   Float?
  quantity    Int
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 4.2 Performance
```prisma
model Performance {
  id          Int      @id @default(autoincrement())
  period      String   // "weekly", "monthly", "yearly"
  startDate   DateTime
  endDate     DateTime
  totalTrades Int
  winningTrades Int
  losingTrades  Int
  profitLoss  Float
  spReturn    Float    // S&P 500 return for the same period
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## 5. User Interface

### 5.1 Main Dashboard
- Overview of recent trades
- Performance summary cards (weekly, monthly, yearly)
- Quick stats (win rate, average P/L, etc.)
- Navigation to other sections

### 5.2 Trade Entry Form
- Fields for ticker, entry/exit dates, entry/exit prices, quantity, notes
- Validation for required fields
- Preview of profit/loss calculation

### 5.3 Trade List
- Sortable and filterable table of all trades
- Actions for edit and delete
- Visual indicators for profitable vs. losing trades

### 5.4 Trade Detail View
- All trade information
- Candlestick chart with EMA-20, EMA-50, and RSI
- S&P 500 comparison chart
- AI insights specific to the trade

### 5.5 Performance Analysis
- Detailed performance metrics
- Charts showing performance over time
- Comparison to S&P 500 benchmark
- Filter controls for different time periods

### 5.6 Export Controls
- Options for selecting data to export
- Format selection
- Download button

## 6. API Endpoints

### 6.1 Trades API
- `GET /api/trades` - Get all trades
- `GET /api/trades/:id` - Get a specific trade
- `POST /api/trades` - Create a new trade
- `PUT /api/trades/:id` - Update a trade
- `DELETE /api/trades/:id` - Delete a trade

### 6.2 Performance API
- `GET /api/performance/weekly` - Get weekly performance data
- `GET /api/performance/monthly` - Get monthly performance data
- `GET /api/performance/yearly` - Get yearly performance data

### 6.3 Charts API
- `GET /api/charts/:ticker` - Get candlestick chart with indicators for a ticker
- `GET /api/charts/comparison/:ticker` - Get comparison chart with S&P 500

### 6.4 Export API
- `POST /api/export` - Generate and return Excel export

### 6.5 AI Insights API
- `POST /api/insights` - Generate insights based on trading data

## 7. External API Integration

### 7.1 Chart-img API
- Use the Chart-img API to generate candlestick charts with EMA and RSI indicators
- Implement caching to minimize API calls
- Handle API rate limits and errors gracefully

### 7.2 Market Data API
- Fetch historical S&P 500 data for benchmarking
- Implement data synchronization strategy
- Cache frequently accessed data

### 7.3 OpenAI GPT-4o API
- Send trading data to GPT-4o for analysis
- Process and format insights for display
- Implement error handling and fallbacks

## 8. Non-Functional Requirements

### 8.1 Performance
- Page load time under 2 seconds
- Chart rendering under 3 seconds
- Smooth interactions with no perceived lag

### 8.2 Security
- Secure API endpoints
- Data validation on all inputs
- Protection against common web vulnerabilities

### 8.3 Reliability
- Graceful error handling
- Fallbacks for external API failures
- Data persistence and backup

### 8.4 Usability
- Responsive design for desktop and tablet
- Intuitive navigation and controls
- Helpful error messages and guidance

## 9. Constraints and Assumptions

### 9.1 Constraints
- Limited to historical data (no real-time market data in MVP)
- Chart-img API rate limits may affect chart generation frequency
- GPT-4o API costs may limit the depth of AI insights

### 9.2 Assumptions
- Users have basic knowledge of stock trading
- Users will primarily access the application from desktop devices
- Initial user base will be small (< 100 users)

## 10. Future Considerations (Post-MVP)

### 10.1 Features for Future Versions
- User authentication and multi-user support
- Real-time market data integration
- Mobile application
- Advanced technical analysis tools
- Social sharing of trade insights
- Portfolio management and tracking
- Custom dashboards and reports
- Integration with trading platforms

## 11. Definition of Done

The Z-Trade MVP will be considered complete when:

1. All user stories are implemented and tested
2. The application can be deployed to Vercel
3. Users can successfully log trades, view charts, and export data
4. Performance meets or exceeds the non-functional requirements
5. Documentation is complete and up-to-date 