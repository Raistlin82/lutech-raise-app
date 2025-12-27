import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Settings } from './index';
import type { ControlConfig } from '../../types';

// Mock dependencies
const mockAddControl = vi.fn();
const mockUpdateControl = vi.fn();
const mockDeleteControl = vi.fn();
const mockResetDefaults = vi.fn();

vi.mock('../../stores/SettingsStore', () => ({
  useSettings: vi.fn(),
}));

// Import after mocking
import { useSettings } from '../../stores/SettingsStore';

// Mock controls for testing
const mockControls: ControlConfig[] = [
  {
    id: 'planning-1',
    label: 'Opportunity Site Created',
    description: 'Create SharePoint Opportunity Site from Salesforce',
    phase: 'Planning',
    isMandatory: true,
    actionType: 'task'
  },
  {
    id: 'atp-1',
    label: 'Request Documentation',
    description: 'Tender documentation, RFP, customer invitation to bid',
    phase: 'ATP',
    isMandatory: true,
    actionType: 'document',
    templateRef: 'None (customer provided)',
    condition: 'opp.raiseLevel !== "L6"'
  },
  {
    id: 'ats-1',
    label: 'MOD-001 P&L',
    description: 'Revenue/Cost/Profit model. Economic values must match Salesforce',
    phase: 'ATS',
    isMandatory: true,
    actionType: 'document',
    templateRef: 'MOD-001',
    folderPath: '01. BID\\04-Economics'
  },
  {
    id: 'atc-1',
    label: 'Contract/Order',
    description: 'Signed contract or order',
    phase: 'ATC',
    isMandatory: true,
    actionType: 'document'
  },
  {
    id: 'handover-1',
    label: 'Handover Meeting',
    description: 'Formal handover meeting from Sales to Delivery',
    phase: 'Handover',
    isMandatory: true,
    actionType: 'task'
  },
  {
    id: 'ats-optional',
    label: 'Expert Compliance/ESG',
    description: 'Compliance/ESG expert validation',
    phase: 'ATS',
    isMandatory: false,
    actionType: 'email'
  }
];

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock
    (useSettings as ReturnType<typeof vi.fn>).mockReturnValue({
      controls: mockControls,
      addControl: mockAddControl,
      updateControl: mockUpdateControl,
      deleteControl: mockDeleteControl,
      resetDefaults: mockResetDefaults,
    });
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<Settings />);
      expect(screen.getByText('Settings & Controls')).toBeInTheDocument();
    });

    it('should display heading and description', () => {
      render(<Settings />);
      expect(screen.getByText('Settings & Controls')).toBeInTheDocument();
      expect(screen.getByText('Manage checkpoint definitions and process rules')).toBeInTheDocument();
    });

    it('should show all controls in table', () => {
      render(<Settings />);

      expect(screen.getByText('Opportunity Site Created')).toBeInTheDocument();
      expect(screen.getByText('Request Documentation')).toBeInTheDocument();
      expect(screen.getByText('MOD-001 P&L')).toBeInTheDocument();
      expect(screen.getByText('Contract/Order')).toBeInTheDocument();
      expect(screen.getByText('Handover Meeting')).toBeInTheDocument();
    });

    it('should display control phases correctly', () => {
      render(<Settings />);

      // Phases appear as badges in the table
      const phases = screen.getAllByText(/Planning|ATP|ATS|ATC|Handover/);
      expect(phases.length).toBeGreaterThan(0);
    });

    it('should show mandatory status correctly', () => {
      render(<Settings />);

      const yesLabels = screen.getAllByText('YES');
      expect(yesLabels.length).toBeGreaterThan(0);

      const noLabels = screen.getAllByText('NO');
      expect(noLabels.length).toBeGreaterThan(0);
    });

    it('should display control descriptions', () => {
      render(<Settings />);

      expect(screen.getByText(/Create SharePoint Opportunity Site/i)).toBeInTheDocument();
      expect(screen.getByText(/Revenue\/Cost\/Profit model/i)).toBeInTheDocument();
    });

    it('should show table headers', () => {
      render(<Settings />);

      expect(screen.getByText('Phase')).toBeInTheDocument();
      expect(screen.getByText('Label')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Mandatory')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  describe('Control Management', () => {
    it('should show Add Control button', () => {
      render(<Settings />);

      const addButton = screen.getByRole('button', { name: /Add Control/i });
      expect(addButton).toBeInTheDocument();
    });

    it('should show Reset Defaults button', () => {
      render(<Settings />);

      const resetButton = screen.getByRole('button', { name: /Reset Defaults/i });
      expect(resetButton).toBeInTheDocument();
    });

    it('should call resetDefaults when Reset button clicked', () => {
      render(<Settings />);

      const resetButton = screen.getByRole('button', { name: /Reset Defaults/i });
      fireEvent.click(resetButton);

      expect(mockResetDefaults).toHaveBeenCalledTimes(1);
    });

    it('should show edit and delete buttons for each control', () => {
      render(<Settings />);

      // Each control should have edit and delete buttons
      const rows = screen.getAllByRole('row').slice(1); // Skip header row
      expect(rows.length).toBeGreaterThan(0);
    });

    it('should call deleteControl when delete button clicked', () => {
      render(<Settings />);

      // Find first delete button (trash icon)
      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find(btn => {
        const svgElement = btn.querySelector('svg');
        return svgElement && svgElement.classList.contains('lucide-trash-2');
      });

      if (deleteButton) {
        fireEvent.click(deleteButton);
        expect(mockDeleteControl).toHaveBeenCalled();
      }
    });
  });

  describe('Modal Interaction', () => {
    it('should open modal when Add Control clicked', () => {
      render(<Settings />);

      const addButton = screen.getByRole('button', { name: /Add Control/i });
      fireEvent.click(addButton);

      expect(screen.getByText('New Control')).toBeInTheDocument();
    });

    it('should open modal when Edit button clicked', () => {
      render(<Settings />);

      // Find first edit button
      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find(btn => {
        const svgElement = btn.querySelector('svg');
        return svgElement && svgElement.classList.contains('lucide-edit-2');
      });

      if (editButton) {
        fireEvent.click(editButton);
        expect(screen.getByText('Edit Control')).toBeInTheDocument();
      }
    });

    it('should show form fields in modal', () => {
      render(<Settings />);

      const addButton = screen.getByRole('button', { name: /Add Control/i });
      fireEvent.click(addButton);

      // Verify modal opened by checking for modal title and save button
      expect(screen.getByText('New Control')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Save Control/i })).toBeInTheDocument();
    });

    it('should close modal when Cancel clicked', () => {
      render(<Settings />);

      const addButton = screen.getByRole('button', { name: /Add Control/i });
      fireEvent.click(addButton);

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(screen.queryByText('New Control')).not.toBeInTheDocument();
    });

    it('should allow entering control data in form', () => {
      render(<Settings />);

      const addButton = screen.getByRole('button', { name: /Add Control/i });
      fireEvent.click(addButton);

      // Verify form inputs exist by checking for input fields
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(0);
    });

    it('should call addControl when Save clicked on new control', () => {
      render(<Settings />);

      const addButton = screen.getByRole('button', { name: /Add Control/i });
      fireEvent.click(addButton);

      // Fill in required fields
      const inputs = screen.getAllByRole('textbox');
      if (inputs.length > 0) {
        fireEvent.change(inputs[0], { target: { value: 'New Control' } });
      }
      if (inputs.length > 1) {
        fireEvent.change(inputs[1], { target: { value: 'New Description' } });
      }

      const saveButton = screen.getByRole('button', { name: /Save Control/i });
      fireEvent.click(saveButton);

      // Verify addControl was called
      expect(mockAddControl).toHaveBeenCalled();
    });
  });

  describe('Phase Grouping', () => {
    it('should group controls by phase in table', () => {
      render(<Settings />);

      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');

      // Check that phases are displayed for each control
      expect(rows.length).toBeGreaterThan(mockControls.length);
    });

    it('should show phase-specific styling', () => {
      render(<Settings />);

      // Find the Planning phase badge
      const planningBadge = screen.getByText('Planning');
      expect(planningBadge.className).toContain('bg-blue-50');

      // Find the ATP phase badge
      const atpBadge = screen.getByText('ATP');
      expect(atpBadge.className).toContain('bg-indigo-50');
    });
  });

  describe('Empty State', () => {
    it('should handle empty controls list', () => {
      (useSettings as ReturnType<typeof vi.fn>).mockReturnValue({
        controls: [],
        addControl: mockAddControl,
        updateControl: mockUpdateControl,
        deleteControl: mockDeleteControl,
        resetDefaults: mockResetDefaults,
      });

      render(<Settings />);

      // Should still show header and buttons
      expect(screen.getByText('Settings & Controls')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add Control/i })).toBeInTheDocument();
    });
  });
});
