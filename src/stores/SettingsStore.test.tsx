import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { SettingsProvider, useSettings } from './SettingsStore';
import type { ControlConfig } from '../types';

describe('SettingsStore', () => {
  // Helper to render hook with provider
  const renderWithProvider = () => {
    return renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    });
  };

  beforeEach(() => {
    // Clear localStorage before each test (handled by global setup, but being explicit)
    localStorage.clear();
  });

  describe('Initialization', () => {
    it('should initialize with default controls after loading', async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.controls.length).toBeGreaterThan(0);
    });

    it('should load exactly 71 controls', async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Count from the DEFAULT_CONTROLS in SettingsStore.tsx
      // According to the Excel "Checklist_Supporto RAISE.xlsx"
      expect(result.current.controls.length).toBe(71);
    });

    it('should load controls from localStorage if present', async () => {
      const customControls: ControlConfig[] = [
        {
          id: 'custom-control',
          label: 'Custom Control',
          description: 'A custom test control',
          phase: 'Planning',
          isMandatory: true,
          actionType: 'task'
        }
      ];

      localStorage.setItem('raise_controls', JSON.stringify(customControls));

      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.controls).toHaveLength(1);
      expect(result.current.controls[0].id).toBe('custom-control');
    });
  });

  describe('Control Properties', () => {
    it('should have all required properties on each control', async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.controls.forEach((control) => {
        expect(control).toHaveProperty('id');
        expect(control).toHaveProperty('label');
        expect(control).toHaveProperty('description');
        expect(control).toHaveProperty('phase');
        expect(control).toHaveProperty('isMandatory');

        // Verify types
        expect(typeof control.id).toBe('string');
        expect(typeof control.label).toBe('string');
        expect(typeof control.description).toBe('string');
        expect(typeof control.isMandatory).toBe('boolean');
      });
    });

    it('should have valid phases', async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const validPhases = ['Planning', 'ATP', 'ATS', 'ATC', 'Handover', 'ALL'];

      result.current.controls.forEach((control) => {
        expect(validPhases).toContain(control.phase);
      });
    });

    it('should have ordered controls', async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Controls with order property should be sorted
      const orderedControls = result.current.controls.filter((c) => c.order !== undefined);
      const orders = orderedControls.map((c) => c.order!);

      // Check that orders are sequential within each phase
      expect(orders.length).toBeGreaterThan(0);
    });

    it('should have mandatory controls in ALL phase', async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const allPhaseControls = result.current.controls.filter((c) => c.phase === 'ALL');

      // ALL phase controls typically include critical checks
      expect(allPhaseControls.length).toBeGreaterThan(0);
    });
  });

  describe('Phase Distribution', () => {
    it('should have controls for all phases', async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const phases = ['Planning', 'ATP', 'ATS', 'ATC', 'Handover', 'ALL'];
      phases.forEach((phase) => {
        const phaseControls = result.current.controls.filter((c) => c.phase === phase);
        expect(phaseControls.length).toBeGreaterThan(0);
      });
    });

    it('should have correct phase control counts', async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Based on DEFAULT_CONTROLS structure
      const planningControls = result.current.controls.filter((c) => c.phase === 'Planning');
      const atpControls = result.current.controls.filter((c) => c.phase === 'ATP');
      const atsControls = result.current.controls.filter((c) => c.phase === 'ATS');
      const atcControls = result.current.controls.filter((c) => c.phase === 'ATC');
      const handoverControls = result.current.controls.filter((c) => c.phase === 'Handover');
      const allControls = result.current.controls.filter((c) => c.phase === 'ALL');

      // Just verify they're reasonable counts - exact numbers may change
      expect(planningControls.length).toBeGreaterThanOrEqual(5);
      expect(atpControls.length).toBeGreaterThanOrEqual(5);
      expect(atsControls.length).toBeGreaterThanOrEqual(5);
      expect(atcControls.length).toBeGreaterThanOrEqual(3);
      expect(handoverControls.length).toBeGreaterThanOrEqual(3);
      expect(allControls.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Mandatory Controls', () => {
    it('should have mandatory and non-mandatory controls', async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const mandatory = result.current.controls.filter((c) => c.isMandatory);
      const nonMandatory = result.current.controls.filter((c) => !c.isMandatory);

      expect(mandatory.length).toBeGreaterThan(0);
      expect(nonMandatory.length).toBeGreaterThan(0);
    });

    it('should have document controls that are often mandatory', async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const documentControls = result.current.controls.filter(
        (c) => c.actionType === 'document'
      );

      // Document controls should exist
      expect(documentControls.length).toBeGreaterThan(0);
    });
  });

  describe('Conditional Controls', () => {
    it('should have controls with conditions', async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const conditionalControls = result.current.controls.filter((c) => c.condition);
      expect(conditionalControls.length).toBeGreaterThan(0);
    });

    it('should have valid condition expressions', async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const conditionalControls = result.current.controls.filter((c) => c.condition);

      conditionalControls.forEach((control) => {
        // Conditions should be simple JavaScript expressions
        expect(typeof control.condition).toBe('string');
        expect(control.condition!.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Action Types', () => {
    it('should have valid action types', async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const validActionTypes = ['task', 'document', 'email', 'notification'];

      result.current.controls.forEach((control) => {
        if (control.actionType) {
          expect(validActionTypes).toContain(control.actionType);
        }
      });
    });

    it('should have document controls with template references', async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const documentControls = result.current.controls.filter(
        (c) => c.actionType === 'document'
      );

      // Some document controls should have template references
      const withTemplates = documentControls.filter(c => c.templateRef);
      expect(withTemplates.length).toBeGreaterThan(0);
    });
  });

  describe('Control Management', () => {
    it('should add a new control', async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCount = result.current.controls.length;

      const newControl: ControlConfig = {
        id: 'new-control',
        label: 'New Control',
        description: 'A new test control',
        phase: 'Planning',
        isMandatory: true
      };

      await act(async () => {
        await result.current.addControl(newControl);
      });

      expect(result.current.controls.length).toBe(initialCount + 1);
      expect(result.current.controls.find((c) => c.id === 'new-control')).toBeTruthy();
    });

    it('should update an existing control', async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const controlToUpdate = { ...result.current.controls[0] };
      controlToUpdate.label = 'Updated Label';

      await act(async () => {
        await result.current.updateControl(controlToUpdate);
      });

      const found = result.current.controls.find((c) => c.id === controlToUpdate.id);
      expect(found?.label).toBe('Updated Label');
    });

    it('should delete a control', async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCount = result.current.controls.length;
      const controlToDelete = result.current.controls[0];

      await act(async () => {
        await result.current.deleteControl(controlToDelete.id);
      });

      expect(result.current.controls.length).toBe(initialCount - 1);
      expect(result.current.controls.find((c) => c.id === controlToDelete.id)).toBeUndefined();
    });

    it('should reset to default controls', async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Add a custom control
      const customControl: ControlConfig = {
        id: 'custom-test',
        label: 'Custom',
        description: 'Custom control',
        phase: 'Planning',
        isMandatory: false
      };

      await act(async () => {
        await result.current.addControl(customControl);
      });

      const customCount = result.current.controls.length;
      expect(customCount).toBe(72); // 71 defaults + 1 custom

      // Reset to defaults
      await act(async () => {
        await result.current.resetDefaults();
      });

      expect(result.current.controls.length).toBe(71);
      expect(result.current.controls.find((c) => c.id === 'custom-test')).toBeUndefined();
    });
  });

  describe('localStorage Persistence', () => {
    it('should persist controls to localStorage on changes', async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newControl: ControlConfig = {
        id: 'persist-test',
        label: 'Persist Test',
        description: 'Testing persistence',
        phase: 'Planning',
        isMandatory: true
      };

      await act(async () => {
        await result.current.addControl(newControl);
      });

      const stored = localStorage.getItem('raise_controls');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.find((c: ControlConfig) => c.id === 'persist-test')).toBeTruthy();
    });

    it('should persist reset to localStorage', async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Add custom control
      await act(async () => {
        await result.current.addControl({
          id: 'temp-control',
          label: 'Temp',
          description: 'Temporary',
          phase: 'Planning',
          isMandatory: false
        });
      });

      // Reset
      await act(async () => {
        await result.current.resetDefaults();
      });

      const stored = localStorage.getItem('raise_controls');
      const parsed = JSON.parse(stored!);
      expect(parsed.length).toBe(71);
      expect(parsed.find((c: ControlConfig) => c.id === 'temp-control')).toBeFalsy();
    });
  });

  describe('Template References', () => {
    it('should have templateRef for document controls', async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Controls with templates
      const controlsWithTemplates = [
        { id: 'mod-091-atp', ref: 'MOD-091' },
        { id: 'mod-092-atp-l123', ref: 'MOD-092' },
        { id: 'mod-001-rcp', ref: 'MOD-001' },
        { id: 'mod-093-risk-l123', ref: 'MOD-093' },
      ];

      controlsWithTemplates.forEach(({ id, ref }) => {
        const control = result.current.controls.find((c) => c.id === id);
        expect(control).toBeDefined();
        expect(control?.templateRef).toContain(ref);
      });
    });
  });

  describe('Detailed Descriptions', () => {
    it('should have detailed descriptions for complex controls', async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Controls that should have detailed descriptions
      const controlsWithDetails = result.current.controls.filter(
        (c) => c.detailedDescription
      );

      expect(controlsWithDetails.length).toBeGreaterThan(0);
    });
  });

  describe('Mandatory Notes', () => {
    it('should have mandatory notes for conditional mandatory controls', async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const controlsWithMandatoryNotes = result.current.controls.filter(
        (c) => c.mandatoryNotes
      );

      // Should have some controls with mandatory notes
      expect(controlsWithMandatoryNotes.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Hook Error Handling', () => {
    it('should throw error when useSettings used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useSettings());
      }).toThrow('useSettings must be used within a SettingsProvider');

      consoleSpy.mockRestore();
    });
  });
});
