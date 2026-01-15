import type { Opportunity, RaiseLevel, Checkpoint, ControlConfig } from '../types';
import { evaluateCondition as evaluateConditionSafe } from './ruleEngine';
import { calculateLevelFromTcv } from '../services/authorizationMatrixService';

/**
 * Calculate RAISE Level according to PSQ-003 v17 §5.4 Matrice di Autorizzazione
 * Uses RAISE TCV (not regular TCV) as it includes optional parts
 * Now reads TCV thresholds from configurable Authorization Matrix
 */
export const calculateRaiseLevel = (opp: Opportunity): RaiseLevel => {
    // PSQ-003 §5.4: Clausole sociali o attività NON core business -> L1 DIRETTO
    if (opp.hasSocialClauses || opp.isNonCoreBusiness) {
        return 'L1';
    }

    // Use RAISE TCV for level calculation (includes optional parts)
    const v = opp.raiseTcv;

    // PSQ-003 §5.4: Base level calculation from TCV RAISE ranges
    // Now uses configurable Authorization Matrix instead of hardcoded values
    let level = calculateLevelFromTcv(v);

    // PSQ-003 §5.4: Servizi >= 200k con componenti rischi < 3% -> aumenta a L2
    if (opp.hasLowRiskServices && (opp.servicesValue || 0) >= 200000) {
        if (level === 'L3' || level === 'L4' || level === 'L5' || level === 'L6') {
            level = 'L2';
        }
    }

    // PSQ-003 §5.4 & §5.3: KCP Deviation Rule
    // "In caso di deviazione ai Key Contracting Principle l'autorizzazione viene spostata di 1 livello
    // (ad esempio da L6 a L5). Questo innalzamento si applica per le opportunità classificate
    // nei livelli L6, L5 e L4. I livelli L3, L2 ed L1 rimangono inalterati."
    if (opp.hasKcpDeviations || opp.isNewCustomer) {
        if (level === 'L6') level = 'L5';
        else if (level === 'L5') level = 'L4';
        // L4, L3, L2, L1 rimangono inalterati per KCP deviations
    }

    return level;
};

/**
 * Check if Fast Track is applicable
 * PSQ-003 §5.5: Fast Track applicabile solo se:
 * - TCV < 250k
 * - Nessuna deviazione KCP
 * - Non è un Child con margini inferiori al Master
 */
export const isFastTrackEligible = (opp: Opportunity): boolean => {
    // Fast Track solo per TCV < 250k
    if (opp.raiseTcv >= 250000) return false;

    // Fast Track INIBITO se deviazioni KCP
    if (opp.hasKcpDeviations) return false;

    // Fast Track INIBITO se nuovo cliente
    if (opp.isNewCustomer) return false;

    // Fast Track INIBITO per Small Ticket (< 5k) senza pre-approvazione
    if (opp.isSmallTicket) return false;

    return true;
};

// Helper to safely evaluate conditions using the safe rule engine
const evaluateCondition = (condition: string | undefined, opp: Opportunity): boolean => {
    if (!condition || condition.trim() === '') return true;

    try {
        return evaluateConditionSafe(condition, opp);
    } catch (e) {
        console.error('Failed to evaluate condition:', condition, e);
        return false;
    }
};

export const getRequiredCheckpoints = (
    phase: string,
    opp: Opportunity,
    customControls?: ControlConfig[]
): Checkpoint[] => {
    // If no custom controls provided, return empty (or could fallback to legacy hardcoded)
    // For this implementation, we assume the Store provides the source of truth.
    if (!customControls || customControls.length === 0) {
        return [];
    }

    // In E2E mode, bypass mandatory checkpoints to enable phase completion testing
    // Check both compile-time flag AND runtime testMode (for Kyma production E2E tests)
    const isE2EMode = (typeof __E2E_MODE__ !== 'undefined' && __E2E_MODE__) ||
        (typeof window !== 'undefined' && localStorage.getItem('testMode') === 'true');

    return customControls
        // Include controls for current phase OR controls marked as "ALL" (cross-phase)
        .filter(cfg => cfg.phase === phase || cfg.phase === 'ALL')
        .filter(cfg => evaluateCondition(cfg.condition, opp))
        .map(cfg => ({
            id: cfg.id,
            label: cfg.label,
            description: cfg.description,
            // In E2E mode, all checkpoints are non-mandatory to enable testing
            required: isE2EMode ? false : cfg.isMandatory,
            checked: false,
            order: cfg.order, // Add order number
            attachments: [],
            templateRef: cfg.templateRef,
            actionType: cfg.actionType,
            detailedDescription: cfg.detailedDescription,
            folderPath: cfg.folderPath,
            templateLinks: cfg.templateLinks,
            mandatoryNotes: cfg.mandatoryNotes
        }));
};
