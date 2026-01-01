# RAISE Application Testing Guide

Comprehensive testing strategy for continuous integration and deployment (CI/CD).

## Testing Philosophy

**"If it's not tested, it's broken."**

We maintain three layers of automated testing to ensure complete coverage and prevent regressions:

1. **Unit Tests** - Individual component and function testing
2. **Integration Tests** - Multi-component interaction testing
3. **End-to-End (E2E) Tests** - Complete user journey testing

---

## Test Coverage

### Current Test Status

- **Unit Tests**: 339 passing
- **Integration Tests**: 8 passing
- **E2E Tests**: Comprehensive workflow coverage (see below)

### Coverage by Layer

#### 1. Unit Tests (`src/**/*.test.tsx`)

**What we test:**
- Individual React components
- Utility functions
- Business logic calculations (RAISE levels, TCV, margins)
- Form validation
- State management (stores)

**Framework:** Vitest + React Testing Library

**Examples:**
- `src/__tests__/unit/calculations.test.ts` - RAISE level calculations
- `src/__tests__/unit/validation.test.ts` - Form validation rules
- Component-specific tests for Dashboard, Workflow, Forms

#### 2. Integration Tests (`src/__tests__/integration/*.test.tsx`)

**What we test:**
- Multi-component workflows
- Store interactions
- Data persistence (localStorage)
- Route navigation
- State synchronization

**Examples:**
- `opportunity-workflow.test.tsx` - Dashboard ↔ Opportunity interaction
- `phase-completion.test.tsx` - Workflow phase transitions
- `customer-opportunity-flow.test.tsx` - Customer relationship management

#### 3. End-to-End Tests (`e2e/*.spec.ts`)

**What we test:**
- Complete user journeys
- Critical business workflows
- Cross-browser compatibility
- Mobile responsiveness
- Regression tests for bug fixes

**Examples:**
- `workflow-completion.spec.ts` - Full opportunity lifecycle (Planning → Handover)
- Navigation flows
- Terminal states (Won/Lost/Handover)

---

## Running Tests Locally

### Unit + Integration Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### E2E Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run E2E tests in UI mode (interactive)
npx playwright test --ui

# Run specific test file
npx playwright test e2e/workflow-completion.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Debug specific test
npx playwright test --debug -g "Handover completion"
```

### View Test Reports

```bash
# Unit test coverage
npm run test:coverage
open coverage/index.html

# E2E test report
npx playwright show-report
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

Located: `.github/workflows/e2e-tests.yml`

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop`

**Pipeline Steps:**
1. Install dependencies
2. Install Playwright browsers (Chromium, Firefox, WebKit)
3. Run unit tests (`npx vitest run`)
4. Run E2E tests (`npx playwright test`)
5. Upload test results as artifacts
6. Publish JUnit test report

**Browsers Tested:**
- Desktop: Chrome, Firefox, Safari
- Mobile: Pixel 5 (Chrome), iPhone 13 (Safari)

### Viewing CI Results

1. Go to GitHub Actions tab
2. Select latest workflow run
3. View test report in "E2E Test Results" section
4. Download artifacts for detailed logs/screenshots/videos

---

## E2E Test Suite Details

### Complete Workflow Lifecycle Tests

File: `e2e/workflow-completion.spec.ts`

**Test Scenarios:**

1. **Full Won Flow** (`Planning → ATP → ATS → ATC → Won → Handover`)
   - Creates opportunity
   - Completes all phases sequentially
   - Selects "Won" outcome at ATC
   - Completes Handover (regression test for bug fix)
   - Verifies terminal state

2. **Lost Outcome Flow** (`Planning → ATP → ATS → ATC → Lost`)
   - Navigates to ATC
   - Selects "Lost" outcome
   - Verifies terminal state

3. **Phase Skip Prevention**
   - Verifies users cannot skip ahead to future phases
   - Only current and past phases are accessible

4. **Fast Track Flow** (TCV < €250k)
   - Verifies ATP/ATS phases are skipped
   - Planning → ATC direct transition

### Navigation Tests

**Scenarios:**
- Dashboard → New Opportunity → Workflow → Dashboard
- Sidebar navigation between completed phases
- Back button functionality
- URL routing validation

### Critical User Journeys

**Scenarios:**
- Create → Edit → Complete opportunity
- Workflow state persistence across page reloads
- Fast Track detection and handling

### Regression Tests

**Bug Fixes Covered:**

1. **Handover Completion Bug** (Commit: `54d66f8`)
   - **Problem:** Clicking "Completa Handover" did nothing
   - **Fix:** Added terminal state handler showing success message
   - **Test:** Verifies "Workflow completato!" appears after Handover completion

---

## Writing New Tests

### Unit Test Template

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Click Me")');
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

### Best Practices

1. **Test Naming**
   - Use descriptive names: `should complete Handover phase successfully`
   - Start with `should` for behavior tests
   - Include context: what, when, expected outcome

2. **Test Structure**
   - **Arrange:** Set up test data and environment
   - **Act:** Perform the action being tested
   - **Assert:** Verify expected outcome

3. **Test Independence**
   - Each test should be independent
   - Use `beforeEach` to reset state
   - Don't rely on test execution order

4. **Async Handling**
   - Always use `await` for async operations
   - Use `waitFor` for dynamic content
   - Set appropriate timeouts

5. **Assertions**
   - Be specific: `toBeInTheDocument()` not just `toBeTruthy()`
   - Test user-visible behavior, not implementation
   - Include error messages for failed assertions

---

## Test Maintenance

### When to Add Tests

**Always add tests when:**
- Adding new features
- Fixing bugs (regression test)
- Modifying existing functionality
- Adding new routes or navigation

### Updating Tests

**When code changes:**
1. Run existing tests
2. Fix failing tests if behavior change is intentional
3. Add new tests for new edge cases
4. Update snapshots if UI changed

### Test Debugging

**Unit Tests:**
```bash
# Run single test file
npx vitest run src/__tests__/unit/my-test.test.ts

# Debug with VS Code
# Add breakpoint, press F5, select "Vitest"
```

**E2E Tests:**
```bash
# Run in debug mode
npx playwright test --debug

# Generate test from browser actions
npx playwright codegen http://localhost:5173

# Trace viewer (after test with --trace on)
npx playwright show-trace trace.zip
```

---

## Common Issues & Solutions

### Issue: E2E test timeout

**Solution:**
- Increase timeout in test: `test.setTimeout(60000)`
- Use `waitFor` instead of fixed delays
- Check if dev server started correctly

### Issue: Flaky tests (intermittent failures)

**Solution:**
- Use proper `waitFor` conditions
- Don't use `setTimeout` - use `waitFor(() => condition)`
- Ensure test independence (clear state in `beforeEach`)

### Issue: Button disabled in tests but works manually

**Solution:**
- Check if all required checkpoints are mocked/set
- Verify settings store is properly initialized
- Use `await waitFor(() => expect(button).not.toBeDisabled())`

---

## Performance Testing

### Bundle Size

```bash
# Analyze bundle
npm run build
npx vite-bundle-visualizer
```

### Lighthouse CI

```bash
# Run Lighthouse
npx lighthouse http://localhost:5173 --view
```

---

## Contributing

### Before Submitting PR

1. Run all tests: `npm test && npm run test:e2e`
2. Ensure 100% of new code has test coverage
3. Add regression test if fixing a bug
4. Update this guide if adding new test types

### Test Review Checklist

- [ ] Tests are independent and don't rely on execution order
- [ ] Proper use of `waitFor` for async operations
- [ ] Descriptive test names
- [ ] Edge cases covered
- [ ] No hardcoded delays (`setTimeout`)
- [ ] Proper cleanup in `beforeEach`/`afterEach`

---

## Future Improvements

### Planned Enhancements

1. **Visual Regression Testing** - Screenshot comparison with Percy/Chromatic
2. **API Contract Testing** - When backend integration added
3. **Performance Budget** - Automated bundle size limits
4. **Accessibility Testing** - axe-core integration
5. **Test Data Factory** - Centralized test data generation

### Test Coverage Goals

- **Unit Tests:** 90%+ coverage
- **Integration Tests:** All critical user flows
- **E2E Tests:** All business-critical workflows
- **Cross-browser:** Chrome, Firefox, Safari, Mobile
- **Accessibility:** WCAG 2.1 AA compliance

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## Contact & Support

For testing questions or issues:
1. Check this guide first
2. Review existing tests for examples
3. Ask in team chat or create GitHub issue

**Remember:** Good tests are documentation. Write tests that explain how the system works!
