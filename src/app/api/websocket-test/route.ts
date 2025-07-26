import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check if the global io instance exists
    const io = (global as any).io;
    
    if (!io) {
      return NextResponse.json({
        status: 'error',
        message: 'WebSocket server not initialized',
        connected: false
      });
    }

    // Get connection count
    const connectedClients = io.engine.clientsCount;
    
    return NextResponse.json({
      status: 'success',
      message: 'WebSocket server is running',
      connected: true,
      connectedClients,
      serverInfo: {
        pingTimeout: io.engine.pingTimeout,
        pingInterval: io.engine.pingInterval,
        upgradeTimeout: io.engine.upgradeTimeout
      }
    });
  } catch (error) {
    console.error('Error checking WebSocket server:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to check WebSocket server',
      error: error instanceof Error ? error.message : String(error),
      connected: false
    });
  }
} 