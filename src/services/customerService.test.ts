/**
 * CustomerService Tests
 * Tests CRUD operations for customers with localStorage fallback
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  isUsingSupabase,
} from './customerService';
import type { Customer, Industry } from '../types';

// Mock supabase module
vi.mock('../lib/supabase', () => ({
  supabase: null,
  isSupabaseConfigured: () => false,
}));

const STORAGE_KEY = 'raise_customers';

const createMockCustomer = (overrides: Partial<Customer> = {}): Customer => ({
  id: 'cust-123',
  name: 'Test Customer',
  industry: 'Technology' as Industry,
  isPublicSector: false,
  ...overrides,
});

describe('CustomerService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('isUsingSupabase', () => {
    it('should return false when Supabase is not configured', () => {
      expect(isUsingSupabase()).toBe(false);
    });
  });

  describe('getCustomers - localStorage fallback', () => {
    it('should return empty array when no customers exist', async () => {
      const customers = await getCustomers();
      expect(customers).toEqual([]);
    });

    it('should return customers from localStorage', async () => {
      const mockCustomer = createMockCustomer();
      localStorage.setItem(STORAGE_KEY, JSON.stringify([mockCustomer]));

      const customers = await getCustomers();
      expect(customers).toHaveLength(1);
      expect(customers[0].id).toBe(mockCustomer.id);
      expect(customers[0].name).toBe(mockCustomer.name);
    });

    it('should return multiple customers', async () => {
      const mockCustomers = [
        createMockCustomer({ id: 'cust-1', name: 'Customer 1' }),
        createMockCustomer({ id: 'cust-2', name: 'Customer 2' }),
        createMockCustomer({ id: 'cust-3', name: 'Customer 3' }),
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockCustomers));

      const customers = await getCustomers();
      expect(customers).toHaveLength(3);
    });

    it('should preserve industry field', async () => {
      const mockCustomer = createMockCustomer({ industry: 'Finance' as Industry });
      localStorage.setItem(STORAGE_KEY, JSON.stringify([mockCustomer]));

      const customers = await getCustomers();
      expect(customers[0].industry).toBe('Finance');
    });

    it('should preserve isPublicSector field', async () => {
      const mockCustomer = createMockCustomer({ isPublicSector: true });
      localStorage.setItem(STORAGE_KEY, JSON.stringify([mockCustomer]));

      const customers = await getCustomers();
      expect(customers[0].isPublicSector).toBe(true);
    });
  });

  describe('getCustomer - localStorage fallback', () => {
    it('should return null when customer not found', async () => {
      const customer = await getCustomer('non-existent');
      expect(customer).toBeNull();
    });

    it('should return the correct customer by ID', async () => {
      const mockCustomers = [
        createMockCustomer({ id: 'cust-1', name: 'Customer 1' }),
        createMockCustomer({ id: 'cust-2', name: 'Customer 2' }),
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockCustomers));

      const customer = await getCustomer('cust-2');
      expect(customer).not.toBeNull();
      expect(customer?.id).toBe('cust-2');
      expect(customer?.name).toBe('Customer 2');
    });

    it('should return null from empty localStorage', async () => {
      const customer = await getCustomer('cust-1');
      expect(customer).toBeNull();
    });
  });

  describe('createCustomer - localStorage fallback', () => {
    it('should create a new customer with generated ID', async () => {
      const newCustomer = { name: 'New Customer', industry: 'Technology' as Industry, isPublicSector: false };

      const created = await createCustomer(newCustomer);
      expect(created.name).toBe('New Customer');
      expect(created.id).toBeDefined();
      expect(typeof created.id).toBe('string');
      expect(created.id.length).toBeGreaterThan(0);
    });

    it('should add to existing customers', async () => {
      const existingCustomer = createMockCustomer({ id: 'existing', name: 'Existing' });
      localStorage.setItem(STORAGE_KEY, JSON.stringify([existingCustomer]));

      const newCustomer = { name: 'New', industry: 'Finance' as Industry, isPublicSector: true };
      await createCustomer(newCustomer);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored).toHaveLength(2);
    });

    it('should preserve customer properties', async () => {
      const newCustomer = {
        name: 'Property Test',
        industry: 'Healthcare' as Industry,
        isPublicSector: true,
      };

      const created = await createCustomer(newCustomer);
      expect(created.name).toBe('Property Test');
      expect(created.industry).toBe('Healthcare');
      expect(created.isPublicSector).toBe(true);
    });
  });

  describe('updateCustomer - localStorage fallback', () => {
    it('should update an existing customer', async () => {
      const original = createMockCustomer({ id: 'update-test', name: 'Original' });
      localStorage.setItem(STORAGE_KEY, JSON.stringify([original]));

      const updated = { ...original, name: 'Updated Name' };
      const result = await updateCustomer(updated);

      expect(result.name).toBe('Updated Name');

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored[0].name).toBe('Updated Name');
    });

    it('should throw error when customer not found', async () => {
      const nonExistent = createMockCustomer({ id: 'non-existent' });

      await expect(updateCustomer(nonExistent)).rejects.toThrow('Customer not found');
    });

    it('should update industry correctly', async () => {
      const original = createMockCustomer({
        id: 'industry-test',
        industry: 'Technology' as Industry
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify([original]));

      const updated = { ...original, industry: 'Finance' as Industry };
      await updateCustomer(updated);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored[0].industry).toBe('Finance');
    });

    it('should update isPublicSector flag', async () => {
      const original = createMockCustomer({
        id: 'public-test',
        isPublicSector: false
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify([original]));

      const updated = { ...original, isPublicSector: true };
      await updateCustomer(updated);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored[0].isPublicSector).toBe(true);
    });
  });

  describe('deleteCustomer - localStorage fallback', () => {
    it('should delete an existing customer', async () => {
      const mockCustomers = [
        createMockCustomer({ id: 'cust-1' }),
        createMockCustomer({ id: 'cust-2' }),
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockCustomers));

      await deleteCustomer('cust-1');

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe('cust-2');
    });

    it('should handle deletion of non-existent customer gracefully', async () => {
      const mockCustomer = createMockCustomer({ id: 'cust-1' });
      localStorage.setItem(STORAGE_KEY, JSON.stringify([mockCustomer]));

      // Should not throw
      await deleteCustomer('non-existent');

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored).toHaveLength(1);
    });

    it('should handle deletion from empty localStorage', async () => {
      // Should not throw
      await deleteCustomer('any-id');

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored).toHaveLength(0);
    });
  });

  describe('Complex scenarios', () => {
    it('should handle CRUD lifecycle', async () => {
      // Create
      const newCustomer = { name: 'Lifecycle Test', industry: 'Technology' as Industry, isPublicSector: false };
      const created = await createCustomer(newCustomer);

      // Read
      const retrieved = await getCustomer(created.id);
      expect(retrieved?.name).toBe('Lifecycle Test');

      // Update
      const updated = { ...created, name: 'Updated Lifecycle' };
      await updateCustomer(updated);

      const retrievedAfterUpdate = await getCustomer(created.id);
      expect(retrievedAfterUpdate?.name).toBe('Updated Lifecycle');

      // Delete
      await deleteCustomer(created.id);
      const retrievedAfterDelete = await getCustomer(created.id);
      expect(retrievedAfterDelete).toBeNull();
    });

    it('should handle multiple industries', async () => {
      const industries: Industry[] = ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail'];

      for (const industry of industries) {
        await createCustomer({ name: `${industry} Customer`, industry, isPublicSector: false });
      }

      const customers = await getCustomers();
      expect(customers).toHaveLength(5);

      const industrySet = new Set(customers.map(c => c.industry));
      expect(industrySet.size).toBe(5);
    });

    it('should handle public and private sector mix', async () => {
      await createCustomer({ name: 'Public 1', industry: 'Technology' as Industry, isPublicSector: true });
      await createCustomer({ name: 'Private 1', industry: 'Finance' as Industry, isPublicSector: false });
      await createCustomer({ name: 'Public 2', industry: 'Healthcare' as Industry, isPublicSector: true });

      const customers = await getCustomers();
      const publicSector = customers.filter(c => c.isPublicSector);
      const privateSector = customers.filter(c => !c.isPublicSector);

      expect(publicSector).toHaveLength(2);
      expect(privateSector).toHaveLength(1);
    });
  });
});
