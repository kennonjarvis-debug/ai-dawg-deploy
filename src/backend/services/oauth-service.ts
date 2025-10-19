/**
 * OAuth Service
 * Handles OAuth authentication flow for Google and GitHub
 */

import { prisma } from '../config/database';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { randomBytes, createHash } from 'crypto';
import type {
  OAuthProvider,
  OAuthProfile,
  OAuthTokens,
  OAuthAccountData,
  OAuthLoginResult,
  OAuthStateData,
  GoogleOAuthProfile,
  GitHubOAuthProfile,
  GitHubEmail,
} from '../../types/auth';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const OAUTH_CALLBACK_URL = process.env.OAUTH_CALLBACK_URL || 'http://localhost:3000';

// PKCE and State Storage (in production, use Redis)
const stateStore = new Map<string, OAuthStateData>();
const STATE_EXPIRY = 10 * 60 * 1000; // 10 minutes

export class OAuthService {
  private initialized = false;

  /**
   * Initialize Passport strategies for OAuth providers
   */
  initializeStrategies() {
    if (this.initialized) return;

    // Google OAuth Strategy
    if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
      passport.use(
        new GoogleStrategy(
          {
            clientID: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            callbackURL: `${OAUTH_CALLBACK_URL}/api/auth/google/callback`,
            scope: ['profile', 'email'],
            passReqToCallback: true,
          },
          async (req: any, accessToken: string, refreshToken: string, profile: any, done: any) => {
            try {
              const result = await this.handleGoogleCallback(
                profile,
                accessToken,
                refreshToken
              );
              done(null, result);
            } catch (error) {
              done(error, null);
            }
          }
        )
      );
    }

    // GitHub OAuth Strategy
    if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
      passport.use(
        new GitHubStrategy(
          {
            clientID: GITHUB_CLIENT_ID,
            clientSecret: GITHUB_CLIENT_SECRET,
            callbackURL: `${OAUTH_CALLBACK_URL}/api/auth/github/callback`,
            scope: ['user:email'],
            passReqToCallback: true,
          },
          async (req: any, accessToken: string, refreshToken: string, profile: any, done: any) => {
            try {
              const result = await this.handleGitHubCallback(
                profile,
                accessToken,
                refreshToken
              );
              done(null, result);
            } catch (error) {
              done(error, null);
            }
          }
        )
      );
    }

    this.initialized = true;
  }

  /**
   * Generate secure state parameter with CSRF protection
   */
  generateState(provider: OAuthProvider, redirectUrl?: string): string {
    const nonce = randomBytes(32).toString('hex');
    const stateData: OAuthStateData = {
      provider,
      redirectUrl,
      timestamp: Date.now(),
      nonce,
    };

    const state = Buffer.from(JSON.stringify(stateData)).toString('base64url');
    stateStore.set(state, stateData);

    // Clean up expired states
    setTimeout(() => {
      stateStore.delete(state);
    }, STATE_EXPIRY);

    return state;
  }

  /**
   * Verify and decode state parameter
   */
  verifyState(state: string): OAuthStateData | null {
    try {
      const stateData = stateStore.get(state);
      if (!stateData) return null;

      // Check expiry
      if (Date.now() - stateData.timestamp > STATE_EXPIRY) {
        stateStore.delete(state);
        return null;
      }

      return stateData;
    } catch (error) {
      return null;
    }
  }

  /**
   * Handle Google OAuth callback
   */
  private async handleGoogleCallback(
    profile: any,
    accessToken: string,
    refreshToken: string
  ): Promise<OAuthLoginResult> {
    const googleProfile: GoogleOAuthProfile = profile._json;
    const providerId = profile.id;
    const email = googleProfile.email;

    if (!email) {
      throw new Error('No email provided by Google');
    }

    return this.findOrCreateOAuthUser({
      provider: 'google',
      providerId,
      email,
      name: googleProfile.name,
      profileImage: googleProfile.picture,
      emailVerified: googleProfile.verified_email,
      accessToken,
      refreshToken,
    });
  }

  /**
   * Handle GitHub OAuth callback
   */
  private async handleGitHubCallback(
    profile: any,
    accessToken: string,
    refreshToken: string
  ): Promise<OAuthLoginResult> {
    const githubProfile: GitHubOAuthProfile = profile._json;
    const providerId = String(githubProfile.id);

    // GitHub email might be null, need to fetch from API
    let email = githubProfile.email;

    if (!email) {
      // Fetch primary verified email from GitHub API
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `token ${accessToken}`,
          'User-Agent': 'DAWG-AI',
        },
      });

      if (emailResponse.ok) {
        const emails: GitHubEmail[] = await emailResponse.json();
        const primaryEmail = emails.find((e) => e.primary && e.verified);
        email = primaryEmail?.email || emails.find((e) => e.verified)?.email || null;
      }
    }

    if (!email) {
      throw new Error('No verified email found in GitHub account');
    }

    return this.findOrCreateOAuthUser({
      provider: 'github',
      providerId,
      email,
      name: githubProfile.name || githubProfile.login,
      profileImage: githubProfile.avatar_url,
      emailVerified: true, // We only use verified emails from GitHub
      accessToken,
      refreshToken,
    });
  }

  /**
   * Find existing user or create new OAuth user
   * Handles account linking if email already exists
   */
  private async findOrCreateOAuthUser(data: {
    provider: OAuthProvider;
    providerId: string;
    email: string;
    name?: string;
    profileImage?: string;
    emailVerified: boolean;
    accessToken: string;
    refreshToken?: string;
  }): Promise<OAuthLoginResult> {
    const { provider, providerId, email, name, profileImage, emailVerified, accessToken, refreshToken } = data;

    let isNewUser = false;
    let linkedAccount = false;

    // Try to find existing OAuth account
    let oauthAccount = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId,
        },
      },
      include: { user: true },
    });

    let user;

    if (oauthAccount) {
      // Existing OAuth account found
      user = oauthAccount.user;

      // Update tokens
      await prisma.oAuthAccount.update({
        where: { id: oauthAccount.id },
        data: {
          accessToken,
          refreshToken,
          email,
          updatedAt: new Date(),
        },
      });
    } else {
      // Check if user with this email already exists
      user = await prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        // Link OAuth account to existing user
        linkedAccount = true;

        await prisma.oAuthAccount.create({
          data: {
            userId: user.id,
            provider,
            providerId,
            email,
            accessToken,
            refreshToken,
          },
        });

        // Update user fields based on provider
        const updateData: any = {
          emailVerified: emailVerified || user.emailVerified,
        };

        if (provider === 'google') {
          updateData.googleId = providerId;
          updateData.googleEmail = email;
        } else if (provider === 'github') {
          updateData.githubId = providerId;
          updateData.githubEmail = email;
        }

        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      } else {
        // Create new user with OAuth account
        isNewUser = true;

        const userData: any = {
          email,
          name,
          profileImage,
          emailVerified,
          isActive: true,
          oauthAccounts: {
            create: {
              provider,
              providerId,
              email,
              accessToken,
              refreshToken,
            },
          },
        };

        if (provider === 'google') {
          userData.googleId = providerId;
          userData.googleEmail = email;
        } else if (provider === 'github') {
          userData.githubId = providerId;
          userData.githubEmail = email;
        }

        user = await prisma.user.create({
          data: userData,
        });
      }
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session
    const session = await this.createSession(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        profileImage: user.profileImage || undefined,
        emailVerified: user.emailVerified,
      },
      session: {
        id: session.id,
        token: session.token,
        expiresAt: session.expiresAt,
      },
      isNewUser,
      linkedAccount,
    };
  }

  /**
   * Create session for OAuth login
   */
  private async createSession(userId: string) {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = await prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    return session;
  }

  /**
   * Generate secure random token
   */
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Get OAuth accounts for user
   */
  async getUserOAuthAccounts(userId: string) {
    return prisma.oAuthAccount.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Unlink OAuth account
   */
  async unlinkOAuthAccount(userId: string, provider: OAuthProvider) {
    // Check if user has password or another OAuth method
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { oauthAccounts: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Prevent unlinking if it's the only auth method
    if (!user.password && user.oauthAccounts.length <= 1) {
      throw new Error('Cannot unlink the only authentication method. Please set a password first.');
    }

    await prisma.oAuthAccount.deleteMany({
      where: {
        userId,
        provider,
      },
    });

    // Update user fields
    const updateData: any = {};
    if (provider === 'google') {
      updateData.googleId = null;
      updateData.googleEmail = null;
    } else if (provider === 'github') {
      updateData.githubId = null;
      updateData.githubEmail = null;
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return { success: true };
  }

  /**
   * Refresh OAuth access token (provider-specific implementation)
   */
  async refreshAccessToken(accountId: string): Promise<string | null> {
    const account = await prisma.oAuthAccount.findUnique({
      where: { id: accountId },
    });

    if (!account || !account.refreshToken) {
      return null;
    }

    // Implementation depends on provider
    // This is a placeholder - actual implementation would call provider's token refresh endpoint

    return account.accessToken;
  }
}

export const oauthService = new OAuthService();
