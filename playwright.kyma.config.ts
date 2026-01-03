import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E tests on Kyma Production
 *
 * These tests run AGAINST the deployed Kyma environment with:
 * - Mock authentication via ?testMode=true (set by global setup)
 * - localStorage for data storage (not Supabase)
 *
 * The global setup navigates to /?testMode=true first, which sets
 * sessionStorage.testMode = 'true'. This persists for all tests.
 */
export default defineConfig({
  testDir: './e2e',

  // Global setup to initialize test mode before all tests
  globalSetup: './e2e/global-setup-kyma.ts',

  // Run tests in parallel
  fullyParallel: false, // Sequential for production to avoid conflicts

  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // No retries on production - we want to see real failures
  retries: 0,

  // Reduce workers on production to avoid overwhelming the app
  workers: 1,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report-kyma' }],
    ['list'],
    ['json', { outputFile: 'test-results-kyma.json' }]
  ],

  use: {
    // Base URL - Kyma production deployment (testMode set via global setup)
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://raise-app.b66a502.kyma.ondemand.com',

    // Use storage state from global setup (contains sessionStorage with testMode)
    storageState: './e2e/.auth/kyma-storage.json',

    // Collect trace on failure
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Increased timeouts for production (network latency)
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  // Global timeout for each test - increased for production
  timeout: 60 * 1000, // 60 seconds

  // Expect timeout
  expect: {
    timeout: 10000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // NO webServer - we test against the deployed Kyma instance!
});
