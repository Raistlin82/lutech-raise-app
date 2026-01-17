# Services Test Coverage Implementation Plan

## Goal
Increase test coverage for services from ~27% to >70%

## Target Files
- `src/services/authorizationMatrixService.ts` - 151 lines
- `src/services/expertInvolvementService.ts` - 218 lines
- `src/services/financialTargetsService.ts` - 176 lines
- `src/services/underMarginService.ts` - 234 lines

## Test Pattern (from controlService.test.ts)
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ServiceName } from './serviceName';

describe('ServiceName', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test groups by function
});
```

## Implementation Steps

### 1. authorizationMatrixService.test.ts
Functions to test:
- `getAuthorizationMatrix()` - returns matrix from localStorage or default
- `saveAuthorizationMatrix(matrix)` - saves to localStorage
- `resetAuthorizationMatrix()` - removes from localStorage
- `calculateLevelFromTcv(tcv)` - calculates authorization level based on TCV
- `getAuthorizationInfo(tcv)` - returns level info for given TCV
- `updateAuthorizationLevel(level, updates)` - updates specific level

Test cases:
- [ ] Get default matrix when localStorage empty
- [ ] Get saved matrix from localStorage
- [ ] Save matrix to localStorage
- [ ] Reset clears localStorage
- [ ] Calculate level for various TCV thresholds (boundary testing)
- [ ] Get authorization info returns correct structure
- [ ] Update level modifies correct entry

### 2. expertInvolvementService.test.ts
Functions to test:
- `getExpertInvolvement()` - returns config from localStorage or default
- `saveExpertInvolvement(config)` - saves to localStorage
- `resetExpertInvolvement()` - removes from localStorage
- `getExpertsForLevel(level)` - filters experts by authorization level
- `updateExpert(id, updates)` - updates specific expert
- `addExpert(expert)` - adds new expert
- `removeExpert(id)` - removes expert by id
- `getExpertFunctionDisplayName(fn)` - returns display name for function

Test cases:
- [ ] Get default config when localStorage empty
- [ ] Get saved config from localStorage
- [ ] Save config to localStorage
- [ ] Reset clears localStorage
- [ ] Get experts filters by level correctly
- [ ] Update expert modifies correct entry
- [ ] Add expert appends to list
- [ ] Remove expert removes correct entry
- [ ] Display name returns correct Italian translation

### 3. financialTargetsService.test.ts
Functions to test:
- `getFinancialTargets()` - returns targets from localStorage or default
- `saveFinancialTargets(targets)` - saves to localStorage
- `resetFinancialTargets()` - removes from localStorage
- `getTargetsByCategory(category)` - filters by category
- `updateTarget(id, updates)` - updates specific target
- `addTarget(target)` - adds new target
- `removeTarget(id)` - removes target by id
- `getCategoryDisplayName(category)` - returns display name

Test cases:
- [ ] Get default targets when localStorage empty
- [ ] Get saved targets from localStorage
- [ ] Save targets to localStorage
- [ ] Reset clears localStorage
- [ ] Get targets by category filters correctly
- [ ] Update target modifies correct entry
- [ ] Add target appends to list
- [ ] Remove target removes correct entry
- [ ] Display name returns correct Italian translation

### 4. underMarginService.test.ts
Functions to test:
- `getUnderMarginConfig()` - returns config from localStorage or default
- `saveUnderMarginConfig(config)` - saves to localStorage
- `resetUnderMarginConfig()` - removes from localStorage
- `getThresholdsByType(type)` - filters by margin type
- `isUnderMargin(value, type)` - checks if value is under margin
- `requiresApproval(value, type)` - checks if approval needed
- `getRequiredApprovalLevel(value, type)` - returns required level
- `updateThreshold(id, updates)` - updates specific threshold
- `addThreshold(threshold)` - adds new threshold
- `removeThreshold(id)` - removes threshold by id
- `getMarginTypeDisplayName(type)` - returns display name

Test cases:
- [ ] Get default config when localStorage empty
- [ ] Get saved config from localStorage
- [ ] Save config to localStorage
- [ ] Reset clears localStorage
- [ ] Get thresholds by type filters correctly
- [ ] isUnderMargin returns correct boolean
- [ ] requiresApproval returns correct boolean
- [ ] getRequiredApprovalLevel returns correct level
- [ ] Update threshold modifies correct entry
- [ ] Add threshold appends to list
- [ ] Remove threshold removes correct entry
- [ ] Display name returns correct Italian translation

## Execution Order
1. authorizationMatrixService.test.ts (simplest, good pattern validation)
2. financialTargetsService.test.ts (similar pattern)
3. expertInvolvementService.test.ts (similar pattern)
4. underMarginService.test.ts (most complex, has margin calculation logic)

## Success Criteria
- All tests pass
- Coverage >70% for services
- Build and lint pass
- E2E tests still pass
