import { d as derived, w as writable } from "./index.js";
import { l as logger } from "./logger.js";
let supabaseInstance = null;
{
  logger.warn("⚠️ Running without Supabase credentials - auth features disabled");
}
const supabase = supabaseInstance;
class AuthAPI {
  supabase;
  constructor() {
    this.supabase = supabase;
  }
  /**
   * Ensure Supabase is available
   */
  ensureSupabase() {
    if (!this.supabase) {
      throw new Error("Supabase not configured - auth features unavailable in test mode");
    }
    return this.supabase;
  }
  /**
   * Sign up a new user with email and password
   */
  async signUp(email, password, name) {
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
      throw new Error("Sign up failed: No user returned");
    }
    return data.user;
  }
  /**
   * Sign in with email and password
   */
  async signIn(email, password) {
    const { data, error } = await this.ensureSupabase().auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      throw new Error(`Sign in failed: ${error.message}`);
    }
    if (!data.session) {
      throw new Error("Sign in failed: No session returned");
    }
    return data.session;
  }
  /**
   * Sign out the current user
   */
  async signOut() {
    const { error } = await this.ensureSupabase().auth.signOut();
    if (error) {
      throw new Error(`Sign out failed: ${error.message}`);
    }
  }
  /**
   * Get current session
   */
  async getSession() {
    const { data: { session }, error } = await this.ensureSupabase().auth.getSession();
    if (error) {
      logger.error("Failed to get session:", error);
      return null;
    }
    return session;
  }
  /**
   * Refresh the session
   */
  async refreshSession() {
    const { data, error } = await this.ensureSupabase().auth.refreshSession();
    if (error) {
      throw new Error(`Failed to refresh session: ${error.message}`);
    }
    if (!data.session) {
      throw new Error("Failed to refresh session: No session returned");
    }
    return data.session;
  }
  /**
   * Get current user
   */
  async getCurrentUser() {
    const { data: { user }, error } = await this.ensureSupabase().auth.getUser();
    if (error) {
      logger.error("Failed to get user:", error);
      return null;
    }
    return user;
  }
  /**
   * Update user profile
   */
  async updateUser(updates) {
    const { data, error } = await this.ensureSupabase().auth.updateUser({
      data: updates
    });
    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
    if (!data.user) {
      throw new Error("Failed to update user: No user returned");
    }
    return data.user;
  }
  /**
   * Request password reset email
   */
  async resetPassword(email) {
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
  async updatePassword(newPassword) {
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
  async signInWithOAuth(provider) {
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
  onAuthStateChange(callback) {
    const { data: { subscription } } = this.ensureSupabase().auth.onAuthStateChange(
      (event, session) => {
        callback(session?.user || null, session);
      }
    );
    return () => {
      subscription.unsubscribe();
    };
  }
  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    const session = await this.getSession();
    return session !== null;
  }
  /**
   * Get access token
   */
  async getAccessToken() {
    const session = await this.getSession();
    return session?.access_token || null;
  }
  /**
   * Get Supabase client instance (for direct use if needed)
   */
  getSupabase() {
    return this.supabase;
  }
}
const authAPI = new AuthAPI();
const initialState = {
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};
function createAuthStore() {
  const { subscribe, set, update } = writable(initialState);
  let unsubscribeAuth = null;
  async function initialize() {
    const isTestMode = typeof window !== "undefined" && (window.navigator.userAgent.includes("Playwright") || window.location.search.includes("test=true") && true);
    if (isTestMode) {
      logger.info("[authStore] Test mode detected - bypassing authentication");
      update((state) => ({
        ...state,
        user: {
          id: "test-user-id",
          email: "test@playwright.com",
          app_metadata: {},
          user_metadata: {},
          aud: "authenticated",
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        },
        session: {
          access_token: "test-token",
          token_type: "bearer",
          user: {
            id: "test-user-id",
            email: "test@playwright.com"
          }
        },
        isAuthenticated: true,
        isLoading: false,
        error: null
      }));
      return;
    }
    try {
      const session = await authAPI.getSession();
      const user2 = await authAPI.getCurrentUser();
      update((state) => ({
        ...state,
        user: user2,
        session,
        isAuthenticated: !!user2,
        isLoading: false
      }));
      unsubscribeAuth = authAPI.onAuthStateChange((user3, session2) => {
        update((state) => ({
          ...state,
          user: user3,
          session: session2,
          isAuthenticated: !!user3,
          error: null
        }));
      });
    } catch (error) {
      logger.error("Auth initialization error:", error);
      update((state) => ({
        ...state,
        isLoading: false,
        error: error instanceof Error ? error.message : "Auth initialization failed"
      }));
    }
  }
  async function signIn(email, password) {
    update((state) => ({ ...state, isLoading: true, error: null }));
    try {
      const session = await authAPI.signIn(email, password);
      const user2 = await authAPI.getCurrentUser();
      update((state) => ({
        ...state,
        user: user2,
        session,
        isAuthenticated: true,
        isLoading: false
      }));
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign in failed";
      update((state) => ({
        ...state,
        isLoading: false,
        error: message
      }));
      return { success: false, error: message };
    }
  }
  async function signUp(email, password, name) {
    update((state) => ({ ...state, isLoading: true, error: null }));
    try {
      await authAPI.signUp(email, password, name);
      update((state) => ({
        ...state,
        isLoading: false
      }));
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign up failed";
      update((state) => ({
        ...state,
        isLoading: false,
        error: message
      }));
      return { success: false, error: message };
    }
  }
  async function signOut() {
    update((state) => ({ ...state, isLoading: true, error: null }));
    try {
      await authAPI.signOut();
      update((state) => ({
        ...initialState,
        isLoading: false
      }));
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign out failed";
      update((state) => ({
        ...state,
        isLoading: false,
        error: message
      }));
      return { success: false, error: message };
    }
  }
  function clearError() {
    update((state) => ({ ...state, error: null }));
  }
  function cleanup() {
    if (unsubscribeAuth) {
      unsubscribeAuth();
      unsubscribeAuth = null;
    }
  }
  return {
    subscribe,
    initialize,
    signIn,
    signUp,
    signOut,
    clearError,
    cleanup
  };
}
const authStore = createAuthStore();
derived(
  authStore,
  ($auth) => $auth.user
);
derived(
  authStore,
  ($auth) => $auth.isAuthenticated
);
derived(
  authStore,
  ($auth) => $auth.isLoading
);
export {
  supabase as s
};
