import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Dashboard } from './index';
import type { Opportunity } from '../../types';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n/config';

// Mock dependencies
const mockNavigate = vi.fn();
const mockDeleteOpportunity = vi.fn();
const mockSelectOpportunity = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../stores/OpportunitiesStore', () => ({
  useOpportunities: vi.fn(),
}));

// Import after mocking
import { useOpportunities } from '../../stores/OpportunitiesStore';

// Mock opportunities for testing
const createMockOpportunity = (overrides: Partial<Opportunity> = {}): Opportunity => ({
  id: 'OPP-2025-001',
  title: 'Cloud Migration Project',
  clientName: 'Acme Corp',
  tcv: 1000000,
  raiseTcv: 1000000,
  industry: 'Technology',
  currentPhase: 'Planning',
  hasKcpDeviations: false,
  isFastTrack: false,
  isRti: false,
  isPublicSector: false,
  raiseLevel: 'L4',
  deviations: [],
  checkpoints: {},
  marginPercent: 20,
  cashFlowNeutral: true,
  isNewCustomer: false,
  ...overrides,
});

describe('Dashboard', () => {
  const mockOnSelectOpp = vi.fn();

  const renderDashboard = (props = {}) => {
    return render(
      <I18nextProvider i18n={i18n}>
        <Dashboard onSelectOpp={mockOnSelectOpp} {...props} />
      </I18nextProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', async () => {
      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [],
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderDashboard();
      await waitFor(() => {
        expect(screen.getByText('Panoramica Pipeline')).toBeInTheDocument();
      }, { timeout: 500 });
    });

    it('should display Pipeline Overview heading', () => {
      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [],
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderDashboard();
      expect(screen.getByText('Panoramica Pipeline')).toBeInTheDocument();
      expect(screen.getByText(/Monitoraggio della conformità/i)).toBeInTheDocument();
    });

    it('should show all three stats cards', async () => {
      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [],
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderDashboard();
      await waitFor(() => {
        expect(screen.getByText('Valore Totale Pipeline')).toBeInTheDocument();
        expect(screen.getByText('Opportunità Attive')).toBeInTheDocument();
        expect(screen.getByText('Rischi Critici')).toBeInTheDocument();
      }, { timeout: 500 });
    });
  });

  describe('Stats Calculations', () => {
    it('should calculate total TCV correctly with single opportunity', () => {
      const mockOpps = [createMockOpportunity({ tcv: 1000000 })];

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: mockOpps,
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderDashboard();
      // TCV displayed in millions: 1000000 / 1000000 = 1.00M
      expect(screen.getByText('€1.00M')).toBeInTheDocument();
    });

    it('should calculate total TCV correctly with multiple opportunities', () => {
      const mockOpps = [
        createMockOpportunity({ id: 'OPP-001', tcv: 1000000 }),
        createMockOpportunity({ id: 'OPP-002', tcv: 2500000 }),
        createMockOpportunity({ id: 'OPP-003', tcv: 500000 }),
      ];

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: mockOpps,
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderDashboard();
      // Total: 4000000 / 1000000 = 4.00M
      expect(screen.getByText('€4.00M')).toBeInTheDocument();
    });

    it('should show correct opportunity count', () => {
      const mockOpps = [
        createMockOpportunity({ id: 'OPP-001' }),
        createMockOpportunity({ id: 'OPP-002' }),
        createMockOpportunity({ id: 'OPP-003' }),
      ];

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: mockOpps,
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderDashboard();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should show correct critical count for opportunities with KCP deviations', () => {
      const mockOpps = [
        createMockOpportunity({ id: 'OPP-001', hasKcpDeviations: true }),
        createMockOpportunity({ id: 'OPP-002', hasKcpDeviations: false }),
        createMockOpportunity({ id: 'OPP-003', hasKcpDeviations: true }),
      ];

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: mockOpps,
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderDashboard();
      // The critical count is displayed as the value in the Critical Risks card
      const criticalCards = screen.getAllByText('2');
      expect(criticalCards.length).toBeGreaterThan(0);
    });

    it('should show correct in-progress count excluding Won opportunities', () => {
      const mockOpps = [
        createMockOpportunity({ id: 'OPP-001', currentPhase: 'Planning' }),
        createMockOpportunity({ id: 'OPP-002', currentPhase: 'Won' }),
        createMockOpportunity({ id: 'OPP-003', currentPhase: 'ATP' }),
      ];

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: mockOpps,
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderDashboard();
      // 2 opportunities are in progress (not Won)
      expect(screen.getByText('2 in corso')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty stats when no opportunities exist', () => {
      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [],
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderDashboard();
      expect(screen.getByText('€0.00M')).toBeInTheDocument();
      // Multiple cards show "0" - use getAllByText
      const zeroValues = screen.getAllByText('0');
      expect(zeroValues.length).toBeGreaterThan(0);
      expect(screen.getByText('Tutto a posto')).toBeInTheDocument();
    });

    it('should show "All clear" when no critical risks', () => {
      const mockOpps = [
        createMockOpportunity({ id: 'OPP-001', hasKcpDeviations: false }),
      ];

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: mockOpps,
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderDashboard();
      expect(screen.getByText('Tutto a posto')).toBeInTheDocument();
    });

    it('should show "Action required" when critical risks exist', () => {
      const mockOpps = [
        createMockOpportunity({ id: 'OPP-001', hasKcpDeviations: true }),
      ];

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: mockOpps,
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderDashboard();
      expect(screen.getByText('Azione richiesta')).toBeInTheDocument();
    });
  });

  describe('Opportunity Cards', () => {
    it('should render opportunity cards with correct data', () => {
      const mockOpp = createMockOpportunity({
        title: 'Digital Transformation',
        clientName: 'TechCorp',
        industry: 'Finance',
        tcv: 2500000,
      });

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockOpp],
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderDashboard();
      expect(screen.getByText('Digital Transformation')).toBeInTheDocument();
      expect(screen.getByText('TechCorp')).toBeInTheDocument();
      expect(screen.getByText('Finance')).toBeInTheDocument();
    });

    it('should show client name initials in avatar', () => {
      const mockOpp = createMockOpportunity({ clientName: 'Acme Corporation' });

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockOpp],
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderDashboard();
      // Should display first 2 characters uppercased
      expect(screen.getByText('AC')).toBeInTheDocument();
    });

    it('should display TCV in thousands format', () => {
      const mockOpp = createMockOpportunity({ tcv: 1500000 });

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockOpp],
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderDashboard();
      // TCV / 1000 = 1500k
      expect(screen.getByText('€1500k')).toBeInTheDocument();
    });

    it('should display current phase', () => {
      const mockOpp = createMockOpportunity({ currentPhase: 'ATP' });

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockOpp],
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderDashboard();
      expect(screen.getByText('ATP')).toBeInTheDocument();
    });

    it('should display RAISE level badge', () => {
      const mockOpp = createMockOpportunity({ raiseLevel: 'L3', tcv: 5000000 });

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockOpp],
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderDashboard();
      expect(screen.getByText('L3')).toBeInTheDocument();
    });

    it('should show "High Risk" badge for opportunities with KCP deviations', () => {
      const mockOpp = createMockOpportunity({ hasKcpDeviations: true });

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockOpp],
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderDashboard();
      expect(screen.getByText('Alto Rischio')).toBeInTheDocument();
    });

    it('should not show "High Risk" badge for opportunities without KCP deviations', () => {
      const mockOpp = createMockOpportunity({ hasKcpDeviations: false });

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockOpp],
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderDashboard();
      expect(screen.queryByText('Alto Rischio')).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onSelectOpp when opportunity card is clicked', () => {
      const mockOpp = createMockOpportunity();

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockOpp],
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderDashboard();

      const card = screen.getByText('Cloud Migration Project').closest('div[class*="cursor-pointer"]');
      fireEvent.click(card!);

      expect(mockOnSelectOpp).toHaveBeenCalledWith(mockOpp);
    });

    it('should navigate to edit page when edit button is clicked', () => {
      const mockOpp = createMockOpportunity({ id: 'OPP-2025-123' });

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockOpp],
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderDashboard();

      const editButton = screen.getByTitle('Modifica opportunità');
      fireEvent.click(editButton);

      expect(mockNavigate).toHaveBeenCalledWith('/opportunities/OPP-2025-123/edit');
    });

    it('should not trigger card click when edit button is clicked', () => {
      const mockOpp = createMockOpportunity();

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockOpp],
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderDashboard();

      const editButton = screen.getByTitle('Modifica opportunità');
      fireEvent.click(editButton);

      expect(mockOnSelectOpp).not.toHaveBeenCalled();
    });

    it('should open confirm modal when delete button is clicked', () => {
      const mockOpp = createMockOpportunity({ title: 'Test Opportunity' });

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockOpp],
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderDashboard();

      const deleteButton = screen.getByTitle('Elimina opportunità');
      fireEvent.click(deleteButton);

      expect(screen.getByText('Elimina Opportunità')).toBeInTheDocument();
      // The modal message contains the title, use more specific matcher
      expect(screen.getByText(/Sei sicuro di voler eliminare l'opportunità "Test Opportunity"/)).toBeInTheDocument();
    });

    it('should not trigger card click when delete button is clicked', () => {
      const mockOpp = createMockOpportunity();

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockOpp],
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderDashboard();

      const deleteButton = screen.getByTitle('Elimina opportunità');
      fireEvent.click(deleteButton);

      expect(mockOnSelectOpp).not.toHaveBeenCalled();
    });

    it('should close confirm modal when cancel is clicked', async () => {
      const mockOpp = createMockOpportunity({ title: 'Test Opportunity' });

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockOpp],
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderDashboard();

      const deleteButton = screen.getByTitle('Elimina opportunità');
      fireEvent.click(deleteButton);

      const cancelButton = screen.getByText('Annulla');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Elimina Opportunità')).not.toBeInTheDocument();
      });
    });

    it('should delete opportunity when confirm is clicked', async () => {
      const mockOpp = createMockOpportunity({ id: 'OPP-DELETE', title: 'Test Opportunity' });

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockOpp],
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderDashboard();

      const deleteButton = screen.getByTitle('Elimina opportunità');
      fireEvent.click(deleteButton);

      const confirmButton = screen.getByText('Elimina');
      fireEvent.click(confirmButton);

      expect(mockDeleteOpportunity).toHaveBeenCalledWith('OPP-DELETE');
    });

    it('should clear selected opportunity when deleting the currently selected one', async () => {
      const mockOpp = createMockOpportunity({ id: 'OPP-SELECTED' });

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockOpp],
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: mockOpp,
      });

      renderDashboard();

      const deleteButton = screen.getByTitle('Elimina opportunità');
      fireEvent.click(deleteButton);

      const confirmButton = screen.getByText('Elimina');
      fireEvent.click(confirmButton);

      expect(mockDeleteOpportunity).toHaveBeenCalledWith('OPP-SELECTED');
      expect(mockSelectOpportunity).toHaveBeenCalledWith(null);
    });
  });

  describe('Multiple Opportunities', () => {
    it('should render multiple opportunity cards', () => {
      const mockOpps = [
        createMockOpportunity({ id: 'OPP-001', title: 'Project Alpha' }),
        createMockOpportunity({ id: 'OPP-002', title: 'Project Beta' }),
        createMockOpportunity({ id: 'OPP-003', title: 'Project Gamma' }),
      ];

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: mockOpps,
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderDashboard();
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      expect(screen.getByText('Project Beta')).toBeInTheDocument();
      expect(screen.getByText('Project Gamma')).toBeInTheDocument();
    });

    it('should show correct total count badge', () => {
      const mockOpps = [
        createMockOpportunity({ id: 'OPP-001' }),
        createMockOpportunity({ id: 'OPP-002' }),
        createMockOpportunity({ id: 'OPP-003' }),
        createMockOpportunity({ id: 'OPP-004' }),
        createMockOpportunity({ id: 'OPP-005' }),
      ];

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: mockOpps,
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderDashboard();
      expect(screen.getByText('5 Totale')).toBeInTheDocument();
    });
  });
});
