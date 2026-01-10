import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

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
let supabaseClient: SupabaseClient<Database> | null | undefined = undefined;

const initSupabase = (): SupabaseClient<Database> | null => {
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

    return createClient<Database, 'public'>(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: false, // We use SAP IAS, not Supabase auth
        },
    });
};

// Getter function for lazy initialization - only initializes when first called
export function getSupabaseClient() {
    if (supabaseClient === undefined) {
        supabaseClient = initSupabase();
    }
    return supabaseClient;
}

// Export as getter property for backward compatibility with `import { supabase }`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient<Database> | null = new Proxy({} as any, {
    get: (_target, prop) => {
        const client = getSupabaseClient();
        if (client === null) return null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (client as any)[prop];
    },
    apply: () => {
        return getSupabaseClient();
    }
});

/**
 * Check if Supabase is configured and available
 */
export const isSupabaseConfigured = (): boolean => {
    return getSupabaseClient() !== null;
};

/**
 * Get Supabase client (throws if not configured)
 */
export const getSupabase = (): SupabaseClient<Database> => {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    }
    return client;
};

/**
 * Set authentication token from SAP IAS JWT
 * Call this after user logs in via SAP IAS
 *
 * @param accessToken - JWT access token from SAP IAS
 */
export async function setSupabaseAuth(accessToken: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) {
        console.warn('Supabase not configured - skipping auth sync');
        return;
    }

    // Set the JWT token for Supabase to use in RLS policies
    // Supabase will extract the email from JWT claims
    await client.auth.setSession({
        access_token: accessToken,
        refresh_token: '', // Not used with external auth
    });
}

/**
 * Clear authentication
 * Call this when user logs out
 */
export async function clearSupabaseAuth(): Promise<void> {
    const client = getSupabaseClient();
    if (!client) {
        console.warn('Supabase not configured - skipping auth clear');
        return;
    }

    await client.auth.signOut();
}
