import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for Kyma E2E tests
 *
 * This setup:
 * 1. Opens the app with ?testMode=true query parameter
 * 2. Waits for the app to set sessionStorage
 * 3. Saves the browser storage state for all tests to use
 *
 * This ensures all E2E tests run with mock authentication enabled.
 */
async function globalSetup(config: FullConfig) {
    const baseURL = config.projects[0].use.baseURL || 'https://raise-app.b66a502.kyma.ondemand.com';

    // Remove any existing query params from baseURL
    const cleanBaseURL = baseURL.split('?')[0];

    console.log(`[Global Setup] Initializing test mode on: ${cleanBaseURL}`);

    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to app with testMode=true to initialize sessionStorage
    await page.goto(`${cleanBaseURL}/?testMode=true`, { waitUntil: 'networkidle' });

    // Wait for app to initialize and set sessionStorage
    await page.waitForTimeout(2000);

    // Verify test mode was set in localStorage
    const testModeSet = await page.evaluate(() => {
        return localStorage.getItem('testMode') === 'true';
    });

    if (testModeSet) {
        console.log('[Global Setup] ✅ Test mode enabled successfully in localStorage');
    } else {
        console.log('[Global Setup] ⚠️ Warning: localStorage testMode not found, setting manually');
        await page.evaluate(() => {
            localStorage.setItem('testMode', 'true');
        });
    }

    // Save storage state for tests to use
    await context.storageState({ path: './e2e/.auth/kyma-storage.json' });

    console.log('[Global Setup] ✅ Storage state saved');

    await browser.close();
}

export default globalSetup;
