/**
 * Authorization Matrix Service
 * Manages the configurable TCV thresholds and authorization rules for RAISE levels
 */
import type { AuthorizationMatrixConfig, AuthorizationLevel, RaiseLevel } from '../types';

const STORAGE_KEY = 'raise_authorization_matrix';

// Default configuration based on PSQ-003 v17 §5.4
export const DEFAULT_AUTHORIZATION_MATRIX: AuthorizationMatrixConfig = {
    id: 'default',
    name: 'PSQ-003 v17 Default',
    isActive: true,
    levels: [
        {
            level: 'L1',
            tcvMin: 20000001,
            tcvMax: Infinity,
            tcvLabel: '> 20 M€',
            authorizersAtp: 'CEO + COO',
            authorizersAtsAtcHnd: 'CEO + COO',
            workflowType: 'Classic',
            notes: 'Classic: autorizzazioni mediante meeting, con autorizzatori di Lutech S.p.A. per tutte le Legal Entity, e con intervento di Expert'
        },
        {
            level: 'L2',
            tcvMin: 10000000,
            tcvMax: 20000000,
            tcvLabel: '10-20 M€',
            authorizersAtp: 'Industry Head + COO + CDO',
            authorizersAtsAtcHnd: 'Industry Head + COO + CDO + CDE',
            workflowType: 'Classic',
            notes: 'Classic: autorizzazioni mediante meeting, con autorizzatori di Lutech S.p.A. per tutte le Legal Entity, e con intervento di Expert'
        },
        {
            level: 'L3',
            tcvMin: 1000000,
            tcvMax: 10000000,
            tcvLabel: '1-10 M€',
            authorizersAtp: 'Industry Head',
            authorizersAtsAtcHnd: 'Industry Head + Capability Leader(s) + Industry Operation Leader + CDE',
            workflowType: 'Classic',
            notes: 'Classic: autorizzazioni mediante meeting, con autorizzatori di Lutech S.p.A. per tutte le Legal Entity, e con intervento di Expert'
        },
        {
            level: 'L4',
            tcvMin: 500000,
            tcvMax: 1000000,
            tcvLabel: '500K-1M€',
            authorizersAtp: 'Industry Head',
            authorizersAtsAtcHnd: '[sub] Industry Head + Capability Leader(s) + [sub] Industry Operation Leader + CDE',
            workflowType: 'Simplified',
            notes: 'Simplified: autorizzazioni via e-mail (a meno di richieste di meeting) e senza intervento di Expert (a meno che non vi siano deviazioni KCP)'
        },
        {
            level: 'L5',
            tcvMin: 250000,
            tcvMax: 500000,
            tcvLabel: '250-500 K€',
            authorizersAtp: 'Industry Head',
            authorizersAtsAtcHnd: 'Sales Manager (responsabile del titolare opportunità) + Practice/CoE Leader(s) + CDE',
            workflowType: 'Simplified',
            notes: 'Simplified: autorizzazioni via e-mail (a meno di richieste di meeting) e senza intervento di Expert (a meno che non vi siano deviazioni KCP)'
        },
        {
            level: 'L6',
            tcvMin: 0,
            tcvMax: 250000,
            tcvLabel: '0-250 K€',
            authorizersAtp: 'n.a.',
            authorizersAtsAtcHnd: 'Client Executive / Manager / Sales Specialist',
            workflowType: 'FastTrack',
            notes: 'Fast Track (con tracking) se nessuna deviazione ai KCP'
        }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

/**
 * Get the active authorization matrix configuration
 */
export function getAuthorizationMatrix(): AuthorizationMatrixConfig {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const config = JSON.parse(stored) as AuthorizationMatrixConfig;
            // Ensure levels are sorted by tcvMin descending (L1 first, L6 last)
            config.levels.sort((a, b) => b.tcvMin - a.tcvMin);
            return config;
        }
    } catch (e) {
        console.error('Failed to load authorization matrix from localStorage:', e);
    }
    return DEFAULT_AUTHORIZATION_MATRIX;
}

/**
 * Save the authorization matrix configuration
 */
export function saveAuthorizationMatrix(config: AuthorizationMatrixConfig): void {
    config.updatedAt = new Date().toISOString();
    // Ensure levels are sorted by tcvMin descending
    config.levels.sort((a, b) => b.tcvMin - a.tcvMin);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/**
 * Reset to default configuration
 */
export function resetAuthorizationMatrix(): void {
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Calculate RAISE level from TCV using the configurable matrix
 */
export function calculateLevelFromTcv(tcv: number): RaiseLevel {
    const matrix = getAuthorizationMatrix();

    // Levels are sorted by tcvMin descending, so we iterate from highest to lowest
    for (const level of matrix.levels) {
        if (tcv >= level.tcvMin) {
            return level.level;
        }
    }

    // Fallback to L6 if no match (shouldn't happen with proper config)
    return 'L6';
}

/**
 * Get authorization info for a specific level
 */
export function getAuthorizationInfo(level: RaiseLevel): AuthorizationLevel | undefined {
    const matrix = getAuthorizationMatrix();
    return matrix.levels.find(l => l.level === level);
}

/**
 * Update a single level's configuration
 */
export function updateAuthorizationLevel(levelConfig: AuthorizationLevel): void {
    const matrix = getAuthorizationMatrix();
    const index = matrix.levels.findIndex(l => l.level === levelConfig.level);
    if (index !== -1) {
        matrix.levels[index] = levelConfig;
        saveAuthorizationMatrix(matrix);
    }
}
