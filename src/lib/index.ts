/**
 * Library exports
 * Central export point for utility functions and modules
 */

// Supabase
export { supabase, isSupabaseConfigured } from './supabase';
export {
  isUsingSupabase,
  isNotFoundError,
  getFromLocalStorage,
  saveToLocalStorage,
} from './supabaseUtils';

// Business Logic
export { calculateRaiseLevel, isFastTrackEligible } from './raiseLogic';
export {
  parseLegacyCondition,
  evaluateCondition,
  type RuleValue,
  type OperatorName,
  type ConditionRule,
  type CompoundCondition,
} from './ruleEngine';

// Validation
export {
  OpportunitySchema,
  OpportunityUpdateSchema,
  validateOpportunity,
  validateOpportunityUpdate,
  StorageOpportunitiesSchema,
  validateStorageData,
  CustomerSchema,
  validateCustomer,
  validateCustomerArray,
  type ValidatedOpportunity,
} from './validation';

// UI Utilities
export { showToast } from './toast';

// Auth
export { MockAuthProvider, useMockAuth } from './mockAuth';
