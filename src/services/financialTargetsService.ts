/**
 * Financial Targets Service
 * Manages the configurable key financial targets for RAISE opportunities
 */
import type { FinancialTargetsConfig, FinancialTarget, FinancialTargetCategory } from '../types';

const STORAGE_KEY = 'raise_financial_targets';

// Default configuration based on PSQ-003 v17 and Excel "Key Financial Targets"
export const DEFAULT_FINANCIAL_TARGETS: FinancialTargetsConfig = {
    id: 'default',
    name: 'PSQ-003 v17 Default',
    isActive: true,
    targets: [
        // Cash Flow (Payback Targets)
        {
            id: 'cf-payment-terms',
            category: 'CashFlow',
            scope: 'Termini di Pagamento',
            rule: 'I termini di pagamento non possono essere superiori a 120 giorni, o in linea con le precedenti approvazioni sullo specifico cliente',
            threshold: 120,
            thresholdUnit: 'days'
        },
        {
            id: 'cf-var',
            category: 'CashFlow',
            scope: 'VAR / Rivendita Prodotti',
            rule: 'Su VAR e rivendita prodotti, deve essere cash neutrale (col fornitore stessi termini di fatturazione e pagamento cliente, o factoring)'
        },
        {
            id: 'cf-services-payback',
            category: 'CashFlow',
            scope: 'Servizi Payback',
            rule: 'Maximum payback di 18 mesi per servizi',
            threshold: 18,
            thresholdUnit: 'months'
        },
        // Margins (First Margin Targets)
        {
            id: 'margin-products',
            category: 'Margins',
            scope: 'Rivendita di Prodotti',
            rule: 'Margine minimo 16% (si rimanda alla slide under-margin per dettagli sulle richieste in caso di under-margin)',
            threshold: 16,
            thresholdUnit: 'percent'
        },
        {
            id: 'margin-services',
            category: 'Margins',
            scope: 'Servizi',
            rule: 'Il margine di ciascuna Practice coinvolta deve essere >= del margine minimo specifico della Practice'
        },
        {
            id: 'margin-extensions',
            category: 'Margins',
            scope: 'Estensioni, CRs, Opportunità Child',
            rule: 'Il margine deve essere >= dei target aziendali o di quello approvato sul contratto principale. Nelle approvazioni il margine del contratto principale deve essere chiaramente indicato. Se il margine è inferiore, una autorizzazione specifica per l\'under-margin deve essere richiesta e tracciata.'
        },
        // Deviations
        {
            id: 'dev-salesforce',
            category: 'Deviations',
            scope: 'Campo SalesForce',
            rule: 'Deve essere impostato il campo "Deviazione ai Key Contracting Principles" nel CRM, e deve essere coinvolto da subito Expert Finance'
        },
        {
            id: 'dev-authorization',
            category: 'Deviations',
            scope: 'Livelli Autorizzativi',
            rule: 'Il livello autorizzativo viene aumentato di 1 (es: da L6 ad L5) per i livelli L6/L5/L4 (mentre i livelli L3/L2/L1 rimangono inalterati)'
        },
        {
            id: 'dev-documentation',
            category: 'Deviations',
            scope: 'Documentazione nell\'Opportunity Site',
            rule: 'La deviazione deve essere esplicitamente indicata e giustificata nei documenti di BID e sottomessa agli approvatori assieme al parere Expert'
        },
        {
            id: 'dev-negative-opinion',
            category: 'Deviations',
            scope: 'Parere Negativo Finance',
            rule: 'In caso di parere negativo Finance, il processo può essere interrotto in attesa di nuova PdL, o si può proseguire nella richiesta agli autorizzatori finali che prenderanno una decisione informata in funzione delle esigenze di business, del parere Expert e della documentazione nel site'
        },
        // IFRS15
        {
            id: 'ifrs15-evaluation',
            category: 'IFRS15',
            scope: 'IFRS15 Evaluation',
            rule: 'IFRS15 evaluation di SalesForce deve essere validato da Finance, unitamente ai valori economici dell\'opportunità'
        }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

/**
 * Get the active financial targets configuration
 */
export function getFinancialTargets(): FinancialTargetsConfig {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored) as FinancialTargetsConfig;
        }
    } catch (e) {
        console.error('Failed to load financial targets from localStorage:', e);
    }
    return DEFAULT_FINANCIAL_TARGETS;
}

/**
 * Save the financial targets configuration
 */
export function saveFinancialTargets(config: FinancialTargetsConfig): void {
    config.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/**
 * Reset to default configuration
 */
export function resetFinancialTargets(): void {
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get targets by category
 */
export function getTargetsByCategory(category: FinancialTargetCategory): FinancialTarget[] {
    const config = getFinancialTargets();
    return config.targets.filter(t => t.category === category);
}

/**
 * Update a single target's configuration
 */
export function updateTarget(targetConfig: FinancialTarget): void {
    const config = getFinancialTargets();
    const index = config.targets.findIndex(t => t.id === targetConfig.id);
    if (index !== -1) {
        config.targets[index] = targetConfig;
        saveFinancialTargets(config);
    }
}

/**
 * Add a new target to the configuration
 */
export function addTarget(targetConfig: FinancialTarget): void {
    const config = getFinancialTargets();
    config.targets.push(targetConfig);
    saveFinancialTargets(config);
}

/**
 * Remove a target from the configuration
 */
export function removeTarget(targetId: string): void {
    const config = getFinancialTargets();
    config.targets = config.targets.filter(t => t.id !== targetId);
    saveFinancialTargets(config);
}

/**
 * Get display name for a category
 */
export function getCategoryDisplayName(category: FinancialTargetCategory): string {
    const displayNames: Record<FinancialTargetCategory, string> = {
        CashFlow: 'Cash Flow (Payback Targets)',
        Margins: 'Margins (First Margin Targets)',
        Deviations: 'Deviazioni KCP',
        IFRS15: 'IFRS15 Evaluation'
    };
    return displayNames[category];
}
