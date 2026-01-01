# Quick Start & Deployment Guide

---
**Speed & Automation**
- **Hosting:** GitHub Pages
- **Automation:** GitHub Actions
- **Time to Live:** < 5 Minutes
---

## 1. Panoramica

### Opzione 1: Vercel (Raccomandato) ⚡

**Più semplice e veloce - HTTPS automatico, deploy automatici da Git**

#### Via Web UI (Click & Deploy)
1. Vai su [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Importa il repository Git
4. Vercel rileva automaticamente Vite
5. Click "Deploy"
6. ✅ Done! App live in ~2 minuti

#### Via CLI
```bash
# Installa Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy production
vercel --prod
```

**URL produzione:** `https://raise-app.vercel.app` (o dominio custom)

---

### Opzione 2: Netlify 🌐

**Ottimo per progetti open source, drag & drop UI**

#### Via Web UI
1. Vai su [netlify.com](https://netlify.com)
2. "Add new site" → "Import from Git"
3. Seleziona repository
4. Build settings (auto-rilevati da netlify.toml):
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click "Deploy"
6. ✅ Done!

#### Via CLI
```bash
# Installa Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy

# Deploy production
netlify deploy --prod
```

---

### Opzione 3: GitHub Pages (Gratuito) 📄

**Perfetto se il codice è già su GitHub**

1. **Crea file:** `.github/workflows/deploy.yml`

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

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

2. **Modifica `vite.config.ts`:**
```typescript
base: '/raise-app/', // Nome del tuo repository
```

3. **Push su GitHub:**
```bash
git add .
git commit -m "Add GitHub Pages deployment"
git push origin main
```

4. **Abilita GitHub Pages:**
   - Vai su Settings → Pages
   - Source: "gh-pages" branch
   - ✅ Done!

**URL:** `https://username.github.io/raise-app/`

---

## 🔧 Pre-Deploy Checklist (5 minuti)

### 1. Verifica Build Locale
```bash
npm run build
npm run preview
```
Apri http://localhost:4173 e testa:
- ✅ Dashboard carica
- ✅ Crea opportunità funziona
- ✅ Workflow ATP mostra checkpoint
- ✅ Settings page OK

### 2. Fix Eventuali Errori
```bash
# Se build fallisce
npm install
npm run build
```

### 3. Test Cross-Browser (Opzionale)
- Chrome ✅
- Firefox ✅
- Safari ✅

---

## ⚙️ Configurazione Produzione (Opzionale)

### Environment Variables (se necessario)
```bash
# Crea file .env.production
cp .env.example .env.production

# Modifica variabili
nano .env.production
```

Su Vercel/Netlify, aggiungi variabili via dashboard:
- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Build & Deploy → Environment

---

## 🎯 Dopo il Deploy

### 1. Verifica App Live
```bash
# Il servizio ti darà l'URL, esempio:
# https://raise-app.vercel.app
# https://raise-app.netlify.app
# https://username.github.io/raise-app
```

### 2. Test Produzione
- [ ] Apri URL produzione
- [ ] Testa navigazione (Dashboard → New → Workflow → Settings)
- [ ] Verifica HTTPS (lucchetto verde)
- [ ] Test su mobile

### 3. Configura Dominio Custom (Opzionale)
**Vercel:**
1. Domains → Add
2. Inserisci dominio (es. raise.tuodominio.com)
3. Segui istruzioni DNS

**Netlify:**
1. Domain settings → Add custom domain
2. Segui istruzioni DNS

---

## 🚨 Troubleshooting

### "404 Not Found" quando refresh pagina
**Fix:** Configura SPA routing

**Vercel:** ✅ Già configurato in `vercel.json`
**Netlify:** ✅ Già configurato in `netlify.toml`
**GitHub Pages:** Aggiungi `404.html` uguale a `index.html`

### "Failed to load module"
**Fix:** Verifica `base` in `vite.config.ts`
```typescript
// Se app in sottocartella
base: '/raise-app/'

// Se app in root domain
base: '/'
```

### Build fails con "out of memory"
**Fix:** Aumenta memoria Node.js
```json
// package.json
"scripts": {
  "build": "NODE_OPTIONS=--max-old-space-size=4096 vite build"
}
```

---

## 📊 Performance Check

Dopo il deploy, testa performance:

### Lighthouse Audit
1. Apri DevTools (F12)
2. Tab "Lighthouse"
3. Click "Analyze page load"
4. **Target:** >90 su tutti i punteggi

### WebPageTest
1. Vai su [webpagetest.org](https://webpagetest.org)
2. Inserisci URL produzione
3. Run test
4. **Target:** Load time < 3s

---

## 🎉 Congratulazioni!

La tua RAISE App è ora live in produzione! 🚀

**Prossimi passi (opzionali):**
- [ ] Configura monitoring (Sentry)
- [ ] Aggiungi analytics
- [ ] Configura dominio custom
- [ ] Abilita preview deployments per branch

---

## 📞 Supporto

**Documentazione:**
- [Vite Production Guide](https://vitejs.dev/guide/build.html)
- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com)

**Problemi?** Controlla la [Production Checklist](./PRODUCTION_CHECKLIST.md) completa
