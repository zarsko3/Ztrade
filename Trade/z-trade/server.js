const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Prepare the Next.js app (disable turbopack for custom server)
const app = next({ 
  dev, 
  hostname, 
  port,
  // Disable turbopack to avoid conflicts with custom server
  experimental: {
    turbo: false
  }
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Create Socket.IO server
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        : 'http://localhost:3000',
      methods: ['GET', 'POST']
    },
    pingTimeout: 20000, // 20 seconds
    pingInterval: 10000, // 10 seconds
    upgradeTimeout: 3000, // 3 seconds
    allowUpgrades: false, // Disable upgrades for now
    transports: ['polling'],
    allowEIO3: true,
  });

  // WebSocket connection handling
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Handle market data subscriptions
    socket.on('subscribe-market-data', (symbols) => {
      console.log('Client subscribed to market data:', symbols);
      socket.join('market-data');
      socket.data = socket.data || {};
      socket.data.subscribedSymbols = symbols;
    });

    // Handle trade updates subscriptions
    socket.on('subscribe-trade-updates', () => {
      console.log('Client subscribed to trade updates');
      socket.join('trade-updates');
    });

    // Handle performance updates subscriptions
    socket.on('subscribe-performance-updates', () => {
      console.log('Client subscribed to performance updates');
      socket.join('performance-updates');
    });

    // Handle market data updates from client
    socket.on('market-data-update', (data) => {
      console.log('Broadcasting market data update to room');
      socket.to('market-data').emit('market-data-update', data);
    });

    // Handle trade updates from client
    socket.on('trade-update', (update) => {
      console.log('Broadcasting trade update to room');
      socket.to('trade-updates').emit('trade-update', update);
    });

    // Handle performance updates from client
    socket.on('performance-update', (update) => {
      console.log('Broadcasting performance update to room');
      socket.to('performance-updates').emit('performance-update', update);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Make io available globally for API routes
  global.io = io;

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}); 