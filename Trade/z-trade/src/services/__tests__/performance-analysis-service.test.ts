import { performanceAnalysisService } from '../performance-analysis-service'
import { mockTrades } from '@/lib/test-utils'

describe('PerformanceAnalysisService', () => {
  describe('calculatePerformanceMetrics', () => {
    it('should calculate metrics correctly for winning trades', () => {
      const trades = [
        {
          ...mockTrades[0], // AAPL: 150 -> 160 (win)
          entryPrice: 150,
          exitPrice: 160,
          quantity: 10,
          fees: 9.99,
        },
        {
          ...mockTrades[1], // MSFT: 300 -> 320 (win)
          entryPrice: 300,
          exitPrice: 320,
          quantity: 5,
          fees: 9.99,
        },
      ]

      const metrics = performanceAnalysisService.calculatePerformanceMetrics(trades as any)

      expect(metrics.totalTrades).toBe(2)
      expect(metrics.closedTrades).toBe(2)
      expect(metrics.openTrades).toBe(0)
      expect(metrics.winRate).toBe(100)
      expect(metrics.totalPnL).toBeCloseTo(1000.02, 2) // (160-150)*10 - 9.99 + (320-300)*5 - 9.99
      expect(metrics.averageWin).toBeCloseTo(500.01, 2)
      expect(metrics.averageLoss).toBe(0)
      expect(metrics.profitFactor).toBe(0) // No losses, so profit factor is 0
    })

    it('should calculate metrics correctly for mixed trades', () => {
      const trades = [
        {
          ...mockTrades[0], // AAPL: 150 -> 160 (win)
          entryPrice: 150,
          exitPrice: 160,
          quantity: 10,
          fees: 9.99,
        },
        {
          ...mockTrades[1], // MSFT: 300 -> 280 (loss)
          entryPrice: 300,
          exitPrice: 280,
          quantity: 5,
          fees: 9.99,
        },
      ]

      const metrics = performanceAnalysisService.calculatePerformanceMetrics(trades as any)

      expect(metrics.totalTrades).toBe(2)
      expect(metrics.closedTrades).toBe(2)
      expect(metrics.openTrades).toBe(0)
      expect(metrics.winRate).toBe(50)
      expect(metrics.totalPnL).toBeCloseTo(-9.96, 2) // Win: 100.01, Loss: -109.99
      expect(metrics.averageWin).toBeCloseTo(100.01, 2)
      expect(metrics.averageLoss).toBeCloseTo(109.99, 2)
      expect(metrics.profitFactor).toBeCloseTo(0.91, 2) // 100.01 / 109.99
    })

    it('should handle short trades correctly', () => {
      const trades = [
        {
          ...mockTrades[0], // AAPL short: 150 -> 140 (win)
          entryPrice: 150,
          exitPrice: 140,
          quantity: 10,
          fees: 9.99,
          isShort: true,
        },
      ]

      const metrics = performanceAnalysisService.calculatePerformanceMetrics(trades)

      expect(metrics.totalTrades).toBe(1)
      expect(metrics.winningTrades).toBe(1)
      expect(metrics.winRate).toBe(100)
      expect(metrics.totalPnL).toBeCloseTo(90.01, 2) // (150-140)*10 - 9.99
    })

    it('should handle empty trades array', () => {
      const metrics = performanceAnalysisService.calculatePerformanceMetrics([])

      expect(metrics.totalTrades).toBe(0)
      expect(metrics.winningTrades).toBe(0)
      expect(metrics.losingTrades).toBe(0)
      expect(metrics.winRate).toBe(0)
      expect(metrics.totalPnL).toBe(0)
      expect(metrics.averageWin).toBe(0)
      expect(metrics.averageLoss).toBe(0)
      expect(metrics.profitFactor).toBe(0)
      expect(metrics.maxDrawdown).toBe(0)
      expect(metrics.sharpeRatio).toBe(0)
    })

    it('should handle trades with null exit data', () => {
      const trades = [
        {
          ...mockTrades[2], // TSLA: open position
          exitDate: null,
          exitPrice: null,
        },
      ]

      const metrics = performanceAnalysisService.calculatePerformanceMetrics(trades)

      expect(metrics.totalTrades).toBe(1)
      expect(metrics.winningTrades).toBe(0)
      expect(metrics.losingTrades).toBe(0)
      expect(metrics.winRate).toBe(0)
      expect(metrics.totalPnL).toBe(0)
    })

    it('should calculate max drawdown correctly', () => {
      const trades = [
        {
          ...mockTrades[0], // Win: +100
          entryPrice: 150,
          exitPrice: 160,
          quantity: 10,
          fees: 9.99,
        },
        {
          ...mockTrades[1], // Loss: -200
          entryPrice: 300,
          exitPrice: 260,
          quantity: 5,
          fees: 9.99,
        },
        {
          ...mockTrades[0], // Win: +50
          entryPrice: 100,
          exitPrice: 105,
          quantity: 10,
          fees: 9.99,
        },
      ]

      const metrics = performanceAnalysisService.calculatePerformanceMetrics(trades)

      // Expected: Peak at 100, then drops to -100, then recovers to -50
      // Max drawdown should be 200 (from 100 to -100)
      expect(metrics.maxDrawdown).toBeCloseTo(200, 2)
    })

    it('should calculate Sharpe ratio correctly', () => {
      const trades = [
        {
          ...mockTrades[0], // Win: +100
          entryPrice: 150,
          exitPrice: 160,
          quantity: 10,
          fees: 9.99,
        },
        {
          ...mockTrades[1], // Win: +100
          entryPrice: 300,
          exitPrice: 320,
          quantity: 5,
          fees: 9.99,
        },
      ]

      const metrics = performanceAnalysisService.calculatePerformanceMetrics(trades)

      // Sharpe ratio should be positive for consistent wins
      expect(metrics.sharpeRatio).toBeGreaterThan(0)
    })
  })

  describe('analyzePatterns', () => {
    it('should detect inconsistent position sizing', () => {
      const trades = [
        { ...mockTrades[0], quantity: 10 }, // Normal size
        { ...mockTrades[1], quantity: 100 }, // Much larger
        { ...mockTrades[2], quantity: 5 }, // Smaller
      ]

      const patterns = performanceAnalysisService.analyzePatterns(trades)

      expect(patterns).toContain('Inconsistent position sizing - some positions are much larger than average')
    })

    it('should detect very small positions', () => {
      const trades = [
        { ...mockTrades[0], quantity: 10 }, // Normal size
        { ...mockTrades[1], quantity: 1 }, // Very small
        { ...mockTrades[2], quantity: 2 }, // Very small
      ]

      const patterns = performanceAnalysisService.analyzePatterns(trades)

      expect(patterns).toContain('Very small positions detected - may indicate lack of confidence')
    })

    it('should detect high frequency day trading', () => {
      const trades = [
        {
          ...mockTrades[0],
          entryDate: new Date('2024-01-01'),
          exitDate: new Date('2024-01-01'), // Same day
        },
        {
          ...mockTrades[1],
          entryDate: new Date('2024-01-02'),
          exitDate: new Date('2024-01-02'), // Same day
        },
        {
          ...mockTrades[2],
          entryDate: new Date('2024-01-03'),
          exitDate: new Date('2024-01-03'), // Same day
        },
      ]

      const patterns = performanceAnalysisService.analyzePatterns(trades)

      expect(patterns).toContain('High frequency of day trading - consider longer-term positions')
    })

    it('should detect long-term holding patterns', () => {
      const trades = [
        {
          ...mockTrades[0],
          entryDate: new Date('2024-01-01'),
          exitDate: new Date('2024-02-01'), // 31 days
        },
        {
          ...mockTrades[1],
          entryDate: new Date('2024-01-01'),
          exitDate: new Date('2024-03-01'), // 60 days
        },
      ]

      const patterns = performanceAnalysisService.analyzePatterns(trades)

      expect(patterns).toContain('Long-term holding pattern - may miss short-term opportunities')
    })

    it('should detect high ticker concentration', () => {
      const trades = [
        { ...mockTrades[0], ticker: 'AAPL' },
        { ...mockTrades[1], ticker: 'AAPL' },
        { ...mockTrades[2], ticker: 'AAPL' },
        { ...mockTrades[0], ticker: 'MSFT' },
      ]

      const patterns = performanceAnalysisService.analyzePatterns(trades)

      expect(patterns).toContain('High concentration in AAPL - consider diversification')
    })

    it('should detect trading day concentration', () => {
      const trades = [
        {
          ...mockTrades[0],
          entryDate: new Date('2024-01-01'), // Monday
        },
        {
          ...mockTrades[1],
          entryDate: new Date('2024-01-08'), // Monday
        },
        {
          ...mockTrades[2],
          entryDate: new Date('2024-01-15'), // Monday
        },
        {
          ...mockTrades[0],
          entryDate: new Date('2024-01-02'), // Tuesday
        },
      ]

      const patterns = performanceAnalysisService.analyzePatterns(trades)

      expect(patterns).toContain('Trading concentrated on Monday - may miss opportunities on other days')
    })

    it('should return empty array for no trades', () => {
      const patterns = performanceAnalysisService.analyzePatterns([])

      expect(patterns).toEqual([])
    })
  })

  describe('generateInsights', () => {
    it('should generate insights for low win rate', () => {
      const trades = [
        {
          ...mockTrades[0], // Loss
          entryPrice: 150,
          exitPrice: 140,
          quantity: 10,
          fees: 9.99,
        },
        {
          ...mockTrades[1], // Loss
          entryPrice: 300,
          exitPrice: 280,
          quantity: 5,
          fees: 9.99,
        },
        {
          ...mockTrades[2], // Win
          entryPrice: 200,
          exitPrice: 220,
          quantity: 8,
          fees: 9.99,
        },
      ]

      const insights = performanceAnalysisService.generateInsights(trades)

      const lowWinRateInsight = insights.find(insight => insight.title === 'Low Win Rate')
      expect(lowWinRateInsight).toBeDefined()
      expect(lowWinRateInsight?.severity).toBe('high')
      expect(lowWinRateInsight?.actionable).toBe(true)
    })

    it('should generate insights for excellent win rate', () => {
      const trades = [
        {
          ...mockTrades[0], // Win
          entryPrice: 150,
          exitPrice: 160,
          quantity: 10,
          fees: 9.99,
        },
        {
          ...mockTrades[1], // Win
          entryPrice: 300,
          exitPrice: 320,
          quantity: 5,
          fees: 9.99,
        },
        {
          ...mockTrades[2], // Win
          entryPrice: 200,
          exitPrice: 220,
          quantity: 8,
          fees: 9.99,
        },
      ]

      const insights = performanceAnalysisService.generateInsights(trades)

      const excellentWinRateInsight = insights.find(insight => insight.title === 'Excellent Win Rate')
      expect(excellentWinRateInsight).toBeDefined()
      expect(excellentWinRateInsight?.severity).toBe('low')
      expect(excellentWinRateInsight?.actionable).toBe(true)
    })

    it('should generate insights for high drawdown', () => {
      const trades = [
        {
          ...mockTrades[0], // Large loss
          entryPrice: 150,
          exitPrice: 100,
          quantity: 100, // Large position
          fees: 9.99,
        },
      ]

      const insights = performanceAnalysisService.generateInsights(trades)

      const highDrawdownInsight = insights.find(insight => insight.title === 'High Maximum Drawdown')
      expect(highDrawdownInsight).toBeDefined()
      expect(highDrawdownInsight?.severity).toBe('high')
      expect(highDrawdownInsight?.actionable).toBe(true)
    })

    it('should generate pattern-based insights', () => {
      const trades = [
        { ...mockTrades[0], ticker: 'AAPL' },
        { ...mockTrades[1], ticker: 'AAPL' },
        { ...mockTrades[2], ticker: 'AAPL' },
      ]

      const insights = performanceAnalysisService.generateInsights(trades)

      const patternInsight = insights.find(insight => insight.title === 'Trading Pattern Detected')
      expect(patternInsight).toBeDefined()
      expect(patternInsight?.type).toBe('pattern')
      expect(patternInsight?.actionable).toBe(true)
    })

    it('should handle empty trades array', () => {
      const insights = performanceAnalysisService.generateInsights([])

      expect(insights).toHaveLength(1)
      expect(insights[0].title).toBe('No Trading Data')
      expect(insights[0].actionable).toBe(false)
    })
  })

  describe('generateStrategySuggestions', () => {
    it('should suggest improvements for low win rate', () => {
      const trades = [
        {
          ...mockTrades[0], // Loss
          entryPrice: 150,
          exitPrice: 140,
          quantity: 10,
          fees: 9.99,
        },
        {
          ...mockTrades[1], // Loss
          entryPrice: 300,
          exitPrice: 280,
          quantity: 5,
          fees: 9.99,
        },
      ]

      const suggestions = performanceAnalysisService.generateStrategySuggestions(trades)

      expect(suggestions).toContain('Improve your entry criteria - wait for stronger signals')
      expect(suggestions).toContain('Consider using technical indicators for better timing')
      expect(suggestions).toContain('Review your losing trades to identify common patterns')
    })

    it('should suggest improvements for low profit factor', () => {
      const trades = [
        {
          ...mockTrades[0], // Small win
          entryPrice: 150,
          exitPrice: 151,
          quantity: 10,
          fees: 9.99,
        },
        {
          ...mockTrades[1], // Small loss
          entryPrice: 300,
          exitPrice: 299,
          quantity: 5,
          fees: 9.99,
        },
      ]

      const suggestions = performanceAnalysisService.generateStrategySuggestions(trades)

      expect(suggestions).toContain('Work on your risk-reward ratio - aim for 2:1 or better')
      expect(suggestions).toContain('Let your winners run longer before taking profits')
      expect(suggestions).toContain('Cut your losses more quickly - don\'t let small losses become big ones')
    })

    it('should suggest position sizing improvements', () => {
      const trades = [
        { ...mockTrades[0], quantity: 10 }, // Normal
        { ...mockTrades[1], quantity: 100 }, // Much larger
        { ...mockTrades[2], quantity: 5 }, // Smaller
      ]

      const suggestions = performanceAnalysisService.generateStrategySuggestions(trades)

      expect(suggestions).toContain('Standardize your position sizes for more consistent results')
      expect(suggestions).toContain('Consider using a fixed percentage of your capital per trade')
    })

    it('should suggest diversification improvements', () => {
      const trades = [
        { ...mockTrades[0], ticker: 'AAPL' },
        { ...mockTrades[1], ticker: 'AAPL' },
        { ...mockTrades[2], ticker: 'AAPL' },
      ]

      const suggestions = performanceAnalysisService.generateStrategySuggestions(trades)

      expect(suggestions).toContain('Consider diversifying across more stocks to reduce risk')
      expect(suggestions).toContain('Look for opportunities in different sectors')
    })

    it('should provide basic suggestions for empty trades', () => {
      const suggestions = performanceAnalysisService.generateStrategySuggestions([])

      expect(suggestions).toContain('Start with paper trading to develop your strategy')
      expect(suggestions).toContain('Focus on one or two stocks initially to build consistency')
      expect(suggestions).toContain('Keep detailed records of your trades and reasoning')
    })
  })
}) 