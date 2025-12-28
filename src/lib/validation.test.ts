import { describe, it, expect } from 'vitest';
import { validateOpportunity, validateStorageData } from './validation';

describe('validation', () => {
  const validOpp = {
    id: 'OPP-2025-001',
    title: 'Test Opportunity',
    clientName: 'Test Client',
    tcv: 1000000,
    raiseTcv: 1000000,
    industry: 'Manufacturing',
    currentPhase: 'Planning' as const,
    hasKcpDeviations: false,
    isFastTrack: false,
    isRti: false,
    isPublicSector: true,
    raiseLevel: 'L3' as const,
    deviations: [],
    checkpoints: {},
  };

  describe('validateOpportunity', () => {
    it('should validate correct opportunity', () => {
      const result = validateOpportunity(validOpp);
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { title, ...incomplete } = validOpp;
      const result = validateOpportunity(incomplete);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('title');
      }
    });

    it('should reject invalid TCV (negative)', () => {
      const invalid = { ...validOpp, tcv: -1000 };
      const result = validateOpportunity(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject raiseTcv < tcv', () => {
      const invalid = { ...validOpp, tcv: 1000000, raiseTcv: 500000 };
      const result = validateOpportunity(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('RAISE TCV');
      }
    });

    it('should reject invalid phase', () => {
      const invalid = { ...validOpp, currentPhase: 'InvalidPhase' };
      const result = validateOpportunity(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject title too short', () => {
      const invalid = { ...validOpp, title: 'AB' };
      const result = validateOpportunity(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('validateStorageData', () => {
    it('should validate array of opportunities', () => {
      const result = validateStorageData([validOpp, validOpp]);
      expect(result.success).toBe(true);
    });

    it('should reject invalid array', () => {
      const result = validateStorageData([validOpp, { invalid: 'data' }]);
      expect(result.success).toBe(false);
    });

    it('should reject non-array', () => {
      const result = validateStorageData(validOpp);
      expect(result.success).toBe(false);
    });
  });
});
