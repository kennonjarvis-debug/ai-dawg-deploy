# OAuth Quick Reference Card

Quick reference for OAuth implementation in DAWG AI.

---

## Environment Variables

```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
OAUTH_CALLBACK_URL=http://localhost:3000
JWT_SECRET=your-secret-key
```

---

## OAuth URLs

### Google
- **Setup**: https://console.cloud.google.com/
- **Callback**: `http://localhost:3000/api/auth/google/callback`

### GitHub
- **Setup**: https://github.com/settings/developers
- **Callback**: `http://localhost:3000/api/auth/github/callback`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google` | Start Google OAuth |
| GET | `/api/auth/github` | Start GitHub OAuth |
| GET | `/api/auth/google/callback` | Google callback |
| GET | `/api/auth/github/callback` | GitHub callback |
| GET | `/api/auth/oauth/accounts` | Get linked accounts |
| DELETE | `/api/auth/oauth/:provider` | Unlink provider |
| GET | `/api/auth/oauth/config` | Check OAuth status |

---

## Database Commands

```bash
# Generate Prisma client
npm run db:generate

# Run migration
npm run db:migrate

# Open Prisma Studio
npm run db:studio
```

---

## Start Development

```bash
# Terminal 1 - Backend
npm run dev:unified

# Terminal 2 - Frontend
npm run dev:ui

# Open browser
http://localhost:3000/login
```

---

## React Components

### OAuthButtons
```tsx
import { OAuthButtons } from './components/OAuthButtons';

<OAuthButtons
  redirectUrl="/dashboard"
  onError={(err) => console.error(err)}
/>
```

### OAuthDivider
```tsx
import { OAuthDivider } from './components/OAuthButtons';

<OAuthDivider text="Or continue with" />
```

---

## Service Usage

### Get OAuth Accounts
```typescript
import { oauthService } from './services/oauth-service';

const accounts = await oauthService.getUserOAuthAccounts(userId);
```

### Unlink OAuth
```typescript
await oauthService.unlinkOAuthAccount(userId, 'google');
```

---

## Common Issues

| Issue | Solution |
|-------|----------|
| Redirect URI mismatch | Check callback URLs match exactly |
| Invalid state | Clear cookies, retry OAuth flow |
| No verified email | Ensure provider account has verified email |
| Cannot unlink | Set password or link another provider |

---

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Set `NODE_ENV=production`
- [ ] Strong `JWT_SECRET`
- [ ] Rotate credentials regularly
- [ ] Never commit `.env` files
- [ ] Enable secure cookies
- [ ] Configure CORS properly

---

## File Locations

```
src/backend/services/oauth-service.ts      # OAuth logic
src/backend/routes/oauth-routes.ts         # OAuth routes
src/ui/components/OAuthButtons.tsx         # UI components
src/types/auth.ts                          # Types
prisma/schema.prisma                       # Database schema
docs/OAUTH_SETUP.md                        # Full setup guide
```

---

## Test URLs

- **Login**: http://localhost:3000/login
- **Config**: http://localhost:3000/api/auth/oauth/config
- **Backend Health**: http://localhost:3100/health

---

## Production URLs

```bash
# Update for production
OAUTH_CALLBACK_URL=https://yourdomain.com

# Callback URLs
https://yourdomain.com/api/auth/google/callback
https://yourdomain.com/api/auth/github/callback
```

---

## Documentation

- 📘 [Setup Guide](./OAUTH_SETUP.md)
- 📗 [Implementation Summary](./OAUTH_IMPLEMENTATION_SUMMARY.md)
- 📙 [README](./OAUTH_README.md)
- 📕 Quick Reference (this file)

---

## Support Links

- [Google OAuth Docs](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Docs](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Passport.js](http://www.passportjs.org/)
