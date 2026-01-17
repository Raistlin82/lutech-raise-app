import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getUnderMarginConfig,
  saveUnderMarginConfig,
  resetUnderMarginConfig,
  getThresholdsByType,
  isUnderMargin,
  requiresApproval,
  getRequiredApprovalLevel,
  updateThreshold,
  addThreshold,
  removeThreshold,
  getMarginTypeDisplayName,
  DEFAULT_UNDER_MARGIN,
} from './underMarginService';
import type { UnderMarginConfig, MarginThreshold } from '../types';

describe('underMarginService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getUnderMarginConfig', () => {
    it('should return default config when localStorage is empty', () => {
      const config = getUnderMarginConfig();
      expect(config.id).toBe('default');
      expect(config.name).toBe('PSQ-003 v17 Default');
      expect(config.thresholds.length).toBe(10);
    });

    it('should return saved config from localStorage', () => {
      const customConfig: UnderMarginConfig = {
        id: 'custom',
        name: 'Custom Margin Config',
        isActive: true,
        thresholds: [
          {
            id: 'custom-threshold',
            type: 'Products',
            name: 'Custom Products',
            targetMargin: 20,
            minimumMargin: 12,
            approvalRequired: true,
            approverLevel: 'L3',
          },
        ],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      localStorage.setItem('raise_under_margin', JSON.stringify(customConfig));

      const config = getUnderMarginConfig();
      expect(config.id).toBe('custom');
      expect(config.name).toBe('Custom Margin Config');
      expect(config.thresholds.length).toBe(1);
    });

    it('should return default config when localStorage contains invalid JSON', () => {
      localStorage.setItem('raise_under_margin', 'invalid-json');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const config = getUnderMarginConfig();
      expect(config.id).toBe('default');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('saveUnderMarginConfig', () => {
    it('should save config to localStorage', () => {
      const customConfig: UnderMarginConfig = {
        id: 'custom',
        name: 'Custom Config',
        isActive: true,
        thresholds: DEFAULT_UNDER_MARGIN.thresholds,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      saveUnderMarginConfig(customConfig);

      const stored = localStorage.getItem('raise_under_margin');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.id).toBe('custom');
    });

    it('should update the updatedAt timestamp', () => {
      const customConfig: UnderMarginConfig = {
        id: 'custom',
        name: 'Custom Config',
        isActive: true,
        thresholds: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      saveUnderMarginConfig(customConfig);

      const stored = localStorage.getItem('raise_under_margin');
      const parsed = JSON.parse(stored!);
      expect(parsed.updatedAt).not.toBe('2024-01-01');
    });
  });

  describe('resetUnderMarginConfig', () => {
    it('should remove config from localStorage', () => {
      localStorage.setItem('raise_under_margin', JSON.stringify(DEFAULT_UNDER_MARGIN));
      expect(localStorage.getItem('raise_under_margin')).toBeTruthy();

      resetUnderMarginConfig();

      expect(localStorage.getItem('raise_under_margin')).toBeNull();
    });

    it('should not throw when localStorage is already empty', () => {
      expect(() => resetUnderMarginConfig()).not.toThrow();
    });
  });

  describe('getThresholdsByType', () => {
    it('should return Products thresholds', () => {
      const thresholds = getThresholdsByType('Products');
      expect(thresholds.length).toBe(2);
      expect(thresholds.every(t => t.type === 'Products')).toBe(true);
    });

    it('should return Services thresholds', () => {
      const thresholds = getThresholdsByType('Services');
      expect(thresholds.length).toBe(2);
      expect(thresholds.every(t => t.type === 'Services')).toBe(true);
    });

    it('should return Practice thresholds', () => {
      const thresholds = getThresholdsByType('Practice');
      expect(thresholds.length).toBe(6);
      expect(thresholds.every(t => t.type === 'Practice')).toBe(true);
    });

    it('should return empty array for non-existent type', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const thresholds = getThresholdsByType('NonExistent' as any);
      expect(thresholds.length).toBe(0);
    });

    it('should use custom thresholds from localStorage', () => {
      const customConfig: UnderMarginConfig = {
        id: 'custom',
        name: 'Custom',
        isActive: true,
        thresholds: [
          { id: 'p1', type: 'Products', name: 'P1', targetMargin: 10, minimumMargin: 5, approvalRequired: true },
          { id: 'p2', type: 'Products', name: 'P2', targetMargin: 15, minimumMargin: 8, approvalRequired: true },
          { id: 'p3', type: 'Products', name: 'P3', targetMargin: 20, minimumMargin: 12, approvalRequired: true },
        ],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      localStorage.setItem('raise_under_margin', JSON.stringify(customConfig));

      const thresholds = getThresholdsByType('Products');
      expect(thresholds.length).toBe(3);
    });
  });

  describe('isUnderMargin', () => {
    it('should return true when margin is below target', () => {
      // products-reselling has targetMargin: 16
      expect(isUnderMargin('products-reselling', 15)).toBe(true);
      expect(isUnderMargin('products-reselling', 10)).toBe(true);
      expect(isUnderMargin('products-reselling', 0)).toBe(true);
    });

    it('should return false when margin equals target', () => {
      expect(isUnderMargin('products-reselling', 16)).toBe(false);
    });

    it('should return false when margin is above target', () => {
      expect(isUnderMargin('products-reselling', 17)).toBe(false);
      expect(isUnderMargin('products-reselling', 20)).toBe(false);
    });

    it('should return false for non-existent threshold', () => {
      expect(isUnderMargin('non-existent', 10)).toBe(false);
    });

    it('should use correct target for each threshold', () => {
      // practice-security has targetMargin: 32
      expect(isUnderMargin('practice-security', 31)).toBe(true);
      expect(isUnderMargin('practice-security', 32)).toBe(false);

      // services-standard has targetMargin: 25
      expect(isUnderMargin('services-standard', 24)).toBe(true);
      expect(isUnderMargin('services-standard', 25)).toBe(false);
    });
  });

  describe('requiresApproval', () => {
    it('should return true when margin is below target and approval required', () => {
      // products-reselling has targetMargin: 16, approvalRequired: true
      expect(requiresApproval('products-reselling', 15)).toBe(true);
    });

    it('should return false when margin equals target', () => {
      expect(requiresApproval('products-reselling', 16)).toBe(false);
    });

    it('should return false when margin is above target', () => {
      expect(requiresApproval('products-reselling', 20)).toBe(false);
    });

    it('should return false for non-existent threshold', () => {
      expect(requiresApproval('non-existent', 10)).toBe(false);
    });

    it('should return false when approval not required even if under margin', () => {
      const customConfig: UnderMarginConfig = {
        id: 'custom',
        name: 'Custom',
        isActive: true,
        thresholds: [
          {
            id: 'no-approval',
            type: 'Products',
            name: 'No Approval Needed',
            targetMargin: 20,
            minimumMargin: 10,
            approvalRequired: false,
          },
        ],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      localStorage.setItem('raise_under_margin', JSON.stringify(customConfig));

      expect(requiresApproval('no-approval', 15)).toBe(false);
    });
  });

  describe('getRequiredApprovalLevel', () => {
    it('should return L3 when margin is below minimum', () => {
      // products-reselling has minimumMargin: 10
      expect(getRequiredApprovalLevel('products-reselling', 8)).toBe('L3');
      expect(getRequiredApprovalLevel('products-reselling', 5)).toBe('L3');
    });

    it('should return approverLevel when margin is between minimum and target', () => {
      // products-reselling has targetMargin: 16, minimumMargin: 10, approverLevel: L4
      expect(getRequiredApprovalLevel('products-reselling', 12)).toBe('L4');
      expect(getRequiredApprovalLevel('products-reselling', 15)).toBe('L4');
    });

    it('should return null when margin meets target', () => {
      expect(getRequiredApprovalLevel('products-reselling', 16)).toBeNull();
      expect(getRequiredApprovalLevel('products-reselling', 20)).toBeNull();
    });

    it('should return null for non-existent threshold', () => {
      expect(getRequiredApprovalLevel('non-existent', 10)).toBeNull();
    });

    it('should return default L4 when approverLevel not specified', () => {
      const customConfig: UnderMarginConfig = {
        id: 'custom',
        name: 'Custom',
        isActive: true,
        thresholds: [
          {
            id: 'no-level',
            type: 'Products',
            name: 'No Approver Level',
            targetMargin: 20,
            minimumMargin: 10,
            approvalRequired: true,
            // no approverLevel specified
          },
        ],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      localStorage.setItem('raise_under_margin', JSON.stringify(customConfig));

      expect(getRequiredApprovalLevel('no-level', 15)).toBe('L4');
    });

    it('should return null when approval not required', () => {
      const customConfig: UnderMarginConfig = {
        id: 'custom',
        name: 'Custom',
        isActive: true,
        thresholds: [
          {
            id: 'no-approval',
            type: 'Products',
            name: 'No Approval',
            targetMargin: 20,
            minimumMargin: 10,
            approvalRequired: false,
          },
        ],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      localStorage.setItem('raise_under_margin', JSON.stringify(customConfig));

      // Above minimum but below target, no approval required
      expect(getRequiredApprovalLevel('no-approval', 15)).toBeNull();
    });
  });

  describe('updateThreshold', () => {
    it('should update existing threshold', () => {
      const updatedThreshold: MarginThreshold = {
        id: 'products-reselling',
        type: 'Products',
        name: 'Updated Products',
        targetMargin: 20,
        minimumMargin: 12,
        approvalRequired: true,
        approverLevel: 'L3',
        notes: 'Updated notes',
      };

      updateThreshold(updatedThreshold);

      const config = getUnderMarginConfig();
      const threshold = config.thresholds.find(t => t.id === 'products-reselling');
      expect(threshold?.targetMargin).toBe(20);
      expect(threshold?.approverLevel).toBe('L3');
    });

    it('should not modify config for non-existent threshold', () => {
      const nonExistentThreshold: MarginThreshold = {
        id: 'non-existent',
        type: 'Products',
        name: 'Non-existent',
        targetMargin: 50,
        minimumMargin: 40,
        approvalRequired: true,
      };

      updateThreshold(nonExistentThreshold);

      const config = getUnderMarginConfig();
      expect(config.thresholds.find(t => t.id === 'non-existent')).toBeUndefined();
    });

    it('should persist changes to localStorage', () => {
      const updatedThreshold: MarginThreshold = {
        id: 'services-standard',
        type: 'Services',
        name: 'Updated Services',
        targetMargin: 30,
        minimumMargin: 20,
        approvalRequired: true,
        approverLevel: 'L2',
      };

      updateThreshold(updatedThreshold);

      const stored = localStorage.getItem('raise_under_margin');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      const threshold = parsed.thresholds.find((t: MarginThreshold) => t.id === 'services-standard');
      expect(threshold?.targetMargin).toBe(30);
    });
  });

  describe('addThreshold', () => {
    it('should add new threshold to config', () => {
      const newThreshold: MarginThreshold = {
        id: 'new-threshold',
        type: 'Practice',
        name: 'New Practice',
        targetMargin: 35,
        minimumMargin: 28,
        approvalRequired: true,
        approverLevel: 'L4',
        notes: 'New practice threshold',
      };

      addThreshold(newThreshold);

      const config = getUnderMarginConfig();
      const threshold = config.thresholds.find(t => t.id === 'new-threshold');
      expect(threshold).toBeDefined();
      expect(threshold?.targetMargin).toBe(35);
    });

    it('should append to existing thresholds', () => {
      const initialCount = getUnderMarginConfig().thresholds.length;

      const newThreshold: MarginThreshold = {
        id: 'extra-threshold',
        type: 'Services',
        name: 'Extra Service',
        targetMargin: 28,
        minimumMargin: 20,
        approvalRequired: true,
      };

      addThreshold(newThreshold);

      const config = getUnderMarginConfig();
      expect(config.thresholds.length).toBe(initialCount + 1);
    });

    it('should persist new threshold to localStorage', () => {
      const newThreshold: MarginThreshold = {
        id: 'persisted-threshold',
        type: 'Products',
        name: 'Persisted',
        targetMargin: 22,
        minimumMargin: 14,
        approvalRequired: true,
      };

      addThreshold(newThreshold);

      const stored = localStorage.getItem('raise_under_margin');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.thresholds.find((t: MarginThreshold) => t.id === 'persisted-threshold')).toBeDefined();
    });
  });

  describe('removeThreshold', () => {
    it('should remove threshold by id', () => {
      const initialCount = getUnderMarginConfig().thresholds.length;

      removeThreshold('products-reselling');

      const config = getUnderMarginConfig();
      expect(config.thresholds.length).toBe(initialCount - 1);
      expect(config.thresholds.find(t => t.id === 'products-reselling')).toBeUndefined();
    });

    it('should not modify config when removing non-existent threshold', () => {
      const initialCount = getUnderMarginConfig().thresholds.length;

      removeThreshold('non-existent-id');

      const config = getUnderMarginConfig();
      expect(config.thresholds.length).toBe(initialCount);
    });

    it('should persist removal to localStorage', () => {
      removeThreshold('practice-security');

      const stored = localStorage.getItem('raise_under_margin');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.thresholds.find((t: MarginThreshold) => t.id === 'practice-security')).toBeUndefined();
    });
  });

  describe('getMarginTypeDisplayName', () => {
    it('should return correct display name for Products', () => {
      expect(getMarginTypeDisplayName('Products')).toBe('Prodotti');
    });

    it('should return correct display name for Services', () => {
      expect(getMarginTypeDisplayName('Services')).toBe('Servizi');
    });

    it('should return correct display name for Practice', () => {
      expect(getMarginTypeDisplayName('Practice')).toBe('Practice');
    });
  });
});
