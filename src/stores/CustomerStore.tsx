import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Customer } from '../types';
import { validateCustomerArray } from '../lib/validation';
import { showToast } from '../lib/toast';
import * as customerService from '../services/customerService';

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

  // Load customers from service on mount
  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await customerService.getCustomers();

      // Validate loaded data
      const validation = validateCustomerArray(data);
      if (!validation.success) {
        console.error('Invalid customer data from service:', validation.error);
        setCustomers(INITIAL_CUSTOMERS);
        return;
      }

      setCustomers(validation.data);
    } catch (error) {
      console.error('Failed to load customers:', error);
      showToast.error('Errore nel caricamento clienti');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const refreshCustomers = useCallback(async () => {
    await loadCustomers();
  }, [loadCustomers]);

  const addCustomer = async (customerData: Omit<Customer, 'id'>): Promise<string> => {
    try {
      const newCustomer = await customerService.createCustomer(customerData);
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
      await customerService.updateCustomer(updatedCustomer);
      setCustomers(prev =>
        prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c)
      );
      showToast.success(`Cliente "${updatedCustomer.name}" aggiornato!`);
    } catch (error) {
      console.error('Failed to update customer:', error);
      showToast.error('Errore nell\'aggiornamento del cliente');
      throw error;
    }
  };

  const deleteCustomer = async (id: string): Promise<void> => {
    const customer = customers.find(c => c.id === id);
    try {
      await customerService.deleteCustomer(id);
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
