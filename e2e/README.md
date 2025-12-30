# End-to-End Tests for RAISE Application

This directory contains comprehensive Playwright E2E tests for the RAISE application, covering critical user journeys and application functionality.

## Test Suite Overview

### Total Coverage
- **33 E2E test scenarios** across 4 test files
- **All tests passing** (100%)
- Execution time: ~35 seconds

### Test Files

#### 1. `opportunity-creation.spec.ts` (7 tests)
Tests the complete opportunity creation flow:
- Navigation to new opportunity form from opportunities page
- Creating opportunities with required fields
- Form validation for missing fields
- Creating opportunities with optional fields
- Cancel navigation
- RAISE level calculation for different TCV values
- KCP deviation flag handling

#### 2. `phase-completion.spec.ts` (7 tests)
Tests workflow phase management:
- Displaying Planning phase checklist
- Checking checkpoints and enabling Complete button
- Phase stepper display
- Complete button disable/enable logic
- Sidebar phase navigation
- Process map visualization

#### 3. `settings-management.spec.ts` (10 tests)
Tests the settings and controls management:
- Navigation to settings page
- Controls table display
- Phase-specific controls
- Mandatory status indicators
- Action buttons (Edit/Delete)
- Add Control button
- Reset Defaults button
- Control descriptions
- Phase-specific color coding
- Navigation back to dashboard

#### 4. `error-handling.spec.ts` (9 tests)
Tests application resilience and error handling:
- Non-existent opportunity handling
- localStorage corruption recovery
- Multiple opportunity creation stability
- Rapid navigation handling
- Empty state display
- Form input validation
- Browser back button compatibility
- Offline operation (localStorage-based)
- Data persistence across reloads

## Test Helpers (`helpers.ts`)

The test suite uses shared helper functions for consistency:

```typescript
// Navigation with correct base path
await navigateTo(page, '/opportunities/new');

// Create test customers with valid UUIDs
const customer = createTestCustomer({ name: 'Test Client' });

// Setup test environment with localStorage data
await setupTestEnvironment(page, { customers: [customer] });

// Fill and submit opportunity form
await fillOpportunityForm(page, { title: 'Test', customerId: customer.id, tcv: '500000' });
await submitOpportunityForm(page);

// Wait for app to be ready
await waitForAppReady(page);
```

### Key Helper Functions

| Function | Description |
|----------|-------------|
| `navigateTo(page, path)` | Navigate with correct base path (`/lutech-raise-app`) |
| `createTestCustomer(overrides)` | Create customer with valid UUID |
| `setupTestEnvironment(page, options)` | Setup localStorage with test data |
| `fillOpportunityForm(page, data)` | Fill opportunity creation form |
| `submitOpportunityForm(page)` | Click "Crea Opportunità" button |
| `createOpportunityViaUI(page, data)` | Complete flow: navigate, fill, submit |
| `waitForAppReady(page)` | Wait for app to finish loading |

## Running Tests

### Run All E2E Tests
```bash
npm run test:e2e
# or
npx playwright test
```

### Run Tests in UI Mode (Interactive)
```bash
npm run test:e2e:ui
```

### Run Tests in Debug Mode
```bash
npm run test:e2e:debug
```

### Run Specific Test File
```bash
npx playwright test e2e/opportunity-creation.spec.ts
```

### Run Tests in Headed Mode (See Browser)
```bash
npx playwright test --headed
```

## Test Configuration

Tests are configured in `playwright.config.ts`:
- **Base URL:** `http://localhost:5173/lutech-raise-app`
- **Browser:** Chromium (Desktop Chrome)
- **Dev Server:** Auto-starts before running tests
- **Screenshots:** Captured on failure
- **Video:** Recorded on failure
- **Retries:** 2 times on CI

## LocalStorage Keys

Tests use these localStorage keys (must match the app stores):
- `raise_customers` - Customer data
- `raise_opportunities` - Opportunity data

## Test Patterns

### 1. Clean State Management
Every test suite clears localStorage and sets up fresh data:
```typescript
test.beforeEach(async ({ page }) => {
  await setupTestEnvironment(page, { customers: [testCustomer] });
});
```

### 2. User-Centric Selectors
Tests use text-based and role-based selectors:
```typescript
await page.click('button:has-text("Crea Opportunità")');
await expect(page.locator('h1:has-text("Test Opportunity")')).toBeVisible();
```

### 3. Resilient Waiting
Tests wait for conditions rather than fixed timeouts:
```typescript
await page.waitForURL(/\/opportunity\/OPP-/, { timeout: 15000 });
await expect(completeButton).toBeEnabled({ timeout: 3000 });
```

### 4. Italian i18n Labels
The app uses Italian translations. Common labels:
- "Crea Opportunità" - Create Opportunity button
- "Panoramica Pipeline" - Dashboard title
- "Seleziona Cliente..." - Customer dropdown placeholder
- "Annulla" - Cancel button

## Test Results

All 33 tests passing:
```
Running 33 tests using 5 workers
  33 passed (34.9s)
```

## Debugging Failed Tests

When a test fails:
1. Check screenshot in `test-results/`
2. Watch video recording
3. Review error context file
4. Run in headed mode: `npx playwright test --headed`
5. Use debug mode: `npm run test:e2e:debug`
6. Add `await page.pause()` to pause at a specific point

## Adding New Tests

1. Create or update a `.spec.ts` file in `e2e/`
2. Import helpers: `import { createTestCustomer, setupTestEnvironment, ... } from './helpers'`
3. Use `setupTestEnvironment` in `beforeEach`
4. Use `navigateTo` instead of `page.goto` for correct base path
5. Generate valid UUIDs for test entities
6. Verify with `npx playwright test`

## CI/CD Integration

Tests are designed for CI environments:
- Automatic retry on failure (2 retries)
- Headless execution by default
- Single worker on CI to avoid race conditions
- Screenshot and video capture for debugging
