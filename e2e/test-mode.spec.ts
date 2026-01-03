import { test, expect } from '@playwright/test';

test.describe('Verifica della Modalità Test', () => {
  test('dovrebbe mostrare il pulsante di logout e il messaggio di test nella console', async ({ page }) => {
    // Il global setup dovrebbe aver già gestito l'autenticazione.
    // Andiamo a una rotta protetta per verificare.
    await page.goto('/opportunities');

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
    await page.reload();

    // Usiamo expect.poll per attendere che il messaggio appaia, dato che potrebbe non essere immediato.
    await expect.poll(() => consoleLogs.join('\n')).toContain('🧪 Running in TEST MODE with mock authentication');
  });
});
