# IAS & Security Integration Guide

---
**Standard SAP Enterprise Authentication**
- **Protocollo:** OpenID Connect (OIDC) + PKCE
- **Provider:** SAP Identity Authentication Service (IAS)
- **Compliance:** SOC2 / GDPR / Enterprise SSO
---

## 1. Architettura di Sicurezza

Il sistema RAISE implementa un'architettura di sicurezza **Zero-Trust** basata su token di identità emessi da SAP IAS. L'integrazione garantisce che solo gli utenti autorizzati nell'ecosistema Lutech possano accedere ai dati sensibili delle opportunità.

### Componenti Chiave
- **SAP IAS:** Identity Provider (IdP) centralizzato.
- **PKCE Flow:** Proof Key for Code Exchange (sicurezza potenziata per SPA).
- **Session Management:** Refresh automatico dei token per una user experience fluida.

---

## 2. Configurazione SAP IAS

Per abilitare l'autenticazione, il tenant IAS deve essere configurato con i seguenti parametri.

### 2.1. Creazione Applicazione
1. Accedi alla **IAS Administration Console**.
2. **Applications & Resources** → **Applications** → **+ Create**.
3. Nome: `RAISE App (Production)`.
4. Protocol: **OpenID Connect**.

### 2.2. OIDC Endpoints & Redirects
Configura le URL di atterraggio per evitare attacchi di tipo redirect:

| Ambiente | Redirect URI | Post-Logout Redirect URI |
| :--- | :--- | :--- |
| **Locale** | `http://localhost:5173/` | `http://localhost:5173/` |
| **Produzione** | `https://raise-app.YOUR_CLUSTER.kyma.ondemand.com/` | `https://raise-app.YOUR_CLUSTER.kyma.ondemand.com/` |

### 2.3. Authentication Method
Poiché React è una Single Page Application (SPA):
- Imposta **Client Authentication** su **None** (Public Client).
- Abilita **Allow Public Client Flows**.

> [!CAUTION]
> Non utilizzare mai Client Secret in un'applicazione frontend, poiché verrebbe esposto nel codice sorgente del browser.

---

## 3. Implementazione Frontend

L'integrazione è gestita tramite `react-oidc-context` e configurata in `src/main.tsx`.

### 3.1. Variabili d'Ambiente (.env)
```env
VITE_IAS_AUTHORITY=https://YOUR_IAS_TENANT.accounts.ondemand.com
VITE_IAS_CLIENT_ID=YOUR_CLIENT_ID_HERE
VITE_BASE_PATH=/
```

### 3.2. Lifecycle dell'Autenticazione
1. **Discovery:** L'app scarica i metadati OIDC dall'authority.
2. **Challenge:** Generazione codice verifier e challenge per PKCE.
3. **Redirect:** L'utente esegue il login sul portale SAP.
4. **Exchange:** L'app riceve l'Authorization Code e lo scambia per i token (ID + Access).

---

## 4. Troubleshooting & Debug

In caso di errori durante il login, verificare i seguenti punti:

- **Errore 401 (Unauthorized):** Verifica che "Public Client" sia abilitato su IAS.
- **Redirect Mismatch:** La Redirect URI deve corrispondere *carattere per carattere* a quella inviata dall'app.
- **CORS Issues:** Assicurati che `http://localhost:5173` sia presente nei **Trusted Domains** su IAS.

---

**Fine Documento**
"Security is not a feature, it's a foundation."
