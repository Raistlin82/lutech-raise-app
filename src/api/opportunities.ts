import { getSupabaseClient } from '@/lib/supabase';
import type { Opportunity, Phase, RaiseLevel, Checkpoint } from '@/types';
import type { Database } from '@/types/supabase';

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
    checkpoints: (row.checkpoints as unknown as Record<string, Checkpoint[]>) || {},
    firstMarginPercent: row.first_margin_percentage || undefined,
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
    title: opp.title,
    customer_id: opp.customerId || null,
    tcv: opp.tcv,
    first_margin_percentage: opp.firstMarginPercent ?? 0,
    raise_tcv: opp.raiseTcv,
    industry: opp.industry || null,
    is_public_sector: opp.isPublicSector,
    has_kcp_deviations: opp.hasKcpDeviations,
    raise_level: opp.raiseLevel,
    is_fast_track: opp.isFastTrack,
    current_phase: opp.currentPhase,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    checkpoints: opp.checkpoints as any, // JSON type
    created_by_email: userEmail,
    expected_decision_date: defaultDecisionDate.toISOString(),
  };
}

/**
 * Fetch all opportunities for the current user
 * RLS automatically filters by created_by_email
 */
export async function fetchOpportunities(): Promise<Opportunity[]> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    console.warn('Supabase not configured');
    return [];
  }

  const { data, error} = await supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching opportunities:', error);
    throw new Error(`Failed to fetch opportunities: ${error.message}`);
  }

  return (data || []).map(mapToOpportunity);
}

/**
 * Create new opportunity
 */
export async function createOpportunity(
  opportunity: Opportunity,
  userEmail: string
): Promise<Opportunity> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const insert = mapToInsert(opportunity, userEmail);

  const { data, error } = await supabase
    .from('opportunities')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(insert as any)
    .select()
    .single();

  if (error) {
    console.error('Error creating opportunity:', error);
    throw new Error(`Failed to create opportunity: ${error.message}`);
  }

  return mapToOpportunity(data);
}

/**
 * Update existing opportunity
 * RLS ensures user can only update their own opportunities
 */
export async function updateOpportunity(
  id: string,
  updates: Partial<Opportunity>
): Promise<Opportunity> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const update: Partial<OpportunityUpdate> = {
    title: updates.title,
    customer_id: updates.customerId || null,
    tcv: updates.tcv,
    first_margin_percentage: updates.firstMarginPercent,
    raise_tcv: updates.raiseTcv,
    industry: updates.industry || null,
    is_public_sector: updates.isPublicSector,
    has_kcp_deviations: updates.hasKcpDeviations,
    raise_level: updates.raiseLevel,
    is_fast_track: updates.isFastTrack,
    current_phase: updates.currentPhase,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    checkpoints: updates.checkpoints as any,
  };

  const { data, error } = await supabase
    .from('opportunities')
    // @ts-expect-error - Supabase generated types issue
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating opportunity:', error);
    throw new Error(`Failed to update opportunity: ${error.message}`);
  }

  return mapToOpportunity(data);
}

/**
 * Delete opportunity
 * RLS ensures user can only delete their own opportunities
 */
export async function deleteOpportunity(id: string): Promise<void> {
  const supabase = getSupabaseClient();

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
