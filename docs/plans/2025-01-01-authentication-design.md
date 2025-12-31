# Authentication Design: Vercel + Clerk + Supabase

**Data:** 2025-01-01
**Branch:** `feature/auth-clerk-vercel`
**Stato:** Da implementare

## Obiettivi

1. **Proteggere l'accesso all'app** - Solo utenti autenticati possono usare RAISE
2. **Compliance SSO enterprise** - Supporto per identity provider aziendali (Entra ID)
3. **Flessibilità provider** - Supporto per multiple opzioni di login

## Architettura

```
┌─────────────────────────────────────────────────────────────────┐
│                         UTENTE                                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL (Hosting)                              │
│            raise-app.vercel.app (o dominio custom)              │
│                                                                 │
│   • Hosting React SPA                                           │
│   • Routing SPA automatico (niente più 404.html hack)          │
│   • Edge network globale                                        │
│   • Environment variables per chiavi Clerk/Supabase            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                       CLERK (Auth)                               │
│                                                                 │
│   • Login UI preconfigurata (o custom)                          │
│   • Microsoft Entra ID ✅                                       │
│   • Google ✅                                                   │
│   • Apple ✅ (senza Dev Account!)                               │
│   • Gestione sessioni automatica                                │
│   • JWT per Supabase                                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SUPABASE (Database)                            │
│                                                                 │
│   • PostgreSQL (invariato)                                      │
│   • Verifica JWT da Clerk                                       │
│   • RLS policies basate su user_id                              │
└─────────────────────────────────────────────────────────────────┘
```

## Provider di Autenticazione

| Provider | Incluso in Clerk Free | Configurazione |
|----------|----------------------|----------------|
| Microsoft Entra ID | ✅ | Guidata da Clerk |
| Google | ✅ | Guidata da Clerk |
| Apple | ✅ | Gestito da Clerk (no Dev Account) |
| Email + Password | ✅ | Opzionale |

## Stack Tecnologico

| Componente | Attuale | Nuovo |
|------------|---------|-------|
| Hosting | GitHub Pages | Vercel |
| Auth | Nessuno | Clerk |
| Database | Supabase | Supabase (invariato) |
| Frontend | React + Vite | React + Vite (invariato) |

## Fasi di Implementazione

### Fase 1: Setup Vercel (5 minuti)

1. Creare account Vercel (vercel.com) - free tier
2. Importare repository GitHub `Raistlin82/lutech-raise-app`
3. Configurare build settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Modificare `vite.config.ts`:
   - Rimuovere `base: '/lutech-raise-app'` (Vercel usa root `/`)
5. Deploy automatico

**Risultato:** App live su `lutech-raise-app.vercel.app`

### Fase 2: Setup Clerk (10 minuti)

1. Creare account Clerk (clerk.com) - free tier (10k MAU)
2. Creare nuova Application "RAISE App"
3. Abilitare Social Connections:
   - Microsoft (Azure AD / Entra ID) → On
   - Google → On
   - Apple → On
4. Copiare chiavi API:
   - `VITE_CLERK_PUBLISHABLE_KEY` (frontend)
   - `CLERK_SECRET_KEY` (se serve backend)
5. Configurare Allowed Origins:
   - `https://lutech-raise-app.vercel.app`
   - `http://localhost:5173` (development)

### Fase 3: Integrazione React (30 minuti)

1. Installare dipendenze:
   ```bash
   npm install @clerk/clerk-react
   ```

2. Aggiornare `main.tsx`:
   ```tsx
   import { ClerkProvider } from '@clerk/clerk-react';

   const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

   <ClerkProvider publishableKey={publishableKey}>
     <App />
   </ClerkProvider>
   ```

3. Creare componente `AuthGuard.tsx`:
   ```tsx
   import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

   export const AuthGuard = ({ children }) => (
     <>
       <SignedIn>{children}</SignedIn>
       <SignedOut><RedirectToSignIn /></SignedOut>
     </>
   );
   ```

4. Proteggere App in `App.tsx`:
   ```tsx
   <AuthGuard>
     <Layout>
       <AppRoutes />
     </Layout>
   </AuthGuard>
   ```

5. Aggiungere UserButton nel header:
   ```tsx
   import { UserButton } from '@clerk/clerk-react';

   // Nel Header component
   <UserButton afterSignOutUrl="/" />
   ```

### Fase 4: Integrazione Clerk + Supabase (20 minuti)

1. Configurare Supabase JWT verification:
   - Dashboard Supabase → Settings → API
   - Aggiungere Clerk JWT secret

2. Aggiornare `supabase.ts`:
   ```tsx
   import { useAuth } from '@clerk/clerk-react';

   export const useSupabaseClient = () => {
     const { getToken } = useAuth();

     const supabase = createClient(url, anonKey, {
       global: {
         fetch: async (url, options = {}) => {
           const token = await getToken({ template: 'supabase' });
           return fetch(url, {
             ...options,
             headers: {
               ...options.headers,
               Authorization: `Bearer ${token}`,
             },
           });
         },
       },
     });

     return supabase;
   };
   ```

3. Creare JWT Template in Clerk:
   - Dashboard Clerk → JWT Templates → New
   - Nome: `supabase`
   - Claims: `{ "sub": "{{user.id}}" }`

### Fase 5: Sicurezza Database (15 minuti)

1. Abilitare RLS su tutte le tabelle:
   ```sql
   ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
   ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
   ALTER TABLE controls ENABLE ROW LEVEL SECURITY;
   ```

2. Creare policies (accesso per utenti autenticati):
   ```sql
   -- Opportunità: tutti gli utenti autenticati possono vedere/modificare
   CREATE POLICY "Authenticated users can access opportunities"
   ON opportunities FOR ALL
   USING (auth.uid() IS NOT NULL);

   -- Stessa policy per customers e controls
   CREATE POLICY "Authenticated users can access customers"
   ON customers FOR ALL
   USING (auth.uid() IS NOT NULL);

   CREATE POLICY "Authenticated users can access controls"
   ON controls FOR ALL
   USING (auth.uid() IS NOT NULL);
   ```

### Fase 6: Aggiornamenti Vari

1. Rimuovere `public/404.html` (non serve su Vercel)
2. Aggiornare `.env.example` con nuove variabili
3. Aggiornare `README.md` con istruzioni deploy Vercel
4. Aggiornare GitHub Actions (opzionale: può rimanere come backup)

## Environment Variables

### Vercel Dashboard

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

### Local Development (.env.local)

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

## User Experience

### Flusso Login

1. Utente apre app → Vede pagina login Clerk
2. Sceglie provider (Microsoft / Google / Apple)
3. Redirect a provider → Autentica
4. Redirect back → Sessione creata
5. Vede Dashboard RAISE

### Flusso Logout

1. Click su avatar utente (UserButton)
2. Click "Sign out"
3. Sessione terminata → Redirect a login

## Costi

| Servizio | Piano | Limite | Costo |
|----------|-------|--------|-------|
| Vercel | Hobby | 100GB bandwidth | Gratuito |
| Clerk | Free | 10,000 MAU | Gratuito |
| Supabase | Free | 500MB DB | Gratuito |

**Totale: €0/mese** per uso tipico

## Rollback Plan

Se qualcosa va storto:
1. Il branch `main` rimane invariato su GitHub Pages
2. Basta non fare merge del branch `feature/auth-clerk-vercel`
3. L'app originale continua a funzionare su GitHub Pages

## Decisioni Future

- [ ] Aggiungere multi-tenant (ogni utente vede solo i propri dati)
- [ ] Aggiungere ruoli/permessi (admin, viewer, editor)
- [ ] Dominio custom (es. raise.lutech.it)
- [ ] Backup su GitHub Pages come fallback

---

**Approvato da:** (da confermare)
**Data approvazione:** (da confermare)
