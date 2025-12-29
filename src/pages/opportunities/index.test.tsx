import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OpportunitiesPage } from './index';
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

// Mock opportunity factory
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

const renderWithI18n = (component: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  );
};

describe('OpportunitiesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render page heading', () => {
      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [],
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderWithI18n(<OpportunitiesPage />);
      expect(screen.getByText('Opportunità')).toBeInTheDocument();
      expect(screen.getByText('Gestisci le opportunità RAISE')).toBeInTheDocument();
    });

    it('should render "New Opportunity" button', () => {
      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [],
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderWithI18n(<OpportunitiesPage />);
      expect(screen.getByText('Crea Opportunità')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no opportunities exist', () => {
      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [],
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderWithI18n(<OpportunitiesPage />);
      expect(screen.getByText('Nessuna opportunità trovata')).toBeInTheDocument();
      expect(screen.getByText('Crea la tua prima opportunità')).toBeInTheDocument();
    });
  });

  describe('Opportunities List', () => {
    it('should render list of opportunities', () => {
      const mockOpps = [
        createMockOpportunity({ id: 'OPP-001', title: 'Project Alpha' }),
        createMockOpportunity({ id: 'OPP-002', title: 'Project Beta' }),
      ];

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: mockOpps,
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderWithI18n(<OpportunitiesPage />);
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      expect(screen.getByText('Project Beta')).toBeInTheDocument();
    });

    it('should not show empty state when opportunities exist', () => {
      const mockOpps = [createMockOpportunity()];

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: mockOpps,
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderWithI18n(<OpportunitiesPage />);
      expect(screen.queryByText('Nessuna opportunità trovata')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to new opportunity page when button is clicked', () => {
      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [],
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderWithI18n(<OpportunitiesPage />);

      const newButton = screen.getByText('Crea Opportunità');
      fireEvent.click(newButton);

      expect(mockNavigate).toHaveBeenCalledWith('/opportunities/new');
    });

    it('should navigate to opportunity detail when card is clicked', () => {
      const mockOpp = createMockOpportunity({ id: 'OPP-2025-123' });

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockOpp],
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderWithI18n(<OpportunitiesPage />);

      const card = screen.getByText('Cloud Migration Project').closest('div[class*="cursor-pointer"]');
      fireEvent.click(card!);

      expect(mockSelectOpportunity).toHaveBeenCalledWith(mockOpp);
      expect(mockNavigate).toHaveBeenCalledWith('/opportunity/OPP-2025-123');
    });

    it('should navigate to edit page when edit button is clicked', () => {
      const mockOpp = createMockOpportunity({ id: 'OPP-2025-456' });

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockOpp],
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderWithI18n(<OpportunitiesPage />);

      const editButton = screen.getByTitle('Modifica');
      fireEvent.click(editButton);

      expect(mockNavigate).toHaveBeenCalledWith('/opportunities/OPP-2025-456/edit');
    });
  });

  describe('Delete Functionality', () => {
    it('should open confirm modal when delete button is clicked', () => {
      const mockOpp = createMockOpportunity({ title: 'Test Delete' });

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockOpp],
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: null,
      });

      renderWithI18n(<OpportunitiesPage />);

      const deleteButton = screen.getByTitle('Elimina Opportunità');
      fireEvent.click(deleteButton);

      expect(screen.getAllByText('Elimina Opportunità').length).toBeGreaterThan(0);
      // The modal message contains the title, use more specific matcher
      expect(screen.getByText(/Sei sicuro di voler eliminare questa opportunità/)).toBeInTheDocument();
    });

    it('should delete opportunity and navigate to home when confirming delete of selected opportunity', async () => {
      const mockOpp = createMockOpportunity({ id: 'OPP-TO-DELETE' });

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockOpp],
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: mockOpp, // Currently selected
      });

      renderWithI18n(<OpportunitiesPage />);

      const deleteButton = screen.getByTitle('Elimina Opportunità');
      fireEvent.click(deleteButton);

      const confirmButton = screen.getAllByText('Elimina Opportunità')[1]; // Second one is the button
      fireEvent.click(confirmButton);

      expect(mockDeleteOpportunity).toHaveBeenCalledWith('OPP-TO-DELETE');
      expect(mockSelectOpportunity).toHaveBeenCalledWith(null);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should delete opportunity without navigation when deleting non-selected opportunity', async () => {
      const mockOpp1 = createMockOpportunity({ id: 'OPP-001' });
      const mockOpp2 = createMockOpportunity({ id: 'OPP-002', title: 'Other Opp' });

      (useOpportunities as ReturnType<typeof vi.fn>).mockReturnValue({
        opportunities: [mockOpp1, mockOpp2],
        deleteOpportunity: mockDeleteOpportunity,
        selectOpportunity: mockSelectOpportunity,
        selectedOpp: mockOpp2, // Different from the one being deleted
      });

      renderWithI18n(<OpportunitiesPage />);

      const deleteButtons = screen.getAllByTitle('Elimina Opportunità');
      fireEvent.click(deleteButtons[0]); // Delete first opportunity

      const confirmButton = screen.getAllByText('Elimina Opportunità')[1]; // Second one is the button
      fireEvent.click(confirmButton);

      expect(mockDeleteOpportunity).toHaveBeenCalledWith('OPP-001');
      expect(mockSelectOpportunity).not.toHaveBeenCalledWith(null);
      expect(mockNavigate).not.toHaveBeenCalledWith('/');
    });
  });
});
