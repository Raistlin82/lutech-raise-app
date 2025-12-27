# Phase 2: Testing & Quality - Implementation Plan

**Status:** 🟡 READY TO START
**Prerequisites:** ✅ Phase 1 Complete
**Goal:** Expand test coverage from 80% to 95%+ with component, integration, and E2E tests
**Duration:** 1-2 sessions

---

## Current State

**Test Coverage (Phase 1 Complete):**
- ✅ Business logic: 100% (raiseLogic.ts, ruleEngine.ts)
- ✅ Validation: 100% (validation.ts)
- ✅ Error boundaries: 100% (ErrorBoundary.tsx)
- ❌ Components: 0% (dashboard, workflow, settings, etc.)
- ❌ Stores: 0% (OpportunitiesStore, SettingsStore)
- ❌ Pages: 0% (opportunities, settings, approvals)
- ❌ Integration: 0% (full workflows)
- ❌ E2E: 0% (user journeys)

**Overall Coverage:** 80% → Target: 95%+

---

## Phase 2 Goals

1. **Component Testing** - Test all React components in isolation
2. **Store Testing** - Test state management logic
3. **Integration Testing** - Test component interactions
4. **E2E Testing** - Test critical user paths end-to-end

---

## Task Breakdown

### Task 2.1: Component Tests - Dashboard & Opportunities

**Priority:** HIGH
**Files to Test:**
- `src/components/dashboard/index.tsx`
- `src/pages/opportunities/index.tsx`
- `src/pages/opportunities/new.tsx`
- `src/pages/opportunities/edit.tsx`

**Test Coverage:**
- Render components without errors
- Display opportunities correctly
- Handle empty state
- Handle loading state
- Form validation (new/edit pages)
- Button interactions
- Navigation

**Deliverables:**
- `src/components/dashboard/index.test.tsx`
- `src/pages/opportunities/index.test.tsx`
- `src/pages/opportunities/new.test.tsx`
- `src/pages/opportunities/edit.test.tsx`

**Estimated Tests:** 20-25 tests

---

### Task 2.2: Component Tests - Workflow & Settings

**Priority:** HIGH
**Files to Test:**
- `src/components/workflow/index.tsx`
- `src/components/settings/index.tsx`
- `src/pages/settings/index.tsx`

**Test Coverage:**
- Workflow phase progression
- Checkpoint selection
- Phase completion validation
- Settings control rendering
- Control search/filter
- RTI/KCP flag modifications

**Deliverables:**
- `src/components/workflow/index.test.tsx`
- `src/components/settings/index.test.tsx`
- `src/pages/settings/index.test.tsx`

**Estimated Tests:** 15-20 tests

---

### Task 2.3: Store Tests

**Priority:** HIGH
**Files to Test:**
- `src/stores/OpportunitiesStore.tsx`
- `src/stores/SettingsStore.tsx`

**Test Coverage:**
- Add/update/delete opportunities
- localStorage persistence
- Validation integration
- RAISE level calculation
- Phase progression logic
- Settings controls CRUD

**Deliverables:**
- `src/stores/OpportunitiesStore.test.tsx`
- `src/stores/SettingsStore.test.tsx`

**Estimated Tests:** 15-20 tests

---

### Task 2.4: Integration Tests

**Priority:** MEDIUM
**Test Scenarios:**
- Create new opportunity → view in dashboard
- Edit opportunity → verify updates
- Complete ATP phase → verify checkpoints
- Complete ATS phase → verify flag locking
- RAISE level changes → verify calculations

**Setup:**
- Use MSW (Mock Service Worker) for API mocking
- Test full component trees with providers
- Verify state updates across components

**Deliverables:**
- `src/__tests__/integration/opportunity-workflow.test.tsx`
- `src/__tests__/integration/phase-completion.test.tsx`
- `src/__tests__/integration/raise-calculations.test.tsx`

**Estimated Tests:** 10-15 tests

---

### Task 2.5: E2E Tests with Playwright

**Priority:** MEDIUM
**Test Scenarios:**
- **User Journey 1:** Create opportunity from scratch to ATP completion
- **User Journey 2:** Edit opportunity and complete ATS
- **User Journey 3:** Settings management - add/modify controls
- **User Journey 4:** Error recovery - trigger error and retry

**Setup:**
```bash
npm install --save-dev @playwright/test
npx playwright install
```

**Deliverables:**
- `e2e/opportunity-creation.spec.ts`
- `e2e/phase-completion.spec.ts`
- `e2e/settings-management.spec.ts`
- `e2e/error-handling.spec.ts`

**Estimated Tests:** 8-12 scenarios

---

## Implementation Strategy

### Approach: Subagent-Driven Development

Following the same successful pattern from Phase 1:
1. Dispatch subagent for each task
2. Code review after each task
3. Fix issues before proceeding
4. Progressive test coverage increase

### Testing Tools

**Already Installed:**
- ✅ Vitest (unit/component tests)
- ✅ @testing-library/react (component testing)
- ✅ @testing-library/jest-dom (DOM matchers)
- ✅ @testing-library/user-event (user interactions)

**To Install:**
- MSW (Mock Service Worker) - for integration tests
- Playwright - for E2E tests

---

## Success Criteria

### Test Coverage
- [ ] Business logic: 100% (already achieved)
- [ ] Components: 90%+ (from 0%)
- [ ] Stores: 90%+ (from 0%)
- [ ] Integration: 80%+ (from 0%)
- [ ] E2E: Critical paths covered (from 0%)
- [ ] **Overall: 95%+** (from 80%)

### Test Quality
- [ ] All tests passing
- [ ] Fast execution (< 5s for unit/component, < 30s for E2E)
- [ ] No flaky tests
- [ ] Clear test descriptions
- [ ] Good failure messages

### CI/CD Ready
- [ ] Tests run in CI pipeline
- [ ] Coverage reports generated
- [ ] E2E tests in separate workflow
- [ ] No warnings or errors

---

## Execution Plan

### Session 1: Component & Store Tests
1. Task 2.1: Dashboard & Opportunities components
2. Task 2.2: Workflow & Settings components
3. Task 2.3: Store tests
4. **Target:** 90%+ coverage

### Session 2: Integration & E2E Tests
1. Task 2.4: Integration tests
2. Task 2.5: E2E tests with Playwright
3. **Target:** 95%+ coverage

---

## Risk Assessment

### Low Risk
- Component tests are straightforward
- Testing-library already set up
- Good test patterns from Phase 1

### Medium Risk
- E2E tests may be slower to write
- Integration tests need careful setup
- Playwright learning curve

### Mitigation
- Start with simpler component tests
- Use Phase 1 test patterns as templates
- Reference Playwright documentation
- Keep E2E tests focused on critical paths

---

## Dependencies

**No blockers** - All prerequisites from Phase 1 complete:
- ✅ Test infrastructure set up
- ✅ Testing-library installed
- ✅ Vitest configured
- ✅ Example tests working

---

## Next Steps

1. **Review this plan** - Approve scope and approach
2. **Start Task 2.1** - Dashboard & Opportunities component tests
3. **Progressive execution** - Task by task with code reviews
4. **Coverage tracking** - Monitor progress toward 95%+ goal

---

**Ready to start?** Say "start Phase 2" to begin with Task 2.1! 🚀
