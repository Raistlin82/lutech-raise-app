import { describe, it, expect, beforeEach, vi } from 'vitest';

// Unmock Supabase for this specific test file
vi.unmock('@/lib/supabase');

describe('Supabase Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export setSupabaseAuth function', async () => {
    const { setSupabaseAuth } = await import('@/lib/supabase');
    expect(setSupabaseAuth).toBeDefined();
    expect(typeof setSupabaseAuth).toBe('function');
  });

  it('should export clearSupabaseAuth function', async () => {
    const { clearSupabaseAuth } = await import('@/lib/supabase');
    expect(clearSupabaseAuth).toBeDefined();
    expect(typeof clearSupabaseAuth).toBe('function');
  });

  it('should handle auth functions when Supabase is not configured', async () => {
    const { setSupabaseAuth, clearSupabaseAuth, isSupabaseConfigured } = await import('@/lib/supabase');

    // Since env vars are not set in tests, functions should handle gracefully
    if (!isSupabaseConfigured()) {
      // Should not throw when Supabase is not configured
      await expect(setSupabaseAuth('mock-token')).resolves.not.toThrow();
      await expect(clearSupabaseAuth()).resolves.not.toThrow();
    }
  });

  it('should export getSupabase function with Database typing', async () => {
    const { getSupabase } = await import('@/lib/supabase');
    expect(getSupabase).toBeDefined();
    expect(typeof getSupabase).toBe('function');
  });
});
