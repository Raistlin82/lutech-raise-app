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
let supabaseClient: SupabaseClient<any> | null | undefined = undefined;

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

// Getter function for lazy initialization - only initializes when first called
function getSupabaseClient() {
    if (supabaseClient === undefined) {
        supabaseClient = initSupabase();
    }
    return supabaseClient;
}

// Export as getter property for backward compatibility with `import { supabase }`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient<any> | null = new Proxy({} as any, {
    get: (_target, prop) => {
        const client = getSupabaseClient();
        if (client === null) return null;
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSupabase = (): SupabaseClient<any> => {
    const client = getSupabaseClient();
    if (!client) {
        throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    }
    return client;
};
