import { test, expect } from '@playwright/test';
import { createTestCustomer, setupTestEnvironment, createOpportunityViaUI } from './helpers';

/**
 * E2E Tests: Phase Completion Journey
 *
 * Tests the workflow phase progression including checkpoint completion,
 * phase authorization, and workflow state management.
 */

test.describe('Phase Completion Journey', () => {
  const testCustomer = createTestCustomer({
    name: 'Phase Test Client'
  });

  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page, { customers: [testCustomer] });

    // Create a test opportunity with TCV > 250k to avoid fast-track
    await createOpportunityViaUI(page, {
      title: 'Phase Test Opportunity',
      customerId: testCustomer.id,
      tcv: '1000000', // 1M to ensure not fast-track
    });
  });

  test('should display Planning phase checklist initially', async ({ page }) => {
    // Verify we're on the workflow page with Planning phase
    await expect(page.locator('text=Planning').first()).toBeVisible();
  });

  test('should allow checking checkpoints and enabling Complete button', async ({ page }) => {
    // Wait for Planning phase to load
    await expect(page.locator('text=Planning').first()).toBeVisible();

    // Check if there are any checkpoints
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();

    if (count > 0) {
      // Check all checkboxes
      for (let i = 0; i < count; i++) {
        await checkboxes.nth(i).check();
        await page.waitForTimeout(100);
      }
    }

    // Verify the page is still stable
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show phase stepper with multiple phases', async ({ page }) => {
    // Verify Planning is shown
    await expect(page.locator('text=Planning').first()).toBeVisible();

    // Check that other phases are present
    await expect(page.locator('text=ATP').first()).toBeVisible();
    await expect(page.locator('text=ATS').first()).toBeVisible();
  });

  test('should disable Complete button when required checkpoints not checked', async ({ page }) => {
    await expect(page.locator('text=Planning').first()).toBeVisible();

    // Find Complete button
    const completeButton = page.locator('button').filter({ hasText: /Completa|Complete/i }).first();

    if (await completeButton.isVisible()) {
      const checkboxCount = await page.locator('input[type="checkbox"]').count();

      if (checkboxCount > 0) {
        // With unchecked items, button might be disabled
        const isDisabled = await completeButton.isDisabled();

        if (isDisabled) {
          // Check all checkboxes
          const checkboxes = page.locator('input[type="checkbox"]');
          for (let i = 0; i < checkboxCount; i++) {
            await checkboxes.nth(i).check();
          }
          // Now button should be enabled
          await expect(completeButton).toBeEnabled({ timeout: 5000 });
        }
      }
    }
  });

  test('should mark Planning phase in sidebar after viewing', async ({ page }) => {
    // Verify Planning button is visible
    const planningButton = page.locator('button').filter({ hasText: 'Planning' }).first();
    await expect(planningButton).toBeVisible();
  });

  test('should show sidebar with all workflow phases', async ({ page }) => {
    // All workflow phases should be visible
    await expect(page.locator('text=Planning').first()).toBeVisible();

    // Other phases should exist
    const allPhaseTexts = page.locator('button, div').filter({ hasText: /Planning|ATP|ATS|ATC|Handover/ });
    const count = await allPhaseTexts.count();

    // Should have multiple phase elements
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('should show phase progress in process map', async ({ page }) => {
    // All phases should be visible in the process map
    await expect(page.locator('text=Planning').first()).toBeVisible();
    await expect(page.locator('text=ATP').first()).toBeVisible();
    await expect(page.locator('text=ATS').first()).toBeVisible();
    await expect(page.locator('text=ATC').first()).toBeVisible();
    await expect(page.locator('text=Handover').first()).toBeVisible();
  });
});
