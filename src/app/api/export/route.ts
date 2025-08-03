import { NextRequest, NextResponse } from 'next/server';
import { ExportService, ExportOptions } from '@/services/export-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, dateRange, ticker, includeOpenPositions, format = 'xlsx' }: ExportOptions = body;

    // Validate required fields
    if (!type || !['trades', 'performance', 'analytics'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid export type. Must be one of: trades, performance, analytics' },
        { status: 400 }
      );
    }

    // Validate date range if provided
    if (dateRange) {
      if (!dateRange.start || !dateRange.end) {
        return NextResponse.json(
          { error: 'Date range must include both start and end dates' },
          { status: 400 }
        );
      }
      
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }
      
      if (startDate > endDate) {
        return NextResponse.json(
          { error: 'Start date must be before end date' },
          { status: 400 }
        );
      }
    }

    // Prepare export options
    const exportOptions: ExportOptions = {
      type,
      format,
      includeOpenPositions: includeOpenPositions ?? true
    };

    if (dateRange) {
      exportOptions.dateRange = {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end)
      };
    }

    if (ticker) {
      exportOptions.ticker = ticker;
    }

    // Generate export
    const { buffer, filename } = await ExportService.exportData(exportOptions);

    // Return the file as a response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to generate export';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('No trades found')) {
        errorMessage = error.message;
        statusCode = 404;
      } else if (error.message.includes('Invalid export type')) {
        errorMessage = error.message;
        statusCode = 400;
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: statusCode }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'trades' | 'performance' | 'analytics';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const ticker = searchParams.get('ticker');
    const includeOpenPositions = searchParams.get('includeOpenPositions') === 'true';

    // Validate required fields
    if (!type || !['trades', 'performance', 'analytics'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid export type. Must be one of: trades, performance, analytics' },
        { status: 400 }
      );
    }

    // Prepare export options
    const exportOptions: ExportOptions = {
      type,
      format: 'xlsx',
      includeOpenPositions
    };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }
      
      if (start > end) {
        return NextResponse.json(
          { error: 'Start date must be before end date' },
          { status: 400 }
        );
      }
      
      exportOptions.dateRange = { start, end };
    }

    if (ticker) {
      exportOptions.ticker = ticker;
    }

    // Generate export
    const { buffer, filename } = await ExportService.exportData(exportOptions);

    // Return the file as a response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to generate export';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('No trades found')) {
        errorMessage = error.message;
        statusCode = 404;
      } else if (error.message.includes('Invalid export type')) {
        errorMessage = error.message;
        statusCode = 400;
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: statusCode }
    );
  }
} 