import { getSupabaseClient } from '@/lib/supabase';
import type { Customer, Industry } from '@/types';
import type { Database } from '@/lib/database.types';

type CustomerRow = Database['public']['Tables']['customers']['Row'];
type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

function mapToCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    industry: row.industry as Industry,
    isPublicSector: row.is_public_sector,
  };
}

/**
 * Fetch all customers (shared across all users)
 */
export async function fetchCustomers(): Promise<Customer[]> {
  // E2E TEST MODE: Read from localStorage instead of Supabase
  if (typeof window !== 'undefined' && localStorage.getItem('testMode') === 'true') {
    const stored = localStorage.getItem('raise_customers');
    if (stored) {
      try {
        const customers = JSON.parse(stored) as Customer[];
        return customers;
      } catch (e) {
        console.error('[TEST MODE] Failed to parse customers from localStorage', e);
      }
    }
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
    .from('customers')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching customers:', error);
    throw new Error(`Failed to fetch customers: ${error.message}`);
  }

  return ((data as CustomerRow[]) || []).map(mapToCustomer);
}

/**
 * Create new customer (any user can create)
 */
export async function createCustomer(customer: Customer): Promise<Customer> {
  // E2E TEST MODE: Save to localStorage instead of Supabase
  if (typeof window !== 'undefined' && localStorage.getItem('testMode') === 'true') {
    const stored = localStorage.getItem('raise_customers');
    const customers = stored ? JSON.parse(stored) as Customer[] : [];
    customers.push(customer);
    localStorage.setItem('raise_customers', JSON.stringify(customers));
    return customer;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseClient() as any;

  if (!supabase) {
    throw new Error('Supabase not configured');
  }

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

  return mapToCustomer(data as CustomerRow);
}

/**
 * Update customer (any user can update shared data)
 */
export async function updateCustomer(
  id: string,
  updates: Partial<Customer>
): Promise<Customer> {
  // E2E TEST MODE: Update in localStorage instead of Supabase
  if (typeof window !== 'undefined' && localStorage.getItem('testMode') === 'true') {
    const stored = localStorage.getItem('raise_customers');
    const customers = stored ? JSON.parse(stored) as Customer[] : [];
    const index = customers.findIndex(c => c.id === id);
    if (index !== -1) {
      customers[index] = { ...customers[index], ...updates };
      localStorage.setItem('raise_customers', JSON.stringify(customers));
      return customers[index];
    }
    throw new Error(`Customer ${id} not found in localStorage`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseClient() as any;

  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const update: Partial<CustomerUpdate> = {
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

  return mapToCustomer(data as CustomerRow);
}

/**
 * Delete customer (with referential integrity check)
 */
export async function deleteCustomer(id: string): Promise<void> {
  // E2E TEST MODE: Delete from localStorage instead of Supabase
  if (typeof window !== 'undefined' && localStorage.getItem('testMode') === 'true') {
    const stored = localStorage.getItem('raise_customers');
    const customers = stored ? JSON.parse(stored) as Customer[] : [];
    const filtered = customers.filter(c => c.id !== id);
    localStorage.setItem('raise_customers', JSON.stringify(filtered));
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseClient() as any;

  if (!supabase) {
    throw new Error('Supabase not configured');
  }

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
