import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { CustomerProvider, useCustomers } from './CustomerStore';
import type { Customer } from '../types';

describe('CustomerStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should start with empty customers after loading', async () => {
    const { result } = renderHook(() => useCustomers(), {
      wrapper: CustomerProvider
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.customers).toEqual([]);
  });

  it('should add a customer and return the new ID', async () => {
    const { result } = renderHook(() => useCustomers(), {
      wrapper: CustomerProvider
    });

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newCustomer: Omit<Customer, 'id'> = {
      name: 'Acme Corp',
      industry: 'Technology',
      isPublicSector: false,
    };

    let returnedId: string = '';
    await act(async () => {
      returnedId = await result.current.addCustomer(newCustomer);
    });

    expect(result.current.customers).toHaveLength(1);
    expect(result.current.customers[0].name).toBe('Acme Corp');
    expect(result.current.customers[0].id).toBeTruthy();
    expect(returnedId).toBe(result.current.customers[0].id);
  });

  it('should update a customer', async () => {
    const { result } = renderHook(() => useCustomers(), {
      wrapper: CustomerProvider
    });

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newCustomer: Omit<Customer, 'id'> = {
      name: 'Acme Corp',
      industry: 'Technology',
      isPublicSector: false,
    };

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

    await act(async () => {
      await result.current.updateCustomer(updatedCustomer);
    });

    expect(result.current.customers).toHaveLength(1);
    expect(result.current.customers[0].name).toBe('Acme Corporation');
    expect(result.current.customers[0].industry).toBe('Finance');
    expect(result.current.customers[0].isPublicSector).toBe(true);
  });

  it('should delete a customer', async () => {
    const { result } = renderHook(() => useCustomers(), {
      wrapper: CustomerProvider
    });

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newCustomer: Omit<Customer, 'id'> = {
      name: 'Acme Corp',
      industry: 'Technology',
      isPublicSector: false,
    };

    let customerId: string = '';
    await act(async () => {
      customerId = await result.current.addCustomer(newCustomer);
    });

    expect(result.current.customers).toHaveLength(1);

    await act(async () => {
      await result.current.deleteCustomer(customerId);
    });

    expect(result.current.customers).toHaveLength(0);
  });

  it('should get a customer by id', async () => {
    const { result } = renderHook(() => useCustomers(), {
      wrapper: CustomerProvider
    });

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newCustomer: Omit<Customer, 'id'> = {
      name: 'Acme Corp',
      industry: 'Technology',
      isPublicSector: false,
    };

    let customerId: string = '';
    await act(async () => {
      customerId = await result.current.addCustomer(newCustomer);
    });

    const customer = result.current.getCustomer(customerId);
    expect(customer).toBeTruthy();
    expect(customer?.name).toBe('Acme Corp');
  });

  it('should persist customers to localStorage', async () => {
    const { result } = renderHook(() => useCustomers(), {
      wrapper: CustomerProvider
    });

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newCustomer: Omit<Customer, 'id'> = {
      name: 'Acme Corp',
      industry: 'Technology',
      isPublicSector: false,
    };

    await act(async () => {
      await result.current.addCustomer(newCustomer);
    });

    const saved = localStorage.getItem('raise_customers');
    expect(saved).toBeTruthy();

    const parsed = JSON.parse(saved!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe('Acme Corp');
  });
});
