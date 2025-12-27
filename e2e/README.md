# End-to-End Tests for RAISE Application

This directory contains comprehensive Playwright E2E tests for the RAISE application, covering critical user journeys and application functionality.

## Test Suite Overview

### Total Coverage
- **33 E2E test scenarios** across 4 test files
- **560 lines of test code**
- All tests passing

### Test Files

#### 1. `opportunity-creation.spec.ts` (7 tests)
Tests the complete opportunity creation flow:
- Navigation to new opportunity form
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
- Offline operation
- Data persistence across reloads

## Running Tests

### Run All Tests
```bash
npm run test:e2e
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

Tests are configured in `/Users/gabriele.rendina/gemini/raise/raise-app/playwright.config.ts`:
- Base URL: `http://localhost:5173`
- Browser: Chromium (Desktop Chrome)
- Auto-starts dev server before running tests
- Captures screenshots on failure
- Records video on failure
- Retries failed tests 2 times on CI

## Test Patterns Used

### 1. Clean State Management
Every test clears localStorage before running:
```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});
```

### 2. User-Centric Selectors
Tests use text-based and role-based selectors that mirror actual user interactions:
```typescript
await page.click('button:has-text("Create Opportunity")');
await expect(page.locator('h1:has-text("New Opportunity")')).toBeVisible();
```

### 3. Resilient Waiting
Tests wait for elements and conditions rather than using fixed timeouts:
```typescript
await page.waitForURL(/\/opportunity\/OPP-/, { timeout: 5000 });
await expect(completeButton).toBeEnabled({ timeout: 3000 });
```

### 4. Realistic User Flows
Tests simulate actual user behavior:
- Filling forms completely
- Checking checkboxes
- Navigating through pages
- Using browser back button

## Coverage Highlights

### Critical User Journeys Tested
1. Creating and managing opportunities
2. Progressing through workflow phases
3. Managing settings and controls
4. Handling errors and edge cases

### Application Features Tested
- Form validation and submission
- Navigation and routing
- localStorage persistence
- UI state management
- Error boundaries and recovery
- Button enable/disable logic
- Multi-step workflows

## Test Results

All 33 tests passing with execution time ~15 seconds:

```
Running 33 tests using 5 workers
  33 passed (15.1s)
```

## Best Practices

1. **Independent Tests**: Each test can run independently
2. **No Shared State**: Tests clear localStorage between runs
3. **Explicit Waits**: Use `waitFor` and `expect` with timeouts
4. **Meaningful Names**: Test names describe user actions and outcomes
5. **Clean Up**: Tests don't leave artifacts or side effects

## Continuous Integration

Tests are designed to run in CI environments:
- Automatic retry on failure (2 retries on CI)
- Screenshot and video capture for debugging
- Headless execution by default
- Single worker on CI to avoid race conditions

## Debugging Failed Tests

When a test fails:
1. Check the screenshot in `test-results/`
2. Watch the video recording
3. Review the error context file
4. Run in headed mode: `npx playwright test --headed`
5. Use debug mode: `npm run test:e2e:debug`

## Adding New Tests

To add new E2E tests:
1. Create a new `.spec.ts` file in the `e2e/` directory
2. Follow the existing test patterns
3. Use descriptive test names
4. Clear state in `beforeEach`
5. Test realistic user flows
6. Verify with `npm run test:e2e`

## Notes

- Tests run against the Vite dev server (auto-started)
- All tests use Chromium browser
- Tests are designed to be stable and not flaky
- Selectors prioritize user-visible text over test IDs
