import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is configured
const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isConfigured) {
    console.warn(
        'Supabase credentials not configured. Using localStorage fallback.\n' +
        'To enable Supabase, create a .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
    );
}

// Create client only if configured (using untyped client for flexibility)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient<any> | null = isConfigured
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false, // No auth for now
        },
    })
    : null;

/**
 * Check if Supabase is configured and available
 */
export const isSupabaseConfigured = (): boolean => {
    return supabase !== null;
};

/**
 * Get Supabase client (throws if not configured)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSupabase = (): SupabaseClient<any> => {
    if (!supabase) {
        throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    }
    return supabase;
};
