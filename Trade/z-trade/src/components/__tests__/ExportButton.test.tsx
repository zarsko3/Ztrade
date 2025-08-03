import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExportButton from '../export/ExportButton'

// Mock fetch
global.fetch = jest.fn()

describe('ExportButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('should render with default props', () => {
    render(<ExportButton type="trades" />)
    
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText('Export trades')).toBeInTheDocument()
  })

  it('should render with custom children', () => {
    render(
      <ExportButton type="trades">
        Custom Export Text
      </ExportButton>
    )
    
    expect(screen.getByText('Custom Export Text')).toBeInTheDocument()
  })

  it('should handle different variants', () => {
    const { rerender } = render(
      <ExportButton type="trades" variant="primary" />
    )
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('btn-primary')

    rerender(<ExportButton type="trades" variant="ghost" />)
    expect(button).toHaveClass('btn-ghost')

    rerender(<ExportButton type="trades" variant="outline" />)
    expect(button).toHaveClass('btn', 'btn-outline')
  })

  it('should handle different sizes', () => {
    const { rerender } = render(
      <ExportButton type="trades" size="sm" />
    )
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm')

    rerender(<ExportButton type="trades" size="lg" />)
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg')

    rerender(<ExportButton type="trades" size="md" />)
    expect(button).toHaveClass('px-4', 'py-2')
  })

  it('should initiate export on click', async () => {
    const mockResponse = {
      ok: true,
      blob: () => Promise.resolve(new Blob(['mock data'])),
      headers: new Headers({
        'content-disposition': 'attachment; filename="trades_export_2024-01-01.xlsx"'
      })
    }
    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

    const user = userEvent.setup()
    render(<ExportButton type="trades" />)
    
    const button = screen.getByRole('button')
    await user.click(button)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/export?type=trades')
      )
    })
  })

  it('should show loading state during export', async () => {
    const mockResponse = {
      ok: true,
      blob: () => new Promise(resolve => setTimeout(() => resolve(new Blob(['mock data'])), 100)),
      headers: new Headers({
        'content-disposition': 'attachment; filename="trades_export_2024-01-01.xlsx"'
      })
    }
    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

    const user = userEvent.setup()
    render(<ExportButton type="trades" />)
    
    const button = screen.getByRole('button')
    await user.click(button)

    // Should show loading state
    expect(screen.getByText('Exporting...')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should handle export success', async () => {
    const mockResponse = {
      ok: true,
      blob: () => Promise.resolve(new Blob(['mock data'])),
      headers: new Headers({
        'content-disposition': 'attachment; filename="trades_export_2024-01-01.xlsx"'
      })
    }
    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

    const onSuccess = jest.fn()
    const user = userEvent.setup()
    render(
      <ExportButton 
        type="trades" 
        onSuccess={onSuccess}
      />
    )
    
    const button = screen.getByRole('button')
    await user.click(button)

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('trades_export_2024-01-01.xlsx')
    })
  })

  it('should handle export error', async () => {
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({ error: 'Export failed' })
    }
    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

    const onError = jest.fn()
    const user = userEvent.setup()
    render(
      <ExportButton 
        type="trades" 
        onError={onError}
      />
    )
    
    const button = screen.getByRole('button')
    await user.click(button)

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Export failed')
    })
  })

  it('should handle network errors', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    const onError = jest.fn()
    const user = userEvent.setup()
    render(
      <ExportButton 
        type="trades" 
        onError={onError}
      />
    )
    
    const button = screen.getByRole('button')
    await user.click(button)

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Network error')
    })
  })

  it('should pass query parameters correctly', async () => {
    const mockResponse = {
      ok: true,
      blob: () => Promise.resolve(new Blob(['mock data'])),
      headers: new Headers({
        'content-disposition': 'attachment; filename="export.xlsx"'
      })
    }
    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

    const user = userEvent.setup()
    render(
      <ExportButton 
        type="trades"
        ticker="AAPL"
        includeOpenPositions={false}
        dateRange={{
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31')
        }}
      />
    )
    
    const button = screen.getByRole('button')
    await user.click(button)

    await waitFor(() => {
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0]
      expect(fetchCall).toContain('type=trades')
      expect(fetchCall).toContain('ticker=AAPL')
      expect(fetchCall).toContain('includeOpenPositions=false')
      expect(fetchCall).toContain('startDate=2024-01-01')
      expect(fetchCall).toContain('endDate=2024-01-31')
    })
  })

  it('should show progress indicator during export', async () => {
    const mockResponse = {
      ok: true,
      blob: () => new Promise(resolve => setTimeout(() => resolve(new Blob(['mock data'])), 100)),
      headers: new Headers({
        'content-disposition': 'attachment; filename="export.xlsx"'
      })
    }
    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

    const user = userEvent.setup()
    render(<ExportButton type="trades" />)
    
    const button = screen.getByRole('button')
    await user.click(button)

    // Should show progress indicator
    await waitFor(() => {
      expect(screen.getByText('Export Progress')).toBeInTheDocument()
    })
  })

  it('should close progress indicator after success', async () => {
    const mockResponse = {
      ok: true,
      blob: () => Promise.resolve(new Blob(['mock data'])),
      headers: new Headers({
        'content-disposition': 'attachment; filename="export.xlsx"'
      })
    }
    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

    const user = userEvent.setup()
    render(<ExportButton type="trades" />)
    
    const button = screen.getByRole('button')
    await user.click(button)

    // Progress indicator should appear
    await waitFor(() => {
      expect(screen.getByText('Export Progress')).toBeInTheDocument()
    })

    // Progress indicator should disappear after success
    await waitFor(() => {
      expect(screen.queryByText('Export Progress')).not.toBeInTheDocument()
    }, { timeout: 4000 })
  })

  it('should be disabled during export', async () => {
    const mockResponse = {
      ok: true,
      blob: () => new Promise(resolve => setTimeout(() => resolve(new Blob(['mock data'])), 100)),
      headers: new Headers({
        'content-disposition': 'attachment; filename="export.xlsx"'
      })
    }
    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

    const user = userEvent.setup()
    render(<ExportButton type="trades" />)
    
    const button = screen.getByRole('button')
    await user.click(button)

    // Button should be disabled during export
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')
  })

  it('should handle different export types', async () => {
    const mockResponse = {
      ok: true,
      blob: () => Promise.resolve(new Blob(['mock data'])),
      headers: new Headers({
        'content-disposition': 'attachment; filename="export.xlsx"'
      })
    }
    ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

    const user = userEvent.setup()
    
    // Test trades export
    const { rerender } = render(<ExportButton type="trades" />)
    const button = screen.getByRole('button')
    await user.click(button)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('type=trades')
      )
    })

    // Test performance export
    rerender(<ExportButton type="performance" />)
    await user.click(button)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('type=performance')
      )
    })

    // Test analytics export
    rerender(<ExportButton type="analytics" />)
    await user.click(button)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('type=analytics')
      )
    })
  })
}) 