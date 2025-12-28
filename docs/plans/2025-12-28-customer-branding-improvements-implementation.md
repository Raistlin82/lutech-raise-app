# Customer Management, Branding & Controls Ordering Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add customer management system with auto-populated fields, Lutech branding, and numbered checkpoint ordering to RAISE App v1.1.0

**Architecture:** React Context pattern for CustomerStore, foreign key relationship (customerId) with backward-compatible migration, dual customer entry (dedicated page + quick add modal), numbered controls grouped by phase

**Tech Stack:** React 19, TypeScript, Zod validation, localStorage, Tailwind CSS, Lucide icons

**Related Design:** `docs/plans/2025-12-28-customer-branding-improvements-design.md`

---

## Implementation Phases

1. **Foundation** - Types, validation, CustomerStore
2. **Customer Management** - Customer page, modal, CRUD operations
3. **Opportunity Integration** - Forms, dropdown, quick add, migration
4. **Branding** - Logo assets, sidebar, footer
5. **Controls Ordering** - Add order field, update displays
6. **Testing** - Unit, integration, E2E
7. **Documentation** - README, User Guide, CHANGELOG

---

## Task 1: Type Definitions & Industry Enum

**Files:**
- Modify: `src/types/index.ts:117` (after ControlConfig interface)

**Step 1: Add Industry type and Customer interface**

```typescript
// Industry enum (10 predefined sectors)
export type Industry =
  | 'Technology'
  | 'Manufacturing'
  | 'Finance'
  | 'Healthcare'
  | 'Retail'
  | 'Energy'
  | 'Transportation'
  | 'Public Administration'
  | 'Telecommunications'
  | 'Consulting';

// Customer entity
export interface Customer {
  id: string;              // UUID
  name: string;            // Min 2, max 200 chars
  industry: Industry;      // Enum
  isPublicSector: boolean; // Public Administration flag
}
```

**Step 2: Update ControlConfig to add order field**

```typescript
export interface ControlConfig {
    id: string;
    label: string;
    description: string;
    phase: 'Planning' | 'ATP' | 'ATS' | 'ATC' | 'Handover' | 'ALL';
    order: number; // NEW: Position within phase (1, 2, 3...)
    isMandatory: boolean;
    templateRef?: string;
    actionType?: 'document' | 'email' | 'notification' | 'task';
    condition?: string;
    detailedDescription?: string;
    folderPath?: string;
    templateLinks?: TemplateLink[];
    mandatoryNotes?: string;
}
```

**Step 3: Verify types compile**

Run: `npm run build`
Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add Customer interface and Industry enum

- Add Industry type with 10 predefined sectors
- Add Customer interface (id, name, industry, isPublicSector)
- Add order field to ControlConfig for numbering
- Prepare types for customer management system"
```

---

## Task 2: Customer Validation Schema

**Files:**
- Modify: `src/lib/validation.ts` (add after existing schemas)

**Step 1: Add Zod schema for Customer**

```typescript
import { z } from 'zod';
import type { Customer, Industry } from '../types';

export const CustomerSchema = z.object({
  id: z.string().uuid('ID must be valid UUID'),
  name: z.string()
    .min(2, 'Customer name must be at least 2 characters')
    .max(200, 'Customer name must be less than 200 characters')
    .trim(),
  industry: z.enum([
    'Technology',
    'Manufacturing',
    'Finance',
    'Healthcare',
    'Retail',
    'Energy',
    'Transportation',
    'Public Administration',
    'Telecommunications',
    'Consulting'
  ], {
    errorMap: () => ({ message: 'Invalid industry' })
  }),
  isPublicSector: z.boolean(),
});

export const validateCustomer = (data: unknown) => {
  return CustomerSchema.safeParse(data);
};

export const validateCustomerArray = (data: unknown) => {
  return z.array(CustomerSchema).safeParse(data);
};
```

**Step 2: Verify validation compiles**

Run: `npm run build`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/validation.ts
git commit -m "feat: add Customer validation schema

- Add Zod schema for Customer entity
- Add validateCustomer and validateCustomerArray helpers
- Validate name (2-200 chars), industry (enum), isPublicSector (boolean)"
```

---

## Task 3: CustomerStore Context & Provider

**Files:**
- Create: `src/stores/CustomerStore.tsx`

**Step 1: Write failing test first**

Create: `src/stores/CustomerStore.test.tsx`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CustomerProvider, useCustomers } from './CustomerStore';
import type { Customer } from '../types';

describe('CustomerStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should start with empty customers', () => {
    const { result } = renderHook(() => useCustomers(), {
      wrapper: CustomerProvider
    });

    expect(result.current.customers).toEqual([]);
  });

  it('should add a customer', () => {
    const { result } = renderHook(() => useCustomers(), {
      wrapper: CustomerProvider
    });

    const newCustomer: Omit<Customer, 'id'> = {
      name: 'Acme Corp',
      industry: 'Technology',
      isPublicSector: false,
    };

    act(() => {
      result.current.addCustomer(newCustomer);
    });

    expect(result.current.customers).toHaveLength(1);
    expect(result.current.customers[0].name).toBe('Acme Corp');
    expect(result.current.customers[0].id).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test CustomerStore`
Expected: FAIL - CustomerStore module not found

**Step 3: Implement CustomerStore**

Create: `src/stores/CustomerStore.tsx`

```typescript
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
```

**Step 4: Run test to verify it passes**

Run: `npm test CustomerStore`
Expected: PASS

**Step 5: Commit**

```bash
git add src/stores/CustomerStore.tsx src/stores/CustomerStore.test.tsx
git commit -m "feat: implement CustomerStore with localStorage persistence

- Add CustomerProvider with React Context
- CRUD operations: addCustomer, updateCustomer, deleteCustomer
- Auto-save to localStorage (raise_customers key)
- Validation on load with error handling
- Unit tests for basic operations"
```

---

## Task 4: Integrate CustomerProvider in App

**Files:**
- Modify: `src/App.tsx`

**Step 1: Import and wrap App with CustomerProvider**

```typescript
import { OpportunitiesProvider } from './stores/OpportunitiesStore';
import { SettingsProvider } from './stores/SettingsStore';
import { CustomerProvider } from './stores/CustomerStore'; // NEW

function App() {
  return (
    <SettingsProvider>
      <CustomerProvider> {/* NEW */}
        <OpportunitiesProvider>
          <Router>
            {/* ... routes */}
          </Router>
        </OpportunitiesProvider>
      </CustomerProvider>
    </SettingsProvider>
  );
}
```

**Step 2: Verify app runs**

Run: `npm run dev`
Expected: App loads without errors

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: integrate CustomerProvider in app root

- Wrap app with CustomerProvider
- Ensure CustomerStore available throughout app"
```

---

## Task 5: Customer Page - Table Component

**Files:**
- Create: `src/components/customers/index.tsx`

**Step 1: Create basic customer page with table**

```typescript
import React, { useState } from 'react';
import { useCustomers } from '../../stores/CustomerStore';
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react';
import type { Customer } from '../../types';

export const CustomersPage = () => {
  const { customers } = useCustomers();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Building2 size={32} />
            Customers
          </h1>
          <p className="text-slate-600 mt-2">
            Manage your customer database
          </p>
        </div>

        {/* Actions Bar */}
        <div className="mb-6 flex justify-between items-center">
          <input
            type="search"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border rounded-lg w-64"
          />
          <button
            onClick={() => {/* TODO: Open add modal */}}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={20} />
            Add Customer
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Industry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Public Sector
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No customers found. Click "Add Customer" to create one.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                      {customer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {customer.industry}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.isPublicSector ? (
                        <span className="text-green-600 font-semibold">✓</span>
                      ) : (
                        <span className="text-slate-300">✗</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {/* TODO: Open edit modal */}}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => {/* TODO: Open delete confirmation */}}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
```

**Step 2: Add route for customer page**

Modify: `src/App.tsx`

```typescript
import { CustomersPage } from './components/customers';

// In routes:
<Route path="/customers" element={<CustomersPage />} />
```

**Step 3: Test manually**

Run: `npm run dev`
Navigate to: `http://localhost:5173/customers`
Expected: Empty customer table displays

**Step 4: Commit**

```bash
git add src/components/customers/index.tsx src/App.tsx
git commit -m "feat: add customer page with table layout

- Create CustomersPage component with table
- Add search filter (client-side)
- Add placeholder buttons for add/edit/delete
- Add route /customers
- Display industry badges and PA status"
```

---

## Task 6: Customer Modal Component

**Files:**
- Create: `src/components/customers/CustomerModal.tsx`

**Step 1: Create CustomerModal component**

```typescript
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Customer, Industry } from '../../types';
import { useCustomers } from '../../stores/CustomerStore';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer; // Undefined = Add mode, Defined = Edit mode
}

const INDUSTRIES: Industry[] = [
  'Technology',
  'Manufacturing',
  'Finance',
  'Healthcare',
  'Retail',
  'Energy',
  'Transportation',
  'Public Administration',
  'Telecommunications',
  'Consulting',
];

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
}) => {
  const { addCustomer, updateCustomer } = useCustomers();
  const [formData, setFormData] = useState({
    name: '',
    industry: 'Technology' as Industry,
    isPublicSector: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        industry: customer.industry,
        isPublicSector: customer.isPublicSector,
      });
    } else {
      setFormData({
        name: '',
        industry: 'Technology',
        isPublicSector: false,
      });
    }
    setErrors({});
  }, [customer, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.length > 200) {
      newErrors.name = 'Name must be less than 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    if (customer) {
      // Edit mode
      updateCustomer({
        ...customer,
        ...formData,
      });
    } else {
      // Add mode
      addCustomer(formData);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">
            {customer ? 'Edit Customer' : 'Add Customer'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.name ? 'border-red-500' : 'border-slate-300'
              }`}
              placeholder="Acme Corporation"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Industry *
            </label>
            <select
              value={formData.industry}
              onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value as Industry }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              {INDUSTRIES.map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>

          {/* Public Sector */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublicSector"
              checked={formData.isPublicSector}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublicSector: e.target.checked }))}
              className="h-4 w-4 text-blue-600 rounded border-slate-300"
            />
            <label htmlFor="isPublicSector" className="ml-2 text-sm text-slate-700">
              Public Sector
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {customer ? 'Save Changes' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

**Step 2: Integrate modal in CustomersPage**

Modify: `src/components/customers/index.tsx`

```typescript
import { CustomerModal } from './CustomerModal';

export const CustomersPage = () => {
  // ... existing code
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();

  const openAddModal = () => {
    setEditingCustomer(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  // Update button handlers:
  // Add: onClick={openAddModal}
  // Edit: onClick={() => openEditModal(customer)}

  return (
    <div className="p-8">
      {/* ... existing layout */}

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={editingCustomer}
      />
    </div>
  );
};
```

**Step 3: Test add/edit customer**

Run: `npm run dev`
1. Click "Add Customer" → modal opens
2. Fill form, submit → customer created
3. Click edit icon → modal pre-filled
4. Update, submit → customer updated

Expected: PASS - customers persist in localStorage

**Step 4: Commit**

```bash
git add src/components/customers/CustomerModal.tsx src/components/customers/index.tsx
git commit -m "feat: add CustomerModal for add/edit operations

- Create modal component with form validation
- Support both add and edit modes
- Validate name (2-200 chars, required)
- Industry dropdown with 10 predefined options
- Public sector checkbox
- Integrate modal in CustomersPage"
```

---

## Task 7: Customer Delete Confirmation

**Files:**
- Modify: `src/components/customers/index.tsx`

**Step 1: Add delete confirmation logic**

```typescript
import { useOpportunities } from '../../stores/OpportunitiesStore'; // NEW

export const CustomersPage = () => {
  const { customers, deleteCustomer } = useCustomers();
  const { opportunities } = useOpportunities(); // NEW

  const handleDeleteCustomer = (customer: Customer) => {
    // Check if customer has opportunities
    const hasOpportunities = opportunities.some(
      opp => opp.customerId === customer.id
    );

    if (hasOpportunities) {
      if (!confirm(
        `Cannot delete "${customer.name}" because it has active opportunities. ` +
        `Please delete or reassign those opportunities first.`
      )) {
        return;
      }
      return; // Block deletion
    }

    if (confirm(`Are you sure you want to delete "${customer.name}"?`)) {
      deleteCustomer(customer.id);
    }
  };

  // In table:
  // Delete button: onClick={() => handleDeleteCustomer(customer)}
};
```

**Step 2: Test delete protection**

1. Create customer
2. Create opportunity with that customer (Task 10)
3. Try to delete customer
Expected: Warning shown, deletion blocked

**Step 3: Commit**

```bash
git add src/components/customers/index.tsx
git commit -m "feat: add delete confirmation with opportunity check

- Check if customer has opportunities before delete
- Block deletion if customer in use
- Show confirmation dialog for delete action"
```

---

## Task 8: Add Customers to Sidebar Navigation

**Files:**
- Modify: `src/components/layout/index.tsx` (sidebar section)

**Step 1: Add Customers nav item**

```typescript
import { Building2 } from 'lucide-react'; // Add to imports

// In sidebar navigation:
<NavLink
  to="/customers"
  className={({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActive
        ? 'bg-slate-800 text-white'
        : 'text-slate-300 hover:bg-slate-800/50'
    }`
  }
>
  <Building2 size={20} />
  <span>Customers</span>
</NavLink>
```

**Step 2: Test navigation**

Run: `npm run dev`
Click "Customers" in sidebar
Expected: Navigates to /customers page

**Step 3: Commit**

```bash
git add src/components/layout/index.tsx
git commit -m "feat: add Customers to sidebar navigation

- Add Customers menu item with Building2 icon
- Position between Opportunities and Settings"
```

---

## Task 9: Update Opportunity Model for Customer Relationship

**Files:**
- Modify: `src/types/index.ts:37-44` (Opportunity interface)

**Step 1: Update Opportunity interface**

```typescript
export interface Opportunity {
    id: string;
    title: string;

    // Customer relationship (NEW)
    customerId: string; // Foreign key to Customer

    // Deprecated fields (keep for backward compatibility)
    clientName?: string; // Will be migrated to customerId
    industry?: string; // Will be derived from customer

    tcv: number;
    raiseTcv: number;

    // ... rest of fields
    isPublicSector: boolean; // Still in opportunity, derived from customer
```

**Step 2: Verify types compile**

Run: `npm run build`
Expected: TypeScript errors (expected - we'll fix in migration task)

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: update Opportunity model for customer relationship

- Add customerId field (foreign key)
- Mark clientName and industry as optional (deprecated)
- Prepare for migration from old format"
```

---

## Task 10: Opportunity Migration Logic in OpportunitiesStore

**Files:**
- Modify: `src/stores/OpportunitiesStore.tsx:22-47` (initialization)

**Step 1: Add migration logic**

```typescript
import { useCustomers } from './CustomerStore'; // Add import

export const OpportunitiesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { customers, addCustomer } = useCustomers(); // Access CustomerStore

    const [opportunities, setOpportunities] = useState<Opportunity[]>(() => {
        const saved = localStorage.getItem('raise_opportunities');
        if (!saved) return INITIAL_OPPORTUNITIES;

        try {
            const parsed = JSON.parse(saved);
            const validation = validateStorageData(parsed);

            if (!validation.success) {
                console.error('Invalid data in localStorage:', validation.error);
                return INITIAL_OPPORTUNITIES;
            }

            let opps = validation.data;

            // MIGRATION: Convert old format (clientName) to new format (customerId)
            opps = opps.map((opp: any) => {
                // If already migrated (has customerId), skip
                if (opp.customerId) {
                    return opp;
                }

                // Old format - has clientName string
                if (opp.clientName && typeof opp.clientName === 'string') {
                    // Find or create customer
                    let customer = customers.find(c =>
                        c.name.toLowerCase() === opp.clientName.toLowerCase()
                    );

                    if (!customer) {
                        // Create new customer from opportunity data
                        const newCustomer = {
                            name: opp.clientName,
                            industry: (opp.industry || 'Technology') as Industry,
                            isPublicSector: opp.isPublicSector || false,
                        };

                        // Add customer and get the created customer with ID
                        addCustomer(newCustomer);

                        // Find the newly created customer
                        customer = customers.find(c =>
                            c.name.toLowerCase() === opp.clientName.toLowerCase()
                        );
                    }

                    // Update opportunity to use customerId
                    return {
                        ...opp,
                        customerId: customer!.id,
                        // Remove deprecated fields
                        clientName: undefined,
                        industry: undefined,
                    };
                }

                // No clientName - data error, create placeholder
                console.warn('Opportunity missing clientName:', opp.id);
                const unknownCustomer = {
                    name: 'Unknown Customer',
                    industry: 'Technology' as Industry,
                    isPublicSector: false,
                };
                addCustomer(unknownCustomer);

                const customer = customers.find(c => c.name === 'Unknown Customer');

                return {
                    ...opp,
                    customerId: customer!.id,
                };
            });

            // Recalculate raiseLevel
            return opps.map((opp: Opportunity) => ({
                ...opp,
                raiseLevel: calculateRaiseLevel(opp)
            }));
        } catch (e) {
            console.error('Failed to parse localStorage data:', e);
            return INITIAL_OPPORTUNITIES;
        }
    });

    // ... rest of provider
};
```

**Step 2: Add helper methods to get customer data**

Add to OpportunitiesProvider:

```typescript
const getCustomer = (opp: Opportunity) => {
    return customers.find(c => c.id === opp.customerId);
};

const getIndustry = (opp: Opportunity) => {
    const customer = getCustomer(opp);
    return customer?.industry || 'Technology';
};

const getIsPublicSector = (opp: Opportunity) => {
    const customer = getCustomer(opp);
    return customer?.isPublicSector || false;
};

// Add to context value:
return (
    <OpportunitiesContext.Provider value={{
        opportunities,
        selectedOpp,
        selectOpportunity,
        updateOpportunity,
        addOpportunity,
        deleteOpportunity,
        getCustomer,      // NEW
        getIndustry,      // NEW
        getIsPublicSector // NEW
    }}>
```

**Step 3: Update OpportunitiesContextType**

```typescript
interface OpportunitiesContextType {
    opportunities: Opportunity[];
    selectedOpp: Opportunity | null;
    selectOpportunity: (opp: Opportunity | null) => void;
    updateOpportunity: (opp: Opportunity) => void;
    addOpportunity: (opp: Opportunity) => void;
    deleteOpportunity: (id: string) => void;
    getCustomer: (opp: Opportunity) => Customer | undefined;      // NEW
    getIndustry: (opp: Opportunity) => Industry;                   // NEW
    getIsPublicSector: (opp: Opportunity) => boolean;              // NEW
}
```

**Step 4: Test migration with old data**

1. Create old-format opportunity in localStorage manually
2. Reload app
3. Check customers created automatically
4. Verify opportunity updated to new format

Expected: Migration successful

**Step 5: Commit**

```bash
git add src/stores/OpportunitiesStore.tsx
git commit -m "feat: add migration logic for customer relationship

- Auto-migrate opportunities from clientName to customerId
- Create customers automatically during migration
- Add getCustomer, getIndustry, getIsPublicSector helpers
- Handle missing/invalid data with defaults
- Preserve backward compatibility"
```

---

## Task 11: Update New Opportunity Form - Customer Dropdown

**Files:**
- Modify: `src/pages/opportunities/new.tsx`

**Step 1: Replace clientName input with customer dropdown**

```typescript
import { useCustomers } from '../../stores/CustomerStore';
import { Plus, Lock } from 'lucide-react';

export const NewOpportunity = () => {
    const { customers } = useCustomers();
    const [formData, setFormData] = useState({
        // ... existing fields
        customerId: '', // NEW - replace clientName
        // Remove: clientName, industry (derived from customer)
    });

    const selectedCustomer = customers.find(c => c.id === formData.customerId);

    // In form JSX:
    return (
        <form>
            {/* Customer Selection */}
            <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">
                    Customer *
                </label>

                <div className="flex gap-2">
                    <select
                        value={formData.customerId}
                        onChange={(e) => setFormData(prev => ({
                            ...prev,
                            customerId: e.target.value
                        }))}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                        required
                    >
                        <option value="">Select Customer...</option>
                        {customers
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))
                        }
                    </select>

                    <button
                        type="button"
                        onClick={() => setShowQuickAddModal(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        title="Quick Add Customer"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* Auto-filled Industry (readonly) */}
                {selectedCustomer && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Industry
                            </label>
                            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                                <Lock size={16} className="text-slate-400" />
                                <span className="text-slate-600">
                                    {selectedCustomer.industry}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Auto-filled from customer
                            </p>
                        </div>

                        {/* Auto-filled Public Sector (readonly) */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Public Sector
                            </label>
                            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                                <Lock size={16} className="text-slate-400" />
                                <span className="text-slate-600">
                                    {selectedCustomer.isPublicSector ? 'Yes' : 'No'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Auto-filled from customer
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* ... rest of form */}
        </form>
    );
};
```

**Step 2: Update form submission**

```typescript
const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerId) {
        showToast.error('Please select a customer');
        return;
    }

    const newOpportunity: Opportunity = {
        id: crypto.randomUUID(),
        customerId: formData.customerId,
        // ... other fields
        // DO NOT include clientName, industry (deprecated)
        isPublicSector: selectedCustomer!.isPublicSector, // Copy from customer
    };

    addOpportunity(newOpportunity);
    navigate('/');
};
```

**Step 3: Test form**

Run: `npm run dev`
1. Go to New Opportunity
2. Select customer from dropdown
3. Verify industry/PA auto-filled (readonly)
4. Submit form

Expected: Opportunity created with customerId

**Step 4: Commit**

```bash
git add src/pages/opportunities/new.tsx
git commit -m "feat: update new opportunity form with customer dropdown

- Replace clientName input with customer dropdown
- Add Quick Add button (placeholder)
- Auto-fill industry and public sector (readonly)
- Show lock icon and helper text for derived fields
- Validate customer selection on submit"
```

---

## Task 12: Quick Add Customer Modal

**Files:**
- Create: `src/components/opportunities/QuickAddCustomerModal.tsx`

**Step 1: Create simplified modal for quick add**

```typescript
import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Industry } from '../../types';
import { useCustomers } from '../../stores/CustomerStore';

interface QuickAddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerAdded: (customerId: string) => void; // Callback with new customer ID
}

const INDUSTRIES: Industry[] = [
  'Technology', 'Manufacturing', 'Finance', 'Healthcare', 'Retail',
  'Energy', 'Transportation', 'Public Administration', 'Telecommunications', 'Consulting',
];

export const QuickAddCustomerModal: React.FC<QuickAddCustomerModalProps> = ({
  isOpen,
  onClose,
  onCustomerAdded,
}) => {
  const { addCustomer, customers } = useCustomers();
  const [formData, setFormData] = useState({
    name: '',
    industry: 'Technology' as Industry,
    isPublicSector: false,
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Customer name is required');
      return;
    }

    if (formData.name.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    // Add customer (will get UUID automatically)
    const customerId = crypto.randomUUID();
    const newCustomer = {
      id: customerId,
      ...formData,
    };

    // Directly add to store
    addCustomer(newCustomer);

    // Notify parent component
    onCustomerAdded(customerId);

    // Reset and close
    setFormData({ name: '', industry: 'Technology', isPublicSector: false });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Quick Add Customer</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Customer name"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Industry *
            </label>
            <select
              value={formData.industry}
              onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value as Industry }))}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {INDUSTRIES.map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="quickAddPublicSector"
              checked={formData.isPublicSector}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublicSector: e.target.checked }))}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="quickAddPublicSector" className="ml-2 text-sm text-slate-700">
              Public Sector
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add & Select
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

**Step 2: Integrate in New Opportunity form**

Modify: `src/pages/opportunities/new.tsx`

```typescript
import { QuickAddCustomerModal } from '../../components/opportunities/QuickAddCustomerModal';

export const NewOpportunity = () => {
    const [showQuickAddModal, setShowQuickAddModal] = useState(false);

    const handleCustomerAdded = (customerId: string) => {
        setFormData(prev => ({ ...prev, customerId }));
        setShowQuickAddModal(false);
    };

    return (
        <form>
            {/* ... existing form */}

            <QuickAddCustomerModal
                isOpen={showQuickAddModal}
                onClose={() => setShowQuickAddModal(false)}
                onCustomerAdded={handleCustomerAdded}
            />
        </form>
    );
};
```

**Step 3: Test quick add workflow**

1. Go to New Opportunity
2. Click [+] button
3. Fill customer name, industry
4. Click "Add & Select"
5. Verify customer created and selected
6. Verify industry/PA auto-filled

Expected: PASS - customer created and auto-selected

**Step 4: Commit**

```bash
git add src/components/opportunities/QuickAddCustomerModal.tsx src/pages/opportunities/new.tsx
git commit -m "feat: add QuickAddCustomerModal for inline creation

- Create simplified modal for adding customer during opportunity entry
- Auto-select newly created customer
- Callback pattern to notify parent component
- Integrate in new opportunity form"
```

---

## Task 13: Update Edit Opportunity Form

**Files:**
- Modify: `src/pages/opportunities/edit.tsx`

**Step 1: Apply same customer dropdown pattern**

(Same code as Task 11, applied to edit form)

```typescript
// Import QuickAddCustomerModal
// Add customer dropdown with [+] button
// Show readonly industry/PA fields
// Handle customer selection
```

**Step 2: Test edit form**

1. Edit existing opportunity
2. Change customer
3. Verify industry/PA update
4. Save

Expected: Customer change reflected

**Step 3: Commit**

```bash
git add src/pages/opportunities/edit.tsx
git commit -m "feat: update edit opportunity form with customer dropdown

- Apply customer dropdown to edit form
- Support changing customer with auto-update fields
- Add Quick Add modal integration"
```

---

## Task 14: Add Logo Assets

**Files:**
- Add: `public/assets/logo-full.png`
- Add: `public/assets/logo-icon.png`

**Step 1: Create assets directory**

Run: `mkdir -p public/assets`

**Step 2: User to provide logo files**

(User has PNG files - they will add them manually or we can create placeholders)

For now, create placeholder:
- logo-full.png (200x50px Lutech logo)
- logo-icon.png (32x32px pictogram)

**Step 3: Verify assets load**

Run: `npm run dev`
Navigate to: `http://localhost:5173/assets/logo-full.png`
Expected: Logo displays

**Step 4: Commit**

```bash
git add public/assets/logo-full.png public/assets/logo-icon.png
git commit -m "feat: add Lutech logo assets

- Add logo-full.png (full company logo)
- Add logo-icon.png (pictogram/icon)
- Assets provided by user for branding"
```

---

## Task 15: Update Sidebar Header with Logo

**Files:**
- Modify: `src/components/layout/index.tsx`

**Step 1: Replace gradient circle with logo**

```typescript
{/* OLD */}
<div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
  <span className="text-white font-bold text-xl">R</span>
</div>

{/* NEW */}
<img
  src="/assets/logo-icon.png"
  alt="Lutech"
  className="w-8 h-8 object-contain"
/>
```

**Step 2: Update text to add author credit**

```typescript
<div className="flex flex-col">
  <span className="text-lg font-bold tracking-tight">RAISE</span>
  <span className="text-[10px] text-slate-400 font-medium">
    by Gabriele Rendina
  </span>
</div>
```

**Step 3: Test sidebar header**

Run: `npm run dev`
Check sidebar header shows:
- Lutech icon
- "RAISE" title
- "by Gabriele Rendina" subtitle

Expected: PASS

**Step 4: Commit**

```bash
git add src/components/layout/index.tsx
git commit -m "feat: update sidebar header with Lutech logo and author credit

- Replace gradient circle with Lutech pictogram
- Add 'by Gabriele Rendina' subtitle
- Remove 'Compliance' subtitle
- Maintain responsive layout"
```

---

## Task 16: Create Footer Component

**Files:**
- Create: `src/components/layout/Footer.tsx`

**Step 1: Create Footer component**

```typescript
import React from 'react';

export const Footer = () => {
  return (
    <footer className="mt-auto py-4 px-8 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-slate-600">
        <div className="flex items-center gap-3">
          <img
            src="/assets/logo-full.png"
            alt="Lutech S.p.A."
            className="h-6 object-contain"
          />
          <span>© 2025 Lutech S.p.A.</span>
        </div>
        <span className="text-slate-500">
          Developed by <span className="font-semibold text-slate-700">Gabriele Rendina</span>
        </span>
      </div>
    </footer>
  );
};
```

**Step 2: Integrate Footer in Layout**

Modify: `src/components/layout/index.tsx`

```typescript
import { Footer } from './Footer';

export const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Sidebar */}
      {/* Header */}
      <main className="flex-1 md:pl-72 pt-20">
        {children}
      </main>
      <Footer /> {/* NEW */}
    </div>
  );
};
```

**Step 3: Test footer on all pages**

Navigate to:
- Dashboard
- New Opportunity
- Customers
- Settings

Expected: Footer visible on all pages

**Step 4: Commit**

```bash
git add src/components/layout/Footer.tsx src/components/layout/index.tsx
git commit -m "feat: add Footer component with logo and author credit

- Create Footer with Lutech full logo
- Display '© 2025 Lutech S.p.A.'
- Display 'Developed by Gabriele Rendina'
- Responsive layout (stack on mobile)
- Integrate in main Layout"
```

---

## Task 17: Add Order Field to DEFAULT_CONTROLS

**Files:**
- Modify: `src/stores/SettingsStore.tsx:25-end`

**Step 1: Add order field to each control**

Strategy: Group controls by phase, then assign order 1, 2, 3... within each phase

```typescript
const DEFAULT_CONTROLS: ControlConfig[] = [
    // Planning - order 1, 2, 3, 4, 5
    {
        id: 'opp-site',
        order: 1, // NEW
        label: 'Opportunity Site Created',
        phase: 'Planning',
        // ...
    },
    {
        id: 'crm-case',
        order: 2, // NEW
        label: 'Opportunità in Salesforce',
        phase: 'Planning',
        // ...
    },
    {
        id: 'offer-code',
        order: 3, // NEW
        label: 'Codice Offerta',
        phase: 'Planning',
        // ...
    },
    // ... continue for all Planning controls

    // ATP - order resets to 1, 2, 3...
    {
        id: 'doc-request-atp',
        order: 1, // NEW (reset)
        label: 'Richiesta d\'Offerta',
        phase: 'ATP',
        // ...
    },
    // ... continue for all controls
];
```

**Step 2: Write script to auto-assign order**

(Or manually add order field to all ~100 controls following phase grouping)

Manual approach:
- Count controls per phase
- Assign sequential numbers 1, 2, 3... within each phase

**Step 3: Verify no duplicate orders within same phase**

Run validation check:

```typescript
const validateOrders = () => {
  const phases = ['Planning', 'ATP', 'ATS', 'ATC', 'Handover', 'ALL'];
  phases.forEach(phase => {
    const controls = DEFAULT_CONTROLS.filter(c => c.phase === phase);
    const orders = controls.map(c => c.order);
    const duplicates = orders.filter((item, index) => orders.indexOf(item) !== index);
    if (duplicates.length > 0) {
      console.error(`Phase ${phase} has duplicate orders:`, duplicates);
    }
  });
};
```

**Step 4: Commit**

```bash
git add src/stores/SettingsStore.tsx
git commit -m "feat: add order field to all DEFAULT_CONTROLS

- Assign sequential numbers 1,2,3... within each phase
- Order follows RAISE documentation sequence
- Reset numbering per phase
- Enables numbered checkpoint display"
```

---

## Task 18: Update Settings Page - Grouped Display

**Files:**
- Modify: `src/pages/settings/index.tsx`

**Step 1: Group controls by phase and sort by order**

```typescript
const PHASE_ORDER: Phase[] = ['Planning', 'ATP', 'ATS', 'ATC', 'Handover', 'ALL'];

export const SettingsPage = () => {
  const { controls } = useSettings();

  const groupedControls = PHASE_ORDER.reduce((acc, phase) => {
    acc[phase] = controls
      .filter(c => c.phase === phase)
      .sort((a, b) => a.order - b.order);
    return acc;
  }, {} as Record<Phase, ControlConfig[]>);

  return (
    <div className="p-8">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Phase</th>
            {/* ... other columns */}
          </tr>
        </thead>
        <tbody>
          {Object.entries(groupedControls).map(([phase, items]) => (
            <React.Fragment key={phase}>
              {/* Phase Header Row */}
              <tr className="bg-slate-100">
                <td colSpan={7} className="px-6 py-3 font-bold text-slate-800">
                  {phase}
                </td>
              </tr>

              {/* Checkpoint Rows */}
              {items.map((control, idx) => (
                <tr key={control.id}>
                  <td className="px-6 py-3 font-mono text-sm text-slate-500">
                    {idx + 1}.
                  </td>
                  <td className="px-6 py-4">{control.label}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-500">{phase}</span>
                  </td>
                  {/* ... other columns */}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

**Step 2: Test settings page display**

Run: `npm run dev`
Navigate to Settings
Expected:
- Controls grouped by phase
- Phase headers visible
- Each control numbered 1, 2, 3... within its phase

**Step 3: Commit**

```bash
git add src/pages/settings/index.tsx
git commit -m "feat: display controls grouped by phase with numbering

- Group controls by phase (Planning, ATP, ATS, ATC, Handover, ALL)
- Display phase header rows
- Number controls 1,2,3... within each phase
- Sort by order field"
```

---

## Task 19: Update Workflow Display with Numbering

**Files:**
- Modify: `src/components/workflow/index.tsx`

**Step 1: Sort checkpoints by order and display with numbers**

```typescript
const WorkflowPhase = ({ phase, checkpoints }) => {
  const sortedCheckpoints = checkpoints.sort((a, b) => a.order - b.order);

  return (
    <div>
      <h3>{phase} Phase</h3>
      <ul>
        {sortedCheckpoints.map((checkpoint, idx) => (
          <li key={checkpoint.id} className="flex items-start gap-3">
            <span className="font-mono text-sm text-slate-500 min-w-[2rem]">
              {idx + 1}.
            </span>
            <label>
              <input type="checkbox" checked={checkpoint.checked} />
              <span>{checkpoint.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

**Step 2: Test workflow numbering**

1. Open an opportunity workflow
2. Check ATP, ATS, ATC phases
3. Verify checkpoints numbered 1, 2, 3...

Expected: Sequential numbering per phase

**Step 3: Commit**

```bash
git add src/components/workflow/index.tsx
git commit -m "feat: add sequential numbering to workflow checkpoints

- Sort checkpoints by order field
- Display numbers 1,2,3... per phase
- Maintain checkbox functionality"
```

---

## Task 20: Integration Tests - Customer-Opportunity Flow

**Files:**
- Create: `src/tests/integration/customer-opportunity.test.tsx`

**Step 1: Write integration test**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../App';

describe('Customer-Opportunity Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should create customer and use in opportunity', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Navigate to Customers
    await user.click(screen.getByText('Customers'));

    // Add customer
    await user.click(screen.getByText('Add Customer'));
    await user.type(screen.getByPlaceholderText(/customer name/i), 'Test Corp');
    await user.selectOptions(screen.getByLabelText(/industry/i), 'Technology');
    await user.click(screen.getByText('Add Customer'));

    // Navigate to New Opportunity
    await user.click(screen.getByText('New Opportunity'));

    // Select customer
    await user.selectOptions(screen.getByLabelText(/customer/i), 'Test Corp');

    // Verify auto-fill
    await waitFor(() => {
      expect(screen.getByDisplayValue('Technology')).toBeInTheDocument();
    });

    // Fill other fields and submit
    await user.type(screen.getByLabelText(/title/i), 'Test Opportunity');
    await user.type(screen.getByLabelText(/tcv/i), '500000');
    await user.click(screen.getByText('Create Opportunity'));

    // Verify opportunity created
    await waitFor(() => {
      expect(screen.getByText('Test Opportunity')).toBeInTheDocument();
    });
  });
});
```

**Step 2: Run integration tests**

Run: `npm test integration`
Expected: PASS

**Step 3: Commit**

```bash
git add src/tests/integration/customer-opportunity.test.tsx
git commit -m "test: add integration tests for customer-opportunity flow

- Test customer creation
- Test opportunity creation with customer selection
- Verify auto-fill industry and public sector
- Test end-to-end workflow"
```

---

## Task 21: Update Documentation - README

**Files:**
- Modify: `README.md`

**Step 1: Add Customer Management section**

```markdown
## Key Features

### Customer Management (v1.1.0)
- **Customer Database** - Centralized customer entity management
- **Industry Classification** - 10 predefined industry sectors
- **Public Sector Flagging** - Automatic identification of PA customers
- **Auto-populated Fields** - Industry and PA automatically filled in opportunities
- **Quick Add** - Create customers inline during opportunity entry

### Opportunity Workflow
...existing content...

### Branding
- **Lutech Logo** - Company branding in sidebar and footer
- **Author Credit** - Developed by Gabriele Rendina

### Checkpoint Management
- **Numbered Checkpoints** - Sequential numbering per phase (1, 2, 3...)
- **Grouped Display** - Controls organized by RAISE phase
...
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README with customer management features

- Add Customer Management section
- Document industry classification
- Document auto-population
- Add branding and numbering features"
```

---

## Task 22: Update User Guide

**Files:**
- Modify: `docs/USER_GUIDE.md`

**Step 1: Add Customer Management section**

Add after "Dashboard" section:

```markdown
## Customer Management

### Overview

The Customer Management system allows you to:
- Create and maintain a centralized customer database
- Automatically populate industry and public sector fields in opportunities
- Ensure consistency across all opportunities

### Customer Page (`/customers`)

Access via sidebar: **Customers**

#### Creating a Customer

1. Click **"Add Customer"** button
2. Fill in required fields:
   - **Customer Name*** (min 2 characters)
   - **Industry*** (select from 10 options)
   - **Public Sector** (checkbox)
3. Click **"Add Customer"**

#### Editing a Customer

1. Click the **pencil icon** next to customer
2. Update fields
3. Click **"Save Changes"**

#### Deleting a Customer

1. Click the **trash icon** next to customer
2. Confirm deletion
3. **Note:** Cannot delete customers with active opportunities

### Using Customers in Opportunities

#### Method 1: Select Existing Customer

1. In New/Edit Opportunity form
2. Select customer from dropdown
3. Industry and Public Sector auto-filled (readonly)

#### Method 2: Quick Add

1. In New/Edit Opportunity form
2. Click **[+]** button next to customer dropdown
3. Fill minimal customer info
4. Click **"Add & Select"**
5. Customer created and auto-selected

---
```

**Step 2: Update opportunity creation section**

Update "Creazione Opportunità" section to reflect customer dropdown instead of free text

**Step 3: Commit**

```bash
git add docs/USER_GUIDE.md
git commit -m "docs: update User Guide with customer management instructions

- Add Customer Management section
- Document customer CRUD operations
- Document quick add workflow
- Update opportunity creation to use customer dropdown"
```

---

## Task 23: Update CHANGELOG

**Files:**
- Modify: `CHANGELOG.md`

**Step 1: Add v1.1.0 entry**

```markdown
# Changelog

## [1.1.0] - 2025-12-28

### Added
- **Customer Management System**
  - Centralized customer database with CRUD operations
  - Customer page with search and table display
  - Customer modal for add/edit operations
  - Delete protection for customers with opportunities
  - Industry enum with 10 predefined sectors (Technology, Manufacturing, Finance, Healthcare, Retail, Energy, Transportation, Public Administration, Telecommunications, Consulting)
  - Public Sector flag for automatic PA identification

- **Auto-populated Fields**
  - Industry automatically populated from selected customer
  - Public Sector flag automatically populated from selected customer
  - Readonly display for derived fields with lock icon

- **Quick Add Customer**
  - Inline customer creation during opportunity entry
  - Auto-select newly created customer
  - Simplified modal for fast workflow

- **Branding**
  - Lutech logo in sidebar header (pictogram)
  - Lutech logo in footer (full logo)
  - Author credit: "by Gabriele Rendina" in sidebar and footer
  - Company copyright: "© 2025 Lutech S.p.A."

- **Checkpoint Ordering**
  - Sequential numbering per phase (1, 2, 3...)
  - Grouped display by phase in Settings
  - Order follows RAISE documentation sequence
  - Numbered checkpoints in Workflow view

### Changed
- **Opportunity Model**
  - Replaced `clientName` (string) with `customerId` (foreign key)
  - Deprecated `industry` field (now derived from customer)
  - Backward-compatible migration for old opportunities

- **Opportunity Forms**
  - New/Edit forms use customer dropdown instead of free text
  - Industry and Public Sector fields now readonly (auto-filled)
  - Added Quick Add button next to customer dropdown

### Migration
- Automatic migration of old opportunities on load
- Auto-create customers from `clientName` strings
- Preserve existing data with default values

### Fixed
- Improved data consistency with centralized customer management
- Eliminated duplicate/inconsistent customer names
- Ensured accurate industry and PA classifications

## [1.0.0] - 2025-12-27
...existing content...
```

**Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: add v1.1.0 changelog entry

- Document customer management features
- Document branding improvements
- Document checkpoint ordering
- Document migration strategy"
```

---

## Task 24: Build and Test Production Bundle

**Files:**
- None (build verification)

**Step 1: Build production bundle**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 2: Check bundle size**

Run: `du -sh dist/assets/*.js`
Expected: Total gzipped < 75KB (similar to v1.0.0)

**Step 3: Test production build locally**

Run: `npm run preview`
Navigate to preview URL
Test:
1. Customer CRUD operations
2. Opportunity with customer selection
3. Quick add customer
4. Logo displays correctly
5. Footer displays correctly
6. Numbered checkpoints in Settings

Expected: All features work in production build

**Step 4: Commit (if config changes needed)**

```bash
# Only if vite.config.ts or build config changed
git add vite.config.ts
git commit -m "build: verify production bundle for v1.1.0"
```

---

## Task 25: E2E Tests with Playwright

**Files:**
- Create: `e2e/customer-management.spec.ts`

**Step 1: Write E2E test for complete workflow**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Customer Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    // Clear localStorage
    await page.evaluate(() => localStorage.clear());
  });

  test('complete customer-opportunity workflow', async ({ page }) => {
    // Navigate to Customers
    await page.click('text=Customers');

    // Create customer
    await page.click('text=Add Customer');
    await page.fill('input[name="name"]', 'Acme Corporation');
    await page.selectOption('select[name="industry"]', 'Technology');
    await page.click('button:has-text("Add Customer")');

    // Verify customer in table
    await expect(page.locator('text=Acme Corporation')).toBeVisible();

    // Create opportunity with customer
    await page.click('text=New Opportunity');
    await page.selectOption('select[name="customerId"]', 'Acme Corporation');

    // Verify auto-fill
    await expect(page.locator('text=Technology')).toBeVisible();
    await expect(page.locator('text=Auto-filled from customer')).toBeVisible();

    // Fill opportunity details
    await page.fill('input[name="title"]', 'Cloud Migration Project');
    await page.fill('input[name="tcv"]', '750000');
    await page.fill('input[name="firstMarginPercent"]', '28');
    await page.fill('input[name="expectedDecisionDate"]', '2025-03-15');

    // Submit
    await page.click('button:has-text("Create Opportunity")');

    // Verify in dashboard
    await expect(page.locator('text=Cloud Migration Project')).toBeVisible();
    await expect(page.locator('text=Acme Corporation')).toBeVisible();
  });

  test('quick add customer from opportunity form', async ({ page }) => {
    await page.click('text=New Opportunity');

    // Click quick add
    await page.click('button[title="Quick Add Customer"]');

    // Fill quick add modal
    await page.fill('input[placeholder="Customer name"]', 'Beta Inc');
    await page.selectOption('select', 'Finance');
    await page.check('input[type="checkbox"]#quickAddPublicSector');
    await page.click('button:has-text("Add & Select")');

    // Verify customer auto-selected
    await expect(page.locator('select[name="customerId"]')).toHaveValue(/.+/);
    await expect(page.locator('text=Finance')).toBeVisible();
    await expect(page.locator('text=Yes')).toBeVisible(); // Public sector
  });
});
```

**Step 2: Run E2E tests**

Run: `npm run test:e2e`
Expected: All E2E tests pass

**Step 3: Commit**

```bash
git add e2e/customer-management.spec.ts
git commit -m "test: add E2E tests for customer management

- Test complete customer-opportunity workflow
- Test quick add customer
- Test auto-population of fields
- Verify production-like behavior"
```

---

## Task 26: Final Testing & Quality Check

**Files:**
- None (testing verification)

**Step 1: Run all tests**

```bash
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run build         # TypeScript compilation
npm run lint          # Linting
```

Expected: All pass

**Step 2: Manual testing checklist**

Test in browser:
- [ ] Create customer
- [ ] Edit customer
- [ ] Delete customer (with/without opportunities)
- [ ] Create opportunity with customer dropdown
- [ ] Quick add customer from opportunity form
- [ ] Verify industry/PA auto-fill
- [ ] Edit opportunity and change customer
- [ ] Verify logo in sidebar
- [ ] Verify footer on all pages
- [ ] Verify numbered checkpoints in Settings
- [ ] Verify numbered checkpoints in Workflow
- [ ] Test migration with old data (manually add old format to localStorage)

**Step 3: Accessibility check**

- [ ] Keyboard navigation works
- [ ] Screen reader announces changes
- [ ] ARIA labels present
- [ ] Color contrast meets WCAG AA

**Step 4: Performance check**

- [ ] Initial load < 2s
- [ ] Customer list renders fast (100+ customers)
- [ ] No console errors
- [ ] No memory leaks

**Step 5: Document any issues**

Create issues in GitHub for any bugs found

---

## Task 27: Deployment to GitHub Pages

**Files:**
- None (deployment task)

**Step 1: Build production**

Run: `npm run build`

**Step 2: Commit all changes**

```bash
git add .
git status  # Verify all changes staged
git commit -m "feat: customer management, branding, and controls ordering v1.1.0

Complete implementation including:
- Customer management system with CRUD operations
- Auto-populated industry and public sector fields
- Quick add customer modal
- Lutech logo branding (sidebar + footer)
- Author credit (Gabriele Rendina)
- Numbered checkpoints per phase
- Backward-compatible migration
- Complete test coverage
- Updated documentation

Closes #[issue-number]"
```

**Step 3: Tag release**

```bash
git tag -a v1.1.0 -m "Release v1.1.0 - Customer Management & Branding"
git push origin main --tags
```

**Step 4: Deploy to GitHub Pages**

Run: `npm run deploy`
(or via GitHub Actions if configured)

**Step 5: Verify deployment**

Navigate to: `https://[username].github.io/lutech-raise-app/`
Test:
- All features work
- Logo loads
- Footer displays
- Customer management works
- Opportunities persist

Expected: Production site fully functional

---

## Summary

**Total Tasks:** 27
**Estimated Time:** 12-16 hours (spread over 2-3 sessions)

**Key Deliverables:**
1. ✅ CustomerStore with localStorage persistence
2. ✅ Customer page with CRUD operations
3. ✅ Customer modal (add/edit)
4. ✅ Quick add customer modal
5. ✅ Updated opportunity forms with customer dropdown
6. ✅ Auto-populated industry and PA fields
7. ✅ Backward-compatible migration
8. ✅ Lutech branding (logo + footer)
9. ✅ Author credit (Gabriele Rendina)
10. ✅ Numbered checkpoints per phase
11. ✅ Complete test coverage
12. ✅ Updated documentation

**Success Criteria:**
- [ ] All tests pass (unit + integration + E2E)
- [ ] Production build < 75KB gzipped
- [ ] No TypeScript errors
- [ ] No console errors in production
- [ ] WCAG AA accessibility compliance
- [ ] Backward compatibility maintained
- [ ] Documentation complete and accurate

---

**Implementation Approach:**
- TDD where possible (write tests first)
- Frequent commits (after each task)
- Incremental testing (test each feature as built)
- DRY principle (reuse components, patterns)
- YAGNI principle (only build what's specified)

**Next Steps After Implementation:**
1. User acceptance testing
2. Gather feedback
3. Plan v1.2.0 features (if any)
4. Monitor production for issues
