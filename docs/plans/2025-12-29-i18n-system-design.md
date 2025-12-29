# Internationalization (i18n) System Design

**Data**: 2025-12-29
**Autore**: Claude Code
**Stato**: Design Approvato

## Obiettivo

Implementare un sistema di internazionalizzazione (i18n) robusto per gestire tutte le stringhe di testo dell'applicazione RAISE, eliminando stringhe hard-coded e preparando l'architettura per future localizzazioni.

## Requisiti

### Funzionali
- Gestire ~184 stringhe hard-coded distribuite in 55 file TypeScript
- Supportare Italiano come lingua di default
- Architettura pronta per aggiungere altre lingue in futuro (Inglese, ecc.)
- Supportare interpolazione variabili (es. "Creato da {{user}}")
- Supportare pluralizzazione italiana
- Type-safe: errori a compile-time per chiavi mancanti

### Non Funzionali
- Performance: lazy loading dei namespace
- Developer Experience: facile da usare e mantenere
- Manutenibilità: organizzazione chiara e scalabile
- Testing: componenti testabili con traduzioni mock

## Decisioni Architetturali

### Libreria: react-i18next

**Scelta**: react-i18next (con i18next)

**Motivazioni**:
- Libreria standard de facto per React
- Eccellente supporto TypeScript
- Bundle size ridotto (~3KB gzipped)
- Lazy loading automatico dei namespace
- Community attiva e manutenzione costante
- Feature complete (interpolazione, plurali, context, formatting)

**Alternative Considerate**:
- react-intl: Più pesante (~15KB), overkill per le nostre esigenze
- Soluzione custom: Troppo effort per feature che react-i18next offre out-of-the-box

### Organizzazione: Per Feature/Modulo

**Struttura Directory**:
```
src/
├── i18n/
│   ├── config.ts           # Configurazione react-i18next
│   ├── types.ts            # TypeScript types generati
│   └── locales/
│       └── it/
│           ├── common.json       # UI comune (bottoni, errori, labels)
│           ├── dashboard.json    # Dashboard e cards
│           ├── opportunities.json # Form opportunità, validazioni
│           ├── workflow.json     # Fasi, checkpoint, completion
│           ├── settings.json     # Configurazioni e controlli
│           └── customers.json    # Gestione clienti
```

**Motivazioni**:
- File di dimensioni gestibili (30-50 stringhe ciascuno)
- Facile trovare e modificare traduzioni per feature
- Lazy loading efficiente (carica solo namespace necessari)
- Chiara separazione delle responsabilità

**Alternative Considerate**:
- Per componente: Troppo granulare, molti file piccoli
- File unico: Non scalabile con 184+ stringhe

## Architettura Tecnica

### 1. Configurazione i18next

**File**: `src/i18n/config.ts`

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
    interpolation: {
      escapeValue: false, // React escapes by default
    },
    returnNull: false,
    debug: import.meta.env.DEV,
  });

export default i18n;
```

### 2. TypeScript Safety

**File**: `src/i18n/types.ts`

Generazione automatica dei types dalle traduzioni:

```typescript
import common from './locales/it/common.json';
import dashboard from './locales/it/dashboard.json';
import opportunities from './locales/it/opportunities.json';
import workflow from './locales/it/workflow.json';
import settings from './locales/it/settings.json';
import customers from './locales/it/customers.json';

// Deep keys type helper
type DeepKeys<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? DeepKeys<T[K], `${Prefix}${K}.`>
          : `${Prefix}${K}`
        : never;
    }[keyof T]
  : never;

export type CommonKeys = DeepKeys<typeof common>;
export type DashboardKeys = DeepKeys<typeof dashboard>;
export type OpportunitiesKeys = DeepKeys<typeof opportunities>;
export type WorkflowKeys = DeepKeys<typeof workflow>;
export type SettingsKeys = DeepKeys<typeof settings>;
export type CustomersKeys = DeepKeys<typeof customers>;

// Extend react-i18next module
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

### 3. Pattern di Utilizzo

#### Componente Base

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('dashboard');

  return (
    <div>
      <h1>{t('title')}</h1>
      <button>{t('common:save')}</button>
    </div>
  );
}
```

#### Con Variabili

```typescript
const { t } = useTranslation('opportunities');

<p>{t('createdBy', { user: userName, date: formattedDate })}</p>
```

JSON:
```json
{
  "createdBy": "Creato da {{user}} il {{date}}"
}
```

#### Attributi HTML

```typescript
<input
  placeholder={t('opportunities:clientNamePlaceholder')}
  title={t('common:required')}
/>
```

#### HTML Formattato

```typescript
import { Trans } from 'react-i18next';

<Trans i18nKey="dashboard:welcomeMessage" values={{ name: user.name }}>
  Benvenuto <strong>{{name}}</strong> alla RAISE App
</Trans>
```

### 4. Gestione Dati di Configurazione

Per stringhe nei dati (come `SettingsStore.tsx`), usare **translation keys**:

**Prima**:
```typescript
const control = {
  label: 'Opportunity Site Created',
  description: 'Create SharePoint Opportunity Site'
};
```

**Dopo**:
```typescript
const control = {
  labelKey: 'settings:controls.oppSite.label',
  descriptionKey: 'settings:controls.oppSite.description'
};

// Nel componente
<p>{t(control.labelKey)}</p>
```

## Convenzioni di Naming

### Prefissi per Tipo di Contenuto

```json
{
  "button": {
    "save": "Salva",
    "cancel": "Annulla",
    "create": "Crea"
  },
  "label": {
    "clientName": "Nome Cliente",
    "tcv": "TCV"
  },
  "placeholder": {
    "selectCustomer": "Seleziona cliente...",
    "enterAmount": "Inserisci importo"
  },
  "error": {
    "required": "Campo obbligatorio",
    "invalidEmail": "Email non valida"
  },
  "title": {
    "newOpportunity": "Nuova Opportunità",
    "editOpportunity": "Modifica Opportunità"
  },
  "message": {
    "saveSuccess": "Salvato con successo",
    "deleteConfirm": "Sei sicuro di voler eliminare?"
  }
}
```

### Nesting per Raggruppamento Logico

```json
{
  "form": {
    "validation": {
      "required": "Campo obbligatorio",
      "minLength": "Minimo {{min}} caratteri",
      "maxLength": "Massimo {{max}} caratteri"
    },
    "fields": {
      "title": "Titolo",
      "description": "Descrizione"
    }
  }
}
```

## Strategia di Migrazione

### Fase 1: Setup Infrastruttura (1-2 ore)

1. **Installazione dipendenze**
   ```bash
   npm install react-i18next i18next
   ```

2. **Creare struttura directory**
   ```bash
   mkdir -p src/i18n/locales/it
   ```

3. **Creare file configurazione** (`src/i18n/config.ts`)

4. **Creare file types** (`src/i18n/types.ts`)

5. **Aggiungere import in `main.tsx`**
   ```typescript
   import './i18n/config';
   ```

### Fase 2: Creazione File Traduzioni (priorità)

1. **common.json** - Iniziare con elementi comuni
   - Bottoni: save, cancel, create, edit, delete
   - Errori: required, invalid, server error
   - Labels: ricorrenti in tutta l'app

2. **opportunities.json** - Feature più ricca di stringhe
   - Form labels e placeholders
   - Messaggi di validazione
   - Titoli e descrizioni

3. **workflow.json** - Fasi e checkpoint
   - Nomi fasi (Planning, ATP, ATS, ATC, Handover)
   - Labels checkpoint
   - Messaggi completion

4. **dashboard.json** - Cards e statistiche
   - Titoli card
   - Labels metriche
   - Empty states

5. **settings.json** - Configurazioni
   - Labels controlli
   - Descrizioni
   - Help text

6. **customers.json** - Gestione clienti
   - Form labels
   - Messaggi
   - Modal text

### Fase 3: Migrazione Componenti (graduale)

**Ordine suggerito**:

1. **Componenti comuni** (`src/components/common/`)
   - Buttons
   - Form fields
   - Modals

2. **Layout** (`src/components/layout/`)
   - Navigation
   - Sidebar
   - Header

3. **Dashboard** (`src/components/dashboard/`)

4. **Opportunities** (`src/pages/opportunities/` e `src/components/opportunities/`)
   - new.tsx
   - edit.tsx
   - index.tsx
   - QuickAddCustomerModal

5. **Workflow** (`src/components/workflow/`)

6. **Settings** (`src/components/settings/` e `src/pages/settings/`)

7. **Customers** (`src/components/customers/`)

8. **Stores** (dati di configurazione)
   - SettingsStore.tsx
   - Usare translation keys invece di stringhe

### Fase 4: Testing e Verifica

1. **Test unitari** - Aggiornare con i18n provider
2. **Test E2E** - Verificare che testi siano ancora visibili
3. **Manual testing** - Navigare tutta l'app
4. **Verifica TypeScript** - No errori di compilazione

## Testing

### Setup Test Utils

**File**: `src/test-utils/i18n-test.ts`

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import actual translations for tests
import commonIT from '../i18n/locales/it/common.json';

i18n.use(initReactI18next).init({
  lng: 'it',
  fallbackLng: 'it',
  ns: ['common'],
  defaultNS: 'common',
  resources: {
    it: {
      common: commonIT,
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
```

### Test Helper

```typescript
import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n-test';

export const renderWithI18n = (component: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  );
};
```

### Esempio Test

```typescript
import { renderWithI18n } from '../test-utils/i18n-test';

it('should display save button', () => {
  const { getByText } = renderWithI18n(<MyComponent />);
  expect(getByText('Salva')).toBeInTheDocument();
});
```

## Error Handling

### Missing Keys

**Development**:
- Log warning in console
- Mostra chiave invece di stringa (es. "common:buttonSave")

**Production**:
- Log silent
- Mostra chiave (fallback graceful)

### Failed Loading

- Fallback a italiano sempre disponibile
- Sincronous loading per IT (no lazy)
- Error boundary per errori catastrofici

### Invalid Interpolation

```typescript
// Stringa: "Creato da {{user}}"
t('createdBy', { wrongKey: 'value' })
// Output: "Creato da {{user}}" (mostra template)
```

## Performance

### Bundle Size Impact

- **react-i18next**: ~3KB gzipped
- **i18next**: ~7KB gzipped
- **Translation files**: ~5-10KB total (Italian only)
- **Total impact**: ~15-20KB

### Lazy Loading (Futuro)

Quando si aggiungono altre lingue:

```typescript
i18n.init({
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
  },
  partialBundledLanguages: true,
});
```

## Estensibilità Futura

### Aggiungere Nuova Lingua (es. Inglese)

1. **Creare directory**: `src/i18n/locales/en/`

2. **Copiare file IT come template**
   ```bash
   cp -r src/i18n/locales/it/* src/i18n/locales/en/
   ```

3. **Tradurre stringhe**

4. **Aggiornare config.ts**
   ```typescript
   resources: {
     it: { ... },
     en: {
       common: commonEN,
       dashboard: dashboardEN,
       ...
     }
   }
   ```

5. **Aggiungere language switcher** (se necessario)

### Language Switcher (Template)

```typescript
function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
    >
      <option value="it">Italiano</option>
      <option value="en">English</option>
    </select>
  );
}
```

## Rischi e Mitigazioni

### Rischio: Dimenticare Stringhe Durante Migrazione

**Mitigazione**:
- Script di estrazione automatica
- Code review sistematica
- Search grep per pattern comuni: `"[A-Z][a-z]{3,}"`

### Rischio: Performance con Molte Lingue

**Mitigazione**:
- Lazy loading configurato
- Bundle splitting per lingua
- CDN per file JSON

### Rischio: Traduzioni Inconsistenti

**Mitigazione**:
- Glossario termini comuni (es. "Opportunità" sempre uguale)
- Review process per nuove traduzioni
- Translation management tool (se team cresce)

## Metriche di Successo

- ✅ Zero stringhe hard-coded rimanenti
- ✅ 100% TypeScript type coverage per translation keys
- ✅ Tutti i test passano con i18n
- ✅ Bundle size impact < 25KB
- ✅ Nessuna regressione UX
- ✅ Developer velocity mantenuta (facile aggiungere nuove stringhe)

## Riferimenti

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [TypeScript i18next Guide](https://react.i18next.com/latest/typescript)
