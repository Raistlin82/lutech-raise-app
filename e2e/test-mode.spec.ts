import { test, expect } from '@playwright/test';
import { reloadWithTestMode } from './helpers';

test.describe('Verifica della Modalità Test', () => {
  test('dovrebbe mostrare il pulsante di logout e il messaggio di test nella console', async ({ page }) => {
    // Andiamo prima alla radice per garantire che l'app si inizializzi correttamente in modalità test.
    await page.goto('/');

    // Ora navighiamo cliccando sul link, come farebbe un utente,
    // che corrisponde al comportamento del test che ha avuto successo.
    await page.getByRole('link', { name: 'Opportunità' }).click();

    // 1. Verifica che siamo sulla pagina corretta e non reindirizzati al login.
    await expect(page).toHaveURL(/.*opportunities/);

    // 2. Verifica che il pulsante di logout sia visibile.
    // Il testo "Esci" viene dal file di traduzione it/common.json per la chiave "auth.logout".
    await expect(page.getByRole('button', { name: 'Esci' })).toBeVisible();

    // 3. Verifica che il messaggio di conferma della modalità test sia presente nella console del browser.
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      // Filtriamo solo i messaggi rilevanti per evitare rumore.
      if (msg.text().includes('TEST MODE')) {
        consoleLogs.push(msg.text());
      }
    });

    // Ricarichiamo la pagina per catturare i log iniziali che vengono stampati da main.tsx.
    await reloadWithTestMode(page);

    // Usiamo expect.poll per attendere che il messaggio appaia, dato che potrebbe non essere immediato.
    await expect.poll(() => consoleLogs.join('\n')).toContain('🧪 Running in TEST MODE with mock authentication');
  });

  test('dovrebbe funzionare anche navigando a un\'altra pagina protetta', async ({ page }) => {
    // Questo test verifica che la soluzione sia generica.
    await page.goto('/');

    // Naviga a un'altra pagina protetta, es. Impostazioni
    await page.getByRole('link', { name: 'Impostazioni' }).click();

    // Verifica che siamo loggati
    await expect(page).toHaveURL(/.*settings/);
    await expect(page.getByRole('button', { name: 'Esci' })).toBeVisible();
  });

  test('dovrebbe gestire il click sul pulsante di logout senza errori', async ({ page }) => {
    // In modalità test, il logout non fa nulla, ma non deve rompere l'app.
    await page.goto('/');

    const logoutButton = page.getByRole('button', { name: 'Esci' });
    await expect(logoutButton).toBeVisible();

    // Clicca su "Esci"
    await logoutButton.click();

    // L'app dovrebbe rimanere stabile e il pulsante di logout ancora visibile,
    // perché la funzione di logout mock è vuota e lo stato non cambia.
    await expect(logoutButton).toBeVisible();
    await expect(page.locator('text=Accedi con SAP IAS')).not.toBeVisible();
  });
});
