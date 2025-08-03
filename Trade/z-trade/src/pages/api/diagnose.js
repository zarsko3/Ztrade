export default function handler(req, res) {
  try {
    const diagnostics = {
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
        JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING',
      },
      request: {
        method: req.method,
        url: req.url,
        headers: req.headers,
      },
      serverInfo: {
        platform: process.platform,
        nodeVersion: process.version,
      },
      message: 'Pages Router API diagnostics endpoint is working'
    };

    res.status(200).json(diagnostics);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}