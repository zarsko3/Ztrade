import type { TradeUpdate, PerformanceUpdate } from '@/services/websocket-service';

// Access the global io instance without type conflicts
const getIO = () => {
  return (global as any).io;
};

export function emitTradeUpdate(update: TradeUpdate) {
  try {
    const io = getIO();
    if (io) {
      io.to('trade-updates').emit('trade-update', update);
      console.log('Emitted trade update:', update.action, update.id);
    }
  } catch (error) {
    console.error('Error emitting trade update:', error);
  }
}

export function emitPerformanceUpdate(update: PerformanceUpdate) {
  try {
    const io = getIO();
    if (io) {
      io.to('performance-updates').emit('performance-update', update);
      console.log('Emitted performance update');
    }
  } catch (error) {
    console.error('Error emitting performance update:', error);
  }
}

export function emitMarketDataUpdate(data: any[]) {
  try {
    const io = getIO();
    if (io) {
      io.to('market-data').emit('market-data-update', data);
      console.log('Emitted market data update for', data.length, 'symbols');
    }
  } catch (error) {
    console.error('Error emitting market data update:', error);
  }
}

export function createTradeUpdate(
  id: string,
  action: TradeUpdate['action'],
  trade: any
): TradeUpdate {
  return {
    id,
    action,
    trade,
    timestamp: new Date().toISOString(),
  };
} 