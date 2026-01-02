import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { OpportunitiesProvider } from '../../stores/OpportunitiesStore';
import { CustomerProvider } from '../../stores/CustomerStore';
import { SettingsProvider } from '../../stores/SettingsStore';
import { Dashboard } from '../../components/dashboard';
import type { Opportunity } from '../../types';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n/config';

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

vi.mock('@/api/opportunities', () => ({
  fetchOpportunities: vi.fn(() => Promise.resolve([])),
  createOpportunity: vi.fn(),
  updateOpportunity: vi.fn(),
  deleteOpportunity: vi.fn(),
}));

// Wrapper with all providers
const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <I18nextProvider i18n={i18n}>
      <CustomerProvider>
        <OpportunitiesProvider>
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </OpportunitiesProvider>
      </CustomerProvider>
    </I18nextProvider>
  </BrowserRouter>
);

// Helper to create a mock opportunity
const createMockOpportunity = (overrides: Partial<Opportunity> = {}): Opportunity => ({
  id: 'OPP-TEST-001',
  title: 'Integration Test Opportunity',
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

describe('Opportunity Workflow Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should create opportunity and show in dashboard', async () => {
    // Start with empty opportunities store
    const { unmount } = render(
      <AllProviders>
        <Dashboard onSelectOpp={() => {}} />
      </AllProviders>
    );

    // Wait for loading state to finish (300ms delay)
    await waitFor(() => {
      expect(screen.getByText('Panoramica Pipeline')).toBeInTheDocument();
    }, { timeout: 500 });

    // Verify empty state - Active count should be 0
    const activeOppsText = screen.getByText('Opportunità Attive');
    expect(activeOppsText).toBeInTheDocument();

    unmount();

    // Simulate creating an opportunity by directly updating localStorage
    const newOpp = createMockOpportunity();
    localStorage.setItem('raise_opportunities', JSON.stringify([newOpp]));

    // Re-render dashboard - should load from localStorage
    render(
      <AllProviders>
        <Dashboard onSelectOpp={() => {}} />
      </AllProviders>
    );

    // Verify opportunity appears in dashboard
    await waitFor(() => {
      expect(screen.getByText('Integration Test Opportunity')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Client')).toBeInTheDocument();

    // Verify TCV display
    expect(screen.getByText(/€1\.00M/)).toBeInTheDocument();
  });

  it('should update opportunity and reflect in dashboard', async () => {
    // Setup initial opportunity
    const initialOpp = createMockOpportunity();
    localStorage.setItem('raise_opportunities', JSON.stringify([initialOpp]));

    const { unmount } = render(
      <AllProviders>
        <Dashboard onSelectOpp={() => {}} />
      </AllProviders>
    );

    // Verify initial state
    await waitFor(() => {
      expect(screen.getByText('Integration Test Opportunity')).toBeInTheDocument();
    });

    unmount();

    // Update the opportunity title
    const updatedOpp = { ...initialOpp, title: 'Updated Test Opportunity' };
    localStorage.setItem('raise_opportunities', JSON.stringify([updatedOpp]));

    // Re-render
    render(
      <AllProviders>
        <Dashboard onSelectOpp={() => {}} />
      </AllProviders>
    );

    // Verify updated title appears
    await waitFor(() => {
      expect(screen.getByText('Updated Test Opportunity')).toBeInTheDocument();
    });
    expect(screen.queryByText('Integration Test Opportunity')).not.toBeInTheDocument();
  });

  it('should delete opportunity and remove from dashboard', async () => {
    // Setup opportunity
    const opp = createMockOpportunity();
    localStorage.setItem('raise_opportunities', JSON.stringify([opp]));

    const { unmount } = render(
      <AllProviders>
        <Dashboard onSelectOpp={() => {}} />
      </AllProviders>
    );

    // Verify opportunity exists
    await waitFor(() => {
      expect(screen.getByText('Integration Test Opportunity')).toBeInTheDocument();
    });

    unmount();

    // Delete from localStorage
    localStorage.setItem('raise_opportunities', JSON.stringify([]));

    // Re-render
    render(
      <AllProviders>
        <Dashboard onSelectOpp={() => {}} />
      </AllProviders>
    );

    // Verify opportunity is gone
    await waitFor(() => {
      expect(screen.queryByText('Integration Test Opportunity')).not.toBeInTheDocument();
    });
  });

  it('should show correct dashboard stats with multiple opportunities', async () => {
    // Create multiple opportunities with different characteristics
    const opps: Opportunity[] = [
      createMockOpportunity({
        id: 'OPP-1',
        title: 'Opp 1',
        tcv: 1000000,
        raiseTcv: 1000000,
        hasKcpDeviations: true,
      }),
      createMockOpportunity({
        id: 'OPP-2',
        title: 'Opp 2',
        tcv: 2000000,
        raiseTcv: 2000000,
        hasKcpDeviations: false,
      }),
      createMockOpportunity({
        id: 'OPP-3',
        title: 'Opp 3',
        tcv: 500000,
        raiseTcv: 500000,
        hasKcpDeviations: true,
        currentPhase: 'Won',
      }),
    ];

    localStorage.setItem('raise_opportunities', JSON.stringify(opps));

    render(
      <AllProviders>
        <Dashboard onSelectOpp={() => {}} />
      </AllProviders>
    );

    // Verify stats calculations
    await waitFor(() => {
      // Total TCV: 1M + 2M + 0.5M = 3.5M
      expect(screen.getByText(/€3\.50M/)).toBeInTheDocument();
    });

    // Verify all opportunities are displayed
    expect(screen.getByText('Opp 1')).toBeInTheDocument();
    expect(screen.getByText('Opp 2')).toBeInTheDocument();
    expect(screen.getByText('Opp 3')).toBeInTheDocument();
  });

  it('should persist opportunity across component remounts', async () => {
    // Create opportunity
    const opp = createMockOpportunity({
      title: 'Persistent Opportunity',
      tcv: 5000000,
      raiseTcv: 5000000,
    });

    localStorage.setItem('raise_opportunities', JSON.stringify([opp]));

    // First mount
    const { unmount } = render(
      <AllProviders>
        <Dashboard onSelectOpp={() => {}} />
      </AllProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('Persistent Opportunity')).toBeInTheDocument();
    });

    unmount();

    // Second mount - should load from localStorage
    render(
      <AllProviders>
        <Dashboard onSelectOpp={() => {}} />
      </AllProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('Persistent Opportunity')).toBeInTheDocument();
    });

    // Verify TCV is correct (appears in card and distribution)
    const tcvElements = screen.getAllByText('€5000k');
    expect(tcvElements.length).toBeGreaterThan(0);
  });
});
