/**
 * Opportunity Service
 * Handles CRUD operations for opportunities with Supabase/localStorage fallback
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Opportunity, KcpDeviation, Checkpoint, Phase, RaiseLevel } from '../types';
import type { Database } from '../lib/database.types';

type OpportunityRow = Database['public']['Tables']['opportunities']['Row'];
type KcpDeviationRow = Database['public']['Tables']['kcp_deviations']['Row'];
type CheckpointRow = Database['public']['Tables']['opportunity_checkpoints']['Row'];

const STORAGE_KEY = 'raise_opportunities';

/**
 * Convert database row to Opportunity type
 */
function rowToOpportunity(
    row: OpportunityRow,
    deviations: KcpDeviationRow[] = [],
    checkpoints: CheckpointRow[] = []
): Opportunity {
    // Group checkpoints by phase
    const checkpointsByPhase: Record<string, Checkpoint[]> = {};
    checkpoints.forEach(cp => {
        if (!checkpointsByPhase[cp.phase]) {
            checkpointsByPhase[cp.phase] = [];
        }
        checkpointsByPhase[cp.phase].push({
            id: cp.control_id,
            label: '',
            checked: cp.is_completed,
            required: true,
            description: cp.notes || undefined,
        });
    });

    return {
        id: row.id,
        title: row.title,
        customerId: row.customer_id || undefined,
        clientName: row.client_name || undefined,
        industry: row.industry || undefined,
        tcv: row.tcv,
        raiseTcv: row.raise_tcv,
        marginPercent: row.margin_percent || undefined,
        firstMarginPercent: row.first_margin_percent || undefined,
        cashFlowNeutral: row.cash_flow_neutral || undefined,
        servicesValue: row.services_value || undefined,
        currentPhase: row.current_phase as Phase,
        hasKcpDeviations: row.has_kcp_deviations,
        isFastTrack: row.is_fast_track,
        isRti: row.is_rti,
        isMandataria: row.is_mandataria || undefined,
        isPublicSector: row.is_public_sector,
        hasSocialClauses: row.has_social_clauses || undefined,
        isNonCoreBusiness: row.is_non_core_business || undefined,
        hasLowRiskServices: row.has_low_risk_services || undefined,
        isSmallTicket: row.is_small_ticket || undefined,
        isNewCustomer: row.is_new_customer || undefined,
        isChild: row.is_child || undefined,
        hasSuppliers: row.has_suppliers || undefined,
        supplierAlignment: row.supplier_alignment as Opportunity['supplierAlignment'] || undefined,
        raiseLevel: row.raise_level as RaiseLevel,
        privacyRiskLevel: row.privacy_risk_level as Opportunity['privacyRiskLevel'] || undefined,
        offerDate: row.offer_date || undefined,
        contractDate: row.contract_date || undefined,
        orderDate: row.order_date || undefined,
        atsDate: row.ats_date || undefined,
        atcDate: row.atc_date || undefined,
        rcpDate: row.rcp_date || undefined,
        deviations: deviations.map(d => ({
            id: d.id,
            type: d.type as KcpDeviation['type'],
            description: d.description,
            expertOpinion: d.expert_opinion as KcpDeviation['expertOpinion'] || undefined,
            expertName: d.expert_name || undefined,
        })),
        checkpoints: checkpointsByPhase,
    };
}

/**
 * Convert Opportunity to database insert/update format
 */
function opportunityToDbRecord(opp: Opportunity) {
    return {
        id: opp.id,
        title: opp.title,
        customer_id: opp.customerId || null,
        client_name: opp.clientName || null,
        industry: opp.industry || null,
        tcv: opp.tcv,
        raise_tcv: opp.raiseTcv,
        margin_percent: opp.marginPercent || null,
        first_margin_percent: opp.firstMarginPercent || null,
        cash_flow_neutral: opp.cashFlowNeutral || null,
        services_value: opp.servicesValue || null,
        current_phase: opp.currentPhase,
        has_kcp_deviations: opp.hasKcpDeviations,
        is_fast_track: opp.isFastTrack,
        is_rti: opp.isRti,
        is_mandataria: opp.isMandataria || null,
        is_public_sector: opp.isPublicSector,
        has_social_clauses: opp.hasSocialClauses || null,
        is_non_core_business: opp.isNonCoreBusiness || null,
        has_low_risk_services: opp.hasLowRiskServices || null,
        is_small_ticket: opp.isSmallTicket || null,
        is_new_customer: opp.isNewCustomer || null,
        is_child: opp.isChild || null,
        has_suppliers: opp.hasSuppliers || null,
        supplier_alignment: opp.supplierAlignment || null,
        raise_level: opp.raiseLevel,
        privacy_risk_level: opp.privacyRiskLevel || null,
        offer_date: opp.offerDate?.toString() || null,
        contract_date: opp.contractDate?.toString() || null,
        order_date: opp.orderDate?.toString() || null,
        ats_date: opp.atsDate?.toString() || null,
        atc_date: opp.atcDate?.toString() || null,
        rcp_date: opp.rcpDate?.toString() || null,
    };
}

/**
 * Get all opportunities
 */
export async function getOpportunities(): Promise<Opportunity[]> {
    if (isSupabaseConfigured() && supabase) {
        const { data: opps, error: oppsError } = await supabase
            .from('opportunities')
            .select('*')
            .order('created_at', { ascending: false });

        if (oppsError) {
            console.error('Supabase error fetching opportunities:', oppsError);
            throw new Error(`Failed to fetch opportunities: ${oppsError.message}`);
        }

        if (!opps || opps.length === 0) {
            return [];
        }

        // Fetch all deviations and checkpoints for these opportunities
        const oppIds = opps.map(o => o.id);

        const [deviationsResult, checkpointsResult] = await Promise.all([
            supabase.from('kcp_deviations').select('*').in('opportunity_id', oppIds),
            supabase.from('opportunity_checkpoints').select('*').in('opportunity_id', oppIds),
        ]);

        const deviationsByOpp: Record<string, KcpDeviationRow[]> = {};
        (deviationsResult.data || []).forEach(d => {
            if (!deviationsByOpp[d.opportunity_id]) {
                deviationsByOpp[d.opportunity_id] = [];
            }
            deviationsByOpp[d.opportunity_id].push(d);
        });

        const checkpointsByOpp: Record<string, CheckpointRow[]> = {};
        (checkpointsResult.data || []).forEach(cp => {
            if (!checkpointsByOpp[cp.opportunity_id]) {
                checkpointsByOpp[cp.opportunity_id] = [];
            }
            checkpointsByOpp[cp.opportunity_id].push(cp);
        });

        return opps.map(opp =>
            rowToOpportunity(
                opp,
                deviationsByOpp[opp.id] || [],
                checkpointsByOpp[opp.id] || []
            )
        );
    }

    // Fallback to localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

/**
 * Get a single opportunity by ID
 */
export async function getOpportunity(id: string): Promise<Opportunity | null> {
    if (isSupabaseConfigured() && supabase) {
        const [oppResult, deviationsResult, checkpointsResult] = await Promise.all([
            supabase.from('opportunities').select('*').eq('id', id).single(),
            supabase.from('kcp_deviations').select('*').eq('opportunity_id', id),
            supabase.from('opportunity_checkpoints').select('*').eq('opportunity_id', id),
        ]);

        if (oppResult.error) {
            if (oppResult.error.code === 'PGRST116') return null;
            console.error('Supabase error fetching opportunity:', oppResult.error);
            throw new Error(`Failed to fetch opportunity: ${oppResult.error.message}`);
        }

        return rowToOpportunity(
            oppResult.data,
            deviationsResult.data || [],
            checkpointsResult.data || []
        );
    }

    // Fallback to localStorage
    const opportunities = await getOpportunities();
    return opportunities.find(o => o.id === id) || null;
}

/**
 * Create a new opportunity
 */
export async function createOpportunity(opp: Opportunity): Promise<Opportunity> {
    if (isSupabaseConfigured() && supabase) {
        // Insert opportunity - using type assertion for Supabase compatibility
        const { data, error } = await supabase
            .from('opportunities')
            .insert(opportunityToDbRecord(opp))
            .select()
            .single();

        if (error) {
            console.error('Supabase error creating opportunity:', error);
            throw new Error(`Failed to create opportunity: ${error.message}`);
        }

        // Insert deviations if any
        if (opp.deviations && opp.deviations.length > 0) {
            const deviationData = opp.deviations.map(d => ({
                id: d.id || crypto.randomUUID(),
                opportunity_id: opp.id,
                type: d.type,
                description: d.description,
                expert_opinion: d.expertOpinion || null,
                expert_name: d.expertName || null,
            }));

            const { error: devError } = await supabase
                .from('kcp_deviations')
                .insert(deviationData);

            if (devError) {
                console.error('Supabase error creating deviations:', devError);
            }
        }

        // Insert checkpoints if any
        const checkpointData: Array<{
            opportunity_id: string;
            control_id: string;
            phase: string;
            is_completed: boolean;
            notes: string | null;
        }> = [];

        Object.entries(opp.checkpoints || {}).forEach(([phase, cps]) => {
            cps.forEach(cp => {
                checkpointData.push({
                    opportunity_id: opp.id,
                    control_id: cp.id,
                    phase,
                    is_completed: cp.checked,
                    notes: cp.description || null,
                });
            });
        });

        if (checkpointData.length > 0) {
            const { error: cpError } = await supabase
                .from('opportunity_checkpoints')
                .insert(checkpointData);

            if (cpError) {
                console.error('Supabase error creating checkpoints:', cpError);
            }
        }

        return rowToOpportunity(data, [], []);
    }

    // Fallback to localStorage
    const opportunities = await getOpportunities();
    opportunities.push(opp);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(opportunities));
    return opp;
}

/**
 * Update an existing opportunity
 */
export async function updateOpportunity(opp: Opportunity): Promise<Opportunity> {
    if (isSupabaseConfigured() && supabase) {
        // Update main opportunity record
        const dbRecord = opportunityToDbRecord(opp);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _id, ...updateData } = dbRecord;

        const { data, error } = await supabase
            .from('opportunities')
            .update(updateData)
            .eq('id', opp.id)
            .select()
            .single();

        if (error) {
            console.error('Supabase error updating opportunity:', error);
            throw new Error(`Failed to update opportunity: ${error.message}`);
        }

        // Update deviations - delete all and re-insert
        await supabase.from('kcp_deviations').delete().eq('opportunity_id', opp.id);
        if (opp.deviations && opp.deviations.length > 0) {
            const deviationData = opp.deviations.map(d => ({
                id: d.id || crypto.randomUUID(),
                opportunity_id: opp.id,
                type: d.type,
                description: d.description,
                expert_opinion: d.expertOpinion || null,
                expert_name: d.expertName || null,
            }));
            await supabase.from('kcp_deviations').insert(deviationData);
        }

        // Update checkpoints - delete all and re-insert
        await supabase.from('opportunity_checkpoints').delete().eq('opportunity_id', opp.id);
        const checkpointData: Array<{
            opportunity_id: string;
            control_id: string;
            phase: string;
            is_completed: boolean;
            notes: string | null;
        }> = [];

        Object.entries(opp.checkpoints || {}).forEach(([phase, cps]) => {
            cps.forEach(cp => {
                checkpointData.push({
                    opportunity_id: opp.id,
                    control_id: cp.id,
                    phase,
                    is_completed: cp.checked,
                    notes: cp.description || null,
                });
            });
        });

        if (checkpointData.length > 0) {
            await supabase.from('opportunity_checkpoints').insert(checkpointData);
        }

        return rowToOpportunity(data, [], []);
    }

    // Fallback to localStorage
    const opportunities = await getOpportunities();
    const index = opportunities.findIndex(o => o.id === opp.id);
    if (index === -1) {
        throw new Error('Opportunity not found');
    }
    opportunities[index] = opp;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(opportunities));
    return opp;
}

/**
 * Delete an opportunity
 */
export async function deleteOpportunity(id: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
        // Delete related records first (cascade should handle this, but being explicit)
        await Promise.all([
            supabase.from('kcp_deviations').delete().eq('opportunity_id', id),
            supabase.from('opportunity_checkpoints').delete().eq('opportunity_id', id),
        ]);

        const { error } = await supabase
            .from('opportunities')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Supabase error deleting opportunity:', error);
            throw new Error(`Failed to delete opportunity: ${error.message}`);
        }

        return;
    }

    // Fallback to localStorage
    const opportunities = await getOpportunities();
    const filtered = opportunities.filter(o => o.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Check if the service is using Supabase or localStorage
 */
export function isUsingSupabase(): boolean {
    return isSupabaseConfigured();
}
