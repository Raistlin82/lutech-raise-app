# Internationalization (i18n) System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement react-i18next system to externalize all hardcoded strings into translation files organized by feature.

**Architecture:** Install react-i18next, create feature-based translation files (common, dashboard, opportunities, workflow, settings, customers), configure TypeScript types for type-safe translation keys, migrate components incrementally using useTranslation hook.

**Tech Stack:** react-i18next, i18next, TypeScript

---

## Task 1: Install Dependencies and Setup Structure

**Files:**
- Modify: `package.json`
- Create: `src/i18n/config.ts`
- Create: `src/i18n/types.ts`
- Create: `src/i18n/locales/it/common.json`
- Create: `src/i18n/locales/it/dashboard.json`
- Create: `src/i18n/locales/it/opportunities.json`
- Create: `src/i18n/locales/it/workflow.json`
- Create: `src/i18n/locales/it/settings.json`
- Create: `src/i18n/locales/it/customers.json`

**Step 1: Install dependencies**

Run:
```bash
npm install react-i18next i18next
```

Expected: Dependencies added to package.json

**Step 2: Create directory structure**

Run:
```bash
mkdir -p src/i18n/locales/it
```

**Step 3: Create empty translation files**

Create `src/i18n/locales/it/common.json`:
```json
{
  "button": {
    "save": "Salva",
    "cancel": "Annulla",
    "create": "Crea",
    "edit": "Modifica",
    "delete": "Elimina",
    "back": "Indietro",
    "confirm": "Conferma",
    "close": "Chiudi"
  },
  "label": {
    "required": "Obbligatorio",
    "optional": "Opzionale"
  },
  "error": {
    "required": "Campo obbligatorio",
    "generic": "Si è verificato un errore"
  },
  "message": {
    "loading": "Caricamento...",
    "noData": "Nessun dato disponibile",
    "saveSuccess": "Salvato con successo",
    "deleteSuccess": "Eliminato con successo"
  }
}
```

Create `src/i18n/locales/it/dashboard.json`:
```json
{
  "title": "Dashboard RAISE",
  "subtitle": "Gestione Workflow Opportunità",
  "stats": {
    "totalOpportunities": "Opportunità Totali",
    "activeWorkflows": "Workflow Attivi",
    "completedPhases": "Fasi Completate"
  },
  "quickActions": {
    "title": "Azioni Rapide",
    "newOpportunity": "Nuova Opportunità",
    "viewAll": "Visualizza Tutte"
  },
  "recentOpportunities": {
    "title": "Opportunità Recenti",
    "empty": "Nessuna opportunità recente",
    "viewDetails": "Visualizza Dettagli"
  }
}
```

Create `src/i18n/locales/it/opportunities.json`:
```json
{
  "list": {
    "title": "Opportunità",
    "subtitle": "Gestisci le opportunità RAISE",
    "searchPlaceholder": "Cerca opportunità...",
    "filterAll": "Tutte",
    "filterActive": "Attive",
    "filterCompleted": "Completate",
    "empty": "Nessuna opportunità trovata",
    "createFirst": "Crea la tua prima opportunità"
  },
  "new": {
    "title": "New Opportunity",
    "subtitle": "Create a new RAISE workflow opportunity",
    "sectionBasicInfo": "Basic Information",
    "sectionFinancialDetails": "Financial Details",
    "sectionFlags": "Opportunity Flags"
  },
  "edit": {
    "title": "Modifica Opportunità",
    "subtitle": "Aggiorna i dettagli dell'opportunità {{id}}"
  },
  "form": {
    "labelTitle": "Titolo Opportunità",
    "placeholderTitle": "es. Cloud Migration Project",
    "labelCustomer": "Cliente",
    "placeholderCustomer": "Select Customer...",
    "labelTcv": "TCV (€)",
    "placeholderTcv": "1000000",
    "labelRaiseTcv": "RAISE TCV (€)",
    "placeholderRaiseTcv": "Same as TCV if empty",
    "labelMargin": "Margine (%)",
    "placeholderMargin": "25",
    "labelPhase": "Fase Corrente",
    "flagRti": "RTI (Joint Venture)",
    "flagMandataria": "Mandataria",
    "flagKcp": "KCP Deviations",
    "flagCashFlow": "Cash Flow Neutral",
    "flagNewCustomer": "New Customer",
    "quickAddCustomer": "Quick Add Customer"
  },
  "validation": {
    "titleRequired": "Il titolo è obbligatorio",
    "titleMinLength": "Il titolo deve essere almeno 3 caratteri",
    "customerRequired": "Seleziona un cliente",
    "tcvRequired": "Il TCV è obbligatorio",
    "tcvPositive": "Il TCV deve essere positivo",
    "raiseTcvGreaterThanTcv": "RAISE TCV deve essere >= TCV"
  },
  "actions": {
    "create": "Create Opportunity",
    "save": "Salva Modifiche",
    "cancel": "Annulla",
    "delete": "Elimina Opportunità",
    "deleteConfirm": "Sei sicuro di voler eliminare questa opportunità?"
  },
  "raiseLevel": {
    "label": "Livello RAISE",
    "l1": "L1 - Firma < €250k",
    "l2": "L2 - Firma €250k-€1M",
    "l3": "L3 - Firma €1M-€3M",
    "l4": "L4 - Firma €3M-€10M",
    "l5": "L5 - Firma €10M-€25M",
    "l6": "L6 - Firma > €25M"
  }
}
```

Create `src/i18n/locales/it/workflow.json`:
```json
{
  "title": "Workflow RAISE",
  "phases": {
    "planning": "Planning",
    "atp": "ATP",
    "ats": "ATS",
    "atc": "ATC",
    "handover": "Handover"
  },
  "checkpoints": {
    "title": "Checkpoint",
    "mandatory": "Obbligatorio",
    "optional": "Opzionale",
    "completed": "Completato",
    "pending": "In Attesa",
    "showDetails": "Visualizza dettagli"
  },
  "actions": {
    "completePhase": "Completa Fase",
    "nextPhase": "Fase Successiva",
    "previousPhase": "Fase Precedente",
    "viewPhase": "Visualizza Fase"
  },
  "completion": {
    "title": "Completa Fase {{phase}}",
    "confirmMessage": "Sei sicuro di voler completare questa fase?",
    "mandatoryWarning": "Tutti i checkpoint obbligatori devono essere completati",
    "success": "Fase completata con successo"
  },
  "outcome": {
    "title": "Esito Opportunità",
    "selectOutcome": "Seleziona esito",
    "won": "Vinta",
    "lost": "Persa",
    "confirmWon": "Conferma Vittoria",
    "confirmLost": "Conferma Perdita"
  },
  "details": {
    "description": "Descrizione",
    "instructions": "Istruzioni",
    "folderPath": "Percorso SharePoint",
    "folderPathDescription": "Salva il documento in questa cartella su SharePoint",
    "templates": "Template Disponibili",
    "downloadTemplate": "Scarica Template"
  }
}
```

Create `src/i18n/locales/it/settings.json`:
```json
{
  "title": "Impostazioni",
  "subtitle": "Gestisci controlli e configurazioni workflow",
  "tabs": {
    "controls": "Controlli",
    "general": "Generali"
  },
  "controls": {
    "tableHeaders": {
      "label": "Controllo",
      "phase": "Fase",
      "mandatory": "Obbligatorio",
      "actions": "Azioni"
    },
    "filterPlaceholder": "Filtra controlli...",
    "addControl": "Aggiungi Controllo",
    "resetDefaults": "Ripristina Default",
    "resetConfirm": "Ripristinare le impostazioni di default?",
    "mandatory": "SI",
    "optional": "NO"
  },
  "form": {
    "title": "Dettagli Controllo",
    "labelName": "Nome Controllo",
    "placeholderName": "es. Opportunity Site Created",
    "labelDescription": "Descrizione Breve",
    "placeholderDescription": "Descrizione visualizzata nella card",
    "labelDetailedDescription": "Istruzioni Dettagliate",
    "placeholderDetailedDescription": "Istruzioni operative dettagliate",
    "labelFolderPath": "Percorso Cartella SharePoint",
    "placeholderFolderPath": "es. /SharePoint/Documents/ATP/ o /RAISE/ATS/MOD-001/",
    "folderPathHelp": "Dove salvare il documento in SharePoint",
    "labelTemplates": "Link ai Template",
    "templateUrl": "URL Template",
    "templateLabel": "Nome Template",
    "addTemplate": "Aggiungi Template",
    "removeTemplate": "Rimuovi",
    "labelPhase": "Fase",
    "labelMandatory": "Obbligatorio",
    "labelActionType": "Tipo Azione"
  },
  "actions": {
    "save": "Salva Controllo",
    "cancel": "Annulla",
    "edit": "Modifica",
    "delete": "Elimina",
    "deleteConfirm": "Eliminare questo controllo?"
  }
}
```

Create `src/i18n/locales/it/customers.json`:
```json
{
  "title": "Clienti",
  "subtitle": "Gestisci i clienti",
  "list": {
    "searchPlaceholder": "Cerca clienti...",
    "empty": "Nessun cliente trovato",
    "addFirst": "Aggiungi il tuo primo cliente"
  },
  "form": {
    "titleAdd": "Add Customer",
    "titleEdit": "Edit Customer",
    "labelName": "Customer Name",
    "placeholderName": "Acme Corporation",
    "labelIndustry": "Industry",
    "labelPublicSector": "Public Sector"
  },
  "validation": {
    "nameRequired": "Customer name is required",
    "nameMinLength": "Name must be at least 2 characters",
    "nameMaxLength": "Name must be less than 200 characters"
  },
  "actions": {
    "add": "Add Customer",
    "save": "Save Changes",
    "cancel": "Annulla",
    "delete": "Elimina",
    "deleteConfirm": "Eliminare questo cliente?"
  },
  "industries": {
    "technology": "Technology",
    "manufacturing": "Manufacturing",
    "finance": "Finance",
    "healthcare": "Healthcare",
    "retail": "Retail",
    "energy": "Energy",
    "transportation": "Transportation",
    "publicAdministration": "Public Administration",
    "telecommunications": "Telecommunications",
    "consulting": "Consulting"
  }
}
```

**Step 4: Create i18n configuration**

Create `src/i18n/config.ts`:
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import commonIT from './locales/it/common.json';
import dashboardIT from './locales/it/dashboard.json';
import opportunitiesIT from './locales/it/opportunities.json';
import workflowIT from './locales/it/workflow.json';
import settingsIT from './locales/it/settings.json';
import customersIT from './locales/it/customers.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      it: {
        common: commonIT,
        dashboard: dashboardIT,
        opportunities: opportunitiesIT,
        workflow: workflowIT,
        settings: settingsIT,
        customers: customersIT,
      },
    },
    lng: 'it',
    fallbackLng: 'it',
    defaultNS: 'common',
    ns: ['common', 'dashboard', 'opportunities', 'workflow', 'settings', 'customers'],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    returnNull: false,
    debug: import.meta.env.DEV,
  });

export default i18n;
```

**Step 5: Create TypeScript types**

Create `src/i18n/types.ts`:
```typescript
import common from './locales/it/common.json';
import dashboard from './locales/it/dashboard.json';
import opportunities from './locales/it/opportunities.json';
import workflow from './locales/it/workflow.json';
import settings from './locales/it/settings.json';
import customers from './locales/it/customers.json';

// Extend react-i18next module for type safety
declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      dashboard: typeof dashboard;
      opportunities: typeof opportunities;
      workflow: typeof workflow;
      settings: typeof settings;
      customers: typeof customers;
    };
  }
}
```

**Step 6: Import i18n in main.tsx**

Modify `src/main.tsx` - Add import at the top (before React import):
```typescript
import './i18n/config';
import { StrictMode } from 'react';
// ... rest of imports
```

**Step 7: Verify TypeScript compilation**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors

**Step 8: Commit setup**

Run:
```bash
git add package.json package-lock.json src/i18n src/main.tsx
git commit -m "feat: setup i18n infrastructure with react-i18next

- Install react-i18next and i18next
- Create feature-based translation files (IT)
- Configure i18next with namespaces
- Add TypeScript types for type safety
- Initialize i18n in main.tsx"
```

---

## Task 2: Migrate Dashboard Component

**Files:**
- Modify: `src/components/dashboard/index.tsx:1-200`
- Modify: `src/components/dashboard/index.test.tsx:1-150`

**Step 1: Update Dashboard component to use translations**

Modify `src/components/dashboard/index.tsx` - Add import and useTranslation:
```typescript
import { useTranslation } from 'react-i18next';

export const Dashboard: React.FC = () => {
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  // ... existing code

  // Replace hardcoded strings:
  // "Dashboard RAISE" → {t('title')}
  // "Gestione Workflow Opportunità" → {t('subtitle')}
  // "Opportunità Totali" → {t('stats.totalOpportunities')}
  // "Workflow Attivi" → {t('stats.activeWorkflows')}
  // "Fasi Completate" → {t('stats.completedPhases')}
  // "Azioni Rapide" → {t('quickActions.title')}
  // "Nuova Opportunità" → {t('quickActions.newOpportunity')}
  // "Opportunità Recenti" → {t('recentOpportunities.title')}
  // "Nessuna opportunità" → {t('recentOpportunities.empty')}
  // "Caricamento..." → {tCommon('message.loading')}
```

**Step 2: Update Dashboard tests**

Modify `src/components/dashboard/index.test.tsx` - Add I18nextProvider:
```typescript
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n/config';

// Wrap all render calls:
const renderDashboard = (props = {}) => {
  return render(
    <I18nextProvider i18n={i18n}>
      <Dashboard {...props} />
    </I18nextProvider>
  );
};

// Update all test expectations to use Italian strings from translation files
// "Dashboard RAISE" stays "Dashboard RAISE" (from dashboard.json)
```

**Step 3: Run Dashboard tests**

Run:
```bash
npm run test -- src/components/dashboard/index.test.tsx
```

Expected: All tests pass

**Step 4: Verify in browser**

Run:
```bash
npm run dev
```

Navigate to http://localhost:5173/lutech-raise-app/
Expected: Dashboard displays with Italian text

**Step 5: Commit Dashboard migration**

Run:
```bash
git add src/components/dashboard/
git commit -m "feat(i18n): migrate Dashboard component to use translations

- Use useTranslation hook for dashboard namespace
- Replace all hardcoded strings with translation keys
- Update tests to use I18nextProvider
- All 28 tests passing"
```

---

## Task 3: Migrate Opportunities List Component

**Files:**
- Modify: `src/pages/opportunities/index.tsx:1-100`
- Modify: `src/pages/opportunities/index.test.tsx:1-80`

**Step 1: Update Opportunities list to use translations**

Modify `src/pages/opportunities/index.tsx`:
```typescript
import { useTranslation } from 'react-i18next';

export const OpportunitiesPage: React.FC = () => {
  const { t } = useTranslation('opportunities');
  const { t: tCommon } = useTranslation('common');

  // Replace hardcoded strings:
  // "Opportunità" → {t('list.title')}
  // "Gestisci le opportunità RAISE" → {t('list.subtitle')}
  // "Cerca opportunità..." → placeholder={t('list.searchPlaceholder')}
  // "Tutte" → {t('list.filterAll')}
  // "Attive" → {t('list.filterActive')}
  // "Completate" → {t('list.filterCompleted')}
  // "Nessuna opportunità trovata" → {t('list.empty')}
  // "Crea la tua prima opportunità" → {t('list.createFirst')}
```

**Step 2: Update tests**

Modify `src/pages/opportunities/index.test.tsx`:
```typescript
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n/config';

const renderOpportunities = () => {
  return render(
    <I18nextProvider i18n={i18n}>
      <OpportunitiesPage />
    </I18nextProvider>
  );
};
```

**Step 3: Run tests**

Run:
```bash
npm run test -- src/pages/opportunities/index.test.tsx
```

Expected: All tests pass

**Step 4: Commit**

Run:
```bash
git add src/pages/opportunities/index.tsx src/pages/opportunities/index.test.tsx
git commit -m "feat(i18n): migrate Opportunities list to translations"
```

---

## Task 4: Migrate New Opportunity Form

**Files:**
- Modify: `src/pages/opportunities/new.tsx:1-250`
- Modify: `src/i18n/locales/it/opportunities.json`
- Modify: `src/pages/opportunities/new.test.tsx:1-200`

**Step 1: Update New Opportunity form**

Modify `src/pages/opportunities/new.tsx`:
```typescript
import { useTranslation } from 'react-i18next';

export const NewOpportunityPage: React.FC = () => {
  const { t } = useTranslation('opportunities');
  const { t: tCommon } = useTranslation('common');

  // Replace all form labels, placeholders, buttons:
  // "New Opportunity" → {t('new.title')}
  // "Create a new RAISE workflow opportunity" → {t('new.subtitle')}
  // "Basic Information" → {t('new.sectionBasicInfo')}
  // "Titolo Opportunità" → {t('form.labelTitle')}
  // "es. Cloud Migration Project" → placeholder={t('form.placeholderTitle')}
  // "Cliente" → {t('form.labelCustomer')}
  // "Select Customer..." → {t('form.placeholderCustomer')}
  // "TCV (€)" → {t('form.labelTcv')}
  // "Create Opportunity" → {t('actions.create')}
  // "Cancel" → {tCommon('button.cancel')}
```

**Step 2: Update tests to use I18nextProvider**

Modify `src/pages/opportunities/new.test.tsx`:
```typescript
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n/config';

const renderNewOpportunity = () => {
  return render(
    <I18nextProvider i18n={i18n}>
      <CustomerProvider>
        <NewOpportunityPage />
      </CustomerProvider>
    </I18nextProvider>
  );
};

// Update test assertions to match Italian strings
```

**Step 3: Run tests**

Run:
```bash
npm run test -- src/pages/opportunities/new.test.tsx
```

Expected: All 21 tests pass

**Step 4: Commit**

Run:
```bash
git add src/pages/opportunities/new.tsx src/pages/opportunities/new.test.tsx
git commit -m "feat(i18n): migrate New Opportunity form to translations

- Replace all form labels and placeholders
- Update validation messages
- Update button text
- Tests passing with I18nextProvider"
```

---

## Task 5: Migrate Edit Opportunity Form

**Files:**
- Modify: `src/pages/opportunities/edit.tsx:1-250`
- Modify: `src/pages/opportunities/edit.test.tsx:1-250`

**Step 1: Update Edit Opportunity form**

Modify `src/pages/opportunities/edit.tsx`:
```typescript
import { useTranslation } from 'react-i18next';

export const EditOpportunityPage: React.FC = () => {
  const { t } = useTranslation('opportunities');
  const { t: tCommon } = useTranslation('common');
  const { id } = useParams();

  // Replace strings:
  // "Modifica Opportunità" → {t('edit.title')}
  // Use interpolation for subtitle:
  // {t('edit.subtitle', { id })}
  // "Salva Modifiche" → {t('actions.save')}
  // "Annulla" → {tCommon('button.cancel')}
```

**Step 2: Update tests**

Modify `src/pages/opportunities/edit.test.tsx`:
```typescript
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n/config';

const renderEditOpportunity = () => {
  return render(
    <I18nextProvider i18n={i18n}>
      <CustomerProvider>
        <EditOpportunityPage />
      </CustomerProvider>
    </I18nextProvider>
  );
};
```

**Step 3: Run tests**

Run:
```bash
npm run test -- src/pages/opportunities/edit.test.tsx
```

Expected: All 21 tests pass

**Step 4: Commit**

Run:
```bash
git add src/pages/opportunities/edit.tsx src/pages/opportunities/edit.test.tsx
git commit -m "feat(i18n): migrate Edit Opportunity form to translations"
```

---

## Task 6: Migrate Workflow Component

**Files:**
- Modify: `src/components/workflow/index.tsx:1-700`
- Modify: `src/components/workflow/index.test.tsx:1-500`

**Step 1: Update Workflow component**

Modify `src/components/workflow/index.tsx`:
```typescript
import { useTranslation } from 'react-i18next';

export const OpportunityWorkflow: React.FC<OpportunityWorkflowProps> = ({ opp, onBack }) => {
  const { t } = useTranslation('workflow');
  const { t: tCommon } = useTranslation('common');

  // Replace phase names:
  // "Planning" → {t('phases.planning')}
  // "ATP" → {t('phases.atp')}
  // "ATS" → {t('phases.ats')}
  // "ATC" → {t('phases.atc')}
  // "Handover" → {t('phases.handover')}

  // Replace checkpoint labels:
  // "Checkpoint" → {t('checkpoints.title')}
  // "Obbligatorio" → {t('checkpoints.mandatory')}
  // "Opzionale" → {t('checkpoints.optional')}
  // "Completato" → {t('checkpoints.completed')}

  // Replace action buttons:
  // "Completa Fase" → {t('actions.completePhase')}

  // Replace detail modal labels:
  // "Percorso SharePoint" → {t('details.folderPath')}
  // "Salva il documento in questa cartella su SharePoint" → {t('details.folderPathDescription')}
```

**Step 2: Update tests**

Modify `src/components/workflow/index.test.tsx`:
```typescript
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n/config';

const renderWorkflow = (opp: Opportunity) => {
  return render(
    <I18nextProvider i18n={i18n}>
      <OpportunityWorkflow opp={opp} onBack={mockOnBack} />
    </I18nextProvider>
  );
};
```

**Step 3: Run tests**

Run:
```bash
npm run test -- src/components/workflow/index.test.tsx
```

Expected: All 32 tests pass

**Step 4: Commit**

Run:
```bash
git add src/components/workflow/
git commit -m "feat(i18n): migrate Workflow component to translations

- Migrate phase names, checkpoint labels
- Migrate action buttons and modals
- Update detail modal with SharePoint terminology
- All tests passing"
```

---

## Task 7: Migrate Settings Component

**Files:**
- Modify: `src/components/settings/index.tsx:1-400`
- Modify: `src/pages/settings/index.tsx:1-50`
- Modify: `src/components/settings/index.test.tsx:1-150`

**Step 1: Update Settings component**

Modify `src/components/settings/index.tsx`:
```typescript
import { useTranslation } from 'react-i18next';

export const SettingsComponent: React.FC = () => {
  const { t } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');

  // Replace table headers:
  // "Controllo" → {t('controls.tableHeaders.label')}
  // "Fase" → {t('controls.tableHeaders.phase')}
  // "Obbligatorio" → {t('controls.tableHeaders.mandatory')}
  // "Azioni" → {t('controls.tableHeaders.actions')}

  // Replace buttons:
  // "Aggiungi Controllo" → {t('controls.addControl')}
  // "Ripristina Default" → {t('controls.resetDefaults')}

  // Replace form labels:
  // "Nome Controllo" → {t('form.labelName')}
  // "Percorso Cartella SharePoint" → {t('form.labelFolderPath')}
  // "Dove salvare il documento in SharePoint" → {t('form.folderPathHelp')}
```

**Step 2: Update Settings page**

Modify `src/pages/settings/index.tsx`:
```typescript
import { useTranslation } from 'react-i18next';

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation('settings');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('subtitle')}</p>
      <SettingsComponent />
    </div>
  );
};
```

**Step 3: Update tests**

Modify `src/components/settings/index.test.tsx`:
```typescript
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n/config';

const renderSettings = () => {
  return render(
    <I18nextProvider i18n={i18n}>
      <SettingsComponent />
    </I18nextProvider>
  );
};
```

**Step 4: Run tests**

Run:
```bash
npm run test -- src/components/settings/ src/pages/settings/
```

Expected: All tests pass

**Step 5: Commit**

Run:
```bash
git add src/components/settings/ src/pages/settings/
git commit -m "feat(i18n): migrate Settings component to translations

- Migrate table headers and form labels
- Update SharePoint folder path labels
- Update all action buttons
- Tests passing"
```

---

## Task 8: Migrate Customer Components

**Files:**
- Modify: `src/components/customers/index.tsx:1-150`
- Modify: `src/components/customers/CustomerModal.tsx:1-200`
- Modify: `src/components/opportunities/QuickAddCustomerModal.tsx:1-150`

**Step 1: Update Customers list component**

Modify `src/components/customers/index.tsx`:
```typescript
import { useTranslation } from 'react-i18next';

export const CustomersComponent: React.FC = () => {
  const { t } = useTranslation('customers');
  const { t: tCommon } = useTranslation('common');

  // Replace strings:
  // "Clienti" → {t('title')}
  // "Cerca clienti..." → placeholder={t('list.searchPlaceholder')}
  // "Nessun cliente trovato" → {t('list.empty')}
```

**Step 2: Update CustomerModal**

Modify `src/components/customers/CustomerModal.tsx`:
```typescript
import { useTranslation } from 'react-i18next';

export const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, customer }) => {
  const { t } = useTranslation('customers');
  const { t: tCommon } = useTranslation('common');

  // Replace form labels:
  // "Add Customer" → {t('form.titleAdd')}
  // "Edit Customer" → {t('form.titleEdit')}
  // "Customer Name" → {t('form.labelName')}
  // "Acme Corporation" → placeholder={t('form.placeholderName')}
  // "Industry" → {t('form.labelIndustry')}
  // "Public Sector" → {t('form.labelPublicSector')}

  // Replace validation messages:
  // "Customer name is required" → {t('validation.nameRequired')}
  // "Name must be at least 2 characters" → {t('validation.nameMinLength')}

  // Replace buttons:
  // "Save Changes" → {t('actions.save')}
  // "Add Customer" → {t('actions.add')}
  // "Cancel" → {tCommon('button.cancel')}
```

**Step 3: Update QuickAddCustomerModal**

Modify `src/components/opportunities/QuickAddCustomerModal.tsx`:
```typescript
import { useTranslation } from 'react-i18next';

export const QuickAddCustomerModal: React.FC<QuickAddCustomerModalProps> = ({ isOpen, onClose, onCustomerAdded }) => {
  const { t } = useTranslation('customers');
  const { t: tCommon } = useTranslation('common');

  // Use same translations as CustomerModal
  // "Add Customer" → {t('form.titleAdd')}
  // etc.
```

**Step 4: Run tests**

Run:
```bash
npm run test -- src/components/customers/
```

Expected: All tests pass

**Step 5: Commit**

Run:
```bash
git add src/components/customers/ src/components/opportunities/QuickAddCustomerModal.tsx
git commit -m "feat(i18n): migrate Customer components to translations

- Migrate CustomerModal form
- Migrate QuickAddCustomerModal
- Update validation messages
- Tests passing"
```

---

## Task 9: Migrate Common Components

**Files:**
- Modify: `src/components/common/ErrorBoundary.tsx:1-100`
- Modify: `src/components/common/LoadingOverlay.tsx:1-50`
- Modify: `src/components/layout/index.tsx:1-150`

**Step 1: Update ErrorBoundary**

Modify `src/components/common/ErrorBoundary.tsx`:
```typescript
import { useTranslation } from 'react-i18next';

// In ErrorBoundaryFallback component:
function ErrorBoundaryFallback({ error, resetErrorBoundary }: FallbackProps) {
  const { t } = useTranslation('common');

  return (
    <div>
      <h1>{t('error.generic')}</h1>
      <button onClick={resetErrorBoundary}>{t('button.back')}</button>
    </div>
  );
}
```

**Step 2: Update LoadingOverlay**

Modify `src/components/common/LoadingOverlay.tsx`:
```typescript
import { useTranslation } from 'react-i18next';

export const LoadingOverlay: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <div>
      <p>{t('message.loading')}</p>
    </div>
  );
};
```

**Step 3: Update Layout navigation**

Modify `src/components/layout/index.tsx`:
```typescript
import { useTranslation } from 'react-i18next';

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t } = useTranslation('dashboard');

  // Navigation links might need translation
  // For now, keep "Dashboard", "Opportunities", "Settings" as-is
  // (they are proper nouns/menu items)
};
```

**Step 4: Run tests**

Run:
```bash
npm run test -- src/components/common/ src/components/layout/
```

Expected: All tests pass

**Step 5: Commit**

Run:
```bash
git add src/components/common/ src/components/layout/
git commit -m "feat(i18n): migrate common components to translations

- Migrate ErrorBoundary messages
- Migrate LoadingOverlay
- Update Layout navigation
- Tests passing"
```

---

## Task 10: Update SettingsStore with Translation Keys

**Files:**
- Modify: `src/stores/SettingsStore.tsx:1-800`
- Modify: `src/i18n/locales/it/settings.json`

**Step 1: Add control translations to settings.json**

Modify `src/i18n/locales/it/settings.json` - Add new section:
```json
{
  "title": "Impostazioni",
  "subtitle": "Gestisci controlli e configurazioni workflow",
  "controls": {
    "oppSite": {
      "label": "Opportunity Site Created",
      "description": "Create SharePoint Opportunity Site"
    },
    "crmCase": {
      "label": "Opportunità in Salesforce",
      "description": "Create opportunity in Salesforce CRM with required fields"
    },
    "offerCode": {
      "label": "Codice Offerta",
      "description": "Generate offer code via Salesforce"
    }
    // ... add all other control translations
  }
}
```

**Step 2: Update SettingsStore to use translation keys**

Modify `src/stores/SettingsStore.tsx`:
```typescript
// Change from:
const defaultControls: ControlConfig[] = [
  {
    id: 'opp-site',
    label: 'Opportunity Site Created',
    description: 'Create SharePoint Opportunity Site',
    // ...
  },
];

// To:
const defaultControls: ControlConfig[] = [
  {
    id: 'opp-site',
    labelKey: 'settings:controls.oppSite.label',
    descriptionKey: 'settings:controls.oppSite.description',
    // Keep label/description as fallback for now
    label: 'Opportunity Site Created',
    description: 'Create SharePoint Opportunity Site',
    // ...
  },
];
```

**Step 3: Update ControlConfig type**

Modify `src/types/index.ts`:
```typescript
export interface ControlConfig {
  id: string;
  label: string; // Keep for backward compatibility
  labelKey?: string; // New: translation key
  description: string; // Keep for backward compatibility
  descriptionKey?: string; // New: translation key
  // ... rest of properties
}
```

**Step 4: Update components to use translation keys**

Modify workflow and settings components to check for `labelKey`/`descriptionKey` first:
```typescript
// In component:
const displayLabel = control.labelKey ? t(control.labelKey) : control.label;
const displayDescription = control.descriptionKey ? t(control.descriptionKey) : control.description;
```

**Step 5: Run tests**

Run:
```bash
npm run test -- src/stores/SettingsStore.test.tsx
```

Expected: All tests pass

**Step 6: Commit**

Run:
```bash
git add src/stores/SettingsStore.tsx src/types/index.ts src/i18n/locales/it/settings.json
git commit -m "feat(i18n): add translation keys to SettingsStore

- Add labelKey/descriptionKey to ControlConfig
- Maintain backward compatibility with label/description
- Add all control translations to settings.json
- Components use translation keys when available"
```

---

## Task 11: Final Testing and Verification

**Files:**
- Run all tests
- Manual testing

**Step 1: Run all unit tests**

Run:
```bash
npm run test
```

Expected: All 342 tests pass

**Step 2: Run TypeScript check**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors

**Step 3: Run linting**

Run:
```bash
npm run lint
```

Expected: No errors

**Step 4: Build production**

Run:
```bash
npm run build
```

Expected: Build succeeds

**Step 5: Manual testing checklist**

Start dev server:
```bash
npm run dev
```

Test scenarios:
- [ ] Dashboard loads with Italian text
- [ ] Create new opportunity - all labels in Italian
- [ ] Edit opportunity - all labels in Italian
- [ ] View workflow - phase names and checkpoints in Italian
- [ ] Settings page - table and form in Italian
- [ ] Customer modal - form in Italian
- [ ] Error messages display in Italian
- [ ] No English strings visible anywhere

**Step 6: Final commit**

Run:
```bash
git add -A
git commit -m "feat(i18n): complete internationalization system implementation

Summary of changes:
- Installed react-i18next and i18next
- Created 6 feature-based translation files (IT)
- Configured TypeScript types for type safety
- Migrated all components to use translations:
  - Dashboard
  - Opportunities (list, new, edit)
  - Workflow
  - Settings
  - Customers
  - Common components
- Updated SettingsStore with translation keys
- All 342 tests passing
- Production build successful
- Zero hardcoded strings remaining

System ready for future language additions."
```

---

## Post-Implementation

### Bundle Size Check

Run:
```bash
npm run build
```

Check dist/ bundle sizes:
- react-i18next: ~3KB gzipped
- i18next: ~7KB gzipped
- Translation files: ~10KB total
- **Total impact: ~20KB** (acceptable)

### Documentation

The i18n system is fully documented in:
- Design: `docs/plans/2025-12-29-i18n-system-design.md`
- Implementation: This plan

### Future Enhancements

To add a new language (e.g., English):
1. Create `src/i18n/locales/en/` directory
2. Copy IT JSON files as templates
3. Translate all strings
4. Update `src/i18n/config.ts` to include EN resources
5. Add language switcher component (if needed)

### Maintenance

When adding new features:
1. Add strings to appropriate JSON file
2. Use `t()` hook in components
3. TypeScript will enforce type safety
4. Add tests with I18nextProvider

---

**Implementation Complete!** 🎉
