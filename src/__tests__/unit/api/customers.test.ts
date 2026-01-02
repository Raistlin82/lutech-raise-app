import { describe, it, expect, vi } from 'vitest';
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer } from '@/api/customers';
import type { Customer } from '@/types';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [],
          error: null
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'test-id', name: 'Test Corp', industry: 'Technology', is_public_sector: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: 'test-id', name: 'Updated Corp', industry: 'Technology', is_public_sector: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
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
