import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewOpportunityPage } from './new';
import React from 'react';
import type { Customer } from '../../types';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n/config';

// Mock dependencies
const mockNavigate = vi.fn();
const mockAddOpportunity = vi.fn();
const mockSelectOpportunity = vi.fn();
const mockAddCustomer = vi.fn();
const mockUserEmail = 'test.user@example.com';

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../stores/OpportunitiesStore', () => ({
  useOpportunities: vi.fn(),
}));

vi.mock('../../stores/CustomerStore', () => ({
  useCustomers: vi.fn(),
  CustomerProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/hooks/useUserEmail', () => ({
  useUserEmail: () => mockUserEmail,
}));

// Import after mocking
import { useOpportunities } from '../../stores/OpportunitiesStore';
import { useCustomers } from '../../stores/CustomerStore';

// Mock customers for testing
const mockCustomers: Customer[] = [
  {
    id: 'CUST-001',
    name: 'Acme Corporation',
    industry: 'Technology',
    isPublicSector: false,
  },
  {
    id: 'CUST-002',
    name: 'TechCorp',
    industry: 'Finance',
    isPublicSector: false,
  },
];

// Wrapper with I18next
const AllProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <I18nextProvider i18n={i18n}>
    {children}
  </I18nextProvider>
);

describe('NewOpportunityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Configure mockAddOpportunity to return the created opportunity with id
    mockAddOpportunity.mockImplementation(async (opp) => {
      return { ...opp, id: opp.id || 'OPP-2024-1234' };
    });

    (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
      opportunities: [],
      addOpportunity: mockAddOpportunity,
      selectOpportunity: mockSelectOpportunity,
      selectedOpp: null,
    });
    (useCustomers as ReturnType<typeof vi.fn>).mockReturnValue({
      customers: mockCustomers,
      addCustomer: mockAddCustomer,
      updateCustomer: vi.fn(),
      deleteCustomer: vi.fn(),
    });
  });

  describe('Rendering', () => {
    it('should render page heading', () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });
      expect(screen.getByText('Nuova Opportunità')).toBeInTheDocument();
      expect(screen.getByText('Crea una nuova opportunità RAISE workflow')).toBeInTheDocument();
    });

    it('should render all form sections', () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });
      expect(screen.getByText('Informazioni Base')).toBeInTheDocument();
      expect(screen.getByText('Dettagli Finanziari')).toBeInTheDocument();
      expect(screen.getByText('Flag Opportunità')).toBeInTheDocument();
    });

    it('should render back button', () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });
      const backButton = screen.getByRole('button', { name: '' }); // ArrowLeft icon button
      expect(backButton).toBeInTheDocument();
    });

    it('should render form buttons', () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });
      expect(screen.getByText('Annulla')).toBeInTheDocument();
      expect(screen.getByText('Crea Opportunità')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should render all required input fields', () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });
      expect(screen.getByPlaceholderText(/Cloud Migration Project/i)).toBeInTheDocument();
      expect(screen.getByText('Seleziona Cliente...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('1000000')).toBeInTheDocument();
    });

    it('should render customer dropdown with available customers', () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      expect(screen.getByText('TechCorp')).toBeInTheDocument();
    });

    it('should render all checkbox flags', () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });
      // Public Sector is now auto-filled from customer selection, not a checkbox
      expect(screen.getByText('RTI (Joint Venture)')).toBeInTheDocument();
      expect(screen.getByText('KCP Deviations')).toBeInTheDocument();
      expect(screen.getByText('Nuovo Cliente')).toBeInTheDocument();
    });

    it('should show Mandataria checkbox when RTI is selected', () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });

      // Initially should not show Mandataria
      expect(screen.queryByText('Mandataria')).not.toBeInTheDocument();

      // Check RTI checkbox
      const rtiCheckbox = screen.getByRole('checkbox', { name: /RTI/i });
      fireEvent.click(rtiCheckbox);

      // Now Mandataria should appear
      expect(screen.getByText('Mandataria')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate back to opportunities when back button is clicked', () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });

      const backButton = screen.getAllByRole('button')[0]; // First button is back button
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/opportunities');
    });

    it('should navigate back to opportunities when cancel is clicked', () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });

      const cancelButton = screen.getByText('Annulla');
      fireEvent.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith('/opportunities');
    });
  });

  describe('Form Submission', () => {
    it('should create opportunity with valid data', async () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });

      // Fill in required fields
      const titleInput = screen.getByPlaceholderText(/Cloud Migration Project/i);
      const customerSelect = screen.getByRole('combobox');
      const tcvInput = screen.getByPlaceholderText('1000000');

      fireEvent.change(titleInput, { target: { value: 'Test Project' } });
      fireEvent.change(customerSelect, { target: { value: 'CUST-001' } });
      fireEvent.change(tcvInput, { target: { value: '500000' } });

      // Submit form
      const submitButton = screen.getByText('Crea Opportunità');
      fireEvent.click(submitButton);

      // Wait for async submission (500ms delay)
      await waitFor(() => {
        expect(mockAddOpportunity).toHaveBeenCalled();
        expect(mockSelectOpportunity).toHaveBeenCalled();
      }, { timeout: 1000 });
    });

    it('should pass userEmail to addOpportunity', async () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });

      // Fill in required fields
      const titleInput = screen.getByPlaceholderText(/Cloud Migration Project/i);
      const customerSelect = screen.getByRole('combobox');
      const tcvInput = screen.getByPlaceholderText('1000000');

      fireEvent.change(titleInput, { target: { value: 'Test Project' } });
      fireEvent.change(customerSelect, { target: { value: 'CUST-001' } });
      fireEvent.change(tcvInput, { target: { value: '500000' } });

      // Submit form
      const submitButton = screen.getByText('Crea Opportunità');
      fireEvent.click(submitButton);

      // Wait for async submission (500ms delay)
      await waitFor(() => {
        expect(mockAddOpportunity).toHaveBeenCalledWith(
          expect.objectContaining({
            createdByEmail: mockUserEmail,
          }),
          mockUserEmail
        );
      }, { timeout: 1000 });
    });

    it('should navigate to opportunity detail after creation', async () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });

      // Fill in required fields
      const titleInput = screen.getByPlaceholderText(/Cloud Migration Project/i);
      const customerSelect = screen.getByRole('combobox');
      const tcvInput = screen.getByPlaceholderText('1000000');

      fireEvent.change(titleInput, { target: { value: 'Test Project' } });
      fireEvent.change(customerSelect, { target: { value: 'CUST-001' } });
      fireEvent.change(tcvInput, { target: { value: '500000' } });

      // Submit form
      const submitButton = screen.getByText('Crea Opportunità');
      fireEvent.click(submitButton);

      // Wait for async submission (500ms delay)
      await waitFor(() => {
        // Should navigate to opportunity detail page
        expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/^\/opportunity\/OPP-/));
      }, { timeout: 1000 });
    });

    it('should use TCV as RAISE TCV when RAISE TCV is not provided', async () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });

      const titleInput = screen.getByPlaceholderText(/Cloud Migration Project/i);
      const customerSelect = screen.getByRole('combobox');
      const tcvInput = screen.getByPlaceholderText('1000000');

      fireEvent.change(titleInput, { target: { value: 'Test Project' } });
      fireEvent.change(customerSelect, { target: { value: 'CUST-001' } });
      fireEvent.change(tcvInput, { target: { value: '750000' } });

      const submitButton = screen.getByText('Crea Opportunità');
      fireEvent.click(submitButton);

      // Wait for async submission (500ms delay)
      await waitFor(() => {
        expect(mockAddOpportunity).toHaveBeenCalledWith(
          expect.objectContaining({
            tcv: 750000,
            raiseTcv: 750000,
          }),
          mockUserEmail
        );
      }, { timeout: 1000 });
    });

    it('should use provided RAISE TCV when specified', async () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });

      const titleInput = screen.getByPlaceholderText(/Cloud Migration Project/i);
      const customerSelect = screen.getByRole('combobox');
      const tcvInput = screen.getByPlaceholderText('1000000');
      const raiseTcvInput = screen.getByPlaceholderText(/uguale a TCV se vuoto/i);

      fireEvent.change(titleInput, { target: { value: 'Test Project' } });
      fireEvent.change(customerSelect, { target: { value: 'CUST-001' } });
      fireEvent.change(tcvInput, { target: { value: '750000' } });
      fireEvent.change(raiseTcvInput, { target: { value: '900000' } });

      const submitButton = screen.getByText('Crea Opportunità');
      fireEvent.click(submitButton);

      // Wait for async submission (500ms delay)
      await waitFor(() => {
        expect(mockAddOpportunity).toHaveBeenCalledWith(
          expect.objectContaining({
            tcv: 750000,
            raiseTcv: 900000,
          }),
          mockUserEmail
        );
      }, { timeout: 1000 });
    });

    it('should set isFastTrack to true for TCV < 250k without KCP deviations', async () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });

      const titleInput = screen.getByPlaceholderText(/Cloud Migration Project/i);
      const customerSelect = screen.getByRole('combobox');
      const tcvInput = screen.getByPlaceholderText('1000000');

      fireEvent.change(titleInput, { target: { value: 'Small Project' } });
      fireEvent.change(customerSelect, { target: { value: 'CUST-001' } });
      fireEvent.change(tcvInput, { target: { value: '200000' } });

      const submitButton = screen.getByText('Crea Opportunità');
      fireEvent.click(submitButton);

      // Wait for async submission (500ms delay)
      await waitFor(() => {
        expect(mockAddOpportunity).toHaveBeenCalledWith(
          expect.objectContaining({
            isFastTrack: true,
          }),
          mockUserEmail
        );
      }, { timeout: 1000 });
    });

    it('should set isFastTrack to false for TCV < 250k with KCP deviations', async () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });

      const titleInput = screen.getByPlaceholderText(/Cloud Migration Project/i);
      const customerSelect = screen.getByRole('combobox');
      const tcvInput = screen.getByPlaceholderText('1000000');

      fireEvent.change(titleInput, { target: { value: 'Small Project' } });
      fireEvent.change(customerSelect, { target: { value: 'CUST-001' } });
      fireEvent.change(tcvInput, { target: { value: '200000' } });

      // Check KCP deviations
      const kcpCheckbox = screen.getByRole('checkbox', { name: /KCP Deviations/i });
      fireEvent.click(kcpCheckbox);

      const submitButton = screen.getByText('Crea Opportunità');
      fireEvent.click(submitButton);

      // Wait for async submission (500ms delay)
      await waitFor(() => {
        expect(mockAddOpportunity).toHaveBeenCalledWith(
          expect.objectContaining({
            isFastTrack: false,
          }),
          mockUserEmail
        );
      }, { timeout: 1000 });
    });

    it('should include all selected flags in created opportunity', async () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });

      const titleInput = screen.getByPlaceholderText(/Cloud Migration Project/i);
      const customerSelect = screen.getByRole('combobox');
      const tcvInput = screen.getByPlaceholderText('1000000');

      fireEvent.change(titleInput, { target: { value: 'Test Project' } });
      fireEvent.change(customerSelect, { target: { value: 'CUST-001' } });
      fireEvent.change(tcvInput, { target: { value: '1000000' } });

      // Check New Customer flag - Public Sector is auto-filled from customer
      const newCustomerLabel = screen.getByText('Nuovo Cliente');
      const newCustomerCheckbox = newCustomerLabel.closest('label')?.querySelector('input[type="checkbox"]');

      if (newCustomerCheckbox) {
        fireEvent.click(newCustomerCheckbox);
      }

      const submitButton = screen.getByText('Crea Opportunità');
      fireEvent.click(submitButton);

      // Wait for async submission (500ms delay)
      await waitFor(() => {
        expect(mockAddOpportunity).toHaveBeenCalledWith(
          expect.objectContaining({
            isPublicSector: false, // Auto-filled from customer (Acme Corp is not public sector)
            isNewCustomer: true,
          }),
          mockUserEmail
        );
      }, { timeout: 1000 });
    });
  });

  describe('User Authentication', () => {
    it('should prevent submission when user is not authenticated', async () => {
      // Mock useUserEmail to return null (not authenticated)
      vi.doMock('@/hooks/useUserEmail', () => ({
        useUserEmail: () => null,
      }));

      // Re-import component with mocked hook
      const { NewOpportunityPage: UnauthenticatedPage } = await import('./new');

      render(<UnauthenticatedPage />, { wrapper: AllProviders });

      // Fill in required fields
      const titleInput = screen.getByPlaceholderText(/Cloud Migration Project/i);
      const customerSelect = screen.getByRole('combobox');
      const tcvInput = screen.getByPlaceholderText('1000000');

      fireEvent.change(titleInput, { target: { value: 'Test Project' } });
      fireEvent.change(customerSelect, { target: { value: 'CUST-001' } });
      fireEvent.change(tcvInput, { target: { value: '500000' } });

      // Submit form
      const submitButton = screen.getByText('Crea Opportunità');
      fireEvent.click(submitButton);

      // Should NOT call addOpportunity
      await waitFor(() => {
        expect(mockAddOpportunity).not.toHaveBeenCalled();
      }, { timeout: 1000 });
    });
  });

  describe('Form Validation', () => {
    it('should require title field', () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });
      const titleInput = screen.getByPlaceholderText(/Cloud Migration Project/i);
      expect(titleInput).toHaveAttribute('required');
    });

    it('should render customer selection dropdown', () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });
      const customerSelect = screen.getByRole('combobox');
      expect(customerSelect).toBeInTheDocument();
      expect(screen.getByText('Seleziona Cliente...')).toBeInTheDocument();
    });

    it('should require TCV field', () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });
      const tcvInput = screen.getByPlaceholderText('1000000');
      expect(tcvInput).toHaveAttribute('required');
    });

    it('should show quick add customer button', () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });
      const quickAddButton = screen.getByTitle('Aggiungi Cliente Rapido');
      expect(quickAddButton).toBeInTheDocument();
    });
  });
  describe('Multi-Lot Functionality', () => {
    it('should create opportunity with multiple lots and correctly identify the Main Lot', async () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });

      // Fill Basic Info
      const titleInput = screen.getByPlaceholderText(/Cloud Migration Project/i);
      const customerSelect = screen.getByRole('combobox');
      // The TCV input is required for validation but will be overwritten
      const tcvInput = screen.getByPlaceholderText('1000000');

      fireEvent.change(titleInput, { target: { value: 'Multi-Lot Project' } });
      fireEvent.change(customerSelect, { target: { value: 'CUST-001' } });
      fireEvent.change(tcvInput, { target: { value: '1' } });

      // Enable Multi-Lot
      const multiLotToggle = screen.getByLabelText(/Abilita Multi-Lotto/i);
      fireEvent.click(multiLotToggle);

      // Verify Lot 1 inputs appear
      const lot1Name = screen.getByPlaceholderText('Es. Lotto 1');
      // Note: "Valore" is placeholder for Lot TCV, "Inc. Opzioni" for Raise TCV
      const lotTCVs = screen.getAllByPlaceholderText('Valore');
      const lotRaiseTCVs = screen.getAllByPlaceholderText('Inc. Opzioni');

      // Fill Lot 1 (Small Lot)
      fireEvent.change(lot1Name, { target: { value: 'Small Lot' } });
      fireEvent.change(lotTCVs[0], { target: { value: '100000' } });     // 100k
      fireEvent.change(lotRaiseTCVs[0], { target: { value: '120000' } }); // 120k

      // Add Lot 2
      fireEvent.click(screen.getByText('Aggiungi Lotto'));

      // Fill Lot 2 (Big Lot - Main Lot)
      const lotNames = screen.getAllByPlaceholderText('Es. Lotto 1');
      const lotTCVsUpdated = screen.getAllByPlaceholderText('Valore');
      const lotRaiseTCVsUpdated = screen.getAllByPlaceholderText('Inc. Opzioni');

      fireEvent.change(lotNames[1], { target: { value: 'Big Lot' } });
      fireEvent.change(lotTCVsUpdated[1], { target: { value: '500000' } });      // 500k
      fireEvent.change(lotRaiseTCVsUpdated[1], { target: { value: '550000' } }); // 550k

      // Submit
      fireEvent.click(screen.getByText('Crea Opportunità'));

      // Verify Submission
      await waitFor(() => {
        expect(mockAddOpportunity).toHaveBeenCalledWith(
          expect.objectContaining({
            isMultiLot: true,
            tcv: 500000,          // From Main Lot (Lot 2)
            raiseTcv: 550000,     // From Main Lot (Lot 2)
            lots: expect.arrayContaining([
              expect.objectContaining({ name: 'Small Lot', tcv: 100000 }),
              expect.objectContaining({ name: 'Big Lot', tcv: 500000 })
            ])
          }),
          mockUserEmail
        );
      });
    });
  });
});
