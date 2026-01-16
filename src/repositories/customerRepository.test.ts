import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomerRepository } from './customerRepository';

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
      const mockCustomers = [{ id: 'cust-1', name: 'Test Corp', industry: 'Technology', isPublicSector: false }];
      localStorage.setItem('raise_customers', JSON.stringify(mockCustomers));

      const result = await repo.findAll();
      expect(result).toEqual(mockCustomers);
    });

    it('should return empty array when localStorage is empty', async () => {
      localStorage.setItem('testMode', 'true');

      const result = await repo.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('create (test mode)', () => {
    it('should create customer in localStorage', async () => {
      localStorage.setItem('testMode', 'true');
      localStorage.setItem('raise_customers', '[]');

      const newCustomer = {
        id: 'cust-new',
        name: 'New Corp',
        industry: 'Finance' as const,
        isPublicSector: false
      };
      const result = await repo.create(newCustomer as any);

      expect(result.id).toBe('cust-new');
      expect(result.name).toBe('New Corp');
      const stored = JSON.parse(localStorage.getItem('raise_customers') || '[]');
      expect(stored.length).toBe(1);
      expect(stored[0].id).toBe('cust-new');
    });

    it('should append to existing customers in localStorage', async () => {
      localStorage.setItem('testMode', 'true');
      const existingCustomers = [
        { id: 'cust-1', name: 'Existing Corp', industry: 'Technology', isPublicSector: false }
      ];
      localStorage.setItem('raise_customers', JSON.stringify(existingCustomers));

      const newCustomer = {
        id: 'cust-2',
        name: 'Second Corp',
        industry: 'Healthcare' as const,
        isPublicSector: true
      };
      await repo.create(newCustomer as any);

      const stored = JSON.parse(localStorage.getItem('raise_customers') || '[]');
      expect(stored.length).toBe(2);
      expect(stored[1].id).toBe('cust-2');
    });
  });
});
