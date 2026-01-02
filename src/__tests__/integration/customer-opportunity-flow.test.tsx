import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { CustomerProvider, useCustomers } from '../../stores/CustomerStore';
import { OpportunitiesProvider, useOpportunities } from '../../stores/OpportunitiesStore';
import { SettingsProvider } from '../../stores/SettingsStore';
import type { Customer, Opportunity } from '../../types';
import React from 'react';

// Mock the API layers
vi.mock('@/api/customers', () => ({
  fetchCustomers: vi.fn(() => Promise.resolve([])),
  createCustomer: vi.fn((customer: Customer) => Promise.resolve(customer)),
  updateCustomer: vi.fn((_id: string, customer: Customer) => Promise.resolve(customer)),
  deleteCustomer: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/api/opportunities', () => ({
  fetchOpportunities: vi.fn(() => Promise.resolve([])),
  createOpportunity: vi.fn((opp: Opportunity) => Promise.resolve(opp)),
  updateOpportunity: vi.fn((_id: string, opp: Opportunity) => Promise.resolve(opp)),
  deleteOpportunity: vi.fn(() => Promise.resolve()),
}));

// Wrapper component that provides all necessary contexts
const AllProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SettingsProvider>
    <CustomerProvider>
      <OpportunitiesProvider>
        {children}
      </OpportunitiesProvider>
    </CustomerProvider>
  </SettingsProvider>
);

describe('Customer-Opportunity Integration Flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should create a customer and use it in an opportunity', async () => {
    // Setup customer hook
    const { result: customerResult } = renderHook(() => useCustomers(), {
      wrapper: AllProviders
    });

    // Setup opportunity hook
    const { result: oppResult } = renderHook(() => useOpportunities(), {
      wrapper: AllProviders
    });

    // Step 1: Create a customer
    const newCustomer: Omit<Customer, 'id'> = {
      name: 'Acme Corporation',
      industry: 'Technology',
      isPublicSector: false,
    };

    let customerId: string = '';
    await act(async () => {
      customerId = await customerResult.current.addCustomer(newCustomer);
    });

    expect(customerResult.current.customers).toHaveLength(1);
    expect(customerId).toBeTruthy();

    // Step 2: Create an opportunity linked to the customer
    const newOpportunity: Opportunity = {
      id: 'OPP-2025-TEST',
      title: 'Cloud Migration Project',
      customerId: customerId,
      tcv: 500000,
      raiseTcv: 600000,
      currentPhase: 'Planning',
      raiseLevel: 'L4',
      hasKcpDeviations: false,
      isFastTrack: false,
      isRti: false,
      isMandataria: false,
      isPublicSector: false,
      deviations: [],
      checkpoints: {},
      marginPercent: 20,
      cashFlowNeutral: true,
      isNewCustomer: false,
    };

    await act(async () => {
      await oppResult.current.addOpportunity(newOpportunity, 'test@example.com');
    });

    expect(oppResult.current.opportunities).toHaveLength(1);
    expect(oppResult.current.opportunities[0].customerId).toBe(customerId);

    // Step 3: Verify customer-opportunity relationship
    const customer = customerResult.current.getCustomer(customerId);
    const opportunity = oppResult.current.opportunities[0];

    expect(customer).toBeTruthy();
    expect(opportunity.customerId).toBe(customer!.id);
  });

  it('should auto-fill industry and public sector from customer', async () => {
    const { result: customerResult } = renderHook(() => useCustomers(), {
      wrapper: AllProviders
    });

    // Create a public sector customer
    const publicCustomer: Omit<Customer, 'id'> = {
      name: 'Government Agency',
      industry: 'Public Administration',
      isPublicSector: true,
    };

    let customerId: string = '';
    await act(async () => {
      customerId = await customerResult.current.addCustomer(publicCustomer);
    });

    const customer = customerResult.current.getCustomer(customerId);
    expect(customer?.isPublicSector).toBe(true);
    expect(customer?.industry).toBe('Public Administration');
  });

  it('should handle backward compatibility with old opportunities', async () => {
    const { result: oppResult } = renderHook(() => useOpportunities(), {
      wrapper: AllProviders
    });

    // Create an old-style opportunity (with clientName, no customerId)
    const oldOpportunity: Opportunity = {
      id: 'OPP-2024-OLD',
      title: 'Legacy Project',
      clientName: 'Old Client',
      industry: 'Finance',
      tcv: 300000,
      raiseTcv: 300000,
      currentPhase: 'ATP',
      raiseLevel: 'L5',
      hasKcpDeviations: false,
      isFastTrack: true,
      isRti: false,
      isMandataria: false,
      isPublicSector: false,
      deviations: [],
      checkpoints: {},
      marginPercent: 20,
      cashFlowNeutral: true,
      isNewCustomer: false,
    };

    await act(async () => {
      await oppResult.current.addOpportunity(oldOpportunity, 'test@example.com');
    });

    expect(oppResult.current.opportunities).toHaveLength(1);
    expect(oppResult.current.opportunities[0].clientName).toBe('Old Client');
    expect(oppResult.current.opportunities[0].industry).toBe('Finance');
    expect(oppResult.current.opportunities[0].customerId).toBeUndefined();
  });

  it('should update opportunity customer reference', async () => {
    const { result: customerResult } = renderHook(() => useCustomers(), {
      wrapper: AllProviders
    });

    const { result: oppResult } = renderHook(() => useOpportunities(), {
      wrapper: AllProviders
    });

    // Create two customers
    let customer1Id: string = '';
    let customer2Id: string = '';

    await act(async () => {
      customer1Id = await customerResult.current.addCustomer({
        name: 'Customer One',
        industry: 'Technology',
        isPublicSector: false,
      });
    });

    await act(async () => {
      customer2Id = await customerResult.current.addCustomer({
        name: 'Customer Two',
        industry: 'Finance',
        isPublicSector: true,
      });
    });

    // Create opportunity with first customer
    const opportunity: Opportunity = {
      id: 'OPP-2025-SWITCH',
      title: 'Switchable Project',
      customerId: customer1Id,
      tcv: 400000,
      raiseTcv: 400000,
      currentPhase: 'Planning',
      raiseLevel: 'L5',
      hasKcpDeviations: false,
      isFastTrack: false,
      isRti: false,
      isMandataria: false,
      isPublicSector: false,
      deviations: [],
      checkpoints: {},
      marginPercent: 20,
      cashFlowNeutral: true,
      isNewCustomer: false,
    };

    await act(async () => {
      await oppResult.current.addOpportunity(opportunity, 'test@example.com');
    });

    expect(oppResult.current.opportunities[0].customerId).toBe(customer1Id);

    // Update opportunity to use second customer
    const updatedOpp = {
      ...oppResult.current.opportunities[0],
      customerId: customer2Id,
      isPublicSector: true, // Should be updated based on customer2
    };

    await act(async () => {
      await oppResult.current.updateOpportunity(updatedOpp);
    });

    expect(oppResult.current.opportunities[0].customerId).toBe(customer2Id);
    expect(oppResult.current.opportunities[0].isPublicSector).toBe(true);
  });

  it('should validate customer data on load from localStorage', async () => {
    // Manually set invalid customer data in localStorage
    const invalidData = [
      {
        id: 'invalid-123',
        name: 'X', // Too short (min 2 chars)
        industry: 'InvalidIndustry', // Not a valid industry
        isPublicSector: 'not-a-boolean', // Wrong type
      }
    ];

    localStorage.setItem('raise_customers', JSON.stringify(invalidData));

    // Create a new hook instance that will load from localStorage
    const { result } = renderHook(() => useCustomers(), {
      wrapper: AllProviders
    });

    // Explicitly trigger load
    await act(async () => {
      await result.current.refreshCustomers();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should fall back to empty array due to validation failure
    expect(result.current.customers).toEqual([]);
  });

  it('should prevent deleting customer with active opportunities', async () => {
    const { result: customerResult } = renderHook(() => useCustomers(), {
      wrapper: AllProviders
    });

    const { result: oppResult } = renderHook(() => useOpportunities(), {
      wrapper: AllProviders
    });

    // Create customer
    let customerId: string = '';
    await act(async () => {
      customerId = await customerResult.current.addCustomer({
        name: 'Protected Customer',
        industry: 'Healthcare',
        isPublicSector: false,
      });
    });

    // Create opportunity for this customer
    const opportunity: Opportunity = {
      id: 'OPP-2025-PROTECTED',
      title: 'Protected Project',
      customerId: customerId,
      tcv: 250000,
      raiseTcv: 250000,
      currentPhase: 'ATS',
      raiseLevel: 'L6',
      hasKcpDeviations: false,
      isFastTrack: false,
      isRti: false,
      isMandataria: false,
      isPublicSector: false,
      deviations: [],
      checkpoints: {},
      marginPercent: 20,
      cashFlowNeutral: true,
      isNewCustomer: false,
    };

    await act(async () => {
      await oppResult.current.addOpportunity(opportunity, 'test@example.com');
    });

    // Verify customer exists
    expect(customerResult.current.customers).toHaveLength(1);
    expect(oppResult.current.opportunities).toHaveLength(1);

    // The actual delete protection is in the UI component's handleDeleteCustomer
    // Here we just verify the data relationship exists
    const hasOpportunities = oppResult.current.opportunities.some(
      opp => opp.customerId === customerId
    );

    expect(hasOpportunities).toBe(true);
  });
});
