import { getSupabaseClient } from '@/lib/supabase';
import type { Customer, Industry } from '@/types';
import type { Database } from '@/types/supabase';

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
  const supabase = getSupabaseClient();

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

  return (data || []).map(mapToCustomer);
}

/**
 * Create new customer (any user can create)
 */
export async function createCustomer(customer: Customer): Promise<Customer> {
  const supabase = getSupabaseClient();

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
    .insert(insert as any)
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
    // @ts-expect-error - Supabase generated types issue
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
