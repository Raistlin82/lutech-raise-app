# Supabase Type Safety Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminare tutti i cast `as any` sui client Supabase introducendo un Repository Pattern type-safe.

**Architecture:** Creare un layer di repository (`src/repositories/`) che incapsula le query Supabase con tipi espliciti. I servizi esistenti useranno i repository invece di chiamare direttamente `getSupabaseClient()`.

**Tech Stack:** TypeScript strict mode, Supabase JS v2.89+, Zod per validazione runtime opzionale.

---

## Analisi del Problema

Attualmente ci sono **27 occorrenze** di `as any` nei file API/services per bypassare errori di tipo:
- `src/api/opportunities.ts` - 5 cast
- `src/api/customers.ts` - 4 cast
- `src/services/controlService.ts` - 6 cast
- `src/services/opportunityService.ts` - 5 cast
- `src/services/customerService.ts` - 5 cast
- `src/lib/supabase.ts` - 2 cast

**Root Cause:** `getSupabaseClient()` ritorna `SupabaseClient<Database> | null`, e i metodi `.from()` richiedono inferenza complessa che TypeScript non riesce a risolvere correttamente.

---

### Task 1: Creare il Base Repository con Type Guards

**Files:**
- Create: `src/repositories/baseRepository.ts`
- Test: `src/repositories/baseRepository.test.ts`

**Step 1: Scrivere il test per il guard `assertSupabaseClient`**

```typescript
// src/repositories/baseRepository.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assertSupabaseClient, isTestMode } from './baseRepository';
import * as supabaseModule from '@/lib/supabase';

describe('baseRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('isTestMode', () => {
    it('should return true when testMode is set in localStorage', () => {
      localStorage.setItem('testMode', 'true');
      expect(isTestMode()).toBe(true);
    });

    it('should return false when testMode is not set', () => {
      expect(isTestMode()).toBe(false);
    });
  });

  describe('assertSupabaseClient', () => {
    it('should throw when Supabase is not configured', () => {
      vi.spyOn(supabaseModule, 'getSupabaseClient').mockReturnValue(null);

      expect(() => assertSupabaseClient()).toThrow('Supabase client is not configured');
    });

    it('should return client when configured', () => {
      const mockClient = { from: vi.fn() };
      vi.spyOn(supabaseModule, 'getSupabaseClient').mockReturnValue(mockClient as any);

      const result = assertSupabaseClient();
      expect(result).toBe(mockClient);
    });
  });
});
```

**Step 2: Eseguire il test per verificare che fallisca**

Run: `npm test -- --run src/repositories/baseRepository.test.ts`
Expected: FAIL - "Cannot find module './baseRepository'"

**Step 3: Implementare il modulo base**

```typescript
// src/repositories/baseRepository.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

/**
 * Type-safe Supabase client type
 */
export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Check if running in test mode (E2E or unit tests)
 */
export function isTestMode(): boolean {
  return typeof window !== 'undefined' && localStorage.getItem('testMode') === 'true';
}

/**
 * Get Supabase client with null assertion
 * @throws Error if Supabase is not configured
 */
export function assertSupabaseClient(): TypedSupabaseClient {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  return client;
}

/**
 * Get Supabase client or null (for optional operations)
 */
export function getTypedClient(): TypedSupabaseClient | null {
  return getSupabaseClient();
}

/**
 * Base error type for repository operations
 */
export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}
```

**Step 4: Eseguire il test per verificare che passi**

Run: `npm test -- --run src/repositories/baseRepository.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/repositories/baseRepository.ts src/repositories/baseRepository.test.ts
git commit -m "feat(repo): add base repository with type guards"
```

---

### Task 2: Creare OpportunityRepository

**Files:**
- Create: `src/repositories/opportunityRepository.ts`
- Test: `src/repositories/opportunityRepository.test.ts`

**Step 1: Scrivere i test per le operazioni CRUD**

```typescript
// src/repositories/opportunityRepository.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpportunityRepository } from './opportunityRepository';
import * as baseRepo from './baseRepository';

describe('OpportunityRepository', () => {
  let repo: OpportunityRepository;
  let mockClient: any;
  let mockFrom: any;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Setup mock chain
    mockFrom = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    };

    mockClient = {
      from: vi.fn().mockReturnValue(mockFrom),
    };

    repo = new OpportunityRepository();
  });

  describe('findAll', () => {
    it('should return opportunities from localStorage in test mode', async () => {
      localStorage.setItem('testMode', 'true');
      const mockOpps = [{ id: 'opp-1', title: 'Test' }];
      localStorage.setItem('raise_opportunities', JSON.stringify(mockOpps));

      const result = await repo.findAll();
      expect(result).toEqual(mockOpps);
    });

    it('should return opportunities from Supabase when configured', async () => {
      vi.spyOn(baseRepo, 'isTestMode').mockReturnValue(false);
      vi.spyOn(baseRepo, 'getTypedClient').mockReturnValue(mockClient);

      const mockData = [
        { id: 'opp-1', title: 'Test', tcv: 100000, current_phase: 'Planning', raise_level: 'L6' }
      ];
      mockFrom.order.mockResolvedValue({ data: mockData, error: null });

      const result = await repo.findAll();
      expect(mockClient.from).toHaveBeenCalledWith('opportunities');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('opp-1');
    });

    it('should return empty array when Supabase not configured', async () => {
      vi.spyOn(baseRepo, 'isTestMode').mockReturnValue(false);
      vi.spyOn(baseRepo, 'getTypedClient').mockReturnValue(null);

      const result = await repo.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should find opportunity by ID from localStorage in test mode', async () => {
      localStorage.setItem('testMode', 'true');
      const mockOpps = [{ id: 'opp-1', title: 'Test' }];
      localStorage.setItem('raise_opportunities', JSON.stringify(mockOpps));

      const result = await repo.findById('opp-1');
      expect(result?.id).toBe('opp-1');
    });

    it('should return null when not found', async () => {
      localStorage.setItem('testMode', 'true');
      localStorage.setItem('raise_opportunities', '[]');

      const result = await repo.findById('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create opportunity in localStorage in test mode', async () => {
      localStorage.setItem('testMode', 'true');
      localStorage.setItem('raise_opportunities', '[]');

      const newOpp = { id: 'opp-new', title: 'New Opp', tcv: 50000 };
      const result = await repo.create(newOpp as any, 'test@example.com');

      expect(result.id).toBe('opp-new');
      const stored = JSON.parse(localStorage.getItem('raise_opportunities') || '[]');
      expect(stored.length).toBe(1);
    });
  });
});
```

**Step 2: Eseguire il test per verificare che fallisca**

Run: `npm test -- --run src/repositories/opportunityRepository.test.ts`
Expected: FAIL - "Cannot find module './opportunityRepository'"

**Step 3: Implementare OpportunityRepository**

```typescript
// src/repositories/opportunityRepository.ts
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

    const { data, error } = await client
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

    const { data, error } = await client
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
    const { data, error } = await client
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

    return mapRowToOpportunity(data);
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

    const { data, error } = await client
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

    return mapRowToOpportunity(data);
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

    const { error } = await client
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
```

**Step 4: Eseguire i test**

Run: `npm test -- --run src/repositories/opportunityRepository.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/repositories/opportunityRepository.ts src/repositories/opportunityRepository.test.ts
git commit -m "feat(repo): add OpportunityRepository with full CRUD"
```

---

### Task 3: Creare CustomerRepository

**Files:**
- Create: `src/repositories/customerRepository.ts`
- Test: `src/repositories/customerRepository.test.ts`

**Step 1: Scrivere i test**

```typescript
// src/repositories/customerRepository.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomerRepository } from './customerRepository';
import * as baseRepo from './baseRepository';

describe('CustomerRepository', () => {
  let repo: CustomerRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    repo = new CustomerRepository();
  });

  describe('findAll (test mode)', () => {
    it('should return customers from localStorage', async () => {
      localStorage.setItem('testMode', 'true');
      const mockCustomers = [{ id: 'cust-1', name: 'Test Corp' }];
      localStorage.setItem('raise_customers', JSON.stringify(mockCustomers));

      const result = await repo.findAll();
      expect(result).toEqual(mockCustomers);
    });
  });

  describe('create (test mode)', () => {
    it('should create customer in localStorage', async () => {
      localStorage.setItem('testMode', 'true');
      localStorage.setItem('raise_customers', '[]');

      const newCustomer = { id: 'cust-new', name: 'New Corp', industry: 'Tech', isPublicSector: false };
      const result = await repo.create(newCustomer as any);

      expect(result.id).toBe('cust-new');
      const stored = JSON.parse(localStorage.getItem('raise_customers') || '[]');
      expect(stored.length).toBe(1);
    });
  });
});
```

**Step 2: Eseguire test (fallisce)**

Run: `npm test -- --run src/repositories/customerRepository.test.ts`
Expected: FAIL

**Step 3: Implementare CustomerRepository**

```typescript
// src/repositories/customerRepository.ts
import type { Customer } from '@/types';
import type { Database } from '@/lib/database.types';
import { isTestMode, getTypedClient, RepositoryError } from './baseRepository';

type CustomerRow = Database['public']['Tables']['customers']['Row'];
type CustomerInsert = Database['public']['Tables']['customers']['Insert'];

function mapRowToCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    industry: row.industry,
    isPublicSector: row.is_public_sector,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCustomerToInsert(customer: Customer): CustomerInsert {
  return {
    id: customer.id,
    name: customer.name,
    industry: customer.industry,
    is_public_sector: customer.isPublicSector,
  };
}

const STORAGE_KEY = 'raise_customers';

export class CustomerRepository {
  async findAll(): Promise<Customer[]> {
    if (isTestMode()) {
      return this.findAllFromLocalStorage();
    }

    const client = getTypedClient();
    if (!client) return [];

    const { data, error } = await client
      .from('customers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new RepositoryError(`Failed to fetch customers: ${error.message}`, 'findAll', error);
    }

    return (data || []).map(mapRowToCustomer);
  }

  async findById(id: string): Promise<Customer | null> {
    if (isTestMode()) {
      const all = await this.findAllFromLocalStorage();
      return all.find(c => c.id === id) || null;
    }

    const client = getTypedClient();
    if (!client) return null;

    const { data, error } = await client
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new RepositoryError(`Failed to fetch customer: ${error.message}`, 'findById', error);
    }

    return data ? mapRowToCustomer(data) : null;
  }

  async create(customer: Customer): Promise<Customer> {
    if (isTestMode()) {
      return this.createInLocalStorage(customer);
    }

    const client = getTypedClient();
    if (!client) {
      throw new RepositoryError('Supabase not configured', 'create');
    }

    const insert = mapCustomerToInsert(customer);
    const { data, error } = await client
      .from('customers')
      .insert(insert)
      .select()
      .single();

    if (error) {
      throw new RepositoryError(`Failed to create customer: ${error.message}`, 'create', error);
    }

    return mapRowToCustomer(data);
  }

  async update(id: string, updates: Partial<Customer>): Promise<Customer> {
    if (isTestMode()) {
      return this.updateInLocalStorage(id, updates);
    }

    const client = getTypedClient();
    if (!client) {
      throw new RepositoryError('Supabase not configured', 'update');
    }

    const dbUpdates: Partial<CustomerInsert> = {
      name: updates.name,
      industry: updates.industry,
      is_public_sector: updates.isPublicSector,
    };

    Object.keys(dbUpdates).forEach(key => {
      if (dbUpdates[key as keyof typeof dbUpdates] === undefined) {
        delete dbUpdates[key as keyof typeof dbUpdates];
      }
    });

    const { data, error } = await client
      .from('customers')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new RepositoryError(`Failed to update customer: ${error.message}`, 'update', error);
    }

    return mapRowToCustomer(data);
  }

  async delete(id: string): Promise<void> {
    if (isTestMode()) {
      return this.deleteFromLocalStorage(id);
    }

    const client = getTypedClient();
    if (!client) {
      throw new RepositoryError('Supabase not configured', 'delete');
    }

    const { error } = await client
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      throw new RepositoryError(`Failed to delete customer: ${error.message}`, 'delete', error);
    }
  }

  private findAllFromLocalStorage(): Customer[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private createInLocalStorage(customer: Customer): Customer {
    const all = this.findAllFromLocalStorage();
    all.push(customer);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return customer;
  }

  private updateInLocalStorage(id: string, updates: Partial<Customer>): Customer {
    const all = this.findAllFromLocalStorage();
    const index = all.findIndex(c => c.id === id);
    if (index === -1) throw new RepositoryError(`Customer not found: ${id}`, 'update');
    all[index] = { ...all[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return all[index];
  }

  private deleteFromLocalStorage(id: string): void {
    const all = this.findAllFromLocalStorage();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all.filter(c => c.id !== id)));
  }
}

export const customerRepository = new CustomerRepository();
```

**Step 4: Eseguire test**

Run: `npm test -- --run src/repositories/customerRepository.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/repositories/customerRepository.ts src/repositories/customerRepository.test.ts
git commit -m "feat(repo): add CustomerRepository with full CRUD"
```

---

### Task 4: Creare Repository Index e Aggiornare API

**Files:**
- Create: `src/repositories/index.ts`
- Modify: `src/api/opportunities.ts`
- Modify: `src/api/customers.ts`

**Step 1: Creare l'index**

```typescript
// src/repositories/index.ts
export { opportunityRepository, OpportunityRepository } from './opportunityRepository';
export { customerRepository, CustomerRepository } from './customerRepository';
export { isTestMode, assertSupabaseClient, getTypedClient, RepositoryError } from './baseRepository';
export type { TypedSupabaseClient } from './baseRepository';
```

**Step 2: Aggiornare `src/api/opportunities.ts`**

Sostituire l'intero contenuto con:

```typescript
// src/api/opportunities.ts
import { opportunityRepository } from '@/repositories';
import type { Opportunity } from '@/types';

/**
 * Fetch all opportunities for the current user
 * @deprecated Use opportunityRepository.findAll() directly
 */
export async function fetchOpportunities(): Promise<Opportunity[]> {
  return opportunityRepository.findAll();
}

/**
 * Create new opportunity
 * @deprecated Use opportunityRepository.create() directly
 */
export async function createOpportunity(opportunity: Opportunity, userEmail: string): Promise<Opportunity> {
  return opportunityRepository.create(opportunity, userEmail);
}

/**
 * Update existing opportunity
 * @deprecated Use opportunityRepository.update() directly
 */
export async function updateOpportunity(id: string, updates: Partial<Opportunity>): Promise<Opportunity> {
  return opportunityRepository.update(id, updates);
}

/**
 * Delete opportunity
 * @deprecated Use opportunityRepository.delete() directly
 */
export async function deleteOpportunity(id: string): Promise<void> {
  return opportunityRepository.delete(id);
}
```

**Step 3: Aggiornare `src/api/customers.ts`**

Sostituire l'intero contenuto con:

```typescript
// src/api/customers.ts
import { customerRepository } from '@/repositories';
import type { Customer } from '@/types';

/**
 * Fetch all customers
 * @deprecated Use customerRepository.findAll() directly
 */
export async function fetchCustomers(): Promise<Customer[]> {
  return customerRepository.findAll();
}

/**
 * Create new customer
 * @deprecated Use customerRepository.create() directly
 */
export async function createCustomer(customer: Customer): Promise<Customer> {
  return customerRepository.create(customer);
}

/**
 * Update existing customer
 * @deprecated Use customerRepository.update() directly
 */
export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
  return customerRepository.update(id, updates);
}

/**
 * Delete customer
 * @deprecated Use customerRepository.delete() directly
 */
export async function deleteCustomer(id: string): Promise<void> {
  return customerRepository.delete(id);
}
```

**Step 4: Eseguire tutti i test**

Run: `npm test -- --run`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/repositories/index.ts src/api/opportunities.ts src/api/customers.ts
git commit -m "refactor(api): delegate to type-safe repositories"
```

---

### Task 5: Aggiornare Services per usare Repository

**Files:**
- Modify: `src/services/opportunityService.ts`
- Modify: `src/services/customerService.ts`

**Step 1: Refactor opportunityService.ts**

Sostituire i metodi che usano `getSupabaseClient() as any` con chiamate ai repository.

**Esempio di cambio:**

```typescript
// PRIMA (con as any):
const supabase = getSupabaseClient() as any;
const { data, error } = await supabase.from('opportunities').select('*');

// DOPO (type-safe):
import { opportunityRepository } from '@/repositories';
const data = await opportunityRepository.findAll();
```

**Step 2: Eseguire test esistenti**

Run: `npm test -- --run src/services/opportunityService.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/services/opportunityService.ts src/services/customerService.ts
git commit -m "refactor(services): use type-safe repositories"
```

---

### Task 6: Cleanup - Rimuovere Cast Residui

**Files:**
- Modify: `src/services/controlService.ts`
- Verify: No more `as any` in API/services layer

**Step 1: Verificare che non ci siano più cast**

Run: `grep -rn "as any" src/api/ src/services/ src/repositories/`
Expected: 0 risultati (o solo in codice legacy documentato)

**Step 2: Eseguire test E2E**

Run: `npm run test:e2e`
Expected: All 53 tests PASS

**Step 3: Commit finale**

```bash
git add -A
git commit -m "refactor: complete type-safe repository migration"
```

---

## Riepilogo

| Task | Descrizione | File Creati/Modificati |
|------|-------------|------------------------|
| 1 | Base Repository con type guards | `baseRepository.ts`, test |
| 2 | OpportunityRepository | `opportunityRepository.ts`, test |
| 3 | CustomerRepository | `customerRepository.ts`, test |
| 4 | Index + API refactor | `index.ts`, `opportunities.ts`, `customers.ts` |
| 5 | Services refactor | `opportunityService.ts`, `customerService.ts` |
| 6 | Cleanup cast residui | Verifica e test finali |

**Stima effort:** ~2-3 ore di lavoro effettivo

**Benefici:**
- Zero `as any` nei layer API/services
- Centralizzazione logica localStorage/Supabase
- Test più semplici da scrivere
- Migliore inferenza tipi in IDE
- Preparazione per future migrazioni DB
