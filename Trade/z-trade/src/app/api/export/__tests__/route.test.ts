import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

// Mock ExportService
jest.mock('@/services/export-service', () => ({
  ExportService: {
    exportData: jest.fn(),
  },
}))

const mockExportService = require('@/services/export-service').ExportService

describe('/api/export', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should export trades successfully', async () => {
      const mockBuffer = Buffer.from('mock excel data')
      const mockFilename = 'trades_export_2024-01-01.xlsx'
      
      mockExportService.exportData.mockResolvedValue({
        buffer: mockBuffer,
        filename: mockFilename,
      })

      const request = new NextRequest('http://localhost:3000/api/export?type=trades')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      expect(response.headers.get('content-disposition')).toBe(
        `attachment; filename="${mockFilename}"`
      )
      expect(response.headers.get('content-length')).toBe(mockBuffer.length.toString())
    })

    it('should export performance data successfully', async () => {
      const mockBuffer = Buffer.from('mock performance data')
      const mockFilename = 'performance_export_2024-01-01.xlsx'
      
      mockExportService.exportData.mockResolvedValue({
        buffer: mockBuffer,
        filename: mockFilename,
      })

      const request = new NextRequest('http://localhost:3000/api/export?type=performance')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockExportService.exportData).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'performance',
          format: 'xlsx',
        })
      )
    })

    it('should export analytics data successfully', async () => {
      const mockBuffer = Buffer.from('mock analytics data')
      const mockFilename = 'analytics_export_2024-01-01.xlsx'
      
      mockExportService.exportData.mockResolvedValue({
        buffer: mockBuffer,
        filename: mockFilename,
      })

      const request = new NextRequest('http://localhost:3000/api/export?type=analytics')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockExportService.exportData).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'analytics',
          format: 'xlsx',
        })
      )
    })

    it('should handle date range parameters', async () => {
      const mockBuffer = Buffer.from('mock data')
      mockExportService.exportData.mockResolvedValue({
        buffer: mockBuffer,
        filename: 'export.xlsx',
      })

      const request = new NextRequest(
        'http://localhost:3000/api/export?type=trades&startDate=2024-01-01&endDate=2024-01-31'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockExportService.exportData).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'trades',
          dateRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-31'),
          },
        })
      )
    })

    it('should handle ticker parameter', async () => {
      const mockBuffer = Buffer.from('mock data')
      mockExportService.exportData.mockResolvedValue({
        buffer: mockBuffer,
        filename: 'export.xlsx',
      })

      const request = new NextRequest(
        'http://localhost:3000/api/export?type=trades&ticker=AAPL'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockExportService.exportData).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'trades',
          ticker: 'AAPL',
        })
      )
    })

    it('should handle includeOpenPositions parameter', async () => {
      const mockBuffer = Buffer.from('mock data')
      mockExportService.exportData.mockResolvedValue({
        buffer: mockBuffer,
        filename: 'export.xlsx',
      })

      const request = new NextRequest(
        'http://localhost:3000/api/export?type=trades&includeOpenPositions=false'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockExportService.exportData).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'trades',
          includeOpenPositions: false,
        })
      )
    })

    it('should validate export type parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/export?type=invalid')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid export type. Must be one of: trades, performance, analytics')
    })

    it('should validate date format', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/export?type=trades&startDate=invalid-date&endDate=2024-01-31'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid date format')
    })

    it('should validate date range order', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/export?type=trades&startDate=2024-01-31&endDate=2024-01-01'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Start date must be before end date')
    })

    it('should handle export service errors', async () => {
      mockExportService.exportData.mockRejectedValue(new Error('No trades found'))

      const request = new NextRequest('http://localhost:3000/api/export?type=trades')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('No trades found')
    })

    it('should handle generic export errors', async () => {
      mockExportService.exportData.mockRejectedValue(new Error('Export failed'))

      const request = new NextRequest('http://localhost:3000/api/export?type=trades')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Export failed')
    })
  })

  describe('POST', () => {
    it('should handle POST requests with JSON body', async () => {
      const mockBuffer = Buffer.from('mock data')
      mockExportService.exportData.mockResolvedValue({
        buffer: mockBuffer,
        filename: 'export.xlsx',
      })

      const exportOptions = {
        type: 'trades' as const,
        dateRange: {
          start: '2024-01-01',
          end: '2024-01-31',
        },
        ticker: 'AAPL',
        includeOpenPositions: false,
      }

      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportOptions),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockExportService.exportData).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'trades',
          dateRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-31'),
          },
          ticker: 'AAPL',
          includeOpenPositions: false,
        })
      )
    })

    it('should validate required fields in POST request', async () => {
      const invalidOptions = {
        type: 'invalid',
        dateRange: {
          start: '2024-01-31',
          end: '2024-01-01', // Invalid: end before start
        },
      }

      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidOptions),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid export type. Must be one of: trades, performance, analytics')
    })

    it('should handle invalid JSON in POST request', async () => {
      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid JSON in request body')
    })

    it('should handle missing content-type header', async () => {
      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({ type: 'trades' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Content-Type must be application/json')
    })
  })
}) 