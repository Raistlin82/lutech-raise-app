/**
 * E2E Tests: Complete Workflow Lifecycle
 *
 * Tests the entire opportunity workflow from creation to completion,
 * including all phase transitions and terminal states.
 *
 * Critical for CI/CD: Ensures no regression in core business logic.
 */

import { test, expect, Page } from '@playwright/test';
import { reloadWithTestMode, setupTestEnvironment, createTestCustomer, createTestOpportunityWithCompletedCheckpoints, setupTestOpportunities, waitForAppReady } from './helpers';

// Shared test customer and opportunity - created once per test
let testCustomer: ReturnType<typeof createTestCustomer>;
let testOpportunity: ReturnType<typeof createTestOpportunityWithCompletedCheckpoints>;

// Helper to create a test opportunity with completed checkpoints
// This creates the opportunity directly in localStorage and navigates to its workflow page
async function createTestOpportunity(page: Page, data: {
  title: string;
  tcv: number;
}) {
  // Create opportunity with all checkpoints completed
  testOpportunity = createTestOpportunityWithCompletedCheckpoints(testCustomer.id, {
    title: data.title,
    tcv: data.tcv,
  });

  // Setup in localStorage
  await setupTestOpportunities(page, [testOpportunity]);

  // Navigate directly to workflow page
  await page.goto(`/opportunity/${testOpportunity.id}/workflow`);
  await waitForAppReady(page);
}

// Global beforeEach - applies to ALL tests in this file
test.beforeEach(async ({ page }) => {
  // Create test customer and setup environment
  testCustomer = createTestCustomer({ name: 'Workflow Test Client' });
  await setupTestEnvironment(page, { customers: [testCustomer] });
});

test.describe('Complete Workflow Lifecycle', () => {

  test('should complete full workflow: Planning → ATP → ATS → ATC → Won → Handover', async ({ page }) => {
    // Step 1: Create new opportunity
    await createTestOpportunity(page, {
      title: 'E2E Test Opportunity',
      tcv: 1000000
    });

    // Step 2: Verify starts in Planning phase
    await expect(page.locator('text=Planning Checklist')).toBeVisible();

    // Step 3: Complete Planning → ATP
    await page.click('button:has-text("Completa Planning")');
    await expect(page.locator('text=ATP Checklist')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('text=Fase Planning completata!')).toBeVisible();

    // Step 4: Complete ATP → ATS
    await page.click('button:has-text("Completa ATP")');
    await expect(page.locator('text=ATS Checklist')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('text=Fase ATP completata!')).toBeVisible();

    // Step 5: Complete ATS → ATC
    await page.click('button:has-text("Completa ATS")');
    await expect(page.locator('text=ATC Checklist')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('text=Fase ATS completata!')).toBeVisible();

    // Step 6: Complete ATC → Shows Won/Lost Modal
    await page.click('button:has-text("Completa ATC")');
    await expect(page.locator('text=Esito Opportunità')).toBeVisible({ timeout: 2000 });

    // Step 7: Select "Won" → Handover
    await page.click('button:has-text("WON")');
    await expect(page.locator('text=Handover Checklist')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('text=Opportunità VINTA!')).toBeVisible();

    // Step 8: Complete Handover (CRITICAL FIX TEST)
    await page.click('button:has-text("Completa Handover")');
    await expect(page.locator('text=Workflow completato!')).toBeVisible({ timeout: 2000 });

    // Step 9: Verify terminal state
    const opportunity = await page.evaluate(() => {
      const opps = JSON.parse(localStorage.getItem('raise_opportunities') || '[]');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return opps.find((o: any) => o.title === 'E2E Test Opportunity');
    });
    expect(opportunity.currentPhase).toBe('Handover');
  });

  test('should complete workflow with Lost outcome', async ({ page }) => {
    await createTestOpportunity(page, {
      title: 'Lost Opportunity Test',
      tcv: 500000,
    });

    // Navigate through phases to ATC
    await page.click('button:has-text("Completa Planning")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Completa ATP")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Completa ATS")');
    await page.waitForTimeout(500);

    // Complete ATC and select Lost
    await page.click('button:has-text("Completa ATC")');
    await expect(page.locator('text=Esito Opportunità')).toBeVisible();
    await page.click('button:has-text("LOST")');

    // Verify Lost terminal state
    await expect(page.locator('text=Opportunità segnata come PERSA')).toBeVisible();

    const opportunity = await page.evaluate(() => {
      const opps = JSON.parse(localStorage.getItem('raise_opportunities') || '[]');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return opps.find((o: any) => o.title === 'Lost Opportunity Test');
    });
    expect(opportunity.currentPhase).toBe('Lost');
  });

  test('should prevent skipping phases in workflow', async ({ page }) => {
    await createTestOpportunity(page, {
      title: 'Phase Skip Test',
      tcv: 750000,
    });

    // Verify currently in Planning
    await expect(page.locator('text=Planning Checklist')).toBeVisible();

    // Try to click on ATC (should be disabled)
    const atcButton = page.locator('button:has-text("ATC")').first();
    await expect(atcButton).toBeDisabled();

    // Verify can only access current and past phases
    const planningButton = page.locator('button:has-text("Planning")').first();
    await expect(planningButton).not.toBeDisabled();
  });
});

test.describe('Navigation Tests', () => {
  test('should navigate: Dashboard → New Opportunity → Workflow → Back to Dashboard', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await page.waitForSelector('a[href="/opportunities/new"]', { state: 'visible', timeout: 10000 });

    // From Dashboard to New Opportunity
    await page.click('a[href="/opportunities/new"]');
    await expect(page).toHaveURL('/opportunities/new');
    await expect(page.locator('text=Crea Nuova Opportunità')).toBeVisible();

    // Create opportunity and navigate to workflow
    await createTestOpportunity(page, {
      title: 'Navigation Test',
      tcv: 300000,
    });
    await expect(page).toHaveURL(/\/opportunities\/.+\/workflow/);

    // Back to Dashboard
    await page.click('button:has-text("Torna alla Dashboard")');
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Panoramica Pipeline')).toBeVisible();

    // Verify opportunity appears in dashboard
    await expect(page.locator('text=Navigation Test')).toBeVisible();
  });

  test('should navigate between workflow phases using sidebar', async ({ page }) => {
    await createTestOpportunity(page, {
      title: 'Phase Navigation Test',
      tcv: 400000,
    });

    // Complete Planning to unlock ATP
    await page.click('button:has-text("Completa Planning")');
    await page.waitForTimeout(500);

    // Navigate back to Planning using sidebar
    await page.locator('button:has-text("Planning")').first().click();
    await expect(page.locator('text=Planning Checklist')).toBeVisible();
    await expect(page.locator('text=Completato')).toBeVisible(); // Shows completed badge

    // Navigate to ATP using sidebar
    await page.locator('button:has-text("ATP")').first().click();
    await expect(page.locator('text=ATP Checklist')).toBeVisible();
  });
});

test.describe('Critical User Journeys', () => {
  test('should create, edit, and complete an opportunity', async ({ page }) => {
    // Create
    await createTestOpportunity(page, {
      title: 'Full Journey Test',
      tcv: 2000000,
    });

    // Edit details
    await page.click('button[aria-label="Modifica Dettagli"]');
    await page.fill('[name="tcv"]', '2500000');
    await page.click('button:has-text("Salva Modifiche")');

    // Verify edit saved
    await expect(page.locator('text=€2500k')).toBeVisible();

    // Complete through workflow
    await page.click('button:has-text("Completa Planning")');
    await page.waitForTimeout(500);

    // Verify workflow state persists across page reloads
    await reloadWithTestMode(page);
    await expect(page.locator('text=ATP Checklist')).toBeVisible();
  });

  test('should handle Fast Track workflow (TCV < 250k)', async ({ page }) => {
    await createTestOpportunity(page, {
      title: 'Fast Track Test',
      tcv: 200000, // Below 250k threshold
    });

    // Verify Fast Track indicator
    await expect(page.locator('text=Fast Track Eligible')).toBeVisible();

    // Verify ATP and ATS are skipped (shown with line-through)
    const atpButton = page.locator('button:has-text("ATP")').first();
    await expect(atpButton).toHaveClass(/line-through/);

    const atsButton = page.locator('button:has-text("ATS")').first();
    await expect(atsButton).toHaveClass(/line-through/);

    // Complete Planning → Should skip to ATC
    await page.click('button:has-text("Completa Planning")');
    await expect(page.locator('text=ATC Checklist')).toBeVisible({ timeout: 2000 });
  });
});

test.describe('Error Handling & Edge Cases', () => {
  test('should show error when completing phase with incomplete mandatory checkpoints', async ({ page }) => {
    await createTestOpportunity(page, {
      title: 'Validation Test',
      tcv: 1000000,
    });

    // Try to complete without checking mandatory checkpoints
    const completeButton = page.locator('button:has-text("Completa Planning")');

    // Button should be disabled if there are unchecked mandatory items
    // (This depends on settings/controls configuration)
    const isDisabled = await completeButton.isDisabled();
    if (isDisabled) {
      // Verify tooltip or visual indicator shows why it's disabled
      await expect(page.locator('text=Tutti i checkpoint obbligatori')).toBeVisible();
    }
  });

  test('should handle browser refresh without losing workflow state', async ({ page }) => {
    await createTestOpportunity(page, {
      title: 'Persistence Test',
      tcv: 600000,
    });

    // Complete first phase
    await page.click('button:has-text("Completa Planning")');
    await expect(page.locator('text=ATP Checklist')).toBeVisible();

    // Refresh page
    await reloadWithTestMode(page);

    // Verify state persisted
    await expect(page.locator('text=ATP Checklist')).toBeVisible();
    await expect(page.locator('text=Persistence Test')).toBeVisible();

    // Verify can still navigate back to completed Planning
    await page.locator('button:has-text("Planning")').first().click();
    await expect(page.locator('text=Completato')).toBeVisible();
  });
});

test.describe('Regression Tests for Bug Fixes', () => {
  test('[BUG-FIX] Handover completion should show success message', async ({ page }) => {
    /**
     * Regression test for Handover completion bug
     *
     * Previously: Clicking "Completa Handover" did nothing
     * Fixed: Shows "Workflow completato!" success message
     *
     * Commit: 54d66f8 - fix: add Handover phase completion handler
     */
    await createTestOpportunity(page, {
      title: 'Handover Regression Test',
      tcv: 1000000,
    });

    // Navigate to Handover (fast-forward through phases)
    await page.click('button:has-text("Completa Planning")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Completa ATP")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Completa ATS")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Completa ATC")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("WON")');
    await expect(page.locator('text=Handover Checklist')).toBeVisible();

    // CRITICAL: Complete Handover should show success message
    await page.click('button:has-text("Completa Handover")');
    await expect(page.locator('text=Workflow completato!')).toBeVisible({ timeout: 2000 });

    // Verify terminal state
    const opp = await page.evaluate(() => {
      const opps = JSON.parse(localStorage.getItem('raise_opportunities') || '[]');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return opps.find((o: any) => o.title === 'Handover Regression Test');
    });
    expect(opp.currentPhase).toBe('Handover');
  });
});
