import { test, expect } from '@playwright/test';
import { setupTestEnvironment, waitForAppReady, navigateTo } from './helpers';

/**
 * E2E Tests: Settings Management Journey
 *
 * Tests the settings page functionality including viewing controls,
 * adding new controls, editing existing ones, and resetting to defaults.
 */

test.describe('Settings Management Journey', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
  });

  test('should navigate to settings page', async ({ page }) => {
    await navigateTo(page, '/');
    await waitForAppReady(page);

    // Click Settings link in sidebar (English label)
    await page.click('text=Settings');

    // Verify we're on settings page
    await expect(page).toHaveURL(/\/settings/);
  });

  test('should display controls table with data', async ({ page }) => {
    await navigateTo(page, '/settings');
    await waitForAppReady(page);

    // Verify table exists with rows
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Verify at least one control row exists
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  test('should show controls for different phases', async ({ page }) => {
    await navigateTo(page, '/settings');
    await waitForAppReady(page);

    // Should display controls from various phases (phase badges in table)
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Check that at least one phase badge is visible
    const phaseBadge = page.locator('tbody td span').filter({ hasText: /Planning|ATP|ATS|ATC|Handover/ }).first();
    await expect(phaseBadge).toBeVisible();
  });

  test('should display mandatory status for controls', async ({ page }) => {
    await navigateTo(page, '/settings');
    await waitForAppReady(page);

    // Look for mandatory/optional indicators in table
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Table should have content indicating mandatory status
    const tableContent = await table.textContent();
    // Italian translations: "Obbligatorio" or "Opzionale"
    expect(tableContent).toMatch(/Obbligatorio|Opzionale|Mandatory|Optional/i);
  });

  test('should have action buttons visible for controls', async ({ page }) => {
    await navigateTo(page, '/settings');
    await waitForAppReady(page);

    // Wait for table to load
    await page.waitForSelector('tbody tr', { timeout: 10000 });

    // Action buttons should be present (edit/delete icons)
    const firstRow = page.locator('tbody tr').first();
    const buttons = firstRow.locator('button');

    await expect(buttons.first()).toBeVisible();
  });

  test('should have Add Control button', async ({ page }) => {
    await navigateTo(page, '/settings');
    await waitForAppReady(page);

    // Verify Add button exists (has Plus icon + text)
    const addButton = page.locator('button').filter({ hasText: /Aggiungi|Add/i });
    await expect(addButton.first()).toBeVisible();
  });

  test('should have Reset Defaults button', async ({ page }) => {
    await navigateTo(page, '/settings');
    await waitForAppReady(page);

    // Verify Reset button exists (has RotateCcw icon + text)
    const resetButton = page.locator('button').filter({ hasText: /Ripristina|Reset/i });
    await expect(resetButton.first()).toBeVisible();
  });

  test('should display control descriptions', async ({ page }) => {
    await navigateTo(page, '/settings');
    await waitForAppReady(page);

    // Table should have multiple columns with data
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // First row should have content
    const firstRow = page.locator('tbody tr').first();
    const cells = firstRow.locator('td');
    const cellCount = await cells.count();

    // Should have: #, Phase, RAISE Levels, Label, Description, Mandatory, Actions
    expect(cellCount).toBeGreaterThanOrEqual(6);
  });

  test('should show phase-specific badges', async ({ page }) => {
    await navigateTo(page, '/settings');
    await waitForAppReady(page);

    // Phase badges should be visible in the table
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Find any phase badge (they have specific CSS classes)
    const phaseBadge = page.locator('tbody span.rounded').filter({ hasText: /Planning|ATP|ATS|ATC|Handover/ }).first();
    await expect(phaseBadge).toBeVisible();
  });

  test('should allow navigation back to dashboard', async ({ page }) => {
    await navigateTo(page, '/settings');
    await waitForAppReady(page);

    // Click on Dashboard link in sidebar
    await page.click('text=Dashboard');

    await waitForAppReady(page);

    // Should navigate back to home (base path /lutech-raise-app/)
    await expect(page).toHaveURL(/\/lutech-raise-app\/?$/);
  });
});
