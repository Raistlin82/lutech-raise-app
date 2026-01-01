import './i18n/config';
import { createRoot } from 'react-dom/client'
import { AuthProvider } from 'react-oidc-context';
import './index.css'
import App from './App.tsx'
import { SettingsProvider } from './stores/SettingsStore'
import { CustomerProvider } from './stores/CustomerStore'
import { OpportunitiesProvider } from './stores/OpportunitiesStore'

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element not found");

const isTestMode = import.meta.env.VITE_TEST_MODE === 'true';

if (isTestMode) {
  // TEST MODE: Render App directly to use the mock auth hook
  createRoot(rootElement).render(
    <SettingsProvider>
      <CustomerProvider>
        <OpportunitiesProvider>
          <App />
        </OpportunitiesProvider>
      </CustomerProvider>
    </SettingsProvider>
  );
} else {
  // PRODUCTION/DEV MODE: Validate config and use real AuthProvider
  const authority = import.meta.env.VITE_IAS_AUTHORITY;
  const clientId = import.meta.env.VITE_IAS_CLIENT_ID;

  if (!authority || !clientId) {
    const missing = [];
    if (!authority) missing.push('VITE_IAS_AUTHORITY');
    if (!clientId) missing.push('VITE_IAS_CLIENT_ID');

    createRoot(rootElement).render(
      <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ color: '#ef4444' }}>Configuration Error</h1>
        <p>The following environment variables are missing:</p>
        <pre style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '0.5rem' }}>
          {missing.join('\n')}
        </pre>
        <p>Please ensure you have created a <code>.env.local</code> file and <strong>restarted the development server</strong>.</p>
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
