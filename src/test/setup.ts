import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';

// Mock Supabase to ensure tests use localStorage fallback
vi.mock('../lib/supabase', () => ({
  supabase: null,
  isSupabaseConfigured: () => false,
  getSupabase: () => {
    throw new Error('Supabase is not configured in tests');
  },
  setSupabaseAuth: async () => {
    // No-op in tests
  },
  clearSupabaseAuth: async () => {
    // No-op in tests
  },
}));

// Mock localStorage for tests - use a class-based approach for proper reset
class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value.toString();
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

const localStorageMock = new LocalStorageMock();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Clear localStorage before each test to ensure isolation
beforeEach(() => {
  localStorageMock.clear();
});
