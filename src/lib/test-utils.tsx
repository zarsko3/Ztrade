import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'

// Mock data for testing
export const mockTrades = [
  {
    id: 1,
    ticker: 'AAPL',
    entryDate: new Date('2024-01-15'),
    entryPrice: 150.00,
    exitDate: new Date('2024-02-15'),
    exitPrice: 160.00,
    quantity: 10,
    fees: 9.99,
    notes: 'Test trade 1',
    tags: 'tech,long-term',
    isShort: false,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-15'),
    performanceId: null,
  },
  {
    id: 2,
    ticker: 'MSFT',
    entryDate: new Date('2024-01-20'),
    entryPrice: 300.00,
    exitDate: new Date('2024-02-20'),
    exitPrice: 320.00,
    quantity: 5,
    fees: 9.99,
    notes: 'Test trade 2',
    tags: 'tech,swing',
    isShort: false,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-02-20'),
    performanceId: null,
  },
  {
    id: 3,
    ticker: 'TSLA',
    entryDate: new Date('2024-01-25'),
    entryPrice: 200.00,
    quantity: 8,
    fees: 9.99,
    notes: 'Open position',
    tags: 'ev,tech',
    isShort: false,
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25'),
    performanceId: null,
  },
]

export const mockPerformanceData = {
  totalTrades: 3,
  winningTrades: 2,
  losingTrades: 0,
  winRate: 66.67,
  totalPnL: 1000.00,
  averageReturn: 333.33,
  largestWin: 1000.00,
  largestLoss: 0,
  averageWin: 1000.00,
  averageLoss: 0,
  profitFactor: 0,
  maxDrawdown: 0,
  sharpeRatio: 0,
}

export const mockCompanyInfo = {
  name: 'Apple Inc.',
  logo: 'https://logo.clearbit.com/apple.com',
  sector: 'Technology',
}

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Mock fetch responses
export const mockFetchResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
    headers: new Headers({
      'content-type': 'application/json',
    }),
  })
}

export const mockFetchError = (error: string, status = 500) => {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ error }),
    text: () => Promise.resolve(error),
  })
}

// Test helpers
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0))
}

export const createMockTrade = (overrides = {}) => ({
  id: Math.floor(Math.random() * 1000),
  ticker: 'TEST',
  entryDate: new Date('2024-01-01'),
  entryPrice: 100.00,
  quantity: 10,
  fees: 9.99,
  notes: '',
  tags: '',
  isShort: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  performanceId: null,
  ...overrides,
}) 