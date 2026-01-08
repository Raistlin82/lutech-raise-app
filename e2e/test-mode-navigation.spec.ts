import { test, expect } from '@playwright/test';

test.describe('Propagazione della Modalità Test', () => {
  test('dovrebbe mantenere lo stato di autenticazione durante la navigazione', async ({ page }) => {
    // Il global setup ci ha già messi in modalità test. Iniziamo dalla root.
    await page.goto('/');

    // Definiamo il locator per il bottone di logout per riutilizzarlo.
    const logoutButton = page.getByRole('button', { name: 'Esci' });

    // 1. Verifica sulla pagina principale (Dashboard)
    await expect(logoutButton).toBeVisible();
    await expect(page).toHaveURL('/');
    console.log('[Test di Navigazione] Verifica su / superata.');

    // 2. Naviga alla pagina Opportunità e verifica
    // Usiamo il link nella sidebar di navigazione.
    await page.getByRole('link', { name: 'Opportunità' }).click();
    await expect(page).toHaveURL(/.*opportunities/);
    await expect(logoutButton).toBeVisible();
    console.log('[Test di Navigazione] Verifica su /opportunities superata.');

    // 3. Naviga alla pagina Clienti e verifica
    await page.getByRole('link', { name: 'Clienti' }).click();
    await expect(page).toHaveURL(/.*customers/);
    await expect(logoutButton).toBeVisible();
    console.log('[Test di Navigazione] Verifica su /customers superata.');

    // 4. Esegui un ricaricamento completo della pagina e verifica di nuovo
    console.log('[Test di Navigazione] Eseguo un reload della pagina...');
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/.*customers/);
    await expect(logoutButton).toBeVisible();
    console.log('[Test di Navigazione] Verifica dopo il reload superata.');

    // 5. Controlla il localStorage per sicurezza
    const testModeInStorage = await page.evaluate(() => localStorage.getItem('testMode'));
    expect(testModeInStorage).toBe('true');
    console.log('[Test di Navigazione] Il flag testMode è presente nel localStorage.');
  });
});
