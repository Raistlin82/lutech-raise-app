/**
 * Services Index
 * Export all service modules for centralized access
 */

// Customer Service
export {
    getCustomers,
    getCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
} from './customerService';

// Opportunity Service
export {
    getOpportunities,
    getOpportunity,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
} from './opportunityService';

// Control Service
export {
    getControls,
    getControl,
    createControl,
    updateControl as updateControlConfig,
    deleteControl,
    resetControls,
} from './controlService';

// Re-export Supabase utilities
export { isSupabaseConfigured, supabase, getSupabase } from '../lib/supabase';
