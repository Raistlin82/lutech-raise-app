/**
 * Migration Service
 * Handles data migration from localStorage to Supabase
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import * as customerService from './customerService';
import * as opportunityService from './opportunityService';
import * as controlService from './controlService';
import type { Customer, Opportunity, ControlConfig } from '../types';

// localStorage keys
const STORAGE_KEYS = {
    customers: 'raise_customers',
    opportunities: 'raise_opportunities',
    controls: 'raise_controls',
};

export interface MigrationResult {
    success: boolean;
    customersCount: number;
    opportunitiesCount: number;
    controlsCount: number;
    errors: string[];
    warnings: string[];
}

export interface MigrationStatus {
    hasLocalData: boolean;
    hasSupabaseData: boolean;
    localCounts: {
        customers: number;
        opportunities: number;
        controls: number;
    };
    supabaseCounts: {
        customers: number;
        opportunities: number;
        controls: number;
    };
}

/**
 * Check if Supabase is available for migration
 */
export function canMigrate(): boolean {
    return isSupabaseConfigured();
}

/**
 * Get current migration status - what data exists where
 */
export async function getMigrationStatus(): Promise<MigrationStatus> {
    const localCounts = getLocalDataCounts();
    const supabaseCounts = await getSupabaseDataCounts();

    return {
        hasLocalData: localCounts.customers > 0 || localCounts.opportunities > 0 || localCounts.controls > 0,
        hasSupabaseData: supabaseCounts.customers > 0 || supabaseCounts.opportunities > 0 || supabaseCounts.controls > 0,
        localCounts,
        supabaseCounts,
    };
}

/**
 * Get counts of data in localStorage
 */
function getLocalDataCounts(): { customers: number; opportunities: number; controls: number } {
    const getCount = (key: string): number => {
        try {
            const data = localStorage.getItem(key);
            if (!data) return 0;
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed.length : 0;
        } catch {
            return 0;
        }
    };

    return {
        customers: getCount(STORAGE_KEYS.customers),
        opportunities: getCount(STORAGE_KEYS.opportunities),
        controls: getCount(STORAGE_KEYS.controls),
    };
}

/**
 * Get counts of data in Supabase
 */
async function getSupabaseDataCounts(): Promise<{ customers: number; opportunities: number; controls: number }> {
    if (!isSupabaseConfigured() || !supabase) {
        return { customers: 0, opportunities: 0, controls: 0 };
    }

    try {
        const [customersResult, opportunitiesResult, controlsResult] = await Promise.all([
            supabase.from('customers').select('id', { count: 'exact', head: true }),
            supabase.from('opportunities').select('id', { count: 'exact', head: true }),
            supabase.from('controls').select('id', { count: 'exact', head: true }),
        ]);

        return {
            customers: customersResult.count || 0,
            opportunities: opportunitiesResult.count || 0,
            controls: controlsResult.count || 0,
        };
    } catch (error) {
        console.error('Error getting Supabase counts:', error);
        return { customers: 0, opportunities: 0, controls: 0 };
    }
}

/**
 * Read data from localStorage
 */
function getLocalData(): { customers: Customer[]; opportunities: Opportunity[]; controls: ControlConfig[] } {
    const parseData = <T>(key: string): T[] => {
        try {
            const data = localStorage.getItem(key);
            if (!data) return [];
            return JSON.parse(data) as T[];
        } catch {
            return [];
        }
    };

    return {
        customers: parseData<Customer>(STORAGE_KEYS.customers),
        opportunities: parseData<Opportunity>(STORAGE_KEYS.opportunities),
        controls: parseData<ControlConfig>(STORAGE_KEYS.controls),
    };
}

/**
 * Migrate all data from localStorage to Supabase
 * @param options Migration options
 * @returns Migration result with counts and errors
 */
export async function migrateToSupabase(options: {
    clearLocalAfter?: boolean;
    overwriteExisting?: boolean;
} = {}): Promise<MigrationResult> {
    const { clearLocalAfter = false, overwriteExisting = false } = options;

    const result: MigrationResult = {
        success: false,
        customersCount: 0,
        opportunitiesCount: 0,
        controlsCount: 0,
        errors: [],
        warnings: [],
    };

    if (!isSupabaseConfigured() || !supabase) {
        result.errors.push('Supabase non è configurato. Imposta VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
        return result;
    }

    const localData = getLocalData();

    // Check if there's data to migrate
    if (localData.customers.length === 0 && localData.opportunities.length === 0 && localData.controls.length === 0) {
        result.warnings.push('Nessun dato locale da migrare.');
        result.success = true;
        return result;
    }

    // Check for existing Supabase data
    const supabaseCounts = await getSupabaseDataCounts();
    if (!overwriteExisting && (supabaseCounts.customers > 0 || supabaseCounts.opportunities > 0)) {
        result.errors.push('Esistono già dati in Supabase. Usa overwriteExisting: true per sovrascriverli.');
        return result;
    }

    try {
        // If overwriting, clear existing data first
        if (overwriteExisting) {
            await clearSupabaseData();
            result.warnings.push('Dati esistenti in Supabase eliminati.');
        }

        // Migrate customers
        if (localData.customers.length > 0) {
            const customerResults = await migrateCustomers(localData.customers);
            result.customersCount = customerResults.count;
            result.errors.push(...customerResults.errors);
        }

        // Migrate opportunities
        if (localData.opportunities.length > 0) {
            const opportunityResults = await migrateOpportunities(localData.opportunities);
            result.opportunitiesCount = opportunityResults.count;
            result.errors.push(...opportunityResults.errors);
        }

        // Migrate controls
        if (localData.controls.length > 0) {
            const controlResults = await migrateControls(localData.controls);
            result.controlsCount = controlResults.count;
            result.errors.push(...controlResults.errors);
        }

        // Clear localStorage if requested
        if (clearLocalAfter && result.errors.length === 0) {
            clearLocalStorage();
            result.warnings.push('Dati locali eliminati dopo migrazione.');
        }

        result.success = result.errors.length === 0;

    } catch (error) {
        result.errors.push(`Errore durante la migrazione: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    }

    return result;
}

/**
 * Migrate customers to Supabase
 */
async function migrateCustomers(customers: Customer[]): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = [];
    let count = 0;

    for (const customer of customers) {
        try {
            await customerService.createCustomer(customer);
            count++;
        } catch (error) {
            errors.push(`Errore cliente "${customer.name}": ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
        }
    }

    return { count, errors };
}

/**
 * Migrate opportunities to Supabase
 */
async function migrateOpportunities(opportunities: Opportunity[]): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = [];
    let count = 0;

    for (const opportunity of opportunities) {
        try {
            await opportunityService.createOpportunity(opportunity);
            count++;
        } catch (error) {
            errors.push(`Errore opportunità "${opportunity.title}": ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
        }
    }

    return { count, errors };
}

/**
 * Migrate controls to Supabase
 */
async function migrateControls(controls: ControlConfig[]): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = [];

    try {
        await controlService.resetControls(controls);
        return { count: controls.length, errors };
    } catch (error) {
        errors.push(`Errore migrazione controlli: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
        return { count: 0, errors };
    }
}

/**
 * Clear all data from Supabase
 */
async function clearSupabaseData(): Promise<void> {
    if (!supabase) return;

    // Delete in order to respect foreign key constraints
    await supabase.from('opportunity_checkpoints').delete().neq('id', '');
    await supabase.from('kcp_deviations').delete().neq('id', '');
    await supabase.from('opportunities').delete().neq('id', '');
    await supabase.from('customers').delete().neq('id', '');
    await supabase.from('control_template_links').delete().neq('id', '');
    await supabase.from('controls').delete().neq('id', '');
}

/**
 * Clear all RAISE data from localStorage
 */
function clearLocalStorage(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
}

/**
 * Export all Supabase data to localStorage (for backup)
 */
export async function exportToLocalStorage(): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
        return { success: false, error: 'Supabase non configurato' };
    }

    try {
        const [customers, opportunities, controls] = await Promise.all([
            customerService.getCustomers(),
            opportunityService.getOpportunities(),
            controlService.getControls(),
        ]);

        localStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(customers));
        localStorage.setItem(STORAGE_KEYS.opportunities, JSON.stringify(opportunities));
        localStorage.setItem(STORAGE_KEYS.controls, JSON.stringify(controls));

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Errore durante l\'esportazione',
        };
    }
}
