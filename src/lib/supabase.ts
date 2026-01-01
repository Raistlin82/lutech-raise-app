import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get runtime config from window global (set by main.tsx after loading /config.json)
const getRuntimeConfig = (): Partial<RuntimeConfig> => {
    return window.__RUNTIME_CONFIG__ || {};
};

// Get Supabase credentials with runtime config fallback
const getSupabaseUrl = (): string => {
    const runtimeConfig = getRuntimeConfig();
    return runtimeConfig.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || '';
};

const getSupabaseAnonKey = (): string => {
    const runtimeConfig = getRuntimeConfig();
    return runtimeConfig.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
};

// Lazy initialization of Supabase client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabaseClient: SupabaseClient<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const initSupabase = (): SupabaseClient<any> | null => {
    const supabaseUrl = getSupabaseUrl();
    const supabaseAnonKey = getSupabaseAnonKey();

    const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

    if (!isConfigured) {
        console.warn(
            'Supabase credentials not configured. Using localStorage fallback.\n' +
            'To enable Supabase, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Kubernetes secrets or .env.local'
        );
        return null;
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false, // No auth for now
        },
    });
};

// Export getter that initializes client on first access
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient<any> | null = (() => {
    if (!supabaseClient) {
        supabaseClient = initSupabase();
    }
    return supabaseClient;
})();

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
