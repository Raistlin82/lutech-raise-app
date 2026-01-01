# RAISE App - Sales Opportunity Management System

<div align="center">

![RAISE Banner](https://img.shields.io/badge/RAISE-Compliance-0ea5e9?style=for-the-badge&logo=react&logoColor=white)
[![Live Demo](https://img.shields.io/badge/Live-Demo-22c55e?style=for-the-badge&logo=github&logoColor=white)](https://raistlin82.github.io/lutech-raise-app/)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Raistlin82/lutech-raise-app/deploy.yml?style=for-the-badge)](https://github.com/Raistlin82/lutech-raise-app/actions)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**RAISE** (Risk Assessment & Internal Sales Enablement) è un ecosistema enterprise progettato per la governance avanzata del ciclo di vita delle opportunità di vendita.

[Demo Live](https://raistlin82.github.io/lutech-raise-app/) • [Indice Documentazione](docs/DOCUMENTATION.md) • [Guida Utente](docs/USER_GUIDE.md)

</div>

---

## 📖 Indice Strutturato

- [✨ Overview & Valore Business](#-overview--valore-business)
- [🛠 Stack Tecnologico](#-stack-technologico)
- [🏗 Architettura & Design](#-architettura--design)
- [🚀 Quick Start & Deployment](#-quick-start--deployment)
- [🧪 Quality & Test Excellence](#-quality--test-excellence)
- [👥 Team & Governance](#-team--governance)

---

## ✨ Overview & Valore Business

RAISE digitalizza il processo decisionale commerciale attraverso un workflow strutturato che garantisce compliance e trasparenza.

### Core Business Pillars
- **Governance Dinamica:** Calcolo automatico del livello di autorizzazione (L1-L6) basato su matrici di rischio PSQ-003.
- **Workflow Sequenziale:** Gestione fasi ATP (Proceed), ATS (Sign) e ATC (Commit) con checkpoint condizionali.
- **Relational Customer Core:** Sistema centralizzato di gestione clienti con integrazione nativa sulle opportunità.
- **Global Ready:** Architettura i18n modulare con interfaccia completa in lingua italiana.

### Performance & UX
- **Performance:** Caricamento istantaneo con bundle ottimizzato (~130KB gzipped).
- **UX Premium:** Feedback in tempo reale, skeleton screens e sistema di notifiche Toast.
- **Security:** Autenticazione Enterprise-ready tramite SAP IAS (OIDC + PKCE).

---

## 🛠 Stack Tecnologico

L'applicazione segue lo stato dell'arte dello sviluppo frontend moderno:

| Layer | Tecnologia |
| :--- | :--- |
| **Framework** | React 19 + TypeScript 5.6 |
| **Build Tool** | Vite 7.3 (Ultra-fast HMR) |
| **State** | Zustand (Modular Store architecture) |
| **Routing** | React Router v7 |
| **Validation** | Zod (Runtime type-safety) |
| **Styling** | Tailwind CSS + Lucide Icons |

---

## 🏗 Architettura & Design

Per un'analisi dettagliata del design di sistema, dei modelli dati e della logica di business, consultare la documentazione dedicata:

👉 **[SYSTEM_DESIGN.md](docs/SYSTEM_DESIGN.md)**

### Struttura Progetto
```text
src/
├── components/   # UI & Process Components
├── stores/       # State Management (Zustand)
├── lib/          # Business Logic (RAISE engine)
├── i18n/         # Multi-namespace translation files
└── __tests__/    # Vitest & RTL Test suites
```

---

## 🚀 Quick Start & Deployment

### Setup Locale
```bash
# Clone e Installazione
git clone https://github.com/Raistlin82/lutech-raise-app.git
cd lutech-raise-app
npm install

# Start Development Server
npm run dev
```

### Strategie di Deployment
Il sistema è predisposto per diverse topologie di rilascio, come dettagliato nelle guide operative:
- [**Quick Deploy Guide**](docs/QUICK_DEPLOY.md)
- [**Kyma & K8s Deployment**](docs/KYMA_DEPLOYMENT.md)
- [**Production Checklist**](docs/PRODUCTION_CHECKLIST.md)

---

## 🧪 Quality & Test Excellence

Garantiamo l'integrità del sistema con una copertura test totale e automatizzata.

- **Unit/Integration:** 339 test eseguiti con Vitest + React Testing Library.
- **End-to-End:** Suite completa con Playwright (workflow completi, navigazione, regressioni).
- **Cross-Browser:** Test automatici su Chrome, Firefox, Safari (Desktop + Mobile).
- **CI/CD:** Pipeline automatizzata su GitHub Actions per ogni PR/Push con JUnit reporting.

```bash
# Esecuzione Test Suite
npm test                  # Unit & Integration
npm run test:e2e          # End-to-End (Headless)
npx playwright test --ui  # E2E Interactive Mode
```

Consulta la guida completa: **[TESTING_GUIDE.md](docs/TESTING_GUIDE.md)** per dettagli su strategia, copertura e best practices.

---

## 🎯 Roadmap Strategica

### Completato ✅
- [x] Motore di calcolo RAISE v17 (PSQ-003)
- [x] Integrazione SAP IAS (OIDC Authentication)
- [x] Sistema di gestione Clienti relazionale
- [x] Localizzazione completa (i18n Namespace architecture)
- [x] Fix Handover completion workflow (2026-01-01)
- [x] Infrastruttura E2E Testing completa con Playwright
- [x] CI/CD pipeline con test multi-browser automatici

### In Sviluppo 🚧
- [ ] Reporting Avanzato & Business Intelligence
- [ ] Integrazione Documentale diretta (SharePoint API)
- [ ] Notifiche Push & Email Automation
- [ ] Visual Regression Testing (Percy/Chromatic)

---

## 👥 Team & Governance

Sviluppato con eccellenza da **Lutech Professional Services**.

- **Author:** Gabriele Rendina
- **Governance:** PSQ-003 Compliance
- **License:** MIT

---

<div align="center">

**[⬆ Torna all'Indice](#raise-app---sales-opportunity-management-system)**

Made with ❤️ by Lutech Team

</div>
