import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { OpportunitiesProvider } from '../../stores/OpportunitiesStore';
import { CustomerProvider } from '../../stores/CustomerStore';
import { SettingsProvider } from '../../stores/SettingsStore';
import { Dashboard } from '../../components/dashboard';
import { calculateRaiseLevel, isFastTrackEligible } from '../../lib/raiseLogic';
import type { Opportunity } from '../../types';

// Mock the auth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    isLoading: false,
    error: null,
    user: { profile: { email: 'test@example.com' } },
  })),
}));

// Mock the API layers
vi.mock('@/api/customers', () => ({
  fetchCustomers: vi.fn(() => Promise.resolve([])),
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
}));

import * as opportunitiesApi from '@/api/opportunities';
vi.mock('@/api/opportunities');

// Wrapper with all providers
const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <CustomerProvider>
      <OpportunitiesProvider>
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </OpportunitiesProvider>
    </CustomerProvider>
  </BrowserRouter>
);

// Helper to create a mock opportunity
const createMockOpportunity = (overrides: Partial<Opportunity> = {}): Opportunity => ({
  id: 'OPP-CALC-TEST',
  title: 'Calculation Test',
  clientName: 'Test Client',
  tcv: 1000000,
  raiseTcv: 1000000,
  industry: 'Technology',
  currentPhase: 'Planning',
  hasKcpDeviations: false,
  isFastTrack: false,
  isRti: false,
  isPublicSector: false,
  raiseLevel: 'L3',
  deviations: [],
  checkpoints: {},
  marginPercent: 20,
  cashFlowNeutral: true,
  isNewCustomer: false,
  ...overrides,
});

describe('RAISE Level Calculation Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Default mock: return empty array
    vi.mocked(opportunitiesApi.fetchOpportunities).mockResolvedValue([]);
  });

  describe('TCV-based Level Calculation', () => {
    it('should calculate L6 for TCV < 250k', async () => {
      const opp = createMockOpportunity({
        tcv: 200000,
        raiseTcv: 200000,
      });

      const level = calculateRaiseLevel(opp);
      expect(level).toBe('L6');

      vi.mocked(opportunitiesApi.fetchOpportunities).mockResolvedValue([opp]);

      render(
        <AllProviders>
          <Dashboard onSelectOpp={() => {}} />
        </AllProviders>
      );

      await waitFor(() => {
        expect(screen.getByText('L6')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should calculate L5 for TCV 250k-500k', async () => {
      const opp = createMockOpportunity({
        tcv: 400000,
        raiseTcv: 400000,
      });

      const level = calculateRaiseLevel(opp);
      expect(level).toBe('L5');

      vi.mocked(opportunitiesApi.fetchOpportunities).mockResolvedValue([opp]);

      render(
        <AllProviders>
          <Dashboard onSelectOpp={() => {}} />
        </AllProviders>
      );

      await waitFor(() => {
        expect(screen.getByText('L5')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should calculate L4 for TCV 500k-1M', async () => {
      const opp = createMockOpportunity({
        tcv: 750000,
        raiseTcv: 750000,
      });

      const level = calculateRaiseLevel(opp);
      expect(level).toBe('L4');
    });

    it('should calculate L3 for TCV 1M-10M', async () => {
      const opp = createMockOpportunity({
        tcv: 5000000,
        raiseTcv: 5000000,
      });

      const level = calculateRaiseLevel(opp);
      expect(level).toBe('L3');
    });

    it('should calculate L2 for TCV 10M-20M', async () => {
      const opp = createMockOpportunity({
        tcv: 15000000,
        raiseTcv: 15000000,
      });

      const level = calculateRaiseLevel(opp);
      expect(level).toBe('L2');
    });

    it('should calculate L1 for TCV > 20M', async () => {
      const opp = createMockOpportunity({
        tcv: 25000000,
        raiseTcv: 25000000,
      });

      const level = calculateRaiseLevel(opp);
      expect(level).toBe('L1');
    });
  });

  describe('KCP Deviation Impact', () => {
    it('should shift L6 to L5 with KCP deviations', () => {
      const opp = createMockOpportunity({
        tcv: 200000,
        raiseTcv: 200000,
        hasKcpDeviations: true,
      });

      const level = calculateRaiseLevel(opp);
      expect(level).toBe('L5'); // Shifted up from L6
    });

    it('should shift L5 to L4 with KCP deviations', () => {
      const opp = createMockOpportunity({
        tcv: 400000,
        raiseTcv: 400000,
        hasKcpDeviations: true,
      });

      const level = calculateRaiseLevel(opp);
      expect(level).toBe('L4'); // Shifted up from L5
    });

    it('should NOT shift L4 with KCP deviations', () => {
      const opp = createMockOpportunity({
        tcv: 750000,
        raiseTcv: 750000,
        hasKcpDeviations: true,
      });

      const level = calculateRaiseLevel(opp);
      expect(level).toBe('L4'); // Stays at L4, no shift for L4+
    });

    it('should NOT shift L3, L2, L1 with KCP deviations', () => {
      const oppL3 = createMockOpportunity({
        tcv: 5000000,
        raiseTcv: 5000000,
        hasKcpDeviations: true,
      });

      const oppL2 = createMockOpportunity({
        tcv: 15000000,
        raiseTcv: 15000000,
        hasKcpDeviations: true,
      });

      const oppL1 = createMockOpportunity({
        tcv: 25000000,
        raiseTcv: 25000000,
        hasKcpDeviations: true,
      });

      expect(calculateRaiseLevel(oppL3)).toBe('L3');
      expect(calculateRaiseLevel(oppL2)).toBe('L2');
      expect(calculateRaiseLevel(oppL1)).toBe('L1');
    });
  });

  describe('New Customer Impact', () => {
    it('should shift L6 to L5 for new customer', () => {
      const opp = createMockOpportunity({
        tcv: 200000,
        raiseTcv: 200000,
        isNewCustomer: true,
      });

      const level = calculateRaiseLevel(opp);
      expect(level).toBe('L5');
    });

    it('should shift L5 to L4 for new customer', () => {
      const opp = createMockOpportunity({
        tcv: 400000,
        raiseTcv: 400000,
        isNewCustomer: true,
      });

      const level = calculateRaiseLevel(opp);
      expect(level).toBe('L4');
    });
  });

  describe('Force L1 Factors', () => {
    it('should force L1 for social clauses regardless of TCV', () => {
      const smallOpp = createMockOpportunity({
        tcv: 100000,
        raiseTcv: 100000,
        hasSocialClauses: true,
      });

      expect(calculateRaiseLevel(smallOpp)).toBe('L1');
    });

    it('should force L1 for non-core business regardless of TCV', () => {
      const smallOpp = createMockOpportunity({
        tcv: 100000,
        raiseTcv: 100000,
        isNonCoreBusiness: true,
      });

      expect(calculateRaiseLevel(smallOpp)).toBe('L1');
    });

    it('should force L1 even with low TCV and no other risk factors', () => {
      const opp = createMockOpportunity({
        tcv: 50000,
        raiseTcv: 50000,
        hasKcpDeviations: false,
        isNewCustomer: false,
        hasSocialClauses: true,
      });

      expect(calculateRaiseLevel(opp)).toBe('L1');
    });
  });

  describe('Low Risk Services to L2', () => {
    it('should elevate L3 to L2 for low risk services >= 200k', () => {
      const opp = createMockOpportunity({
        tcv: 5000000,
        raiseTcv: 5000000,
        hasLowRiskServices: true,
        servicesValue: 250000,
      });

      const level = calculateRaiseLevel(opp);
      expect(level).toBe('L2'); // Elevated from L3
    });

    it('should NOT elevate if services < 200k', () => {
      const opp = createMockOpportunity({
        tcv: 5000000,
        raiseTcv: 5000000,
        hasLowRiskServices: true,
        servicesValue: 150000,
      });

      const level = calculateRaiseLevel(opp);
      expect(level).toBe('L3'); // Stays L3
    });

    it('should NOT elevate L2 or L1 (already high levels)', () => {
      const oppL2 = createMockOpportunity({
        tcv: 15000000,
        raiseTcv: 15000000,
        hasLowRiskServices: true,
        servicesValue: 250000,
      });

      expect(calculateRaiseLevel(oppL2)).toBe('L2'); // Stays L2
    });
  });

  describe('Fast Track Eligibility', () => {
    it('should be eligible for Fast Track with TCV < 250k and no deviations', () => {
      const opp = createMockOpportunity({
        tcv: 200000,
        raiseTcv: 200000,
        hasKcpDeviations: false,
        isNewCustomer: false,
      });

      expect(isFastTrackEligible(opp)).toBe(true);
    });

    it('should NOT be eligible for Fast Track with TCV >= 250k', () => {
      const opp = createMockOpportunity({
        tcv: 300000,
        raiseTcv: 300000,
        hasKcpDeviations: false,
      });

      expect(isFastTrackEligible(opp)).toBe(false);
    });

    it('should NOT be eligible for Fast Track with KCP deviations', () => {
      const opp = createMockOpportunity({
        tcv: 200000,
        raiseTcv: 200000,
        hasKcpDeviations: true,
      });

      expect(isFastTrackEligible(opp)).toBe(false);
    });

    it('should NOT be eligible for Fast Track with new customer', () => {
      const opp = createMockOpportunity({
        tcv: 200000,
        raiseTcv: 200000,
        isNewCustomer: true,
      });

      expect(isFastTrackEligible(opp)).toBe(false);
    });

    it('should NOT be eligible for Fast Track with small ticket flag', () => {
      const opp = createMockOpportunity({
        tcv: 4000,
        raiseTcv: 4000,
        isSmallTicket: true,
        hasKcpDeviations: false,
      });

      expect(isFastTrackEligible(opp)).toBe(false);
    });
  });

  describe('Level Recalculation on TCV Change', () => {
    it('should recalculate level when TCV changes from L6 to L5 range', async () => {
      // Start with L6 opportunity
      const opp = createMockOpportunity({
        tcv: 200000,
        raiseTcv: 200000,
        raiseLevel: 'L6',
      });

      vi.mocked(opportunitiesApi.fetchOpportunities).mockResolvedValue([opp]);

      const { unmount } = render(
        <AllProviders>
          <Dashboard onSelectOpp={() => {}} />
        </AllProviders>
      );

      await waitFor(() => {
        expect(screen.getByText('L6')).toBeInTheDocument();
      }, { timeout: 1000 });

      unmount();

      // Update TCV to L5 range
      const updatedOpp = {
        ...opp,
        tcv: 400000,
        raiseTcv: 400000,
        raiseLevel: calculateRaiseLevel({ ...opp, tcv: 400000, raiseTcv: 400000 }),
      };

      vi.mocked(opportunitiesApi.fetchOpportunities).mockResolvedValue([updatedOpp]);

      render(
        <AllProviders>
          <Dashboard onSelectOpp={() => {}} />
        </AllProviders>
      );

      // Should show recalculated level
      await waitFor(() => {
        expect(screen.getByText('L5')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should recalculate level when TCV increases significantly', () => {
      const oppBefore = createMockOpportunity({
        tcv: 500000,
        raiseTcv: 500000,
      });

      expect(calculateRaiseLevel(oppBefore)).toBe('L4');

      const oppAfter = {
        ...oppBefore,
        tcv: 5000000,
        raiseTcv: 5000000,
      };

      expect(calculateRaiseLevel(oppAfter)).toBe('L3');
    });
  });

  describe('Combined Risk Factors', () => {
    it('should handle multiple risk factors correctly', () => {
      // KCP deviation + New customer on L6 base
      const opp = createMockOpportunity({
        tcv: 200000,
        raiseTcv: 200000,
        hasKcpDeviations: true,
        isNewCustomer: true,
      });

      // Should shift from L6 -> L5 (only one shift applies)
      expect(calculateRaiseLevel(opp)).toBe('L5');
    });

    it('should prioritize L1 forcing factors over TCV', () => {
      const opp = createMockOpportunity({
        tcv: 100000, // Would be L6
        raiseTcv: 100000,
        hasKcpDeviations: true, // Would shift to L5
        hasSocialClauses: true, // Forces L1
      });

      expect(calculateRaiseLevel(opp)).toBe('L1');
    });

    it('should handle all elevation factors together', () => {
      const opp = createMockOpportunity({
        tcv: 5000000, // Base L3
        raiseTcv: 5000000,
        hasLowRiskServices: true, // Would elevate to L2
        servicesValue: 300000,
        hasKcpDeviations: true, // Does not shift L3+
      });

      expect(calculateRaiseLevel(opp)).toBe('L2');
    });
  });
});
