import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Customer } from '../types';
import { validateCustomerArray } from '../lib/validation';
import { showToast } from '../lib/toast';

interface CustomerContextType {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id'>) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  getCustomer: (id: string) => Customer | undefined;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const INITIAL_CUSTOMERS: Customer[] = [];

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('raise_customers');
    if (!saved) return INITIAL_CUSTOMERS;

    try {
      const parsed = JSON.parse(saved);
      const validation = validateCustomerArray(parsed);

      if (!validation.success) {
        console.error('Invalid customer data in localStorage:', validation.error);
        return INITIAL_CUSTOMERS;
      }

      return validation.data;
    } catch (e) {
      console.error('Failed to parse customer data:', e);
      return INITIAL_CUSTOMERS;
    }
  });

  useEffect(() => {
    localStorage.setItem('raise_customers', JSON.stringify(customers));
  }, [customers]);

  const addCustomer = (customerData: Omit<Customer, 'id'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: crypto.randomUUID(),
    };

    setCustomers(prev => [...prev, newCustomer]);
    showToast.success(`Cliente "${newCustomer.name}" creato!`);
  };

  const updateCustomer = (updatedCustomer: Customer) => {
    setCustomers(prev =>
      prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c)
    );
    showToast.success(`Cliente "${updatedCustomer.name}" aggiornato!`);
  };

  const deleteCustomer = (id: string) => {
    const customer = customers.find(c => c.id === id);
    setCustomers(prev => prev.filter(c => c.id !== id));
    showToast.success(`Cliente "${customer?.name}" eliminato.`);
  };

  const getCustomer = (id: string) => {
    return customers.find(c => c.id === id);
  };

  return (
    <CustomerContext.Provider value={{
      customers,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      getCustomer,
    }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomers = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomers must be used within CustomerProvider');
  }
  return context;
};
