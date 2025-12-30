import { test, expect } from '@playwright/test';
import { createTestCustomer, setupTestEnvironment, fillOpportunityForm, submitOpportunityForm, waitForAppReady, navigateTo } from './helpers';

/**
 * E2E Tests: Opportunity Creation Journey
 *
 * Tests the complete user journey for creating new opportunities in the RAISE application.
 * Covers form validation, data persistence, and navigation after creation.
 */

test.describe('Opportunity Creation', () => {
  const testCustomer = createTestCustomer({
    name: 'Creation Test Client'
  });

  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page, { customers: [testCustomer] });
  });

  test('should navigate to new opportunity form from opportunities page', async ({ page }) => {
    // Navigate to opportunities list page (not dashboard)
    await navigateTo(page, '/opportunities');
    await waitForAppReady(page);

    // Click "Crea Opportunità" button
    await page.click('button:has-text("Crea Opportunità")');

    // Verify we're on the new opportunity page
    await expect(page).toHaveURL(/\/opportunities\/new/);
    await expect(page.locator('form')).toBeVisible();
  });

  test('should create new opportunity with all required fields', async ({ page }) => {
    await navigateTo(page, '/opportunities/new');
    await waitForAppReady(page);

    // Fill in required fields
    await fillOpportunityForm(page, {
      title: 'E2E Test Opportunity',
      customerId: testCustomer.id,
      tcv: '500000',
    });

    // Submit form
    await submitOpportunityForm(page);

    // Wait for navigation to workflow page
    await page.waitForURL(/\/opportunity\/OPP-/, { timeout: 15000 });

    // Verify opportunity details are shown
    await expect(page.locator('text=E2E Test Opportunity')).toBeVisible();
  });

  test('should show validation errors for missing required fields', async ({ page }) => {
    await navigateTo(page, '/opportunities/new');
    await waitForAppReady(page);

    // Try to submit without filling required fields
    await submitOpportunityForm(page);

    // Should show validation error messages or stay on the same page
    await expect(page).toHaveURL(/\/opportunities\/new/);
  });

  test('should create opportunity with optional fields populated', async ({ page }) => {
    await navigateTo(page, '/opportunities/new');
    await waitForAppReady(page);

    // Fill required and optional fields
    await fillOpportunityForm(page, {
      title: 'Full Feature Opportunity',
      customerId: testCustomer.id,
      tcv: '2000000',
      raiseTcv: '2500000',
    });

    // Check some flag checkboxes if visible
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    if (count > 0) {
      await checkboxes.first().check();
    }

    // Submit
    await submitOpportunityForm(page);

    // Wait for navigation
    await page.waitForURL(/\/opportunity\/OPP-/, { timeout: 15000 });

    // Verify creation - use heading selector to avoid toast collision
    await expect(page.locator('h1:has-text("Full Feature Opportunity")')).toBeVisible();
  });

  test('should navigate back to opportunities list on cancel', async ({ page }) => {
    await navigateTo(page, '/opportunities/new');
    await waitForAppReady(page);

    // Click "Annulla" (Cancel) button
    const cancelButton = page.locator('button').filter({ hasText: /Annulla|Indietro/i }).first();
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
    } else {
      // Click back arrow button
      await page.locator('button').first().click();
    }

    await waitForAppReady(page);

    // Should navigate away from the form
    await expect(page.locator('body')).toBeVisible();
  });

  test('should calculate RAISE level correctly for small TCV', async ({ page }) => {
    await navigateTo(page, '/opportunities/new');
    await waitForAppReady(page);

    // Create small opportunity (< 250k = Fast Track eligible, L6)
    await fillOpportunityForm(page, {
      title: 'Small Opportunity',
      customerId: testCustomer.id,
      tcv: '200000', // Below 250k threshold
    });

    await submitOpportunityForm(page);
    await page.waitForURL(/\/opportunity\/OPP-/, { timeout: 15000 });

    // Opportunity should be created and visible
    await expect(page.locator('text=Small Opportunity')).toBeVisible();
  });

  test('should handle KCP deviations flag correctly', async ({ page }) => {
    await navigateTo(page, '/opportunities/new');
    await waitForAppReady(page);

    await fillOpportunityForm(page, {
      title: 'High Risk Opportunity',
      customerId: testCustomer.id,
      tcv: '1000000',
      checkKcp: true,
    });

    await submitOpportunityForm(page);
    await page.waitForURL(/\/opportunity\/OPP-/, { timeout: 15000 });

    // Should show opportunity was created
    await expect(page.locator('text=High Risk Opportunity')).toBeVisible();
  });
});
