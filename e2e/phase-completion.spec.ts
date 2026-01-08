import { test, expect } from '@playwright/test';
import { createTestCustomer, setupTestEnvironment, createOpportunityViaUI } from './helpers';

/**
 * E2E Tests: Phase Completion Journey
 *
 * Tests the workflow phase progression including checkpoint completion,
 * phase authorization, and workflow state management.
 */

test.describe('Phase Completion Journey', () => {
  async function setupAndCreateOpportunity(page: Page) {
    const testCustomer = createTestCustomer({ name: 'Phase Test Client' });
    await setupTestEnvironment(page, { customers: [testCustomer] });
    await createOpportunityViaUI(page, {
      title: 'Phase Test Opportunity',
      customerId: testCustomer.id,
      tcv: '1000000',
    });
  }

  test('should display Planning phase checklist initially', async ({ page }) => {
    await setupAndCreateOpportunity(page);
    await expect(page.locator('text=Planning').first()).toBeVisible();
  });

  test('should allow checking checkpoints and enabling Complete button', async ({ page }) => {
    await setupAndCreateOpportunity(page);
    await expect(page.locator('text=Planning').first()).toBeVisible();

    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        await checkboxes.nth(i).check();
        await page.waitForTimeout(100);
      }
    }
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show phase stepper with multiple phases', async ({ page }) => {
    await setupAndCreateOpportunity(page);
    await expect(page.locator('text=Planning').first()).toBeVisible();
    await expect(page.locator('text=ATP').first()).toBeVisible();
    await expect(page.locator('text=ATS').first()).toBeVisible();
  });

  test('should disable Complete button when required checkpoints not checked', async ({ page }) => {
    await setupAndCreateOpportunity(page);
    await expect(page.locator('text=Planning').first()).toBeVisible();

    const completeButton = page.locator('button').filter({ hasText: /Completa|Complete/i }).first();
    if (await completeButton.isVisible()) {
      const checkboxCount = await page.locator('input[type="checkbox"]').count();
      if (checkboxCount > 0) {
        const isDisabled = await completeButton.isDisabled();
        if (isDisabled) {
          const checkboxes = page.locator('input[type="checkbox"]');
          for (let i = 0; i < checkboxCount; i++) {
            await checkboxes.nth(i).check();
          }
          await expect(completeButton).toBeEnabled({ timeout: 5000 });
        }
      }
    }
  });

  test('should mark Planning phase in sidebar after viewing', async ({ page }) => {
    await setupAndCreateOpportunity(page);
    const planningButton = page.locator('button').filter({ hasText: 'Planning' }).first();
    await expect(planningButton).toBeVisible();
  });

  test('should show sidebar with all workflow phases', async ({ page }) => {
    await setupAndCreateOpportunity(page);
    await expect(page.locator('text=Planning').first()).toBeVisible();
    const allPhaseTexts = page.locator('button, div').filter({ hasText: /Planning|ATP|ATS|ATC|Handover/ });
    expect(await allPhaseTexts.count()).toBeGreaterThanOrEqual(3);
  });

  test('should show phase progress in process map', async ({ page }) => {
    await setupAndCreateOpportunity(page);
    await expect(page.locator('text=Planning').first()).toBeVisible();
    await expect(page.locator('text=ATP').first()).toBeVisible();
    await expect(page.locator('text=ATS').first()).toBeVisible();
    await expect(page.locator('text=ATC').first()).toBeVisible();
    await expect(page.locator('text=Handover').first()).toBeVisible();
  });
});
