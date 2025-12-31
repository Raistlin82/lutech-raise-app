# RAISE App - Production Deployment Checklist

## 📋 Checklist Pre-Produzione

### ✅ Completato
- [x] Test automatici (100% passing)
- [x] Build production senza errori TypeScript
- [x] Tutte le funzionalità core operative
- [x] Form validation implementata
- [x] ATP Checklist bug risolto
- [x] Settings page con RAISE Levels
- [x] Integrazione SAP IAS (Auth Enterprise)

### 🔧 Da Completare per Produzione

## 1. ⚙️ Configurazione Ambiente

### 1.1 Variabili d'Ambiente
**File da creare:** `.env.production`

```env
# Production Configuration
VITE_APP_ENV=production
VITE_APP_NAME=RAISE App
VITE_APP_VERSION=1.3.0

# SAP IAS Configuration (Mandatory for Kyma)
VITE_IAS_AUTHORITY=https://your-tenant.accounts.ondemand.com
VITE_IAS_CLIENT_ID=your-client-id
VITE_BASE_PATH=/

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
```

### 1.2 Configurazione Base URL
**File:** `vite.config.ts`

Se l'app sarà in una sottocartella:
```typescript
export default defineConfig({
  base: '/raise-app/', // o '/' se in root
  // ... resto configurazione
});
```

---

## 2. 🔒 Sicurezza

### 2.1 Content Security Policy
**File:** `index.html`

Aggiungere nel `<head>`:
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' 'unsafe-inline';
               style-src 'self' 'unsafe-inline';
               img-src 'self' data: https:;">
```

### 2.2 Rimuovere Console Logs
Già configurato in `vite.config.ts`:
```typescript
build: {
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true, // ✅ Rimuove console.log in produzione
    }
  }
}
```

### 2.3 HTTPS
- [ ] Configurare certificato SSL (Let's Encrypt gratuito)
- [ ] Force HTTPS redirect
- [ ] HSTS headers

---

## 3. 📊 Monitoring & Error Tracking

### 3.1 Sentry (Consigliato)
**Installazione:**
```bash
npm install @sentry/react @sentry/vite-plugin
```

**Configurazione:** `src/main.tsx`
```typescript
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: "YOUR_SENTRY_DSN",
    environment: "production",
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay(),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
```

### 3.2 Analytics (Opzionale)
- Google Analytics
- Plausible (privacy-friendly)
- Umami (self-hosted)

---

## 4. 🚀 Build & Deployment

### 4.1 Build Production
```bash
# Pulisci build precedenti
rm -rf dist

# Build production
npm run build

# Preview build locale
npm run preview
```

### 4.2 Verifica Build
```bash
# Controlla dimensioni bundle
ls -lh dist/assets/

# Verifica compressione gzip
gzip -9 < dist/assets/index-*.js | wc -c
```

**Target:** < 200 KB gzipped per bundle principale ✅ (attualmente 69 KB)

---

## 5. 🌐 Hosting Options

### Opzione A: SAP BTP Kyma (Raccomandato per Lutech)
**Vantaggi:** Enterprise standard, integrazione nativa IAS, scalabilità Kubernetes.

**Setup:**
1. Configura SAP IAS (vedi [SAP_IAS_CONFIG.md](./SAP_IAS_CONFIG.md))
2. Build Docker image usando il `Dockerfile` in root
3. Applica i manifesti in `k8s/`
4. Configura APIRule per l'ingress

---

### Opzione B: Vercel (Alternativa Cloud)
**Vantaggi:** Deploy automatico, HTTPS gratuito, CDN globale, zero-config

**Setup:**
```bash
# Installa Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy production
vercel --prod
```

**File configurazione:** `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

### Opzione B: Netlify (Gratuito)
**Setup via UI:**
1. Vai su netlify.com
2. Connect to Git (GitHub/GitLab)
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

**File configurazione:** `netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### Opzione C: GitHub Pages (Gratuito)
**Setup:**
1. Crea file `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

2. Configura `vite.config.ts`:
```typescript
base: '/raise-app/', // Nome del repository
```

---

### Opzione D: Docker + Cloud (AWS/Azure/GCP)
**Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf:**
```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  gzip on;
  gzip_types text/css application/javascript application/json;
}
```

---

## 6. 🧪 Test Pre-Deploy

### 6.1 Test Build Locale
```bash
# Build
npm run build

# Serve localmente
npm run preview

# Testa su http://localhost:4173
```

### 6.2 Checklist Funzionalità
- [ ] Dashboard carica correttamente
- [ ] Crea nuova opportunità con validazione
- [ ] Modifica opportunità esistente
- [ ] Workflow ATP mostra checkpoint corretti
- [ ] Settings mostra RAISE Levels
- [ ] Navigation funziona (no 404 on refresh)

### 6.3 Browser Testing
- [ ] Chrome/Edge (ultimi 2 versioni)
- [ ] Firefox (ultimi 2 versioni)
- [ ] Safari (ultimi 2 versioni)
- [ ] Mobile (iOS Safari, Chrome Android)

---

## 7. 📝 Documentazione

### 7.1 README.md Production
```markdown
# RAISE App - Production

## Quick Start
\`\`\`bash
npm install
npm run build
npm run preview
\`\`\`

## Environment Variables
Copy `.env.example` to `.env.production` and configure.

## Deployment
See [DEPLOYMENT.md](./docs/DEPLOYMENT.md)
```

### 7.2 Changelog
Creare `CHANGELOG.md` con versioni e modifiche

---

## 8. 🔍 Performance Optimization

### 8.1 Verificare Bundle Analyzer
```bash
npm install --save-dev rollup-plugin-visualizer
```

**vite.config.ts:**
```typescript
import { visualizer } from 'rollup-plugin-visualizer';

plugins: [
  visualizer({ open: true })
]
```

### 8.2 Lazy Loading Routes ✅
Già implementato in `App.tsx`

### 8.3 Image Optimization
- [ ] Comprimere immagini (TinyPNG, Squoosh)
- [ ] Usare formati moderni (WebP, AVIF)
- [ ] Lazy load immagini fuori viewport

---

## 9. 🎯 Post-Deploy

### 9.1 Monitoring
- [ ] Configura uptime monitoring (UptimeRobot, Pingdom)
- [ ] Verifica Sentry riceve errori
- [ ] Controlla analytics setup

### 9.2 Performance
- [ ] Lighthouse audit (target: >90 su tutti i punteggi)
- [ ] WebPageTest
- [ ] Core Web Vitals

### 9.3 SEO (se pubblico)
- [ ] Meta tags (title, description)
- [ ] Open Graph tags
- [ ] Favicon completo (tutti i formati)
- [ ] robots.txt
- [ ] sitemap.xml

---

## 10. 🚨 Rollback Plan

### 10.1 Backup
- [ ] Git tag per ogni release: `git tag v1.0.0`
- [ ] Backup database (se applicabile)
- [ ] Backup configurazioni

### 10.2 Rollback Procedure
```bash
# Vercel
vercel rollback

# Netlify
netlify rollback

# Manual
git revert <commit>
git push
```

---

## ✅ Checklist Finale Pre-Deploy

**Obbligatori:**
- [ ] Build production senza errori
- [ ] Test suite passa (>90%)
- [ ] File .env.production configurato
- [ ] Hosting selezionato e configurato
- [ ] HTTPS abilitato
- [ ] SPA routing configurato (redirect a index.html)
- [ ] Test manuale build in preview

**Raccomandati:**
- [ ] Error tracking (Sentry) configurato
- [ ] Performance audit (Lighthouse)
- [ ] Browser testing cross-platform
- [ ] Documentation aggiornata

**Opzionali:**
- [ ] Analytics configurato
- [ ] Monitoring uptime
- [ ] SEO optimization
- [ ] CDN configuration

---

## 🎉 Deploy!

Quando tutto è ✅, sei pronto per il deploy:

```bash
# Vercel
vercel --prod

# O Netlify
netlify deploy --prod

# O GitHub Pages
git push origin main
```

---

## 📞 Support

**Problemi comuni:**
1. **404 on refresh:** Configura SPA routing (vedi hosting options)
2. **Assets non caricano:** Verifica `base` in vite.config.ts
3. **CORS errors:** Configura headers CORS sul backend
4. **Build fails:** Verifica Node.js version (usa 18+)

**Risorse:**
- [Vite Production Guide](https://vitejs.dev/guide/build.html)
- [React Deployment](https://react.dev/learn/start-a-new-react-project#deploying-to-production)
- [Vercel Docs](https://vercel.com/docs)
