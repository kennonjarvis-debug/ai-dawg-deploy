/**
 * OAuth Authentication Types
 * Type definitions for OAuth providers and authentication flow
 */

export type OAuthProvider = 'google' | 'github' | 'email';

export interface OAuthProfile {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  emailVerified?: boolean;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
}

export interface OAuthAccountData {
  provider: OAuthProvider;
  providerId: string;
  email?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  scope?: string;
  metadata?: Record<string, any>;
}

export interface OAuthCallbackQuery {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

export interface OAuthStateData {
  provider: OAuthProvider;
  redirectUrl?: string;
  timestamp: number;
  nonce: string;
}

export interface GoogleOAuthProfile {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}

export interface GitHubOAuthProfile {
  id: number;
  login: string;
  email: string | null;
  name: string | null;
  avatar_url: string;
  bio?: string;
  company?: string;
  location?: string;
}

export interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

export interface OAuthLoginResult {
  user: {
    id: string;
    email: string;
    name?: string;
    profileImage?: string;
    emailVerified: boolean;
  };
  session: {
    id: string;
    token: string;
    expiresAt: Date;
  };
  isNewUser: boolean;
  linkedAccount: boolean;
}

export interface OAuthConfig {
  google: {
    clientId: string;
    clientSecret: string;
    callbackURL: string;
    scope: string[];
  };
  github: {
    clientId: string;
    clientSecret: string;
    callbackURL: string;
    scope: string[];
  };
}

export interface OAuthError extends Error {
  code?: string;
  provider?: OAuthProvider;
  details?: any;
}
