import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Customer } from '../types';
import { showToast } from '../lib/toast';
import {
  fetchCustomers,
  createCustomer as apiCreateCustomer,
  updateCustomer as apiUpdateCustomer,
  deleteCustomer as apiDeleteCustomer,
} from '@/api/customers';

interface CustomerContextType {
  customers: Customer[];
  loading: boolean;
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<string>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  getCustomer: (id: string) => Customer | undefined;
  refreshCustomers: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const INITIAL_CUSTOMERS: Customer[] = [];

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [loading, setLoading] = useState(true);

  // Load customers from Supabase API on mount
  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
      showToast.error('Errore nel caricamento clienti');
      setCustomers(INITIAL_CUSTOMERS);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCustomers = useCallback(async () => {
    await loadCustomers();
  }, [loadCustomers]);

  const addCustomer = async (customerData: Omit<Customer, 'id'>): Promise<string> => {
    try {
      // Create a temporary customer object with an id for the API call
      const tempCustomer: Customer = {
        id: crypto.randomUUID(),
        ...customerData
      };
      const newCustomer = await apiCreateCustomer(tempCustomer);
      setCustomers(prev => [...prev, newCustomer]);
      showToast.success(`Cliente "${newCustomer.name}" creato!`);
      return newCustomer.id;
    } catch (error) {
      console.error('Failed to add customer:', error);
      showToast.error('Errore nella creazione del cliente');
      throw error;
    }
  };

  const updateCustomer = async (updatedCustomer: Customer): Promise<void> => {
    try {
      const updated = await apiUpdateCustomer(updatedCustomer.id, updatedCustomer);
      setCustomers(prev =>
        prev.map(c => c.id === updated.id ? updated : c)
      );
      showToast.success(`Cliente "${updated.name}" aggiornato!`);
    } catch (error) {
      console.error('Failed to update customer:', error);
      showToast.error('Errore nell\'aggiornamento del cliente');
      throw error;
    }
  };

  const deleteCustomer = async (id: string): Promise<void> => {
    const customer = customers.find(c => c.id === id);
    try {
      await apiDeleteCustomer(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
      showToast.success(`Cliente "${customer?.name}" eliminato.`);
    } catch (error) {
      console.error('Failed to delete customer:', error);
      showToast.error('Errore nell\'eliminazione del cliente');
      throw error;
    }
  };

  const getCustomer = (id: string) => {
    return customers.find(c => c.id === id);
  };

  return (
    <CustomerContext.Provider value={{
      customers,
      loading,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      getCustomer,
      refreshCustomers,
    }}>
      {children}
    </CustomerContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCustomers = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomers must be used within CustomerProvider');
  }
  return context;
};
