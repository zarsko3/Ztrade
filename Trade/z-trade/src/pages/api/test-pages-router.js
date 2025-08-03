export default function handler(req, res) {
  res.status(200).json({ 
    message: 'Pages Router API is working!',
    method: req.method,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
}