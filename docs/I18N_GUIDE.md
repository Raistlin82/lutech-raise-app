# Guida Internazionalizzazione (i18n)

## 📚 Indice
- [Panoramica](#panoramica)
- [Architettura](#architettura)
- [Uso per Sviluppatori](#uso-per-sviluppatori)
- [Aggiungere Traduzioni](#aggiungere-traduzioni)
- [Espandere a Nuove Lingue](#espandere-a-nuove-lingue)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Panoramica

RAISE App v1.2.0 include un sistema completo di internazionalizzazione basato su **react-i18next**.

### Caratteristiche

✅ **Interfaccia Italiana Completa** - Tutti i testi UI in italiano  
✅ **Type-Safe** - Autocomplete TypeScript per chiavi di traduzione  
✅ **Namespace Modulari** - Organizzazione per feature  
✅ **Interpolazione Dinamica** - Valori variabili nelle traduzioni  
✅ **Pronto per Multi-Lingua** - Architettura ready per EN, FR, DE, etc.  

### Stack Tecnologico

- **i18next** v23+ - Core framework (~7KB gzipped)
- **react-i18next** v14+ - React bindings (~3KB gzipped)
- **TypeScript** - Type safety per chiavi di traduzione

---

## Architettura

### Struttura File

```
src/i18n/
├── locales/
│   └── it/                 # Italian translations
│       ├── common.json     # Shared strings (buttons, errors)
│       ├── dashboard.json  # Dashboard-specific
│       ├── opportunities.json
│       ├── workflow.json
│       ├── settings.json
│       └── customers.json
├── config.ts              # i18next configuration
└── types.ts               # TypeScript type definitions
```

### Namespace Organization

| Namespace | File | Contenuto | Traduzioni |
|-----------|------|-----------|------------|
| `common` | common.json | Bottoni, errori, messaggi condivisi | 12 |
| `dashboard` | dashboard.json | Dashboard stats, cards, actions | 46 |
| `opportunities` | opportunities.json | Form opportunità, validazioni | 73 |
| `workflow` | workflow.json | Fasi, checkpoint, outcome | 89 |
| `settings` | settings.json | Controlli, form settings | 53 |
| `customers` | customers.json | Gestione clienti | 24 |

**Totale:** 297 traduzioni

---

## Uso per Sviluppatori

### 1. Import Hook

```typescript
import { useTranslation } from 'react-i18next';
```

### 2. Uso in Function Components

```typescript
export const MyComponent = () => {
  // Default namespace (common)
  const { t } = useTranslation();
  
  // Specific namespace
  const { t } = useTranslation('dashboard');
  
  // Multiple namespaces
  const { t } = useTranslation('opportunities');
  const { t: tCommon } = useTranslation('common');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <button>{tCommon('button.save')}</button>
    </div>
  );
};
```

### 3. Interpolazione (Variabili Dinamiche)

```typescript
// In translation file (dashboard.json):
{
  "deleteConfirm": {
    "message": "Eliminare {{title}}?"
  }
}

// In component:
const message = t('deleteConfirm.message', { title: opp.title });
// Output: "Eliminare Cloud Migration Project?"
```

### 4. Class Components (HOC)

```typescript
import { withTranslation, WithTranslation } from 'react-i18next';

class MyComponent extends React.Component<Props & WithTranslation> {
  render() {
    const { t } = this.props;
    return <div>{t('error.title')}</div>;
  }
}

export default withTranslation()(MyComponent);
```

### 5. Test con i18n

```typescript
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n/config';

const renderComponent = () => {
  return render(
    <I18nextProvider i18n={i18n}>
      <MyComponent />
    </I18nextProvider>
  );
};

test('displays translated text', () => {
  renderComponent();
  expect(screen.getByText('Panoramica Pipeline')).toBeInTheDocument();
});
```

---

## Aggiungere Traduzioni

### Step 1: Identificare il Namespace

Scegli il namespace appropriato:
- Testo condiviso (bottoni, errori) → `common`
- Dashboard/stats → `dashboard`
- Form opportunità → `opportunities`
- Workflow/fasi → `workflow`
- Settings/controlli → `settings`
- Gestione clienti → `customers`

### Step 2: Aggiungere Chiave al File JSON

```json
// src/i18n/locales/it/dashboard.json
{
  "stats": {
    "totalValue": "Valore Totale",
    "newMetric": "Nuova Metrica"  // ← NUOVA CHIAVE
  }
}
```

### Step 3: Usare nei Componenti

```typescript
const { t } = useTranslation('dashboard');
<div>{t('stats.newMetric')}</div>
```

### Step 4: TypeScript Autocomplete

Grazie alla type augmentation in `types.ts`, ottieni autocomplete automatico!

```typescript
t('stats.') // ← TypeScript suggerisce: totalValue, newMetric, etc.
```

---

## Espandere a Nuove Lingue

### Aggiungere Inglese (EN)

#### 1. Creare Directory

```bash
mkdir -p src/i18n/locales/en
```

#### 2. Copiare e Tradurre File

```bash
cd src/i18n/locales/en
# Copia file italiani
cp ../it/common.json .
cp ../it/dashboard.json .
cp ../it/opportunities.json .
cp ../it/workflow.json .
cp ../it/settings.json .
cp ../it/customers.json .
```

#### 3. Tradurre Contenuto

```json
// en/common.json
{
  "button": {
    "save": "Save",        // era "Salva"
    "cancel": "Cancel",    // era "Annulla"
    "create": "Create"     // era "Crea"
  }
}
```

#### 4. Aggiornare Configurazione

```typescript
// src/i18n/config.ts
import commonEN from './locales/en/common.json';
import dashboardEN from './locales/en/dashboard.json';
// ...altri import

i18n.use(initReactI18next).init({
  resources: {
    it: {
      common: commonIT,
      dashboard: dashboardIT,
      // ...
    },
    en: {                    // ← NUOVO
      common: commonEN,
      dashboard: dashboardEN,
      // ...
    },
  },
  lng: 'it',  // Default language
  fallbackLng: 'it',
  // ...
});
```

#### 5. Aggiornare Types

```typescript
// src/i18n/types.ts
import commonEN from './locales/en/common.json';
// ...

declare module 'react-i18next' {
  interface CustomTypeOptions {
    resources: {
      common: typeof commonEN;  // Usa EN come reference per types
      // ...
    };
  }
}
```

#### 6. Aggiungere Language Switcher (opzionale)

```typescript
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher = () => {
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
};
```

---

## Best Practices

### ✅ DO

1. **Usa namespace specifici**
   ```typescript
   // ✅ GOOD
   const { t } = useTranslation('dashboard');
   ```

2. **Chiavi descrittive nidificate**
   ```json
   // ✅ GOOD
   {
     "form": {
       "labelName": "Nome",
       "placeholderName": "Inserisci nome"
     }
   }
   ```

3. **Interpolazione per valori dinamici**
   ```typescript
   // ✅ GOOD
   t('welcome.message', { name: user.name })
   ```

4. **Wrap test con I18nextProvider**
   ```typescript
   // ✅ GOOD
   render(
     <I18nextProvider i18n={i18n}>
       <Component />
     </I18nextProvider>
   );
   ```

### ❌ DON'T

1. **Non concatenare stringhe tradotte**
   ```typescript
   // ❌ BAD
   const message = t('hello') + ' ' + t('world');
   
   // ✅ GOOD
   const message = t('hello.world');  // "Ciao mondo"
   ```

2. **Non hardcodare testi UI**
   ```typescript
   // ❌ BAD
   <button>Salva</button>
   
   // ✅ GOOD
   <button>{tCommon('button.save')}</button>
   ```

3. **Non duplicare traduzioni**
   ```json
   // ❌ BAD - duplicazione
   {
     "dashboard": { "save": "Salva" },
     "settings": { "save": "Salva" }
   }
   
   // ✅ GOOD - usa common namespace
   {
     "common": { "button": { "save": "Salva" } }
   }
   ```

4. **Non usare chiavi generiche**
   ```json
   // ❌ BAD
   { "text1": "Testo", "text2": "Altro" }
   
   // ✅ GOOD
   { "form": { "labelName": "Nome", "labelEmail": "Email" } }
   ```

---

## Troubleshooting

### Problema: Testo non tradotto (mostra chiave)

**Sintomo:** Vedi "dashboard.title" invece del testo

**Causa:** Chiave mancante o namespace non caricato

**Soluzione:**
```typescript
// Verifica namespace
const { t } = useTranslation('dashboard');  // Non 'common'!

// Verifica chiave in file JSON
// dashboard.json deve avere: { "title": "Panoramica Pipeline" }
```

### Problema: TypeScript non suggerisce chiavi

**Causa:** Types non aggiornati

**Soluzione:**
```bash
# Riavvia TypeScript server in VS Code
Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

### Problema: Test falliscono con errori i18n

**Causa:** Manca I18nextProvider nel test

**Soluzione:**
```typescript
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n/config';

const wrapper = ({ children }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

render(<Component />, { wrapper });
```

### Problema: Interpolazione non funziona

**Sintomo:** Vedi "Ciao {{name}}" invece di "Ciao Mario"

**Causa:** Parametro non passato o nome errato

**Soluzione:**
```typescript
// ❌ BAD
t('welcome', { username: 'Mario' })  // Ma JSON ha {{name}}

// ✅ GOOD
t('welcome', { name: 'Mario' })  // Match con JSON
```

---

## Risorse

### File Chiave
- `src/i18n/config.ts` - Configurazione i18next
- `src/i18n/types.ts` - TypeScript types
- `src/i18n/locales/it/*.json` - Traduzioni italiane

### Documentazione Esterna
- [react-i18next Docs](https://react.i18next.com/)
- [i18next Docs](https://www.i18next.com/)
- [Translation Best Practices](https://www.i18next.com/principles/fallback)

### Esempi nel Codebase
- Dashboard: `src/components/dashboard/index.tsx`
- Form: `src/pages/opportunities/new.tsx`
- Modal: `src/components/settings/index.tsx` (ControlModal)
- Class Component: `src/components/common/ErrorBoundary.tsx`

---

## FAQ

**Q: Posso cambiare lingua a runtime?**  
A: Sì, usa `i18n.changeLanguage('en')`. Attualmente solo 'it' disponibile.

**Q: Come gestire plurali?**  
A: i18next supporta plurali. Esempio:
```json
{
  "items": "{{count}} elemento",
  "items_plural": "{{count}} elementi"
}
```
```typescript
t('items', { count: 1 })  // "1 elemento"
t('items', { count: 5 })  // "5 elementi"
```

**Q: Posso lazy-load namespace?**  
A: Sì, i18next supporta lazy loading. Attualmente tutti i namespace sono precaricati.

**Q: Come tradurre date e numeri?**  
A: Usa Intl API di JavaScript:
```typescript
new Intl.DateTimeFormat('it-IT').format(date)
new Intl.NumberFormat('it-IT').format(1000) // "1.000"
```

---

**Versione:** v1.2.0  
**Ultima Modifica:** 2025-12-29  
**Autore:** Gabriele Rendina
