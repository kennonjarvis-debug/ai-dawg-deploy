export default function handler(req, res) {
  // Simple CSRF token for demo
  res.status(200).json({
    csrfToken: 'demo-csrf-token-vercel'
  });
}
