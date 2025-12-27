import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { SettingsProvider, useSettings } from './SettingsStore';
import type { ControlConfig } from '../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('SettingsStore', () => {
  // Helper to render hook with provider
  const renderWithProvider = () => {
    return renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    });
  };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Initialization', () => {
    it('should initialize with default controls', () => {
      const { result } = renderWithProvider();
      expect(result.current.controls.length).toBeGreaterThan(0);
    });

    it('should load exactly 71 controls', () => {
      const { result } = renderWithProvider();
      // Count from the DEFAULT_CONTROLS in SettingsStore.tsx
      // According to the Excel "Checklist_Supporto RAISE.xlsx"
      expect(result.current.controls.length).toBe(71);
    });

    it('should load controls from localStorage if present', () => {
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
      expect(result.current.controls).toHaveLength(1);
      expect(result.current.controls[0].id).toBe('custom-control');
    });
  });

  describe('Control Properties', () => {
    it('should have all required properties on each control', () => {
      const { result } = renderWithProvider();

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

    it('should have valid phases', () => {
      const { result } = renderWithProvider();
      const validPhases = ['Planning', 'ATP', 'ATS', 'ATC', 'Handover', 'ALL'];

      result.current.controls.forEach((control) => {
        expect(validPhases).toContain(control.phase);
      });
    });

    it('should mark mandatory controls correctly', () => {
      const { result } = renderWithProvider();

      // Some specific mandatory controls from the Excel
      const mandatoryControls = [
        'opp-site',
        'crm-case',
        'offer-code',
        'mod-001-rcp',
        'contract-order'
      ];

      mandatoryControls.forEach((id) => {
        const control = result.current.controls.find((c) => c.id === id);
        expect(control).toBeDefined();
        expect(control?.isMandatory).toBe(true);
      });
    });

    it('should mark optional controls correctly', () => {
      const { result } = renderWithProvider();

      // Some specific optional controls from the Excel
      const optionalControls = [
        'expert-compliance-esg',
        'expert-compliance-sistemi',
        'expert-compliance-general',
        'expert-security-officer',
        'expert-hse',
        'expert-chro'
      ];

      optionalControls.forEach((id) => {
        const control = result.current.controls.find((c) => c.id === id);
        expect(control).toBeDefined();
        expect(control?.isMandatory).toBe(false);
      });
    });

    it('should have actionType for controls', () => {
      const { result } = renderWithProvider();
      const validActionTypes = ['document', 'email', 'notification', 'task'];

      result.current.controls.forEach((control) => {
        if (control.actionType) {
          expect(validActionTypes).toContain(control.actionType);
        }
      });
    });
  });

  describe('Phase-specific Controls', () => {
    it('should have Planning phase controls', () => {
      const { result } = renderWithProvider();
      const planningControls = result.current.controls.filter((c) => c.phase === 'Planning');

      expect(planningControls.length).toBeGreaterThan(0);
      expect(planningControls.some((c) => c.id === 'opp-site')).toBe(true);
      expect(planningControls.some((c) => c.id === 'crm-case')).toBe(true);
      expect(planningControls.some((c) => c.id === 'offer-code')).toBe(true);
    });

    it('should have ATP phase controls', () => {
      const { result } = renderWithProvider();
      const atpControls = result.current.controls.filter((c) => c.phase === 'ATP');

      expect(atpControls.length).toBeGreaterThan(0);
      expect(atpControls.some((c) => c.id === 'doc-request-atp')).toBe(true);
      expect(atpControls.some((c) => c.id === 'mod-091-atp')).toBe(true);
    });

    it('should have ATS phase controls', () => {
      const { result } = renderWithProvider();
      const atsControls = result.current.controls.filter((c) => c.phase === 'ATS');

      expect(atsControls.length).toBeGreaterThan(0);
      expect(atsControls.some((c) => c.id === 'mod-001-rcp')).toBe(true);
      expect(atsControls.some((c) => c.id === 'offerta-tecnica-economica')).toBe(true);
    });

    it('should have ATC phase controls', () => {
      const { result } = renderWithProvider();
      const atcControls = result.current.controls.filter((c) => c.phase === 'ATC');

      expect(atcControls.length).toBeGreaterThan(0);
      expect(atcControls.some((c) => c.id === 'contract-order')).toBe(true);
      expect(atcControls.some((c) => c.id === 'mod-095-atc')).toBe(true);
    });

    it('should have Handover phase controls', () => {
      const { result } = renderWithProvider();
      const handoverControls = result.current.controls.filter((c) => c.phase === 'Handover');

      expect(handoverControls.length).toBeGreaterThan(0);
      expect(handoverControls.some((c) => c.id === 'handover-meeting-l123')).toBe(true);
      expect(handoverControls.some((c) => c.id === 'delivery-grant')).toBe(true);
    });

    it('should have ALL phase controls (under-margin)', () => {
      const { result } = renderWithProvider();
      const allPhaseControls = result.current.controls.filter((c) => c.phase === 'ALL');

      expect(allPhaseControls.length).toBeGreaterThan(0);
      // Under-margin controls apply to ALL phases
      expect(allPhaseControls.some((c) => c.id === 'undermargin-var-below-6pct')).toBe(true);
      expect(allPhaseControls.some((c) => c.id === 'undermargin-services-0-250k')).toBe(true);
    });
  });

  describe('Conditional Controls', () => {
    it('should have condition strings for conditional controls', () => {
      const { result } = renderWithProvider();

      // L1-L5 controls with conditions
      const conditionalControl = result.current.controls.find((c) => c.id === 'doc-request-atp');
      expect(conditionalControl?.condition).toBeDefined();
      expect(conditionalControl?.condition).toContain('raiseLevel');
    });

    it('should have small ticket pre-approval with condition', () => {
      const { result } = renderWithProvider();
      const smallTicketControl = result.current.controls.find((c) => c.id === 'small-ticket-check');

      expect(smallTicketControl).toBeDefined();
      expect(smallTicketControl?.condition).toContain('isSmallTicket');
    });

    it('should have RTI-specific controls with conditions', () => {
      const { result } = renderWithProvider();
      const rtiControl = result.current.controls.find((c) => c.id === 'rti-patti-parasociali');

      expect(rtiControl).toBeDefined();
      expect(rtiControl?.condition).toContain('isRti');
    });

    it('should have KCP deviation conditional controls', () => {
      const { result } = renderWithProvider();
      const kcpControl = result.current.controls.find((c) => c.id === 'mod-093-risk-l45');

      expect(kcpControl).toBeDefined();
      expect(kcpControl?.condition).toContain('hasKcpDeviations');
    });
  });

  describe('Control Management', () => {
    it('should add a new control', () => {
      const { result } = renderWithProvider();
      const initialCount = result.current.controls.length;

      const newControl: ControlConfig = {
        id: 'test-control',
        label: 'Test Control',
        description: 'A test control',
        phase: 'Planning',
        isMandatory: true,
        actionType: 'task'
      };

      act(() => {
        result.current.addControl(newControl);
      });

      expect(result.current.controls.length).toBe(initialCount + 1);
      expect(result.current.controls.find((c) => c.id === 'test-control')).toEqual(newControl);
    });

    it('should update an existing control', () => {
      const { result } = renderWithProvider();

      const controlToUpdate = result.current.controls[0];
      const updatedControl = {
        ...controlToUpdate,
        label: 'Updated Label'
      };

      act(() => {
        result.current.updateControl(updatedControl);
      });

      const found = result.current.controls.find((c) => c.id === controlToUpdate.id);
      expect(found?.label).toBe('Updated Label');
    });

    it('should delete a control', () => {
      const { result } = renderWithProvider();
      const initialCount = result.current.controls.length;
      const controlToDelete = result.current.controls[0];

      act(() => {
        result.current.deleteControl(controlToDelete.id);
      });

      expect(result.current.controls.length).toBe(initialCount - 1);
      expect(result.current.controls.find((c) => c.id === controlToDelete.id)).toBeUndefined();
    });

    it('should reset to default controls', () => {
      const { result } = renderWithProvider();

      // Add a custom control
      const customControl: ControlConfig = {
        id: 'custom-test',
        label: 'Custom',
        description: 'Custom control',
        phase: 'Planning',
        isMandatory: false
      };

      act(() => {
        result.current.addControl(customControl);
      });

      const customCount = result.current.controls.length;
      expect(customCount).toBe(72); // 71 defaults + 1 custom

      // Reset to defaults
      act(() => {
        result.current.resetDefaults();
      });

      expect(result.current.controls.length).toBe(71);
      expect(result.current.controls.find((c) => c.id === 'custom-test')).toBeUndefined();
    });
  });

  describe('localStorage Persistence', () => {
    it('should persist controls to localStorage on changes', () => {
      const { result } = renderWithProvider();

      const newControl: ControlConfig = {
        id: 'persist-test',
        label: 'Persist Test',
        description: 'Testing persistence',
        phase: 'Planning',
        isMandatory: true
      };

      act(() => {
        result.current.addControl(newControl);
      });

      const stored = localStorage.getItem('raise_controls');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.find((c: ControlConfig) => c.id === 'persist-test')).toBeTruthy();
    });

    it('should persist reset to localStorage', () => {
      const { result } = renderWithProvider();

      // Add custom control
      act(() => {
        result.current.addControl({
          id: 'temp-control',
          label: 'Temp',
          description: 'Temporary',
          phase: 'Planning',
          isMandatory: false
        });
      });

      // Reset
      act(() => {
        result.current.resetDefaults();
      });

      const stored = localStorage.getItem('raise_controls');
      const parsed = JSON.parse(stored!);
      expect(parsed.length).toBe(71);
      expect(parsed.find((c: ControlConfig) => c.id === 'temp-control')).toBeFalsy();
    });
  });

  describe('Template References', () => {
    it('should have templateRef for document controls', () => {
      const { result } = renderWithProvider();

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
    it('should have detailed descriptions for complex controls', () => {
      const { result } = renderWithProvider();

      // Controls that should have detailed descriptions
      const controlsWithDetails = [
        'mod-001-rcp',
        'offerte-fornitori-ats',
        'expert-cmcio-reselling',
        'mod-096b-handover-l123'
      ];

      controlsWithDetails.forEach((id) => {
        const control = result.current.controls.find((c) => c.id === id);
        expect(control).toBeDefined();
        expect(control?.detailedDescription).toBeDefined();
        expect(control?.detailedDescription!.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Folder Paths', () => {
    it('should have folder paths for document controls', () => {
      const { result } = renderWithProvider();

      // Controls with folder paths
      const controlsWithPaths = [
        'doc-request-atp',
        'mod-091-atp',
        'mod-001-rcp',
        'offerta-tecnica-economica',
        'contract-order'
      ];

      controlsWithPaths.forEach((id) => {
        const control = result.current.controls.find((c) => c.id === id);
        if (control?.folderPath) {
          expect(control.folderPath.length).toBeGreaterThan(0);
        }
      });
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
