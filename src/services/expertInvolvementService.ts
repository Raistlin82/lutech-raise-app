/**
 * Expert Involvement Service
 * Manages the configurable expert involvement rules for RAISE opportunities
 */
import type { ExpertInvolvementConfig, ExpertConfig, ExpertFunction, RaiseLevel } from '../types';

const STORAGE_KEY = 'raise_expert_involvement';

// Default configuration based on PSQ-003 v17 and Excel "Coinvolgimento Expert"
export const DEFAULT_EXPERT_INVOLVEMENT: ExpertInvolvementConfig = {
    id: 'default',
    name: 'PSQ-003 v17 Default',
    isActive: true,
    experts: [
        {
            id: 'finance',
            function: 'Finance',
            displayName: 'Finance',
            applicableLevels: ['L1', 'L2', 'L3', 'L4', 'L5'],
            involvementCondition: 'Obbligatorio se deviazioni KCP, attività estero, opportunità con servizi aventi TCV > 300k',
            email: 'Finance-Raise@lutech.it'
        },
        {
            id: 'procurement',
            function: 'Procurement',
            displayName: 'Procurement',
            applicableLevels: ['L1', 'L2', 'L3', 'L4', 'L5'],
            involvementCondition: 'Obbligatorio se: Fornitori non in albo (da certificare), attività estero per rivendita prodotti/servizi esterni > 200K€, marginalità rivendita < 5%, disallineamento T&C fornitore/cliente',
            email: 'procurement@lutech.it'
        },
        {
            id: 'cmcio',
            function: 'CMCIO',
            displayName: 'Chief Marketing, Communication & Innovation Officer',
            applicableLevels: ['L1', 'L2', 'L3', 'L4', 'L5'],
            involvementCondition: 'Obbligatorio per tutte le opportunità con rivendita di prodotti esterni >= 250k€'
        },
        {
            id: 'legal',
            function: 'Legal',
            displayName: 'Legal',
            applicableLevels: ['L1', 'L2', 'L3', 'L4', 'L5'],
            involvementCondition: 'Obbligatorio su livelli L1-L2, e su altri livelli in caso deviazioni KCP, obbligatorio su opportunità con rivendita prodotti HW/SW se disallineamento T&C',
            email: 'ufficiolegale@lutech.it'
        },
        {
            id: 'compliance231',
            function: 'Compliance231',
            displayName: 'Compliance 231 & Etico',
            applicableLevels: ['L1', 'L2', 'L3', 'L4', 'L5'],
            involvementCondition: 'Attività estere, clienti Extra UE, ambito DLgs.231/01 ed etico in generale',
            email: 'EthicalRisk@lutech.it'
        },
        {
            id: 'complianceAnticorruzione',
            function: 'ComplianceAnticorruzione',
            displayName: 'Compliance Anticorruzione',
            applicableLevels: ['L1', 'L2', 'L3', 'L4', 'L5'],
            involvementCondition: 'Ambito ISO 37001, prevenzione corruzione, due diligence RTI',
            email: 'EthicalRisk@lutech.it'
        },
        {
            id: 'complianceESG',
            function: 'ComplianceESG',
            displayName: 'Compliance ESG',
            applicableLevels: ['L1', 'L2', 'L3', 'L4', 'L5'],
            involvementCondition: 'Ambito sostenibilità, emissioni gas serra, portali ESG',
            email: 'ESG@lutech.it'
        },
        {
            id: 'complianceSistemiGestione',
            function: 'ComplianceSistemiGestione',
            displayName: 'Compliance Sistemi Gestione',
            applicableLevels: ['L1', 'L2', 'L3', 'L4', 'L5'],
            involvementCondition: 'Ambito sistemi di gestione',
            email: 'ManagementSystems@lutech.it'
        },
        {
            id: 'complianceAltro',
            function: 'ComplianceAltro',
            displayName: 'Compliance (Altro)',
            applicableLevels: ['L1', 'L2', 'L3', 'L4', 'L5'],
            involvementCondition: 'Per tematiche non afferenti le precedenti righe Compliance',
            email: 'richieste.compliance@lutech.it'
        },
        {
            id: 'dataPrivacy',
            function: 'DataPrivacy',
            displayName: 'Data Privacy Manager',
            applicableLevels: ['L1', 'L2', 'L3', 'L4', 'L5'],
            involvementCondition: 'Obbligatorio se "Rischio Privacy" nel Deal Qualification è "Alto" o "Molto Alto"',
            email: 'DataPrivacy@lutech.it'
        },
        {
            id: 'risk',
            function: 'Risk',
            displayName: 'Senior Risk Manager',
            applicableLevels: ['L1', 'L2', 'L3', 'L4', 'L5'],
            involvementCondition: 'Obbligatorio su livelli L3-L2-L1 in caso deviazioni KCP, e su livelli L4-L5 se rischi > 2%',
            email: 'BidRisk@lutech.it'
        },
        {
            id: 'security',
            function: 'Security',
            displayName: 'Chief Security Officer',
            applicableLevels: ['L1', 'L2', 'L3', 'L4', 'L5'],
            involvementCondition: 'Da coinvolgere per tematiche di sicurezza'
        },
        {
            id: 'hse',
            function: 'HSE',
            displayName: 'HSE Head',
            applicableLevels: ['L1', 'L2', 'L3', 'L4', 'L5'],
            involvementCondition: 'Da coinvolgere per tematiche Health, Safety, Environment'
        },
        {
            id: 'hr',
            function: 'HR',
            displayName: 'Chief Human Resources Officer',
            applicableLevels: ['L1', 'L2', 'L3', 'L4', 'L5'],
            involvementCondition: 'Da coinvolgere per tematiche HR'
        }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

/**
 * Get the active expert involvement configuration
 */
export function getExpertInvolvement(): ExpertInvolvementConfig {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored) as ExpertInvolvementConfig;
        }
    } catch (e) {
        console.error('Failed to load expert involvement from localStorage:', e);
    }
    return DEFAULT_EXPERT_INVOLVEMENT;
}

/**
 * Save the expert involvement configuration
 */
export function saveExpertInvolvement(config: ExpertInvolvementConfig): void {
    config.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/**
 * Reset to default configuration
 */
export function resetExpertInvolvement(): void {
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get experts applicable for a given RAISE level
 */
export function getExpertsForLevel(level: RaiseLevel): ExpertConfig[] {
    const config = getExpertInvolvement();
    return config.experts.filter(expert => expert.applicableLevels.includes(level));
}

/**
 * Update a single expert's configuration
 */
export function updateExpert(expertConfig: ExpertConfig): void {
    const config = getExpertInvolvement();
    const index = config.experts.findIndex(e => e.id === expertConfig.id);
    if (index !== -1) {
        config.experts[index] = expertConfig;
        saveExpertInvolvement(config);
    }
}

/**
 * Add a new expert to the configuration
 */
export function addExpert(expertConfig: ExpertConfig): void {
    const config = getExpertInvolvement();
    config.experts.push(expertConfig);
    saveExpertInvolvement(config);
}

/**
 * Remove an expert from the configuration
 */
export function removeExpert(expertId: string): void {
    const config = getExpertInvolvement();
    config.experts = config.experts.filter(e => e.id !== expertId);
    saveExpertInvolvement(config);
}

/**
 * Get display name for an expert function
 */
export function getExpertFunctionDisplayName(func: ExpertFunction): string {
    const displayNames: Record<ExpertFunction, string> = {
        Finance: 'Finance',
        Procurement: 'Procurement',
        CMCIO: 'Chief Marketing, Communication & Innovation Officer',
        Legal: 'Legal',
        Compliance231: 'Compliance 231 & Etico',
        ComplianceAnticorruzione: 'Compliance Anticorruzione',
        ComplianceESG: 'Compliance ESG',
        ComplianceSistemiGestione: 'Compliance Sistemi Gestione',
        ComplianceAltro: 'Compliance (Altro)',
        DataPrivacy: 'Data Privacy Manager',
        Risk: 'Senior Risk Manager',
        Security: 'Chief Security Officer',
        HSE: 'HSE Head',
        HR: 'Chief Human Resources Officer'
    };
    return displayNames[func];
}
