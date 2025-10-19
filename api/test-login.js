// Ultra-simple test login endpoint
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

  // Simplified demo login
  const DEMO_USER_ID = 'bd1e75c6-8375-4d34-9d36-eebc6a217837';

  return res.status(200).json({
    user: {
      id: DEMO_USER_ID,
      email: 'demo@aidaw.com',
      name: 'Demo User',
      emailVerified: true,
      isActive: true,
    },
    token: `demo-token-${DEMO_USER_ID}`,
    message: 'Login successful (test endpoint)'
  });
}
