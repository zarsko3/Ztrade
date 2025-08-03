import { NextRequest } from 'next/server'
import { GET, POST } from '../route'
import { mockTrades } from '@/lib/test-utils'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    trade: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  },
}))

// Mock the actual Prisma import
const mockPrisma = require('@/lib/prisma').prisma

describe('/api/trades', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return all trades with pagination', async () => {
      const mockTradesData = mockTrades.slice(0, 2)
      mockPrisma.trade.findMany.mockResolvedValue(mockTradesData)
      mockPrisma.trade.count.mockResolvedValue(2)

      const request = new NextRequest('http://localhost:3000/api/trades?page=1&limit=10')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.trades).toHaveLength(2)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      })
    })

    it('should handle search parameter', async () => {
      const mockTradesData = [mockTrades[0]] // AAPL trade
      mockPrisma.trade.findMany.mockResolvedValue(mockTradesData)
      mockPrisma.trade.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/trades?search=AAPL')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.trades).toHaveLength(1)
      expect(mockPrisma.trade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { ticker: { contains: 'AAPL', mode: 'insensitive' } },
              { notes: { contains: 'AAPL', mode: 'insensitive' } },
              { tags: { contains: 'AAPL', mode: 'insensitive' } },
            ]),
          }),
        })
      )
    })

    it('should handle ticker filter', async () => {
      const mockTradesData = [mockTrades[0]] // AAPL trade
      mockPrisma.trade.findMany.mockResolvedValue(mockTradesData)
      mockPrisma.trade.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/trades?ticker=AAPL')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.trades).toHaveLength(1)
      expect(mockPrisma.trade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ticker: 'AAPL',
          }),
        })
      )
    })

    it('should handle status filter for open trades', async () => {
      const mockTradesData = [mockTrades[2]] // TSLA open trade
      mockPrisma.trade.findMany.mockResolvedValue(mockTradesData)
      mockPrisma.trade.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/trades?status=open')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.trades).toHaveLength(1)
      expect(mockPrisma.trade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            exitDate: null,
          }),
        })
      )
    })

    it('should handle status filter for closed trades', async () => {
      const mockTradesData = mockTrades.slice(0, 2) // AAPL and MSFT closed trades
      mockPrisma.trade.findMany.mockResolvedValue(mockTradesData)
      mockPrisma.trade.count.mockResolvedValue(2)

      const request = new NextRequest('http://localhost:3000/api/trades?status=closed')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.trades).toHaveLength(2)
      expect(mockPrisma.trade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            exitDate: { not: null },
          }),
        })
      )
    })

    it('should handle sorting parameters', async () => {
      mockPrisma.trade.findMany.mockResolvedValue(mockTrades)
      mockPrisma.trade.count.mockResolvedValue(3)

      const request = new NextRequest('http://localhost:3000/api/trades?sortBy=entryDate&sortOrder=desc')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockPrisma.trade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { entryDate: 'desc' },
        })
      )
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.trade.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/trades')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch trades')
    })
  })

  describe('POST', () => {
    it('should create a new trade successfully', async () => {
      const newTrade = {
        ticker: 'GOOGL',
        entryDate: '2024-01-01',
        entryPrice: 150.00,
        quantity: 5,
        isShort: false,
        fees: 9.99,
        notes: 'Test trade',
        tags: 'tech',
      }

      const createdTrade = {
        id: 4,
        ...newTrade,
        entryDate: new Date(newTrade.entryDate),
        createdAt: new Date(),
        updatedAt: new Date(),
        performanceId: null,
      }

      mockPrisma.trade.create.mockResolvedValue(createdTrade)

      const request = new NextRequest('http://localhost:3000/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTrade),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.trade).toEqual(createdTrade)
    })

    it('should validate required fields', async () => {
      const invalidTrade = {
        ticker: '', // Invalid: empty ticker
        entryDate: '2024-01-01',
        entryPrice: 0, // Invalid: zero price
        quantity: 0, // Invalid: zero quantity
      }

      const request = new NextRequest('http://localhost:3000/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidTrade),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.errors).toHaveProperty('ticker')
      expect(data.errors).toHaveProperty('entryPrice')
      expect(data.errors).toHaveProperty('quantity')
    })

    it('should handle database errors during creation', async () => {
      const newTrade = {
        ticker: 'GOOGL',
        entryDate: '2024-01-01',
        entryPrice: 150.00,
        quantity: 5,
        isShort: false,
      }

      mockPrisma.trade.create.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTrade),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to create trade')
    })

    it('should handle invalid JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid JSON in request body')
    })
  })
}) 