import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E tests on Kyma Production
 *
 * These tests run AGAINST the deployed Kyma environment with:
 * - Real IAS authentication
 * - Real Supabase database
 * - Production configuration
 *
 * IMPORTANT: Test data will be created in production and needs cleanup!
 */
export default defineConfig({
  testDir: './e2e',

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
    // Base URL - Kyma production deployment
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://raise-app.b66a502.kyma.ondemand.com',

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
