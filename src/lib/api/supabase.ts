/**
 * Supabase API Client
 *
 * Initializes and exports a singleton Supabase client instance.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { logger } from '$lib/utils/logger';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// For E2E testing and local development without Supabase
const isDevelopment = import.meta.env.DEV;
const isTest = import.meta.env.MODE === 'test';

let supabaseInstance: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Allow running without Supabase - auth features will be disabled
  logger.warn('⚠️ Running without Supabase credentials - auth features disabled');
  if (!isTest && !isDevelopment) {
    logger.error('PRODUCTION WARNING: Supabase environment variables not configured');
  }
}

export const supabase: SupabaseClient | null = supabaseInstance;
