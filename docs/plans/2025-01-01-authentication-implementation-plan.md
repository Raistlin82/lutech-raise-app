# Piano di Implementazione: Autenticazione Vercel + Clerk

**Design di riferimento:** `2025-01-01-authentication-design.md`
**Branch:** `feature/auth-clerk-vercel`
**Tempo stimato totale:** ~2 ore

---

## Pre-requisiti (Setup Manuale)

Prima di iniziare il codice, completare questi setup manuali:

### A. Creare Account Vercel
1. Vai su https://vercel.com
2. "Sign Up" con GitHub
3. Autorizza accesso al repository `Raistlin82/lutech-raise-app`

### B. Creare Account Clerk
1. Vai su https://clerk.com
2. "Sign Up" (puoi usare GitHub)
3. Crea nuova Application: "RAISE App"
4. Scegli "Next.js" come framework (funziona anche per Vite)
5. Abilita provider:
   - Microsoft (toggle ON)
   - Google (toggle ON)
   - Apple (toggle ON)
6. Copia `Publishable Key` (inizia con `pk_test_` o `pk_live_`)

### C. Configurare Clerk JWT per Supabase
1. Clerk Dashboard → JWT Templates
2. "New Template" → Blank
3. Nome: `supabase`
4. Claims:
   ```json
   {
     "sub": "{{user.id}}",
     "email": "{{user.primary_email_address}}"
   }
   ```
5. Salva

---

## Fase 1: Configurazione Vite per Vercel

### Task 1.1: Rimuovere base path

**File:** `vite.config.ts`

```typescript
// PRIMA
export default defineConfig({
  base: '/lutech-raise-app',
  plugins: [react()],
  // ...
});

// DOPO
export default defineConfig({
  plugins: [react()],
  // ... (rimuovere la riga base)
});
```

### Task 1.2: Aggiornare App.tsx per routing senza base path

**File:** `src/App.tsx`

```typescript
// PRIMA
<BrowserRouter basename="/lutech-raise-app">

// DOPO
<BrowserRouter>
```

### Task 1.3: Creare vercel.json per SPA routing

**File:** `vercel.json` (nuovo file in root)

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Task 1.4: Aggiornare .env.example

**File:** `.env.example`

```bash
# Supabase
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Clerk
VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
```

**Verifica:** `npm run build` deve completare senza errori

---

## Fase 2: Installare Clerk SDK

### Task 2.1: Installare dipendenze

```bash
npm install @clerk/clerk-react
```

### Task 2.2: Aggiornare tipi TypeScript (se necessario)

**File:** `src/vite-env.d.ts`

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

**Verifica:** `npm run build` senza errori TypeScript

---

## Fase 3: Integrare Clerk Provider

### Task 3.1: Creare ClerkProvider wrapper

**File:** `src/main.tsx`

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import './index.css';
import './i18n';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  console.warn('Clerk publishable key not found. Auth will be disabled.');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {clerkPubKey ? (
      <ClerkProvider publishableKey={clerkPubKey}>
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </React.StrictMode>
);
```

### Task 3.2: Creare componente AuthGuard

**File:** `src/components/auth/AuthGuard.tsx` (nuovo)

```tsx
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { ReactNode } from 'react';

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  // Se Clerk non è configurato, mostra app senza auth (development)
  if (!clerkPubKey) {
    return <>{children}</>;
  }

  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};
```

### Task 3.3: Creare index per auth components

**File:** `src/components/auth/index.ts` (nuovo)

```typescript
export { AuthGuard } from './AuthGuard';
```

**Verifica:** Componenti creati, nessun errore TypeScript

---

## Fase 4: Proteggere l'Applicazione

### Task 4.1: Wrappare App con AuthGuard

**File:** `src/App.tsx`

```tsx
import { AuthGuard } from './components/auth';

function App() {
  return (
    <ErrorBoundary>
      <Toaster />
      <AuthGuard>
        <BrowserRouter>
          <Layout>
            <AppRoutes />
          </Layout>
        </BrowserRouter>
      </AuthGuard>
    </ErrorBoundary>
  );
}
```

### Task 4.2: Aggiungere UserButton nel Header

**File:** `src/components/layout/index.tsx`

```tsx
import { UserButton, useUser } from '@clerk/clerk-react';

export const Header = ({ onOpenSidebar }: { onOpenSidebar: () => void }) => {
  const { t } = useTranslation();
  const { user, isLoaded } = useUser();
  const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

  return (
    <header className="...">
      <div className="flex items-center gap-4">
        {/* ... existing content ... */}
      </div>

      <div className="flex items-center gap-4">
        {clerkEnabled && isLoaded && user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 hidden sm:block">
              {user.primaryEmailAddress?.emailAddress}
            </span>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9"
                }
              }}
            />
          </div>
        )}
      </div>
    </header>
  );
};
```

**Verifica:** App mostra redirect a Clerk sign-in se non autenticato

---

## Fase 5: Integrare Clerk con Supabase

### Task 5.1: Creare hook useSupabaseClient

**File:** `src/lib/supabase.ts` (aggiornare)

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/clerk-react';
import { useMemo } from 'react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Client base senza auth (per fallback)
export const supabaseBase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Hook per client autenticato con Clerk
export const useSupabaseClient = () => {
  const { getToken } = useAuth();

  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseAnonKey) return null;

    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: async (url, options = {}) => {
          const clerkToken = await getToken({ template: 'supabase' });

          const headers = new Headers(options.headers);
          if (clerkToken) {
            headers.set('Authorization', `Bearer ${clerkToken}`);
          }

          return fetch(url, {
            ...options,
            headers,
          });
        },
      },
    });
  }, [getToken]);

  return supabase;
};

// Utility per verificare se Supabase è configurato
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};
```

### Task 5.2: Aggiornare i Service per usare il nuovo client

**File:** `src/services/opportunityService.ts` (e altri service)

I service devono ricevere il client Supabase come parametro invece di importarlo direttamente. Questo richiede refactoring dei service e degli store.

**Approccio alternativo (più semplice):** Creare un context per Supabase client:

**File:** `src/contexts/SupabaseContext.tsx` (nuovo)

```tsx
import { createContext, useContext, ReactNode } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { useSupabaseClient } from '../lib/supabase';

const SupabaseContext = createContext<SupabaseClient | null>(null);

export const SupabaseProvider = ({ children }: { children: ReactNode }) => {
  const supabase = useSupabaseClient();
  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  return context;
};
```

**Verifica:** Le chiamate a Supabase includono JWT di Clerk

---

## Fase 6: Configurare RLS su Supabase

### Task 6.1: Abilitare RLS (da eseguire su Supabase Dashboard → SQL Editor)

```sql
-- Abilita RLS su tutte le tabelle
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE controls ENABLE ROW LEVEL SECURITY;

-- Policy: utenti autenticati possono fare tutto
CREATE POLICY "authenticated_access" ON opportunities
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_access" ON customers
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_access" ON controls
  FOR ALL USING (auth.role() = 'authenticated');
```

### Task 6.2: Configurare Supabase per accettare JWT Clerk

1. Supabase Dashboard → Project Settings → API
2. JWT Settings → JWT Secret
3. Clerk Dashboard → API Keys → Copy JWT Verification Key (PEM format)
4. Incolla in Supabase (o configura JWKS URL)

**Alternativa più semplice con JWKS:**
```
Supabase → Settings → API → JWT → JWKS URL:
https://<your-clerk-domain>/.well-known/jwks.json
```

**Verifica:** Query a Supabase funzionano solo con utente autenticato

---

## Fase 7: Cleanup e Test

### Task 7.1: Rimuovere file non più necessari

- `public/404.html` (Vercel gestisce SPA routing)
- Workflow GitHub Pages in `.github/workflows/deploy.yml` (opzionale, può rimanere come backup)

### Task 7.2: Aggiornare README.md

Aggiungere sezione su deploy Vercel e configurazione Clerk.

### Task 7.3: Test manuali

1. [ ] Login con Microsoft funziona
2. [ ] Login con Google funziona
3. [ ] Login con Apple funziona
4. [ ] Logout funziona
5. [ ] Sessione persiste dopo refresh
6. [ ] Dati Supabase accessibili dopo login
7. [ ] Dati Supabase NON accessibili senza login

### Task 7.4: Aggiornare test E2E

I test E2E devono bypassare l'auth o mockare Clerk. Opzioni:
- Usare `@clerk/testing` per mock
- Disabilitare auth in ambiente test
- Creare utente test dedicato

---

## Fase 8: Deploy

### Task 8.1: Configurare Vercel

1. Vercel Dashboard → Import Project
2. Seleziona `Raistlin82/lutech-raise-app`
3. Branch: `feature/auth-clerk-vercel`
4. Environment Variables:
   - `VITE_CLERK_PUBLISHABLE_KEY` = (da Clerk)
   - `VITE_SUPABASE_URL` = (da Supabase)
   - `VITE_SUPABASE_ANON_KEY` = (da Supabase)
5. Deploy

### Task 8.2: Aggiornare Clerk Allowed Origins

Clerk Dashboard → Settings → Allowed Origins:
- `https://lutech-raise-app.vercel.app`
- `https://*.vercel.app` (per preview deploys)

### Task 8.3: Verificare deploy

1. Aprire URL Vercel
2. Verificare redirect a Clerk
3. Login con un provider
4. Verificare accesso a dashboard

---

## Rollback

Se qualcosa va storto:

1. **Non fare merge** del branch in main
2. L'app su GitHub Pages continua a funzionare
3. Eliminare progetto Vercel se necessario
4. Disabilitare/eliminare app Clerk se necessario

---

## Checklist Finale

- [ ] Account Vercel creato
- [ ] Account Clerk creato
- [ ] Provider abilitati (Microsoft, Google, Apple)
- [ ] JWT Template creato in Clerk
- [ ] Codice aggiornato (Fase 1-5)
- [ ] RLS abilitato su Supabase (Fase 6)
- [ ] Test manuali passati (Fase 7)
- [ ] Deploy su Vercel funzionante (Fase 8)
- [ ] Merge in main (solo dopo validazione completa)

---

**Note:** Questo piano può essere eseguito incrementalmente. Ogni fase è indipendente e può essere testata separatamente.
