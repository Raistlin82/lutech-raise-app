# Template Prompt per Nuova Applicazione SAP BTP Kyma

> Usa questo prompt quando vuoi creare una nuova applicazione con le stesse caratteristiche architetturali e di deployment di RAISE App.

---

## PROMPT DA COPIARE

```
Crea una nuova applicazione web con le seguenti specifiche tecniche e architetturali:

## 1. TECH STACK

### Frontend
- **Framework**: React 18+ con TypeScript (strict mode)
- **Build Tool**: Vite 5+ con ottimizzazione bundle (manual chunks)
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM v6+
- **State Management**: Zustand per stato globale
- **Form Validation**: Zod per schema validation
- **Internazionalizzazione**: i18next + react-i18next (locale: italiano)
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

### Backend/Database
- **Opzione A - Supabase**: @supabase/supabase-js per PostgreSQL managed
- **Opzione B - PostgreSQL su BTP**: PostgreSQL Hyperscaler con connection pooling
- **Pattern**: Repository Pattern per data access layer type-safe

### Autenticazione
- **Provider**: SAP IAS (Identity Authentication Service) via OIDC
- **Library**: oidc-client-ts + react-oidc-context
- **Flow**: Authorization Code con PKCE

## 2. ARCHITETTURA

### Struttura Directory
```
src/
├── api/                    # API client functions
├── components/
│   ├── common/            # Componenti riutilizzabili (ErrorBoundary, LoadingSpinner, etc.)
│   ├── layout/            # Layout principale (Sidebar, Header)
│   └── [feature]/         # Componenti per feature
├── hooks/                  # Custom React hooks
├── i18n/
│   ├── config.ts          # Configurazione i18next
│   └── locales/it/        # File di traduzione JSON per namespace
├── lib/                    # Utility e business logic
├── pages/                  # Page components (route-based)
├── repositories/          # Repository pattern per data access
├── services/              # Business logic services
├── stores/                # Zustand stores
└── types/                 # TypeScript type definitions
```

### Pattern Architetturali
1. **Repository Pattern**: Astrazione del data layer con interfacce type-safe
2. **Service Layer**: Business logic separata dai componenti
3. **Store Pattern**: Stato globale con Zustand (non Redux)
4. **Error Boundaries**: Gestione errori React a livello di route
5. **Lazy Loading**: Code splitting per route con React.lazy()

## 3. CONFIGURAZIONE VITE

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'react-hot-toast', 'clsx'],
          'validation': ['zod'],
          'i18n': ['i18next', 'react-i18next'],
          'auth': ['oidc-client-ts', 'react-oidc-context'],
          'supabase': ['@supabase/supabase-js'], // se usato
        },
      },
    },
  },
});
```

## 4. TESTING

### Unit Tests (Vitest)
- **Framework**: Vitest con jsdom environment
- **Coverage target**: >70% per services, >60% globale
- **Pattern**: beforeEach/afterEach per cleanup, mock di localStorage
- **Location**: File `.test.ts` accanto ai file sorgente

### E2E Tests (Playwright)
- **Framework**: Playwright con TypeScript
- **Browser**: Chromium headless
- **Pattern**: Page Object Model opzionale
- **CI**: Esecuzione su ambiente Kyma production

### Comandi
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test"
  }
}
```

## 5. CI/CD (GitHub Actions)

### Workflow: deploy-kyma.yml
```yaml
name: Deploy to SAP BTP Kyma
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test -- --run
      - run: npm run lint

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-kyma:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup kubectl
        uses: azure/setup-kubectl@v3
      - name: Configure kubeconfig
        run: |
          mkdir -p ~/.kube
          echo "${{ secrets.KYMA_KUBECONFIG }}" | base64 -d > ~/.kube/config
      - name: Deploy to Kyma
        run: |
          kubectl apply -k k8s/overlays/production
          kubectl rollout status deployment/$APP_NAME -n $NAMESPACE --timeout=180s
```

### Workflow: e2e-kyma.yml
```yaml
name: E2E Tests on Kyma Production
on:
  workflow_dispatch:
  workflow_run:
    workflows: ["Deploy to SAP BTP Kyma"]
    types: [completed]

jobs:
  e2e-production:
    if: ${{ github.event.workflow_run.conclusion == 'success' || github.event_name == 'workflow_dispatch' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install chromium
      - run: npx playwright test
        env:
          BASE_URL: ${{ secrets.KYMA_APP_URL }}
```

## 6. CONTAINERIZZAZIONE (Docker)

### Dockerfile (multi-stage)
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf
```nginx
events { worker_connections 1024; }
http {
  include /etc/nginx/mime.types;
  server {
    listen 8080;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback
    location / {
      try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
      expires 1y;
      add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
  }
}
```

## 7. KUBERNETES/KYMA CONFIGURATION

### Struttura k8s/
```
k8s/
├── base/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── apirule.yaml        # Kyma API Gateway
│   └── kustomization.yaml
└── overlays/
    └── production/
        ├── kustomization.yaml
        └── patches/
```

### deployment.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
        sidecar.istio.io/inject: "true"
    spec:
      containers:
        - name: my-app
          image: ghcr.io/org/my-app:latest
          ports:
            - containerPort: 8080
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "200m"
          livenessProbe:
            httpGet:
              path: /
              port: 8080
            initialDelaySeconds: 10
          readinessProbe:
            httpGet:
              path: /
              port: 8080
            initialDelaySeconds: 5
          env:
            - name: VITE_SUPABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: supabase-url
            - name: VITE_SUPABASE_ANON_KEY
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: supabase-anon-key
      imagePullSecrets:
        - name: ghcr-secret
```

### apirule.yaml (Kyma API Gateway)
```yaml
apiVersion: gateway.kyma-project.io/v1beta1
kind: APIRule
metadata:
  name: my-app
spec:
  gateway: kyma-gateway.kyma-system.svc.cluster.local
  host: my-app.{CLUSTER_DOMAIN}
  service:
    name: my-app
    port: 80
  rules:
    - path: /.*
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
      accessStrategies:
        - handler: noop  # o jwt per protezione
```

## 8. SECRETS MANAGEMENT

### GitHub Secrets Richiesti
- `KYMA_KUBECONFIG`: Kubeconfig base64-encoded per accesso cluster
- `KYMA_APP_URL`: URL pubblico dell'app su Kyma
- `VITE_SUPABASE_URL`: URL Supabase (se usato)
- `VITE_SUPABASE_ANON_KEY`: Anon key Supabase (se usato)
- `VITE_IAS_AUTHORITY`: URL SAP IAS tenant
- `VITE_IAS_CLIENT_ID`: Client ID per OIDC

### Kubernetes Secrets
```bash
kubectl create secret generic app-secrets \
  --from-literal=supabase-url=$SUPABASE_URL \
  --from-literal=supabase-anon-key=$SUPABASE_ANON_KEY \
  -n my-app-namespace

kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=$GITHUB_ACTOR \
  --docker-password=$GITHUB_TOKEN \
  -n my-app-namespace
```

## 9. SICUREZZA

### Checklist
- [ ] TypeScript strict mode abilitato
- [ ] ESLint con regole @typescript-eslint
- [ ] Nessun `any` esplicito (o eslint-disable documentato)
- [ ] Validazione input con Zod
- [ ] HTTPS forzato (gestito da Kyma/Istio)
- [ ] Security headers in nginx
- [ ] Secrets in Kubernetes Secrets, mai in codice
- [ ] OIDC con PKCE per autenticazione
- [ ] Row Level Security in Supabase (se usato)
- [ ] Rate limiting a livello di API Gateway

### ESLint Config Minima
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

## 10. PERFORMANCE

### Bundle Optimization
- Manual chunks per vendor libraries
- Tree shaking abilitato di default con Vite
- Target: main chunk < 300KB gzipped

### Runtime
- React.memo per componenti pesanti
- useMemo/useCallback dove necessario
- Lazy loading per route secondarie
- Image optimization (WebP, lazy loading)

## 11. MONITORING (Opzionale)

### Logging
- Console logs strutturati in development
- Integrazione con SAP BTP Application Logging Service in production

### Health Checks
- Liveness probe: verifica che l'app risponda
- Readiness probe: verifica che l'app sia pronta a ricevere traffico

---

## VARIABILI DA SOSTITUIRE

Quando usi questo template, sostituisci:
- `my-app` → nome della tua applicazione
- `my-app-namespace` → namespace Kubernetes
- `{CLUSTER_DOMAIN}` → dominio del cluster Kyma (es. `c-xxxxx.kyma.ondemand.com`)
- `org/my-app` → organizzazione/repository GitHub

## DATABASE: OPZIONI

### Opzione A: Supabase (Consigliato per MVP)
- Veloce da configurare
- PostgreSQL managed con API REST/Realtime
- Row Level Security integrata
- Free tier generoso

### Opzione B: PostgreSQL su SAP BTP
- PostgreSQL Hyperscaler Option
- Binding con Service Manager
- Più enterprise, costi BTP

### Opzione C: PostgreSQL in Docker (Solo Dev)
- docker-compose.yml con postgres:15
- Utile per sviluppo locale
- Non per production

---

## ESEMPIO DI RICHIESTA INIZIALE

"Crea un'applicazione [NOME APP] per [SCOPO].

Tecnologie: React + TypeScript + Vite + Tailwind + Zustand.
Database: [Supabase / PostgreSQL BTP].
Auth: SAP IAS con OIDC.
Deploy: SAP BTP Kyma con GitHub Actions CI/CD.

Segui le best practice del template RAISE App:
- Repository pattern per data access
- Service layer per business logic
- Testing con Vitest (>70% coverage) + Playwright E2E
- Docker multi-stage + nginx
- Kubernetes manifests con Kustomize
- Security headers e validazione Zod

Funzionalità richieste:
1. [Feature 1]
2. [Feature 2]
3. [Feature 3]
"
```

---

## NOTE FINALI

Questo template è basato sull'esperienza con RAISE App che include:
- 640+ unit tests
- 53 E2E tests
- Deploy automatico su Kyma
- Bundle ottimizzato (272KB main chunk)
- 4 servizi con 100% coverage
- Zero security warnings

Ultimo aggiornamento: Gennaio 2026
