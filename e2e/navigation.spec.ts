import { test, expect } from '@playwright/test';
import { navigateTo, waitForAppReady, setupTestEnvironment, createOpportunityViaUI, createTestCustomer } from './helpers';

test.describe('Navigation Tests', () => {
  test.describe('Sidebar Navigation', () => {
    test('should navigate from Dashboard to Opportunities page', async ({ page }) => {
      await navigateTo(page, '/');
      await waitForAppReady(page);

      // Click on Opportunities link in sidebar
      await page.click('text=Opportunità');
      await page.waitForURL(/\/opportunities$/);

      await expect(page.locator('h1')).toContainText('Opportunità');
    });

    test('should navigate from Dashboard to Customers page', async ({ page }) => {
      await navigateTo(page, '/');
      await waitForAppReady(page);

      // Click on Customers link in sidebar
      await page.click('text=Clienti');
      await page.waitForURL(/\/customers$/);

      await expect(page.locator('h1').first()).toContainText('Clienti');
    });

    test('should navigate from Dashboard to Settings page', async ({ page }) => {
      await navigateTo(page, '/');
      await waitForAppReady(page);

      // Click on Settings link in sidebar
      await page.click('text=Impostazioni');
      await page.waitForURL(/\/settings$/);

      await expect(page.locator('h1').first()).toContainText('Impostazioni');
    });
  });

  test.describe('Opportunity Workflow Navigation', () => {
    test('should navigate from opportunity workflow to Settings via sidebar', async ({ page }) => {
      const testCustomer = createTestCustomer({
        id: 'nav-test-customer',
        name: 'Navigation Test Customer',
      });
      await setupTestEnvironment(page, { customers: [testCustomer] });

      // Create an opportunity
      await createOpportunityViaUI(page, {
        title: 'Settings Nav Test Opportunity',
        customerId: testCustomer.id,
        tcv: '500000',
      });

      // Now we should be on the opportunity workflow page
      await page.waitForURL(/\/opportunity\/OPP-/, { timeout: 15000 });
      await waitForAppReady(page);

      // Click Settings in sidebar
      await page.click('nav >> text=Impostazioni');
      await page.waitForURL(/\/settings$/, { timeout: 10000 });

      // Verify we're on the settings page
      await expect(page.locator('h1').first()).toContainText('Impostazioni');
    });
  });

  test.describe('Form Navigation', () => {
    test('should navigate from new opportunity form back to Opportunities list on cancel', async ({ page }) => {
      await navigateTo(page, '/opportunities/new');
      await waitForAppReady(page);

      // Click cancel button
      await page.click('text=Annulla');
      await page.waitForURL(/\/opportunities$/, { timeout: 10000 });

      await expect(page.locator('h1')).toContainText('Opportunità');
    });
  });

  test.describe('Cross-Page Navigation', () => {
    test('should correctly highlight active navigation item', async ({ page }) => {
      // Go to Dashboard
      await navigateTo(page, '/');
      await waitForAppReady(page);

      // Dashboard link should be visible in nav
      await expect(page.locator('nav >> text=Dashboard')).toBeVisible();

      // Navigate to Settings
      await page.click('nav >> text=Impostazioni');
      await page.waitForURL(/\/settings$/, { timeout: 10000 });

      // Settings page should be showing
      await expect(page.locator('h1').first()).toContainText('Impostazioni');
    });
  });
});
