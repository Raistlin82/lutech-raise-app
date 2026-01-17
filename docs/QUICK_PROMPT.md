# Quick Prompt - Nuova App SAP BTP Kyma

Copia e incolla questo prompt, modificando solo le parti tra `[...]`:

---

```
Crea un'applicazione [NOME_APP] per [DESCRIZIONE_SCOPO].

## Stack Tecnico (non modificare)
- Frontend: React 18 + TypeScript strict + Vite 5 + Tailwind CSS
- State: Zustand
- Validation: Zod
- i18n: i18next (italiano)
- Auth: SAP IAS via OIDC (oidc-client-ts + react-oidc-context)
- Database: [Supabase | PostgreSQL BTP]
- Container: Docker multi-stage + nginx
- Deploy: SAP BTP Kyma
- CI/CD: GitHub Actions

## Architettura (non modificare)
- Repository Pattern per data access type-safe
- Service Layer per business logic
- Zustand stores per stato globale
- Error Boundaries per gestione errori
- Lazy loading per code splitting

## Testing (non modificare)
- Unit: Vitest + jsdom, coverage >70% per services
- E2E: Playwright su Kyma production
- Pattern: test file accanto ai sorgenti (.test.ts)

## DevOps (non modificare)
- GitHub Actions: test → build-push → deploy-kyma
- Kubernetes: Deployment + Service + APIRule (Kustomize)
- Secrets: GitHub Secrets + K8s Secrets
- Docker: node:20-alpine builder → nginx:alpine runtime

## Sicurezza (non modificare)
- TypeScript strict, no any
- Zod validation su tutti gli input
- Security headers in nginx
- HTTPS via Istio
- Secrets mai in codice

## Struttura Directory (non modificare)
src/
├── api/           # API clients
├── components/    # React components (common/, layout/, [feature]/)
├── hooks/         # Custom hooks
├── i18n/          # Translations
├── lib/           # Utilities
├── pages/         # Route pages
├── repositories/  # Data access layer
├── services/      # Business logic
├── stores/        # Zustand stores
└── types/         # TypeScript types

## Funzionalità Richieste
1. [Funzionalità 1]
2. [Funzionalità 2]
3. [Funzionalità 3]
...

## Entità/Modelli Dati
- [Entità 1]: [campi principali]
- [Entità 2]: [campi principali]
...

## Note Aggiuntive
[Eventuali requisiti specifici, integrazioni, vincoli]
```

---

## Esempio Compilato

```
Crea un'applicazione "Ticket Manager" per gestione ticket di supporto IT.

## Stack Tecnico (non modificare)
[... come sopra ...]

## Funzionalità Richieste
1. Dashboard con lista ticket e filtri per stato/priorità
2. Creazione nuovo ticket con form validato
3. Dettaglio ticket con timeline commenti
4. Assegnazione ticket a operatori
5. Cambio stato (Aperto → In Lavorazione → Risolto → Chiuso)
6. Export lista ticket in CSV
7. Notifiche toast per azioni

## Entità/Modelli Dati
- Ticket: id, titolo, descrizione, stato, priorità, createdAt, assignedTo, customerId
- Customer: id, nome, email, telefono
- Comment: id, ticketId, testo, authorId, createdAt
- User: id, nome, email, ruolo (admin/operator)

## Note Aggiuntive
- Priorità: Low, Medium, High, Critical
- Stati: open, in_progress, resolved, closed
- Solo admin può eliminare ticket
```
