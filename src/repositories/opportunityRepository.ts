import type { Opportunity, Phase, RaiseLevel, Lot } from '@/types';
import type { Database } from '@/lib/database.types';
import { isTestMode, getTypedClient, RepositoryError } from './baseRepository';

type OpportunityRow = Database['public']['Tables']['opportunities']['Row'];
type OpportunityInsert = Database['public']['Tables']['opportunities']['Insert'];

/**
 * Map database row to domain model
 */
function mapRowToOpportunity(row: OpportunityRow): Opportunity {
  return {
    id: row.id,
    title: row.title,
    customerId: row.customer_id || undefined,
    clientName: undefined,
    industry: row.industry || undefined,
    tcv: row.tcv,
    raiseTcv: row.raise_tcv ?? row.tcv,
    currentPhase: row.current_phase as Phase,
    hasKcpDeviations: row.has_kcp_deviations,
    isFastTrack: row.is_fast_track,
    isRti: false,
    isPublicSector: row.is_public_sector || false,
    raiseLevel: row.raise_level as RaiseLevel,
    deviations: [],
    checkpoints: {},
    marginPercent: row.margin_percent || undefined,
    firstMarginPercent: row.first_margin_percent || undefined,
    isMultiLot: row.is_multi_lot || false,
    areLotsMutuallyExclusive: row.are_lots_mutually_exclusive || false,
    lots: (row.lots as Lot[]) || [],
    createdByEmail: row.created_by_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Map domain model to database insert
 */
function mapOpportunityToInsert(opp: Opportunity, userEmail: string): OpportunityInsert {
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

const STORAGE_KEY = 'raise_opportunities';

/**
 * Repository for Opportunity CRUD operations
 * Handles both Supabase and localStorage fallback
 */
export class OpportunityRepository {
  /**
   * Find all opportunities for the current user
   */
  async findAll(): Promise<Opportunity[]> {
    if (isTestMode()) {
      return this.findAllFromLocalStorage();
    }

    const client = getTypedClient();
    if (!client) {
      console.warn('[OpportunityRepository] Supabase not configured, returning empty');
      return [];
    }

    // Note: We cast the client to 'any' to work around TypeScript's limitation
    // with Supabase generic chain inference. The client is properly typed.
    const { data, error } = await (client as any)
      .from('opportunities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new RepositoryError(
        `Failed to fetch opportunities: ${error.message}`,
        'findAll',
        error
      );
    }

    return (data || []).map(mapRowToOpportunity);
  }

  /**
   * Find opportunity by ID
   */
  async findById(id: string): Promise<Opportunity | null> {
    if (isTestMode()) {
      const all = await this.findAllFromLocalStorage();
      return all.find(o => o.id === id) || null;
    }

    const client = getTypedClient();
    if (!client) {
      return null;
    }

    // Note: Client cast needed for TypeScript generic inference
    const { data, error } = await (client as any)
      .from('opportunities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new RepositoryError(
        `Failed to fetch opportunity: ${error.message}`,
        'findById',
        error
      );
    }

    return data ? mapRowToOpportunity(data) : null;
  }

  /**
   * Create new opportunity
   */
  async create(opportunity: Opportunity, userEmail: string): Promise<Opportunity> {
    if (isTestMode()) {
      return this.createInLocalStorage(opportunity);
    }

    const client = getTypedClient();
    if (!client) {
      throw new RepositoryError('Supabase not configured', 'create');
    }

    const insert = mapOpportunityToInsert(opportunity, userEmail);

    // Note: We cast the client to 'any' here because TypeScript's type inference
    // struggles with the Supabase generic chain in strict mode, even though
    // the client is properly typed as SupabaseClient<Database>
    // The insert data is type-checked by mapOpportunityToInsert()
    const { data, error } = await (client as any)
      .from('opportunities')
      .insert(insert)
      .select()
      .single();

    if (error) {
      throw new RepositoryError(
        `Failed to create opportunity: ${error.message}`,
        'create',
        error
      );
    }

    return mapRowToOpportunity(data as OpportunityRow);
  }

  /**
   * Update existing opportunity
   */
  async update(id: string, updates: Partial<Opportunity>): Promise<Opportunity> {
    if (isTestMode()) {
      return this.updateInLocalStorage(id, updates);
    }

    const client = getTypedClient();
    if (!client) {
      throw new RepositoryError('Supabase not configured', 'update');
    }

    const dbUpdates: Partial<OpportunityInsert> = {
      title: updates.title,
      tcv: updates.tcv,
      raise_tcv: updates.raiseTcv,
      current_phase: updates.currentPhase,
      raise_level: updates.raiseLevel,
      has_kcp_deviations: updates.hasKcpDeviations,
      is_fast_track: updates.isFastTrack,
      margin_percent: updates.marginPercent,
      first_margin_percent: updates.firstMarginPercent,
      is_multi_lot: updates.isMultiLot,
      are_lots_mutually_exclusive: updates.areLotsMutuallyExclusive,
      lots: updates.lots,
    };

    // Remove undefined values
    Object.keys(dbUpdates).forEach(key => {
      if (dbUpdates[key as keyof typeof dbUpdates] === undefined) {
        delete dbUpdates[key as keyof typeof dbUpdates];
      }
    });

    // Note: We cast the client to 'any' here because TypeScript's type inference
    // struggles with the Supabase generic chain in strict mode
    // The update data is type-checked by the dbUpdates object construction above
    const { data, error } = await (client as any)
      .from('opportunities')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new RepositoryError(
        `Failed to update opportunity: ${error.message}`,
        'update',
        error
      );
    }

    return mapRowToOpportunity(data as OpportunityRow);
  }

  /**
   * Delete opportunity
   */
  async delete(id: string): Promise<void> {
    if (isTestMode()) {
      return this.deleteFromLocalStorage(id);
    }

    const client = getTypedClient();
    if (!client) {
      throw new RepositoryError('Supabase not configured', 'delete');
    }

    // Note: Client cast needed for TypeScript generic inference
    const { error } = await (client as any)
      .from('opportunities')
      .delete()
      .eq('id', id);

    if (error) {
      throw new RepositoryError(
        `Failed to delete opportunity: ${error.message}`,
        'delete',
        error
      );
    }
  }

  // ==================== LocalStorage Helpers ====================

  private findAllFromLocalStorage(): Opportunity[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as Opportunity[];
  }

  private createInLocalStorage(opportunity: Opportunity): Opportunity {
    const all = this.findAllFromLocalStorage();
    all.push(opportunity);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return opportunity;
  }

  private updateInLocalStorage(id: string, updates: Partial<Opportunity>): Opportunity {
    const all = this.findAllFromLocalStorage();
    const index = all.findIndex(o => o.id === id);
    if (index === -1) {
      throw new RepositoryError(`Opportunity not found: ${id}`, 'update');
    }
    all[index] = { ...all[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return all[index];
  }

  private deleteFromLocalStorage(id: string): void {
    const all = this.findAllFromLocalStorage();
    const filtered = all.filter(o => o.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
}

/**
 * Singleton instance
 */
export const opportunityRepository = new OpportunityRepository();
