# DAWG AI - Authentication Setup Guide

## Overview
DAWG AI uses NextAuth.js v5 for authentication with multiple strategies:
- **Credentials** (email/password)
- **OAuth** (GitHub, Google - optional)

**Stage:** 6.2 - Authentication ✅

---

## Quick Start

### 1. Set Environment Variables

Update `.env.local`:

```bash
# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=U5FM8sP08PmJOQDvzCNQN8dcJF39002ZoWEuyyChWaY=  # Already generated

# Optional: GitHub OAuth
GITHUB_ID=your_github_oauth_app_id
GITHUB_SECRET=your_github_oauth_app_secret
```

**Generate new secret (optional):**
```bash
openssl rand -base64 32
```

### 2. Database Setup (Required)

Authentication requires a database. See `DATABASE_SETUP.md`.

**Quick Docker setup:**
```bash
docker run --name dawg-postgres \
  -e POSTGRES_PASSWORD=dawg123 \
  -e POSTGRES_DB=dawg_ai \
  -p 5432:5432 \
  -d postgres:15-alpine

# Run migrations
npx prisma db push
npx prisma generate
```

### 3. Start Development Server

```bash
npm run dev
```

---

## Authentication Endpoints

### POST /api/auth/register
Register a new user with email/password.

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "name": "John Doe"
  }'
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "cld1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-10-02T20:00:00Z"
  },
  "message": "User created successfully"
}
```

**Validation:**
- Email: Required, must be unique
- Password: Required, minimum 8 characters
- Name: Optional

---

### POST /api/auth/signin
Login with credentials (handled by NextAuth).

**Browser:**
Visit: `http://localhost:3000/api/auth/signin`

**Programmatic:**
```typescript
import { signIn } from 'next-auth/react';

await signIn('credentials', {
  email: 'user@example.com',
  password: 'securepassword123',
  redirect: false,
});
```

---

### GET /api/auth/signout
Logout current user.

**Browser:**
Visit: `http://localhost:3000/api/auth/signout`

**Programmatic:**
```typescript
import { signOut } from 'next-auth/react';

await signOut({ redirect: false });
```

---

### GET /api/auth/session
Get current session (used by `useSession` hook).

**Response:**
```json
{
  "user": {
    "id": "cld1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "image": null
  },
  "expires": "2025-11-01T20:00:00Z"
}
```

---

## Frontend Integration

### 1. Wrap App with SessionProvider

Update `/app/layout.tsx`:

```typescript
import { SessionProvider } from '@/lib/auth';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

### 2. Use Session in Components

```typescript
'use client'

import { useSession, signIn, signOut } from 'next-auth/react';

export function UserProfile() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return (
      <button onClick={() => signIn()}>
        Sign In
      </button>
    );
  }

  return (
    <div>
      <p>Welcome, {session.user?.name}!</p>
      <button onClick={() => signOut()}>
        Sign Out
      </button>
    </div>
  );
}
```

### 3. Protect Pages (Client Components)

```typescript
'use client'

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return <div>Protected content</div>;
}
```

### 4. Protect Server Components

```typescript
import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  try {
    const { userId, user } = await requireAuth();
    // User is authenticated
    return <div>Dashboard for {user.name}</div>;
  } catch {
    redirect('/api/auth/signin');
  }
}
```

---

## Backend Integration

### Protecting API Routes

All project endpoints now require authentication:

```typescript
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { userId } = await requireAuth();

    // Fetch user's data
    const projects = await prisma.project.findMany({
      where: { userId },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
```

**Helper Functions:**

```typescript
// Get session (returns null if not authenticated)
import { getSession } from '@/lib/auth';
const session = await getSession();

// Get user ID (returns null if not authenticated)
import { getCurrentUserId } from '@/lib/auth';
const userId = await getCurrentUserId();

// Require authentication (throws error if not authenticated)
import { requireAuth } from '@/lib/auth';
const { userId, user } = await requireAuth();
```

---

## OAuth Setup (Optional)

### GitHub OAuth

1. **Create GitHub OAuth App:**
   - Go to: https://github.com/settings/developers
   - Click "New OAuth App"
   - **Homepage URL:** `http://localhost:3000`
   - **Callback URL:** `http://localhost:3000/api/auth/callback/github`

2. **Copy credentials to `.env.local`:**
   ```bash
   GITHUB_ID=your_client_id
   GITHUB_SECRET=your_client_secret
   ```

3. **Test:**
   - Visit: `http://localhost:3000/api/auth/signin`
   - Click "Sign in with GitHub"

### Google OAuth (Future)

Similar process - create OAuth app in Google Cloud Console.

---

## Testing

### 1. Run Test Suite

```bash
./test-auth.sh
```

**Tests:**
- ✅ User registration
- ✅ Duplicate prevention
- ✅ Password validation
- ✅ NextAuth endpoints
- ✅ API route protection

### 2. Manual Testing

**Register User:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@dawg.ai","password":"testpass123","name":"Tester"}'
```

**Check NextAuth:**
```bash
curl http://localhost:3000/api/auth/providers
# Should return: {"credentials":{"id":"credentials","name":"credentials",...}}
```

**Test Protected Endpoint:**
```bash
curl http://localhost:3000/api/projects/list
# Should return: {"error":"Unauthorized"}
```

**Login (Browser):**
1. Visit: `http://localhost:3000/api/auth/signin`
2. Enter: `test@dawg.ai` / `testpass123`
3. Should redirect to app

**Test Protected Endpoint (Authenticated):**
```bash
# After login, use browser's session cookie
curl http://localhost:3000/api/projects/list \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
# Should return: {"success":true,"projects":[...]}
```

---

## Security Best Practices

### 1. Environment Variables
- Never commit `.env.local` to git (already in `.gitignore`)
- Use strong `NEXTAUTH_SECRET` (32+ characters)
- Rotate secrets regularly in production

### 2. Password Security
- Passwords hashed with bcrypt (12 rounds)
- Minimum 8 characters enforced
- Consider adding password strength requirements

### 3. Session Security
- JWT-based sessions (stateless, faster)
- 30-day expiration
- HTTPS required in production

### 4. CORS & CSP
- Configure CORS for production
- Add Content Security Policy headers
- Use `sameSite: 'lax'` for cookies

---

## Troubleshooting

### "Database connection failed"
```bash
# Check if PostgreSQL is running
docker ps

# Restart container
docker restart dawg-postgres

# Test connection
psql -h localhost -U dawg_user -d dawg_ai
```

### "NEXTAUTH_SECRET not set"
```bash
# Generate new secret
openssl rand -base64 32

# Add to .env.local
NEXTAUTH_SECRET=<generated_secret>
```

### "OAuth callback error"
- Verify callback URL matches OAuth app settings
- Check `GITHUB_ID` and `GITHUB_SECRET` are correct
- Ensure `NEXTAUTH_URL` matches your app URL

### "Unauthorized" on protected routes
- Check if user is logged in: `http://localhost:3000/api/auth/session`
- Verify session cookie is being sent
- Check `requireAuth()` implementation

---

## Architecture

### Password Storage
Passwords are currently stored in the `User.preferences` JSON field for simplicity.

**Production recommendation:** Create separate `UserCredentials` table:

```prisma
model UserCredential {
  id       String @id @default(cuid())
  userId   String @unique
  password String // Hashed with bcrypt
  user     User   @relation(fields: [userId], references: [id])
}
```

### Session Strategy
Using **JWT** (default) instead of database sessions:
- ✅ Faster (no DB lookup on each request)
- ✅ Stateless (scales horizontally)
- ✅ Works with serverless
- ❌ Can't invalidate sessions instantly (logout requires client-side)

To switch to **database sessions**:

```typescript
// lib/auth/auth-options.ts
session: {
  strategy: 'database',  // Change from 'jwt'
}
```

---

## Integration with Instance 1 (Frontend)

**Instance 1 needs to:**
1. ✅ Wrap app with `<SessionProvider>` in `app/layout.tsx`
2. ✅ Create login/register UI components
3. ✅ Add "Sign In" button to header
4. ✅ Show user profile/avatar when logged in
5. ✅ Handle unauthenticated state (redirect to signin)

**Example UI locations:**
- Header: Show "Sign In" or user avatar
- Save/Load: Only show if authenticated
- Project list: Filter by authenticated user

---

## Next Steps

### Stage 6.3 - Auto-save (Optional)
Implement auto-save every 30 seconds for authenticated users.

### Stage 6.4 - S3 Storage (Priority)
Audio files need cloud storage (S3/R2) - passwords stored temporarily in DB.

### Stage 7+ - Social Features (Future)
- Share projects with other users
- Collaboration (real-time editing)
- Public/private project visibility

---

**Status:** ✅ Authentication complete (backend)
**Waiting on:** Database setup + Instance 1 (login UI)
**Last Updated:** 2025-10-02
