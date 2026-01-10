/**
 * ControlService Tests
 * Tests CRUD operations for controls with localStorage fallback
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getControls,
  getControl,
  createControl,
  updateControl,
  deleteControl,
  resetControls,
  isUsingSupabase,
} from './controlService';
import type { ControlConfig } from '../types';

// Mock supabase module
// Mock supabase module handled in setup.ts

const STORAGE_KEY = 'raise_controls';

const createMockControl = (overrides: Partial<ControlConfig> = {}): ControlConfig => ({
  id: 'ctrl-123',
  label: 'Test Control',
  description: 'Test Description',
  phase: 'Planning',
  isMandatory: true,
  ...overrides,
});

describe('ControlService', () => {
  beforeEach(() => {
    localStorage.clear();
    // Ensure test mode is set for localStorage fallback
    localStorage.setItem('testMode', 'true');
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('isUsingSupabase', () => {
    it('should return false when Supabase is not configured', () => {
      expect(isUsingSupabase()).toBe(false);
    });
  });

  describe('getControls - localStorage fallback', () => {
    it('should return empty array when no controls exist', async () => {
      const controls = await getControls();
      expect(controls).toEqual([]);
    });

    it('should return controls from localStorage', async () => {
      const mockControl = createMockControl();
      localStorage.setItem(STORAGE_KEY, JSON.stringify([mockControl]));

      const controls = await getControls();
      expect(controls).toHaveLength(1);
      expect(controls[0].id).toBe(mockControl.id);
      expect(controls[0].label).toBe(mockControl.label);
    });

    it('should return multiple controls', async () => {
      const mockControls = [
        createMockControl({ id: 'ctrl-1', label: 'Control 1' }),
        createMockControl({ id: 'ctrl-2', label: 'Control 2' }),
        createMockControl({ id: 'ctrl-3', label: 'Control 3' }),
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockControls));

      const controls = await getControls();
      expect(controls).toHaveLength(3);
    });

    it('should preserve all control properties', async () => {
      const mockControl = createMockControl({
        id: 'full-ctrl',
        label: 'Full Control',
        description: 'Full Description',
        phase: 'ATP',
        order: 5,
        isMandatory: false,
        actionType: 'task',
        condition: 'tcv > 500000',
        detailedDescription: 'Detailed info',
        folderPath: '/path/to/folder',
        mandatoryNotes: 'Important notes',
        templateRef: 'TEMP-001',
        templateLinks: [
          { name: 'Link 1', url: 'https://example.com/1' },
          { name: 'Link 2', url: 'https://example.com/2' },
        ],
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify([mockControl]));

      const controls = await getControls();
      expect(controls[0].order).toBe(5);
      expect(controls[0].actionType).toBe('task');
      expect(controls[0].condition).toBe('tcv > 500000');
      expect(controls[0].templateLinks).toHaveLength(2);
    });
  });

  describe('getControl - localStorage fallback', () => {
    it('should return null when control not found', async () => {
      const control = await getControl('non-existent');
      expect(control).toBeNull();
    });

    it('should return the correct control by ID', async () => {
      const mockControls = [
        createMockControl({ id: 'ctrl-1', label: 'Control 1' }),
        createMockControl({ id: 'ctrl-2', label: 'Control 2' }),
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockControls));

      const control = await getControl('ctrl-2');
      expect(control).not.toBeNull();
      expect(control?.id).toBe('ctrl-2');
      expect(control?.label).toBe('Control 2');
    });

    it('should return null from empty localStorage', async () => {
      const control = await getControl('ctrl-1');
      expect(control).toBeNull();
    });
  });

  describe('createControl - localStorage fallback', () => {
    it('should create a new control in localStorage', async () => {
      const newControl = createMockControl({ id: 'new-ctrl', label: 'New Control' });

      const created = await createControl(newControl);
      expect(created.id).toBe('new-ctrl');
      expect(created.label).toBe('New Control');

      // Verify it's in localStorage
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe('new-ctrl');
    });

    it('should add to existing controls', async () => {
      const existingControl = createMockControl({ id: 'existing', label: 'Existing' });
      localStorage.setItem(STORAGE_KEY, JSON.stringify([existingControl]));

      const newControl = createMockControl({ id: 'new-ctrl', label: 'New' });
      await createControl(newControl);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored).toHaveLength(2);
    });

    it('should preserve control properties', async () => {
      const newControl = createMockControl({
        id: 'prop-test',
        label: 'Property Test',
        phase: 'ATS',
        isMandatory: false,
        order: 10,
      });

      await createControl(newControl);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored[0].phase).toBe('ATS');
      expect(stored[0].isMandatory).toBe(false);
      expect(stored[0].order).toBe(10);
    });
  });

  describe('updateControl - localStorage fallback', () => {
    it('should update an existing control', async () => {
      const original = createMockControl({ id: 'update-test', label: 'Original' });
      localStorage.setItem(STORAGE_KEY, JSON.stringify([original]));

      const updated = { ...original, label: 'Updated Label' };
      const result = await updateControl(updated);

      expect(result.label).toBe('Updated Label');

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored[0].label).toBe('Updated Label');
    });

    it('should throw error when control not found', async () => {
      const nonExistent = createMockControl({ id: 'non-existent' });

      await expect(updateControl(nonExistent)).rejects.toThrow('Control not found');
    });

    it('should update phase correctly', async () => {
      const original = createMockControl({
        id: 'phase-test',
        phase: 'Planning',
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify([original]));

      const updated = { ...original, phase: 'ATP' as const };
      await updateControl(updated);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored[0].phase).toBe('ATP');
    });

    it('should update isMandatory flag', async () => {
      const original = createMockControl({
        id: 'mandatory-test',
        isMandatory: true,
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify([original]));

      const updated = { ...original, isMandatory: false };
      await updateControl(updated);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored[0].isMandatory).toBe(false);
    });

    it('should update description', async () => {
      const original = createMockControl({
        id: 'desc-test',
        description: 'Original description',
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify([original]));

      const updated = { ...original, description: 'Updated description' };
      await updateControl(updated);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored[0].description).toBe('Updated description');
    });
  });

  describe('deleteControl - localStorage fallback', () => {
    it('should delete an existing control', async () => {
      const mockControls = [
        createMockControl({ id: 'ctrl-1' }),
        createMockControl({ id: 'ctrl-2' }),
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockControls));

      await deleteControl('ctrl-1');

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe('ctrl-2');
    });

    it('should handle deletion of non-existent control gracefully', async () => {
      const mockControl = createMockControl({ id: 'ctrl-1' });
      localStorage.setItem(STORAGE_KEY, JSON.stringify([mockControl]));

      // Should not throw
      await deleteControl('non-existent');

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored).toHaveLength(1); // Original still exists
    });

    it('should handle deletion from empty localStorage', async () => {
      // Should not throw
      await deleteControl('any-id');

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored).toHaveLength(0);
    });

    it('should delete all controls one by one', async () => {
      const mockControls = [
        createMockControl({ id: 'ctrl-1' }),
        createMockControl({ id: 'ctrl-2' }),
        createMockControl({ id: 'ctrl-3' }),
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockControls));

      await deleteControl('ctrl-1');
      await deleteControl('ctrl-2');
      await deleteControl('ctrl-3');

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored).toHaveLength(0);
    });
  });

  describe('resetControls - localStorage fallback', () => {
    it('should replace all controls with defaults', async () => {
      const existingControls = [
        createMockControl({ id: 'old-1' }),
        createMockControl({ id: 'old-2' }),
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingControls));

      const defaultControls = [
        createMockControl({ id: 'default-1', label: 'Default 1' }),
        createMockControl({ id: 'default-2', label: 'Default 2' }),
        createMockControl({ id: 'default-3', label: 'Default 3' }),
      ];

      await resetControls(defaultControls);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored).toHaveLength(3);
      expect(stored[0].id).toBe('default-1');
      expect(stored[1].id).toBe('default-2');
      expect(stored[2].id).toBe('default-3');
    });

    it('should work with empty existing controls', async () => {
      const defaultControls = [
        createMockControl({ id: 'new-1' }),
      ];

      await resetControls(defaultControls);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored).toHaveLength(1);
    });

    it('should work with empty default controls', async () => {
      const existingControls = [
        createMockControl({ id: 'old-1' }),
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingControls));

      await resetControls([]);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored).toHaveLength(0);
    });
  });

  describe('Complex scenarios', () => {
    it('should handle CRUD lifecycle', async () => {
      // Create
      const newControl = createMockControl({ id: 'lifecycle-test', label: 'Initial' });
      await createControl(newControl);

      // Read
      const retrieved = await getControl('lifecycle-test');
      expect(retrieved?.label).toBe('Initial');

      // Update
      const updated = { ...newControl, label: 'Updated' };
      await updateControl(updated);

      const retrievedAfterUpdate = await getControl('lifecycle-test');
      expect(retrievedAfterUpdate?.label).toBe('Updated');

      // Delete
      await deleteControl('lifecycle-test');
      const retrievedAfterDelete = await getControl('lifecycle-test');
      expect(retrievedAfterDelete).toBeNull();
    });

    it('should handle controls for all phases', async () => {
      const phases = ['Planning', 'ATP', 'ATS', 'ATC', 'Handover'] as const;

      for (const phase of phases) {
        await createControl(createMockControl({
          id: `ctrl-${phase}`,
          phase,
          label: `${phase} Control`,
        }));
      }

      const controls = await getControls();
      expect(controls).toHaveLength(5);

      const phaseSet = new Set(controls.map(c => c.phase));
      expect(phaseSet.size).toBe(5);
    });

    it('should handle controls with template links', async () => {
      const controlWithLinks = createMockControl({
        id: 'links-test',
        templateLinks: [
          { name: 'Template 1', url: 'https://template1.com' },
          { name: 'Template 2', url: 'https://template2.com' },
        ],
      });

      await createControl(controlWithLinks);
      const retrieved = await getControl('links-test');

      expect(retrieved?.templateLinks).toHaveLength(2);
      expect(retrieved?.templateLinks?.[0].name).toBe('Template 1');
      expect(retrieved?.templateLinks?.[1].url).toBe('https://template2.com');
    });

    it('should handle conditional controls', async () => {
      const conditionalControl = createMockControl({
        id: 'conditional-test',
        condition: 'isRti === true',
        isMandatory: true,
      });

      await createControl(conditionalControl);
      const retrieved = await getControl('conditional-test');

      expect(retrieved?.condition).toBe('isRti === true');
    });

    it('should handle controls with action types', async () => {
      const actionControl = createMockControl({
        id: 'action-test',
        actionType: 'task',
        mandatoryNotes: 'Must be completed before proceeding',
      });

      await createControl(actionControl);
      const retrieved = await getControl('action-test');

      expect(retrieved?.actionType).toBe('task');
      expect(retrieved?.mandatoryNotes).toBe('Must be completed before proceeding');
    });

    it('should maintain order when updating controls', async () => {
      const controls = [
        createMockControl({ id: 'ctrl-1', order: 1 }),
        createMockControl({ id: 'ctrl-2', order: 2 }),
        createMockControl({ id: 'ctrl-3', order: 3 }),
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(controls));

      // Update middle control
      await updateControl(createMockControl({ id: 'ctrl-2', order: 2, label: 'Updated' }));

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored[0].id).toBe('ctrl-1');
      expect(stored[1].id).toBe('ctrl-2');
      expect(stored[1].label).toBe('Updated');
      expect(stored[2].id).toBe('ctrl-3');
    });
  });
});
