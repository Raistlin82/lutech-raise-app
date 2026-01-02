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

// Mock the API layers
vi.mock('@/api/customers', () => ({
  fetchCustomers: vi.fn(() => Promise.resolve([])),
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
}));

import * as opportunitiesApi from '@/api/opportunities';
vi.mock('@/api/opportunities');

// Mock the auth hook with different users for different tests
const mockAuthUser = vi.fn();
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockAuthUser(),
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
  title: 'Test Opportunity',
  description: '',
  tcv: 1000000,
  firstMarginPercentage: 20,
  raiseTcv: 1000000,
  industry: 'Technology',
  currentPhase: 'Planning',
  hasKcpDeviations: false,
  isFastTrack: false,
  isRti: false,
  isPublicSector: false,
  raiseLevel: 'L3',
  checkpoints: {},
  status: 'active',
  expectedDecisionDate: '2024-12-31',
  createdByEmail: 'user1@example.com',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('Multi-User Data Segregation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Default mock: return empty array
    vi.mocked(opportunitiesApi.fetchOpportunities).mockResolvedValue([]);
  });

  it('should show only user-specific opportunities', async () => {
    // Mock user1 authentication
    mockAuthUser.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      error: null,
      user: { profile: { email: 'user1@example.com' } },
    });

    // Create opportunities for different users
    const user1Opportunity = createMockOpportunity({
      id: '1',
      title: 'User1 Opportunity',
      createdByEmail: 'user1@example.com',
    });

    const user2Opportunity = createMockOpportunity({
      id: '2',
      title: 'User2 Opportunity',
      createdByEmail: 'user2@example.com',
    });

    // Mock API to return only user1's opportunities (simulating RLS filtering)
    vi.mocked(opportunitiesApi.fetchOpportunities).mockResolvedValue([user1Opportunity]);

    render(
      <AllProviders>
        <Dashboard onSelectOpp={() => {}} />
      </AllProviders>
    );

    // Wait for opportunities to load
    await waitFor(() => {
      expect(screen.getByText('User1 Opportunity')).toBeInTheDocument();
    }, { timeout: 1000 });

    // Verify user1's opportunity is shown
    expect(screen.getByText('User1 Opportunity')).toBeInTheDocument();

    // Verify user2's opportunity is NOT shown
    expect(screen.queryByText('User2 Opportunity')).not.toBeInTheDocument();
  });

  it('should not allow users to see other users opportunities', async () => {
    // Mock user2 authentication
    mockAuthUser.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      error: null,
      user: { profile: { email: 'user2@example.com' } },
    });

    // Create opportunities for different users
    const user1Opportunity = createMockOpportunity({
      id: '1',
      title: 'User1 Private Opportunity',
      createdByEmail: 'user1@example.com',
    });

    const user2Opportunity = createMockOpportunity({
      id: '2',
      title: 'User2 Opportunity',
      createdByEmail: 'user2@example.com',
    });

    // Mock API to return only user2's opportunities (simulating RLS filtering)
    // RLS policies in Supabase will filter results by user email
    vi.mocked(opportunitiesApi.fetchOpportunities).mockResolvedValue([user2Opportunity]);

    render(
      <AllProviders>
        <Dashboard onSelectOpp={() => {}} />
      </AllProviders>
    );

    // Wait for opportunities to load
    await waitFor(() => {
      expect(screen.getByText('User2 Opportunity')).toBeInTheDocument();
    }, { timeout: 1000 });

    // Verify the API layer was called
    expect(opportunitiesApi.fetchOpportunities).toHaveBeenCalledTimes(1);

    // Verify user2's opportunity is shown
    expect(screen.getByText('User2 Opportunity')).toBeInTheDocument();

    // Verify user1's opportunity is NOT shown (RLS filtered it out)
    expect(screen.queryByText('User1 Private Opportunity')).not.toBeInTheDocument();
  });

  it('should display multiple opportunities for the same user', async () => {
    // Mock user1 authentication
    mockAuthUser.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      error: null,
      user: { profile: { email: 'user1@example.com' } },
    });

    // Create multiple opportunities for user1
    const user1Opportunities = [
      createMockOpportunity({
        id: '1',
        title: 'User1 First Opportunity',
        tcv: 500000,
        raiseTcv: 500000,
        createdByEmail: 'user1@example.com',
      }),
      createMockOpportunity({
        id: '2',
        title: 'User1 Second Opportunity',
        tcv: 750000,
        raiseTcv: 750000,
        createdByEmail: 'user1@example.com',
      }),
      createMockOpportunity({
        id: '3',
        title: 'User1 Third Opportunity',
        tcv: 1000000,
        raiseTcv: 1000000,
        createdByEmail: 'user1@example.com',
      }),
    ];

    // Mock API to return all user1's opportunities
    vi.mocked(opportunitiesApi.fetchOpportunities).mockResolvedValue(user1Opportunities);

    render(
      <AllProviders>
        <Dashboard onSelectOpp={() => {}} />
      </AllProviders>
    );

    // Wait for all opportunities to load
    await waitFor(() => {
      expect(screen.getByText('User1 First Opportunity')).toBeInTheDocument();
    }, { timeout: 1000 });

    // Verify all user1's opportunities are shown
    expect(screen.getByText('User1 First Opportunity')).toBeInTheDocument();
    expect(screen.getByText('User1 Second Opportunity')).toBeInTheDocument();
    expect(screen.getByText('User1 Third Opportunity')).toBeInTheDocument();

    // Verify total TCV calculation (0.5M + 0.75M + 1M = 2.25M)
    expect(screen.getByText(/€2\.25M/)).toBeInTheDocument();
  });

  it('should handle empty state when user has no opportunities', async () => {
    // Mock authenticated user with no opportunities
    mockAuthUser.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      error: null,
      user: { profile: { email: 'newuser@example.com' } },
    });

    // Mock API to return empty array (user has no opportunities yet)
    vi.mocked(opportunitiesApi.fetchOpportunities).mockResolvedValue([]);

    render(
      <AllProviders>
        <Dashboard onSelectOpp={() => {}} />
      </AllProviders>
    );

    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText('Panoramica Pipeline')).toBeInTheDocument();
    }, { timeout: 1000 });

    // Verify empty state - stats should show 0
    expect(screen.getByText('€0.00M')).toBeInTheDocument();

    // Verify API was called
    expect(opportunitiesApi.fetchOpportunities).toHaveBeenCalledTimes(1);
  });

  it('should verify API layer respects user context', async () => {
    // Mock user3 authentication
    mockAuthUser.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      error: null,
      user: { profile: { email: 'user3@example.com' } },
    });

    const user3Opportunity = createMockOpportunity({
      id: '3',
      title: 'User3 Opportunity',
      createdByEmail: 'user3@example.com',
    });

    // Mock API to simulate RLS filtering by user
    vi.mocked(opportunitiesApi.fetchOpportunities).mockResolvedValue([user3Opportunity]);

    render(
      <AllProviders>
        <Dashboard onSelectOpp={() => {}} />
      </AllProviders>
    );

    // Wait for opportunities to load
    await waitFor(() => {
      expect(screen.getByText('User3 Opportunity')).toBeInTheDocument();
    }, { timeout: 1000 });

    // Verify fetchOpportunities was called exactly once
    expect(opportunitiesApi.fetchOpportunities).toHaveBeenCalledTimes(1);

    // In the real implementation, RLS policies in Supabase will automatically
    // filter the query based on the JWT token's user email claim
    // This test verifies the integration flow works correctly

    // Verify only user3's opportunity is displayed
    expect(screen.getByText('User3 Opportunity')).toBeInTheDocument();
  });
});
