# OAuth Authentication Setup Guide

This guide explains how to set up OAuth authentication for DAWG AI with Google and GitHub providers.

## Table of Contents

- [Overview](#overview)
- [Google OAuth Setup](#google-oauth-setup)
- [GitHub OAuth Setup](#github-oauth-setup)
- [Environment Variables](#environment-variables)
- [Database Migration](#database-migration)
- [Testing OAuth Flow](#testing-oauth-flow)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

---

## Overview

DAWG AI supports OAuth authentication with the following providers:

- **Google OAuth 2.0** - Login with Google account
- **GitHub OAuth 2.0** - Login with GitHub account

### Features

- Secure OAuth 2.0 flow with PKCE and CSRF protection
- Automatic account linking (if email already exists)
- Support for multiple OAuth providers per user
- Secure token storage and refresh
- Account unlinking (with safety checks)

---

## Google OAuth Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"

### Step 2: Configure OAuth Consent Screen

1. Click "OAuth consent screen" in the sidebar
2. Select "External" user type (or "Internal" for Google Workspace)
3. Fill in the required information:
   - **App name**: DAWG AI
   - **User support email**: your-email@example.com
   - **Developer contact**: your-email@example.com
4. Add scopes:
   - `userinfo.email`
   - `userinfo.profile`
5. Save and continue

### Step 3: Create OAuth Credentials

1. Go to "Credentials" > "Create Credentials" > "OAuth client ID"
2. Select "Web application"
3. Configure:
   - **Name**: DAWG AI Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/google/callback` (development)
     - `https://yourdomain.com/api/auth/google/callback` (production)
4. Click "Create"
5. Copy the **Client ID** and **Client Secret**

### Step 4: Add to Environment Variables

```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

---

## GitHub OAuth Setup

### Step 1: Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "OAuth Apps" > "New OAuth App"

### Step 2: Configure OAuth App

Fill in the application details:

- **Application name**: DAWG AI
- **Homepage URL**:
  - `http://localhost:3000` (development)
  - `https://yourdomain.com` (production)
- **Application description**: AI-powered Digital Audio Workstation
- **Authorization callback URL**:
  - `http://localhost:3000/api/auth/github/callback` (development)
  - `https://yourdomain.com/api/auth/github/callback` (production)

### Step 3: Get Credentials

1. Click "Register application"
2. Copy the **Client ID**
3. Click "Generate a new client secret"
4. Copy the **Client Secret** (only shown once!)

### Step 4: Add to Environment Variables

```bash
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

---

## Environment Variables

Create or update your `.env` file:

```bash
# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# OAuth Callback URL (base URL of your application)
OAUTH_CALLBACK_URL=http://localhost:3000

# JWT Secret (for session tokens)
JWT_SECRET=your-very-secure-random-secret-key

# Database
DATABASE_URL=file:./dev.db

# Node Environment
NODE_ENV=development
```

### Production Environment Variables

For production, update the `OAUTH_CALLBACK_URL`:

```bash
OAUTH_CALLBACK_URL=https://yourdomain.com
NODE_ENV=production
```

---

## Database Migration

### Step 1: Update Prisma Schema

The Prisma schema has been updated with OAuth support. Run the migration:

```bash
npm run db:migrate
```

This will create the `OAuthAccount` table and add OAuth fields to the `User` table.

### Step 2: Generate Prisma Client

```bash
npm run db:generate
```

### Schema Changes

The migration adds:

**User table updates:**
- `githubId` - GitHub user ID (unique)
- `githubEmail` - GitHub email
- `oauthAccounts` - Relation to OAuthAccount table

**New OAuthAccount table:**
- `id` - Unique identifier
- `userId` - Reference to User
- `provider` - OAuth provider ('google', 'github')
- `providerId` - Provider's user ID
- `email` - Email from provider
- `accessToken` - OAuth access token
- `refreshToken` - OAuth refresh token (if available)
- `tokenExpiry` - Token expiration date
- `scope` - OAuth scopes granted
- `metadata` - Additional provider data (JSON)

---

## Testing OAuth Flow

### Development Testing

1. Start the backend server:
   ```bash
   npm run dev:unified
   ```

2. Start the frontend:
   ```bash
   npm run dev:ui
   ```

3. Navigate to `http://localhost:3000/login`

4. Click "Continue with Google" or "Continue with GitHub"

5. Complete the OAuth flow

### Test Scenarios

**New User Registration:**
- User clicks OAuth button
- Completes provider authentication
- New account is created in DAWG AI
- User is redirected to dashboard

**Existing User Login:**
- User with existing email clicks OAuth button
- Account is automatically linked
- User sees success message
- User is redirected to dashboard

**Account Linking:**
- User with email/password account logs in with OAuth
- OAuth account is linked to existing user
- User can now login with either method

**Multiple OAuth Providers:**
- User can link both Google and GitHub to same account
- Can login with either provider

---

## Security Considerations

### CSRF Protection

OAuth flow uses state parameter with:
- Random nonce
- Timestamp validation (10-minute expiry)
- Secure state verification

### Token Storage

- Access tokens stored encrypted in database
- Refresh tokens stored for token renewal
- HttpOnly cookies for session tokens
- Secure flag enabled in production

### Account Unlinking Safety

- Cannot unlink if it's the only authentication method
- User must have password OR another OAuth provider
- Prevents account lockout

### PKCE (Proof Key for Code Exchange)

Implemented for additional security in OAuth flow:
- Prevents authorization code interception
- State parameter validation
- Time-based state expiry

### Environment Security

- Never commit `.env` files
- Use different credentials for dev/prod
- Rotate secrets regularly
- Use strong JWT_SECRET

---

## OAuth Flow Diagram

```
User                    DAWG AI                 OAuth Provider
  |                        |                          |
  |--Click OAuth Button--->|                          |
  |                        |                          |
  |                        |--Generate State--------->|
  |                        |--Redirect to Provider--->|
  |                        |                          |
  |<-------------------Auth Dialog-------------------|
  |                        |                          |
  |--Grant Permission------------------------------>|
  |                        |                          |
  |<------------------Redirect + Code----------------|
  |                        |                          |
  |--Code + State--------->|                          |
  |                        |                          |
  |                        |--Verify State----------->|
  |                        |--Exchange Code---------->|
  |                        |                          |
  |                        |<--Access Token-----------|
  |                        |                          |
  |                        |--Fetch User Profile----->|
  |                        |                          |
  |                        |<--User Data--------------|
  |                        |                          |
  |                        |--Create/Link Account-----|
  |                        |--Create Session----------|
  |                        |                          |
  |<--Redirect to App------|                          |
  |                        |                          |
```

---

## API Endpoints

### OAuth Initiation

**Google:**
```
GET /api/auth/google?redirect=/dashboard
```

**GitHub:**
```
GET /api/auth/github?redirect=/dashboard
```

### OAuth Callbacks

**Google:**
```
GET /api/auth/google/callback?code=xxx&state=xxx
```

**GitHub:**
```
GET /api/auth/github/callback?code=xxx&state=xxx
```

### Account Management

**Get Connected Accounts:**
```
GET /api/auth/oauth/accounts
Authorization: Bearer <token>
```

**Unlink Provider:**
```
DELETE /api/auth/oauth/:provider
Authorization: Bearer <token>
```

**Check OAuth Config:**
```
GET /api/auth/oauth/config
```

---

## Troubleshooting

### Common Issues

**Issue: "Redirect URI mismatch"**
- Verify callback URLs in Google/GitHub match your `.env`
- Check for trailing slashes
- Ensure protocol (http/https) matches

**Issue: "Invalid state parameter"**
- State may have expired (10-minute limit)
- Clear cookies and try again
- Check server time is synchronized

**Issue: "No verified email found"**
- GitHub: User must have verified email
- Google: Email scope must be granted
- Check provider account settings

**Issue: "Cannot unlink OAuth account"**
- Set a password first if it's your only auth method
- Or link another OAuth provider

### Debug Mode

Enable OAuth debugging:

```bash
DEBUG=oauth:* npm run dev:unified
```

### Check OAuth Configuration

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

## Production Checklist

- [ ] Google OAuth app created with production callback URL
- [ ] GitHub OAuth app created with production callback URL
- [ ] Environment variables set in production environment
- [ ] `NODE_ENV=production` set
- [ ] `OAUTH_CALLBACK_URL` points to production domain
- [ ] Database migration completed
- [ ] SSL/HTTPS enabled for production domain
- [ ] Secure session cookies enabled
- [ ] JWT_SECRET is strong and unique
- [ ] OAuth consent screens configured
- [ ] Privacy policy and terms of service links added

---

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Passport.js Documentation](http://www.passportjs.org/)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)

---

## Support

For issues or questions:
- Create an issue on GitHub
- Contact support@dawg-ai.com
- Check documentation at docs.dawg-ai.com
