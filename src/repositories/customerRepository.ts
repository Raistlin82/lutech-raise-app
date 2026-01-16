import type { Customer } from '@/types';
import type { Database } from '@/lib/database.types';
import { isTestMode, getTypedClient, RepositoryError } from './baseRepository';

type CustomerRow = Database['public']['Tables']['customers']['Row'];
type CustomerInsert = Database['public']['Tables']['customers']['Insert'];

/**
 * Map database row to domain model
 */
function mapRowToCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    industry: row.industry as Customer['industry'],
    isPublicSector: row.is_public_sector,
  };
}

/**
 * Map domain model to database insert
 */
function mapCustomerToInsert(customer: Customer): CustomerInsert {
  return {
    id: customer.id,
    name: customer.name,
    industry: customer.industry,
    is_public_sector: customer.isPublicSector,
  };
}

const STORAGE_KEY = 'raise_customers';

/**
 * Repository for Customer CRUD operations
 * Handles both Supabase and localStorage fallback
 */
export class CustomerRepository {
  /**
   * Find all customers
   */
  async findAll(): Promise<Customer[]> {
    if (isTestMode()) {
      return this.findAllFromLocalStorage();
    }

    const client = getTypedClient();
    if (!client) {
      console.warn('[CustomerRepository] Supabase not configured, returning empty');
      return [];
    }

    const { data, error } = await client
      .from('customers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new RepositoryError(
        `Failed to fetch customers: ${error.message}`,
        'findAll',
        error
      );
    }

    return (data || []).map(mapRowToCustomer);
  }

  /**
   * Find customer by ID
   */
  async findById(id: string): Promise<Customer | null> {
    if (isTestMode()) {
      const all = await this.findAllFromLocalStorage();
      return all.find(c => c.id === id) || null;
    }

    const client = getTypedClient();
    if (!client) {
      return null;
    }

    // Note: Client cast needed for TypeScript generic inference
    const { data, error } = await (client as any)
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new RepositoryError(
        `Failed to fetch customer: ${error.message}`,
        'findById',
        error
      );
    }

    return data ? mapRowToCustomer(data) : null;
  }

  /**
   * Create new customer
   */
  async create(customer: Customer): Promise<Customer> {
    if (isTestMode()) {
      return this.createInLocalStorage(customer);
    }

    const client = getTypedClient();
    if (!client) {
      throw new RepositoryError('Supabase not configured', 'create');
    }

    const insert = mapCustomerToInsert(customer);

    // Note: We cast the client to 'any' here because TypeScript's type inference
    // struggles with the Supabase generic chain in strict mode, even though
    // the client is properly typed as SupabaseClient<Database>
    // The insert data is type-checked by mapCustomerToInsert()
    const { data, error } = await (client as any)
      .from('customers')
      .insert(insert)
      .select()
      .single();

    if (error) {
      throw new RepositoryError(
        `Failed to create customer: ${error.message}`,
        'create',
        error
      );
    }

    return mapRowToCustomer(data as CustomerRow);
  }

  /**
   * Update existing customer
   */
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

    // Remove undefined values
    Object.keys(dbUpdates).forEach(key => {
      if (dbUpdates[key as keyof typeof dbUpdates] === undefined) {
        delete dbUpdates[key as keyof typeof dbUpdates];
      }
    });

    // Note: Client cast needed for TypeScript generic inference
    const { data, error } = await (client as any)
      .from('customers')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new RepositoryError(
        `Failed to update customer: ${error.message}`,
        'update',
        error
      );
    }

    return mapRowToCustomer(data as CustomerRow);
  }

  /**
   * Delete customer
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
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      throw new RepositoryError(
        `Failed to delete customer: ${error.message}`,
        'delete',
        error
      );
    }
  }

  // ==================== LocalStorage Helpers ====================

  private findAllFromLocalStorage(): Customer[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as Customer[];
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
    if (index === -1) {
      throw new RepositoryError(`Customer not found: ${id}`, 'update');
    }
    all[index] = { ...all[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return all[index];
  }

  private deleteFromLocalStorage(id: string): void {
    const all = this.findAllFromLocalStorage();
    const filtered = all.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
}

/**
 * Singleton instance
 */
export const customerRepository = new CustomerRepository();
