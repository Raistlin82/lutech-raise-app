// Global type declarations for runtime configuration

declare global {
  interface RuntimeConfig {
    VITE_IAS_AUTHORITY: string;
    VITE_IAS_CLIENT_ID: string;
    VITE_SUPABASE_URL: string;
    VITE_SUPABASE_ANON_KEY: string;
  }

  interface Window {
    __RUNTIME_CONFIG__?: Partial<RuntimeConfig>;
  }
}

export {};
