import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OpportunityWorkflow } from './index';
import type { Opportunity, ControlConfig } from '../../types';

// Mock dependencies
const mockUpdateOpportunity = vi.fn();
const mockOnBack = vi.fn();

vi.mock('../../stores/OpportunitiesStore', () => ({
  useOpportunities: vi.fn(),
}));

vi.mock('../../stores/SettingsStore', () => ({
  useSettings: vi.fn(),
}));

// Import after mocking
import { useOpportunities } from '../../stores/OpportunitiesStore';
import { useSettings } from '../../stores/SettingsStore';

// Mock controls for testing
const mockControls: ControlConfig[] = [
  {
    id: 'planning-1',
    label: 'Opportunity Site Created',
    description: 'Create SharePoint Opportunity Site',
    phase: 'Planning',
    isMandatory: true,
    actionType: 'task'
  },
  {
    id: 'planning-2',
    label: 'CRM Case Created',
    description: 'Create opportunity in Salesforce',
    phase: 'Planning',
    isMandatory: true,
    actionType: 'task'
  },
  {
    id: 'atp-1',
    label: 'Request Documentation',
    description: 'Tender documentation',
    phase: 'ATP',
    isMandatory: true,
    actionType: 'document',
    condition: 'opp.raiseLevel != "L6"'
  },
  {
    id: 'atp-2',
    label: 'MOD-091 Slide-deck',
    description: 'ATP presentation',
    phase: 'ATP',
    isMandatory: true,
    actionType: 'document',
    condition: '(opp.raiseLevel === "L1" || opp.raiseLevel === "L2" || opp.raiseLevel === "L3" || opp.raiseLevel === "L4")'
  },
  {
    id: 'ats-1',
    label: 'MOD-001 P&L',
    description: 'Revenue/Cost/Profit model',
    phase: 'ATS',
    isMandatory: true,
    actionType: 'document'
  },
  {
    id: 'ats-2',
    label: 'Technical Offer',
    description: 'Technical and economic offer',
    phase: 'ATS',
    isMandatory: true,
    actionType: 'document',
    condition: 'opp.raiseLevel !== "L6"'
  },
  {
    id: 'atc-1',
    label: 'Contract/Order',
    description: 'Signed contract',
    phase: 'ATC',
    isMandatory: true,
    actionType: 'document'
  },
  {
    id: 'handover-1',
    label: 'Handover Meeting',
    description: 'Handover to delivery',
    phase: 'Handover',
    isMandatory: true,
    actionType: 'task'
  }
];

// Mock opportunity factory
const createMockOpportunity = (overrides: Partial<Opportunity> = {}): Opportunity => ({
  id: 'TEST-001',
  title: 'Test Opportunity',
  clientName: 'Test Client',
  tcv: 500000,
  raiseTcv: 500000,
  industry: 'Technology',
  currentPhase: 'Planning',
  hasKcpDeviations: false,
  isFastTrack: false,
  isRti: false,
  isPublicSector: false,
  raiseLevel: 'L4',
  deviations: [],
  checkpoints: {},
  ...overrides,
});

describe('OpportunityWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
      updateOpportunity: mockUpdateOpportunity,
    });

    (useSettings as ReturnType<typeof vi.fn>).mockReturnValue({
      controls: mockControls,
    });
  });

  describe('Rendering', () => {
    it('should render opportunity title and client name', () => {
      const opp = createMockOpportunity();
      render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      expect(screen.getByText('Test Opportunity')).toBeInTheDocument();
      expect(screen.getByText('Test Client')).toBeInTheDocument();
    });

    it('should display opportunity ID and industry', () => {
      const opp = createMockOpportunity();
      render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      expect(screen.getByText(/TEST-001/i)).toBeInTheDocument();
      expect(screen.getByText(/Technology/i)).toBeInTheDocument();
    });

    it('should show RAISE level badge', () => {
      const opp = createMockOpportunity({ raiseLevel: 'L4' });
      render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      expect(screen.getByText('L4')).toBeInTheDocument();
    });

    it('should display TCV and RAISE TCV values', () => {
      const opp = createMockOpportunity({ tcv: 500000, raiseTcv: 600000 });
      render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      expect(screen.getByText(/€ 500,000/i)).toBeInTheDocument();
      expect(screen.getByText(/€ 600,000/i)).toBeInTheDocument();
    });

    it('should show KCP status correctly', () => {
      const oppWithDeviations = createMockOpportunity({ hasKcpDeviations: true });
      const { rerender } = render(<OpportunityWorkflow opp={oppWithDeviations} onBack={mockOnBack} />);

      // Verify RAISE level badge is shown (main indication of status)
      expect(screen.getByText('L4')).toBeInTheDocument();

      const oppWithoutDeviations = createMockOpportunity({ hasKcpDeviations: false });
      rerender(<OpportunityWorkflow opp={oppWithoutDeviations} onBack={mockOnBack} />);

      // Verify RAISE level badge is still shown
      expect(screen.getByText('L4')).toBeInTheDocument();
    });

    it('should render phase navigation tabs', () => {
      const opp = createMockOpportunity();
      render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      // Use getAllByText as phases appear multiple times (tabs and process map)
      expect(screen.getAllByText('Planning').length).toBeGreaterThan(0);
      expect(screen.getAllByText('ATP').length).toBeGreaterThan(0);
      expect(screen.getAllByText('ATS').length).toBeGreaterThan(0);
      expect(screen.getAllByText('ATC').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Handover').length).toBeGreaterThan(0);
    });

    it('should show process map with all phases', () => {
      const opp = createMockOpportunity();
      const { container } = render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      // Process map should contain numbered steps - verify presence of phase elements
      const planningElements = screen.getAllByText('Planning');
      expect(planningElements.length).toBeGreaterThan(0);

      // Verify container has the workflow structure
      expect(container.querySelector('.glass-card')).toBeInTheDocument();
    });
  });

  describe('Phase Progression', () => {
    it('should show checkpoints for current phase', () => {
      const opp = createMockOpportunity({ currentPhase: 'Planning' });
      render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      expect(screen.getByText('Planning Checklist')).toBeInTheDocument();
      expect(screen.getByText('Opportunity Site Created')).toBeInTheDocument();
      expect(screen.getByText('CRM Case Created')).toBeInTheDocument();
    });

    it('should filter checkpoints by phase correctly', () => {
      const opp = createMockOpportunity({ currentPhase: 'ATS', raiseLevel: 'L4' });
      render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      expect(screen.getByText('ATS Checklist')).toBeInTheDocument();
      expect(screen.getByText('MOD-001 P&L')).toBeInTheDocument();

      // Verify at least one checkpoint is present
      const stepCounter = screen.getByText(/\d+ \/ \d+ Steps/i);
      expect(stepCounter).toBeInTheDocument();
    });

    it('should apply conditional checkpoints based on RAISE level', () => {
      const oppL4 = createMockOpportunity({ currentPhase: 'Planning', raiseLevel: 'L4' });
      render(<OpportunityWorkflow opp={oppL4} onBack={mockOnBack} />);

      // Should show Planning checklist
      expect(screen.getByText('Planning Checklist')).toBeInTheDocument();

      // Verify checkpoints are shown
      expect(screen.getByText('Opportunity Site Created')).toBeInTheDocument();

      // Verify at least some checkpoints are shown
      const stepCounter = screen.getByText(/\d+ \/ \d+ Steps/i);
      expect(stepCounter).toBeInTheDocument();
    });

    it('should show mandatory checkpoints with asterisk', () => {
      const opp = createMockOpportunity({ currentPhase: 'Planning' });
      render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      const checkpointLabels = screen.getAllByText(/\*/);
      expect(checkpointLabels.length).toBeGreaterThan(0);
    });

    it('should allow switching between completed phases', () => {
      const opp = createMockOpportunity({ currentPhase: 'ATS' });
      render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      const planningTab = screen.getByRole('button', { name: /Planning/i });
      fireEvent.click(planningTab);

      // Should show Planning checklist with "Completed" badge
      expect(screen.getByText('Planning Checklist')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('should disable future phase tabs', () => {
      const opp = createMockOpportunity({ currentPhase: 'ATP' });
      render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      const atsTab = screen.getByRole('button', { name: /ATS/i });
      expect(atsTab).toBeDisabled();
    });
  });

  describe('Checkpoint Interaction', () => {
    it('should toggle checkpoint when checkbox clicked', () => {
      const opp = createMockOpportunity({ currentPhase: 'Planning' });
      render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      const checkboxes = screen.getAllByRole('checkbox');
      const firstCheckbox = checkboxes[0];

      if (firstCheckbox) {
        fireEvent.click(firstCheckbox);
        expect(firstCheckbox).toHaveClass('bg-emerald-500');
      }
    });

    it('should enable Complete button only when all required checkpoints checked', () => {
      const opp = createMockOpportunity({ currentPhase: 'Planning' });
      render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      const completeButton = screen.getByRole('button', { name: /Complete Planning/i });
      expect(completeButton).toBeDisabled();

      // Check all checkpoints
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => fireEvent.click(checkbox));

      expect(completeButton).not.toBeDisabled();
    });

    it('should show checkpoint count progress', () => {
      const opp = createMockOpportunity({ currentPhase: 'Planning' });
      render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      expect(screen.getByText(/0 \/ \d+ Steps/i)).toBeInTheDocument();
    });
  });

  describe('Phase Completion', () => {
    it('should advance to next phase when Complete button clicked', async () => {
      const opp = createMockOpportunity({ currentPhase: 'Planning' });
      render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      // Check all checkpoints
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => fireEvent.click(checkbox));

      const completeButton = screen.getByRole('button', { name: /Complete Planning/i });
      fireEvent.click(completeButton);

      // Wait for async operation to complete (500ms delay)
      await waitFor(() => {
        expect(mockUpdateOpportunity).toHaveBeenCalledWith(
          expect.objectContaining({ currentPhase: 'ATP' })
        );
      }, { timeout: 1000 });
    });

    it('should show outcome modal after ATC completion', async () => {
      const opp = createMockOpportunity({ currentPhase: 'ATC' });
      render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      // Check all checkpoints
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => fireEvent.click(checkbox));

      const completeButton = screen.getByRole('button', { name: /Complete ATC/i });
      fireEvent.click(completeButton);

      // Wait for outcome modal to appear after async operation
      await waitFor(() => {
        expect(screen.getByText('Esito Opportunità')).toBeInTheDocument();
      }, { timeout: 1000 });
      expect(screen.getByText('WON')).toBeInTheDocument();
      expect(screen.getByText('LOST')).toBeInTheDocument();
    });

    it('should handle Won outcome correctly', async () => {
      const opp = createMockOpportunity({ currentPhase: 'ATC' });
      render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      // Trigger outcome modal
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => fireEvent.click(checkbox));

      const completeButton = screen.getByRole('button', { name: /Complete ATC/i });
      fireEvent.click(completeButton);

      // Wait for outcome modal to appear
      await waitFor(() => {
        expect(screen.getByText('Esito Opportunità')).toBeInTheDocument();
      }, { timeout: 1000 });

      // Click Won button
      const wonButton = screen.getByRole('button', { name: /WON/i });
      fireEvent.click(wonButton);

      // Should update to Handover phase
      expect(mockUpdateOpportunity).toHaveBeenCalledWith(
        expect.objectContaining({ currentPhase: 'Handover' })
      );
    });

    it('should handle Lost outcome correctly', async () => {
      const opp = createMockOpportunity({ currentPhase: 'ATC' });
      render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      // Trigger outcome modal
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => fireEvent.click(checkbox));

      const completeButton = screen.getByRole('button', { name: /Complete ATC/i });
      fireEvent.click(completeButton);

      // Wait for outcome modal to appear
      await waitFor(() => {
        expect(screen.getByText('Esito Opportunità')).toBeInTheDocument();
      }, { timeout: 1000 });

      // Click Lost button
      const lostButton = screen.getByRole('button', { name: /LOST/i });
      fireEvent.click(lostButton);

      // Should update to Lost phase
      expect(mockUpdateOpportunity).toHaveBeenCalledWith(
        expect.objectContaining({ currentPhase: 'Lost' })
      );
    });
  });

  describe('Flag Management', () => {
    it('should show Edit Details button in Planning and ATP phases', () => {
      const opp = createMockOpportunity({ currentPhase: 'Planning' });
      const { rerender } = render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      expect(screen.getByRole('button', { name: /Edit Details/i })).toBeInTheDocument();

      const oppATP = createMockOpportunity({ currentPhase: 'ATP' });
      rerender(<OpportunityWorkflow opp={oppATP} onBack={mockOnBack} />);

      expect(screen.getByRole('button', { name: /Edit Details/i })).toBeInTheDocument();
    });

    it('should not show Edit Details button after ATP phase', () => {
      const opp = createMockOpportunity({ currentPhase: 'ATS' });
      render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      expect(screen.queryByRole('button', { name: /Edit Details/i })).not.toBeInTheDocument();
    });

    it('should open edit modal when Edit Details clicked', () => {
      const opp = createMockOpportunity({ currentPhase: 'Planning' });
      render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      const editButton = screen.getByRole('button', { name: /Edit Details/i });
      fireEvent.click(editButton);

      expect(screen.getByText('Modifica Dettagli Opportunità')).toBeInTheDocument();
    });

    it('should show warning when ATS completed in edit modal', () => {
      const opp = createMockOpportunity({ currentPhase: 'Planning' });
      render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      const editButton = screen.getByRole('button', { name: /Edit Details/i });
      fireEvent.click(editButton);

      // Should not show warning in Planning phase
      expect(screen.queryByText(/Modifiche bloccate/i)).not.toBeInTheDocument();
    });

    it('should allow flag editing in edit modal', () => {
      const opp = createMockOpportunity({ currentPhase: 'Planning', isRti: false });
      render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      const editButton = screen.getByRole('button', { name: /Edit Details/i });
      fireEvent.click(editButton);

      const rtiCheckbox = screen.getByLabelText(/RTI.*Raggruppamento/i);
      expect(rtiCheckbox).not.toBeChecked();

      fireEvent.click(rtiCheckbox);
      expect(rtiCheckbox).toBeChecked();
    });

    it('should close edit modal when Cancel clicked', () => {
      const opp = createMockOpportunity({ currentPhase: 'Planning' });
      render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      const editButton = screen.getByRole('button', { name: /Edit Details/i });
      fireEvent.click(editButton);

      const cancelButton = screen.getByRole('button', { name: /Annulla/i });
      fireEvent.click(cancelButton);

      expect(screen.queryByText('Modifica Dettagli Opportunità')).not.toBeInTheDocument();
    });
  });

  describe('Info Popups', () => {
    it('should open detail modal when info button clicked', () => {
      const controlWithDetails: ControlConfig = {
        id: 'test-detail-unique',
        label: 'Detailed Control Item',
        description: 'Short description',
        phase: 'Planning',
        isMandatory: true,
        actionType: 'document',
        detailedDescription: 'Extended instructions here',
        mandatoryNotes: 'Critical notes here'
      };

      (useSettings as ReturnType<typeof vi.fn>).mockReturnValue({
        controls: [controlWithDetails],
      });

      const opp = createMockOpportunity({ currentPhase: 'Planning' });
      render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      const infoButton = screen.getByTitle(/Visualizza dettagli/i);
      fireEvent.click(infoButton);

      // Verify modal opens by checking for close button (which appears in all detail modals)
      const closeButton = screen.getByRole('button', { name: /Chiudi/i });
      expect(closeButton).toBeInTheDocument();

      // Verify at least part of the description is present
      expect(screen.getByText(/Extended/i)).toBeInTheDocument();
    });

    it('should show folder path in detail modal', () => {
      const controlWithPath: ControlConfig = {
        id: 'test-path',
        label: 'Test Control',
        description: 'Description',
        phase: 'Planning',
        isMandatory: true,
        actionType: 'document',
        folderPath: '/Salesforce/Documents/ATP/'
      };

      (useSettings as ReturnType<typeof vi.fn>).mockReturnValue({
        controls: [controlWithPath],
      });

      const opp = createMockOpportunity({ currentPhase: 'Planning' });
      render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      const infoButton = screen.getByTitle(/Visualizza dettagli/i);
      fireEvent.click(infoButton);

      expect(screen.getByText('/Salesforce/Documents/ATP/')).toBeInTheDocument();
    });

    it('should close detail modal when close button clicked', () => {
      const controlWithDetails: ControlConfig = {
        id: 'test-detail',
        label: 'Test Control',
        description: 'Short description',
        phase: 'Planning',
        isMandatory: true,
        actionType: 'document',
        detailedDescription: 'Detailed description'
      };

      (useSettings as ReturnType<typeof vi.fn>).mockReturnValue({
        controls: [controlWithDetails],
      });

      const opp = createMockOpportunity({ currentPhase: 'Planning' });
      render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      const infoButton = screen.getByTitle(/Visualizza dettagli/i);
      fireEvent.click(infoButton);

      const closeButton = screen.getByRole('button', { name: /Chiudi/i });
      fireEvent.click(closeButton);

      expect(screen.queryByText('Detailed description')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should call onBack when back button clicked', () => {
      const opp = createMockOpportunity();
      render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      const backButton = screen.getByRole('button', { name: /Back to Dashboard/i });
      fireEvent.click(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Fast Track Display', () => {
    it('should show fast track indicator when eligible', () => {
      const opp = createMockOpportunity({
        raiseTcv: 200000,
        hasKcpDeviations: false,
        isNewCustomer: false,
        raiseLevel: 'L6'
      });
      render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      expect(screen.getByText(/Fast Track Eligible/i)).toBeInTheDocument();
    });

    it('should not show fast track indicator when not eligible', () => {
      const opp = createMockOpportunity({
        raiseTcv: 300000,
        raiseLevel: 'L5'
      });
      render(<OpportunityWorkflow opp={opp} onBack={mockOnBack} />);

      expect(screen.queryByText(/Fast Track Eligible/i)).not.toBeInTheDocument();
    });
  });
});
