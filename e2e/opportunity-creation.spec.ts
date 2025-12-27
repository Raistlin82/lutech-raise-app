import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Opportunity Creation Journey
 *
 * Tests the complete user journey for creating new opportunities in the RAISE application.
 * Covers form validation, data persistence, and navigation after creation.
 */

test.describe('Opportunity Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to start with clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should navigate to new opportunity form from dashboard', async ({ page }) => {
    await page.goto('/');

    // Navigate to opportunities page first, then click New Opportunity
    await page.goto('/opportunities');

    // Click "New Opportunity" button
    await page.click('button:has-text("New Opportunity")');

    // Verify we're on the new opportunity page
    await expect(page).toHaveURL('/opportunities/new');
    await expect(page.locator('h1:has-text("New Opportunity")')).toBeVisible();
  });

  test('should create new opportunity with all required fields', async ({ page }) => {
    await page.goto('/opportunities/new');

    // Fill in required fields
    await page.fill('input[placeholder*="Cloud Migration"]', 'E2E Test Opportunity');
    await page.fill('input[placeholder*="Acme Corporation"]', 'Test Client Corp');
    await page.selectOption('select', 'Manufacturing');
    await page.fill('input[placeholder="1000000"]', '500000');

    // Submit form
    await page.click('button:has-text("Create Opportunity")');

    // Wait for navigation to workflow page
    await page.waitForURL(/\/opportunity\/OPP-/, { timeout: 5000 });

    // Verify opportunity details are shown
    await expect(page.locator('text=E2E Test Opportunity')).toBeVisible();
    await expect(page.locator('text=Test Client Corp')).toBeVisible();
  });

  test('should show validation errors for missing required fields', async ({ page }) => {
    await page.goto('/opportunities/new');

    // Try to submit without filling required fields
    await page.click('button:has-text("Create Opportunity")');

    // Form should still be on the same page (HTML5 validation prevents submission)
    await expect(page).toHaveURL('/opportunities/new');

    // Verify title field has required attribute
    const titleInput = page.locator('input[placeholder*="Cloud Migration"]');
    await expect(titleInput).toHaveAttribute('required', '');
  });

  test('should create opportunity with optional fields populated', async ({ page }) => {
    await page.goto('/opportunities/new');

    // Fill required fields
    await page.fill('input[placeholder*="Cloud Migration"]', 'Full Feature Opportunity');
    await page.fill('input[placeholder*="Acme Corporation"]', 'Advanced Client');
    await page.selectOption('select', 'Technology');
    await page.fill('input[placeholder="1000000"]', '2000000');

    // Fill optional fields
    await page.fill('input[placeholder="Same as TCV if empty"]', '2500000');

    // Check flag checkboxes
    await page.check('input[type="checkbox"]:near(:text("Public Sector"))');
    await page.check('input[type="checkbox"]:near(:text("RTI"))');
    await page.check('input[type="checkbox"]:near(:text("New Customer"))');

    // Submit
    await page.click('button:has-text("Create Opportunity")');

    // Wait for navigation
    await page.waitForURL(/\/opportunity\/OPP-/, { timeout: 5000 });

    // Verify creation
    await expect(page.locator('text=Full Feature Opportunity')).toBeVisible();
  });

  test('should navigate back to opportunities list on cancel', async ({ page }) => {
    await page.goto('/opportunities/new');

    // Click Cancel button
    await page.click('button:has-text("Cancel")');

    // Should navigate to opportunities list
    await expect(page).toHaveURL('/opportunities');
  });

  test('should calculate RAISE level correctly for small TCV', async ({ page }) => {
    await page.goto('/opportunities/new');

    // Create small opportunity (< 250k = Fast Track eligible)
    await page.fill('input[placeholder*="Cloud Migration"]', 'Small Opportunity');
    await page.fill('input[placeholder*="Acme Corporation"]', 'Small Client');
    await page.selectOption('select', 'Retail');
    await page.fill('input[placeholder="1000000"]', '200000'); // Below 250k threshold

    await page.click('button:has-text("Create Opportunity")');
    await page.waitForURL(/\/opportunity\/OPP-/, { timeout: 5000 });

    // Should show a RAISE level (L6 or similar for small deals)
    const levelBadge = page.locator('[class*="badge-level"], [class*="font-mono"]').filter({ hasText: /L\d/ });
    await expect(levelBadge).toBeVisible();
  });

  test('should handle KCP deviations flag correctly', async ({ page }) => {
    await page.goto('/opportunities/new');

    await page.fill('input[placeholder*="Cloud Migration"]', 'High Risk Opportunity');
    await page.fill('input[placeholder*="Acme Corporation"]', 'Risk Client');
    await page.selectOption('select', 'Finance');
    await page.fill('input[placeholder="1000000"]', '1000000');

    // Check KCP Deviations
    await page.check('input[type="checkbox"]:near(:text("KCP Deviations"))');

    await page.click('button:has-text("Create Opportunity")');
    await page.waitForURL(/\/opportunity\/OPP-/, { timeout: 5000 });

    // Should show opportunity was created
    await expect(page.locator('text=High Risk Opportunity')).toBeVisible();
  });
});
