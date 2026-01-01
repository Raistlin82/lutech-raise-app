# RAISE App - SAP BTP Kyma Deployment Guide

Guida completa per il deployment dell'applicazione RAISE su SAP Business Technology Platform (BTP) Kyma Runtime.

## 📋 Indice

1. [Overview](#overview)
2. [Architettura](#architettura)
3. [Prerequisiti](#prerequisiti)
4. [Configurazione SAP IAS](#configurazione-sap-ias)
5. [CI/CD con GitHub Actions](#cicd-con-github-actions)
6. [Manifesti Kubernetes](#manifesti-kubernetes)
7. [Security & Hardening](#security--hardening)
8. [Monitoring & Observability](#monitoring--observability)
9. [Troubleshooting](#troubleshooting)
10. [Manutenzione](#manutenzione)

---

## Overview

### Status Deployment

- **✅ Stato:** ATTIVO
- **🌐 URL Produzione:** https://raise-app.b66a502.kyma.ondemand.com
- **🔐 Autenticazione:** SAP Identity Authentication Service (IAS)
- **📦 Namespace:** `raise-app`
- **🚀 CI/CD:** GitHub Actions (deploy automatico)

### Stack Tecnologico

| Componente | Tecnologia | Versione |
|---|---|---|
| **Runtime** | SAP BTP Kyma | Latest |
| **Orchestration** | Kubernetes | 1.28+ |
| **Service Mesh** | Istio | Latest (incluso in Kyma) |
| **Ingress** | Kyma APIRule | v2 |
| **Authentication** | SAP IAS (OIDC) | Production |
| **Container Registry** | GitHub Container Registry | - |
| **CI/CD** | GitHub Actions | - |
| **Web Server** | Nginx | Alpine |
| **Frontend** | React + Vite | 18.3 / 5.4 |

---

## Architettura

```
┌─────────────────────────────────────────────────────────────┐
│                    SAP BTP Kyma Runtime                      │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Istio Ingress Gateway (kyma-system)               │     │
│  │ - TLS Termination                                  │     │
│  │ - Routing (APIRule)                                │     │
│  └─────────────────┬──────────────────────────────────┘     │
│                    │                                          │
│  ┌─────────────────▼──────────────────────────────────┐     │
│  │ Namespace: raise-app                               │     │
│  │                                                     │     │
│  │  ┌──────────────────────────────────────────┐     │     │
│  │  │ Pod: raise-app                           │     │     │
│  │  │ ┌──────────────┐   ┌──────────────────┐ │     │     │
│  │  │ │ raise-app    │   │ istio-proxy     │ │     │     │
│  │  │ │ (nginx:8080) │◄──┤ (sidecar)       │ │     │     │
│  │  │ └──────────────┘   └──────────────────┘ │     │     │
│  │  └──────────────────────────────────────────┘     │     │
│  │                                                     │     │
│  │  📊 ResourceQuota │ 🔒 NetworkPolicy               │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
└───────────────────────┬───────────────────────────────────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
    ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
    │SAP IAS  │   │Supabase │   │ GitHub  │
    │ (Auth)  │   │  (DB)   │   │  (CI)   │
    └─────────┘   └─────────┘   └─────────┘
```

---

## Prerequisiti

### 1. Accessi Richiesti

- [x] **SAP BTP Account** con Kyma Runtime abilitato
- [x] **SAP IAS Tenant** (`https://asojzafbi.accounts.ondemand.com`)
- [x] **GitHub Repository** con secrets configurati
- [x] **Kubeconfig** per accesso al cluster Kyma

### 2. Tool Necessari

```bash
# Kubectl
kubectl version --client

# Docker (per build locali)
docker --version

# Git
git --version
```

### 3. GitHub Secrets Configurati

I seguenti secrets devono essere configurati in GitHub (Settings → Secrets):

| Secret | Descrizione | Esempio |
|---|---|---|
| `VITE_IAS_AUTHORITY` | URL tenant SAP IAS | `https://asojzafbi.accounts.ondemand.com` |
| `VITE_IAS_CLIENT_ID` | Client ID applicazione IAS | `ae93584a-a420-4944-b4de-bfc3bacb8467` |
| `VITE_SUPABASE_URL` | URL istanza Supabase | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Chiave anonima Supabase | `eyJhbGciOi...` |
| `KYMA_KUBECONFIG` | Kubeconfig in base64 | `cat kubeconfig.yaml \| base64` |

---

## Configurazione SAP IAS

### 1. Creazione Applicazione

Vedi la guida completa: [SAP_IAS_CONFIG.md](./SAP_IAS_CONFIG.md)

**Configurazione Corrente:**

| Parametro | Valore |
|---|---|
| **Application Name** | RAISE App Kyma |
| **Protocol** | OpenID Connect |
| **Client ID** | `ae93584a-a420-4944-b4de-bfc3bacb8467` |
| **Client Authentication** | Public Client (No Secret) |

### 2. Redirect URIs

```
https://raise-app.b66a502.kyma.ondemand.com/
https://raise-app.b66a502.kyma.ondemand.com
http://localhost:5173/
http://localhost:5173
```

### 3. Post-Logout Redirect URIs

```
https://raise-app.b66a502.kyma.ondemand.com/
http://localhost:5173/
```

### 4. Trusted Domains (CORS)

```
https://raise-app.b66a502.kyma.ondemand.com
http://localhost:5173
```

---

## CI/CD con GitHub Actions

### Workflow: `.github/workflows/deploy-kyma.yml`

**Trigger:**
- Push su branch `main` o `raise-btp-ias-auth`
- Workflow manuale (workflow_dispatch)

**Steps:**

1. **Test** → Esegue suite test completa (Vitest)
2. **Build & Push** → Build Docker image e push su GHCR
3. **Deploy Kyma** → Applica manifesti Kubernetes via `kubectl`

### Build Docker Image

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app

# Build arguments (iniettati da GitHub Actions)
ARG VITE_IAS_AUTHORITY
ARG VITE_IAS_CLIENT_ID
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Build application (env vars baked into bundle)
RUN npm ci && npm run build

# Production image
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
```

**Nota:** Le variabili d'ambiente Vite sono **baked al build time** nel bundle JavaScript, non iniettate a runtime.

---

## Manifesti Kubernetes

### Struttura `k8s/`

```
k8s/
├── namespace.yaml          # Namespace con Istio injection
├── deployment.yaml         # Pod con security context
├── service.yaml            # ClusterIP service (80 → 8080)
├── apirule.yaml            # Istio ingress rule
├── resource-quota.yaml     # Limiti risorse namespace
└── network-policy.yaml     # Isolamento rete
```

### Deployment con Kustomize

```bash
# Apply all manifests
kubectl apply -k k8s/

# Verify deployment
kubectl get all -n raise-app
kubectl get apirule -n raise-app
```

### Resource Limits

| Risorsa | Request | Limit |
|---|---|---|
| **CPU** | 50m | 200m |
| **Memory** | 64Mi | 128Mi |
| **Replicas** | 1 | - |

### Namespace Quotas

| Quota | Valore |
|---|---|
| **Max CPU Request** | 2 cores |
| **Max Memory Request** | 4Gi |
| **Max Pods** | 10 |
| **Max Services** | 5 |

---

## Security & Hardening

### 1. Content Security Policy (CSP)

Configurato in `nginx.conf`:

```nginx
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://asojzafbi.accounts.ondemand.com https://*.supabase.co;
  frame-ancestors 'self';
" always;
```

### 2. Network Policy

Limita traffico in ingresso/uscita:

- **Ingress:** Solo da Istio Ingress Gateway
- **Egress:** DNS (53), HTTPS (443) per servizi esterni

### 3. Pod Security

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1001
  allowPrivilegeEscalation: false
  capabilities:
    drop:
      - ALL
```

### 4. OIDC Configuration

```typescript
// Explicit OIDC config in main.tsx
{
  response_type: 'code',              // PKCE
  scope: 'openid profile email',
  automaticSilentRenew: true,         // Auto token refresh
  monitorSession: true,
  loadUserInfo: true
}
```

---

## Monitoring & Observability

### 1. Prometheus Annotations

```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "8080"
  prometheus.io/path: "/health"
```

### 2. Health Checks

- **Liveness Probe:** `GET /health` ogni 30s
- **Readiness Probe:** `GET /ready` ogni 10s

### 3. Logs

```bash
# Application logs
kubectl logs -n raise-app deployment/raise-app -c raise-app

# Istio sidecar logs
kubectl logs -n raise-app deployment/raise-app -c istio-proxy

# Follow logs
kubectl logs -n raise-app deployment/raise-app -c raise-app -f
```

### 4. Kyma Dashboard

- **Grafana:** Metrics visualization
- **Jaeger:** Distributed tracing
- **Kiali:** Service mesh topology

---

## Troubleshooting

### Problema: Pod in CrashLoopBackOff

```bash
# Check pod status
kubectl describe pod -n raise-app <pod-name>

# Check logs
kubectl logs -n raise-app <pod-name> -c raise-app
```

**Cause comuni:**
- Missing environment variables (verificare build args)
- Port binding error (verificare port 8080)
- Filesystem permissions (verificare runAsUser)

---

### Problema: APIRule non raggiungibile (404)

```bash
# Check APIRule status
kubectl get apirule -n raise-app -o yaml

# Check Istio ingress
kubectl get gateway -n kyma-system
```

**Verifiche:**
1. APIRule status = `Ready`
2. Service selector corrisponde ai pod labels
3. Service port mapping: 80 → 8080

---

### Problema: Login SAP IAS fallisce

**Verifiche:**

1. **Browser DevTools → Network:**
   - Chiamata `/authorize`: verifica `redirect_uri` esatto
   - Chiamata `/token`: verifica CORS errors

2. **SAP IAS Console:**
   - Redirect URIs contengono Kyma URL
   - Post-Logout URIs configurati
   - Trusted Domains include Kyma domain
   - Public Client Flow abilitato

3. **Application Logs:**
   ```bash
   kubectl logs -n raise-app deployment/raise-app | grep -i "auth\|oidc\|error"
   ```

---

### Problema: CORS Errors

**Sintomo:** Browser console mostra `blocked by CORS policy`

**Fix:**
1. Aggiungi Kyma URL ai **Trusted Domains** su SAP IAS
2. Verifica CSP header in `nginx.conf` include SAP IAS authority

---

## Manutenzione

### Rolling Update

Il deployment avviene automaticamente via GitHub Actions. Per forzare update:

```bash
# Trigger rebuild (push dummy commit)
git commit --allow-empty -m "chore: trigger redeploy"
git push

# Oppure workflow manuale su GitHub
```

### Rollback

```bash
# Check deployment history
kubectl rollout history deployment/raise-app -n raise-app

# Rollback to previous
kubectl rollout undo deployment/raise-app -n raise-app

# Rollback to specific revision
kubectl rollout undo deployment/raise-app -n raise-app --to-revision=2
```

### Scaling

```bash
# Scale replicas
kubectl scale deployment/raise-app -n raise-app --replicas=3

# Oppure aggiorna deployment.yaml
spec:
  replicas: 3
```

### Resource Monitoring

```bash
# Pod resource usage
kubectl top pod -n raise-app

# Namespace resource usage
kubectl describe resourcequota -n raise-app
```

### Log Rotation

I log Kubernetes sono gestiti automaticamente dal cluster. Per persistenza estesa, configurare:
- **Loki** (log aggregation)
- **Elasticsearch** (log storage)

---

## Checklist Pre-Deploy

Prima di ogni deploy manuale, verificare:

- [ ] Tests passing (`npm test`)
- [ ] Build locale ok (`npm run build`)
- [ ] Secrets GitHub aggiornati
- [ ] SAP IAS redirect URIs corretti
- [ ] Kubeconfig valido
- [ ] Namespace quotas rispettate

---

## Comandi Utili

```bash
# Status completo namespace
kubectl get all -n raise-app

# Describe pod per debugging
kubectl describe pod -n raise-app <pod-name>

# Port forward per test locale
kubectl port-forward -n raise-app svc/raise-app 8080:80

# Execute shell in pod
kubectl exec -it -n raise-app deployment/raise-app -c raise-app -- /bin/sh

# Check Istio sidecar injection
kubectl get pod -n raise-app -o jsonpath='{.items[0].spec.containers[*].name}'

# Delete and recreate namespace (⚠️ DANGER)
kubectl delete namespace raise-app
kubectl apply -k k8s/
```

---

## Riferimenti

- [SAP IAS Configuration Guide](./SAP_IAS_CONFIG.md)
- [Production Checklist](./PRODUCTION_CHECKLIST.md)
- [Kyma Documentation](https://kyma-project.io/docs/)
- [SAP BTP Kyma Runtime](https://help.sap.com/docs/btp/sap-business-technology-platform/kyma-environment)
- [Istio Documentation](https://istio.io/latest/docs/)

---

**Last Updated:** 2026-01-01
**Version:** 1.3.0
**Status:** ✅ Production Ready
