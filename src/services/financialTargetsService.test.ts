import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getFinancialTargets,
  saveFinancialTargets,
  resetFinancialTargets,
  getTargetsByCategory,
  updateTarget,
  addTarget,
  removeTarget,
  getCategoryDisplayName,
  DEFAULT_FINANCIAL_TARGETS,
} from './financialTargetsService';
import type { FinancialTargetsConfig, FinancialTarget } from '../types';

describe('financialTargetsService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getFinancialTargets', () => {
    it('should return default targets when localStorage is empty', () => {
      const targets = getFinancialTargets();
      expect(targets.id).toBe('default');
      expect(targets.name).toBe('PSQ-003 v17 Default');
      expect(targets.targets.length).toBe(11);
    });

    it('should return saved targets from localStorage', () => {
      const customTargets: FinancialTargetsConfig = {
        id: 'custom',
        name: 'Custom Targets',
        isActive: true,
        targets: [
          {
            id: 'custom-1',
            category: 'CashFlow',
            scope: 'Custom Scope',
            rule: 'Custom Rule',
          },
        ],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      localStorage.setItem('raise_financial_targets', JSON.stringify(customTargets));

      const targets = getFinancialTargets();
      expect(targets.id).toBe('custom');
      expect(targets.name).toBe('Custom Targets');
      expect(targets.targets.length).toBe(1);
    });

    it('should return default targets when localStorage contains invalid JSON', () => {
      localStorage.setItem('raise_financial_targets', 'invalid-json');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const targets = getFinancialTargets();
      expect(targets.id).toBe('default');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('saveFinancialTargets', () => {
    it('should save targets to localStorage', () => {
      const customTargets: FinancialTargetsConfig = {
        id: 'custom',
        name: 'Custom Targets',
        isActive: true,
        targets: DEFAULT_FINANCIAL_TARGETS.targets,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      saveFinancialTargets(customTargets);

      const stored = localStorage.getItem('raise_financial_targets');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.id).toBe('custom');
    });

    it('should update the updatedAt timestamp', () => {
      const customTargets: FinancialTargetsConfig = {
        id: 'custom',
        name: 'Custom Targets',
        isActive: true,
        targets: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      saveFinancialTargets(customTargets);

      const stored = localStorage.getItem('raise_financial_targets');
      const parsed = JSON.parse(stored!);
      expect(parsed.updatedAt).not.toBe('2024-01-01');
    });
  });

  describe('resetFinancialTargets', () => {
    it('should remove targets from localStorage', () => {
      localStorage.setItem('raise_financial_targets', JSON.stringify(DEFAULT_FINANCIAL_TARGETS));
      expect(localStorage.getItem('raise_financial_targets')).toBeTruthy();

      resetFinancialTargets();

      expect(localStorage.getItem('raise_financial_targets')).toBeNull();
    });

    it('should not throw when localStorage is already empty', () => {
      expect(() => resetFinancialTargets()).not.toThrow();
    });
  });

  describe('getTargetsByCategory', () => {
    it('should return CashFlow targets', () => {
      const targets = getTargetsByCategory('CashFlow');
      expect(targets.length).toBe(3);
      expect(targets.every(t => t.category === 'CashFlow')).toBe(true);
    });

    it('should return Margins targets', () => {
      const targets = getTargetsByCategory('Margins');
      expect(targets.length).toBe(3);
      expect(targets.every(t => t.category === 'Margins')).toBe(true);
    });

    it('should return Deviations targets', () => {
      const targets = getTargetsByCategory('Deviations');
      expect(targets.length).toBe(4);
      expect(targets.every(t => t.category === 'Deviations')).toBe(true);
    });

    it('should return IFRS15 targets', () => {
      const targets = getTargetsByCategory('IFRS15');
      expect(targets.length).toBe(1);
      expect(targets.every(t => t.category === 'IFRS15')).toBe(true);
    });

    it('should return empty array for non-existent category', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const targets = getTargetsByCategory('NonExistent' as any);
      expect(targets.length).toBe(0);
    });

    it('should use custom targets from localStorage', () => {
      const customTargets: FinancialTargetsConfig = {
        id: 'custom',
        name: 'Custom',
        isActive: true,
        targets: [
          { id: 'cf-1', category: 'CashFlow', scope: 'Test', rule: 'Test' },
          { id: 'cf-2', category: 'CashFlow', scope: 'Test 2', rule: 'Test 2' },
        ],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      localStorage.setItem('raise_financial_targets', JSON.stringify(customTargets));

      const targets = getTargetsByCategory('CashFlow');
      expect(targets.length).toBe(2);
    });
  });

  describe('updateTarget', () => {
    it('should update existing target', () => {
      const updatedTarget: FinancialTarget = {
        id: 'cf-payment-terms',
        category: 'CashFlow',
        scope: 'Updated Scope',
        rule: 'Updated Rule',
        threshold: 90,
        thresholdUnit: 'days',
      };

      updateTarget(updatedTarget);

      const config = getFinancialTargets();
      const target = config.targets.find(t => t.id === 'cf-payment-terms');
      expect(target?.scope).toBe('Updated Scope');
      expect(target?.threshold).toBe(90);
    });

    it('should not modify config for non-existent target', () => {
      const nonExistentTarget: FinancialTarget = {
        id: 'non-existent',
        category: 'CashFlow',
        scope: 'Non-existent',
        rule: 'Should not be added',
      };

      updateTarget(nonExistentTarget);

      const config = getFinancialTargets();
      expect(config.targets.find(t => t.id === 'non-existent')).toBeUndefined();
    });

    it('should persist changes to localStorage', () => {
      const updatedTarget: FinancialTarget = {
        id: 'margin-products',
        category: 'Margins',
        scope: 'Updated Products',
        rule: 'Updated rule',
        threshold: 20,
        thresholdUnit: 'percent',
      };

      updateTarget(updatedTarget);

      const stored = localStorage.getItem('raise_financial_targets');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      const target = parsed.targets.find((t: FinancialTarget) => t.id === 'margin-products');
      expect(target?.threshold).toBe(20);
    });
  });

  describe('addTarget', () => {
    it('should add new target to config', () => {
      const newTarget: FinancialTarget = {
        id: 'new-target',
        category: 'CashFlow',
        scope: 'New Scope',
        rule: 'New Rule',
        threshold: 30,
        thresholdUnit: 'days',
      };

      addTarget(newTarget);

      const config = getFinancialTargets();
      const target = config.targets.find(t => t.id === 'new-target');
      expect(target).toBeDefined();
      expect(target?.scope).toBe('New Scope');
    });

    it('should append to existing targets', () => {
      const initialCount = getFinancialTargets().targets.length;

      const newTarget: FinancialTarget = {
        id: 'new-target',
        category: 'Margins',
        scope: 'Extra Margin',
        rule: 'Extra Rule',
      };

      addTarget(newTarget);

      const config = getFinancialTargets();
      expect(config.targets.length).toBe(initialCount + 1);
    });

    it('should persist new target to localStorage', () => {
      const newTarget: FinancialTarget = {
        id: 'persisted-target',
        category: 'IFRS15',
        scope: 'Persisted',
        rule: 'Persisted Rule',
      };

      addTarget(newTarget);

      const stored = localStorage.getItem('raise_financial_targets');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.targets.find((t: FinancialTarget) => t.id === 'persisted-target')).toBeDefined();
    });
  });

  describe('removeTarget', () => {
    it('should remove target by id', () => {
      const initialCount = getFinancialTargets().targets.length;

      removeTarget('cf-payment-terms');

      const config = getFinancialTargets();
      expect(config.targets.length).toBe(initialCount - 1);
      expect(config.targets.find(t => t.id === 'cf-payment-terms')).toBeUndefined();
    });

    it('should not modify config when removing non-existent target', () => {
      const initialCount = getFinancialTargets().targets.length;

      removeTarget('non-existent-id');

      const config = getFinancialTargets();
      expect(config.targets.length).toBe(initialCount);
    });

    it('should persist removal to localStorage', () => {
      removeTarget('ifrs15-evaluation');

      const stored = localStorage.getItem('raise_financial_targets');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.targets.find((t: FinancialTarget) => t.id === 'ifrs15-evaluation')).toBeUndefined();
    });
  });

  describe('getCategoryDisplayName', () => {
    it('should return correct display name for CashFlow', () => {
      expect(getCategoryDisplayName('CashFlow')).toBe('Cash Flow (Payback Targets)');
    });

    it('should return correct display name for Margins', () => {
      expect(getCategoryDisplayName('Margins')).toBe('Margins (First Margin Targets)');
    });

    it('should return correct display name for Deviations', () => {
      expect(getCategoryDisplayName('Deviations')).toBe('Deviazioni KCP');
    });

    it('should return correct display name for IFRS15', () => {
      expect(getCategoryDisplayName('IFRS15')).toBe('IFRS15 Evaluation');
    });
  });
});
