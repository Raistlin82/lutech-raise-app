/**
 * Customer API Layer
 *
 * This module provides backward-compatible API functions that delegate
 * to the type-safe CustomerRepository.
 *
 * @deprecated Prefer using `customerRepository` directly from '@/repositories'
 */

import { customerRepository } from '@/repositories';
import type { Customer } from '@/types';

/**
 * Fetch all customers
 * @deprecated Use customerRepository.findAll() directly
 */
export async function fetchCustomers(): Promise<Customer[]> {
  return customerRepository.findAll();
}

/**
 * Create new customer
 * @deprecated Use customerRepository.create() directly
 */
export async function createCustomer(customer: Customer): Promise<Customer> {
  return customerRepository.create(customer);
}

/**
 * Update existing customer
 * @deprecated Use customerRepository.update() directly
 */
export async function updateCustomer(
  id: string,
  updates: Partial<Customer>
): Promise<Customer> {
  return customerRepository.update(id, updates);
}

/**
 * Delete customer
 * @deprecated Use customerRepository.delete() directly
 */
export async function deleteCustomer(id: string): Promise<void> {
  return customerRepository.delete(id);
}
