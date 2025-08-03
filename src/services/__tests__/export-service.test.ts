import { ExportService } from '../export-service'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    trade: {
      findMany: jest.fn(),
    },
  },
}))

const mockPrisma = require('@/lib/prisma').prisma

describe('ExportService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('exportTrades', () => {
    it('should export trades successfully', async () => {
      const mockTrades = [
        {
          id: 1,
          ticker: 'AAPL',
          entryDate: new Date('2024-01-01'),
          entryPrice: 150,
          exitDate: new Date('2024-01-15'),
          exitPrice: 160,
          quantity: 10,
          fees: 9.99,
          notes: 'Test trade',
          tags: 'tech',
          isShort: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          performanceId: null,
        },
      ]

      mockPrisma.trade.findMany.mockResolvedValue(mockTrades)

      const options = {
        type: 'trades' as const,
        includeOpenPositions: true,
      }

      const buffer = await ExportService.exportTrades(options)

      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)
      expect(mockPrisma.trade.findMany).toHaveBeenCalled()
    })

    it('should handle empty trades array', async () => {
      mockPrisma.trade.findMany.mockResolvedValue([])

      const options = {
        type: 'trades' as const,
        includeOpenPositions: true,
      }

      await expect(ExportService.exportTrades(options)).rejects.toThrow(
        'No trades found matching the specified criteria'
      )
    })

    it('should filter by ticker', async () => {
      const mockTrades = [
        {
          id: 1,
          ticker: 'AAPL',
          entryDate: new Date('2024-01-01'),
          entryPrice: 150,
          exitDate: new Date('2024-01-15'),
          exitPrice: 160,
          quantity: 10,
          fees: 9.99,
          notes: 'Test trade',
          tags: 'tech',
          isShort: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          performanceId: null,
        },
      ]

      mockPrisma.trade.findMany.mockResolvedValue(mockTrades)

      const options = {
        type: 'trades' as const,
        ticker: 'AAPL',
        includeOpenPositions: true,
      }

      const buffer = await ExportService.exportTrades(options)

      expect(buffer).toBeInstanceOf(Buffer)
      expect(mockPrisma.trade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ticker: 'AAPL',
          }),
        })
      )
    })

    it('should filter by date range', async () => {
      const mockTrades = [
        {
          id: 1,
          ticker: 'AAPL',
          entryDate: new Date('2024-01-01'),
          entryPrice: 150,
          exitDate: new Date('2024-01-15'),
          exitPrice: 160,
          quantity: 10,
          fees: 9.99,
          notes: 'Test trade',
          tags: 'tech',
          isShort: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          performanceId: null,
        },
      ]

      mockPrisma.trade.findMany.mockResolvedValue(mockTrades)

      const options = {
        type: 'trades' as const,
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31'),
        },
        includeOpenPositions: true,
      }

      const buffer = await ExportService.exportTrades(options)

      expect(buffer).toBeInstanceOf(Buffer)
      expect(mockPrisma.trade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entryDate: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-01-31'),
            },
          }),
        })
      )
    })

    it('should exclude open positions when specified', async () => {
      const mockTrades = [
        {
          id: 1,
          ticker: 'AAPL',
          entryDate: new Date('2024-01-01'),
          entryPrice: 150,
          exitDate: new Date('2024-01-15'),
          exitPrice: 160,
          quantity: 10,
          fees: 9.99,
          notes: 'Test trade',
          tags: 'tech',
          isShort: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          performanceId: null,
        },
      ]

      mockPrisma.trade.findMany.mockResolvedValue(mockTrades)

      const options = {
        type: 'trades' as const,
        includeOpenPositions: false,
      }

      const buffer = await ExportService.exportTrades(options)

      expect(buffer).toBeInstanceOf(Buffer)
      expect(mockPrisma.trade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            exitDate: { not: null },
            exitPrice: { not: null },
          }),
        })
      )
    })
  })

  describe('exportPerformance', () => {
    it('should export performance data successfully', async () => {
      const mockTrades = [
        {
          id: 1,
          ticker: 'AAPL',
          entryDate: new Date('2024-01-01'),
          entryPrice: 150,
          exitDate: new Date('2024-01-15'),
          exitPrice: 160,
          quantity: 10,
          fees: 9.99,
          notes: 'Test trade',
          tags: 'tech',
          isShort: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          performanceId: null,
        },
      ]

      mockPrisma.trade.findMany.mockResolvedValue(mockTrades)

      const options = {
        type: 'performance' as const,
      }

      const buffer = await ExportService.exportPerformance(options)

      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)
      expect(mockPrisma.trade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            exitDate: { not: null },
            exitPrice: { not: null },
          }),
        })
      )
    })

    it('should handle empty trades for performance export', async () => {
      mockPrisma.trade.findMany.mockResolvedValue([])

      const options = {
        type: 'performance' as const,
      }

      await expect(ExportService.exportPerformance(options)).rejects.toThrow(
        'No closed trades found for performance analysis'
      )
    })
  })

  describe('exportData', () => {
    it('should export trades data', async () => {
      const mockTrades = [
        {
          id: 1,
          ticker: 'AAPL',
          entryDate: new Date('2024-01-01'),
          entryPrice: 150,
          exitDate: new Date('2024-01-15'),
          exitPrice: 160,
          quantity: 10,
          fees: 9.99,
          notes: 'Test trade',
          tags: 'tech',
          isShort: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          performanceId: null,
        },
      ]

      mockPrisma.trade.findMany.mockResolvedValue(mockTrades)

      const options = {
        type: 'trades' as const,
        includeOpenPositions: true,
      }

      const result = await ExportService.exportData(options)

      expect(result.buffer).toBeInstanceOf(Buffer)
      expect(result.filename).toMatch(/trades_export_\d{4}-\d{2}-\d{2}\.xlsx/)
    })

    it('should export performance data', async () => {
      const mockTrades = [
        {
          id: 1,
          ticker: 'AAPL',
          entryDate: new Date('2024-01-01'),
          entryPrice: 150,
          exitDate: new Date('2024-01-15'),
          exitPrice: 160,
          quantity: 10,
          fees: 9.99,
          notes: 'Test trade',
          tags: 'tech',
          isShort: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          performanceId: null,
        },
      ]

      mockPrisma.trade.findMany.mockResolvedValue(mockTrades)

      const options = {
        type: 'performance' as const,
      }

      const result = await ExportService.exportData(options)

      expect(result.buffer).toBeInstanceOf(Buffer)
      expect(result.filename).toMatch(/performance_export_\d{4}-\d{2}-\d{2}\.xlsx/)
    })

    it('should export analytics data', async () => {
      const mockTrades = [
        {
          id: 1,
          ticker: 'AAPL',
          entryDate: new Date('2024-01-01'),
          entryPrice: 150,
          exitDate: new Date('2024-01-15'),
          exitPrice: 160,
          quantity: 10,
          fees: 9.99,
          notes: 'Test trade',
          tags: 'tech',
          isShort: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          performanceId: null,
        },
      ]

      mockPrisma.trade.findMany.mockResolvedValue(mockTrades)

      const options = {
        type: 'analytics' as const,
      }

      const result = await ExportService.exportData(options)

      expect(result.buffer).toBeInstanceOf(Buffer)
      expect(result.filename).toMatch(/analytics_export_\d{4}-\d{2}-\d{2}\.xlsx/)
    })

    it('should throw error for invalid export type', async () => {
      const options = {
        type: 'invalid' as any,
      }

      await expect(ExportService.exportData(options)).rejects.toThrow('Invalid export type')
    })
  })
}) 