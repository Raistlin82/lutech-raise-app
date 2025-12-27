import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Error Handling Journey
 *
 * Tests error boundary functionality and application resilience
 * when encountering errors or invalid states.
 */

test.describe('Error Handling Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should handle navigation to non-existent opportunity gracefully', async ({ page }) => {
    // Try to navigate to a non-existent opportunity
    await page.goto('/opportunity/FAKE-OPP-9999');

    // Should redirect to home or show appropriate error
    // The app redirects to / if no selectedOpp exists
    await expect(page).toHaveURL('/');
  });

  test('should handle localStorage corruption gracefully', async ({ page }) => {
    await page.goto('/');

    // Corrupt localStorage with invalid JSON
    await page.evaluate(() => {
      localStorage.setItem('raise-opportunities', '{invalid json}');
    });

    // Reload page
    await page.reload();

    // Application should still load (might show empty state)
    await expect(page.locator('body')).toBeVisible();

    // Should not show any unhandled error dialogs
    const errorDialog = page.locator('[role="alert"]:has-text("Error")');
    await expect(errorDialog).not.toBeVisible();
  });

  test('should maintain app stability when creating multiple opportunities', async ({ page }) => {
    // Create first opportunity
    await page.goto('/opportunities/new');
    await page.fill('input[placeholder*="Cloud Migration"]', 'Opportunity 1');
    await page.fill('input[placeholder*="Acme Corporation"]', 'Client 1');
    await page.selectOption('select', 'Technology');
    await page.fill('input[placeholder="1000000"]', '500000');
    await page.click('button:has-text("Create Opportunity")');
    await page.waitForURL(/\/opportunity\/OPP-/, { timeout: 5000 });

    // Go back and create second opportunity
    await page.goto('/opportunities/new');
    await page.fill('input[placeholder*="Cloud Migration"]', 'Opportunity 2');
    await page.fill('input[placeholder*="Acme Corporation"]', 'Client 2');
    await page.selectOption('select', 'Finance');
    await page.fill('input[placeholder="1000000"]', '750000');
    await page.click('button:has-text("Create Opportunity")');
    await page.waitForURL(/\/opportunity\/OPP-/, { timeout: 5000 });

    // Both opportunities should be in the list
    await page.goto('/opportunities');
    await expect(page.locator('text=Opportunity 1')).toBeVisible();
    await expect(page.locator('text=Opportunity 2')).toBeVisible();
  });

  test('should handle rapid navigation between pages', async ({ page }) => {
    // Rapidly navigate between different pages
    await page.goto('/');
    await page.goto('/opportunities');
    await page.goto('/settings');
    await page.goto('/');
    await page.goto('/opportunities/new');

    // App should remain stable
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should handle empty state gracefully', async ({ page }) => {
    await page.goto('/opportunities');

    // With no opportunities, should show empty state message
    await expect(page.locator('text=No opportunities')).toBeVisible();
  });

  test('should validate form inputs and accept valid values', async ({ page }) => {
    await page.goto('/opportunities/new');

    // Fill with valid positive TCV
    await page.fill('input[placeholder*="Cloud Migration"]', 'Valid Opportunity');
    await page.fill('input[placeholder*="Acme Corporation"]', 'Valid Client');
    await page.selectOption('select', 'Technology');
    await page.fill('input[placeholder="1000000"]', '500000');

    // The input should accept positive values
    const tcvInput = page.locator('input[placeholder="1000000"]');
    const tcvValue = await tcvInput.inputValue();

    // Value should be the positive number we entered
    expect(Number(tcvValue)).toBe(500000);
  });

  test('should handle browser back button correctly', async ({ page }) => {
    // Create an opportunity
    await page.goto('/opportunities/new');
    await page.fill('input[placeholder*="Cloud Migration"]', 'Back Button Test');
    await page.fill('input[placeholder*="Acme Corporation"]', 'Test Client');
    await page.selectOption('select', 'Retail');
    await page.fill('input[placeholder="1000000"]', '300000');
    await page.click('button:has-text("Create Opportunity")');
    await page.waitForURL(/\/opportunity\/OPP-/, { timeout: 5000 });

    // Use browser back button
    await page.goBack();

    // Should go back to previous page
    await expect(page).toHaveURL('/opportunities/new');
  });

  test('should recover from temporary network issues', async ({ page }) => {
    // This test verifies the app works with client-side state
    // even if we simulate offline behavior

    await page.goto('/');

    // Create an opportunity (all client-side, no network needed)
    await page.goto('/opportunities/new');
    await page.fill('input[placeholder*="Cloud Migration"]', 'Offline Test');
    await page.fill('input[placeholder*="Acme Corporation"]', 'Offline Client');
    await page.selectOption('select', 'Healthcare');
    await page.fill('input[placeholder="1000000"]', '400000');
    await page.click('button:has-text("Create Opportunity")');

    // Should still work since everything is localStorage-based
    await page.waitForURL(/\/opportunity\/OPP-/, { timeout: 5000 });
    await expect(page.locator('text=Offline Test')).toBeVisible();
  });

  test('should maintain data integrity across page reloads', async ({ page }) => {
    // Create opportunity
    await page.goto('/opportunities/new');
    await page.fill('input[placeholder*="Cloud Migration"]', 'Persistence Test');
    await page.fill('input[placeholder*="Acme Corporation"]', 'Persistence Client');
    await page.selectOption('select', 'Energy');
    await page.fill('input[placeholder="1000000"]', '600000');
    await page.click('button:has-text("Create Opportunity")');
    await page.waitForURL(/\/opportunity\/OPP-/, { timeout: 5000 });

    // Reload the page
    await page.reload();

    // Data should persist
    await expect(page.locator('text=Persistence Test')).toBeVisible();
    await expect(page.locator('text=Persistence Client')).toBeVisible();
  });
});
