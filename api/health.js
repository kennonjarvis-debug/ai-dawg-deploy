export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    service: 'vercel-backend',
    timestamp: new Date().toISOString(),
    version: '3.0.0-vercel',
    environment: process.env.NODE_ENV || 'production'
  });
}
