import './i18n/config';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from 'react-oidc-context';
import './index.css'
import App from './App.tsx'
import { SettingsProvider } from './stores/SettingsStore'
import { CustomerProvider } from './stores/CustomerStore'
import { OpportunitiesProvider } from './stores/OpportunitiesStore'

const oidcConfig = {
  authority: import.meta.env.VITE_IAS_AUTHORITY,
  client_id: import.meta.env.VITE_IAS_CLIENT_ID,
  redirect_uri: window.location.origin,
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider {...oidcConfig}>
      <SettingsProvider>
        <CustomerProvider>
          <OpportunitiesProvider>
            <App />
          </OpportunitiesProvider>
        </CustomerProvider>
      </SettingsProvider>
    </AuthProvider>
  </StrictMode>,
)
