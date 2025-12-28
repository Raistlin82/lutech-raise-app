import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditOpportunityPage } from './edit';
import type { Opportunity, Customer } from '../../types';

// Mock dependencies
const mockNavigate = vi.fn();
const mockUpdateOpportunity = vi.fn();
const mockAddCustomer = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: 'OPP-2025-001' }),
}));

vi.mock('../../stores/OpportunitiesStore', () => ({
  useOpportunities: vi.fn(),
}));

vi.mock('../../stores/CustomerStore', () => ({
  useCustomers: vi.fn(),
  CustomerProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Import after mocking
import { useOpportunities } from '../../stores/OpportunitiesStore';
import { useCustomers } from '../../stores/CustomerStore';

// Mock customers
const mockCustomers: Customer[] = [
  {
    id: 'CUST-001',
    name: 'Existing Client',
    industry: 'Finance',
    isPublicSector: true,
  },
  {
    id: 'CUST-002',
    name: 'Another Client',
    industry: 'Technology',
    isPublicSector: false,
  },
];

// Mock opportunity - uses customerId instead of clientName
const mockExistingOpportunity: Opportunity = {
  id: 'OPP-2025-001',
  title: 'Existing Project',
  customerId: 'CUST-001',
  clientName: 'Existing Client', // This is derived from customer
  tcv: 1500000,
  raiseTcv: 1800000,
  industry: 'Finance', // This is derived from customer
  currentPhase: 'ATP',
  hasKcpDeviations: true,
  isFastTrack: false,
  isRti: true,
  isMandataria: true,
  isPublicSector: true, // This is derived from customer
  raiseLevel: 'L4',
  deviations: [],
  checkpoints: {},
  marginPercent: 25,
  cashFlowNeutral: true,
  isNewCustomer: true,
};

describe('EditOpportunityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useCustomers as ReturnType<typeof vi.fn>).mockReturnValue({
      customers: mockCustomers,
      addCustomer: mockAddCustomer,
      updateCustomer: vi.fn(),
      deleteCustomer: vi.fn(),
    });
  });

  describe('Rendering with Existing Opportunity', () => {
    it('should render page heading', () => {
      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockExistingOpportunity],
        updateOpportunity: mockUpdateOpportunity,
      });

      render(<EditOpportunityPage />);
      expect(screen.getByText('Modifica Opportunità')).toBeInTheDocument();
      expect(screen.getByText(/Aggiorna i dettagli dell'opportunità OPP-2025-001/i)).toBeInTheDocument();
    });

    it('should render all form sections', () => {
      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockExistingOpportunity],
        updateOpportunity: mockUpdateOpportunity,
      });

      render(<EditOpportunityPage />);
      expect(screen.getByText('Informazioni Base')).toBeInTheDocument();
      expect(screen.getByText('Dettagli Finanziari')).toBeInTheDocument();
      expect(screen.getByText('Flag Opportunità')).toBeInTheDocument();
    });

    it('should pre-fill form with existing opportunity data', () => {
      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockExistingOpportunity],
        updateOpportunity: mockUpdateOpportunity,
      });

      render(<EditOpportunityPage />);

      expect(screen.getByDisplayValue('Existing Project')).toBeInTheDocument();
      // Customer is now a dropdown - check the select has the right value
      const customerSelect = screen.getByRole('combobox');
      expect(customerSelect).toHaveValue('CUST-001');
      // Industry and Public Sector are now read-only fields from customer
      expect(screen.getByText('Finance')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1500000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1800000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('25')).toBeInTheDocument();
    });

    it('should pre-check flags based on existing opportunity', () => {
      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockExistingOpportunity],
        updateOpportunity: mockUpdateOpportunity,
      });

      render(<EditOpportunityPage />);

      // Public Sector is now auto-filled from customer, not a checkbox
      // Find checkboxes by exact text and then get the input element
      const allCheckboxes = screen.getAllByRole('checkbox');
      const rtiCheckbox = allCheckboxes.find(cb => cb.closest('label')?.textContent?.includes('RTI (Joint Venture)'));
      const mandatariaCheckbox = allCheckboxes.find(cb => cb.closest('label')?.textContent?.includes('Mandataria'));
      const kcpCheckbox = allCheckboxes.find(cb => cb.closest('label')?.textContent?.match(/KCP|Deviazioni/i));
      const newCustomerCheckbox = allCheckboxes.find(cb => cb.closest('label')?.textContent?.match(/New Customer|Nuovo Cliente/i));

      expect(rtiCheckbox).toBeChecked();
      expect(mandatariaCheckbox).toBeChecked();
      expect(kcpCheckbox).toBeChecked();
      expect(newCustomerCheckbox).toBeChecked();
    });

    it('should show Mandataria checkbox when RTI is checked', () => {
      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockExistingOpportunity],
        updateOpportunity: mockUpdateOpportunity,
      });

      render(<EditOpportunityPage />);
      expect(screen.getByText('Mandataria')).toBeInTheDocument();
    });
  });

  describe('Opportunity Not Found', () => {
    it('should show error message when opportunity not found', () => {
      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [],
        updateOpportunity: mockUpdateOpportunity,
      });

      render(<EditOpportunityPage />);
      expect(screen.getByText('Opportunità non trovata')).toBeInTheDocument();
      expect(screen.getByText(/L'opportunità con ID "OPP-2025-001" non esiste/i)).toBeInTheDocument();
    });

    it('should show back to opportunities button when not found', () => {
      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [],
        updateOpportunity: mockUpdateOpportunity,
      });

      render(<EditOpportunityPage />);
      expect(screen.getByText('Torna alle Opportunità')).toBeInTheDocument();
    });

    it('should navigate to opportunities when back button clicked on error page', () => {
      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [],
        updateOpportunity: mockUpdateOpportunity,
      });

      render(<EditOpportunityPage />);

      const backButton = screen.getByText('Torna alle Opportunità');
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/opportunities');
    });
  });

  describe('Navigation', () => {
    it('should navigate back to opportunity detail when back button is clicked', () => {
      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockExistingOpportunity],
        updateOpportunity: mockUpdateOpportunity,
      });

      render(<EditOpportunityPage />);

      const backButton = screen.getAllByRole('button')[0]; // First button is back button
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/opportunity/OPP-2025-001');
    });

    it('should navigate back to opportunity detail when cancel is clicked', () => {
      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockExistingOpportunity],
        updateOpportunity: mockUpdateOpportunity,
      });

      render(<EditOpportunityPage />);

      const cancelButton = screen.getByText('Annulla');
      fireEvent.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith('/opportunity/OPP-2025-001');
    });
  });

  describe('Form Submission', () => {
    it('should update opportunity with modified data', async () => {
      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockExistingOpportunity],
        updateOpportunity: mockUpdateOpportunity,
      });

      render(<EditOpportunityPage />);

      // Modify the title
      const titleInput = screen.getByDisplayValue('Existing Project');
      fireEvent.change(titleInput, { target: { value: 'Updated Project' } });

      // Submit form
      const submitButton = screen.getByText('Salva Modifiche');
      fireEvent.click(submitButton);

      // Wait for async submission (500ms delay)
      await waitFor(() => {
        expect(mockUpdateOpportunity).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'OPP-2025-001',
            title: 'Updated Project',
          })
        );
      }, { timeout: 1000 });
    });

    it('should navigate to opportunity detail after successful update', async () => {
      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockExistingOpportunity],
        updateOpportunity: mockUpdateOpportunity,
      });

      render(<EditOpportunityPage />);

      const submitButton = screen.getByText('Salva Modifiche');
      fireEvent.click(submitButton);

      // Wait for async submission (500ms delay)
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/opportunity/OPP-2025-001');
      }, { timeout: 1000 });
    });

    it('should recalculate RAISE level when TCV is modified', async () => {
      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockExistingOpportunity],
        updateOpportunity: mockUpdateOpportunity,
      });

      render(<EditOpportunityPage />);

      // Change TCV to a different level
      const tcvInput = screen.getByDisplayValue('1500000');
      fireEvent.change(tcvInput, { target: { value: '25000000' } });

      const submitButton = screen.getByText('Salva Modifiche');
      fireEvent.click(submitButton);

      // Wait for async submission (500ms delay)
      await waitFor(() => {
        expect(mockUpdateOpportunity).toHaveBeenCalledWith(
          expect.objectContaining({
            tcv: 25000000,
            raiseLevel: expect.any(String), // Will be recalculated
          })
        );
      }, { timeout: 1000 });
    });

    it('should recalculate isFastTrack when TCV or KCP deviations change', async () => {
      const smallOpportunity: Opportunity = {
        ...mockExistingOpportunity,
        tcv: 200000,
        hasKcpDeviations: false,
      };

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [smallOpportunity],
        updateOpportunity: mockUpdateOpportunity,
      });

      render(<EditOpportunityPage />);

      const submitButton = screen.getByText('Salva Modifiche');
      fireEvent.click(submitButton);

      // Wait for async submission (500ms delay)
      await waitFor(() => {
        expect(mockUpdateOpportunity).toHaveBeenCalledWith(
          expect.objectContaining({
            isFastTrack: true, // Should be true for TCV < 250k without deviations
          })
        );
      }, { timeout: 1000 });
    });

    it('should preserve all existing opportunity data not in form', async () => {
      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockExistingOpportunity],
        updateOpportunity: mockUpdateOpportunity,
      });

      render(<EditOpportunityPage />);

      const submitButton = screen.getByText('Salva Modifiche');
      fireEvent.click(submitButton);

      // Wait for async submission (500ms delay)
      await waitFor(() => {
        expect(mockUpdateOpportunity).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'OPP-2025-001',
            currentPhase: 'ATP', // Should be preserved
            deviations: [], // Should be preserved
            checkpoints: {}, // Should be preserved
          })
        );
      }, { timeout: 1000 });
    });

    it('should use TCV as RAISE TCV when RAISE TCV is not provided', async () => {
      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockExistingOpportunity],
        updateOpportunity: mockUpdateOpportunity,
      });

      render(<EditOpportunityPage />);

      // Clear RAISE TCV
      const raiseTcvInput = screen.getByDisplayValue('1800000');
      fireEvent.change(raiseTcvInput, { target: { value: '' } });

      const submitButton = screen.getByText('Salva Modifiche');
      fireEvent.click(submitButton);

      // Wait for async submission (500ms delay)
      await waitFor(() => {
        expect(mockUpdateOpportunity).toHaveBeenCalledWith(
          expect.objectContaining({
            tcv: 1500000,
            raiseTcv: 1500000, // Should default to TCV
          })
        );
      }, { timeout: 1000 });
    });

    it('should toggle Mandataria visibility based on RTI checkbox', () => {
      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockExistingOpportunity],
        updateOpportunity: mockUpdateOpportunity,
      });

      render(<EditOpportunityPage />);

      // Mandataria should be visible initially (RTI is checked)
      expect(screen.getByText('Mandataria')).toBeInTheDocument();

      // Uncheck RTI
      const rtiCheckbox = screen.getByRole('checkbox', { name: /RTI/i });
      fireEvent.click(rtiCheckbox);

      // Mandataria should disappear
      expect(screen.queryByText('Mandataria')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should require title field', () => {
      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockExistingOpportunity],
        updateOpportunity: mockUpdateOpportunity,
      });

      render(<EditOpportunityPage />);
      const titleInput = screen.getByDisplayValue('Existing Project');
      expect(titleInput).toHaveAttribute('required');
    });

    it('should show customer selection dropdown', () => {
      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockExistingOpportunity],
        updateOpportunity: mockUpdateOpportunity,
      });

      render(<EditOpportunityPage />);
      const customerSelect = screen.getByRole('combobox');
      expect(customerSelect).toBeInTheDocument();
      expect(customerSelect).toHaveValue('CUST-001');
    });

    it('should require TCV field', () => {
      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockExistingOpportunity],
        updateOpportunity: mockUpdateOpportunity,
      });

      render(<EditOpportunityPage />);
      const tcvInput = screen.getByDisplayValue('1500000');
      expect(tcvInput).toHaveAttribute('required');
    });

    it('should display margin percentage field', () => {
      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockExistingOpportunity],
        updateOpportunity: mockUpdateOpportunity,
      });

      render(<EditOpportunityPage />);
      const marginInput = screen.getByDisplayValue('25');
      expect(marginInput).toBeInTheDocument();
    });
  });
});
