// Server-side session utilities
import { getServerSession } from 'next-auth';
import { authOptions } from './auth-options';

/**
 * Get the current user session on the server
 * Use in API routes and server components
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Get the current user ID
 * Returns null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return (session?.user as any)?.id || null;
}

/**
 * Require authentication for an API route
 * Throws error if not authenticated
 */
export async function requireAuth() {
  const session = await getSession();

  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }

  return {
    user: session.user,
    userId: (session.user as any).id,
  };
}
