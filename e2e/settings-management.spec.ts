import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Settings Management Journey
 *
 * Tests the settings page functionality including viewing controls,
 * adding new controls, editing existing ones, and resetting to defaults.
 */

test.describe('Settings Management Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should navigate to settings page', async ({ page }) => {
    await page.goto('/');

    // Click settings link in navigation
    await page.click('a[href="/settings"], button:has-text("Settings")');

    // Verify we're on settings page
    await expect(page).toHaveURL('/settings');
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
  });

  test('should display controls table with data', async ({ page }) => {
    await page.goto('/settings');

    // Verify table headers are visible
    await expect(page.locator('th:has-text("Phase")')).toBeVisible();
    await expect(page.locator('th:has-text("Label")')).toBeVisible();
    await expect(page.locator('th:has-text("Description")')).toBeVisible();
    await expect(page.locator('th:has-text("Mandatory")')).toBeVisible();

    // Verify at least one control row exists
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  test('should show controls for different phases', async ({ page }) => {
    await page.goto('/settings');

    // Should display controls from various phases
    // Check if at least some phase badges are visible
    const phaseBadges = page.locator('tbody td span').filter({ hasText: /Planning|ATP|ATS|ATC|Handover/ });
    await expect(phaseBadges.first()).toBeVisible();
  });

  test('should display mandatory status for controls', async ({ page }) => {
    await page.goto('/settings');

    // Look for YES/NO indicators in mandatory column
    const mandatoryCell = page.locator('tbody td').filter({ hasText: /YES|NO/ }).first();
    await expect(mandatoryCell).toBeVisible();
  });

  test('should have action buttons visible for controls', async ({ page }) => {
    await page.goto('/settings');

    // Wait for table to load
    await page.waitForSelector('tbody tr');

    // Action buttons should be present in the last column
    // Look for buttons in the actions column (contains Edit2 and Trash2 icons)
    const actionButtons = page.locator('tbody tr').first().locator('td').last().locator('button');

    // Should have at least one action button (edit or delete)
    await expect(actionButtons.first()).toBeVisible();
  });

  test('should have Add Control button', async ({ page }) => {
    await page.goto('/settings');

    // Verify Add Control button exists
    const addButton = page.locator('button:has-text("Add Control")');
    await expect(addButton).toBeVisible();
  });

  test('should have Reset Defaults button', async ({ page }) => {
    await page.goto('/settings');

    // Verify Reset Defaults button exists
    const resetButton = page.locator('button:has-text("Reset Defaults")');
    await expect(resetButton).toBeVisible();
  });

  test('should display control descriptions', async ({ page }) => {
    await page.goto('/settings');

    // Get first control row
    const firstRow = page.locator('tbody tr').first();

    // Should have label and description
    const label = firstRow.locator('td').nth(1);
    const description = firstRow.locator('td').nth(2);

    await expect(label).not.toBeEmpty();
    await expect(description).toBeVisible();
  });

  test('should show phase-specific color coding', async ({ page }) => {
    await page.goto('/settings');

    // Phase badges should have colored backgrounds
    const phaseBadge = page.locator('tbody span').filter({ hasText: /Planning|ATP|ATS|ATC/ }).first();
    await expect(phaseBadge).toBeVisible();

    // Verify badge has styling (contains bg- class for background color)
    const classes = await phaseBadge.getAttribute('class');
    expect(classes).toContain('bg-');
  });

  test('should allow navigation back to dashboard', async ({ page }) => {
    await page.goto('/settings');

    // Click on dashboard/home link
    await page.click('a[href="/"], button:has-text("Dashboard")');

    // Should navigate back to home
    await expect(page).toHaveURL('/');
  });
});
