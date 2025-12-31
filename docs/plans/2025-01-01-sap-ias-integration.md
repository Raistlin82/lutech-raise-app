# SAP IAS Integration Guide

**Data:** 2025-01-01
**Stato:** Completata ✅

## Overview

SAP Identity Authentication Service (IAS) fornisce autenticazione enterprise per RAISE App. Supporta:
- Federation con Microsoft Entra ID (Azure AD)
- Social login (Google)
- SAP corporate accounts

## Architettura Autenticazione

```
┌──────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│                  │     │                 │     │                  │
│   RAISE App      │────▶│   SAP IAS       │────▶│  Identity        │
│   (React SPA)    │     │   (OIDC)        │     │  Providers       │
│                  │◀────│                 │◀────│                  │
└──────────────────┘     └─────────────────┘     └──────────────────┘
                                                  │ Microsoft Entra
                                                  │ Google
                                                  │ SAP ID Service
```

## Configurazione SAP IAS

### 1. Creare Application in SAP IAS Admin Console

1. Accedi a: `https://your-tenant.accounts.ondemand.com/admin`
2. Vai a **Applications & Resources** > **Applications**
3. Click **+ Add**
4. Configura:
   - **Display Name:** RAISE App
   - **Home URL:** `https://raise-app.{kyma-cluster}.kyma.ondemand.com`
   - **Type:** OpenID Connect

### 2. Configurare OpenID Connect

Nella sezione **Trust** > **OpenID Connect Configuration**:

```
Redirect URIs:
  - https://raise-app.{kyma-cluster}.kyma.ondemand.com/callback
  - https://raise-app.{kyma-cluster}.kyma.ondemand.com/silent-callback
  - http://localhost:5173/callback (development)

Post Logout Redirect URIs:
  - https://raise-app.{kyma-cluster}.kyma.ondemand.com
  - http://localhost:5173 (development)

Grant Types:
  - Authorization Code
  - Refresh Token

Response Types:
  - code

PKCE:
  - Enabled (Required for SPA)
```

### 3. Configurare Identity Providers

#### Microsoft Entra ID (SAML Federation)

1. In SAP IAS: **Identity Providers** > **Corporate Identity Providers** > **+ Add**
2. Configurazione SAML:
   ```
   Name: Microsoft Entra ID
   Metadata URL: https://login.microsoftonline.com/{tenant-id}/federationmetadata/2007-06/federationmetadata.xml
   ```
3. In Azure AD:
   - Creare Enterprise Application per SAP IAS
   - Configurare SAML SSO
   - Assegnare utenti/gruppi

#### Google

1. In SAP IAS: **Identity Providers** > **Social Identity Providers**
2. Abilitare **Google**
3. Configurare OAuth credentials da Google Cloud Console

### 4. Ottenere Credenziali OIDC

Dopo configurazione, ottieni:
- **Client ID:** `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Issuer URL:** `https://your-tenant.accounts.ondemand.com`
- **JWKS URL:** `https://your-tenant.accounts.ondemand.com/oauth2/certs`

## Integrazione Frontend React

### Opzione 1: react-oidc-context (Raccomandata)

```bash
npm install oidc-client-ts react-oidc-context
```

### Configurazione AuthProvider

```tsx
// src/auth/AuthProvider.tsx
import { AuthProvider as OIDCAuthProvider, AuthProviderProps } from 'react-oidc-context';

const oidcConfig: AuthProviderProps = {
  authority: import.meta.env.VITE_IAS_AUTHORITY,
  client_id: import.meta.env.VITE_IAS_CLIENT_ID,
  redirect_uri: `${window.location.origin}/callback`,
  post_logout_redirect_uri: window.location.origin,
  scope: 'openid email profile',

  // PKCE configuration (required for SPA)
  response_type: 'code',

  // Silent refresh
  automaticSilentRenew: true,
  silent_redirect_uri: `${window.location.origin}/silent-callback`,

  // Events
  onSigninCallback: () => {
    // Remove query parameters from URL after login
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <OIDCAuthProvider {...oidcConfig}>
    {children}
  </OIDCAuthProvider>
);
```

### Hook per Autenticazione

```tsx
// src/auth/useAuth.ts
import { useAuth as useOIDCAuth } from 'react-oidc-context';

export const useAuth = () => {
  const auth = useOIDCAuth();

  return {
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    user: auth.user,
    login: () => auth.signinRedirect(),
    logout: () => auth.signoutRedirect(),
    getAccessToken: () => auth.user?.access_token,
  };
};
```

### Protezione Route

```tsx
// src/auth/ProtectedRoute.tsx
import { useAuth } from 'react-oidc-context';
import { Navigate, useLocation } from 'react-router-dom';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const location = useLocation();

  if (auth.isLoading) {
    return <LoadingSpinner />;
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

### Callback Component

```tsx
// src/pages/Callback.tsx
import { useAuth } from 'react-oidc-context';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const Callback: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      navigate('/');
    }
  }, [auth.isLoading, auth.isAuthenticated, navigate]);

  if (auth.error) {
    return <div>Errore di autenticazione: {auth.error.message}</div>;
  }

  return <LoadingSpinner />;
};
```

### App Integration

```tsx
// src/App.tsx
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/callback" element={<Callback />} />
          <Route path="/silent-callback" element={<SilentCallback />} />

          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

## Environment Variables

### Development (.env.local)

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_IAS_AUTHORITY=https://your-tenant.accounts.ondemand.com
VITE_IAS_CLIENT_ID=your-client-id
```

### Production (GitHub Secrets)

Configurare in GitHub:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_IAS_AUTHORITY`
- `VITE_IAS_CLIENT_ID`
- `KYMA_KUBECONFIG` (base64 encoded)
- `KYMA_CLUSTER_DOMAIN`

## Integrazione con Supabase

### Sync Utenti IAS → Supabase

Opzione 1: JWT Custom Claims
```typescript
// Supabase supporta JWT esterni se configurato correttamente
// Richiede configurazione server-side
```

Opzione 2: User Mapping Table
```sql
-- In Supabase
CREATE TABLE user_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ias_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policy
ALTER TABLE user_mappings ENABLE ROW LEVEL SECURITY;
```

### RLS con IAS Users

```sql
-- Modifica RLS policy per usare email dall'IAS token
CREATE POLICY "Users can read own opportunities"
ON opportunities FOR SELECT
USING (
  created_by_email = current_setting('request.headers')::json->>'x-user-email'
);
```

## Testing

### Test Locale con IAS

1. Aggiungi `http://localhost:5173/callback` alle Redirect URIs in IAS
2. Usa `.env.local` per credenziali
3. Avvia app: `npm run dev`
4. Testa login flow

### Test E2E

```typescript
// e2e/auth.spec.ts
test.describe('Authentication', () => {
  test('should redirect to login if not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/login/);
  });

  test('should show user info after login', async ({ page }) => {
    // Mock or use test IAS credentials
    await page.goto('/');
    // ... login flow
    await expect(page.getByText(/Welcome/)).toBeVisible();
  });
});
```

## Troubleshooting

### Errore: Invalid redirect_uri

Verifica che l'URI sia esattamente uguale in:
- SAP IAS Admin Console
- Configurazione OIDC frontend
- Include schema (https vs http)

### Errore: CORS

SAP IAS supporta CORS automaticamente per i domini configurati. Verifica:
- Application Home URL corretta
- Redirect URIs complete

### Token Refresh Fallisce

- Verifica `silent_redirect_uri` configurato
- Aggiungi pagina `/silent-callback` con iframe handler

## Testing E2E con Autenticazione Moccata

Per mantenere la stabilità dei test E2E senza dipendere da un tenant IAS reale (evitando redirect infiniti in ambiente headless), abbiamo introdotto un sistema di mocking basato su `VITE_TEST_MODE`.

### Funzionamento
1.  **`src/hooks/useAuth.ts`**: Un wrapper che intercetta la modalità test. Se attiva, restituisce un contesto utente finto ma valido (`isAuthenticated: true`).
2.  **`main.tsx`**: Se in test mode, scarica l'app direttamente senza inizializzare `AuthProvider` di `react-oidc-context`.
3.  **`.env.test`**: Contiene `VITE_TEST_MODE=true` per forzare questo comportamento durante i test suite.

### Esecuzione Test
```bash
# Esegue il server in modalità test e lancia Playwright
npm run test:e2e
```

---

**Ultimo aggiornamento:** 2025-01-01
