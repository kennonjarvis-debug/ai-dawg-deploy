// Simple demo projects endpoint without database dependency - Vercel serverless function
export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-user-id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract user ID from auth header or x-user-id header
  const authHeader = req.headers.authorization;
  let userId = req.headers['x-user-id'] || 'demo-user';

  if (authHeader) {
    // Extract user ID from demo token format: demo-token-USER_ID
    const token = authHeader.replace('Bearer ', '');
    if (token.startsWith('demo-token-')) {
      userId = token.replace('demo-token-', '');
    }
  }

  // Handle GET - List projects
  if (req.method === 'GET') {
    // Return demo projects for the user
    const demoProjects = [
      {
        id: 'demo-project-1',
        name: 'Demo Song - Electronic Dance',
        description: 'A demo project showcasing the DAWG AI features',
        bpm: 128,
        sampleRate: 44100,
        timeSignature: '4/4',
        key: 'C',
        userId: userId,
        isPublic: false,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tracks: [],
      },
      {
        id: 'demo-project-2',
        name: 'Demo Song - Hip Hop Beat',
        description: 'Another demo project with hip hop vibes',
        bpm: 90,
        sampleRate: 44100,
        timeSignature: '4/4',
        key: 'Am',
        userId: userId,
        isPublic: false,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tracks: [],
      },
    ];

    return res.status(200).json({
      projects: demoProjects,
      total: demoProjects.length,
      page: 1,
      limit: 10,
    });
  }

  // Handle POST - Create project
  if (req.method === 'POST') {
    const { name, description, bpm, sampleRate, timeSignature, key, isPublic } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        error: 'Project name is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Create demo project
    const newProject = {
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      description: description || '',
      bpm: bpm || 120,
      sampleRate: sampleRate || 44100,
      timeSignature: timeSignature || '4/4',
      key: key || 'C',
      userId: userId,
      isPublic: isPublic || false,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tracks: [],
      audioFiles: [],
      collaborators: [],
    };

    return res.status(201).json(newProject);
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}
