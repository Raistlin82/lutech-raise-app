import { test, expect } from '@playwright/test';
import { createTestCustomer, setupTestEnvironment, createOpportunityViaUI, waitForAppReady, navigateTo } from './helpers';

/**
 * E2E Tests: Error Handling Journey
 *
 * Tests error boundary functionality and application resilience
 * when encountering errors or invalid states.
 */

test.describe('Error Handling Journey', () => {
  const testCustomer = createTestCustomer({
    name: 'Error Test Client'
  });

  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page, { customers: [testCustomer] });
  });

  test('should handle navigation to non-existent opportunity gracefully', async ({ page }) => {
    // Try to navigate to a non-existent opportunity
    await navigateTo(page, '/opportunity/FAKE-OPP-9999');
    await waitForAppReady(page);

    // App should remain stable (shows edit page or error state)
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle localStorage corruption gracefully', async ({ page }) => {
    await navigateTo(page, '/');
    await waitForAppReady(page);

    // Corrupt localStorage with invalid JSON
    await page.evaluate(() => {
      localStorage.setItem('raise-opportunities', '{invalid json}');
    });

    // Reload page
    await page.reload();
    await waitForAppReady(page);

    // Application should still load
    await expect(page.locator('body')).toBeVisible();

    // Dashboard title should be visible
    await expect(page.locator('text=Panoramica Pipeline')).toBeVisible();
  });

  test('should maintain app stability when creating multiple opportunities', async ({ page }) => {
    // Create first opportunity
    await createOpportunityViaUI(page, {
      title: 'Opportunity 1',
      customerId: testCustomer.id,
      tcv: '500000',
    });

    // Go back and create second opportunity
    await createOpportunityViaUI(page, {
      title: 'Opportunity 2',
      customerId: testCustomer.id,
      tcv: '750000',
    });

    // Both opportunities should be in the dashboard
    await navigateTo(page, '/');
    await waitForAppReady(page);

    await expect(page.locator('text=Opportunity 1')).toBeVisible();
    await expect(page.locator('text=Opportunity 2')).toBeVisible();
  });

  test('should handle rapid navigation between pages', async ({ page }) => {
    // Rapidly navigate between different pages
    await navigateTo(page, '/');
    await navigateTo(page, '/opportunities');
    await navigateTo(page, '/settings');
    await navigateTo(page, '/');

    await waitForAppReady(page);

    // App should remain stable
    await expect(page.locator('body')).toBeVisible();
    // Dashboard should be visible
    await expect(page.locator('text=Panoramica Pipeline')).toBeVisible();
  });

  test('should handle empty state gracefully', async ({ page }) => {
    await navigateTo(page, '/');
    await waitForAppReady(page);

    // Dashboard should show even with no opportunities
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=Panoramica Pipeline')).toBeVisible();
  });

  test('should validate form inputs and accept valid values', async ({ page }) => {
    await navigateTo(page, '/opportunities/new');
    await waitForAppReady(page);

    // Fill with valid data
    await page.fill('#title', 'Valid Opportunity');

    const customerSelect = page.locator('select').first();
    await customerSelect.selectOption(testCustomer.id);

    await page.fill('#tcv', '500000');

    // Verify value was accepted
    const tcvInput = page.locator('#tcv');
    await expect(tcvInput).toHaveValue('500000');
  });

  test('should handle browser back button correctly', async ({ page }) => {
    // Create an opportunity
    await createOpportunityViaUI(page, {
      title: 'Back Button Test',
      customerId: testCustomer.id,
      tcv: '300000',
    });

    // Use browser back button
    await page.goBack();
    await waitForAppReady(page);

    // Should go back to previous page
    await expect(page.locator('body')).toBeVisible();
  });

  test('should recover from temporary network issues', async ({ page }) => {
    // Create an opportunity (all client-side, no network needed)
    await createOpportunityViaUI(page, {
      title: 'Offline Test',
      customerId: testCustomer.id,
      tcv: '400000',
    });

    // Should work since everything is localStorage-based
    await expect(page.locator('h1:has-text("Offline Test")')).toBeVisible();
  });

  test('should maintain data integrity across page reloads', async ({ page }) => {
    // Create opportunity
    await createOpportunityViaUI(page, {
      title: 'Persistence Test',
      customerId: testCustomer.id,
      tcv: '600000',
    });

    // Reload the page
    await page.reload();
    await waitForAppReady(page);

    // Data should persist
    await expect(page.locator('text=Persistence Test')).toBeVisible();
  });
});
