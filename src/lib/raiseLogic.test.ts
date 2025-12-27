import { describe, it, expect } from 'vitest';
import { calculateRaiseLevel, isFastTrackEligible, getRequiredCheckpoints } from './raiseLogic';
import type { Opportunity, ControlConfig } from '../types';

const mockOpp = (overrides: Partial<Opportunity>): Opportunity => ({
    id: 'test-opp',
    title: 'Test Opportunity',
    clientName: 'Test Client',
    industry: 'Manufacturing',
    tcv: 100000,
    raiseTcv: 100000,
    currentPhase: 'Planning',
    hasKcpDeviations: false,
    isFastTrack: false,
    isRti: false,
    isMandataria: false,
    isPublicSector: false,
    raiseLevel: 'L6',
    deviations: [],
    checkpoints: {},
    ...overrides
});

describe('calculateRaiseLevel', () => {
    describe('PSQ-003 §5.4 - Base Level Calculation from RAISE TCV', () => {
        it('should assign L6 for RAISE TCV < 250k', () => {
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 100000 }))).toBe('L6');
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 249999 }))).toBe('L6');
        });

        it('should assign L5 for RAISE TCV 250k - 500k', () => {
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 250000 }))).toBe('L5');
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 499999 }))).toBe('L5');
        });

        it('should assign L4 for RAISE TCV 500k - 1M', () => {
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 500000 }))).toBe('L4');
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 999999 }))).toBe('L4');
        });

        it('should assign L3 for RAISE TCV 1M - 10M', () => {
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 1000000 }))).toBe('L3');
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 9999999 }))).toBe('L3');
        });

        it('should assign L2 for RAISE TCV 10M - 20M', () => {
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 10000000 }))).toBe('L2');
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 19999999 }))).toBe('L2');
        });

        it('should assign L1 for RAISE TCV > 20M', () => {
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 20000001 }))).toBe('L1');
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 50000000 }))).toBe('L1');
        });
    });

    describe('PSQ-003 §5.4 - Critical Risk Rules (L1 Direct)', () => {
        it('should assign L1 for social clauses regardless of TCV', () => {
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 50000, hasSocialClauses: true }))).toBe('L1');
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 500000, hasSocialClauses: true }))).toBe('L1');
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 15000000, hasSocialClauses: true }))).toBe('L1');
        });

        it('should assign L1 for non-core business regardless of TCV', () => {
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 50000, isNonCoreBusiness: true }))).toBe('L1');
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 500000, isNonCoreBusiness: true }))).toBe('L1');
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 15000000, isNonCoreBusiness: true }))).toBe('L1');
        });
    });

    describe('PSQ-003 §5.4 - Low Risk Services Rule (L2 Escalation)', () => {
        it('should escalate to L2 for low-risk services >= 200k (from L3-L6)', () => {
            // L6 -> L2
            expect(calculateRaiseLevel(mockOpp({
                raiseTcv: 100000,
                hasLowRiskServices: true,
                servicesValue: 200000
            }))).toBe('L2');

            // L5 -> L2
            expect(calculateRaiseLevel(mockOpp({
                raiseTcv: 300000,
                hasLowRiskServices: true,
                servicesValue: 250000
            }))).toBe('L2');

            // L4 -> L2
            expect(calculateRaiseLevel(mockOpp({
                raiseTcv: 600000,
                hasLowRiskServices: true,
                servicesValue: 200000
            }))).toBe('L2');

            // L3 -> L2
            expect(calculateRaiseLevel(mockOpp({
                raiseTcv: 2000000,
                hasLowRiskServices: true,
                servicesValue: 300000
            }))).toBe('L2');
        });

        it('should NOT escalate to L2 if services < 200k', () => {
            expect(calculateRaiseLevel(mockOpp({
                raiseTcv: 100000,
                hasLowRiskServices: true,
                servicesValue: 199999
            }))).toBe('L6');
        });

        it('should NOT escalate to L2 if already L2 or L1', () => {
            // L2 remains L2
            expect(calculateRaiseLevel(mockOpp({
                raiseTcv: 15000000,
                hasLowRiskServices: true,
                servicesValue: 200000
            }))).toBe('L2');

            // L1 remains L1
            expect(calculateRaiseLevel(mockOpp({
                raiseTcv: 25000000,
                hasLowRiskServices: true,
                servicesValue: 200000
            }))).toBe('L1');
        });
    });

    describe('PSQ-003 §5.4 & §5.3 - KCP Deviation Rule', () => {
        it('should shift L6 -> L5 for KCP deviations', () => {
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 100000, hasKcpDeviations: true }))).toBe('L5');
        });

        it('should shift L5 -> L4 for KCP deviations', () => {
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 300000, hasKcpDeviations: true }))).toBe('L4');
        });

        it('should NOT shift L4, L3, L2, L1 for KCP deviations', () => {
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 600000, hasKcpDeviations: true }))).toBe('L4');
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 2000000, hasKcpDeviations: true }))).toBe('L3');
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 15000000, hasKcpDeviations: true }))).toBe('L2');
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 25000000, hasKcpDeviations: true }))).toBe('L1');
        });
    });

    describe('PSQ-003 §5.4 - New Customer Rule', () => {
        it('should shift L6 -> L5 for new customers', () => {
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 100000, isNewCustomer: true }))).toBe('L5');
        });

        it('should shift L5 -> L4 for new customers', () => {
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 300000, isNewCustomer: true }))).toBe('L4');
        });

        it('should NOT shift L4, L3, L2, L1 for new customers', () => {
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 600000, isNewCustomer: true }))).toBe('L4');
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 2000000, isNewCustomer: true }))).toBe('L3');
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 15000000, isNewCustomer: true }))).toBe('L2');
            expect(calculateRaiseLevel(mockOpp({ raiseTcv: 25000000, isNewCustomer: true }))).toBe('L1');
        });
    });

    describe('Combined Rules Priority', () => {
        it('should apply L1 direct rules before any other rules', () => {
            // Social clauses takes precedence over everything
            expect(calculateRaiseLevel(mockOpp({
                raiseTcv: 100000,
                hasSocialClauses: true,
                hasKcpDeviations: true,
                hasLowRiskServices: true,
                servicesValue: 200000
            }))).toBe('L1');
        });

        it('should apply low-risk services rule before KCP deviation', () => {
            // Base L6, low-risk services -> L2, then KCP deviation doesn't shift L2
            expect(calculateRaiseLevel(mockOpp({
                raiseTcv: 100000,
                hasLowRiskServices: true,
                servicesValue: 200000,
                hasKcpDeviations: true
            }))).toBe('L2');
        });

        it('should apply both KCP deviation and new customer (same effect)', () => {
            // Both shift L6 -> L5
            expect(calculateRaiseLevel(mockOpp({
                raiseTcv: 100000,
                hasKcpDeviations: true,
                isNewCustomer: true
            }))).toBe('L5');
        });
    });
});

describe('isFastTrackEligible', () => {
    describe('PSQ-003 §5.5 - Fast Track Eligibility', () => {
        it('should be eligible for standard low-value opportunities', () => {
            expect(isFastTrackEligible(mockOpp({
                raiseTcv: 100000,
                hasKcpDeviations: false,
                isNewCustomer: false,
                isSmallTicket: false
            }))).toBe(true);
        });

        it('should be eligible at TCV < 250k boundary', () => {
            expect(isFastTrackEligible(mockOpp({ raiseTcv: 249999 }))).toBe(true);
        });

        it('should NOT be eligible at TCV >= 250k', () => {
            expect(isFastTrackEligible(mockOpp({ raiseTcv: 250000 }))).toBe(false);
            expect(isFastTrackEligible(mockOpp({ raiseTcv: 500000 }))).toBe(false);
        });

        it('should NOT be eligible with KCP deviations', () => {
            expect(isFastTrackEligible(mockOpp({
                raiseTcv: 100000,
                hasKcpDeviations: true
            }))).toBe(false);
        });

        it('should NOT be eligible for new customers', () => {
            expect(isFastTrackEligible(mockOpp({
                raiseTcv: 100000,
                isNewCustomer: true
            }))).toBe(false);
        });

        it('should NOT be eligible for small tickets without pre-approval', () => {
            expect(isFastTrackEligible(mockOpp({
                raiseTcv: 4000,
                isSmallTicket: true
            }))).toBe(false);
        });

        it('should NOT be eligible with multiple inhibitors', () => {
            expect(isFastTrackEligible(mockOpp({
                raiseTcv: 100000,
                hasKcpDeviations: true,
                isNewCustomer: true,
                isSmallTicket: true
            }))).toBe(false);
        });
    });
});

describe('getRequiredCheckpoints', () => {
    const mockControls: ControlConfig[] = [
        {
            id: 'always-required',
            label: 'Always Required',
            description: 'No condition',
            phase: 'ATP',
            isMandatory: true,
            actionType: 'task'
        },
        {
            id: 'conditional-rti',
            label: 'RTI Check',
            description: 'Only for RTI',
            phase: 'ATS',
            isMandatory: true,
            actionType: 'document',
            condition: 'opp.isRti === true'
        },
        {
            id: 'conditional-mandataria',
            label: 'Mandataria Check',
            description: 'Only for RTI Mandataria',
            phase: 'ATS',
            isMandatory: true,
            actionType: 'document',
            condition: 'opp.isRti === true && opp.isMandataria === true'
        },
        {
            id: 'large-deal',
            label: 'Large Deal',
            description: 'TCV > 10M',
            phase: 'ATP',
            isMandatory: true,
            actionType: 'task',
            condition: 'opp.raiseTcv > 10000000'
        },
        {
            id: 'optional-check',
            label: 'Optional Check',
            description: 'Not mandatory',
            phase: 'ATP',
            isMandatory: false,
            actionType: 'task'
        }
    ];

    describe('Basic Filtering', () => {
        it('should return empty array if no controls provided', () => {
            const opp = mockOpp({ raiseTcv: 100000 });
            expect(getRequiredCheckpoints('ATP', opp)).toEqual([]);
        });

        it('should return only checkpoints for the specified phase', () => {
            const opp = mockOpp({});
            const cps = getRequiredCheckpoints('ATP', opp, mockControls);

            expect(cps.map(c => c.id)).toContain('always-required');
            expect(cps.map(c => c.id)).not.toContain('conditional-rti');
            expect(cps.map(c => c.id)).not.toContain('conditional-mandataria');
        });
    });

    describe('Conditional Logic', () => {
        it('should include unconditional checkpoints', () => {
            const opp = mockOpp({});
            const cps = getRequiredCheckpoints('ATP', opp, mockControls);

            expect(cps.map(c => c.id)).toContain('always-required');
        });

        it('should exclude conditional checkpoints when condition is false', () => {
            const opp = mockOpp({ raiseTcv: 500000 });
            const cps = getRequiredCheckpoints('ATP', opp, mockControls);

            expect(cps.map(c => c.id)).not.toContain('large-deal');
        });

        it('should include conditional checkpoints when condition is true', () => {
            const opp = mockOpp({ raiseTcv: 15000000 });
            const cps = getRequiredCheckpoints('ATP', opp, mockControls);

            expect(cps.map(c => c.id)).toContain('large-deal');
        });

        it('should handle simple boolean conditions', () => {
            const opp = mockOpp({ isRti: true });
            const cps = getRequiredCheckpoints('ATS', opp, mockControls);

            expect(cps.map(c => c.id)).toContain('conditional-rti');
        });

        it('should handle compound boolean conditions', () => {
            const oppNonMandataria = mockOpp({ isRti: true, isMandataria: false });
            const cpsNon = getRequiredCheckpoints('ATS', oppNonMandataria, mockControls);
            expect(cpsNon.map(c => c.id)).not.toContain('conditional-mandataria');

            const oppMandataria = mockOpp({ isRti: true, isMandataria: true });
            const cpsMand = getRequiredCheckpoints('ATS', oppMandataria, mockControls);
            expect(cpsMand.map(c => c.id)).toContain('conditional-mandataria');
        });
    });

    describe('Checkpoint Structure', () => {
        it('should return checkpoints with correct structure', () => {
            const opp = mockOpp({});
            const cps = getRequiredCheckpoints('ATP', opp, mockControls);

            const cp = cps.find(c => c.id === 'always-required');
            expect(cp).toBeDefined();
            expect(cp?.label).toBe('Always Required');
            expect(cp?.description).toBe('No condition');
            expect(cp?.required).toBe(true);
            expect(cp?.checked).toBe(false);
            expect(cp?.attachments).toEqual([]);
        });

        it('should map isMandatory to required field', () => {
            const opp = mockOpp({});
            const cps = getRequiredCheckpoints('ATP', opp, mockControls);

            const mandatory = cps.find(c => c.id === 'always-required');
            expect(mandatory?.required).toBe(true);

            const optional = cps.find(c => c.id === 'optional-check');
            expect(optional?.required).toBe(false);
        });
    });
});
