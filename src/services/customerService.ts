/**
 * Customer Service
 * Handles CRUD operations for customers with Supabase/localStorage fallback
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Customer, Industry } from '../types';
import type { Database } from '../lib/database.types';

type CustomerRow = Database['public']['Tables']['customers']['Row'];
type CustomerInsert = Database['public']['Tables']['customers']['Insert'];

const STORAGE_KEY = 'raise_customers';

/**
 * Convert database row to Customer type
 */
function rowToCustomer(row: CustomerRow): Customer {
    return {
        id: row.id,
        name: row.name,
        industry: row.industry as Industry,
        isPublicSector: row.is_public_sector,
    };
}

/**
 * Convert Customer to database insert format
 */
function customerToInsert(customer: Omit<Customer, 'id'> & { id?: string }): CustomerInsert {
    return {
        id: customer.id,
        name: customer.name,
        industry: customer.industry,
        is_public_sector: customer.isPublicSector,
    };
}

/**
 * Get all customers
 */
export async function getCustomers(): Promise<Customer[]> {
    if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('name');

        if (error) {
            console.error('Supabase error fetching customers:', error);
            throw new Error(`Failed to fetch customers: ${error.message}`);
        }

        return (data || []).map(rowToCustomer);
    }

    // Fallback to localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

/**
 * Get a single customer by ID
 */
export async function getCustomer(id: string): Promise<Customer | null> {
    if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            console.error('Supabase error fetching customer:', error);
            throw new Error(`Failed to fetch customer: ${error.message}`);
        }

        return data ? rowToCustomer(data) : null;
    }

    // Fallback to localStorage
    const customers = await getCustomers();
    return customers.find(c => c.id === id) || null;
}

/**
 * Create a new customer
 */
export async function createCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
    const id = crypto.randomUUID();

    if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
            .from('customers')
            .insert(customerToInsert({ ...customer, id }))
            .select()
            .single();

        if (error) {
            console.error('Supabase error creating customer:', error);
            throw new Error(`Failed to create customer: ${error.message}`);
        }

        return rowToCustomer(data);
    }

    // Fallback to localStorage
    const newCustomer: Customer = { ...customer, id };
    const customers = await getCustomers();
    customers.push(newCustomer);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
    return newCustomer;
}

/**
 * Update an existing customer
 */
export async function updateCustomer(customer: Customer): Promise<Customer> {
    if (isSupabaseConfigured() && supabase) {
        const updateData = {
            name: customer.name,
            industry: customer.industry,
            is_public_sector: customer.isPublicSector,
        };
        const { data, error } = await supabase
            .from('customers')
            .update(updateData)
            .eq('id', customer.id)
            .select()
            .single();

        if (error) {
            console.error('Supabase error updating customer:', error);
            throw new Error(`Failed to update customer: ${error.message}`);
        }

        return rowToCustomer(data);
    }

    // Fallback to localStorage
    const customers = await getCustomers();
    const index = customers.findIndex(c => c.id === customer.id);
    if (index === -1) {
        throw new Error('Customer not found');
    }
    customers[index] = customer;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
    return customer;
}

/**
 * Delete a customer
 */
export async function deleteCustomer(id: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Supabase error deleting customer:', error);
            throw new Error(`Failed to delete customer: ${error.message}`);
        }

        return;
    }

    // Fallback to localStorage
    const customers = await getCustomers();
    const filtered = customers.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Check if the service is using Supabase or localStorage
 */
export function isUsingSupabase(): boolean {
    return isSupabaseConfigured();
}
