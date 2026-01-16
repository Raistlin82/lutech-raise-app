import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assertSupabaseClient, isTestMode } from './baseRepository';
import * as supabaseModule from '@/lib/supabase';

describe('baseRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('isTestMode', () => {
    it('should return true when testMode is set in localStorage', () => {
      localStorage.setItem('testMode', 'true');
      expect(isTestMode()).toBe(true);
    });

    it('should return false when testMode is not set', () => {
      expect(isTestMode()).toBe(false);
    });
  });

  describe('assertSupabaseClient', () => {
    it('should throw when Supabase is not configured', () => {
      vi.spyOn(supabaseModule, 'getSupabaseClient').mockReturnValue(null);

      expect(() => assertSupabaseClient()).toThrow('Supabase client is not configured');
    });

    it('should return client when configured', () => {
      const mockClient = { from: vi.fn() };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(supabaseModule, 'getSupabaseClient').mockReturnValue(mockClient as any);

      const result = assertSupabaseClient();
      expect(result).toBe(mockClient);
    });
  });
});
