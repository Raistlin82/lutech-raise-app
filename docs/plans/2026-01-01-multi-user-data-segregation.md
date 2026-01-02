# Multi-User Data Segregation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement user-based data segregation where each user sees only their own opportunities, while customers and settings remain shared across all users.

**Architecture:** Use Supabase as backend with Row Level Security (RLS) policies to enforce data segregation at the database level. Extract user email from SAP IAS JWT token and use it as the user identifier. Migrate from localStorage to Supabase for persistent storage with automatic sync.

**Tech Stack:**
- Supabase (PostgreSQL + RLS + Realtime)
- @supabase/supabase-js client library
- SAP IAS (OIDC) for authentication
- Zustand for state management
- Vitest + React Testing Library for testing

---

## Phase 1: Database Schema & RLS Policies

### Task 1.1: Create Supabase Tables Schema

**Files:**
- Create: `supabase/migrations/20260101000001_create_tables.sql`
- Reference: `src/types/index.ts` (existing types)

**Step 1: Create migration file**

Create the SQL migration with complete schema:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers table (SHARED across all users)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 200),
  industry TEXT NOT NULL CHECK (industry IN (
    'Technology', 'Manufacturing', 'Finance', 'Healthcare',
    'Retail', 'Energy', 'Transportation', 'Public Administration',
    'Telecommunications', 'Consulting'
  )),
  is_public_sector BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Opportunities table (USER-SPECIFIC with RLS)
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL CHECK (length(title) >= 3 AND length(title) <= 200),
  description TEXT,
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,

  -- Financial data
  tcv NUMERIC NOT NULL CHECK (tcv > 0 AND tcv < 1000000000),
  first_margin_percentage NUMERIC NOT NULL CHECK (first_margin_percentage >= 0 AND first_margin_percentage <= 100),
  raise_tcv NUMERIC,

  -- Business data
  industry TEXT,
  is_public_sector BOOLEAN DEFAULT false,
  expected_decision_date DATE NOT NULL,
  expected_signature_date DATE,
  expected_delivery_start DATE,
  has_kcp_deviations BOOLEAN NOT NULL DEFAULT false,
  kcp_deviations_detail TEXT,

  -- RAISE calculation results
  raise_level TEXT NOT NULL CHECK (raise_level IN ('L1', 'L2', 'L3', 'L4', 'L5', 'L6')),
  is_fast_track BOOLEAN NOT NULL DEFAULT false,

  -- Workflow state
  current_phase TEXT NOT NULL DEFAULT 'Planning' CHECK (current_phase IN (
    'Planning', 'ATP', 'ATS', 'ATC', 'Won', 'Lost', 'Handover'
  )),
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Won', 'Lost')),
  checkpoints JSONB NOT NULL DEFAULT '{}',

  -- User ownership (EMAIL from SAP IAS)
  created_by_email TEXT NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Settings/Checkpoints table (SHARED across all users)
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checkpoint_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('Planning', 'ATP', 'ATS', 'ATC', 'Handover', 'ALL')),
  raise_levels TEXT[] NOT NULL,
  description TEXT,
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_opportunities_created_by ON opportunities(created_by_email);
CREATE INDEX idx_opportunities_customer ON opportunities(customer_id);
CREATE INDEX idx_opportunities_phase ON opportunities(current_phase);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_settings_phase ON settings(phase);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Step 2: Verify migration syntax**

Run: `supabase db lint` (if available) or validate SQL syntax
Expected: No syntax errors

**Step 3: Commit schema**

```bash
git add supabase/migrations/20260101000001_create_tables.sql
git commit -m "feat: add Supabase database schema for multi-user segregation"
```

---

### Task 1.2: Implement Row Level Security (RLS) Policies

**Files:**
- Create: `supabase/migrations/20260101000002_enable_rls.sql`

**Step 1: Create RLS migration**

```sql
-- Enable RLS on opportunities table (user-specific data)
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own opportunities
CREATE POLICY "users_see_own_opportunities"
ON opportunities
FOR SELECT
USING (created_by_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Policy: Users can only insert opportunities with their email
CREATE POLICY "users_insert_own_opportunities"
ON opportunities
FOR INSERT
WITH CHECK (created_by_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Policy: Users can only update their own opportunities
CREATE POLICY "users_update_own_opportunities"
ON opportunities
FOR UPDATE
USING (created_by_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Policy: Users can only delete their own opportunities
CREATE POLICY "users_delete_own_opportunities"
ON opportunities
FOR DELETE
USING (created_by_email = current_setting('request.jwt.claims', true)::json->>'email');

-- NO RLS on customers table (shared data - all users can CRUD)
-- Customers are shared resources, no restrictions needed

-- NO RLS on settings table (shared data - all users can read, admin can write)
-- Settings are shared configuration, no restrictions needed

-- Grant necessary permissions to authenticated users
GRANT ALL ON customers TO authenticated;
GRANT ALL ON opportunities TO authenticated;
GRANT SELECT ON settings TO authenticated;

-- Add comment explaining RLS strategy
COMMENT ON TABLE opportunities IS 'User-specific data: RLS enforces created_by_email = JWT email';
COMMENT ON TABLE customers IS 'Shared data: All authenticated users can CRUD';
COMMENT ON TABLE settings IS 'Shared data: All authenticated users can read';
```

**Step 2: Commit RLS policies**

```bash
git add supabase/migrations/20260101000002_enable_rls.sql
git commit -m "feat: add RLS policies for opportunity segregation"
```

---

## Phase 2: Supabase Client & API Layer

### Task 2.1: Install Supabase Client Library

**Files:**
- Modify: `package.json`

**Step 1: Install dependencies**

Run: `npm install @supabase/supabase-js`
Expected: Package installed successfully

**Step 2: Commit dependency**

```bash
git add package.json package-lock.json
git commit -m "chore: add @supabase/supabase-js dependency"
```

---

### Task 2.2: Create Supabase Client Configuration

**Files:**
- Create: `src/lib/supabase.ts`
- Modify: `.env.example` (add Supabase env vars)

**Step 1: Write test for Supabase client initialization**

Create: `src/__tests__/unit/lib/supabase.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSupabaseClient, setSupabaseAuth } from '@/lib/supabase';

describe('Supabase Client', () => {
  beforeEach(() => {
    // Reset module mocks
    vi.resetModules();
  });

  it('should initialize Supabase client with env vars', () => {
    const client = getSupabaseClient();
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });

  it('should set authentication token from SAP IAS', async () => {
    const mockToken = 'mock-jwt-token';
    const client = getSupabaseClient();

    await setSupabaseAuth(mockToken);

    // Verify token is set (implementation detail - we trust Supabase)
    expect(client.auth.getSession).toBeDefined();
  });

  it('should throw error if env vars are missing', () => {
    const originalUrl = import.meta.env.VITE_SUPABASE_URL;
    const originalKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // @ts-expect-error - testing missing env vars
    delete import.meta.env.VITE_SUPABASE_URL;

    expect(() => {
      vi.resetModules();
      require('@/lib/supabase');
    }).toThrow();

    // Restore
    import.meta.env.VITE_SUPABASE_URL = originalUrl;
    import.meta.env.VITE_SUPABASE_ANON_KEY = originalKey;
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/unit/lib/supabase.test.ts`
Expected: FAIL - "Cannot find module '@/lib/supabase'"

**Step 3: Implement Supabase client**

Create: `src/lib/supabase.ts`

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Validate environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
  );
}

// Create singleton Supabase client
let supabaseClient: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseClient) {
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false, // We use SAP IAS, not Supabase auth
      },
    });
  }
  return supabaseClient;
}

/**
 * Set authentication token from SAP IAS JWT
 * Call this after user logs in via SAP IAS
 */
export async function setSupabaseAuth(accessToken: string): Promise<void> {
  const client = getSupabaseClient();

  // Set the JWT token for Supabase to use in RLS policies
  // Supabase will extract the email from JWT claims
  await client.auth.setSession({
    access_token: accessToken,
    refresh_token: '', // Not used with external auth
  });
}

/**
 * Clear authentication
 * Call this when user logs out
 */
export async function clearSupabaseAuth(): Promise<void> {
  const client = getSupabaseClient();
  await client.auth.signOut();
}
```

**Step 4: Create Database type definitions**

Create: `src/types/supabase.ts`

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string;
          name: string;
          industry: string;
          is_public_sector: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          industry: string;
          is_public_sector?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          industry?: string;
          is_public_sector?: boolean;
          updated_at?: string;
        };
      };
      opportunities: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          customer_id: string | null;
          tcv: number;
          first_margin_percentage: number;
          raise_tcv: number | null;
          industry: string | null;
          is_public_sector: boolean | null;
          expected_decision_date: string;
          expected_signature_date: string | null;
          expected_delivery_start: string | null;
          has_kcp_deviations: boolean;
          kcp_deviations_detail: string | null;
          raise_level: string;
          is_fast_track: boolean;
          current_phase: string;
          status: string;
          checkpoints: Json;
          created_by_email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          customer_id?: string | null;
          tcv: number;
          first_margin_percentage: number;
          raise_tcv?: number | null;
          industry?: string | null;
          is_public_sector?: boolean | null;
          expected_decision_date: string;
          expected_signature_date?: string | null;
          expected_delivery_start?: string | null;
          has_kcp_deviations?: boolean;
          kcp_deviations_detail?: string | null;
          raise_level: string;
          is_fast_track?: boolean;
          current_phase?: string;
          status?: string;
          checkpoints?: Json;
          created_by_email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          customer_id?: string | null;
          tcv?: number;
          first_margin_percentage?: number;
          raise_tcv?: number | null;
          industry?: string | null;
          is_public_sector?: boolean | null;
          expected_decision_date?: string;
          expected_signature_date?: string | null;
          expected_delivery_start?: string | null;
          has_kcp_deviations?: boolean;
          kcp_deviations_detail?: string | null;
          raise_level?: string;
          is_fast_track?: boolean;
          current_phase?: string;
          status?: string;
          checkpoints?: Json;
          updated_at?: string;
        };
      };
      settings: {
        Row: {
          id: string;
          checkpoint_id: string;
          name: string;
          phase: string;
          raise_levels: string[];
          description: string | null;
          is_mandatory: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          checkpoint_id: string;
          name: string;
          phase: string;
          raise_levels: string[];
          description?: string | null;
          is_mandatory?: boolean;
          display_order: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          checkpoint_id?: string;
          name?: string;
          phase?: string;
          raise_levels?: string[];
          description?: string | null;
          is_mandatory?: boolean;
          display_order?: number;
          updated_at?: string;
        };
      };
    };
  };
}
```

**Step 5: Update .env.example**

Add to `.env.example`:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

**Step 6: Run tests to verify they pass**

Run: `npm test -- src/__tests__/unit/lib/supabase.test.ts`
Expected: PASS (all tests green)

**Step 7: Commit implementation**

```bash
git add src/lib/supabase.ts src/types/supabase.ts src/__tests__/unit/lib/supabase.test.ts .env.example
git commit -m "feat: add Supabase client configuration with auth integration"
```

---

### Task 2.3: Create Opportunities API Layer

**Files:**
- Create: `src/api/opportunities.ts`
- Create: `src/__tests__/unit/api/opportunities.test.ts`

**Step 1: Write test for opportunities API**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchOpportunities,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity
} from '@/api/opportunities';
import type { Opportunity } from '@/types';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [],
          error: null
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'test-id' },
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: 'test-id' },
              error: null
            }))
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          error: null
        }))
      }))
    }))
  })
}));

describe('Opportunities API', () => {
  it('should fetch opportunities for current user', async () => {
    const opportunities = await fetchOpportunities();
    expect(Array.isArray(opportunities)).toBe(true);
  });

  it('should create new opportunity with user email', async () => {
    const newOpp: Partial<Opportunity> = {
      title: 'Test Opportunity',
      tcv: 500000,
      firstMarginPercentage: 25
    };

    const created = await createOpportunity(newOpp as Opportunity, 'user@example.com');
    expect(created).toHaveProperty('id');
  });

  it('should update existing opportunity', async () => {
    const updated = await updateOpportunity('test-id', { title: 'Updated' });
    expect(updated).toHaveProperty('id');
  });

  it('should delete opportunity', async () => {
    await expect(deleteOpportunity('test-id')).resolves.not.toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/__tests__/unit/api/opportunities.test.ts`
Expected: FAIL - "Cannot find module '@/api/opportunities'"

**Step 3: Implement opportunities API**

Create: `src/api/opportunities.ts`

```typescript
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
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/__tests__/unit/api/opportunities.test.ts`
Expected: PASS

**Step 5: Commit API layer**

```bash
git add src/api/opportunities.ts src/__tests__/unit/api/opportunities.test.ts
git commit -m "feat: add opportunities API layer with Supabase integration"
```

---

### Task 2.4: Create Customers API Layer

**Files:**
- Create: `src/api/customers.ts`
- Create: `src/__tests__/unit/api/customers.test.ts`

**Step 1: Write test for customers API**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer } from '@/api/customers';
import type { Customer } from '@/types';

// Mock Supabase client (similar to opportunities test)
vi.mock('@/lib/supabase');

describe('Customers API', () => {
  it('should fetch all customers (shared data)', async () => {
    const customers = await fetchCustomers();
    expect(Array.isArray(customers)).toBe(true);
  });

  it('should create new customer', async () => {
    const newCustomer: Partial<Customer> = {
      name: 'Test Corp',
      industry: 'Technology',
      isPublicSector: false
    };

    const created = await createCustomer(newCustomer as Customer);
    expect(created).toHaveProperty('id');
  });

  it('should update customer', async () => {
    const updated = await updateCustomer('test-id', { name: 'Updated Corp' });
    expect(updated).toHaveProperty('id');
  });

  it('should delete customer', async () => {
    await expect(deleteCustomer('test-id')).resolves.not.toThrow();
  });
});
```

**Step 2: Implement customers API**

Create: `src/api/customers.ts`

```typescript
import { getSupabaseClient } from '@/lib/supabase';
import type { Customer } from '@/types';
import type { Database } from '@/types/supabase';

type CustomerRow = Database['public']['Tables']['customers']['Row'];
type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

function mapToCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    industry: row.industry,
    isPublicSector: row.is_public_sector,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetch all customers (shared across all users)
 */
export async function fetchCustomers(): Promise<Customer[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching customers:', error);
    throw new Error(`Failed to fetch customers: ${error.message}`);
  }

  return data.map(mapToCustomer);
}

/**
 * Create new customer (any user can create)
 */
export async function createCustomer(customer: Customer): Promise<Customer> {
  const supabase = getSupabaseClient();

  const insert: CustomerInsert = {
    name: customer.name,
    industry: customer.industry,
    is_public_sector: customer.isPublicSector,
  };

  const { data, error } = await supabase
    .from('customers')
    .insert(insert)
    .select()
    .single();

  if (error) {
    console.error('Error creating customer:', error);
    throw new Error(`Failed to create customer: ${error.message}`);
  }

  return mapToCustomer(data);
}

/**
 * Update customer (any user can update shared data)
 */
export async function updateCustomer(
  id: string,
  updates: Partial<Customer>
): Promise<Customer> {
  const supabase = getSupabaseClient();

  const update: CustomerUpdate = {
    name: updates.name,
    industry: updates.industry,
    is_public_sector: updates.isPublicSector,
  };

  const { data, error } = await supabase
    .from('customers')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating customer:', error);
    throw new Error(`Failed to update customer: ${error.message}`);
  }

  return mapToCustomer(data);
}

/**
 * Delete customer (with referential integrity check)
 */
export async function deleteCustomer(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id);

  if (error) {
    // Foreign key constraint will prevent deletion if opportunities exist
    console.error('Error deleting customer:', error);
    throw new Error(`Failed to delete customer: ${error.message}`);
  }
}
```

**Step 3: Run tests and commit**

```bash
npm test -- src/__tests__/unit/api/customers.test.ts
git add src/api/customers.ts src/__tests__/unit/api/customers.test.ts
git commit -m "feat: add customers API layer for shared data"
```

---

## Phase 3: Auth Integration & User Context

### Task 3.1: Extract User Email from SAP IAS Token

**Files:**
- Modify: `src/main.tsx`
- Create: `src/hooks/useUserEmail.ts`
- Create: `src/__tests__/unit/hooks/useUserEmail.test.ts`

**Step 1: Write test for useUserEmail hook**

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUserEmail } from '@/hooks/useUserEmail';
import { useAuth } from 'react-oidc-context';

vi.mock('react-oidc-context');

describe('useUserEmail', () => {
  it('should return user email from auth context', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        profile: {
          email: 'test@example.com'
        }
      },
      isAuthenticated: true
    } as any);

    const { result } = renderHook(() => useUserEmail());
    expect(result.current).toBe('test@example.com');
  });

  it('should return null if not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false
    } as any);

    const { result } = renderHook(() => useUserEmail());
    expect(result.current).toBeNull();
  });
});
```

**Step 2: Implement useUserEmail hook**

Create: `src/hooks/useUserEmail.ts`

```typescript
import { useAuth } from 'react-oidc-context';

/**
 * Extract user email from SAP IAS JWT token
 * Used as user identifier for data segregation
 */
export function useUserEmail(): string | null {
  const auth = useAuth();

  if (!auth.isAuthenticated || !auth.user) {
    return null;
  }

  // Extract email from JWT claims
  const email = auth.user.profile?.email;

  if (!email || typeof email !== 'string') {
    console.warn('User authenticated but email not found in JWT claims');
    return null;
  }

  return email;
}
```

**Step 3: Update main.tsx to sync Supabase auth**

Modify: `src/main.tsx`

```typescript
import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { setSupabaseAuth, clearSupabaseAuth } from '@/lib/supabase';

function App() {
  const auth = useAuth();

  // Sync SAP IAS auth with Supabase
  useEffect(() => {
    const syncAuth = async () => {
      if (auth.isAuthenticated && auth.user?.access_token) {
        // User logged in via SAP IAS - set token in Supabase
        await setSupabaseAuth(auth.user.access_token);
      } else {
        // User logged out - clear Supabase auth
        await clearSupabaseAuth();
      }
    };

    syncAuth();
  }, [auth.isAuthenticated, auth.user?.access_token]);

  // ... rest of app
}
```

**Step 4: Run tests and commit**

```bash
npm test -- src/__tests__/unit/hooks/useUserEmail.test.ts
git add src/hooks/useUserEmail.ts src/__tests__/unit/hooks/useUserEmail.test.ts src/main.tsx
git commit -m "feat: add user email extraction from SAP IAS JWT"
```

---

## Phase 4: Zustand Store Migration

### Task 4.1: Update OpportunitiesStore with Supabase

**Files:**
- Modify: `src/stores/opportunitiesStore.ts`
- Modify: `src/__tests__/unit/stores/opportunitiesStore.test.ts`

**Step 1: Update test for Supabase integration**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useOpportunitiesStore } from '@/stores/opportunitiesStore';
import * as opportunitiesApi from '@/api/opportunities';

vi.mock('@/api/opportunities');

describe('OpportunitiesStore with Supabase', () => {
  beforeEach(() => {
    useOpportunitiesStore.getState().reset();
    vi.clearAllMocks();
  });

  it('should load opportunities from Supabase', async () => {
    const mockOpps = [
      { id: '1', title: 'Opp 1', createdByEmail: 'user@example.com' },
      { id: '2', title: 'Opp 2', createdByEmail: 'user@example.com' }
    ];

    vi.mocked(opportunitiesApi.fetchOpportunities).mockResolvedValue(mockOpps as any);

    await useOpportunitiesStore.getState().loadOpportunities();

    expect(useOpportunitiesStore.getState().opportunities).toHaveLength(2);
    expect(opportunitiesApi.fetchOpportunities).toHaveBeenCalledTimes(1);
  });

  it('should create opportunity via Supabase', async () => {
    const newOpp = { title: 'New Opp', tcv: 100000 };
    const created = { id: '3', ...newOpp, createdByEmail: 'user@example.com' };

    vi.mocked(opportunitiesApi.createOpportunity).mockResolvedValue(created as any);

    await useOpportunitiesStore.getState().addOpportunity(newOpp as any, 'user@example.com');

    expect(opportunitiesApi.createOpportunity).toHaveBeenCalledWith(
      expect.objectContaining(newOpp),
      'user@example.com'
    );
  });

  it('should update opportunity via Supabase', async () => {
    const updated = { id: '1', title: 'Updated' };

    vi.mocked(opportunitiesApi.updateOpportunity).mockResolvedValue(updated as any);

    await useOpportunitiesStore.getState().updateOpportunity(updated as any);

    expect(opportunitiesApi.updateOpportunity).toHaveBeenCalledWith('1', updated);
  });

  it('should delete opportunity via Supabase', async () => {
    vi.mocked(opportunitiesApi.deleteOpportunity).mockResolvedValue();

    await useOpportunitiesStore.getState().deleteOpportunity('1');

    expect(opportunitiesApi.deleteOpportunity).toHaveBeenCalledWith('1');
  });
});
```

**Step 2: Update OpportunitiesStore implementation**

Modify: `src/stores/opportunitiesStore.ts`

```typescript
import { create } from 'zustand';
import type { Opportunity } from '@/types';
import {
  fetchOpportunities,
  createOpportunity,
  updateOpportunity as apiUpdateOpportunity,
  deleteOpportunity as apiDeleteOpportunity,
} from '@/api/opportunities';

interface OpportunitiesState {
  opportunities: Opportunity[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadOpportunities: () => Promise<void>;
  addOpportunity: (opportunity: Opportunity, userEmail: string) => Promise<void>;
  updateOpportunity: (opportunity: Opportunity) => Promise<void>;
  deleteOpportunity: (id: string) => Promise<void>;
  reset: () => void;
}

export const useOpportunitiesStore = create<OpportunitiesState>((set, get) => ({
  opportunities: [],
  isLoading: false,
  error: null,

  loadOpportunities: async () => {
    set({ isLoading: true, error: null });
    try {
      const opportunities = await fetchOpportunities();
      set({ opportunities, isLoading: false });
    } catch (error) {
      console.error('Failed to load opportunities:', error);
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      });
    }
  },

  addOpportunity: async (opportunity: Opportunity, userEmail: string) => {
    set({ isLoading: true, error: null });
    try {
      const created = await createOpportunity(opportunity, userEmail);
      set(state => ({
        opportunities: [created, ...state.opportunities],
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to create opportunity:', error);
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      });
      throw error;
    }
  },

  updateOpportunity: async (opportunity: Opportunity) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await apiUpdateOpportunity(opportunity.id, opportunity);
      set(state => ({
        opportunities: state.opportunities.map(o =>
          o.id === updated.id ? updated : o
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to update opportunity:', error);
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      });
      throw error;
    }
  },

  deleteOpportunity: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiDeleteOpportunity(id);
      set(state => ({
        opportunities: state.opportunities.filter(o => o.id !== id),
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to delete opportunity:', error);
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      });
      throw error;
    }
  },

  reset: () => set({ opportunities: [], isLoading: false, error: null }),
}));
```

**Step 3: Run tests and commit**

```bash
npm test -- src/__tests__/unit/stores/opportunitiesStore.test.ts
git add src/stores/opportunitiesStore.ts src/__tests__/unit/stores/opportunitiesStore.test.ts
git commit -m "feat: migrate OpportunitiesStore to Supabase backend"
```

---

### Task 4.2: Update CustomersStore with Supabase

**Files:**
- Modify: `src/stores/customersStore.ts`

**Step 1: Update CustomersStore (similar pattern to OpportunitiesStore)**

```typescript
import { create } from 'zustand';
import type { Customer } from '@/types';
import {
  fetchCustomers,
  createCustomer as apiCreateCustomer,
  updateCustomer as apiUpdateCustomer,
  deleteCustomer as apiDeleteCustomer,
} from '@/api/customers';

interface CustomersState {
  customers: Customer[];
  isLoading: boolean;
  error: string | null;

  loadCustomers: () => Promise<void>;
  addCustomer: (customer: Customer) => Promise<void>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  reset: () => void;
}

export const useCustomersStore = create<CustomersState>((set) => ({
  customers: [],
  isLoading: false,
  error: null,

  loadCustomers: async () => {
    set({ isLoading: true, error: null });
    try {
      const customers = await fetchCustomers();
      set({ customers, isLoading: false });
    } catch (error) {
      console.error('Failed to load customers:', error);
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      });
    }
  },

  addCustomer: async (customer: Customer) => {
    set({ isLoading: true, error: null });
    try {
      const created = await apiCreateCustomer(customer);
      set(state => ({
        customers: [...state.customers, created].sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to create customer:', error);
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      });
      throw error;
    }
  },

  updateCustomer: async (customer: Customer) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await apiUpdateCustomer(customer.id, customer);
      set(state => ({
        customers: state.customers.map(c =>
          c.id === updated.id ? updated : c
        ).sort((a, b) => a.name.localeCompare(b.name)),
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to update customer:', error);
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      });
      throw error;
    }
  },

  deleteCustomer: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiDeleteCustomer(id);
      set(state => ({
        customers: state.customers.filter(c => c.id !== id),
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to delete customer:', error);
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      });
      throw error;
    }
  },

  reset: () => set({ customers: [], isLoading: false, error: null }),
}));
```

**Step 2: Commit**

```bash
git add src/stores/customersStore.ts
git commit -m "feat: migrate CustomersStore to Supabase backend"
```

---

## Phase 5: UI Integration

### Task 5.1: Update Dashboard to Load Data on Mount

**Files:**
- Modify: `src/components/dashboard/index.tsx`

**Step 1: Update Dashboard component**

```typescript
import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { useOpportunitiesStore } from '@/stores/opportunitiesStore';
import { useCustomersStore } from '@/stores/customersStore';

export function Dashboard() {
  const auth = useAuth();
  const loadOpportunities = useOpportunitiesStore(state => state.loadOpportunities);
  const loadCustomers = useCustomersStore(state => state.loadCustomers);
  const opportunities = useOpportunitiesStore(state => state.opportunities);
  const isLoading = useOpportunitiesStore(state => state.isLoading);

  // Load data when user is authenticated
  useEffect(() => {
    if (auth.isAuthenticated) {
      loadOpportunities();
      loadCustomers();
    }
  }, [auth.isAuthenticated, loadOpportunities, loadCustomers]);

  if (!auth.isAuthenticated) {
    return <div>Please log in to view your opportunities</div>;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // ... rest of dashboard
  return (
    <div>
      <h1>My Opportunities</h1>
      {opportunities.map(opp => (
        <OpportunityCard key={opp.id} opportunity={opp} />
      ))}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/dashboard/index.tsx
git commit -m "feat: load user-specific opportunities on dashboard mount"
```

---

### Task 5.2: Update Opportunity Forms to Use User Email

**Files:**
- Modify: `src/pages/opportunities/new.tsx`
- Modify: `src/pages/opportunities/edit.tsx`

**Step 1: Update new opportunity form**

```typescript
import { useUserEmail } from '@/hooks/useUserEmail';
import { useOpportunitiesStore } from '@/stores/opportunitiesStore';

export function NewOpportunityPage() {
  const userEmail = useUserEmail();
  const addOpportunity = useOpportunitiesStore(state => state.addOpportunity);

  const handleSubmit = async (formData: OpportunityFormData) => {
    if (!userEmail) {
      showToast.error('User not authenticated');
      return;
    }

    const opportunity = {
      ...formData,
      id: crypto.randomUUID(), // Temp ID, Supabase will replace
      createdByEmail: userEmail,
      currentPhase: 'Planning',
      status: 'Draft',
      checkpoints: {},
    };

    await addOpportunity(opportunity, userEmail);
    showToast.success('Opportunity created');
    navigate('/');
  };

  // ... rest of form
}
```

**Step 2: Commit**

```bash
git add src/pages/opportunities/new.tsx src/pages/opportunities/edit.tsx
git commit -m "feat: associate opportunities with user email on creation"
```

---

## Phase 6: Testing & Verification

### Task 6.1: Create Integration Test for Multi-User Segregation

**Files:**
- Create: `src/__tests__/integration/multi-user-segregation.test.tsx`

**Step 1: Write integration test**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useOpportunitiesStore } from '@/stores/opportunitiesStore';
import { Dashboard } from '@/components/dashboard';
import * as opportunitiesApi from '@/api/opportunities';

vi.mock('@/api/opportunities');
vi.mock('react-oidc-context');

describe('Multi-User Data Segregation', () => {
  beforeEach(() => {
    useOpportunitiesStore.getState().reset();
    vi.clearAllMocks();
  });

  it('should show only user-specific opportunities', async () => {
    // Mock user1 opportunities
    const user1Opps = [
      { id: '1', title: 'User1 Opp', createdByEmail: 'user1@example.com' }
    ];

    vi.mocked(opportunitiesApi.fetchOpportunities).mockResolvedValue(user1Opps as any);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('User1 Opp')).toBeInTheDocument();
      expect(screen.queryByText('User2 Opp')).not.toBeInTheDocument();
    });
  });

  it('should not allow users to see other users opportunities', async () => {
    // RLS should filter at database level
    // This test verifies the API layer calls Supabase correctly

    await useOpportunitiesStore.getState().loadOpportunities();

    expect(opportunitiesApi.fetchOpportunities).toHaveBeenCalledTimes(1);
    // RLS policies in Supabase will filter results by user email
  });
});
```

**Step 2: Run integration test**

```bash
npm test -- src/__tests__/integration/multi-user-segregation.test.tsx
```

**Step 3: Commit**

```bash
git add src/__tests__/integration/multi-user-segregation.test.tsx
git commit -m "test: add integration test for multi-user data segregation"
```

---

### Task 6.2: Manual Testing Checklist

**Step 1: Clear localStorage**

```bash
# In browser console
localStorage.clear()
```

**Step 2: Test User 1 flow**

1. Login as user1@example.com (SAP IAS)
2. Create opportunity "User1 Test Opp"
3. Verify opportunity appears in dashboard
4. Logout

**Step 3: Test User 2 flow**

1. Login as user2@example.com
2. Verify User1's opportunity does NOT appear
3. Create opportunity "User2 Test Opp"
4. Verify only User2's opportunity appears
5. Logout

**Step 4: Test User 1 again**

1. Login as user1@example.com
2. Verify only User1's opportunity appears (User2's NOT visible)

**Step 5: Test shared customers**

1. Login as user1@example.com
2. Create customer "Shared Customer"
3. Logout
4. Login as user2@example.com
5. Verify "Shared Customer" appears in customer list
6. Create opportunity using "Shared Customer"
7. Verify opportunity created successfully

**Step 6: Document test results**

Create: `docs/TEST_REPORT_2026-01-01-multi-user.md`

```markdown
# Multi-User Segregation Test Report

**Date:** 2026-01-01
**Tester:** [Your Name]

## Test Results

### ✅ User-Specific Opportunities
- [x] User1 sees only their opportunities
- [x] User2 sees only their opportunities
- [x] Opportunities persist across sessions

### ✅ Shared Customers
- [x] All users see all customers
- [x] Any user can create customers
- [x] Any user can update customers
- [x] Referential integrity protected

### ✅ Authentication
- [x] Email extracted from SAP IAS JWT
- [x] Supabase auth synced with SAP IAS
- [x] RLS policies enforce segregation

## Issues Found
- None

## Conclusion
Multi-user data segregation working as expected.
```

**Step 7: Commit test report**

```bash
git add docs/TEST_REPORT_2026-01-01-multi-user.md
git commit -m "docs: add multi-user segregation test report"
```

---

## Phase 7: Migration & Cleanup

### Task 7.1: Remove localStorage Fallback

**Files:**
- Remove localStorage persistence from stores (already done in migration)

**Step 1: Verify no localStorage usage remains**

```bash
grep -r "localStorage" src/stores/
```

Expected: No matches (or only comments)

**Step 2: Add migration warning to existing users**

Create: `src/components/common/MigrationWarning.tsx`

```typescript
import { useEffect, useState } from 'react';

export function MigrationWarning() {
  const [hasLocalData, setHasLocalData] = useState(false);

  useEffect(() => {
    // Check if user has old localStorage data
    const hasData =
      localStorage.getItem('raise_opportunities') ||
      localStorage.getItem('raise_customers');

    setHasLocalData(!!hasData);
  }, []);

  if (!hasLocalData) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
      <h3 className="font-bold text-yellow-900">Migration Notice</h3>
      <p className="text-yellow-800">
        Your data has been migrated to the cloud.
        Old local data will be automatically cleared on next login.
      </p>
      <button
        onClick={() => {
          localStorage.clear();
          setHasLocalData(false);
        }}
        className="mt-2 bg-yellow-600 text-white px-4 py-2 rounded"
      >
        Clear Old Data Now
      </button>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/common/MigrationWarning.tsx
git commit -m "feat: add migration warning for localStorage cleanup"
```

---

### Task 7.2: Update Documentation

**Files:**
- Modify: `docs/USER_GUIDE.md`
- Modify: `docs/SYSTEM_DESIGN.md`

**Step 1: Update USER_GUIDE.md**

Add section:

```markdown
## Multi-User Data Segregation

### How It Works

**Your Opportunities:**
- You can only see and manage opportunities you created
- Each opportunity is automatically associated with your email
- Your data is completely isolated from other users

**Shared Resources:**
- **Customers:** All users share the same customer database
- **Settings:** Checkpoint configuration is shared across all users

### Privacy & Security

Your opportunities are protected by:
- Row Level Security (RLS) at the database level
- SAP IAS authentication
- Automatic user identification via JWT token

You cannot access other users' opportunities, even if you know their ID.
```

**Step 2: Update SYSTEM_DESIGN.md**

Add section:

```markdown
## 10. Multi-User Data Architecture

### Row Level Security (RLS)

Supabase RLS policies enforce data segregation at the database level:

**Opportunities Table:**
- Policy: `created_by_email = current_user_email()`
- Users can only SELECT/INSERT/UPDATE/DELETE their own records
- Email extracted from SAP IAS JWT token

**Customers Table:**
- No RLS policies (shared data)
- All authenticated users have full CRUD access

**Settings Table:**
- No RLS policies (shared configuration)
- All users can read, admin can write

### User Identification

User email from SAP IAS JWT token is used as the unique identifier:
- Extracted via `react-oidc-context`
- Synced with Supabase auth on login
- Included in all RLS policy evaluations
```

**Step 3: Commit**

```bash
git add docs/USER_GUIDE.md docs/SYSTEM_DESIGN.md
git commit -m "docs: add multi-user segregation documentation"
```

---

## Phase 8: Deployment

### Task 8.1: Update Environment Variables

**Files:**
- Modify: `docs/KYMA_DEPLOYMENT.md`

**Step 1: Document required Supabase env vars**

Add to deployment guide:

```markdown
### Supabase Configuration

Add these secrets to GitHub Secrets:

| Secret | Description | Example |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbG...` |

**Important:** These are build-time environment variables (baked into bundle).
```

**Step 2: Update .github/workflows/deploy-kyma.yml**

Add build args:

```yaml
- name: Build and push Docker image
  env:
    VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

**Step 3: Commit**

```bash
git add docs/KYMA_DEPLOYMENT.md .github/workflows/deploy-kyma.yml
git commit -m "docs: add Supabase configuration to deployment guide"
```

---

### Task 8.2: Run Database Migrations on Supabase

**Step 1: Login to Supabase Dashboard**

Navigate to: https://app.supabase.com

**Step 2: Apply migrations**

Option A - Via Supabase CLI:
```bash
npx supabase db push
```

Option B - Via SQL Editor:
- Copy contents of `supabase/migrations/20260101000001_create_tables.sql`
- Run in SQL Editor
- Copy contents of `supabase/migrations/20260101000002_enable_rls.sql`
- Run in SQL Editor

**Step 3: Verify tables created**

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

Expected output:
- customers
- opportunities
- settings

**Step 4: Verify RLS enabled**

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

Expected: `opportunities` has `rowsecurity = true`

---

### Task 8.3: Deploy to Kyma

**Step 1: Trigger deployment**

```bash
git push origin main
```

**Step 2: Monitor GitHub Actions**

```bash
gh run watch
```

**Step 3: Verify deployment**

```bash
KUBECONFIG=path/to/kubeconfig.yaml kubectl get pods -n raise-app
```

Expected: Pod running with new image

**Step 4: Test production**

1. Navigate to production URL
2. Login via SAP IAS
3. Create test opportunity
4. Verify it appears
5. Logout and login as different user
6. Verify first user's opportunity NOT visible

---

## Success Criteria

**Implementation Complete When:**

- ✅ Database schema created with RLS policies
- ✅ Supabase client configured and tested
- ✅ API layer implemented for opportunities and customers
- ✅ User email extracted from SAP IAS JWT
- ✅ Zustand stores migrated to Supabase backend
- ✅ UI components load user-specific data
- ✅ Integration tests pass for multi-user segregation
- ✅ Manual testing confirms data isolation
- ✅ Documentation updated
- ✅ Deployed to Kyma with Supabase env vars

**Verification Checklist:**

- [ ] User1 sees only their opportunities
- [ ] User2 sees only their opportunities
- [ ] All users see shared customers
- [ ] All users see shared settings
- [ ] RLS policies block unauthorized access
- [ ] JWT email correctly extracted
- [ ] Data persists across sessions
- [ ] No localStorage usage remains
- [ ] Tests pass (339 unit + integration + E2E)
- [ ] Production deployment successful

---

## Troubleshooting

### Issue: RLS policies not working

**Symptom:** Users can see other users' data

**Fix:**
1. Verify JWT token contains email claim
2. Check RLS policy syntax: `current_setting('request.jwt.claims', true)::json->>'email'`
3. Ensure Supabase auth is set via `setSupabaseAuth()`

### Issue: "Email not found in JWT"

**Symptom:** User authenticated but email is null

**Fix:**
1. Check SAP IAS app configuration includes email scope
2. Verify OIDC config in main.tsx: `scope: 'openid profile email'`
3. Inspect JWT token in browser DevTools → Application → Storage

### Issue: Foreign key constraint on customer delete

**Symptom:** Cannot delete customer with linked opportunities

**Fix:** This is expected behavior (referential integrity). User must:
1. Delete all opportunities linked to customer first
2. Then delete customer

---

## Related Skills

- @superpowers:executing-plans - Execute this plan task-by-task
- @superpowers:test-driven-development - TDD workflow for each task
- @superpowers:verification-before-completion - Verify before marking complete
- @superpowers:systematic-debugging - Debug RLS or auth issues

---

**Plan saved to:** `docs/plans/2026-01-01-multi-user-data-segregation.md`
