import './i18n/config';
import { createRoot } from 'react-dom/client'
import { AuthProvider } from 'react-oidc-context';
import './index.css'
import App from './App.tsx'
import { SettingsProvider } from './stores/SettingsStore'
import { CustomerProvider } from './stores/CustomerStore'
import { OpportunitiesProvider } from './stores/OpportunitiesStore'

// Load runtime configuration from /config.json
async function loadRuntimeConfig(): Promise<Partial<RuntimeConfig>> {
  try {
    const response = await fetch('/config.json');
    if (!response.ok) {
      console.warn('Runtime config not found, using build-time values');
      return {};
    }
    const config = await response.json();

    // Filter out placeholder values
    const filteredConfig: Partial<RuntimeConfig> = {};
    for (const [key, value] of Object.entries(config)) {
      if (value && value !== 'RUNTIME_INJECTED' && value !== '') {
        filteredConfig[key as keyof RuntimeConfig] = value as string;
      }
    }

    console.log('Runtime configuration loaded:', Object.keys(filteredConfig));

    // Expose runtime config as global variable for other modules (e.g., supabase.ts)
    window.__RUNTIME_CONFIG__ = filteredConfig;

    return filteredConfig;
  } catch (error) {
    console.warn('Failed to load runtime config:', error);
    return {};
  }
}

// Initialize and render the application
async function initApp() {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error("Root element not found");

  // Detect test mode: Check if IAS is mock/missing OR explicit VITE_TEST_MODE
  const iasAuthority = import.meta.env.VITE_IAS_AUTHORITY || '';
  const iasClientId = import.meta.env.VITE_IAS_CLIENT_ID || '';
  const isTestMode =
    import.meta.env.VITE_TEST_MODE === 'true' ||
    iasAuthority.includes('mock') ||
    iasClientId.includes('mock') ||
    !iasAuthority ||
    !iasClientId;

  if (isTestMode) {
    // TEST MODE: Use dummy OIDC config for E2E tests (useAuth will return mock data)
    console.log('🧪 Running in TEST MODE with mock authentication');

    // Dummy OIDC configuration (won't be used, but required for AuthProvider)
    const dummyOidcConfig = {
      authority: 'https://mock.test',
      client_id: 'mock-client',
      redirect_uri: window.location.origin,
      automaticSilentRenew: false,
    };

    createRoot(rootElement).render(
      <AuthProvider {...dummyOidcConfig}>
        <SettingsProvider>
          <CustomerProvider>
            <OpportunitiesProvider>
              <App />
            </OpportunitiesProvider>
          </CustomerProvider>
        </SettingsProvider>
      </AuthProvider>
    );
  } else {
    // PRODUCTION/DEV MODE: Load runtime config, then validate and use AuthProvider
    const runtimeConfig = await loadRuntimeConfig();

    // Merge runtime config with build-time values (runtime takes precedence)
    const authority = runtimeConfig.VITE_IAS_AUTHORITY || import.meta.env.VITE_IAS_AUTHORITY;
    const clientId = runtimeConfig.VITE_IAS_CLIENT_ID || import.meta.env.VITE_IAS_CLIENT_ID;

    if (!authority || !clientId || authority === 'RUNTIME_INJECTED' || clientId === 'RUNTIME_INJECTED') {
      const missing = [];
      if (!authority || authority === 'RUNTIME_INJECTED') missing.push('VITE_IAS_AUTHORITY');
      if (!clientId || clientId === 'RUNTIME_INJECTED') missing.push('VITE_IAS_CLIENT_ID');

      createRoot(rootElement).render(
        <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
          <h1 style={{ color: '#ef4444' }}>Configuration Error</h1>
          <p>The following environment variables are missing:</p>
          <pre style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '0.5rem' }}>
            {missing.join('\n')}
          </pre>
          <p>Please ensure runtime configuration is properly injected via Kubernetes secrets or create a <code>.env.local</code> file for local development.</p>
        </div>
      );
    } else {
      const oidcConfig = {
        authority,
        client_id: clientId,
        redirect_uri: window.location.origin,
        post_logout_redirect_uri: window.location.origin,

        // Explicit OIDC Configuration
        response_type: 'code',  // Authorization Code Flow with PKCE
        scope: 'openid profile email',  // Requested user information scopes

        // Token Management
        automaticSilentRenew: true,  // Auto-refresh tokens before expiry
        accessTokenExpiringNotificationTimeInSeconds: 60,  // Alert 60s before expiry

        // Security & Session Management
        loadUserInfo: true,  // Load full user profile from /userinfo endpoint
        monitorSession: true,  // Monitor session state changes

        onSigninCallback: () => {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      };

      createRoot(rootElement).render(
        <AuthProvider {...oidcConfig}>
          <SettingsProvider>
            <CustomerProvider>
              <OpportunitiesProvider>
                <App />
              </OpportunitiesProvider>
            </CustomerProvider>
          </SettingsProvider>
        </AuthProvider>
      );
    }
  }
}

// Start the application
initApp().catch(console.error);
