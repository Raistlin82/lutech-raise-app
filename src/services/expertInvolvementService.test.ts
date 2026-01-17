import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getExpertInvolvement,
  saveExpertInvolvement,
  resetExpertInvolvement,
  getExpertsForLevel,
  updateExpert,
  addExpert,
  removeExpert,
  getExpertFunctionDisplayName,
  DEFAULT_EXPERT_INVOLVEMENT,
} from './expertInvolvementService';
import type { ExpertInvolvementConfig, ExpertConfig } from '../types';

describe('expertInvolvementService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getExpertInvolvement', () => {
    it('should return default config when localStorage is empty', () => {
      const config = getExpertInvolvement();
      expect(config.id).toBe('default');
      expect(config.name).toBe('PSQ-003 v17 Default');
      expect(config.experts.length).toBe(14);
    });

    it('should return saved config from localStorage', () => {
      const customConfig: ExpertInvolvementConfig = {
        id: 'custom',
        name: 'Custom Expert Config',
        isActive: true,
        experts: [
          {
            id: 'custom-expert',
            function: 'Finance',
            displayName: 'Custom Finance',
            applicableLevels: ['L1', 'L2'],
            involvementCondition: 'Custom condition',
          },
        ],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      localStorage.setItem('raise_expert_involvement', JSON.stringify(customConfig));

      const config = getExpertInvolvement();
      expect(config.id).toBe('custom');
      expect(config.name).toBe('Custom Expert Config');
      expect(config.experts.length).toBe(1);
    });

    it('should return default config when localStorage contains invalid JSON', () => {
      localStorage.setItem('raise_expert_involvement', 'invalid-json');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const config = getExpertInvolvement();
      expect(config.id).toBe('default');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('saveExpertInvolvement', () => {
    it('should save config to localStorage', () => {
      const customConfig: ExpertInvolvementConfig = {
        id: 'custom',
        name: 'Custom Config',
        isActive: true,
        experts: DEFAULT_EXPERT_INVOLVEMENT.experts,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      saveExpertInvolvement(customConfig);

      const stored = localStorage.getItem('raise_expert_involvement');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.id).toBe('custom');
    });

    it('should update the updatedAt timestamp', () => {
      const customConfig: ExpertInvolvementConfig = {
        id: 'custom',
        name: 'Custom Config',
        isActive: true,
        experts: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      saveExpertInvolvement(customConfig);

      const stored = localStorage.getItem('raise_expert_involvement');
      const parsed = JSON.parse(stored!);
      expect(parsed.updatedAt).not.toBe('2024-01-01');
    });
  });

  describe('resetExpertInvolvement', () => {
    it('should remove config from localStorage', () => {
      localStorage.setItem('raise_expert_involvement', JSON.stringify(DEFAULT_EXPERT_INVOLVEMENT));
      expect(localStorage.getItem('raise_expert_involvement')).toBeTruthy();

      resetExpertInvolvement();

      expect(localStorage.getItem('raise_expert_involvement')).toBeNull();
    });

    it('should not throw when localStorage is already empty', () => {
      expect(() => resetExpertInvolvement()).not.toThrow();
    });
  });

  describe('getExpertsForLevel', () => {
    it('should return all experts for L1 (all experts apply to L1-L5)', () => {
      const experts = getExpertsForLevel('L1');
      expect(experts.length).toBe(14);
    });

    it('should return all experts for L5', () => {
      const experts = getExpertsForLevel('L5');
      expect(experts.length).toBe(14);
    });

    it('should return no experts for L6 (default config has no L6 experts)', () => {
      const experts = getExpertsForLevel('L6');
      expect(experts.length).toBe(0);
    });

    it('should use custom config levels', () => {
      const customConfig: ExpertInvolvementConfig = {
        id: 'custom',
        name: 'Custom',
        isActive: true,
        experts: [
          {
            id: 'l6-expert',
            function: 'Finance',
            displayName: 'L6 Finance',
            applicableLevels: ['L6'],
            involvementCondition: 'Only for L6',
          },
          {
            id: 'l1-expert',
            function: 'Legal',
            displayName: 'L1 Legal',
            applicableLevels: ['L1'],
            involvementCondition: 'Only for L1',
          },
        ],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      localStorage.setItem('raise_expert_involvement', JSON.stringify(customConfig));

      expect(getExpertsForLevel('L6').length).toBe(1);
      expect(getExpertsForLevel('L6')[0].id).toBe('l6-expert');
      expect(getExpertsForLevel('L1').length).toBe(1);
      expect(getExpertsForLevel('L1')[0].id).toBe('l1-expert');
    });

    it('should return experts applicable to multiple levels', () => {
      const customConfig: ExpertInvolvementConfig = {
        id: 'custom',
        name: 'Custom',
        isActive: true,
        experts: [
          {
            id: 'multi-level',
            function: 'Finance',
            displayName: 'Multi-level Finance',
            applicableLevels: ['L1', 'L3', 'L5'],
            involvementCondition: 'For L1, L3, L5',
          },
        ],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      localStorage.setItem('raise_expert_involvement', JSON.stringify(customConfig));

      expect(getExpertsForLevel('L1').length).toBe(1);
      expect(getExpertsForLevel('L2').length).toBe(0);
      expect(getExpertsForLevel('L3').length).toBe(1);
      expect(getExpertsForLevel('L4').length).toBe(0);
      expect(getExpertsForLevel('L5').length).toBe(1);
    });
  });

  describe('updateExpert', () => {
    it('should update existing expert', () => {
      const updatedExpert: ExpertConfig = {
        id: 'finance',
        function: 'Finance',
        displayName: 'Updated Finance',
        applicableLevels: ['L1', 'L2', 'L3'],
        involvementCondition: 'Updated condition',
        email: 'updated@lutech.it',
      };

      updateExpert(updatedExpert);

      const config = getExpertInvolvement();
      const expert = config.experts.find(e => e.id === 'finance');
      expect(expert?.displayName).toBe('Updated Finance');
      expect(expert?.email).toBe('updated@lutech.it');
    });

    it('should not modify config for non-existent expert', () => {
      const nonExistentExpert: ExpertConfig = {
        id: 'non-existent',
        function: 'Finance',
        displayName: 'Non-existent',
        applicableLevels: ['L1'],
        involvementCondition: 'Should not be added',
      };

      updateExpert(nonExistentExpert);

      const config = getExpertInvolvement();
      expect(config.experts.find(e => e.id === 'non-existent')).toBeUndefined();
    });

    it('should persist changes to localStorage', () => {
      const updatedExpert: ExpertConfig = {
        id: 'legal',
        function: 'Legal',
        displayName: 'Updated Legal',
        applicableLevels: ['L1', 'L2'],
        involvementCondition: 'Updated',
        email: 'legal-updated@lutech.it',
      };

      updateExpert(updatedExpert);

      const stored = localStorage.getItem('raise_expert_involvement');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      const expert = parsed.experts.find((e: ExpertConfig) => e.id === 'legal');
      expect(expert?.displayName).toBe('Updated Legal');
    });
  });

  describe('addExpert', () => {
    it('should add new expert to config', () => {
      const newExpert: ExpertConfig = {
        id: 'new-expert',
        function: 'Finance',
        displayName: 'New Expert',
        applicableLevels: ['L1', 'L2', 'L3'],
        involvementCondition: 'New condition',
        email: 'new@lutech.it',
      };

      addExpert(newExpert);

      const config = getExpertInvolvement();
      const expert = config.experts.find(e => e.id === 'new-expert');
      expect(expert).toBeDefined();
      expect(expert?.displayName).toBe('New Expert');
    });

    it('should append to existing experts', () => {
      const initialCount = getExpertInvolvement().experts.length;

      const newExpert: ExpertConfig = {
        id: 'extra-expert',
        function: 'Procurement',
        displayName: 'Extra Expert',
        applicableLevels: ['L1'],
        involvementCondition: 'Extra condition',
      };

      addExpert(newExpert);

      const config = getExpertInvolvement();
      expect(config.experts.length).toBe(initialCount + 1);
    });

    it('should persist new expert to localStorage', () => {
      const newExpert: ExpertConfig = {
        id: 'persisted-expert',
        function: 'Risk',
        displayName: 'Persisted Expert',
        applicableLevels: ['L1', 'L2', 'L3', 'L4', 'L5'],
        involvementCondition: 'Persisted',
      };

      addExpert(newExpert);

      const stored = localStorage.getItem('raise_expert_involvement');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.experts.find((e: ExpertConfig) => e.id === 'persisted-expert')).toBeDefined();
    });
  });

  describe('removeExpert', () => {
    it('should remove expert by id', () => {
      const initialCount = getExpertInvolvement().experts.length;

      removeExpert('finance');

      const config = getExpertInvolvement();
      expect(config.experts.length).toBe(initialCount - 1);
      expect(config.experts.find(e => e.id === 'finance')).toBeUndefined();
    });

    it('should not modify config when removing non-existent expert', () => {
      const initialCount = getExpertInvolvement().experts.length;

      removeExpert('non-existent-id');

      const config = getExpertInvolvement();
      expect(config.experts.length).toBe(initialCount);
    });

    it('should persist removal to localStorage', () => {
      removeExpert('hr');

      const stored = localStorage.getItem('raise_expert_involvement');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.experts.find((e: ExpertConfig) => e.id === 'hr')).toBeUndefined();
    });
  });

  describe('getExpertFunctionDisplayName', () => {
    it('should return correct display name for Finance', () => {
      expect(getExpertFunctionDisplayName('Finance')).toBe('Finance');
    });

    it('should return correct display name for Procurement', () => {
      expect(getExpertFunctionDisplayName('Procurement')).toBe('Procurement');
    });

    it('should return correct display name for CMCIO', () => {
      expect(getExpertFunctionDisplayName('CMCIO')).toBe('Chief Marketing, Communication & Innovation Officer');
    });

    it('should return correct display name for Legal', () => {
      expect(getExpertFunctionDisplayName('Legal')).toBe('Legal');
    });

    it('should return correct display name for Compliance231', () => {
      expect(getExpertFunctionDisplayName('Compliance231')).toBe('Compliance 231 & Etico');
    });

    it('should return correct display name for ComplianceAnticorruzione', () => {
      expect(getExpertFunctionDisplayName('ComplianceAnticorruzione')).toBe('Compliance Anticorruzione');
    });

    it('should return correct display name for ComplianceESG', () => {
      expect(getExpertFunctionDisplayName('ComplianceESG')).toBe('Compliance ESG');
    });

    it('should return correct display name for ComplianceSistemiGestione', () => {
      expect(getExpertFunctionDisplayName('ComplianceSistemiGestione')).toBe('Compliance Sistemi Gestione');
    });

    it('should return correct display name for ComplianceAltro', () => {
      expect(getExpertFunctionDisplayName('ComplianceAltro')).toBe('Compliance (Altro)');
    });

    it('should return correct display name for DataPrivacy', () => {
      expect(getExpertFunctionDisplayName('DataPrivacy')).toBe('Data Privacy Manager');
    });

    it('should return correct display name for Risk', () => {
      expect(getExpertFunctionDisplayName('Risk')).toBe('Senior Risk Manager');
    });

    it('should return correct display name for Security', () => {
      expect(getExpertFunctionDisplayName('Security')).toBe('Chief Security Officer');
    });

    it('should return correct display name for HSE', () => {
      expect(getExpertFunctionDisplayName('HSE')).toBe('HSE Head');
    });

    it('should return correct display name for HR', () => {
      expect(getExpertFunctionDisplayName('HR')).toBe('Chief Human Resources Officer');
    });
  });
});
