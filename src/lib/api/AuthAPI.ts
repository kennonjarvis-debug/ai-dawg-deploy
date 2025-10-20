/**
 * Authentication API Client
 * Module 10: Cloud Storage & Backend
 *
 * Frontend client for user authentication
 * Conforms to API_CONTRACTS.md Module 10 specification
 */

import type { SupabaseClient, User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

import { logger } from '$lib/utils/logger';
/**
 * Authentication API client
 */
export class AuthAPI {
  private supabase: SupabaseClient | null;

  constructor() {
    this.supabase = supabase;
  }

  /**
   * Ensure Supabase is available
   */
  private ensureSupabase(): SupabaseClient {
    if (!this.supabase) {
      throw new Error('Supabase not configured - auth features unavailable in test mode');
    }
    return this.supabase;
  }

  /**
   * Sign up a new user with email and password
   */
  async signUp(email: string, password: string, name?: string): Promise<User> {
    const { data, error } = await this.ensureSupabase().auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || null
        }
      }
    });

    if (error) {
      throw new Error(`Sign up failed: ${error.message}`);
    }

    if (!data.user) {
      throw new Error('Sign up failed: No user returned');
    }

    return data.user;
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<Session> {
    const { data, error } = await this.ensureSupabase().auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(`Sign in failed: ${error.message}`);
    }

    if (!data.session) {
      throw new Error('Sign in failed: No session returned');
    }

    return data.session;
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    const { error } = await this.ensureSupabase().auth.signOut();

    if (error) {
      throw new Error(`Sign out failed: ${error.message}`);
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<Session | null> {
    const { data: { session }, error } = await this.ensureSupabase().auth.getSession();

    if (error) {
      logger.error('Failed to get session:', error);
      return null;
    }

    return session;
  }

  /**
   * Refresh the session
   */
  async refreshSession(): Promise<Session> {
    const { data, error } = await this.ensureSupabase().auth.refreshSession();

    if (error) {
      throw new Error(`Failed to refresh session: ${error.message}`);
    }

    if (!data.session) {
      throw new Error('Failed to refresh session: No session returned');
    }

    return data.session;
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    const { data: { user }, error } = await this.ensureSupabase().auth.getUser();

    if (error) {
      logger.error('Failed to get user:', error);
      return null;
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateUser(updates: { name?: string; avatar_url?: string }): Promise<User> {
    const { data, error } = await this.ensureSupabase().auth.updateUser({
      data: updates
    });

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    if (!data.user) {
      throw new Error('Failed to update user: No user returned');
    }

    return data.user;
  }

  /**
   * Request password reset email
   */
  async resetPassword(email: string): Promise<void> {
    const { error } = await this.ensureSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      throw new Error(`Failed to send reset email: ${error.message}`);
    }
  }

  /**
   * Update password (requires active session)
   */
  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await this.ensureSupabase().auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw new Error(`Failed to update password: ${error.message}`);
    }
  }

  /**
   * Sign in with OAuth provider
   */
  async signInWithOAuth(provider: 'google' | 'github'): Promise<void> {
    const { error } = await this.ensureSupabase().auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      throw new Error(`OAuth sign in failed: ${error.message}`);
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (user: User | null, session: Session | null) => void): () => void {
    const { data: { subscription } } = this.ensureSupabase().auth.onAuthStateChange(
      (event, session) => {
        callback(session?.user || null, session);
      }
    );

    // Return unsubscribe function
    return () => {
      subscription.unsubscribe();
    };
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  }

  /**
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    const session = await this.getSession();
    return session?.access_token || null;
  }

  /**
   * Get Supabase client instance (for direct use if needed)
   */
  getSupabase(): SupabaseClient {
    return this.supabase;
  }
}

// Export singleton instance
export const authAPI = new AuthAPI();
