/**
 * Opportunity API Layer
 *
 * This module provides backward-compatible API functions that delegate
 * to the type-safe OpportunityRepository.
 *
 * @deprecated Prefer using `opportunityRepository` directly from '@/repositories'
 */

import { opportunityRepository } from '@/repositories';
import type { Opportunity } from '@/types';

/**
 * Fetch all opportunities for the current user
 * @deprecated Use opportunityRepository.findAll() directly
 */
export async function fetchOpportunities(): Promise<Opportunity[]> {
  return opportunityRepository.findAll();
}

/**
 * Create new opportunity
 * @deprecated Use opportunityRepository.create() directly
 */
export async function createOpportunity(
  opportunity: Opportunity,
  userEmail: string
): Promise<Opportunity> {
  return opportunityRepository.create(opportunity, userEmail);
}

/**
 * Update existing opportunity
 * @deprecated Use opportunityRepository.update() directly
 */
export async function updateOpportunity(
  id: string,
  updates: Partial<Opportunity>
): Promise<Opportunity> {
  return opportunityRepository.update(id, updates);
}

/**
 * Delete opportunity
 * @deprecated Use opportunityRepository.delete() directly
 */
export async function deleteOpportunity(id: string): Promise<void> {
  return opportunityRepository.delete(id);
}
