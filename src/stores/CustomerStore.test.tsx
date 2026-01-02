import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { CustomerProvider, useCustomers } from './CustomerStore';
import type { Customer } from '../types';

// Mock the API layer
vi.mock('@/api/customers', () => ({
  fetchCustomers: vi.fn(),
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
}));

import {
  fetchCustomers,
  createCustomer as apiCreateCustomer,
  updateCustomer as apiUpdateCustomer,
  deleteCustomer as apiDeleteCustomer,
} from '@/api/customers';

describe('CustomerStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetchCustomers to return empty array by default
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fetchCustomers as any).mockResolvedValue([]);
  });

  it('should start with empty customers after loading', async () => {
    const { result } = renderHook(() => useCustomers(), {
      wrapper: CustomerProvider
    });

    // Explicitly trigger load
    await act(async () => {
      await result.current.refreshCustomers();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.customers).toEqual([]);
  });

  it('should add a customer and return the new ID', async () => {
    const { result } = renderHook(() => useCustomers(), {
      wrapper: CustomerProvider
    });

    const newCustomer: Omit<Customer, 'id'> = {
      name: 'Acme Corp',
      industry: 'Technology',
      isPublicSector: false,
    };

    const createdCustomer: Customer = {
      id: 'customer-123',
      name: 'Acme Corp',
      industry: 'Technology',
      isPublicSector: false,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiCreateCustomer as any).mockResolvedValue(createdCustomer);

    let returnedId: string = '';
    await act(async () => {
      returnedId = await result.current.addCustomer(newCustomer);
    });

    expect(apiCreateCustomer).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Acme Corp',
      industry: 'Technology',
      isPublicSector: false,
    }));
    expect(result.current.customers).toHaveLength(1);
    expect(result.current.customers[0].name).toBe('Acme Corp');
    expect(result.current.customers[0].id).toBe('customer-123');
    expect(returnedId).toBe('customer-123');
  });

  it('should update a customer', async () => {
    const { result } = renderHook(() => useCustomers(), {
      wrapper: CustomerProvider
    });

    const newCustomer: Omit<Customer, 'id'> = {
      name: 'Acme Corp',
      industry: 'Technology',
      isPublicSector: false,
    };

    const createdCustomer: Customer = {
      id: 'customer-123',
      name: 'Acme Corp',
      industry: 'Technology',
      isPublicSector: false,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiCreateCustomer as any).mockResolvedValue(createdCustomer);

    let customerId: string = '';
    await act(async () => {
      customerId = await result.current.addCustomer(newCustomer);
    });

    const updatedCustomer: Customer = {
      id: customerId,
      name: 'Acme Corporation',
      industry: 'Finance',
      isPublicSector: true,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiUpdateCustomer as any).mockResolvedValue(updatedCustomer);

    await act(async () => {
      await result.current.updateCustomer(updatedCustomer);
    });

    expect(apiUpdateCustomer).toHaveBeenCalledWith('customer-123', updatedCustomer);
    expect(result.current.customers).toHaveLength(1);
    expect(result.current.customers[0].name).toBe('Acme Corporation');
    expect(result.current.customers[0].industry).toBe('Finance');
    expect(result.current.customers[0].isPublicSector).toBe(true);
  });

  it('should delete a customer', async () => {
    const { result } = renderHook(() => useCustomers(), {
      wrapper: CustomerProvider
    });

    const newCustomer: Omit<Customer, 'id'> = {
      name: 'Acme Corp',
      industry: 'Technology',
      isPublicSector: false,
    };

    const createdCustomer: Customer = {
      id: 'customer-123',
      name: 'Acme Corp',
      industry: 'Technology',
      isPublicSector: false,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiCreateCustomer as any).mockResolvedValue(createdCustomer);

    let customerId: string = '';
    await act(async () => {
      customerId = await result.current.addCustomer(newCustomer);
    });

    expect(result.current.customers).toHaveLength(1);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiDeleteCustomer as any).mockResolvedValue(undefined);

    await act(async () => {
      await result.current.deleteCustomer(customerId);
    });

    expect(apiDeleteCustomer).toHaveBeenCalledWith('customer-123');
    expect(result.current.customers).toHaveLength(0);
  });

  it('should get a customer by id', async () => {
    const { result } = renderHook(() => useCustomers(), {
      wrapper: CustomerProvider
    });

    const newCustomer: Omit<Customer, 'id'> = {
      name: 'Acme Corp',
      industry: 'Technology',
      isPublicSector: false,
    };

    const createdCustomer: Customer = {
      id: 'customer-123',
      name: 'Acme Corp',
      industry: 'Technology',
      isPublicSector: false,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (apiCreateCustomer as any).mockResolvedValue(createdCustomer);

    let customerId: string = '';
    await act(async () => {
      customerId = await result.current.addCustomer(newCustomer);
    });

    const customer = result.current.getCustomer(customerId);
    expect(customer).toBeTruthy();
    expect(customer?.name).toBe('Acme Corp');
    expect(customer?.id).toBe('customer-123');
  });

  it('should call API on refreshCustomers', async () => {
    const { result } = renderHook(() => useCustomers(), {
      wrapper: CustomerProvider
    });

    // Clear previous calls
    vi.clearAllMocks();

    const refreshedCustomers: Customer[] = [
      { id: 'customer-1', name: 'Customer 1', industry: 'Technology', isPublicSector: false },
      { id: 'customer-2', name: 'Customer 2', industry: 'Finance', isPublicSector: true },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fetchCustomers as any).mockResolvedValue(refreshedCustomers);

    await act(async () => {
      await result.current.refreshCustomers();
    });

    expect(fetchCustomers).toHaveBeenCalled();
    expect(result.current.customers).toHaveLength(2);
    expect(result.current.customers[0].name).toBe('Customer 1');
    expect(result.current.customers[1].name).toBe('Customer 2');
  });
});
