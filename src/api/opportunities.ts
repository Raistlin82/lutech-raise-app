import { getSupabaseClient } from '@/lib/supabase';
import type { Opportunity } from '@/types';
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
    description: row.description || '',
    customerId: row.customer_id || undefined,
    tcv: row.tcv,
    firstMarginPercentage: row.first_margin_percentage,
    raiseTcv: row.raise_tcv || undefined,
    industry: row.industry || '',
    isPublicSector: row.is_public_sector || false,
    expectedDecisionDate: row.expected_decision_date,
    expectedSignatureDate: row.expected_signature_date || undefined,
    expectedDeliveryStart: row.expected_delivery_start || undefined,
    hasKcpDeviations: row.has_kcp_deviations,
    kcpDeviationsDetail: row.kcp_deviations_detail || undefined,
    raiseLevel: row.raise_level,
    isFastTrack: row.is_fast_track,
    currentPhase: row.current_phase,
    status: row.status,
    checkpoints: row.checkpoints as Record<string, string[]>,
    createdByEmail: row.created_by_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Map frontend Opportunity to Supabase insert type
 */
function mapToInsert(opp: Opportunity, userEmail: string): OpportunityInsert {
  return {
    title: opp.title,
    description: opp.description || null,
    customer_id: opp.customerId || null,
    tcv: opp.tcv,
    first_margin_percentage: opp.firstMarginPercentage,
    raise_tcv: opp.raiseTcv || null,
    industry: opp.industry || null,
    is_public_sector: opp.isPublicSector,
    expected_decision_date: opp.expectedDecisionDate,
    expected_signature_date: opp.expectedSignatureDate || null,
    expected_delivery_start: opp.expectedDeliveryStart || null,
    has_kcp_deviations: opp.hasKcpDeviations,
    kcp_deviations_detail: opp.kcpDeviationsDetail || null,
    raise_level: opp.raiseLevel,
    is_fast_track: opp.isFastTrack,
    current_phase: opp.currentPhase,
    status: opp.status,
    checkpoints: opp.checkpoints,
    created_by_email: userEmail, // User ownership
  };
}

/**
 * Fetch all opportunities for the current user
 * RLS automatically filters by created_by_email
 */
export async function fetchOpportunities(): Promise<Opportunity[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching opportunities:', error);
    throw new Error(`Failed to fetch opportunities: ${error.message}`);
  }

  return data.map(mapToOpportunity);
}

/**
 * Create new opportunity
 */
export async function createOpportunity(
  opportunity: Opportunity,
  userEmail: string
): Promise<Opportunity> {
  const supabase = getSupabaseClient();

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

  const update: OpportunityUpdate = {
    title: updates.title,
    description: updates.description || null,
    customer_id: updates.customerId || null,
    tcv: updates.tcv,
    first_margin_percentage: updates.firstMarginPercentage,
    raise_tcv: updates.raiseTcv || null,
    industry: updates.industry || null,
    is_public_sector: updates.isPublicSector,
    expected_decision_date: updates.expectedDecisionDate,
    expected_signature_date: updates.expectedSignatureDate || null,
    expected_delivery_start: updates.expectedDeliveryStart || null,
    has_kcp_deviations: updates.hasKcpDeviations,
    kcp_deviations_detail: updates.kcpDeviationsDetail || null,
    raise_level: updates.raiseLevel,
    is_fast_track: updates.isFastTrack,
    current_phase: updates.currentPhase,
    status: updates.status,
    checkpoints: updates.checkpoints,
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

  return mapToOpportunity(data);
}

/**
 * Delete opportunity
 * RLS ensures user can only delete their own opportunities
 */
export async function deleteOpportunity(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('opportunities')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting opportunity:', error);
    throw new Error(`Failed to delete opportunity: ${error.message}`);
  }
}
