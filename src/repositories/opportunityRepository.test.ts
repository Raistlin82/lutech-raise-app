import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpportunityRepository } from './opportunityRepository';
import * as baseRepo from './baseRepository';

describe('OpportunityRepository', () => {
  let repo: OpportunityRepository;
  let mockClient: any;
  let mockFrom: any;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Setup mock chain
    mockFrom = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    };

    mockClient = {
      from: vi.fn().mockReturnValue(mockFrom),
    };

    repo = new OpportunityRepository();
  });

  describe('findAll', () => {
    it('should return opportunities from localStorage in test mode', async () => {
      vi.spyOn(baseRepo, 'isTestMode').mockReturnValue(true);
      const mockOpps = [{ id: 'opp-1', title: 'Test' }];
      localStorage.setItem('raise_opportunities', JSON.stringify(mockOpps));

      const result = await repo.findAll();
      expect(result).toEqual(mockOpps);
    });

    it('should return opportunities from Supabase when configured', async () => {
      vi.spyOn(baseRepo, 'isTestMode').mockReturnValue(false);
      vi.spyOn(baseRepo, 'getTypedClient').mockReturnValue(mockClient);

      const mockData = [
        { id: 'opp-1', title: 'Test', tcv: 100000, current_phase: 'Planning', raise_level: 'L6' }
      ];
      mockFrom.order.mockResolvedValue({ data: mockData, error: null });

      const result = await repo.findAll();
      expect(mockClient.from).toHaveBeenCalledWith('opportunities');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('opp-1');
    });

    it('should return empty array when Supabase not configured', async () => {
      vi.spyOn(baseRepo, 'isTestMode').mockReturnValue(false);
      vi.spyOn(baseRepo, 'getTypedClient').mockReturnValue(null);

      const result = await repo.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should find opportunity by ID from localStorage in test mode', async () => {
      vi.spyOn(baseRepo, 'isTestMode').mockReturnValue(true);
      const mockOpps = [{ id: 'opp-1', title: 'Test' }];
      localStorage.setItem('raise_opportunities', JSON.stringify(mockOpps));

      const result = await repo.findById('opp-1');
      expect(result?.id).toBe('opp-1');
    });

    it('should return null when not found', async () => {
      vi.spyOn(baseRepo, 'isTestMode').mockReturnValue(true);
      localStorage.setItem('raise_opportunities', '[]');

      const result = await repo.findById('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create opportunity in localStorage in test mode', async () => {
      vi.spyOn(baseRepo, 'isTestMode').mockReturnValue(true);
      localStorage.setItem('raise_opportunities', '[]');

      const newOpp = { id: 'opp-new', title: 'New Opp', tcv: 50000 };
      const result = await repo.create(newOpp as any, 'test@example.com');

      expect(result.id).toBe('opp-new');
      const stored = JSON.parse(localStorage.getItem('raise_opportunities') || '[]');
      expect(stored.length).toBe(1);
    });
  });
});
