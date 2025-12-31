# SAP BTP Kyma Deployment Design

**Data:** 2025-01-01
**Branch:** `raise-btp-ias-auth`
**Stato:** SAP IAS Integration Completed ✅ / Kyma Deployment In Progress 🚧

## Obiettivi

1. Deployare RAISE App su SAP BTP Kyma (Kubernetes)
2. Integrare autenticazione con SAP IAS (Identity Authentication Service)
3. Mantenere Supabase come database

## Architettura

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SAP BTP                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                      KYMA RUNTIME                              │  │
│  │                                                                │  │
│  │  ┌─────────────────┐    ┌─────────────────┐                   │  │
│  │  │   APIRule       │    │   Service       │                   │  │
│  │  │   (Ingress)     │───▶│   (ClusterIP)   │                   │  │
│  │  └─────────────────┘    └────────┬────────┘                   │  │
│  │                                  │                             │  │
│  │                                  ▼                             │  │
│  │                         ┌─────────────────┐                   │  │
│  │                         │   Deployment    │                   │  │
│  │                         │   (nginx+React) │                   │  │
│  │                         │   replicas: 2   │                   │  │
│  │                         └─────────────────┘                   │  │
│  │                                                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    SAP IAS                                     │  │
│  │         (Identity Authentication Service)                      │  │
│  │                                                                │  │
│  │  • Microsoft Entra ID (federation)                            │  │
│  │  • Google                                                      │  │
│  │  • Apple                                                       │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │       SUPABASE          │
                    │     (PostgreSQL)        │
                    │                         │
                    │  • opportunities        │
                    │  • customers            │
                    │  • controls             │
                    └─────────────────────────┘
```

## Stack Tecnologico

| Componente | Tecnologia | Note |
|------------|------------|------|
| Container Runtime | Docker + nginx:alpine | Serve React SPA |
| Orchestration | Kubernetes (Kyma) | Managed by SAP |
| Ingress | Kyma APIRule | Istio-based |
| Auth | SAP IAS | OIDC/SAML |
| Database | Supabase | Esterno |
| CI/CD | GitHub Actions | Build + Deploy |
| Registry | GitHub Container Registry | ghcr.io |

## Componenti da Creare

### 1. Docker Configuration

**Dockerfile:**
- Base image: `nginx:alpine`
- Copia build React in `/usr/share/nginx/html`
- Configura nginx per SPA routing
- Espone porta 8080 (non-root)

**nginx.conf:**
- SPA fallback (`try_files $uri /index.html`)
- Gzip compression
- Security headers
- Health check endpoint

### 2. Kubernetes Manifests

```
k8s/
├── namespace.yaml       # Namespace dedicato (opzionale)
├── configmap.yaml       # Environment variables
├── secret.yaml          # Sensitive data (Supabase keys)
├── deployment.yaml      # Pod definition
├── service.yaml         # ClusterIP service
└── apirule.yaml         # Kyma ingress
```

### 3. CI/CD Pipeline

**Trigger:** Push su `main` branch
**Steps:**
1. Checkout code
2. Install dependencies
3. Build React app
4. Build Docker image
5. Push to ghcr.io
6. Deploy to Kyma (kubectl)

## Integrazione SAP IAS

### Configurazione SAP IAS

1. **Creare Application in SAP IAS:**
   - Nome: RAISE App
   - Protocol: OpenID Connect
   - Redirect URI: `https://raise.kyma.your-cluster.ondemand.com/callback`

2. **Configurare Identity Providers:**
   - Corporate IdP: Microsoft Entra ID (SAML federation)
   - Social: Google, Apple

3. **Ottenere credenziali:**
   - Client ID
   - Client Secret
   - Issuer URL

### Integrazione Frontend

Opzioni:
- **@sap/approuter**: Proxy con auth built-in (più complesso)
- **OIDC client diretto**: Libreria React OIDC (più semplice)

**Raccomandazione:** Usare `oidc-client-ts` o `react-oidc-context` per integrazione diretta.

```tsx
// Esempio con react-oidc-context
import { AuthProvider } from 'react-oidc-context';

const oidcConfig = {
  authority: 'https://your-tenant.accounts.ondemand.com',
  client_id: 'your-client-id',
  redirect_uri: 'https://raise.kyma.../callback',
  scope: 'openid email profile',
};

<AuthProvider {...oidcConfig}>
  <App />
</AuthProvider>
```

## Environment Variables

### Build Time (Vite)
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_IAS_AUTHORITY=https://your-tenant.accounts.ondemand.com
VITE_IAS_CLIENT_ID=xxx
```

### Runtime (Kubernetes)
```yaml
# configmap.yaml
data:
  VITE_SUPABASE_URL: "https://xxx.supabase.co"
  VITE_IAS_AUTHORITY: "https://your-tenant.accounts.ondemand.com"
  VITE_IAS_CLIENT_ID: "xxx"

# secret.yaml
data:
  VITE_SUPABASE_ANON_KEY: base64(xxx)
```

**Nota:** Per React SPA, le variabili sono "baked in" al build time. Per variabili runtime, serve injection via nginx o window object.

## Fasi di Implementazione

### Fase 1: Containerizzazione (questo branch)
- [x] Design document
- [x] Dockerfile
- [x] nginx.conf
- [x] .dockerignore
- [ ] Build e test locale

### Fase 2: Kubernetes Manifests
- [x] deployment.yaml
- [x] service.yaml
- [x] apirule.yaml
- [x] configmap.yaml
- [x] kustomization.yaml
- [ ] Test su Kyma

### Fase 3: CI/CD
- [x] GitHub Actions workflow (deploy-kyma.yml)
- [ ] Secrets configuration
- [ ] Deploy automatico

### Fase 4: SAP IAS (Completata ✅)
- [x] Configurazione IAS tenant
- [x] Integrazione React OIDC (PKCE)
- [x] Test autenticazione & Logout
- [x] Protezione route (RequireAuth)
- [x] Mock Auth per E2E (Test Mode)

## Prerequisiti

1. **SAP BTP Account** con Kyma runtime abilitato
2. **SAP IAS Tenant** configurato
3. **kubectl** configurato per Kyma cluster
4. **GitHub Container Registry** access (ghcr.io)

## URL Finali

| Ambiente | URL |
|----------|-----|
| Production | `https://raise.{kyma-cluster}.kyma.ondemand.com` |
| GitHub Pages | `https://raistlin82.github.io/lutech-raise-app` (backup) |

## Rollback

Se deployment Kyma fallisce:
1. App GitHub Pages rimane attiva
2. Revert Kyma deployment: `kubectl rollout undo deployment/raise-app`
3. Branch può essere abbandonato senza impatto su main

---

**Autore:** Claude + Gabriele Rendina
**Ultimo aggiornamento:** 2025-01-01
