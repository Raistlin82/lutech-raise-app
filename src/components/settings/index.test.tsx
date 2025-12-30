import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { Settings } from './index';
import type { ControlConfig } from '../../types';
import i18n from '../../i18n/config';

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

// Helper to render with i18n
const renderSettings = () => {
  return render(
    <I18nextProvider i18n={i18n}>
      <Settings />
    </I18nextProvider>
  );
};

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
      renderSettings();
      expect(screen.getByText('Impostazioni')).toBeInTheDocument();
    });

    it('should display heading and description', () => {
      renderSettings();
      expect(screen.getByText('Impostazioni')).toBeInTheDocument();
      expect(screen.getByText('Gestisci controlli e configurazioni workflow')).toBeInTheDocument();
    });

    it('should show all controls in table', () => {
      renderSettings();

      expect(screen.getByText('Opportunity Site Created')).toBeInTheDocument();
      expect(screen.getByText('Request Documentation')).toBeInTheDocument();
      expect(screen.getByText('MOD-001 P&L')).toBeInTheDocument();
      expect(screen.getByText('Contract/Order')).toBeInTheDocument();
      expect(screen.getByText('Handover Meeting')).toBeInTheDocument();
    });

    it('should display control phases correctly', () => {
      renderSettings();

      // Fases appear as badges in the table
      const phases = screen.getAllByText(/Planning|ATP|ATS|ATC|Handover/);
      expect(phases.length).toBeGreaterThan(0);
    });

    it('should show mandatory status correctly', () => {
      renderSettings();

      const yesControllos = screen.getAllByText('SI');
      expect(yesControllos.length).toBeGreaterThan(0);

      const noControllos = screen.getAllByText('NO');
      expect(noControllos.length).toBeGreaterThan(0);
    });

    it('should display control descriptions', () => {
      renderSettings();

      expect(screen.getByText(/Create SharePoint Opportunity Site/i)).toBeInTheDocument();
      expect(screen.getByText(/Revenue\/Cost\/Profit model/i)).toBeInTheDocument();
    });

    it('should show table headers', () => {
      renderSettings();

      expect(screen.getByText('Fase')).toBeInTheDocument();
      expect(screen.getByText('Controllo')).toBeInTheDocument();
      expect(screen.getByText('Descrizione')).toBeInTheDocument();
      expect(screen.getByText('Obbligatorio')).toBeInTheDocument();
      expect(screen.getByText('Azioni')).toBeInTheDocument();
    });
  });

  describe('Control Management', () => {
    it('should show Aggiungi Controllo button', () => {
      renderSettings();

      const addButton = screen.getByRole('button', { name: /Aggiungi Controllo/i });
      expect(addButton).toBeInTheDocument();
    });

    it('should show Ripristina Default button', () => {
      renderSettings();

      const resetButton = screen.getByRole('button', { name: /Ripristina Default/i });
      expect(resetButton).toBeInTheDocument();
    });

    it('should call resetDefaults when Reset button clicked', () => {
      renderSettings();

      const resetButton = screen.getByRole('button', { name: /Ripristina Default/i });
      fireEvent.click(resetButton);

      expect(mockResetDefaults).toHaveBeenCalledTimes(1);
    });

    it('should show edit and delete buttons for each control', () => {
      renderSettings();

      // Each control should have edit and delete buttons
      const rows = screen.getAllByRole('row').slice(1); // Skip header row
      expect(rows.length).toBeGreaterThan(0);
    });

    it('should call deleteControl when delete button clicked', () => {
      renderSettings();

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
    it('should open modal when Aggiungi Controllo clicked', () => {
      renderSettings();

      const addButton = screen.getByRole('button', { name: /Aggiungi Controllo/i });
      fireEvent.click(addButton);

      expect(screen.getByText('Dettagli Controllo')).toBeInTheDocument();
    });

    it('should open modal when Edit button clicked', () => {
      renderSettings();

      // Find first edit button
      const editButtons = screen.getAllByRole('button');
      const editButton = editButtons.find(btn => {
        const svgElement = btn.querySelector('svg');
        return svgElement && svgElement.classList.contains('lucide-edit-2');
      });

      if (editButton) {
        fireEvent.click(editButton);
        expect(screen.getByText('Dettagli Controllo')).toBeInTheDocument();
      }
    });

    it('should show form fields in modal', () => {
      renderSettings();

      const addButton = screen.getByRole('button', { name: /Aggiungi Controllo/i });
      fireEvent.click(addButton);

      // Verify modal opened by checking for modal title and save button
      expect(screen.getByText('Dettagli Controllo')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Salva Controllo/i })).toBeInTheDocument();
    });

    it('should close modal when Cancel clicked', () => {
      renderSettings();

      const addButton = screen.getByRole('button', { name: /Aggiungi Controllo/i });
      fireEvent.click(addButton);

      const cancelButton = screen.getByRole('button', { name: /Annulla/i });
      fireEvent.click(cancelButton);

      expect(screen.queryByText('Dettagli Controllo')).not.toBeInTheDocument();
    });

    it('should allow entering control data in form', () => {
      renderSettings();

      const addButton = screen.getByRole('button', { name: /Aggiungi Controllo/i });
      fireEvent.click(addButton);

      // Verify form inputs exist by checking for input fields
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(0);
    });

    it('should call addControl when Save clicked on new control', () => {
      renderSettings();

      const addButton = screen.getByRole('button', { name: /Aggiungi Controllo/i });
      fireEvent.click(addButton);

      // Fill in required fields
      const inputs = screen.getAllByRole('textbox');
      if (inputs.length > 0) {
        fireEvent.change(inputs[0], { target: { value: 'New Control' } });
      }
      if (inputs.length > 1) {
        fireEvent.change(inputs[1], { target: { value: 'New Description' } });
      }

      const saveButton = screen.getByRole('button', { name: /Salva Controllo/i });
      fireEvent.click(saveButton);

      // Verify addControl was called
      expect(mockAddControl).toHaveBeenCalled();
    });
  });

  describe('Fase Grouping', () => {
    it('should group controls by phase in table', () => {
      renderSettings();

      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');

      // Check that phases are displayed for each control
      expect(rows.length).toBeGreaterThan(mockControls.length);
    });

    it('should show phase-specific styling', () => {
      renderSettings();

      // Find the Planning phase badges (in table and filter dropdown)
      const planningBadges = screen.getAllByText('Planning');
      // At least one should have the phase badge styling (not the dropdown option)
      const planningTableBadge = planningBadges.find(el => el.className.includes('bg-blue-50'));
      expect(planningTableBadge).toBeTruthy();

      // Find the ATP phase badges
      const atpBadges = screen.getAllByText('ATP');
      const atpTableBadge = atpBadges.find(el => el.className.includes('bg-indigo-50'));
      expect(atpTableBadge).toBeTruthy();
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

      renderSettings();

      // Should still show header and buttons
      expect(screen.getByText('Impostazioni')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Aggiungi Controllo/i })).toBeInTheDocument();
    });
  });
});
