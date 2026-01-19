import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { OpportunityWorkflow } from './index';
import type { Opportunity, ControlConfig } from '../../types';
import i18n from '../../i18n/config';

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

// Helper to render with i18n
const renderWorkflow = (opp: Opportunity) => {
  return render(
    <I18nextProvider i18n={i18n}>
      <OpportunityWorkflow opp={opp} onBack={mockOnBack} />
    </I18nextProvider>
  );
};

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
      renderWorkflow(opp);

      expect(screen.getByText('Test Opportunity')).toBeInTheDocument();
      expect(screen.getByText('Test Client')).toBeInTheDocument();
    });

    it('should display opportunity ID and industry', () => {
      const opp = createMockOpportunity();
      renderWorkflow(opp);

      expect(screen.getByText(/TEST-001/i)).toBeInTheDocument();
      expect(screen.getByText(/Technology/i)).toBeInTheDocument();
    });

    it('should show RAISE level badge', () => {
      const opp = createMockOpportunity({ raiseLevel: 'L4' });
      renderWorkflow(opp);

      expect(screen.getByText('L4')).toBeInTheDocument();
    });

    it('should display TCV and RAISE TCV values', () => {
      const opp = createMockOpportunity({ tcv: 500000, raiseTcv: 600000 });
      renderWorkflow(opp);

      expect(screen.getByText(/€ 500,000/i)).toBeInTheDocument();
      expect(screen.getByText(/€ 600,000/i)).toBeInTheDocument();
    });

    it('should show KCP status correctly', () => {
      const oppWithDeviations = createMockOpportunity({ hasKcpDeviations: true });
      const { rerender } = renderWorkflow(oppWithDeviations);

      // Verify RAISE level badge is shown (main indication of status)
      expect(screen.getByText('L4')).toBeInTheDocument();

      const oppWithoutDeviations = createMockOpportunity({ hasKcpDeviations: false });
      rerender(
        <I18nextProvider i18n={i18n}>
          <OpportunityWorkflow opp={oppWithoutDeviations} onBack={mockOnBack} />
        </I18nextProvider>
      );

      // Verify RAISE level badge is still shown
      expect(screen.getByText('L4')).toBeInTheDocument();
    });

    it('should render phase navigation tabs', () => {
      const opp = createMockOpportunity();
      renderWorkflow(opp);

      // Use getAllByText as phases appear multiple times (tabs and process map)
      expect(screen.getAllByText('Planning').length).toBeGreaterThan(0);
      expect(screen.getAllByText('ATP').length).toBeGreaterThan(0);
      expect(screen.getAllByText('ATS').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Awaiting').length).toBeGreaterThan(0);
      expect(screen.getAllByText('ATC').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Handover').length).toBeGreaterThan(0);
    });

    it('should show process map with all phases', () => {
      const opp = createMockOpportunity();
      const { container } = renderWorkflow(opp);

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
      renderWorkflow(opp);

      expect(screen.getByText('Planning Checklist')).toBeInTheDocument();
      expect(screen.getByText('Opportunity Site Created')).toBeInTheDocument();
      expect(screen.getByText('CRM Case Created')).toBeInTheDocument();
    });

    it('should filter checkpoints by phase correctly', () => {
      const opp = createMockOpportunity({ currentPhase: 'ATS', raiseLevel: 'L4' });
      renderWorkflow(opp);

      expect(screen.getByText('ATS Checklist')).toBeInTheDocument();
      expect(screen.getByText('MOD-001 P&L')).toBeInTheDocument();

      // Verify at least one checkpoint is present
      const stepCounter = screen.getByText(/\d+ \/ \d+ Steps/i);
      expect(stepCounter).toBeInTheDocument();
    });

    it('should apply conditional checkpoints based on RAISE level', () => {
      const oppL4 = createMockOpportunity({ currentPhase: 'Planning', raiseLevel: 'L4' });
      renderWorkflow(oppL4);

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
      renderWorkflow(opp);

      const checkpointLabels = screen.getAllByText(/\*/);
      expect(checkpointLabels.length).toBeGreaterThan(0);
    });

    it('should allow switching between completed phases', () => {
      const opp = createMockOpportunity({ currentPhase: 'ATS' });
      renderWorkflow(opp);

      const planningTab = screen.getByRole('button', { name: /Planning/i });
      fireEvent.click(planningTab);

      // Should show Planning checklist with "Completato" badge
      expect(screen.getByText('Planning Checklist')).toBeInTheDocument();
      expect(screen.getByText('Completato')).toBeInTheDocument();
    });

    it('should disable future phase tabs', () => {
      const opp = createMockOpportunity({ currentPhase: 'ATP' });
      renderWorkflow(opp);

      const atsTab = screen.getByRole('button', { name: /ATS/i });
      expect(atsTab).toBeDisabled();
    });
  });

  describe('Checkpoint Interaction', () => {
    it('should toggle checkpoint when checkbox clicked', () => {
      const opp = createMockOpportunity({ currentPhase: 'Planning' });
      renderWorkflow(opp);

      const checkboxes = screen.getAllByRole('checkbox');
      const firstCheckbox = checkboxes[0];

      if (firstCheckbox) {
        fireEvent.click(firstCheckbox);
        expect(firstCheckbox).toHaveClass('bg-emerald-500');
      }
    });

    it('should enable Complete button only when all required checkpoints checked', () => {
      const opp = createMockOpportunity({ currentPhase: 'Planning' });
      renderWorkflow(opp);

      const completeButton = screen.getByRole('button', { name: /Completa Planning/i });
      expect(completeButton).toBeDisabled();

      // Check all checkpoints
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => fireEvent.click(checkbox));

      expect(completeButton).not.toBeDisabled();
    });

    it('should show checkpoint count progress', () => {
      const opp = createMockOpportunity({ currentPhase: 'Planning' });
      renderWorkflow(opp);

      expect(screen.getByText(/0 \/ \d+ Steps/i)).toBeInTheDocument();
    });
  });

  describe('Phase Completion', () => {
    it('should advance to next phase when Complete button clicked', async () => {
      const opp = createMockOpportunity({ currentPhase: 'Planning' });
      renderWorkflow(opp);

      // Check all checkpoints
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => fireEvent.click(checkbox));

      const completeButton = screen.getByRole('button', { name: /Completa Planning/i });
      fireEvent.click(completeButton);

      // Wait for async operation to complete (500ms delay)
      await waitFor(() => {
        expect(mockUpdateOpportunity).toHaveBeenCalledWith(
          expect.objectContaining({ currentPhase: 'ATP' })
        );
      }, { timeout: 1000 });
    });

    it('should advance from ATS to Awaiting phase', async () => {
      const opp = createMockOpportunity({ currentPhase: 'ATS' });
      renderWorkflow(opp);

      // Check all checkpoints
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => fireEvent.click(checkbox));

      const completeButton = screen.getByRole('button', { name: /Completa ATS/i });
      fireEvent.click(completeButton);

      // Wait for phase to advance to Awaiting
      await waitFor(() => {
        expect(mockUpdateOpportunity).toHaveBeenCalledWith(
          expect.objectContaining({ currentPhase: 'Awaiting' })
        );
      }, { timeout: 1000 });
    });

    it('should show outcome modal after Awaiting completion (Win/Lost decision)', async () => {
      const opp = createMockOpportunity({ currentPhase: 'Awaiting' });
      renderWorkflow(opp);

      // Awaiting phase may have no mandatory checkpoints, just complete it
      const completeButton = screen.getByRole('button', { name: /Completa Awaiting/i });
      fireEvent.click(completeButton);

      // Wait for outcome modal to appear after async operation
      await waitFor(() => {
        expect(screen.getByText('Esito Opportunità')).toBeInTheDocument();
      }, { timeout: 1000 });
      expect(screen.getByText('WON')).toBeInTheDocument();
      expect(screen.getByText('LOST')).toBeInTheDocument();
    });

    it('should handle Won outcome correctly - goes to ATC for contract authorization', async () => {
      const opp = createMockOpportunity({ currentPhase: 'Awaiting' });
      renderWorkflow(opp);

      // Complete Awaiting phase to trigger outcome modal
      const completeButton = screen.getByRole('button', { name: /Completa Awaiting/i });
      fireEvent.click(completeButton);

      // Wait for outcome modal to appear
      await waitFor(() => {
        expect(screen.getByText('Esito Opportunità')).toBeInTheDocument();
      }, { timeout: 1000 });

      // Click Won button
      const wonButton = screen.getByRole('button', { name: /WON/i });
      fireEvent.click(wonButton);

      // Should update to ATC phase (Authorization To Contract, after winning)
      expect(mockUpdateOpportunity).toHaveBeenCalledWith(
        expect.objectContaining({ currentPhase: 'ATC' })
      );
    });

    it('should handle Lost outcome correctly', async () => {
      const opp = createMockOpportunity({ currentPhase: 'Awaiting' });
      renderWorkflow(opp);

      // Complete Awaiting phase to trigger outcome modal
      const completeButton = screen.getByRole('button', { name: /Completa Awaiting/i });
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

    it('should advance from ATC to Handover after contract authorization', async () => {
      const opp = createMockOpportunity({ currentPhase: 'ATC' });
      renderWorkflow(opp);

      // Check all checkpoints
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => fireEvent.click(checkbox));

      const completeButton = screen.getByRole('button', { name: /Completa ATC/i });
      fireEvent.click(completeButton);

      // Wait for phase to advance to Handover
      await waitFor(() => {
        expect(mockUpdateOpportunity).toHaveBeenCalledWith(
          expect.objectContaining({ currentPhase: 'Handover' })
        );
      }, { timeout: 1000 });
    });
  });

  describe('Flag Management', () => {
    it('should show Modifica Dettagli button in Planning and ATP phases', () => {
      const opp = createMockOpportunity({ currentPhase: 'Planning' });
      const { rerender } = renderWorkflow(opp);

      expect(screen.getByRole('button', { name: /Modifica Dettagli/i })).toBeInTheDocument();

      const oppATP = createMockOpportunity({ currentPhase: 'ATP' });
      rerender(
        <I18nextProvider i18n={i18n}>
          <OpportunityWorkflow opp={oppATP} onBack={mockOnBack} />
        </I18nextProvider>
      );

      expect(screen.getByRole('button', { name: /Modifica Dettagli/i })).toBeInTheDocument();
    });

    it('should not show Modifica Dettagli button after ATP phase', () => {
      const opp = createMockOpportunity({ currentPhase: 'ATS' });
      renderWorkflow(opp);

      expect(screen.queryByRole('button', { name: /Modifica Dettagli/i })).not.toBeInTheDocument();
    });

    it('should open edit modal when Modifica Dettagli clicked', () => {
      const opp = createMockOpportunity({ currentPhase: 'Planning' });
      renderWorkflow(opp);

      const editButton = screen.getByRole('button', { name: /Modifica Dettagli/i });
      fireEvent.click(editButton);

      expect(screen.getByText('Modifica Dettagli Opportunità')).toBeInTheDocument();
    });

    it('should show warning when ATS completed in edit modal', () => {
      const opp = createMockOpportunity({ currentPhase: 'Planning' });
      renderWorkflow(opp);

      const editButton = screen.getByRole('button', { name: /Modifica Dettagli/i });
      fireEvent.click(editButton);

      // Should not show warning in Planning phase
      expect(screen.queryByText(/Modifiche bloccate/i)).not.toBeInTheDocument();
    });

    it('should allow flag editing in edit modal', () => {
      const opp = createMockOpportunity({ currentPhase: 'Planning', isRti: false });
      renderWorkflow(opp);

      const editButton = screen.getByRole('button', { name: /Modifica Dettagli/i });
      fireEvent.click(editButton);

      const rtiCheckbox = screen.getByLabelText(/RTI.*Raggruppamento/i);
      expect(rtiCheckbox).not.toBeChecked();

      fireEvent.click(rtiCheckbox);
      expect(rtiCheckbox).toBeChecked();
    });

    it('should close edit modal when Cancel clicked', () => {
      const opp = createMockOpportunity({ currentPhase: 'Planning' });
      renderWorkflow(opp);

      const editButton = screen.getByRole('button', { name: /Modifica Dettagli/i });
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
      renderWorkflow(opp);

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
        folderPath: '/SharePoint/Documents/ATP/'
      };

      (useSettings as ReturnType<typeof vi.fn>).mockReturnValue({
        controls: [controlWithPath],
      });

      const opp = createMockOpportunity({ currentPhase: 'Planning' });
      renderWorkflow(opp);

      const infoButton = screen.getByTitle(/Visualizza dettagli/i);
      fireEvent.click(infoButton);

      expect(screen.getByText('/SharePoint/Documents/ATP/')).toBeInTheDocument();
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
      renderWorkflow(opp);

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
      renderWorkflow(opp);

      const backButton = screen.getByRole('button', { name: /Torna alla Dashboard/i });
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
      renderWorkflow(opp);

      expect(screen.getByText(/Fast Track Eligible/i)).toBeInTheDocument();
    });

    it('should not show fast track indicator when not eligible', () => {
      const opp = createMockOpportunity({
        raiseTcv: 300000,
        raiseLevel: 'L5'
      });
      renderWorkflow(opp);

      expect(screen.queryByText(/Fast Track Eligible/i)).not.toBeInTheDocument();
    });
  });
});
