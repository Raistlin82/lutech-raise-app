/**
 * Supabase Utilities
 * Shared utilities for Supabase operations across all services
 */
import { isSupabaseConfigured } from './supabase';

/**
 * Check if the application is using Supabase or localStorage fallback
 * This is the single source of truth for all services
 */
export function isUsingSupabase(): boolean {
  return isSupabaseConfigured();
}

/**
 * Check if a Supabase error is a "not found" error (PGRST116)
 * @param error - Supabase PostgrestError or similar error object
 */
export function isNotFoundError(error: { code?: string } | null | undefined): boolean {
  return error?.code === 'PGRST116';
}

/**
 * Get data from localStorage with type safety
 * @param key - Storage key
 * @param defaultValue - Default value if key doesn't exist or parsing fails
 */
export function getFromLocalStorage<T>(key: string, defaultValue: T[] = []): T[] {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    console.warn(`Failed to parse localStorage key "${key}", using default value`);
    return defaultValue;
  }
}

/**
 * Save data to localStorage with type safety
 * @param key - Storage key
 * @param data - Data to save
 */
export function saveToLocalStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save to localStorage key "${key}":`, error);
  }
}
