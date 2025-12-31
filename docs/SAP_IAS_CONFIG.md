# Guida di Configurazione: SAP IAS + Kyma (Application Side)

Questa guida descrive la configurazione esatta richiesta su **SAP Identity Authentication Service (IAS)** per far funzionare correttamente un'applicazione React (SPA) deployata su **SAP BTP Kyma**, inclusi i flussi di Login e Logout.

> [!IMPORTANT]
> Questa configurazione riguarda l'**autenticazione dell'applicazione** (utenti che accedono alla tua UI), non l'autenticazione amministrativa al cluster Kyma (kubectl).

## 1. Creazione Applicazione su SAP IAS

1.  Accedi alla **Administration Console** di SAP IAS.
2.  Vai su **Applications & Resources** -> **Applications**.
3.  Clicca su **+ Create**.
4.  Inserisci un nome visualizzato (es. `RAISE App Kyma`).
5.  **Enable Protocol**: Seleziona **OpenID Connect**.

## 2. Configurazione OpenID Connect (OIDC)

Nella pagina di dettaglio dell'applicazione creata:

### A. Redirect URIs
Qui devi inserire *tutte* le URL dove la tua applicazione potrebbe 'atterrare' dopo il login.
*   **Per Sviluppo Locale**:
    *   `http://localhost:5173/`
    *   `http://localhost:5173`
*   **Per Produzione (Kyma)**:
    *   `https://<tua-app-kyma-url>/`
    *   `https://<tua-app-kyma-url>`

### B. Post-Logout Redirect URIs (CRUCIALE PER IL LOOP)
Questa sezione è spesso separata o in fondo alla pagina OIDC. Se non la configuri, il logout ti lascerà su una pagina di errore SAP invece di riportarti all'app.
*   Inserisci esattamente le stesse URL delle Redirect URIs:
    *   `http://localhost:5173/`
    *   `https://<tua-app-kyma-url>/`

### C. Client ID
*   Copia il **Client ID** (es. `ae93584a-a420...`).
*   Questo va inserito nel file `.env` o nei Secret di Kubernetes come `VITE_IAS_CLIENT_ID`.

## 3. Client Authentication (Public Client)

Le Single Page Application (React, Angular, Vue) non possono mantenere segreto un "Client Secret". Pertanto, devono essere configurate come **Public Client**.

1.  Vai alla sezione **Client Authentication**.
2.  Trova l'impostazione **Allow Public Client Flows** (o impostazione equivalente "Authentication Method: None").
3.  **Abilitalo**.
    *   *Senza questo, riceverai un errore 401 durante lo scambio del token, perché SAP si aspetterà un secret.*

## 4. API Authentication / Trusted Domains (CORS)

Perché il browser (React) possa chiamare direttamente le API di SAP IAS (per scambiare il codice con il token), SAP deve abilitare il **Cross-Origin Resource Sharing (CORS)** per il tuo dominio.

1.  Vai alla sezione **Security** -> **Trusted Domains** (o **API Authentication** in alcune versioni).
2.  Aggiungi le origini della tua applicazione:
    *   `http://localhost:5173`
    *   `https://<tua-app-kyma-url>`
3.  Seleziona le API consentite (se richiesto): Assicurati che API per **Token Exchange** siano permesse.

## 5. User Attributes (Token Claims)

Per ricevere le informazioni corrette nell'ID Token (nome, email, gruppi):

1.  Vai su **Attributes**.
2.  Assicurati che i seguenti attributi siano mappati nell'Assertion Attribute (Token Claim):
    *   `User.Email` -> `email`
    *   `User.FirstName` -> `given_name`
    *   `User.LastName` -> `family_name`
    *   `Groups` -> `groups`

## 6. Riepilogo Parametri Frontend

Nel tuo codice React (o nel file `.env`), la configurazione deve rispecchiare esattamente quanto sopra:

| Parametro | Valore su IAS |
| :--- | :--- |
| `authority` | URL del tuo tenant (es. `https://<tenant>.accounts.ondemand.com`) |
| `client_id` | Il Client ID copiato al punto 2.C |
| `redirect_uri` | `window.location.origin` |
| `post_logout_redirect_uri` | `window.location.origin` |
| `scope` | `openid profile email` |
| `response_type` | `code` (Standard PKCE) |

---

> [!TIP]
> **Debug**: Se hai problemi, usa i "Developer Tools" del browser (F12) -> Network.
> 1.  Controlla la chiamata `/authorize`: verifica che `redirect_uri` mandato dall'app sia identico carattere per carattere a quello in IAS.
> 2.  Controlla la chiamata `/token`: se fallisce (rosso), guarda la Response. Se dice "CORS", manca il punto 4. Se dice "Unauthorized", manca il punto 3.
