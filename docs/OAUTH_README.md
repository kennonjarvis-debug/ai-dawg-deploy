# OAuth Authentication for DAWG AI

Complete OAuth 2.0 authentication implementation with Google and GitHub login support.

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

Dependencies are already installed:
- `passport` - Authentication middleware
- `passport-google-oauth20` - Google OAuth strategy
- `passport-github2` - GitHub OAuth strategy

### 2. Set Up OAuth Apps

#### Google OAuth Setup (5 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project
3. Enable OAuth 2.0
4. Create credentials (Web application)
5. Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
6. Copy Client ID and Client Secret

#### GitHub OAuth Setup (5 minutes)

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set callback URL: `http://localhost:3000/api/auth/github/callback`
4. Copy Client ID and Client Secret

### 3. Configure Environment Variables

Create/update `.env` file:

```bash
# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
OAUTH_CALLBACK_URL=http://localhost:3000

# Other required variables
JWT_SECRET=your-secret-key
DATABASE_URL=file:./dev.db
NODE_ENV=development
```

### 4. Run Database Migration

```bash
npm run db:migrate
npm run db:generate
```

### 5. Start the Application

```bash
# Terminal 1 - Backend
npm run dev:unified

# Terminal 2 - Frontend
npm run dev:ui
```

### 6. Test OAuth Login

1. Open `http://localhost:3000/login`
2. Click "Continue with Google" or "Continue with GitHub"
3. Complete authentication
4. You'll be redirected to the dashboard

---

## Features

### Implemented

- ✅ Google OAuth 2.0 login
- ✅ GitHub OAuth 2.0 login
- ✅ New user registration via OAuth
- ✅ Automatic account linking for existing users
- ✅ Multiple OAuth providers per account
- ✅ Secure session management (7-day expiry)
- ✅ CSRF protection with state parameter
- ✅ Account unlinking with safety checks
- ✅ OAuth token storage (for future API access)
- ✅ Comprehensive error handling
- ✅ Loading states and user feedback
- ✅ Beautiful UI components

### Security Features

- **CSRF Protection**: State parameter with 10-minute expiry
- **PKCE**: Proof Key for Code Exchange
- **Secure Tokens**: HttpOnly cookies, encrypted storage
- **Account Safety**: Cannot unlink last auth method
- **Input Validation**: Email verification required
- **Session Security**: Secure cookies in production

---

## File Structure

```
src/
├── backend/
│   ├── services/
│   │   ├── oauth-service.ts       # OAuth flow management
│   │   └── auth-service.ts        # Updated with OAuth support
│   └── routes/
│       └── oauth-routes.ts        # OAuth endpoints
├── ui/
│   └── components/
│       ├── OAuthButtons.tsx       # OAuth button components
│       └── LoginForm.tsx          # Updated with OAuth
└── types/
    └── auth.ts                    # OAuth type definitions

prisma/
└── schema.prisma                  # Updated with OAuthAccount model

docs/
├── OAUTH_SETUP.md                 # Detailed setup guide
├── OAUTH_IMPLEMENTATION_SUMMARY.md # Technical overview
└── OAUTH_README.md                # This file
```

---

## Usage Examples

### Frontend - OAuth Login

```tsx
import { OAuthButtons } from './components/OAuthButtons';

function LoginPage() {
  return (
    <div>
      <OAuthButtons
        redirectUrl="/dashboard"
        onError={(error) => console.error(error)}
      />
    </div>
  );
}
```

### Backend - Get User's OAuth Accounts

```typescript
import { oauthService } from './services/oauth-service';

// Get all OAuth accounts for a user
const accounts = await oauthService.getUserOAuthAccounts(userId);

// Unlink an OAuth provider
await oauthService.unlinkOAuthAccount(userId, 'google');
```

### API - Check OAuth Status

```bash
curl http://localhost:3000/api/auth/oauth/config
```

Response:
```json
{
  "google": {
    "enabled": true,
    "clientId": "configured"
  },
  "github": {
    "enabled": true,
    "clientId": "configured"
  }
}
```

---

## How It Works

### OAuth Flow

1. **User Clicks OAuth Button**
   - Frontend redirects to `/api/auth/google` or `/api/auth/github`

2. **State Generation**
   - Backend generates secure state parameter
   - State includes: provider, redirect URL, timestamp, nonce
   - User redirected to OAuth provider

3. **User Authentication**
   - User logs into Google/GitHub
   - User grants permissions

4. **OAuth Callback**
   - Provider redirects to `/api/auth/:provider/callback`
   - Backend verifies state parameter
   - Backend exchanges code for access token

5. **User Creation/Linking**
   - If OAuth account exists → login user
   - If email exists → link OAuth to existing account
   - If new user → create account with OAuth

6. **Session Creation**
   - Backend creates session token
   - Sets secure HTTP-only cookie
   - Redirects user to dashboard

### Account Linking Logic

```typescript
// Scenario 1: OAuth account already exists
if (oauthAccountExists) {
  return existingUser;
}

// Scenario 2: User with same email exists
if (userWithEmailExists) {
  linkOAuthToExistingUser();
  return existingUser;
}

// Scenario 3: New user
createNewUserWithOAuth();
return newUser;
```

---

## Database Schema

### OAuthAccount Model

```prisma
model OAuthAccount {
  id           String   @id @default(uuid())
  userId       String
  provider     String   // 'google' or 'github'
  providerId   String   // OAuth provider's user ID
  email        String?
  accessToken  String?
  refreshToken String?
  tokenExpiry  DateTime?
  scope        String?
  metadata     String?  // JSON for additional data
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerId])
  @@index([userId])
  @@index([provider])
}
```

### User Model Updates

```prisma
model User {
  // ... existing fields ...
  googleId      String?       @unique
  googleEmail   String?
  githubId      String?       @unique
  githubEmail   String?
  oauthAccounts OAuthAccount[]

  @@index([googleId])
  @@index([githubId])
}
```

---

## API Endpoints

### OAuth Initiation

**Start Google OAuth:**
```
GET /api/auth/google?redirect=/dashboard
```

**Start GitHub OAuth:**
```
GET /api/auth/github?redirect=/dashboard
```

### OAuth Callbacks (automatic)

```
GET /api/auth/google/callback?code=...&state=...
GET /api/auth/github/callback?code=...&state=...
```

### Account Management

**Get Connected Accounts:**
```
GET /api/auth/oauth/accounts
Authorization: Bearer <token>
```

**Unlink OAuth Provider:**
```
DELETE /api/auth/oauth/google
DELETE /api/auth/oauth/github
Authorization: Bearer <token>
```

**Check OAuth Configuration:**
```
GET /api/auth/oauth/config
```

---

## Testing

### Manual Testing Checklist

- [ ] New user can register with Google
- [ ] New user can register with GitHub
- [ ] Existing user can link Google account
- [ ] Existing user can link GitHub account
- [ ] User can login with Google
- [ ] User can login with GitHub
- [ ] User can link both providers
- [ ] Error shown when OAuth denied
- [ ] Error shown for invalid state
- [ ] Cannot unlink last auth method
- [ ] Success message shown on linking
- [ ] Redirect works correctly

### Automated Testing

```bash
# Run integration tests (when implemented)
npm run test:integration

# Check OAuth configuration
curl http://localhost:3000/api/auth/oauth/config
```

---

## Troubleshooting

### "Redirect URI mismatch"

**Problem:** OAuth provider rejects callback URL

**Solution:**
1. Check Google/GitHub app settings
2. Verify callback URL matches exactly:
   - `http://localhost:3000/api/auth/google/callback`
   - `http://localhost:3000/api/auth/github/callback`
3. No trailing slashes
4. Correct protocol (http vs https)

### "Invalid state parameter"

**Problem:** State verification fails

**Solution:**
1. State expires after 10 minutes - retry OAuth flow
2. Check server time is synchronized
3. Clear cookies and try again

### "No verified email found"

**Problem:** Provider doesn't return email

**Solution:**
- **Google**: Ensure email scope is granted
- **GitHub**: Ensure account has verified email
- Check provider account settings

### OAuth Not Working in Production

**Problem:** OAuth fails on deployed app

**Solution:**
1. Update OAuth apps with production callback URLs:
   - `https://yourdomain.com/api/auth/google/callback`
   - `https://yourdomain.com/api/auth/github/callback`
2. Set `OAUTH_CALLBACK_URL=https://yourdomain.com`
3. Set `NODE_ENV=production`
4. Verify SSL/HTTPS is working

---

## Production Deployment

### Pre-deployment Checklist

1. **Create Production OAuth Apps**
   - [ ] Google OAuth app with production URLs
   - [ ] GitHub OAuth app with production URLs

2. **Environment Variables**
   - [ ] Set production `GOOGLE_CLIENT_ID`
   - [ ] Set production `GOOGLE_CLIENT_SECRET`
   - [ ] Set production `GITHUB_CLIENT_ID`
   - [ ] Set production `GITHUB_CLIENT_SECRET`
   - [ ] Set `OAUTH_CALLBACK_URL` to production domain
   - [ ] Set `NODE_ENV=production`
   - [ ] Set strong `JWT_SECRET`

3. **Database**
   - [ ] Run migrations on production database
   - [ ] Verify schema updates

4. **Security**
   - [ ] Enable HTTPS/SSL
   - [ ] Configure secure cookies
   - [ ] Set up rate limiting
   - [ ] Configure CORS properly

5. **Testing**
   - [ ] Test OAuth flow on production
   - [ ] Test all error scenarios
   - [ ] Verify account linking
   - [ ] Check session management

### Production Environment Variables

```bash
NODE_ENV=production
OAUTH_CALLBACK_URL=https://yourdomain.com
GOOGLE_CLIENT_ID=<production-client-id>
GOOGLE_CLIENT_SECRET=<production-client-secret>
GITHUB_CLIENT_ID=<production-client-id>
GITHUB_CLIENT_SECRET=<production-client-secret>
JWT_SECRET=<strong-random-secret>
DATABASE_URL=<production-database-url>
```

---

## Best Practices

### Security

1. **Never commit secrets** - Use environment variables
2. **Rotate credentials** - Change secrets periodically
3. **Use HTTPS** - Always in production
4. **Validate state** - Prevent CSRF attacks
5. **Check email** - Verify email from provider
6. **Rate limit** - Prevent abuse

### User Experience

1. **Loading states** - Show feedback during OAuth
2. **Error messages** - Clear, actionable errors
3. **Success feedback** - Confirm when account linked
4. **Redirect properly** - Return to intended page
5. **Provider icons** - Use official brand assets

### Development

1. **Test both providers** - Google and GitHub
2. **Test all scenarios** - New user, existing user, linking
3. **Handle errors** - Denied access, network errors
4. **Log events** - Track OAuth success/failure
5. **Monitor performance** - Track OAuth flow duration

---

## Additional Resources

- [OAuth Setup Guide](./OAUTH_SETUP.md) - Detailed configuration steps
- [Implementation Summary](./OAUTH_IMPLEMENTATION_SUMMARY.md) - Technical details
- [Google OAuth Docs](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Docs](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Passport.js Docs](http://www.passportjs.org/)

---

## Support

For questions or issues:
- Check troubleshooting section above
- Review setup guide: `docs/OAUTH_SETUP.md`
- Check implementation details: `docs/OAUTH_IMPLEMENTATION_SUMMARY.md`
- Create GitHub issue
- Contact: support@dawg-ai.com

---

## License

This OAuth implementation is part of DAWG AI and follows the same license as the main project.
