import { describe, it, expect, vi } from 'vitest';
import {
  fetchOpportunities,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity
} from '@/api/opportunities';
import type { Opportunity } from '@/types';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [],
          error: null
        })),
        eq: vi.fn(() => ({
          data: [],
          error: null
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'test-id' },
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: 'test-id' },
              error: null
            }))
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          error: null
        }))
      }))
    }))
  })
}));

describe('Opportunities API', () => {
  it('should fetch opportunities for current user', async () => {
    const opportunities = await fetchOpportunities();
    expect(Array.isArray(opportunities)).toBe(true);
  });

  it('should create new opportunity with user email', async () => {
    const newOpp: Partial<Opportunity> = {
      title: 'Test Opportunity',
      tcv: 500000,
      firstMarginPercent: 25
    };

    const created = await createOpportunity(newOpp as Opportunity, 'user@example.com');
    expect(created).toHaveProperty('id');
  });

  it('should update existing opportunity', async () => {
    const updated = await updateOpportunity('test-id', { title: 'Updated' });
    expect(updated).toHaveProperty('id');
  });

  it('should delete opportunity', async () => {
    await expect(deleteOpportunity('test-id')).resolves.not.toThrow();
  });
});
