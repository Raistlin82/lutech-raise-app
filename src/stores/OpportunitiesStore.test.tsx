import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { OpportunitiesProvider, useOpportunities } from './OpportunitiesStore';
import type { Opportunity } from '../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

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
    // Clear localStorage before each test
    localStorage.clear();
    // Clear console.error mock
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with empty opportunities after loading', async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.opportunities).toEqual([]);
      expect(result.current.selectedOpp).toBeNull();
    });

    it('should load opportunities from localStorage on init', async () => {
      const mockOpp = createMockOpportunity();
      localStorage.setItem('raise_opportunities', JSON.stringify([mockOpp]));

      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.opportunities).toHaveLength(1);
      expect(result.current.opportunities[0].id).toBe('TEST-001');
    });

    it('should recalculate raiseLevel when loading from localStorage', async () => {
      const mockOpp = createMockOpportunity({
        raiseTcv: 15000000,
        raiseLevel: 'L6' // Wrong level for 15M
      });
      localStorage.setItem('raise_opportunities', JSON.stringify([mockOpp]));

      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // raiseLevel should be recalculated by calculateRaiseLevel
      expect(result.current.opportunities[0].raiseLevel).toBe('L2'); // 15M should be L2 (10M-20M)
    });

    it('should reject invalid localStorage data', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorage.setItem('raise_opportunities', JSON.stringify([{ invalid: 'data' }]));

      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.opportunities).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid opportunity data from service'), expect.anything());

      consoleSpy.mockRestore();
    });

    it('should handle corrupted localStorage gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorage.setItem('raise_opportunities', 'invalid json {{{');

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
    it('should add opportunity to the list', async () => {
      const { result } = renderWithProvider();
      const newOpp = createMockOpportunity();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addOpportunity(newOpp);
      });

      expect(result.current.opportunities).toHaveLength(1);
      expect(result.current.opportunities[0]).toEqual(newOpp);
    });

    it('should add multiple opportunities', async () => {
      const { result } = renderWithProvider();
      const opp1 = createMockOpportunity({ id: 'TEST-001' });
      const opp2 = createMockOpportunity({ id: 'TEST-002', title: 'Second Opportunity' });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addOpportunity(opp1);
      });

      await act(async () => {
        await result.current.addOpportunity(opp2);
      });

      expect(result.current.opportunities).toHaveLength(2);
      expect(result.current.opportunities[0].id).toBe('TEST-001');
      expect(result.current.opportunities[1].id).toBe('TEST-002');
    });

    it('should persist to localStorage when adding', async () => {
      const { result } = renderWithProvider();
      const newOpp = createMockOpportunity();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addOpportunity(newOpp);
      });

      const stored = localStorage.getItem('raise_opportunities');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('TEST-001');
    });

    it('should reject invalid opportunity on add', async () => {
      const { result } = renderWithProvider();
      const invalidOpp = { id: 'TEST', title: 'X' } as Opportunity; // Title too short

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.addOpportunity(invalidOpp);
        });
      }).rejects.toThrow(/Invalid opportunity data/);

      expect(result.current.opportunities).toHaveLength(0);
    });

    it('should throw error with clear message for validation failures', async () => {
      const { result } = renderWithProvider();
      const invalidOpp = createMockOpportunity({ tcv: -1000 }); // Negative TCV

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.addOpportunity(invalidOpp);
        });
      }).rejects.toThrow(/Invalid opportunity data/);
    });
  });

  describe('Update Opportunity', () => {
    it('should update existing opportunity', async () => {
      const { result } = renderWithProvider();
      const originalOpp = createMockOpportunity();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addOpportunity(originalOpp);
      });

      const updatedOpp = { ...originalOpp, title: 'Updated Title' };

      await act(async () => {
        await result.current.updateOpportunity(updatedOpp);
      });

      expect(result.current.opportunities[0].title).toBe('Updated Title');
    });

    it('should persist updates to localStorage', async () => {
      const { result } = renderWithProvider();
      const originalOpp = createMockOpportunity();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addOpportunity(originalOpp);
      });

      const updatedOpp = { ...originalOpp, clientName: 'Updated Client' };

      await act(async () => {
        await result.current.updateOpportunity(updatedOpp);
      });

      const stored = localStorage.getItem('raise_opportunities');
      const parsed = JSON.parse(stored!);
      expect(parsed[0].clientName).toBe('Updated Client');
    });

    it('should update selectedOpp if it was the updated opportunity', async () => {
      const { result } = renderWithProvider();
      const originalOpp = createMockOpportunity();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addOpportunity(originalOpp);
        result.current.selectOpportunity(originalOpp);
      });

      expect(result.current.selectedOpp?.title).toBe('Test Opportunity');

      const updatedOpp = { ...originalOpp, title: 'Updated Title' };

      await act(async () => {
        await result.current.updateOpportunity(updatedOpp);
      });

      expect(result.current.selectedOpp?.title).toBe('Updated Title');
    });

    it('should not affect selectedOpp if different opportunity was updated', async () => {
      const { result } = renderWithProvider();
      const opp1 = createMockOpportunity({ id: 'TEST-001' });
      const opp2 = createMockOpportunity({ id: 'TEST-002' });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addOpportunity(opp1);
      });

      await act(async () => {
        await result.current.addOpportunity(opp2);
        result.current.selectOpportunity(opp1);
      });

      const updatedOpp2 = { ...opp2, title: 'Updated Opp2' };

      await act(async () => {
        await result.current.updateOpportunity(updatedOpp2);
      });

      expect(result.current.selectedOpp?.id).toBe('TEST-001');
      expect(result.current.selectedOpp?.title).toBe('Test Opportunity');
    });

    it('should recalculate raiseLevel on update', async () => {
      const { result } = renderWithProvider();
      const originalOpp = createMockOpportunity({ tcv: 500000, raiseTcv: 500000, raiseLevel: 'L5' });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addOpportunity(originalOpp);
      });

      // Update to higher TCV should change raiseLevel
      const updatedOpp = { ...originalOpp, tcv: 15000000, raiseTcv: 15000000, raiseLevel: 'L2' as const };

      await act(async () => {
        await result.current.updateOpportunity(updatedOpp);
      });

      expect(result.current.opportunities[0].raiseLevel).toBe('L2');
    });

    it('should reject invalid opportunity on update', async () => {
      const { result } = renderWithProvider();
      const validOpp = createMockOpportunity();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addOpportunity(validOpp);
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
    it('should remove opportunity from list', async () => {
      const { result } = renderWithProvider();
      const opp = createMockOpportunity();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addOpportunity(opp);
      });

      expect(result.current.opportunities).toHaveLength(1);

      await act(async () => {
        await result.current.deleteOpportunity('TEST-001');
      });

      expect(result.current.opportunities).toHaveLength(0);
    });

    it('should update localStorage after deletion', async () => {
      const { result } = renderWithProvider();
      const opp = createMockOpportunity();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addOpportunity(opp);
      });

      await act(async () => {
        await result.current.deleteOpportunity('TEST-001');
      });

      const stored = localStorage.getItem('raise_opportunities');
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(0);
    });

    it('should clear selectedOpp if deleted opportunity was selected', async () => {
      const { result } = renderWithProvider();
      const opp = createMockOpportunity();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addOpportunity(opp);
        result.current.selectOpportunity(opp);
      });

      expect(result.current.selectedOpp).not.toBeNull();

      await act(async () => {
        await result.current.deleteOpportunity('TEST-001');
      });

      expect(result.current.selectedOpp).toBeNull();
    });

    it('should not affect selectedOpp if different opportunity was deleted', async () => {
      const { result } = renderWithProvider();
      const opp1 = createMockOpportunity({ id: 'TEST-001' });
      const opp2 = createMockOpportunity({ id: 'TEST-002' });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addOpportunity(opp1);
      });

      await act(async () => {
        await result.current.addOpportunity(opp2);
        result.current.selectOpportunity(opp1);
      });

      await act(async () => {
        await result.current.deleteOpportunity('TEST-002');
      });

      expect(result.current.selectedOpp?.id).toBe('TEST-001');
    });

    it('should handle deletion of non-existent opportunity gracefully', async () => {
      const { result } = renderWithProvider();
      const opp = createMockOpportunity({ id: 'TEST-001' });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addOpportunity(opp);
      });

      await act(async () => {
        await result.current.deleteOpportunity('NON-EXISTENT');
      });

      // Should not throw error and list should remain unchanged
      expect(result.current.opportunities).toHaveLength(1);
    });
  });

  describe('Select Opportunity', () => {
    it('should set selectedOpp', async () => {
      const { result } = renderWithProvider();
      const opp = createMockOpportunity();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addOpportunity(opp);
        result.current.selectOpportunity(opp);
      });

      expect(result.current.selectedOpp).toEqual(opp);
    });

    it('should deselect when passing null', async () => {
      const { result } = renderWithProvider();
      const opp = createMockOpportunity();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addOpportunity(opp);
        result.current.selectOpportunity(opp);
      });

      expect(result.current.selectedOpp).not.toBeNull();

      act(() => {
        result.current.selectOpportunity(null);
      });

      expect(result.current.selectedOpp).toBeNull();
    });

    it('should allow selecting different opportunities', async () => {
      const { result } = renderWithProvider();
      const opp1 = createMockOpportunity({ id: 'TEST-001' });
      const opp2 = createMockOpportunity({ id: 'TEST-002' });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addOpportunity(opp1);
      });

      await act(async () => {
        await result.current.addOpportunity(opp2);
        result.current.selectOpportunity(opp1);
      });

      expect(result.current.selectedOpp?.id).toBe('TEST-001');

      act(() => {
        result.current.selectOpportunity(opp2);
      });

      expect(result.current.selectedOpp?.id).toBe('TEST-002');
    });
  });

  describe('localStorage Persistence', () => {
    it('should persist opportunities across store recreations', async () => {
      const opp = createMockOpportunity();

      // First instance
      const { result: result1 } = renderWithProvider();

      await waitFor(() => {
        expect(result1.current.loading).toBe(false);
      });

      await act(async () => {
        await result1.current.addOpportunity(opp);
      });

      // Second instance (simulating page reload)
      const { result: result2 } = renderWithProvider();

      await waitFor(() => {
        expect(result2.current.loading).toBe(false);
      });

      expect(result2.current.opportunities).toHaveLength(1);
      expect(result2.current.opportunities[0].id).toBe('TEST-001');
    });

    it('should maintain data integrity across multiple operations', async () => {
      const { result } = renderWithProvider();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addOpportunity(createMockOpportunity({ id: 'TEST-001' }));
      });

      await act(async () => {
        await result.current.addOpportunity(createMockOpportunity({ id: 'TEST-002' }));
      });

      await act(async () => {
        await result.current.addOpportunity(createMockOpportunity({ id: 'TEST-003' }));
      });

      await act(async () => {
        await result.current.deleteOpportunity('TEST-002');
      });

      const stored = localStorage.getItem('raise_opportunities');
      const parsed = JSON.parse(stored!);

      expect(parsed).toHaveLength(2);
      expect(parsed.find((o: Opportunity) => o.id === 'TEST-001')).toBeTruthy();
      expect(parsed.find((o: Opportunity) => o.id === 'TEST-003')).toBeTruthy();
      expect(parsed.find((o: Opportunity) => o.id === 'TEST-002')).toBeFalsy();
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
