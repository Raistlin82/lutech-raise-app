import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

/**
 * Type-safe Supabase client type
 */
export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Check if running in test mode (E2E or unit tests)
 */
export function isTestMode(): boolean {
  return typeof window !== 'undefined' && localStorage.getItem('testMode') === 'true';
}

/**
 * Get Supabase client with null assertion
 * @throws Error if Supabase is not configured
 */
export function assertSupabaseClient(): TypedSupabaseClient {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  return client;
}

/**
 * Get Supabase client or null (for optional operations)
 */
export function getTypedClient(): TypedSupabaseClient | null {
  return getSupabaseClient();
}

/**
 * Base error type for repository operations
 */
export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}
