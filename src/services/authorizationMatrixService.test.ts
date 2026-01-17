import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getAuthorizationMatrix,
  saveAuthorizationMatrix,
  resetAuthorizationMatrix,
  calculateLevelFromTcv,
  getAuthorizationInfo,
  updateAuthorizationLevel,
  DEFAULT_AUTHORIZATION_MATRIX,
} from './authorizationMatrixService';
import type { AuthorizationMatrixConfig, AuthorizationLevel } from '../types';

describe('authorizationMatrixService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAuthorizationMatrix', () => {
    it('should return default matrix when localStorage is empty', () => {
      const matrix = getAuthorizationMatrix();
      expect(matrix.id).toBe('default');
      expect(matrix.name).toBe('PSQ-003 v17 Default');
      expect(matrix.levels.length).toBe(6);
    });

    it('should return saved matrix from localStorage', () => {
      const customMatrix: AuthorizationMatrixConfig = {
        id: 'custom',
        name: 'Custom Matrix',
        isActive: true,
        levels: [
          {
            level: 'L1',
            tcvMin: 30000000,
            tcvMax: Infinity,
            tcvLabel: '> 30 M',
            authorizersAtp: 'CEO',
            authorizersAtsAtcHnd: 'CEO',
            workflowType: 'Classic',
            notes: 'Test',
          },
        ],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      localStorage.setItem('raise_authorization_matrix', JSON.stringify(customMatrix));

      const matrix = getAuthorizationMatrix();
      expect(matrix.id).toBe('custom');
      expect(matrix.name).toBe('Custom Matrix');
    });

    it('should return default matrix when localStorage contains invalid JSON', () => {
      localStorage.setItem('raise_authorization_matrix', 'invalid-json');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const matrix = getAuthorizationMatrix();
      expect(matrix.id).toBe('default');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should sort levels by tcvMin descending', () => {
      const unsortedMatrix: AuthorizationMatrixConfig = {
        id: 'unsorted',
        name: 'Unsorted Matrix',
        isActive: true,
        levels: [
          { level: 'L6', tcvMin: 0, tcvMax: 250000, tcvLabel: '', authorizersAtp: '', authorizersAtsAtcHnd: '', workflowType: 'FastTrack', notes: '' },
          { level: 'L1', tcvMin: 20000001, tcvMax: Infinity, tcvLabel: '', authorizersAtp: '', authorizersAtsAtcHnd: '', workflowType: 'Classic', notes: '' },
          { level: 'L3', tcvMin: 1000000, tcvMax: 10000000, tcvLabel: '', authorizersAtp: '', authorizersAtsAtcHnd: '', workflowType: 'Classic', notes: '' },
        ],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      localStorage.setItem('raise_authorization_matrix', JSON.stringify(unsortedMatrix));

      const matrix = getAuthorizationMatrix();
      expect(matrix.levels[0].level).toBe('L1');
      expect(matrix.levels[1].level).toBe('L3');
      expect(matrix.levels[2].level).toBe('L6');
    });
  });

  describe('saveAuthorizationMatrix', () => {
    it('should save matrix to localStorage', () => {
      const customMatrix: AuthorizationMatrixConfig = {
        id: 'custom',
        name: 'Custom Matrix',
        isActive: true,
        levels: DEFAULT_AUTHORIZATION_MATRIX.levels,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      saveAuthorizationMatrix(customMatrix);

      const stored = localStorage.getItem('raise_authorization_matrix');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.id).toBe('custom');
    });

    it('should update the updatedAt timestamp', () => {
      const customMatrix: AuthorizationMatrixConfig = {
        id: 'custom',
        name: 'Custom Matrix',
        isActive: true,
        levels: DEFAULT_AUTHORIZATION_MATRIX.levels,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      saveAuthorizationMatrix(customMatrix);

      const stored = localStorage.getItem('raise_authorization_matrix');
      const parsed = JSON.parse(stored!);
      expect(parsed.updatedAt).not.toBe('2024-01-01');
    });

    it('should sort levels by tcvMin descending when saving', () => {
      const unsortedMatrix: AuthorizationMatrixConfig = {
        id: 'unsorted',
        name: 'Unsorted',
        isActive: true,
        levels: [
          { level: 'L6', tcvMin: 0, tcvMax: 250000, tcvLabel: '', authorizersAtp: '', authorizersAtsAtcHnd: '', workflowType: 'FastTrack', notes: '' },
          { level: 'L1', tcvMin: 20000001, tcvMax: Infinity, tcvLabel: '', authorizersAtp: '', authorizersAtsAtcHnd: '', workflowType: 'Classic', notes: '' },
        ],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      saveAuthorizationMatrix(unsortedMatrix);

      const stored = JSON.parse(localStorage.getItem('raise_authorization_matrix')!);
      expect(stored.levels[0].level).toBe('L1');
      expect(stored.levels[1].level).toBe('L6');
    });
  });

  describe('resetAuthorizationMatrix', () => {
    it('should remove matrix from localStorage', () => {
      localStorage.setItem('raise_authorization_matrix', JSON.stringify(DEFAULT_AUTHORIZATION_MATRIX));
      expect(localStorage.getItem('raise_authorization_matrix')).toBeTruthy();

      resetAuthorizationMatrix();

      expect(localStorage.getItem('raise_authorization_matrix')).toBeNull();
    });

    it('should not throw when localStorage is already empty', () => {
      expect(() => resetAuthorizationMatrix()).not.toThrow();
    });
  });

  describe('calculateLevelFromTcv', () => {
    it('should return L1 for TCV > 20M', () => {
      expect(calculateLevelFromTcv(25000000)).toBe('L1');
      expect(calculateLevelFromTcv(20000001)).toBe('L1');
    });

    it('should return L2 for TCV between 10M and 20M', () => {
      expect(calculateLevelFromTcv(20000000)).toBe('L2');
      expect(calculateLevelFromTcv(15000000)).toBe('L2');
      expect(calculateLevelFromTcv(10000000)).toBe('L2');
    });

    it('should return L3 for TCV between 1M and 10M', () => {
      expect(calculateLevelFromTcv(9999999)).toBe('L3');
      expect(calculateLevelFromTcv(5000000)).toBe('L3');
      expect(calculateLevelFromTcv(1000000)).toBe('L3');
    });

    it('should return L4 for TCV between 500K and 1M', () => {
      expect(calculateLevelFromTcv(999999)).toBe('L4');
      expect(calculateLevelFromTcv(750000)).toBe('L4');
      expect(calculateLevelFromTcv(500000)).toBe('L4');
    });

    it('should return L5 for TCV between 250K and 500K', () => {
      expect(calculateLevelFromTcv(499999)).toBe('L5');
      expect(calculateLevelFromTcv(350000)).toBe('L5');
      expect(calculateLevelFromTcv(250000)).toBe('L5');
    });

    it('should return L6 for TCV < 250K', () => {
      expect(calculateLevelFromTcv(249999)).toBe('L6');
      expect(calculateLevelFromTcv(100000)).toBe('L6');
      expect(calculateLevelFromTcv(0)).toBe('L6');
    });

    it('should use custom matrix thresholds when saved', () => {
      const customMatrix: AuthorizationMatrixConfig = {
        id: 'custom',
        name: 'Custom',
        isActive: true,
        levels: [
          { level: 'L1', tcvMin: 50000000, tcvMax: Infinity, tcvLabel: '', authorizersAtp: '', authorizersAtsAtcHnd: '', workflowType: 'Classic', notes: '' },
          { level: 'L6', tcvMin: 0, tcvMax: 50000000, tcvLabel: '', authorizersAtp: '', authorizersAtsAtcHnd: '', workflowType: 'FastTrack', notes: '' },
        ],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      localStorage.setItem('raise_authorization_matrix', JSON.stringify(customMatrix));

      // 25M would be L1 in default, but L6 in custom
      expect(calculateLevelFromTcv(25000000)).toBe('L6');
      expect(calculateLevelFromTcv(50000000)).toBe('L1');
    });
  });

  describe('getAuthorizationInfo', () => {
    it('should return level info for valid level', () => {
      const info = getAuthorizationInfo('L1');
      expect(info).toBeDefined();
      expect(info?.level).toBe('L1');
      expect(info?.tcvLabel).toBe('> 20 M\u20AC');
      expect(info?.workflowType).toBe('Classic');
    });

    it('should return undefined for non-existent level', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const info = getAuthorizationInfo('L99' as any);
      expect(info).toBeUndefined();
    });

    it('should return correct info for each level', () => {
      const levels: Array<{ level: string; workflowType: string }> = [
        { level: 'L1', workflowType: 'Classic' },
        { level: 'L2', workflowType: 'Classic' },
        { level: 'L3', workflowType: 'Classic' },
        { level: 'L4', workflowType: 'Simplified' },
        { level: 'L5', workflowType: 'Simplified' },
        { level: 'L6', workflowType: 'FastTrack' },
      ];

      for (const { level, workflowType } of levels) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const info = getAuthorizationInfo(level as any);
        expect(info?.workflowType).toBe(workflowType);
      }
    });
  });

  describe('updateAuthorizationLevel', () => {
    it('should update existing level', () => {
      const updatedLevel: AuthorizationLevel = {
        level: 'L1',
        tcvMin: 25000000,
        tcvMax: Infinity,
        tcvLabel: '> 25 M\u20AC',
        authorizersAtp: 'CEO Only',
        authorizersAtsAtcHnd: 'CEO Only',
        workflowType: 'Classic',
        notes: 'Updated notes',
      };

      updateAuthorizationLevel(updatedLevel);

      const matrix = getAuthorizationMatrix();
      const l1 = matrix.levels.find(l => l.level === 'L1');
      expect(l1?.tcvMin).toBe(25000000);
      expect(l1?.tcvLabel).toBe('> 25 M\u20AC');
      expect(l1?.authorizersAtp).toBe('CEO Only');
    });

    it('should not modify matrix for non-existent level', () => {
      const nonExistentLevel = {
        level: 'L99',
        tcvMin: 999999999,
        tcvMax: Infinity,
        tcvLabel: 'Huge',
        authorizersAtp: 'Nobody',
        authorizersAtsAtcHnd: 'Nobody',
        workflowType: 'Classic' as const,
        notes: 'Should not be added',
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateAuthorizationLevel(nonExistentLevel as any);

      const matrix = getAuthorizationMatrix();
      expect(matrix.levels.length).toBe(6);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(matrix.levels.find(l => l.level === ('L99' as any))).toBeUndefined();
    });

    it('should persist changes to localStorage', () => {
      const updatedLevel: AuthorizationLevel = {
        level: 'L6',
        tcvMin: 0,
        tcvMax: 300000,
        tcvLabel: '0-300 K\u20AC',
        authorizersAtp: 'n.a.',
        authorizersAtsAtcHnd: 'Sales Team',
        workflowType: 'FastTrack',
        notes: 'Updated',
      };

      updateAuthorizationLevel(updatedLevel);

      // Clear and reload
      const stored = localStorage.getItem('raise_authorization_matrix');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      const l6 = parsed.levels.find((l: AuthorizationLevel) => l.level === 'L6');
      expect(l6?.tcvMax).toBe(300000);
    });
  });
});
