/**
 * Under-margin Service
 * Manages the configurable margin thresholds and approval rules for RAISE opportunities
 */
import type { UnderMarginConfig, MarginThreshold, MarginType, RaiseLevel } from '../types';

const STORAGE_KEY = 'raise_under_margin';

// Default configuration based on PSQ-003 v17 margin requirements
export const DEFAULT_UNDER_MARGIN: UnderMarginConfig = {
    id: 'default',
    name: 'PSQ-003 v17 Default',
    isActive: true,
    thresholds: [
        // Products
        {
            id: 'products-reselling',
            type: 'Products',
            name: 'Rivendita Prodotti (HW/SW)',
            targetMargin: 16,
            minimumMargin: 10,
            approvalRequired: true,
            approverLevel: 'L4',
            notes: 'Margine minimo 16% per rivendita prodotti. Under-margin richiede approvazione Industry Head.'
        },
        {
            id: 'products-var',
            type: 'Products',
            name: 'VAR (Value Added Reselling)',
            targetMargin: 20,
            minimumMargin: 15,
            approvalRequired: true,
            approverLevel: 'L4',
            notes: 'VAR include servizi di integrazione oltre alla rivendita.'
        },
        // Services
        {
            id: 'services-standard',
            type: 'Services',
            name: 'Servizi Standard',
            targetMargin: 25,
            minimumMargin: 18,
            approvalRequired: true,
            approverLevel: 'L4',
            notes: 'Servizi professionali standard. Il margine deve coprire i costi operativi.'
        },
        {
            id: 'services-managed',
            type: 'Services',
            name: 'Servizi Gestiti (Managed Services)',
            targetMargin: 22,
            minimumMargin: 15,
            approvalRequired: true,
            approverLevel: 'L3',
            notes: 'Managed Services hanno margini più compressi per contratti pluriennali.'
        },
        // Practice-specific margins
        {
            id: 'practice-consulting',
            type: 'Practice',
            name: 'Practice Consulting',
            targetMargin: 30,
            minimumMargin: 22,
            approvalRequired: true,
            approverLevel: 'L4'
        },
        {
            id: 'practice-development',
            type: 'Practice',
            name: 'Practice Development',
            targetMargin: 28,
            minimumMargin: 20,
            approvalRequired: true,
            approverLevel: 'L4'
        },
        {
            id: 'practice-infrastructure',
            type: 'Practice',
            name: 'Practice Infrastructure',
            targetMargin: 24,
            minimumMargin: 16,
            approvalRequired: true,
            approverLevel: 'L4'
        },
        {
            id: 'practice-cloud',
            type: 'Practice',
            name: 'Practice Cloud',
            targetMargin: 26,
            minimumMargin: 18,
            approvalRequired: true,
            approverLevel: 'L4'
        },
        {
            id: 'practice-security',
            type: 'Practice',
            name: 'Practice Security',
            targetMargin: 32,
            minimumMargin: 25,
            approvalRequired: true,
            approverLevel: 'L4',
            notes: 'Security ha margini più alti per il valore specialistico.'
        },
        {
            id: 'practice-data',
            type: 'Practice',
            name: 'Practice Data & Analytics',
            targetMargin: 28,
            minimumMargin: 20,
            approvalRequired: true,
            approverLevel: 'L4'
        }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

/**
 * Get the active under-margin configuration
 */
export function getUnderMarginConfig(): UnderMarginConfig {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored) as UnderMarginConfig;
        }
    } catch (e) {
        console.error('Failed to load under-margin config from localStorage:', e);
    }
    return DEFAULT_UNDER_MARGIN;
}

/**
 * Save the under-margin configuration
 */
export function saveUnderMarginConfig(config: UnderMarginConfig): void {
    config.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/**
 * Reset to default configuration
 */
export function resetUnderMarginConfig(): void {
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get thresholds by type
 */
export function getThresholdsByType(type: MarginType): MarginThreshold[] {
    const config = getUnderMarginConfig();
    return config.thresholds.filter(t => t.type === type);
}

/**
 * Check if a margin is under threshold
 */
export function isUnderMargin(thresholdId: string, actualMargin: number): boolean {
    const config = getUnderMarginConfig();
    const threshold = config.thresholds.find(t => t.id === thresholdId);
    if (!threshold) return false;
    return actualMargin < threshold.targetMargin;
}

/**
 * Check if a margin requires approval
 */
export function requiresApproval(thresholdId: string, actualMargin: number): boolean {
    const config = getUnderMarginConfig();
    const threshold = config.thresholds.find(t => t.id === thresholdId);
    if (!threshold) return false;
    return actualMargin < threshold.targetMargin && threshold.approvalRequired;
}

/**
 * Get the required approval level for a given margin
 */
export function getRequiredApprovalLevel(thresholdId: string, actualMargin: number): RaiseLevel | null {
    const config = getUnderMarginConfig();
    const threshold = config.thresholds.find(t => t.id === thresholdId);
    if (!threshold) return null;
    if (actualMargin < threshold.minimumMargin) {
        // Below minimum margin, escalate approval
        return 'L3'; // Higher level approval required
    }
    if (actualMargin < threshold.targetMargin && threshold.approvalRequired) {
        return threshold.approverLevel || 'L4';
    }
    return null;
}

/**
 * Update a single threshold's configuration
 */
export function updateThreshold(thresholdConfig: MarginThreshold): void {
    const config = getUnderMarginConfig();
    const index = config.thresholds.findIndex(t => t.id === thresholdConfig.id);
    if (index !== -1) {
        config.thresholds[index] = thresholdConfig;
        saveUnderMarginConfig(config);
    }
}

/**
 * Add a new threshold to the configuration
 */
export function addThreshold(thresholdConfig: MarginThreshold): void {
    const config = getUnderMarginConfig();
    config.thresholds.push(thresholdConfig);
    saveUnderMarginConfig(config);
}

/**
 * Remove a threshold from the configuration
 */
export function removeThreshold(thresholdId: string): void {
    const config = getUnderMarginConfig();
    config.thresholds = config.thresholds.filter(t => t.id !== thresholdId);
    saveUnderMarginConfig(config);
}

/**
 * Get display name for a margin type
 */
export function getMarginTypeDisplayName(type: MarginType): string {
    const displayNames: Record<MarginType, string> = {
        Products: 'Prodotti',
        Services: 'Servizi',
        Practice: 'Practice'
    };
    return displayNames[type];
}
