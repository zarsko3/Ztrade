# WebSocket Real-time Integration

This document describes the WebSocket integration for real-time updates in the Trade Tracker application.

## Overview

The WebSocket integration provides real-time updates for:
- Market data (stock prices, changes, volume)
- Trade updates (create, update, close, delete)
- Performance metrics

## Architecture

### Server-side (Custom Next.js Server)
- **File**: `server.js`
- **Purpose**: Custom server that combines Next.js with Socket.IO
- **Features**:
  - WebSocket server setup with CORS configuration
  - Room-based subscriptions for different data types
  - Global io instance for API routes

### Client-side Services
- **File**: `src/services/websocket-service.ts`
- **Purpose**: Singleton service for WebSocket client management
- **Features**:
  - Automatic connection management
  - Market data polling (30-second intervals)
  - Event emission and listening
  - Connection status tracking

### React Hooks
- **File**: `src/hooks/useWebSocket.ts`
- **Purpose**: React hook for WebSocket functionality
- **Features**:
  - State management for real-time data
  - Automatic reconnection
  - Event handling
  - Connection status management

## Components

### Real-time Market Data
- **File**: `src/components/market/RealTimeMarketData.tsx`
- **Features**:
  - Live stock price updates
  - Symbol selection
  - Connection status display
  - Expandable interface

### Real-time Trade Updates
- **File**: `src/components/trades/RealTimeTradeUpdates.tsx`
- **Features**:
  - Live trade notifications
  - Action-based icons and colors
  - Timestamp formatting
  - Update history management

### Real-time Dashboard
- **File**: `src/components/dashboard/RealTimeDashboard.tsx`
- **Features**:
  - Comprehensive real-time overview
  - Performance metrics display
  - Connection management
  - Modular component integration

## API Integration

### WebSocket Utilities
- **File**: `src/lib/websocket-utils.ts`
- **Purpose**: Utility functions for API routes to emit WebSocket updates
- **Functions**:
  - `emitTradeUpdate()`: Emit trade-related updates
  - `emitPerformanceUpdate()`: Emit performance metrics
  - `emitMarketDataUpdate()`: Emit market data updates
  - `createTradeUpdate()`: Create trade update objects

### API Route Updates
The following API routes have been updated to emit WebSocket updates:

1. **POST /api/trades** - Emits 'created' event when new trade is created
2. **PUT /api/trades/[id]** - Emits 'updated' event when trade is modified
3. **DELETE /api/trades/[id]** - Emits 'deleted' event when trade is removed
4. **POST /api/trades/[id]/close** - Emits 'closed' event when trade is closed

## Usage

### Basic WebSocket Hook Usage
```typescript
import { useWebSocket } from '@/hooks/useWebSocket';

function MyComponent() {
  const {
    isConnected,
    marketData,
    tradeUpdates,
    performanceUpdates,
    connect,
    disconnect
  } = useWebSocket({
    autoConnect: true,
    marketDataSymbols: ['AAPL', 'GOOGL'],
    enableTradeUpdates: true,
    enablePerformanceUpdates: true
  });

  return (
    <div>
      <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
      <p>Market Data: {marketData.length} symbols</p>
      <p>Trade Updates: {tradeUpdates.length} updates</p>
    </div>
  );
}
```

### Component Usage
```typescript
import { RealTimeDashboard } from '@/components/dashboard/RealTimeDashboard';

function Dashboard() {
  return (
    <RealTimeDashboard 
      defaultSymbols={['^GSPC', 'AAPL', 'GOOGL', 'MSFT']}
      showMarketData={true}
      showTradeUpdates={true}
      showPerformanceMetrics={true}
    />
  );
}
```

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "node server.js",
    "start": "NODE_ENV=production node server.js"
  }
}
```

## Testing

### Test Page
- **URL**: `/test`
- **Purpose**: Dedicated page for testing WebSocket functionality
- **Features**:
  - Real-time dashboard display
  - Connection status monitoring
  - Market data visualization
  - Trade update notifications

### Manual Testing
1. Start the development server: `npm run dev`
2. Navigate to `/test` or `/dashboard`
3. Click "Connect" to establish WebSocket connection
4. Create, update, or close trades to see real-time updates
5. Monitor market data updates every 30 seconds

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check if the custom server is running (`node server.js`)
   - Verify CORS configuration
   - Check browser console for errors

2. **No Market Data Updates**
   - Verify Yahoo Finance API is accessible
   - Check symbol validity
   - Monitor server logs for API errors

3. **Trade Updates Not Appearing**
   - Verify WebSocket connection is established
   - Check API route WebSocket emissions
   - Monitor server logs for emission errors

### Debug Mode
Enable debug logging by adding to `server.js`:
```javascript
const io = new Server(server, {
  cors: { /* ... */ },
  debug: true
});
```

## Performance Considerations

- Market data updates are limited to 30-second intervals
- Trade updates are emitted immediately on database changes
- WebSocket connections are managed as singletons
- Automatic reconnection on connection loss
- Room-based subscriptions reduce unnecessary data transmission

## Security

- CORS configuration restricts origins
- WebSocket events are validated on both client and server
- No sensitive data transmitted via WebSocket
- Connection authentication can be added if needed

## Future Enhancements

1. **Authentication**: Add user-specific WebSocket rooms
2. **Rate Limiting**: Implement WebSocket event rate limiting
3. **Compression**: Add message compression for large datasets
4. **Persistence**: Add WebSocket message persistence
5. **Analytics**: Add WebSocket usage analytics
6. **Mobile Support**: Optimize for mobile WebSocket connections 