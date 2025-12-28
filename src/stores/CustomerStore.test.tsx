import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CustomerProvider, useCustomers } from './CustomerStore';
import type { Customer } from '../types';

describe('CustomerStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should start with empty customers', () => {
    const { result } = renderHook(() => useCustomers(), {
      wrapper: CustomerProvider
    });

    expect(result.current.customers).toEqual([]);
  });

  it('should add a customer', () => {
    const { result } = renderHook(() => useCustomers(), {
      wrapper: CustomerProvider
    });

    const newCustomer: Omit<Customer, 'id'> = {
      name: 'Acme Corp',
      industry: 'Technology',
      isPublicSector: false,
    };

    act(() => {
      result.current.addCustomer(newCustomer);
    });

    expect(result.current.customers).toHaveLength(1);
    expect(result.current.customers[0].name).toBe('Acme Corp');
    expect(result.current.customers[0].id).toBeTruthy();
  });
});
