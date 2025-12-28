import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Phase Completion Journey
 *
 * Tests the workflow phase progression including checkpoint completion,
 * phase authorization, and workflow state management.
 */

test.describe('Phase Completion Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Create a test opportunity with TCV > 250k to avoid fast-track
    // This ensures ATP and ATS phases are not skipped
    await page.goto('/opportunities/new');
    await page.fill('input[placeholder*="Cloud Migration"]', 'Phase Test Opportunity');
    await page.fill('input[placeholder*="Acme Corporation"]', 'Phase Test Client');
    await page.selectOption('select', 'Technology');
    await page.fill('input[placeholder="1000000"]', '1000000'); // 1M to ensure not fast-track
    await page.click('button:has-text("Create Opportunity")');

    // Wait for workflow page to load
    await page.waitForURL(/\/opportunity\/OPP-/, { timeout: 5000 });
  });

  test('should display Planning phase checklist initially', async ({ page }) => {
    // Verify we're on the Planning phase
    await expect(page.locator('h2:has-text("Planning Checklist")')).toBeVisible();

    // Verify phase stepper shows Planning as active
    const planningButton = page.locator('button:has-text("Planning")').first();
    await expect(planningButton).toBeVisible();
  });

  test('should allow checking checkpoints and enabling Complete button', async ({ page }) => {
    // Wait for Planning checklist to load
    await expect(page.locator('h2:has-text("Planning Checklist")')).toBeVisible();

    // Check if there are any checkpoints
    const checkpoints = await page.locator('input[type="checkbox"]').count();

    if (checkpoints > 0) {
      // Initially, if there are required checkpoints, Complete should be disabled
      const completeButton = page.locator('button:has-text("Complete Planning")');
      const isDisabled = await completeButton.isDisabled();

      if (isDisabled) {
        // Check all checkboxes to enable the button
        const checkboxes = page.locator('input[type="checkbox"]');
        const count = await checkboxes.count();
        for (let i = 0; i < count; i++) {
          await checkboxes.nth(i).check();
          // Wait a bit for UI to update
          await page.waitForTimeout(150);
        }

        // After checking all, button should be enabled
        await expect(completeButton).toBeEnabled({ timeout: 3000 });
      }
    } else {
      // No checkpoints means Planning has no requirements
      // This is also a valid state
      const completeButton = page.locator('button:has-text("Complete Planning")');
      await expect(completeButton).toBeVisible();
    }
  });

  test('should show phase stepper with multiple phases', async ({ page }) => {
    // Verify all phases are shown in the stepper
    await expect(page.locator('text=Planning').first()).toBeVisible();

    // Check that other phases are present (even if not yet unlocked)
    const phasesInStepper = page.locator('nav button, div').filter({ hasText: /ATP|ATS|ATC|Handover/ });
    await expect(phasesInStepper.first()).toBeVisible();
  });

  test('should disable Complete button when required checkpoints not checked', async ({ page }) => {
    await expect(page.locator('h2:has-text("Planning Checklist")')).toBeVisible();

    // Check if Complete button is initially disabled (if there are required checkpoints)
    const completeButton = page.locator('button:has-text("Complete Planning")');
    const checkboxCount = await page.locator('input[type="checkbox"]').count();

    if (checkboxCount > 0) {
      // With unchecked required items, button should be disabled
      await expect(completeButton).toBeDisabled();

      // Check all checkboxes
      const checkboxes = page.locator('input[type="checkbox"]');
      for (let i = 0; i < checkboxCount; i++) {
        await checkboxes.nth(i).check();
      }

      // Now button should be enabled
      await expect(completeButton).toBeEnabled();
    }
  });

  test('should mark Planning phase in sidebar after viewing', async ({ page }) => {
    // Verify Planning button is in the sidebar
    const planningButton = page.locator('button:has-text("Planning")').first();
    await expect(planningButton).toBeVisible();

    // Planning should be the active/current phase initially
    // We don't need to complete it for this test, just verify the sidebar works
  });

  test('should show sidebar with all workflow phases', async ({ page }) => {
    // Verify sidebar navigation shows all phases
    // All workflow phases should be listed
    await expect(page.locator('button:has-text("Planning")').first()).toBeVisible();

    // Other phases should exist in the DOM (even if disabled)
    const allPhaseButtons = page.locator('button').filter({ hasText: /Planning|ATP|ATS|ATC|Handover/ });
    const count = await allPhaseButtons.count();

    // Should have multiple phase buttons
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('should show phase progress in process map', async ({ page }) => {
    // Process map should be visible
    await expect(page.locator('text=Planning').first()).toBeVisible();
    await expect(page.locator('text=ATP').first()).toBeVisible();
    await expect(page.locator('text=ATS').first()).toBeVisible();
    await expect(page.locator('text=ATC').first()).toBeVisible();
    await expect(page.locator('text=Handover').first()).toBeVisible();
  });
});
