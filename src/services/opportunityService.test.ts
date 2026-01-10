/**
 * OpportunityService Tests
 * Tests CRUD operations for opportunities with localStorage fallback
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  isUsingSupabase,
} from './opportunityService';
import type { Opportunity, Phase } from '../types';

// Mock supabase module
vi.mock('../lib/supabase', () => ({
  supabase: null,
  isSupabaseConfigured: () => false,
}));

const STORAGE_KEY = 'raise_opportunities';

const createMockOpportunity = (overrides: Partial<Opportunity> = {}): Opportunity => ({
  id: 'opp-123',
  title: 'Test Opportunity',
  customerId: 'cust-123',
  clientName: 'Test Client',
  industry: 'Technology',
  tcv: 500000,
  raiseTcv: 500000,
  marginPercent: 20,
  currentPhase: 'Planning' as Phase,
  hasKcpDeviations: false,
  isFastTrack: false,
  isRti: false,
  isPublicSector: false,
  raiseLevel: 'L6',
  deviations: [],
  checkpoints: {},
  ...overrides,
});

describe('OpportunityService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('isUsingSupabase', () => {
    it('should return false when Supabase is not configured', () => {
      expect(isUsingSupabase()).toBe(false);
    });
  });

  describe('getOpportunities - localStorage fallback', () => {
    it('should return empty array when no opportunities exist', async () => {
      const opportunities = await getOpportunities();
      expect(opportunities).toEqual([]);
    });

    it('should return opportunities from localStorage', async () => {
      const mockOpp = createMockOpportunity();
      localStorage.setItem(STORAGE_KEY, JSON.stringify([mockOpp]));

      const opportunities = await getOpportunities();
      expect(opportunities).toHaveLength(1);
      expect(opportunities[0].id).toBe(mockOpp.id);
      expect(opportunities[0].title).toBe(mockOpp.title);
    });

    it('should return multiple opportunities', async () => {
      const mockOpps = [
        createMockOpportunity({ id: 'opp-1', title: 'Opp 1' }),
        createMockOpportunity({ id: 'opp-2', title: 'Opp 2' }),
        createMockOpportunity({ id: 'opp-3', title: 'Opp 3' }),
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockOpps));

      const opportunities = await getOpportunities();
      expect(opportunities).toHaveLength(3);
    });
  });

  describe('getOpportunity - localStorage fallback', () => {
    it('should return null when opportunity not found', async () => {
      const opportunity = await getOpportunity('non-existent');
      expect(opportunity).toBeNull();
    });

    it('should return the correct opportunity by ID', async () => {
      const mockOpps = [
        createMockOpportunity({ id: 'opp-1', title: 'Opp 1' }),
        createMockOpportunity({ id: 'opp-2', title: 'Opp 2' }),
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockOpps));

      const opportunity = await getOpportunity('opp-2');
      expect(opportunity).not.toBeNull();
      expect(opportunity?.id).toBe('opp-2');
      expect(opportunity?.title).toBe('Opp 2');
    });

    it('should return null from empty localStorage', async () => {
      const opportunity = await getOpportunity('opp-1');
      expect(opportunity).toBeNull();
    });
  });

  describe('createOpportunity - localStorage fallback', () => {
    it('should create a new opportunity in localStorage', async () => {
      const newOpp = createMockOpportunity({ id: 'new-opp', title: 'New Opportunity' });

      const created = await createOpportunity(newOpp);
      expect(created.id).toBe('new-opp');

      // Verify it's in localStorage
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe('new-opp');
    });

    it('should add to existing opportunities', async () => {
      const existingOpp = createMockOpportunity({ id: 'existing', title: 'Existing' });
      localStorage.setItem(STORAGE_KEY, JSON.stringify([existingOpp]));

      const newOpp = createMockOpportunity({ id: 'new-opp', title: 'New' });
      await createOpportunity(newOpp);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored).toHaveLength(2);
    });

    it('should preserve opportunity properties', async () => {
      const newOpp = createMockOpportunity({
        id: 'prop-test',
        title: 'Property Test',
        tcv: 1000000,
        hasKcpDeviations: true,
        currentPhase: 'ATP' as Phase,
      });

      await createOpportunity(newOpp);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored[0].tcv).toBe(1000000);
      expect(stored[0].hasKcpDeviations).toBe(true);
      expect(stored[0].currentPhase).toBe('ATP');
    });
  });

  describe('updateOpportunity - localStorage fallback', () => {
    it('should update an existing opportunity', async () => {
      const original = createMockOpportunity({ id: 'update-test', title: 'Original' });
      localStorage.setItem(STORAGE_KEY, JSON.stringify([original]));

      const updated = { ...original, title: 'Updated Title', tcv: 750000 };
      const result = await updateOpportunity(updated);

      expect(result.title).toBe('Updated Title');

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored[0].title).toBe('Updated Title');
      expect(stored[0].tcv).toBe(750000);
    });

    it('should throw error when opportunity not found', async () => {
      const nonExistent = createMockOpportunity({ id: 'non-existent' });

      await expect(updateOpportunity(nonExistent)).rejects.toThrow('Opportunity not found');
    });

    it('should update phase correctly', async () => {
      const original = createMockOpportunity({
        id: 'phase-test',
        currentPhase: 'Planning' as Phase
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify([original]));

      const updated = { ...original, currentPhase: 'ATP' as Phase };
      await updateOpportunity(updated);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored[0].currentPhase).toBe('ATP');
    });

    it('should update KCP deviations flag', async () => {
      const original = createMockOpportunity({
        id: 'kcp-test',
        hasKcpDeviations: false
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify([original]));

      const updated = { ...original, hasKcpDeviations: true };
      await updateOpportunity(updated);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored[0].hasKcpDeviations).toBe(true);
    });
  });

  describe('deleteOpportunity - localStorage fallback', () => {
    it('should delete an existing opportunity', async () => {
      const mockOpps = [
        createMockOpportunity({ id: 'opp-1' }),
        createMockOpportunity({ id: 'opp-2' }),
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockOpps));

      await deleteOpportunity('opp-1');

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe('opp-2');
    });

    it('should handle deletion of non-existent opportunity gracefully', async () => {
      const mockOpp = createMockOpportunity({ id: 'opp-1' });
      localStorage.setItem(STORAGE_KEY, JSON.stringify([mockOpp]));

      // Should not throw
      await deleteOpportunity('non-existent');

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored).toHaveLength(1); // Original still exists
    });

    it('should handle deletion from empty localStorage', async () => {
      // Should not throw
      await deleteOpportunity('any-id');

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored).toHaveLength(0);
    });

    it('should delete all opportunities one by one', async () => {
      const mockOpps = [
        createMockOpportunity({ id: 'opp-1' }),
        createMockOpportunity({ id: 'opp-2' }),
        createMockOpportunity({ id: 'opp-3' }),
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockOpps));

      await deleteOpportunity('opp-1');
      await deleteOpportunity('opp-2');
      await deleteOpportunity('opp-3');

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      expect(stored).toHaveLength(0);
    });
  });

  describe('Complex scenarios', () => {
    it('should handle CRUD lifecycle', async () => {
      // Create
      const newOpp = createMockOpportunity({ id: 'lifecycle-test', title: 'Initial' });
      await createOpportunity(newOpp);

      // Read
      const retrieved = await getOpportunity('lifecycle-test');
      expect(retrieved?.title).toBe('Initial');

      // Update
      const updated = { ...newOpp, title: 'Updated' };
      await updateOpportunity(updated);

      const retrievedAfterUpdate = await getOpportunity('lifecycle-test');
      expect(retrievedAfterUpdate?.title).toBe('Updated');

      // Delete
      await deleteOpportunity('lifecycle-test');
      const retrievedAfterDelete = await getOpportunity('lifecycle-test');
      expect(retrievedAfterDelete).toBeNull();
    });

    it('should preserve opportunity with checkpoints', async () => {
      const oppWithCheckpoints = createMockOpportunity({
        id: 'checkpoints-test',
        checkpoints: {
          Planning: [
            { id: 'cp-1', label: 'Check 1', checked: true, required: true },
            { id: 'cp-2', label: 'Check 2', checked: false, required: false },
          ],
          ATP: [
            { id: 'cp-3', label: 'Check 3', checked: false, required: true },
          ],
        },
      });

      await createOpportunity(oppWithCheckpoints);
      const retrieved = await getOpportunity('checkpoints-test');

      expect(retrieved?.checkpoints?.Planning).toHaveLength(2);
      expect(retrieved?.checkpoints?.ATP).toHaveLength(1);
      expect(retrieved?.checkpoints?.Planning?.[0].checked).toBe(true);
    });

    it('should preserve opportunity with deviations', async () => {
      const oppWithDeviations = createMockOpportunity({
        id: 'deviations-test',
        hasKcpDeviations: true,
        deviations: [
          { id: 'dev-1', type: 'Legal', description: 'Liability deviation' },
          { id: 'dev-2', type: 'Financial', description: 'Payment terms', expertOpinion: 'Green' },
        ],
      });

      await createOpportunity(oppWithDeviations);
      const retrieved = await getOpportunity('deviations-test');

      expect(retrieved?.deviations).toHaveLength(2);
      expect(retrieved?.deviations?.[0].type).toBe('Legal');
      expect(retrieved?.deviations?.[1].expertOpinion).toBe('Green');
    });

    it('should handle Fast Track opportunity', async () => {
      const fastTrackOpp = createMockOpportunity({
        id: 'fast-track-test',
        tcv: 200000, // Below 250k
        isFastTrack: true,
      });

      await createOpportunity(fastTrackOpp);
      const retrieved = await getOpportunity('fast-track-test');

      expect(retrieved?.isFastTrack).toBe(true);
      expect(retrieved?.tcv).toBe(200000);
    });
  });
});
