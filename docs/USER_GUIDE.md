# RAISE App - Guida Utente

## Indice

1. [Introduzione](#introduzione)
2. [Autenticazione SAP IAS](#autenticazione-sap-ias) **(NEW v1.3.0)**
3. [Interfaccia e Lingua](#interfaccia-e-lingua)
4. [Gestione Clienti](#gestione-clienti)
5. [Dashboard](#dashboard)
6. [Creazione Opportunità](#creazione-opportunità)
7. [Workflow ATP/ATS/ATC](#workflow-atpatsatc)
8. [Gestione Checkpoint](#gestione-checkpoint)
9. [FAQ](#faq)

---

## Introduzione

### Cos'è RAISE?

**RAISE** (Risk Assessment & Internal Sales Enablement) è un sistema per la gestione delle opportunità di vendita che guida attraverso un processo strutturato di compliance e autorizzazioni.

### Versione Corrente

**v1.3.0** - Integrazione Autenticazione Enterprise SAP IAS

### Concetti Chiave

#### RAISE Levels (L1-L6)

Il **RAISE Level** determina il livello di autorizzazione necessario per un'opportunità, basato su:
- **TCV** (Total Contract Value)
- **First Margin %** (Margine iniziale)

| Level | TCV | Margine | Autorizzatore |
|-------|-----|---------|---------------|
| L1 | > €5M | < 15% | Executive Committee |
| L2 | €2M-€5M | 15%-20% | BU Director |
| L3 | €1M-€2M | 20%-25% | Sales Director |
| L4 | €500K-€1M | 25%-30% | Area Manager |
| L5 | €250K-€500K | 30%-35% | Sales Manager |
| L6 | < €250K | > 35% | Account Manager |

#### Fasi del Workflow

1. **Planning** - Pianificazione iniziale
2. **ATP** - Authorization To Proceed (Autorizzazione a Procedere)
3. **ATS** - Authorization To Sign (Autorizzazione a Firmare)
4. **ATC** - Authorization To Commit (Autorizzazione a Committare)
5. **Handover** - Passaggio al delivery

#### Fast Track

Opportunità con:
- TCV < €250K
- Nessuna deviazione KCP

Possono seguire un processo accelerato con meno checkpoint.

---

## Interfaccia e Lingua

### Interfaccia Italiana (NEW v1.2.0)

A partire dalla **versione 1.2.0**, l'intera interfaccia di RAISE App è disponibile in **italiano**.

#### Caratteristiche

✅ **Tutti i testi UI tradotti** - Bottoni, etichette, messaggi, notifiche
✅ **Form e validazioni** - Messaggi di errore e aiuti contestuali in italiano
✅ **Dashboard e metriche** - Statistiche e KPI con terminologia italiana
✅ **Workflow completo** - Fasi, checkpoint e azioni in italiano

#### Elementi Tradotti

**Componenti Principali:**
- Dashboard - Panoramica Pipeline, statistiche, card opportunità
- Gestione Clienti - Form, lista, validazioni
- Opportunità - Creazione, modifica, dettagli
- Workflow - Fasi ATP/ATS/ATC, checkpoint, completion
- Settings - Tabella controlli, form configurazione

**Messaggi e Notifiche:**
- Toast notifications di conferma/errore
- Messaggi di validazione form
- Conferme eliminazione
- Messaggi di stato (loading, success, error)

#### Supporto Multi-Lingua (Futuro)

Il sistema è stato progettato con architettura **i18n** (internationalization) che permette l'espansione a nuove lingue in futuro:

**Lingue Pianificate:**
- 🇬🇧 Inglese (English)
- 🇫🇷 Francese (Français)
- 🇩🇪 Tedesco (Deutsch)

**Nota per Sviluppatori:**
Per informazioni tecniche sul sistema i18n, consulta [I18N_GUIDE.md](I18N_GUIDE.md).

---

## Gestione Clienti

### Panoramica (NEW v1.1.0)

Il sistema di **Gestione Clienti** permette di centralizzare i dati dei clienti e collegarli alle opportunità.

### Creazione Cliente

#### 1. Accesso

Click **"Customers"** nella sidebar per accedere alla lista clienti.

#### 2. Nuovo Cliente

Click **"New Customer"** per aprire il form di creazione.

#### 3. Campi Richiesti

**Informazioni Cliente:**
- **Nome Cliente*** - Nome completo (minimo 2, massimo 200 caratteri)
  - ✅ Esempio: "Acme Corporation S.p.A."
  - ✅ Esempio: "Ministero dell'Interno"

- **Industry*** - Settore industriale (selezione da dropdown)
  - 10 settori predefiniti:
    - Technology
    - Manufacturing
    - Finance
    - Healthcare
    - Retail
    - Energy
    - Transportation
    - Public Administration
    - Telecommunications
    - Consulting

- **Public Sector** - Flag Pubblica Amministrazione (checkbox)
  - ✅ Seleziona se cliente è PA/Ente Pubblico
  - ⬜ Deseleziona se cliente privato

#### 4. Validazione

Il sistema valida:
- Nome: lunghezza minima 2 caratteri
- Industry: deve essere uno dei 10 settori predefiniti
- UUID: generato automaticamente

#### 5. Salvataggio

Click **"Create Customer"**:
- Cliente creato e aggiunto alla lista
- Toast notification conferma successo
- ID univoco UUID generato automaticamente

### Quick Add Customer (Inline)

#### Durante Creazione Opportunità

1. Nel form opportunità, click **pulsante "+" verde** accanto al dropdown cliente
2. Si apre modal **Quick Add Customer**
3. Compila i campi (Nome, Industry, Public Sector)
4. Click **"Add Customer"**
5. **Cliente creato e auto-selezionato** nel dropdown
6. Campi industry e public sector **auto-popolati** automaticamente

**Vantaggi:**
- ✅ Non esci dal form opportunità
- ✅ Cliente immediatamente disponibile
- ✅ Auto-selezione e auto-fill automatici

### Modifica Cliente

1. Dalla lista clienti, click **icona matita** sulla card cliente
2. Modifica i campi desiderati
3. Click **"Update Customer"**
4. Toast notification conferma modifica

### Eliminazione Cliente

⚠️ **Protezione Referential Integrity:**

- ✅ Puoi eliminare clienti **senza opportunità collegate**
- ❌ **Non puoi** eliminare clienti con opportunità attive
- Sistema mostra alert se provi a eliminare cliente con opportunità

**Procedura:**
1. Click **icona cestino** sulla card cliente
2. Conferma nella dialog
3. Se OK → Cliente eliminato, toast conferma
4. Se cliente ha opportunità → Error message, eliminazione bloccata

### Auto-Fill da Cliente

Quando selezioni un cliente nel form opportunità:

**Campi Auto-Popolati (Readonly):**
- ✅ **Industry** - Settore del cliente (icona lucchetto 🔒)
- ✅ **Public Sector** - Flag PA del cliente (icona lucchetto 🔒)

**Visualizzazione:**
- Campi con **sfondo grigio chiaro**
- **Icona lucchetto** a sinistra
- Testo **"Auto-filled from customer"** sotto il campo

**Vantaggi:**
- ✅ Coerenza dati garantita
- ✅ Nessuna discrepanza tra cliente e opportunità
- ✅ Aggiornamento automatico se modifichi cliente

### Lista Clienti

**Visualizzazione Card:**

Ogni card cliente mostra:
- **Nome** (font bold, grande)
- **Industry** (badge colorato)
- **Public Sector** badge (se PA)
- **# Opportunità** - Numero opportunità collegate
- **Actions** - Edit (matita) e Delete (cestino)

**Ordinamento:**
- Alfabetico per nome cliente (A-Z)
- Card responsive per mobile/tablet

### Backward Compatibility

**Opportunità Legacy (create prima v1.1.0):**

- Continuano a funzionare con **clientName** e **industry** come testo libero
- Non hanno **customerId** collegato
- Possono essere **migrate manualmente**:
  1. Crea cliente corrispondente
  2. Modifica opportunità
  3. Seleziona cliente dal dropdown
  4. Campi auto-popolati da cliente
  5. Salva → Migrazione completa

---

## Dashboard

### Panoramica

La dashboard è la schermata principale dove visualizzi tutte le opportunità.

### Elementi Principali

#### 1. Pipeline Overview (Metriche)

- **Total TCV** - Valore totale contratti in pipeline
- **Win Rate** - Percentuale successo (chiuse vinte / totali)
- **Pipeline Value** - Valore opportunità attive

#### 2. Lista Opportunità

Ogni card opportunità mostra:
- **Titolo** e **Cliente**
- **TCV** formattato (es: €1.2M)
- **RAISE Level** (badge colorato L1-L6)
- **Fase corrente** (Planning, ATP, ATS, ATC, Handover)
- **Status** (Draft, Active, Won, Lost)

#### 3. Quick Actions

- **📝 New Opportunity** - Crea nuova opportunità
- **✏️ Edit** (icona matita) - Modifica opportunità
- **🗑️ Delete** (icona cestino) - Elimina opportunità
- **▶️ View Workflow** (click card) - Apri workflow

### Filtri e Ordinamento

Puoi filtrare e ordinare le opportunità per:
- Status (Draft, Active, Won, Lost)
- RAISE Level (L1-L6)
- Fase (Planning, ATP, ATS, ATC)
- Data creazione
- TCV

---

## Creazione Opportunità

### Passo per Passo

#### 1. Accesso Form

Click sul pulsante **"New Opportunity"** nella dashboard.

#### 2. Campi Obbligatori

**Informazioni Base:**
- **Title*** - Titolo descrittivo (3-200 caratteri)
  - ✅ Esempio: "Cloud Migration SAP per Cliente X"
  - ❌ Evita: "Prog", "Test"

- **Customer*** (NEW v1.1.0) - Selezione cliente da dropdown
  - Seleziona cliente esistente dalla lista (ordinata A-Z)
  - Oppure click **pulsante "+" verde** per creare nuovo cliente inline
  - Industry e Public Sector vengono **auto-popolati** automaticamente dal cliente (readonly)

- **Description** - Descrizione dettagliata (opzionale)

**Valori Finanziari:**
- **TCV (Total Contract Value)*** - Valore totale contratto in €
  - Range: > €0 e < €1 miliardo
  - ✅ Esempio: 500000 (per €500K)

- **First Margin %*** - Margine iniziale in percentuale
  - Range: 0-100%
  - ✅ Esempio: 25 (per 25%)

**Key Customer Parameters (KCP):**
- **Expected Decision Date*** - Data decisione prevista
- **Expected Signature Date** - Data firma prevista (opzionale)
- **Expected Delivery Start** - Inizio delivery (opzionale)

**Deviazioni:**
- **Has KCP Deviations** - Checkbox se ci sono deviazioni
- **KCP Deviations Detail** - Descrizione deviazioni (obbligatorio se flag attivo)

#### 3. Validazione Automatica

Il form valida in tempo reale:

**Indicatori Visivi:**
- ✅ **Bordo Verde** + Checkmark = Campo valido
- ❌ **Bordo Rosso** + Icona errore = Campo invalido
- **Messaggio errore** sotto il campo

**Error Summary:**
Se ci sono errori, appare un riepilogo in alto con link diretti ai campi problematici.

#### 4. Calcolo RAISE Level

Al momento del salvataggio, il sistema calcola automaticamente:
- **RAISE Level** (L1-L6) basato su TCV e First Margin
- **Fast Track eligibility** (se TCV < €250K e nessuna deviazione)

#### 5. Salvataggio

Click **"Create Opportunity"**:
- Se validazione OK → Opportunità creata, redirect alla dashboard
- Se errori → Error summary visibile, correggere e riprovare

### Esempio Pratico

```
Scenario: Opportunità Cloud Migration €750K

1. Title: "Cloud Migration & Modernization - Acme Corp"
2. Client Name: "Acme Corporation S.p.A."
3. Description: "Migrazione infrastruttura on-premise su AWS con modernizzazione applicazioni legacy"
4. TCV: 750000 (€750K)
5. First Margin %: 28%
6. Expected Decision Date: 2025-02-15
7. Expected Signature Date: 2025-03-01
8. Has KCP Deviations: No

Risultato:
- RAISE Level: L4 (€500K-€1M, 25%-30%)
- Fast Track: No (TCV > €250K)
- Autorizzatore: Area Manager
```

---

## Workflow ATP/ATS/ATC

### Apertura Workflow

1. Dalla dashboard, **click sulla card** dell'opportunità
2. Si apre la vista workflow con tutte le fasi

### Struttura Workflow

#### Header Opportunità

- Titolo e Cliente
- RAISE Level badge
- TCV formattato
- Fast Track badge (se applicabile)

#### Timeline Fasi

Visualizzazione verticale delle fasi con:
- **Icona** (Planning 📋, ATP 🔍, ATS ✍️, ATC ✅, Handover 🚀)
- **Nome fase**
- **Status** (Not Started / In Progress / Completed)
- **Numero checkpoint** (es: "3/5 checkpoints")

#### Checkpoint per Fase

Ogni fase ha checkpoint specifici filtrati per RAISE Level:

**Esempio ATP per L4:**
1. ✅ Technical Feasibility Assessment
2. ✅ Solution Architecture Review
3. ⬜ Pricing & Margin Validation
4. ⬜ Resource Availability Check
5. ⬜ Risk Assessment

**Checkpoint Numbering (NEW v1.1.0):**
- Ogni checkpoint ha un **badge numerico** (1, 2, 3...) all'inizio
- I numeri seguono l'ordine sequenziale definito in Settings
- Facilita riferimento e comunicazione ("Checkpoint #3 completato")

**Come funziona:**
- ⬜ **Unchecked** = Da completare
- ✅ **Checked** = Completato
- Click checkbox per marcare come completato

### Completamento Fase

#### Prerequisiti

Per completare una fase, **tutti i checkpoint devono essere completati**.

#### Procedura

1. Completa tutti i checkpoint (click checkbox)
2. Click pulsante **"Complete [Fase] Phase"**
3. Conferma nella modal di conferma
4. La fase viene marcata ✅ Completed
5. Si passa automaticamente alla fase successiva

#### Loading States

Durante il completamento:
- Pulsante mostra loading spinner
- Fase in processing viene evidenziata
- Toast notification conferma successo

### Navigazione

- **Back to Dashboard** - Torna alla dashboard (pulsante in alto)
- **Scroll verticale** - Scorri tra le fasi
- **Auto-scroll** - Dopo completamento fase, scroll automatico alla successiva

### Fast Track Workflow

Per opportunità Fast Track (TCV < €250K, no deviazioni):

- **Meno checkpoint** per fase
- **Processo semplificato**
- **Autorizzazioni ridotte**
- Badge "Fast Track" visibile

### Stati Fase

| Stato | Icona | Significato |
|-------|-------|-------------|
| **Not Started** | ⬜ | Fase non iniziata |
| **In Progress** | 🔄 | Fase attiva, checkpoint in corso |
| **Completed** | ✅ | Tutti checkpoint completati |

---

## Gestione Checkpoint

### Accesso Settings

1. Click **Settings** nella sidebar
2. Si apre la pagina di configurazione

### Visualizzazione Checkpoint

Tabella con colonne:
- **#** (NEW v1.1.0) - Numero sequenziale checkpoint (1, 2, 3... per fase)
- **ID** - Identificativo univoco
- **Name** - Nome checkpoint
- **Phase** - Fase di appartenenza (Planning/ATP/ATS/ATC/ALL)
- **RAISE Levels** - Livelli applicabilità (badge colorati o "ALL")
- **Description** - Descrizione dettagliata

**Ordinamento:**
- Checkpoint ordinati per **Phase** (Planning → ATP → ATS → ATC → Handover → ALL)
- All'interno di ogni fase, ordinati per **numero sequenziale (#)**

### Filtri

- **Per Fase** - Filtra checkpoint per fase specifica
- **Per RAISE Level** - Mostra solo checkpoint per un level
- **Search** - Ricerca per nome/descrizione

### RAISE Levels Badges

Ogni checkpoint mostra i livelli a cui si applica:

| Badge | Colore | Level |
|-------|--------|-------|
| L1 | Rosso | > €5M, < 15% margin |
| L2 | Arancione | €2M-€5M, 15-20% |
| L3 | Ambra | €1M-€2M, 20-25% |
| L4 | Giallo | €500K-€1M, 25-30% |
| L5 | Lime | €250K-€500K, 30-35% |
| L6 | Verde | < €250K, > 35% |
| ALL | Grigio | Indipendente dal level |

### Checkpoint Speciali - Phase "ALL"

Checkpoint con **Phase: ALL** sono controlli finanziari per autorizzazioni under-margin:

**Esempi:**
- Under-margin VAR < 6%
- Under-margin Services < 12%
- Under-margin Professional Services < 20%

Questi **non sono** checkpoint da completare in tutte le fasi, ma regole di validazione specifiche.

---

## FAQ

### Domande Generali

**Q: Cosa succede se modifico TCV o Margin dopo aver creato l'opportunità?**
A: Il RAISE Level viene ricalcolato automaticamente e i checkpoint vengono aggiornati di conseguenza.

**Q: Posso saltare una fase del workflow?**
A: No, le fasi devono essere completate in ordine sequenziale (Planning → ATP → ATS → ATC → Handover).

**Q: Cosa significa Fast Track?**
A: Opportunità con TCV < €250K senza deviazioni KCP seguono un processo semplificato con meno checkpoint.

### Interfaccia e Lingua (v1.2.0)

**Q: L'interfaccia è completamente in italiano?**
A: Sì! A partire dalla v1.2.0, l'intera interfaccia è tradotta in italiano, inclusi form, messaggi di validazione, notifiche e tutti i testi UI.

**Q: Posso cambiare la lingua dell'interfaccia?**
A: Attualmente l'italiano è l'unica lingua disponibile. Il sistema è stato progettato con architettura i18n per supportare lingue aggiuntive (EN, FR, DE) in futuro.

**Q: Dove trovo la documentazione tecnica sull'i18n?**
A: Gli sviluppatori possono consultare [I18N_GUIDE.md](I18N_GUIDE.md) per informazioni complete sul sistema di internazionalizzazione.

### Gestione Clienti (v1.1.0)

**Q: Devo creare un cliente prima di creare un'opportunità?**
A: No, puoi usare il pulsante "+" verde nel form opportunità per creare un cliente inline senza uscire dal form.

**Q: Cosa succede ai dati se modifico un cliente?**
A: Le opportunità collegate al cliente erediteranno automaticamente i nuovi valori di Industry e Public Sector al prossimo salvataggio.

**Q: Posso eliminare un cliente?**
A: Sì, ma solo se NON ha opportunità collegate. Il sistema protegge la referential integrity e blocca l'eliminazione se ci sono opportunità attive.

**Q: Come faccio a migrare le vecchie opportunità al nuovo sistema clienti?**
A: Crea il cliente corrispondente, modifica l'opportunità, seleziona il cliente dal dropdown, e salva. I campi clientName e industry legacy saranno sostituiti dal customerId.

**Q: I campi Industry e Public Sector sono readonly nelle opportunità. Perché?**
A: Questi campi sono auto-popolati dal cliente selezionato per garantire coerenza. Se vuoi modificarli, devi modificare il cliente stesso.

**Q: Quanti settori industriali sono disponibili?**
A: 10 settori predefiniti: Technology, Manufacturing, Finance, Healthcare, Retail, Energy, Transportation, Public Administration, Telecommunications, Consulting.

### Checkpoint

**Q: Quanti checkpoint devo completare?**
A: Dipende dal RAISE Level. Ogni level ha checkpoint specifici filtrati automaticamente.

**Q: Posso aggiungere checkpoint custom?**
A: Attualmente no. I checkpoint sono gestiti centralmente nella Settings page (solo admin).

**Q: Cosa succede se non completo tutti i checkpoint?**
A: Non puoi passare alla fase successiva finché tutti i checkpoint della fase corrente non sono completati.

### Validazione

**Q: Perché il form non si salva?**
A: Controlla l'Error Summary in alto nel form. Elenca tutti i campi con errori. Click sul link per andare direttamente al campo.

**Q: Come so se un campo è valido?**
A: Bordo verde con checkmark = valido. Bordo rosso con icona errore = invalido.

**Q: Posso salvare una bozza incompleta?**
A: Sì, puoi salvare con status "Draft" anche se alcuni campi opzionali sono vuoti, ma i campi obbligatori devono essere validi.

### Performance

**Q: Perché vedo skeleton cards nella dashboard?**
A: È un loading state mentre l'app carica i dati (300ms). Migliora l'esperienza utente mostrando la struttura della UI.

**Q: L'app funziona offline?**
A: Attualmente no. È richiesta connessione internet per caricare l'applicazione.

### Accessibilità

**Q: L'app supporta keyboard navigation?**
A: Sì! Premi Tab per navigare, Enter per selezionare, Escape per chiudere modal.

**Q: C'è supporto screen reader?**
A: Sì, l'app è WCAG 2.1 AA compliant con ARIA labels e announcements.

### Technical

**Q: Su quali browser funziona?**
A: Chrome, Firefox, Safari, Edge (ultime 2 versioni). Mobile: iOS Safari, Chrome Android.

**Q: I dati sono salvati?**
A: Sì, in localStorage del browser. Se cancelli cache browser, perdi i dati.

**Q: Posso esportare le opportunità?**
A: Funzionalità in roadmap (Q2 2025).

---

## Supporto

### Problemi Comuni

#### 1. Opportunità non si salva

**Soluzione:**
1. Controlla Error Summary
2. Verifica tutti i campi obbligatori (*)
3. Assicurati TCV > 0 e < 1 miliardo
4. Verifica che First Margin % sia 0-100

#### 2. Checkpoint non visibili

**Soluzione:**
1. Verifica RAISE Level opportunità
2. I checkpoint sono filtrati per level
3. Controlla Settings page per vedere tutti i checkpoint disponibili

#### 3. Non riesco a completare fase

**Soluzione:**
1. Verifica che **tutti** i checkbox siano selezionati
2. Il pulsante "Complete Phase" è disabilitato se mancano checkpoint
3. Scroll tutta la fase per assicurarti di non aver perso checkpoint

#### 4. App non carica

**Soluzione:**
1. Forza refresh: Ctrl+Shift+R (Windows) o Cmd+Shift+R (Mac)
2. Svuota cache browser
3. Prova modalità incognito
4. Verifica connessione internet

### Contatti

- **Repository:** [github.com/Raistlin82/lutech-raise-app](https://github.com/Raistlin82/lutech-raise-app)
- **Issues:** [Report bug o richieste feature](https://github.com/Raistlin82/lutech-raise-app/issues)
- **Documentation:** [docs/](../README.md)

---

## Shortcuts

### Keyboard Shortcuts

| Shortcut | Azione |
|----------|--------|
| Tab | Navigazione tra campi |
| Shift + Tab | Navigazione indietro |
| Enter | Conferma/Seleziona |
| Escape | Chiudi modal/dialog |
| Space | Checkbox toggle |
| / | Focus search (quando disponibile) |

### Quick Links

- **Dashboard:** [/](https://raistlin82.github.io/lutech-raise-app/)
- **Customers:** [/customers](https://raistlin82.github.io/lutech-raise-app/customers) **(NEW v1.1.0)**
- **New Opportunity:** [/opportunities/new](https://raistlin82.github.io/lutech-raise-app/opportunities/new)
- **Settings:** [/settings](https://raistlin82.github.io/lutech-raise-app/settings)

---

## Glossary

- **ATP** - Authorization To Proceed (Autorizzazione a Procedere)
- **ATS** - Authorization To Sign (Autorizzazione a Firmare)
- **ATC** - Authorization To Commit (Autorizzazione a Committare)
- **TCV** - Total Contract Value (Valore Totale Contratto)
- **KCP** - Key Customer Parameters (Parametri Chiave Cliente)
- **RAISE Level** - Livello di autorizzazione (L1-L6)
- **Fast Track** - Processo accelerato per opportunità < €250K
- **Checkpoint** - Punto di controllo da completare in una fase
- **Pipeline** - Insieme di tutte le opportunità attive

---

<div align="center">

**[⬆ Torna su](#raise-app---guida-utente)**

Per documentazione tecnica, vedi [README.md](../README.md)

</div>
