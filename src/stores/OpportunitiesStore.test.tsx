import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { OpportunitiesProvider, useOpportunities } from './OpportunitiesStore';
import type { Opportunity } from '../types';
import * as opportunitiesApi from '@/api/opportunities';

// Mock the opportunities API
vi.mock('@/api/opportunities');

// Helper to create a complete valid opportunity
const createMockOpportunity = (overrides?: Partial<Opportunity>): Opportunity => ({
  id: 'TEST-001',
  title: 'Test Opportunity',
  clientName: 'Test Client',
  tcv: 1000000,
  raiseTcv: 1000000,
  industry: 'Manufacturing',
  currentPhase: 'Planning',
  hasKcpDeviations: false,
  isFastTrack: false,
  isRti: false,
  isPublicSector: true,
  raiseLevel: 'L3',
  deviations: [],
  checkpoints: {},
  ...overrides
});

describe('OpportunitiesStore', () => {
  // Helper to render hook with provider
  const renderWithProvider = () => {
    return renderHook(() => useOpportunities(), {
      wrapper: OpportunitiesProvider,
    });
  };

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    // Reset mock implementations
    vi.mocked(opportunitiesApi.fetchOpportunities).mockResolvedValue([]);
    vi.mocked(opportunitiesApi.createOpportunity).mockImplementation(async (opp) => opp);
    vi.mocked(opportunitiesApi.updateOpportunity).mockImplementation(async (id, updates) => ({ id, ...updates } as Opportunity));
    vi.mocked(opportunitiesApi.deleteOpportunity).mockResolvedValue();
  });

  describe('Initialization', () => {
    it('should initialize with empty opportunities after loading', async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.opportunities).toEqual([]);
      expect(result.current.selectedOpp).toBeNull();
      expect(opportunitiesApi.fetchOpportunities).toHaveBeenCalledTimes(1);
    });

    it('should load opportunities from Supabase on init', async () => {
      const mockOpp = createMockOpportunity();
      vi.mocked(opportunitiesApi.fetchOpportunities).mockResolvedValue([mockOpp]);

      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.opportunities).toHaveLength(1);
      expect(result.current.opportunities[0].id).toBe('TEST-001');
      expect(opportunitiesApi.fetchOpportunities).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors gracefully on init', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(opportunitiesApi.fetchOpportunities).mockRejectedValue(new Error('API Error'));

      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.opportunities).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to load opportunities'), expect.anything());

      consoleSpy.mockRestore();
    });
  });

  describe('Add Opportunity', () => {
    it('should add opportunity via Supabase API with user email', async () => {
      const { result } = renderWithProvider();
      const newOpp = createMockOpportunity();
      const userEmail = 'user@example.com';

      vi.mocked(opportunitiesApi.createOpportunity).mockResolvedValue(newOpp);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addOpportunity(newOpp, userEmail);
      });

      expect(result.current.opportunities).toHaveLength(1);
      expect(result.current.opportunities[0]).toEqual(newOpp);
      expect(opportunitiesApi.createOpportunity).toHaveBeenCalledWith(newOpp, userEmail);
    });

    it('should add multiple opportunities', async () => {
      const { result } = renderWithProvider();
      const opp1 = createMockOpportunity({ id: 'TEST-001' });
      const opp2 = createMockOpportunity({ id: 'TEST-002', title: 'Second Opportunity' });
      const userEmail = 'user@example.com';

      vi.mocked(opportunitiesApi.createOpportunity).mockImplementation(async (opp) => opp);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addOpportunity(opp1, userEmail);
      });

      await act(async () => {
        await result.current.addOpportunity(opp2, userEmail);
      });

      expect(result.current.opportunities).toHaveLength(2);
      expect(result.current.opportunities[0].id).toBe('TEST-001');
      expect(result.current.opportunities[1].id).toBe('TEST-002');
      expect(opportunitiesApi.createOpportunity).toHaveBeenCalledTimes(2);
    });

    it('should handle API errors when adding', async () => {
      const { result } = renderWithProvider();
      const newOpp = createMockOpportunity();
      const userEmail = 'user@example.com';

      vi.mocked(opportunitiesApi.createOpportunity).mockRejectedValue(new Error('API Error'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.addOpportunity(newOpp, userEmail);
        });
      }).rejects.toThrow();

      expect(result.current.opportunities).toHaveLength(0);
    });

    it('should reject invalid opportunity on add', async () => {
      const { result } = renderWithProvider();
      const invalidOpp = { id: 'TEST', title: 'X' } as Opportunity; // Title too short
      const userEmail = 'user@example.com';

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.addOpportunity(invalidOpp, userEmail);
        });
      }).rejects.toThrow(/Invalid opportunity data/);

      expect(result.current.opportunities).toHaveLength(0);
    });

    it('should throw error with clear message for validation failures', async () => {
      const { result } = renderWithProvider();
      const invalidOpp = createMockOpportunity({ tcv: -1000 }); // Negative TCV
      const userEmail = 'user@example.com';

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.addOpportunity(invalidOpp, userEmail);
        });
      }).rejects.toThrow(/Invalid opportunity data/);
    });
  });

  describe('Update Opportunity', () => {
    it('should update existing opportunity via Supabase API', async () => {
      const { result } = renderWithProvider();
      const originalOpp = createMockOpportunity();
      const userEmail = 'user@example.com';

      vi.mocked(opportunitiesApi.createOpportunity).mockResolvedValue(originalOpp);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addOpportunity(originalOpp, userEmail);
      });

      const updatedOpp = { ...originalOpp, title: 'Updated Title' };
      vi.mocked(opportunitiesApi.updateOpportunity).mockResolvedValue(updatedOpp);

      await act(async () => {
        await result.current.updateOpportunity(updatedOpp);
      });

      expect(result.current.opportunities[0].title).toBe('Updated Title');
      expect(opportunitiesApi.updateOpportunity).toHaveBeenCalledWith(originalOpp.id, updatedOpp);
    });

    it('should update selectedOpp if it was the updated opportunity', async () => {
      const { result } = renderWithProvider();
      const originalOpp = createMockOpportunity();
      const userEmail = 'user@example.com';

      vi.mocked(opportunitiesApi.createOpportunity).mockResolvedValue(originalOpp);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addOpportunity(originalOpp, userEmail);
        result.current.selectOpportunity(originalOpp);
      });

      expect(result.current.selectedOpp?.title).toBe('Test Opportunity');

      const updatedOpp = { ...originalOpp, title: 'Updated Title' };
      vi.mocked(opportunitiesApi.updateOpportunity).mockResolvedValue(updatedOpp);

      await act(async () => {
        await result.current.updateOpportunity(updatedOpp);
      });

      expect(result.current.selectedOpp?.title).toBe('Updated Title');
    });

    it('should reject invalid opportunity on update', async () => {
      const { result } = renderWithProvider();
      const validOpp = createMockOpportunity();
      const userEmail = 'user@example.com';

      vi.mocked(opportunitiesApi.createOpportunity).mockResolvedValue(validOpp);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addOpportunity(validOpp, userEmail);
      });

      const invalidUpdate = { ...validOpp, tcv: -5000 }; // Negative TCV

      await expect(async () => {
        await act(async () => {
          await result.current.updateOpportunity(invalidUpdate);
        });
      }).rejects.toThrow(/Invalid opportunity data/);

      // Original should remain unchanged
      expect(result.current.opportunities[0].tcv).toBe(1000000);
    });
  });

  describe('Delete Opportunity', () => {
    it('should remove opportunity from list via Supabase API', async () => {
      const { result } = renderWithProvider();
      const opp = createMockOpportunity();
      const userEmail = 'user@example.com';

      vi.mocked(opportunitiesApi.createOpportunity).mockResolvedValue(opp);
      vi.mocked(opportunitiesApi.deleteOpportunity).mockResolvedValue();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addOpportunity(opp, userEmail);
      });

      expect(result.current.opportunities).toHaveLength(1);

      await act(async () => {
        await result.current.deleteOpportunity('TEST-001');
      });

      expect(result.current.opportunities).toHaveLength(0);
      expect(opportunitiesApi.deleteOpportunity).toHaveBeenCalledWith('TEST-001');
    });

    it('should clear selectedOpp if deleted opportunity was selected', async () => {
      const { result } = renderWithProvider();
      const opp = createMockOpportunity();
      const userEmail = 'user@example.com';

      vi.mocked(opportunitiesApi.createOpportunity).mockResolvedValue(opp);
      vi.mocked(opportunitiesApi.deleteOpportunity).mockResolvedValue();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addOpportunity(opp, userEmail);
        result.current.selectOpportunity(opp);
      });

      expect(result.current.selectedOpp).not.toBeNull();

      await act(async () => {
        await result.current.deleteOpportunity('TEST-001');
      });

      expect(result.current.selectedOpp).toBeNull();
    });
  });

  describe('Select Opportunity', () => {
    it('should set selectedOpp', async () => {
      const { result } = renderWithProvider();
      const opp = createMockOpportunity();
      const userEmail = 'user@example.com';

      vi.mocked(opportunitiesApi.createOpportunity).mockResolvedValue(opp);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addOpportunity(opp, userEmail);
        result.current.selectOpportunity(opp);
      });

      expect(result.current.selectedOpp).toEqual(opp);
    });

    it('should deselect when passing null', async () => {
      const { result } = renderWithProvider();
      const opp = createMockOpportunity();
      const userEmail = 'user@example.com';

      vi.mocked(opportunitiesApi.createOpportunity).mockResolvedValue(opp);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addOpportunity(opp, userEmail);
        result.current.selectOpportunity(opp);
      });

      expect(result.current.selectedOpp).not.toBeNull();

      act(() => {
        result.current.selectOpportunity(null);
      });

      expect(result.current.selectedOpp).toBeNull();
    });
  });

  describe('Hook Error Handling', () => {
    it('should throw error when useOpportunities used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useOpportunities());
      }).toThrow('useOpportunities must be used within an OpportunitiesProvider');

      consoleSpy.mockRestore();
    });
  });
});
