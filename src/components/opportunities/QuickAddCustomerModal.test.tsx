/**
 * QuickAddCustomerModal Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuickAddCustomerModal } from './QuickAddCustomerModal';

// Mock translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'form.titleAdd': 'Aggiungi Cliente',
        'form.labelName': 'Nome',
        'form.labelIndustry': 'Settore',
        'form.labelPublicSector': 'Settore Pubblico',
        'form.placeholderName': 'Nome cliente',
        'actions.cancel': 'Annulla',
        'actions.add': 'Aggiungi',
        'message.loading': 'Caricamento...',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock customer store
const mockAddCustomer = vi.fn();
vi.mock('../../stores/CustomerStore', () => ({
  useCustomers: () => ({
    addCustomer: mockAddCustomer,
  }),
}));

// Mock validation
vi.mock('../../lib/validation', () => ({
  validateCustomer: vi.fn().mockReturnValue({ success: true }),
}));

import { validateCustomer } from '../../lib/validation';

describe('QuickAddCustomerModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onCustomerCreated: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAddCustomer.mockResolvedValue('new-customer-id');
    (validateCustomer as ReturnType<typeof vi.fn>).mockReturnValue({ success: true });
  });

  describe('Rendering', () => {
    it('should not render when closed', () => {
      render(<QuickAddCustomerModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Aggiungi Cliente')).not.toBeInTheDocument();
    });

    it('should render modal when open', () => {
      render(<QuickAddCustomerModal {...defaultProps} />);
      expect(screen.getByText('Aggiungi Cliente')).toBeInTheDocument();
    });

    it('should render form fields', () => {
      render(<QuickAddCustomerModal {...defaultProps} />);

      expect(screen.getByPlaceholderText('Nome cliente')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Settore Pubblico')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<QuickAddCustomerModal {...defaultProps} />);

      expect(screen.getByText('Annulla')).toBeInTheDocument();
      expect(screen.getByText('Aggiungi')).toBeInTheDocument();
    });

    it('should have close button with aria-label', () => {
      render(<QuickAddCustomerModal {...defaultProps} />);
      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should update name field', () => {
      render(<QuickAddCustomerModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nome/);
      fireEvent.change(nameInput, { target: { value: 'Test Company' } });

      expect(nameInput).toHaveValue('Test Company');
    });

    it('should update industry field', () => {
      render(<QuickAddCustomerModal {...defaultProps} />);

      const industrySelect = screen.getByRole('combobox');
      fireEvent.change(industrySelect, { target: { value: 'Finance' } });

      expect(industrySelect).toHaveValue('Finance');
    });

    it('should toggle public sector checkbox', () => {
      render(<QuickAddCustomerModal {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });

  describe('Close Actions', () => {
    it('should call onClose when X button clicked', () => {
      const onClose = vi.fn();
      render(<QuickAddCustomerModal {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByLabelText('Close'));
      expect(onClose).toHaveBeenCalled();
    });

    it('should call onClose when Cancel button clicked', () => {
      const onClose = vi.fn();
      render(<QuickAddCustomerModal {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByText('Annulla'));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should call addCustomer on valid submit', async () => {
      const onCustomerCreated = vi.fn();
      const onClose = vi.fn();

      render(
        <QuickAddCustomerModal
          {...defaultProps}
          onCustomerCreated={onCustomerCreated}
          onClose={onClose}
        />
      );

      const nameInput = screen.getByLabelText(/Nome/);
      fireEvent.change(nameInput, { target: { value: 'Test Company' } });

      fireEvent.click(screen.getByText('Aggiungi'));

      await waitFor(() => {
        expect(mockAddCustomer).toHaveBeenCalledWith({
          name: 'Test Company',
          industry: 'Technology',
          isPublicSector: false,
        });
      });
    });

    it('should call onCustomerCreated with new ID', async () => {
      const onCustomerCreated = vi.fn();
      mockAddCustomer.mockResolvedValue('new-id-123');

      render(
        <QuickAddCustomerModal
          {...defaultProps}
          onCustomerCreated={onCustomerCreated}
        />
      );

      const nameInput = screen.getByLabelText(/Nome/);
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      fireEvent.click(screen.getByText('Aggiungi'));

      await waitFor(() => {
        expect(onCustomerCreated).toHaveBeenCalledWith('new-id-123');
      });
    });

    it('should close modal after successful submit', async () => {
      const onClose = vi.fn();

      render(<QuickAddCustomerModal {...defaultProps} onClose={onClose} />);

      const nameInput = screen.getByLabelText(/Nome/);
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      fireEvent.click(screen.getByText('Aggiungi'));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('Validation Errors', () => {
    it('should show validation errors', async () => {
      (validateCustomer as ReturnType<typeof vi.fn>).mockReturnValue({
        success: false,
        error: {
          issues: [{ path: ['name'], message: 'Name is required' }],
        },
      });

      render(<QuickAddCustomerModal {...defaultProps} />);

      fireEvent.click(screen.getByText('Aggiungi'));

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
    });

    it('should clear name error when field is edited', async () => {
      (validateCustomer as ReturnType<typeof vi.fn>).mockReturnValue({
        success: false,
        error: {
          issues: [{ path: ['name'], message: 'Name is required' }],
        },
      });

      render(<QuickAddCustomerModal {...defaultProps} />);

      fireEvent.click(screen.getByText('Aggiungi'));

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Nome/);
      fireEvent.change(nameInput, { target: { value: 'New Value' } });

      expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
    });
  });

  describe('Submit Errors', () => {
    it('should show error when addCustomer fails', async () => {
      mockAddCustomer.mockRejectedValue(new Error('Network error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<QuickAddCustomerModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nome/);
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      fireEvent.click(screen.getByText('Aggiungi'));

      await waitFor(() => {
        expect(screen.getByText('Failed to add customer. Please try again.')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Loading State', () => {
    it('should disable buttons while submitting', async () => {
      mockAddCustomer.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<QuickAddCustomerModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nome/);
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      fireEvent.click(screen.getByText('Aggiungi'));

      await waitFor(() => {
        expect(screen.getByText('Caricamento...')).toBeInTheDocument();
      });
    });
  });

  describe('Form Reset', () => {
    it('should reset form when modal closes', () => {
      const { rerender } = render(<QuickAddCustomerModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nome/);
      fireEvent.change(nameInput, { target: { value: 'Test Company' } });

      // Close modal
      rerender(<QuickAddCustomerModal {...defaultProps} isOpen={false} />);

      // Reopen modal
      rerender(<QuickAddCustomerModal {...defaultProps} isOpen={true} />);

      const newNameInput = screen.getByLabelText(/Nome/);
      expect(newNameInput).toHaveValue('');
    });
  });
});
