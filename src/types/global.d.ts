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

  /**
   * E2E Mode flag - injected by Vite at build time
   * When true, mandatory checkpoints are bypassed for E2E testing
   */
  const __E2E_MODE__: boolean;
}

export {};
