// Simple demo login without database dependency - Vercel serverless function
export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Hardcoded demo user for Quick Demo Login
  const DEMO_EMAIL = 'demo@aidaw.com';
  const DEMO_PASSWORD = 'DemoPassword123!';
  const DEMO_USER_ID = 'bd1e75c6-8375-4d34-9d36-eebc6a217837';

  // For demo purposes, accept any credentials and return the demo user
  // In production, you'd validate against a database
  return res.status(200).json({
    user: {
      id: DEMO_USER_ID,
      email: DEMO_EMAIL,
      name: 'Demo User',
      emailVerified: true,
      isActive: true,
    },
    token: `demo-token-${DEMO_USER_ID}`,
    message: 'Login successful'
  });
}
