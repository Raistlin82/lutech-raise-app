import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewOpportunityPage } from './new';
import { CustomerProvider } from '../../stores/CustomerStore';
import React from 'react';

// Mock dependencies
const mockNavigate = vi.fn();
const mockAddOpportunity = vi.fn();
const mockSelectOpportunity = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../stores/OpportunitiesStore', () => ({
  useOpportunities: vi.fn(),
}));

// Import after mocking
import { useOpportunities } from '../../stores/OpportunitiesStore';

// Wrapper with CustomerProvider
const AllProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <CustomerProvider>
    {children}
  </CustomerProvider>
);

describe('NewOpportunityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
      opportunities: [],
      addOpportunity: mockAddOpportunity,
      selectOpportunity: mockSelectOpportunity,
      selectedOpp: null,
    });
  });

  describe('Rendering', () => {
    it('should render page heading', () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });
      expect(screen.getByText('New Opportunity')).toBeInTheDocument();
      expect(screen.getByText(/Create a new RAISE workflow opportunity/i)).toBeInTheDocument();
    });

    it('should render all form sections', () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByText('Financial Details')).toBeInTheDocument();
      expect(screen.getByText('Opportunity Flags')).toBeInTheDocument();
    });

    it('should render back button', () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });
      const backButton = screen.getByRole('button', { name: '' }); // ArrowLeft icon button
      expect(backButton).toBeInTheDocument();
    });

    it('should render form buttons', () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Create Opportunity')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should render all required input fields', () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });
      expect(screen.getByPlaceholderText(/Cloud Migration Project/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Acme Corporation/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('1000000')).toBeInTheDocument();
    });

    it('should render industry dropdown with default value', () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });
      const industrySelect = screen.getByDisplayValue('Technology');
      expect(industrySelect).toBeInTheDocument();
    });

    it('should render all checkbox flags', () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });
      // Use getByRole to find checkboxes by their accessible name
      expect(screen.getByRole('checkbox', { name: /Public Sector/i })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /RTI/i })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /KCP Deviations/i })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /New Customer/i })).toBeInTheDocument();
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

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith('/opportunities');
    });
  });

  describe('Form Submission', () => {
    it('should create opportunity with valid data', async () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });

      // Fill in required fields
      const titleInput = screen.getByPlaceholderText(/Cloud Migration Project/i);
      const clientInput = screen.getByPlaceholderText(/Acme Corporation/i);
      const tcvInput = screen.getByPlaceholderText('1000000');

      fireEvent.change(titleInput, { target: { value: 'Test Project' } });
      fireEvent.change(clientInput, { target: { value: 'Test Client' } });
      fireEvent.change(tcvInput, { target: { value: '500000' } });

      // Submit form
      const submitButton = screen.getByText('Create Opportunity');
      fireEvent.click(submitButton);

      // Wait for async submission (500ms delay)
      await waitFor(() => {
        expect(mockAddOpportunity).toHaveBeenCalled();
        expect(mockSelectOpportunity).toHaveBeenCalled();
      }, { timeout: 1000 });
    });

    it('should navigate to opportunity detail after creation', async () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });

      // Fill in required fields
      const titleInput = screen.getByPlaceholderText(/Cloud Migration Project/i);
      const clientInput = screen.getByPlaceholderText(/Acme Corporation/i);
      const tcvInput = screen.getByPlaceholderText('1000000');

      fireEvent.change(titleInput, { target: { value: 'Test Project' } });
      fireEvent.change(clientInput, { target: { value: 'Test Client' } });
      fireEvent.change(tcvInput, { target: { value: '500000' } });

      // Submit form
      const submitButton = screen.getByText('Create Opportunity');
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
      const clientInput = screen.getByPlaceholderText(/Acme Corporation/i);
      const tcvInput = screen.getByPlaceholderText('1000000');

      fireEvent.change(titleInput, { target: { value: 'Test Project' } });
      fireEvent.change(clientInput, { target: { value: 'Test Client' } });
      fireEvent.change(tcvInput, { target: { value: '750000' } });

      const submitButton = screen.getByText('Create Opportunity');
      fireEvent.click(submitButton);

      // Wait for async submission (500ms delay)
      await waitFor(() => {
        expect(mockAddOpportunity).toHaveBeenCalledWith(
          expect.objectContaining({
            tcv: 750000,
            raiseTcv: 750000,
          })
        );
      }, { timeout: 1000 });
    });

    it('should use provided RAISE TCV when specified', async () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });

      const titleInput = screen.getByPlaceholderText(/Cloud Migration Project/i);
      const clientInput = screen.getByPlaceholderText(/Acme Corporation/i);
      const tcvInput = screen.getByPlaceholderText('1000000');
      const raiseTcvInput = screen.getByPlaceholderText(/Same as TCV if empty/i);

      fireEvent.change(titleInput, { target: { value: 'Test Project' } });
      fireEvent.change(clientInput, { target: { value: 'Test Client' } });
      fireEvent.change(tcvInput, { target: { value: '750000' } });
      fireEvent.change(raiseTcvInput, { target: { value: '900000' } });

      const submitButton = screen.getByText('Create Opportunity');
      fireEvent.click(submitButton);

      // Wait for async submission (500ms delay)
      await waitFor(() => {
        expect(mockAddOpportunity).toHaveBeenCalledWith(
          expect.objectContaining({
            tcv: 750000,
            raiseTcv: 900000,
          })
        );
      }, { timeout: 1000 });
    });

    it('should set isFastTrack to true for TCV < 250k without KCP deviations', async () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });

      const titleInput = screen.getByPlaceholderText(/Cloud Migration Project/i);
      const clientInput = screen.getByPlaceholderText(/Acme Corporation/i);
      const tcvInput = screen.getByPlaceholderText('1000000');

      fireEvent.change(titleInput, { target: { value: 'Small Project' } });
      fireEvent.change(clientInput, { target: { value: 'Test Client' } });
      fireEvent.change(tcvInput, { target: { value: '200000' } });

      const submitButton = screen.getByText('Create Opportunity');
      fireEvent.click(submitButton);

      // Wait for async submission (500ms delay)
      await waitFor(() => {
        expect(mockAddOpportunity).toHaveBeenCalledWith(
          expect.objectContaining({
            isFastTrack: true,
          })
        );
      }, { timeout: 1000 });
    });

    it('should set isFastTrack to false for TCV < 250k with KCP deviations', async () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });

      const titleInput = screen.getByPlaceholderText(/Cloud Migration Project/i);
      const clientInput = screen.getByPlaceholderText(/Acme Corporation/i);
      const tcvInput = screen.getByPlaceholderText('1000000');

      fireEvent.change(titleInput, { target: { value: 'Small Project' } });
      fireEvent.change(clientInput, { target: { value: 'Test Client' } });
      fireEvent.change(tcvInput, { target: { value: '200000' } });

      // Check KCP deviations
      const kcpCheckbox = screen.getByRole('checkbox', { name: /KCP Deviations/i });
      fireEvent.click(kcpCheckbox);

      const submitButton = screen.getByText('Create Opportunity');
      fireEvent.click(submitButton);

      // Wait for async submission (500ms delay)
      await waitFor(() => {
        expect(mockAddOpportunity).toHaveBeenCalledWith(
          expect.objectContaining({
            isFastTrack: false,
          })
        );
      }, { timeout: 1000 });
    });

    it('should include all selected flags in created opportunity', async () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });

      const titleInput = screen.getByPlaceholderText(/Cloud Migration Project/i);
      const clientInput = screen.getByPlaceholderText(/Acme Corporation/i);
      const tcvInput = screen.getByPlaceholderText('1000000');

      fireEvent.change(titleInput, { target: { value: 'Test Project' } });
      fireEvent.change(clientInput, { target: { value: 'Test Client' } });
      fireEvent.change(tcvInput, { target: { value: '1000000' } });

      // Check various flags
      const publicSectorCheckbox = screen.getByRole('checkbox', { name: /Public Sector/i });
      const newCustomerCheckbox = screen.getByRole('checkbox', { name: /New Customer/i });

      fireEvent.click(publicSectorCheckbox);
      fireEvent.click(newCustomerCheckbox);

      const submitButton = screen.getByText('Create Opportunity');
      fireEvent.click(submitButton);

      // Wait for async submission (500ms delay)
      await waitFor(() => {
        expect(mockAddOpportunity).toHaveBeenCalledWith(
          expect.objectContaining({
            isPublicSector: true,
            isNewCustomer: true,
          })
        );
      }, { timeout: 1000 });
    });
  });

  describe('Form Validation', () => {
    it('should require title field', () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });
      const titleInput = screen.getByPlaceholderText(/Cloud Migration Project/i);
      expect(titleInput).toHaveAttribute('required');
    });

    it('should require client name field', () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });
      const clientInput = screen.getByPlaceholderText(/Acme Corporation/i);
      expect(clientInput).toHaveAttribute('required');
    });

    it('should require TCV field', () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });
      const tcvInput = screen.getByPlaceholderText('1000000');
      expect(tcvInput).toHaveAttribute('required');
    });

    it('should enforce minimum value for TCV', () => {
      render(<NewOpportunityPage />, { wrapper: AllProviders });
      const tcvInput = screen.getByPlaceholderText('1000000');
      expect(tcvInput).toHaveAttribute('min', '0');
    });
  });
});
