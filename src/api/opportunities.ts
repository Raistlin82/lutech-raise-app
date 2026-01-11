import { getSupabaseClient } from '@/lib/supabase';
import type { Opportunity, Phase, RaiseLevel } from '@/types';
import type { Database } from '@/lib/database.types';

type OpportunityRow = Database['public']['Tables']['opportunities']['Row'];
type OpportunityInsert = Database['public']['Tables']['opportunities']['Insert'];
type OpportunityUpdate = Database['public']['Tables']['opportunities']['Update'];

/**
 * Map Supabase row to frontend Opportunity type
 */
function mapToOpportunity(row: OpportunityRow): Opportunity {
  return {
    id: row.id,
    title: row.title,
    customerId: row.customer_id || undefined,
    clientName: undefined, // Deprecated, derived from customer
    industry: row.industry || undefined,
    tcv: row.tcv,
    raiseTcv: row.raise_tcv ?? row.tcv,
    currentPhase: row.current_phase as Phase,
    hasKcpDeviations: row.has_kcp_deviations,
    isFastTrack: row.is_fast_track,
    isRti: false, // Default
    isPublicSector: row.is_public_sector || false,
    raiseLevel: row.raise_level as RaiseLevel,
    deviations: [], // TODO: Load from separate table
    checkpoints: {}, // Now handled via separate table or on-the-fly
    marginPercent: row.margin_percent || undefined,
    firstMarginPercent: row.first_margin_percent || undefined,
    isMultiLot: row.is_multi_lot || false,
    areLotsMutuallyExclusive: row.are_lots_mutually_exclusive || false,
    lots: (row.lots as unknown as any[]) || [],
    createdByEmail: row.created_by_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Map frontend Opportunity to Supabase insert type
 */
function mapToInsert(opp: Opportunity, userEmail: string): OpportunityInsert {
  // Default expected_decision_date to 90 days from now if not provided
  const defaultDecisionDate = new Date();
  defaultDecisionDate.setDate(defaultDecisionDate.getDate() + 90);

  return {
    id: opp.id,
    title: opp.title,
    customer_id: opp.customerId || null,
    tcv: opp.tcv,
    margin_percent: opp.marginPercent || null,
    first_margin_percent: opp.firstMarginPercent || null,
    raise_tcv: opp.raiseTcv,
    industry: opp.industry || null,
    is_public_sector: opp.isPublicSector,
    has_kcp_deviations: opp.hasKcpDeviations,
    raise_level: opp.raiseLevel,
    is_fast_track: opp.isFastTrack,
    current_phase: opp.currentPhase,
    is_multi_lot: opp.isMultiLot || false,
    are_lots_mutually_exclusive: opp.areLotsMutuallyExclusive || false,
    lots: opp.lots || [],
    created_by_email: userEmail,
    expected_decision_date: defaultDecisionDate.toISOString(),
  };
}

/**
 * Fetch all opportunities for the current user
 * RLS automatically filters by created_by_email
 */
export async function fetchOpportunities(): Promise<Opportunity[]> {
  // E2E TEST MODE: Read from localStorage instead of Supabase
  if (typeof window !== 'undefined' && localStorage.getItem('testMode') === 'true') {
    const stored = localStorage.getItem('raise_opportunities');
    if (stored) {
      try {
        const opportunities = JSON.parse(stored) as Opportunity[];
        console.log('[TEST MODE] Loaded opportunities from localStorage:', opportunities.length);
        return opportunities;
      } catch (e) {
        console.error('[TEST MODE] Failed to parse opportunities from localStorage', e);
      }
    }
    console.log('[TEST MODE] No opportunities in localStorage, returning empty array');
    return [];
  }

  // PRODUCTION: Read from Supabase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseClient() as any;

  if (!supabase) {
    console.warn('Supabase not configured');
    return [];
  }

  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching opportunities:', error);
    throw new Error(`Failed to fetch opportunities: ${error.message}`);
  }

  return ((data as OpportunityRow[]) || []).map(mapToOpportunity);
}

/**
 * Create new opportunity
 */
export async function createOpportunity(
  opportunity: Opportunity,
  userEmail: string
): Promise<Opportunity> {
  // E2E TEST MODE: Save to localStorage instead of Supabase
  if (typeof window !== 'undefined' && localStorage.getItem('testMode') === 'true') {
    const stored = localStorage.getItem('raise_opportunities');
    const opportunities = stored ? JSON.parse(stored) as Opportunity[] : [];
    opportunities.push(opportunity);
    localStorage.setItem('raise_opportunities', JSON.stringify(opportunities));
    return opportunity;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseClient() as any;

  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const insert = mapToInsert(opportunity, userEmail);

  const { data, error } = await supabase
    .from('opportunities')
    .insert(insert)
    .select()
    .single();

  if (error) {
    console.error('Error creating opportunity:', error);
    throw new Error(`Failed to create opportunity: ${error.message}`);
  }

  return mapToOpportunity(data as OpportunityRow);
}

/**
 * Update existing opportunity
 * RLS ensures user can only update their own opportunities
 */
export async function updateOpportunity(
  id: string,
  updates: Partial<Opportunity>
): Promise<Opportunity> {
  // E2E TEST MODE: Update in localStorage instead of Supabase
  if (typeof window !== 'undefined' && localStorage.getItem('testMode') === 'true') {
    const stored = localStorage.getItem('raise_opportunities');
    const opportunities = stored ? JSON.parse(stored) as Opportunity[] : [];
    const index = opportunities.findIndex(o => o.id === id);
    if (index !== -1) {
      opportunities[index] = { ...opportunities[index], ...updates };
      localStorage.setItem('raise_opportunities', JSON.stringify(opportunities));
      return opportunities[index];
    }
    throw new Error(`Opportunity ${id} not found in localStorage`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseClient() as any;

  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const update: Partial<OpportunityUpdate> = {
    title: updates.title,
    customer_id: updates.customerId || null,
    tcv: updates.tcv,
    first_margin_percent: updates.firstMarginPercent || null,
    margin_percent: updates.marginPercent || null,
    raise_tcv: updates.raiseTcv,
    industry: updates.industry || null,
    is_public_sector: updates.isPublicSector,
    has_kcp_deviations: updates.hasKcpDeviations,
    raise_level: updates.raiseLevel,
    is_fast_track: updates.isFastTrack,
    current_phase: updates.currentPhase,
    is_multi_lot: updates.isMultiLot,
    are_lots_mutually_exclusive: updates.areLotsMutuallyExclusive,
    lots: updates.lots,
  };

  const { data, error } = await supabase
    .from('opportunities')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating opportunity:', error);
    throw new Error(`Failed to update opportunity: ${error.message}`);
  }

  return mapToOpportunity(data as OpportunityRow);
}

/**
 * Delete opportunity
 * RLS ensures user can only delete their own opportunities
 */
export async function deleteOpportunity(id: string): Promise<void> {
  // E2E TEST MODE: Delete from localStorage instead of Supabase
  if (typeof window !== 'undefined' && localStorage.getItem('testMode') === 'true') {
    const stored = localStorage.getItem('raise_opportunities');
    const opportunities = stored ? JSON.parse(stored) as Opportunity[] : [];
    const filtered = opportunities.filter(o => o.id !== id);
    localStorage.setItem('raise_opportunities', JSON.stringify(filtered));
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseClient() as any;

  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from('opportunities')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting opportunity:', error);
    throw new Error(`Failed to delete opportunity: ${error.message}`);
  }
}
