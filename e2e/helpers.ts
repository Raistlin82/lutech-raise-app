import { Page } from '@playwright/test';

/**
 * E2E Test Helpers
 * Shared utilities for RAISE application E2E tests
 */

// Base path for the application (matches vite.config.ts base)
const BASE_PATH = '/lutech-raise-app';

/**
 * Navigate to a path within the application
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  // Ensure trailing slash for root, proper path for others
  const fullPath = path === '/' ? `${BASE_PATH}/` : `${BASE_PATH}${path}`;
  await page.goto(fullPath);
}

export interface TestCustomer {
  id: string;
  name: string;
  industry: string;
  isPublicSector: boolean;
}

export interface TestOpportunity {
  id: string;
  title: string;
  customerId: string;
  tcv: number;
  raiseTcv: number;
  currentPhase: string;
  hasKcpDeviations: boolean;
  isFastTrack: boolean;
  isRti: boolean;
  isMandataria: boolean;
  isPublicSector: boolean;
  raiseLevel: string;
  deviations: string[];
  checkpoints: Record<string, boolean>;
  marginPercent: number;
  cashFlowNeutral: boolean;
  isNewCustomer: boolean;
}

/**
 * Generate a valid UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Create a test customer object
 */
export function createTestCustomer(overrides: Partial<TestCustomer> = {}): TestCustomer {
  return {
    id: generateUUID(),
    name: 'Test Client',
    industry: 'Technology',
    isPublicSector: false,
    ...overrides,
  };
}

/**
 * Set up test customers in localStorage
 */
export async function setupTestCustomers(page: Page, customers: TestCustomer[]): Promise<void> {
  await page.evaluate((data) => {
    localStorage.setItem('raise_customers', JSON.stringify(data));
  }, customers);
}

/**
 * Set up test opportunities in localStorage
 */
export async function setupTestOpportunities(page: Page, opportunities: TestOpportunity[]): Promise<void> {
  await page.evaluate((data) => {
    localStorage.setItem('raise_opportunities', JSON.stringify(data));
  }, opportunities);
}

/**
 * Clear all localStorage data
 */
export async function clearLocalStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
  });
}

/**
 * Wait for the app to be fully loaded
 */
export async function waitForAppReady(page: Page): Promise<void> {
  // Wait for the main content to be visible
  await page.waitForSelector('body', { state: 'visible' });
  // Wait for React to hydrate and async data to load
  await page.waitForTimeout(500);
  // Wait for any loading spinners to disappear
  await page.waitForFunction(() => {
    const spinners = document.querySelectorAll('[class*="animate-spin"]');
    return spinners.length === 0;
  }, { timeout: 5000 }).catch(() => {});
}

/**
 * Navigate and set up test data
 */
export async function setupTestEnvironment(
  page: Page,
  options: {
    customers?: TestCustomer[];
    opportunities?: TestOpportunity[];
  } = {}
): Promise<void> {
  // First navigate to app (use full base path)
  await navigateTo(page, '/');
  await waitForAppReady(page);

  // Clear existing data
  await clearLocalStorage(page);

  // Set up test data if provided
  if (options.customers) {
    await setupTestCustomers(page, options.customers);
  }
  if (options.opportunities) {
    await setupTestOpportunities(page, options.opportunities);
  }

  // Reload to pick up new data
  await page.reload();
  await waitForAppReady(page);
}

/**
 * Fill the opportunity form
 */
export async function fillOpportunityForm(
  page: Page,
  data: {
    title: string;
    customerId: string;
    tcv: string;
    raiseTcv?: string;
    checkKcp?: boolean;
  }
): Promise<void> {
  // Wait for form to be ready
  await page.waitForSelector('form', { state: 'visible', timeout: 10000 });
  await page.waitForSelector('#title', { state: 'visible', timeout: 10000 });

  // Fill title
  await page.fill('#title', data.title);

  // Select customer from dropdown - wait for options to be available
  const customerSelect = page.locator('select').first();
  await customerSelect.waitFor({ state: 'visible', timeout: 10000 });

  // Wait for customer options to load (async loading)
  await page.waitForTimeout(1000);

  // Try to find the customer option, if not found by ID, select by index
  const options = await customerSelect.locator('option').all();
  let customerFound = false;

  for (const option of options) {
    const value = await option.getAttribute('value');
    if (value === data.customerId) {
      await customerSelect.selectOption(data.customerId);
      customerFound = true;
      break;
    }
  }

  // If customer not found by ID, select first non-empty option
  if (!customerFound && options.length > 1) {
    const firstValue = await options[1].getAttribute('value');
    if (firstValue) {
      await customerSelect.selectOption(firstValue);
    }
  }

  // Fill TCV
  await page.waitForSelector('#tcv', { state: 'visible', timeout: 5000 });
  await page.fill('#tcv', data.tcv);

  // Fill RAISE TCV if provided
  if (data.raiseTcv) {
    const raiseTcvInput = page.locator('#raiseTcv');
    if (await raiseTcvInput.isVisible()) {
      await page.fill('#raiseTcv', data.raiseTcv);
    }
  }

  // Check KCP if requested
  if (data.checkKcp) {
    const kcpLabel = page.locator('label').filter({ hasText: /KCP/i });
    const checkbox = kcpLabel.locator('input[type="checkbox"]');
    if (await checkbox.isVisible()) {
      await checkbox.check();
    }
  }
}

/**
 * Submit the opportunity form
 */
export async function submitOpportunityForm(page: Page): Promise<void> {
  await page.click('button:has-text("Crea Opportunità")');
}

/**
 * Create a complete opportunity through the UI
 */
export async function createOpportunityViaUI(
  page: Page,
  data: {
    title: string;
    customerId: string;
    tcv: string;
  }
): Promise<void> {
  await navigateTo(page, '/opportunities/new');
  // Wait for page to load completely
  await page.waitForLoadState('networkidle');
  await waitForAppReady(page);

  // Wait extra time for customers to load from localStorage
  await page.waitForTimeout(1000);

  // Fill and submit form
  await fillOpportunityForm(page, data);
  await submitOpportunityForm(page);

  // Wait for navigation with retry
  await page.waitForURL(/\/opportunity\/OPP-/, { timeout: 20000 });
  await waitForAppReady(page);
}
