// Simple demo login without database dependency
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse body if it's a string (Vercel edge function compatibility)
    let body = req.body;
    if (typeof req.body === 'string') {
      body = JSON.parse(req.body);
    }

    const { email, password } = body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Hardcoded demo user for Quick Demo Login
    const DEMO_EMAIL = 'demo@aidaw.com';
    const DEMO_PASSWORD = 'DemoPassword123!';
    const DEMO_USER_ID = 'bd1e75c6-8375-4d34-9d36-eebc6a217837';

    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      // Return user and simple token
      res.status(200).json({
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
    } else {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
