/**
 * Repository Layer - Type-safe data access
 *
 * This module provides centralized, type-safe access to data storage,
 * abstracting away the underlying storage mechanism (Supabase or localStorage).
 */

export { opportunityRepository, OpportunityRepository } from './opportunityRepository';
export { customerRepository, CustomerRepository } from './customerRepository';
export {
  isTestMode,
  assertSupabaseClient,
  getTypedClient,
  RepositoryError
} from './baseRepository';
export type { TypedSupabaseClient } from './baseRepository';
