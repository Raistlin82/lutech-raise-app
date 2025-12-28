# Customer Management, Branding & UI Improvements - Design Document

**Date:** 2025-12-28
**Version:** 1.0
**Status:** Approved
**Target Release:** v1.1.0

---

## Overview

This design covers three major improvements to RAISE App v1.0.0:

1. **Customer Management** - Separate customer entities with automatic field population
2. **Branding** - Lutech logo integration and author credits
3. **Controls Ordering** - Numbered checkpoints per phase following RAISE documentation

**Approach:** Big Bang implementation (all features together in one release)

**Excluded:** General components refresh (deferred to future release)

---

## 1. Architecture Overview

### Data Layer

**New CustomerStore**
- Pattern: React Context (same as OpportunitiesStore/SettingsStore)
- Persistence: localStorage key `'raise_customers'`
- Operations: `addCustomer`, `updateCustomer`, `deleteCustomer`, `getCustomers`
- Validation: Zod schema

**Customer Data Model**
```typescript
interface Customer {
  id: string;              // UUID (crypto.randomUUID())
  name: string;            // Customer name
  industry: Industry;      // Enum with 10 sectors
  isPublicSector: boolean; // Public Administration flag
}

type Industry =
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
```

**Validation Schema (Zod)**
```typescript
const CustomerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Name required').max(200),
  industry: z.enum([
    'Technology', 'Manufacturing', 'Finance', 'Healthcare',
    'Retail', 'Energy', 'Transportation', 'Public Administration',
    'Telecommunications', 'Consulting'
  ]),
  isPublicSector: z.boolean(),
});
```

### Routes

**New Route:**
- `/customers` - Customer management page

**Updated Routes:**
- `/opportunities/new` - Modified to use customer dropdown
- `/opportunities/:id/edit` - Modified to use customer dropdown

### Integration with Opportunities

**Opportunity Model Changes:**
```typescript
// BEFORE
interface Opportunity {
  clientName: string;  // Free text input
  industry: string;
  isPublicSector: boolean;
  // ...
}

// AFTER
interface Opportunity {
  customerId: string;     // Foreign key to Customer
  // industry - removed (derived from customer)
  // isPublicSector - removed (derived from customer)
  // ...
}

// Computed properties
getCustomer(opp: Opportunity): Customer | undefined
getIndustry(opp: Opportunity): Industry
getIsPublicSector(opp: Opportunity): boolean
```

**Backward Compatibility Strategy:**

1. **Migration on Load** - OpportunitiesStore checks for old format
2. **Auto-create Customers** - For opportunities with `clientName` string:
   ```typescript
   if (typeof opp.clientName === 'string') {
     // Search for existing customer by name
     let customer = customers.find(c => c.name === opp.clientName);

     // If not found, create new customer
     if (!customer) {
       customer = {
         id: crypto.randomUUID(),
         name: opp.clientName,
         industry: opp.industry || 'Technology',
         isPublicSector: opp.isPublicSector || false,
       };
       addCustomer(customer);
     }

     // Update opportunity to use customerId
     opp.customerId = customer.id;
     delete opp.clientName;
   }
   ```

---

## 2. Customer Page Design

### Page Layout (`/customers`)

```
┌──────────────────────────────────────────────────────┐
│ Customers                                    [Search]│
│ ┌────────────┐  ┌────────────────┐                  │
│ │ 🔄 Refresh │  │ ➕ Add Customer│                  │
│ └────────────┘  └────────────────┘                  │
├──────────────────────────────────────────────────────┤
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ Name        Industry        PA     Actions   │   │
│ ├──────────────────────────────────────────────┤   │
│ │ Acme Corp   Technology      ✓      [✏️][🗑️] │   │
│ │ Beta Inc    Finance         ✗      [✏️][🗑️] │   │
│ │ Gamma Ltd   Manufacturing   ✗      [✏️][🗑️] │   │
│ └──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

### Features

**Table Columns:**
- Name (sortable)
- Industry (badge with color coding)
- Public Sector (✓ / ✗ or badge)
- Actions (Edit / Delete icons)

**Search Bar** (optional nice-to-have):
- Real-time filter by customer name
- Debounced 300ms

**Actions:**
- **Add Customer** → Opens modal
- **Edit** → Opens modal pre-filled
- **Delete** → Confirmation modal (check if customer has opportunities first)

**Sidebar Navigation Update:**
```tsx
<NavItem to="/" icon={<LayoutDashboard />} label="Dashboard" />
<NavItem to="/opportunities" icon={<FileText />} label="Opportunities" />
<NavItem to="/customers" icon={<Building2 />} label="Customers" /> {/* NEW */}
<NavItem to="/settings" icon={<Settings />} label="Settings" />
```

### Customer Modal (Add/Edit)

```
┌─────────────────────────────────────┐
│ Add Customer                   [✕]  │
├─────────────────────────────────────┤
│                                     │
│ Customer Name *                     │
│ [_____________________________]     │
│ Min 2 characters                    │
│                                     │
│ Industry *                          │
│ [▼ Select Industry______________]   │
│                                     │
│ ☐ Public Sector                     │
│                                     │
│ [Cancel]      [Save Customer]       │
└─────────────────────────────────────┘
```

**Validation:**
- Name: required, min 2 chars, max 200 chars
- Industry: required, must be from enum
- Public Sector: boolean (default false)
- Duplicate name warning (not blocking, just warning)

**Component:** `src/components/customers/CustomerModal.tsx`

---

## 3. Form Integration (Opportunity Forms)

### New/Edit Opportunity Form Changes

**Customer Selection Section:**

```tsx
{/* BEFORE - Free text input */}
<input
  type="text"
  placeholder="Client Name"
  value={formData.clientName}
/>

{/* AFTER - Dropdown + Quick Add */}
<div className="space-y-4">
  <div className="flex gap-2">
    <select
      value={formData.customerId}
      onChange={handleCustomerChange}
      className="flex-1"
    >
      <option value="">Select Customer...</option>
      {customers
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))
      }
    </select>
    <button
      type="button"
      onClick={openQuickAddCustomer}
      className="px-4 py-2 bg-blue-600 text-white"
    >
      <Plus size={16} />
    </button>
  </div>

  {/* Auto-filled fields (readonly) */}
  {selectedCustomer && (
    <>
      <FormField
        label="Industry"
        value={selectedCustomer.industry}
        disabled
        icon={<Lock size={16} />}
      />
      <FormField
        label="Public Sector"
        value={selectedCustomer.isPublicSector ? 'Yes' : 'No'}
        disabled
        icon={<Lock size={16} />}
      />
    </>
  )}
</div>
```

**Behavior:**
1. User selects customer from dropdown → `industry` and `isPublicSector` auto-filled (readonly)
2. User clicks [+] → Quick Add modal opens
3. User creates customer in modal → Customer auto-selected, fields populated

### Quick Add Customer Modal

Simplified inline modal for creating customer during opportunity creation:

```
┌────────────────────────────────────┐
│ Quick Add Customer            [✕]  │
├────────────────────────────────────┤
│ Name:     [__________________]     │
│ Industry: [▼ Technology_______]    │
│ ☐ Public Sector                    │
│                                    │
│ [Cancel]      [Add & Select]       │
└────────────────────────────────────┘
```

**"Add & Select" button:**
- Creates customer
- Automatically selects it in opportunity form
- Closes modal
- Populates industry/public sector fields

**Component:** `src/components/opportunities/QuickAddCustomerModal.tsx`

---

## 4. Branding Implementation

### Logo Assets

**Files to add:** (provided by user)
- `public/assets/logo-full.png` - Full Lutech logo
- `public/assets/logo-icon.png` - Lutech pictogram/icon
- (optional) `public/assets/logo-background.png` - Background

**Asset Requirements:**
- PNG format with transparency
- Icon: 32x32px or 64x64px (will be displayed at 32x32)
- Full logo: height ~24-32px (responsive width)

### Sidebar Header Redesign

**Current:**
```tsx
<div className="p-6 border-b">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
      <span>R</span>
    </div>
    <div>
      <span className="text-lg font-bold">RAISE</span>
      <span className="text-xs text-cyan-400">Compliance</span>
    </div>
  </div>
</div>
```

**New:**
```tsx
<div className="p-6 border-b border-slate-800/50">
  <div className="flex items-center gap-3">
    <img
      src="/assets/logo-icon.png"
      alt="Lutech"
      className="w-8 h-8 object-contain"
    />
    <div className="flex flex-col">
      <span className="text-lg font-bold tracking-tight">RAISE</span>
      <span className="text-[10px] text-slate-400 font-medium">
        by Gabriele Rendina
      </span>
    </div>
  </div>
</div>
```

**Changes:**
- Replace gradient circle with Lutech icon
- Add "by Gabriele Rendina" subtitle (small, gray)
- Remove "Compliance" subtitle

### Footer Component (New)

**File:** `src/components/layout/Footer.tsx`

```tsx
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

**Integration in Layout:**
```tsx
// src/components/layout/index.tsx
export const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Sidebar />
      <Header />
      <main className="flex-1 md:pl-72 pt-20">
        {children}
      </main>
      <Footer /> {/* NEW */}
    </div>
  );
};
```

**Responsive Behavior:**
- Desktop: Logo + copyright | Developed by (horizontal)
- Mobile: Stack vertically, centered

---

## 5. Controls Ordering & Numbering

### Objective

Order checkpoints by RAISE phase and number them 1,2,3... with reset per phase, following the sequence in RAISE documentation (already mapped in `DEFAULT_CONTROLS`).

### Implementation

**Add `order` field to ControlConfig:**
```typescript
interface ControlConfig {
  id: string;
  label: string;
  phase: Phase;
  order: number;  // NEW: Position within phase
  // ... other fields
}
```

**Update DEFAULT_CONTROLS:**

The controls are already in the correct order (mapped from "Checklist_Supporto RAISE.xlsx"). We just add `order` based on array index:

```typescript
const DEFAULT_CONTROLS: ControlConfig[] = [
  // Planning - order starts at 1
  {
    id: 'opp-site',
    order: 1,
    phase: 'Planning',
    label: 'Opportunity Site Created',
    // ...
  },
  {
    id: 'crm-case',
    order: 2,
    phase: 'Planning',
    label: 'Opportunità in Salesforce',
    // ...
  },
  // ATP - order restarts at 1
  {
    id: 'tech-feasibility',
    order: 1,
    phase: 'ATP',
    label: 'Technical Feasibility Assessment',
    // ...
  },
  // ... continue for all controls
];
```

**Programmatic Assignment:**
```typescript
// One-time script to add order based on current array position
const addOrderToControls = () => {
  const byPhase = groupBy(DEFAULT_CONTROLS, 'phase');

  Object.entries(byPhase).forEach(([phase, controls]) => {
    controls.forEach((control, index) => {
      control.order = index + 1;
    });
  });
};
```

### Settings Page Display

**Group by phase, show with numbers:**

```tsx
const PHASE_ORDER = ['Planning', 'ATP', 'ATS', 'ATC', 'Handover', 'ALL'];

const groupedControls = PHASE_ORDER.reduce((acc, phase) => {
  acc[phase] = controls
    .filter(c => c.phase === phase)
    .sort((a, b) => a.order - b.order);
  return acc;
}, {});

{Object.entries(groupedControls).map(([phase, items]) => (
  <React.Fragment key={phase}>
    {/* Phase header row */}
    <tr className="bg-slate-100">
      <td colSpan={7} className="px-6 py-3 font-bold text-slate-800">
        {phase}
      </td>
    </tr>

    {/* Checkpoint rows */}
    {items.map((control, idx) => (
      <tr key={control.id}>
        <td className="px-6 py-3 font-mono text-sm text-slate-500">
          {idx + 1}.
        </td>
        <td>{control.label}</td>
        {/* ... other columns */}
      </tr>
    ))}
  </React.Fragment>
))}
```

### Workflow Display

Show numbered checkpoints in ATP/ATS/ATC workflow:

```tsx
// src/components/workflow/index.tsx
const checkpoints = getRequiredCheckpoints(phase, opp, controls)
  .sort((a, b) => a.order - b.order);

{checkpoints.map((checkpoint, idx) => (
  <div key={checkpoint.id}>
    <span className="font-mono text-sm text-slate-500">
      {idx + 1}.
    </span>
    <span>{checkpoint.label}</span>
  </div>
))}
```

---

## 6. Testing Strategy

### Unit Tests

**CustomerStore:**
- `addCustomer()` - adds and saves to localStorage
- `updateCustomer()` - updates existing customer
- `deleteCustomer()` - removes customer
- `getCustomers()` - returns sorted list
- Validation - rejects invalid data

**Customer-Opportunity Integration:**
- `getCustomer(opp)` - returns correct customer
- `getIndustry(opp)` - derives from customer
- Migration - converts old format to new

### Component Tests

**Customer Page:**
- Renders customer list
- Add customer modal opens/closes
- Edit pre-fills modal
- Delete shows confirmation
- Search filters correctly

**Customer Modal:**
- Validation works (name, industry)
- Save creates/updates customer
- Cancel closes without saving

**Opportunity Forms:**
- Customer dropdown populated
- Selection auto-fills industry/PA
- Quick add works
- Backward compatibility with old opportunities

### Integration Tests

**Customer Workflow:**
1. Create customer
2. Create opportunity with that customer
3. Verify industry/PA auto-filled
4. Edit customer industry
5. Verify opportunities reflect change (or not - depends on desired behavior)

**Migration:**
1. Load app with old-format opportunities
2. Verify customers auto-created
3. Verify opportunities updated to new format

### E2E Tests (Playwright)

**Customer Management:**
```typescript
test('create customer and use in opportunity', async ({ page }) => {
  // Navigate to customers
  await page.goto('/customers');

  // Add customer
  await page.click('text=Add Customer');
  await page.fill('input[name="name"]', 'Test Corp');
  await page.selectOption('select[name="industry"]', 'Technology');
  await page.click('text=Save Customer');

  // Create opportunity with customer
  await page.goto('/opportunities/new');
  await page.selectOption('select[name="customerId"]', 'Test Corp');

  // Verify auto-fill
  expect(await page.inputValue('input[name="industry"]')).toBe('Technology');
});
```

---

## 7. File Structure

```
src/
├── components/
│   ├── customers/
│   │   ├── index.tsx              # Customer page (NEW)
│   │   ├── CustomerModal.tsx      # Add/Edit modal (NEW)
│   │   └── index.test.tsx         # Tests (NEW)
│   ├── layout/
│   │   ├── index.tsx              # Updated with Footer
│   │   └── Footer.tsx             # NEW
│   └── opportunities/
│       ├── QuickAddCustomerModal.tsx  # NEW
│       ├── new.tsx                # Updated (customer dropdown)
│       └── edit.tsx               # Updated (customer dropdown)
├── stores/
│   ├── CustomerStore.tsx          # NEW
│   ├── CustomerStore.test.tsx     # NEW
│   └── OpportunitiesStore.tsx     # Updated (migration logic)
├── lib/
│   └── validation.ts              # Add CustomerSchema
├── types/
│   └── index.ts                   # Add Customer interface
└── pages/
    └── customers/
        └── index.tsx              # Re-export from components/customers

public/
└── assets/
    ├── logo-full.png              # NEW (provided by user)
    ├── logo-icon.png              # NEW (provided by user)
    └── logo-background.png        # NEW (optional)
```

---

## 8. Migration & Rollout Plan

### Phase 1: Preparation
1. Add logo assets to `public/assets/`
2. Create CustomerStore with validation
3. Write unit tests for CustomerStore

### Phase 2: Customer Management
1. Create Customer page + modal
2. Add `/customers` route
3. Add sidebar navigation item
4. Test CRUD operations

### Phase 3: Opportunity Integration
1. Update Opportunity model (add `customerId`)
2. Add migration logic to OpportunitiesStore
3. Update new.tsx and edit.tsx with dropdown
4. Create QuickAddCustomerModal
5. Test backward compatibility

### Phase 4: Branding
1. Update sidebar header with logo
2. Create Footer component
3. Integrate Footer in Layout
4. Verify responsive behavior

### Phase 5: Controls Ordering
1. Add `order` field to ControlConfig
2. Update DEFAULT_CONTROLS with order numbers
3. Update Settings page display (grouped by phase)
4. Update Workflow display (numbered)

### Phase 6: Testing & QA
1. Run all unit tests
2. Run integration tests
3. Manual testing of full flows
4. Test migration with old data
5. Cross-browser testing

### Phase 7: Deployment
1. Build production
2. Verify bundle size (should be similar, ~70KB)
3. Deploy to GitHub Pages
4. Monitor for errors
5. Update documentation (README, User Guide)

---

## 9. Edge Cases & Considerations

### Customer Deletion
**Problem:** What if customer has existing opportunities?

**Solution:**
- Check if customer has opportunities before delete
- Show warning: "Cannot delete customer with active opportunities"
- Alternative: Allow delete but mark customer as "archived" (soft delete)

**Chosen:** Block deletion if customer has opportunities

### Industry Changes
**Problem:** If we change customer's industry, what happens to existing opportunities?

**Options:**
A. Update all opportunities (retroactive)
B. Keep opportunities as-is (snapshot at creation)

**Chosen:** Option B (snapshot) - industry is captured at opportunity creation time, stored in opportunity. Customer industry change doesn't affect existing opportunities.

### Duplicate Customer Names
**Problem:** Two customers with same name?

**Solution:**
- Allow duplicates (different companies can have similar names)
- Show warning in modal: "A customer with this name already exists"
- User can proceed or cancel

### Migration Errors
**Problem:** Old opportunity has invalid industry or missing clientName

**Solution:**
- Default industry to 'Technology'
- Default clientName to 'Unknown Customer'
- Log migration issues to console
- Show banner: "Some opportunities were migrated. Review customer data."

---

## 10. Success Metrics

**After implementation, we should see:**

- ✅ Zero duplicate customer entries (customers reused across opportunities)
- ✅ Faster opportunity creation (dropdown vs typing)
- ✅ Consistent industry values (no typos)
- ✅ Correct public sector flagging (100% accurate from customer data)
- ✅ Professional branding (logo visible on all pages)
- ✅ Clear checkpoint ordering (numbered per phase)
- ✅ No breaking changes (old opportunities still work)

**Acceptance Criteria:**

1. Can create/edit/delete customers via dedicated page
2. Can select customer in opportunity form (dropdown)
3. Industry and PA fields auto-populate from selected customer
4. Quick add customer works from opportunity form
5. Old opportunities migrate cleanly to new format
6. Logo appears in sidebar and footer
7. Author credit visible in footer
8. Checkpoints numbered 1,2,3... per phase in Settings and Workflow
9. All existing tests pass
10. Bundle size < 75KB gzipped

---

## Appendix A: API Reference

### CustomerStore

```typescript
interface CustomerStore {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id'>) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  getCustomer: (id: string) => Customer | undefined;
  getCustomers: () => Customer[];
}

const useCustomers = () => useContext(CustomerContext);
```

### OpportunitiesStore (Updated)

```typescript
interface OpportunitiesStore {
  // ... existing
  getCustomer: (opp: Opportunity) => Customer | undefined;
  getIndustry: (opp: Opportunity) => Industry;
  getIsPublicSector: (opp: Opportunity) => boolean;
}
```

---

## Appendix B: UI Mockups

(Detailed mockups would be added here with screenshots or Figma links)

---

**Design Status:** ✅ Approved and ready for implementation
**Next Steps:** Create implementation plan with detailed tasks
