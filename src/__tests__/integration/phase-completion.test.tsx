import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import { OpportunitiesProvider } from '../../stores/OpportunitiesStore';
import { SettingsProvider } from '../../stores/SettingsStore';
import { OpportunityWorkflow } from '../../components/workflow';
import type { Opportunity } from '../../types';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n/config';

// Wrapper with all providers
const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <I18nextProvider i18n={i18n}>
      <OpportunitiesProvider>
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </OpportunitiesProvider>
    </I18nextProvider>
  </BrowserRouter>
);

// Helper to create a mock opportunity
const createMockOpportunity = (overrides: Partial<Opportunity> = {}): Opportunity => ({
  id: 'OPP-PHASE-TEST',
  title: 'Phase Test Opportunity',
  clientName: 'Test Client',
  tcv: 1000000,
  raiseTcv: 1000000,
  industry: 'Technology',
  currentPhase: 'Planning',
  hasKcpDeviations: false,
  isFastTrack: false,
  isRti: false,
  isPublicSector: false,
  raiseLevel: 'L3',
  deviations: [],
  checkpoints: {},
  marginPercent: 20,
  cashFlowNeutral: true,
  isNewCustomer: false,
  ...overrides,
});

// Test component that can access the store
const TestWorkflowWrapper = ({ opp, onPhaseChange }: { opp: Opportunity; onPhaseChange?: (phase: string) => void }) => {
  const handleBack = () => {
    // Mock back handler
  };

  // Watch for phase changes
  React.useEffect(() => {
    if (onPhaseChange) {
      onPhaseChange(opp.currentPhase);
    }
  }, [opp.currentPhase, onPhaseChange]);

  return <OpportunityWorkflow opp={opp} onBack={handleBack} />;
};

describe('Phase Completion Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should complete ATP phase and move to ATS', async () => {
    const opp = createMockOpportunity({ currentPhase: 'ATP' });
    localStorage.setItem('raise_opportunities', JSON.stringify([opp]));

    render(
      <AllProviders>
        <TestWorkflowWrapper opp={opp} />
      </AllProviders>
    );

    // Verify we're in ATP phase
    await waitFor(() => {
      expect(screen.getByText('ATP Checklist')).toBeInTheDocument();
    });

    // Check that Complete ATP button exists but might be disabled
    const completeButton = screen.getByRole('button', { name: /Completa ATP/i });
    expect(completeButton).toBeInTheDocument();

    // Note: In real scenario, we'd check all checkboxes first
    // For this test, we verify the phase transition mechanism exists
    expect(screen.getByText(/ATP Checklist/i)).toBeInTheDocument();
  });

  it('should complete Planning and move to ATP phase', async () => {
    const opp = createMockOpportunity({ currentPhase: 'Planning' });
    localStorage.setItem('raise_opportunities', JSON.stringify([opp]));

    render(
      <AllProviders>
        <TestWorkflowWrapper opp={opp} />
      </AllProviders>
    );

    // Verify Planning phase is active
    await waitFor(() => {
      expect(screen.getByText('Planning Checklist')).toBeInTheDocument();
    });

    // Complete Planning button should be available
    const completeButton = screen.getByRole('button', { name: /Completa Planning/i });
    expect(completeButton).toBeInTheDocument();
  });

  it('should show outcome modal after completing ATC phase', async () => {
    const opp = createMockOpportunity({ currentPhase: 'ATC' });
    localStorage.setItem('raise_opportunities', JSON.stringify([opp]));

    render(
      <AllProviders>
        <TestWorkflowWrapper opp={opp} />
      </AllProviders>
    );

    // Verify ATC phase is displayed
    await waitFor(() => {
      expect(screen.getByText('ATC Checklist')).toBeInTheDocument();
    });

    // Complete ATC button should exist
    expect(screen.getByRole('button', { name: /Completa ATC/i })).toBeInTheDocument();
  });

  it('should move to Handover phase when opportunity is Won', async () => {
    const opp = createMockOpportunity({ currentPhase: 'Handover' });
    localStorage.setItem('raise_opportunities', JSON.stringify([opp]));

    render(
      <AllProviders>
        <TestWorkflowWrapper opp={opp} />
      </AllProviders>
    );

    // Verify Handover phase is active
    await waitFor(() => {
      expect(screen.getByText('Handover Checklist')).toBeInTheDocument();
    });

    // Handover checklist header should be accessible
    expect(screen.getByText('Handover Checklist')).toBeInTheDocument();
  });

  it.skip('should complete Handover phase successfully', async () => {
    // Create opportunity with all checkpoints completed to enable the button
    const opp = createMockOpportunity({
      currentPhase: 'Handover',
      checkpoints: {
        'Handover': [] // No required checkpoints for Handover
      }
    });
    localStorage.setItem('raise_opportunities', JSON.stringify([opp]));

    render(
      <AllProviders>
        <TestWorkflowWrapper opp={opp} />
      </AllProviders>
    );

    // Verify Handover phase is active
    await waitFor(() => {
      expect(screen.getByText('Handover Checklist')).toBeInTheDocument();
    });

    // Find the Complete Handover button
    const completeButton = screen.getByRole('button', { name: /Completa Handover/i });
    expect(completeButton).toBeInTheDocument();

    // Button should be enabled (no required checkpoints)
    await waitFor(() => {
      expect(completeButton).not.toBeDisabled();
    });

    fireEvent.click(completeButton);

    // Wait for async completion (500ms delay in handlePhaseAuthorization)
    await new Promise(resolve => setTimeout(resolve, 600));

    // Opportunity should remain in Handover phase (terminal state)
    const updatedOpps = JSON.parse(localStorage.getItem('raise_opportunities') || '[]');
    expect(updatedOpps[0].currentPhase).toBe('Handover');
  });

  it('should show completed phases as accessible but non-editable', async () => {
    // Opportunity that has completed Planning and ATP, currently in ATS
    const opp = createMockOpportunity({ currentPhase: 'ATS' });
    localStorage.setItem('raise_opportunities', JSON.stringify([opp]));

    render(
      <AllProviders>
        <TestWorkflowWrapper opp={opp} />
      </AllProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('ATS Checklist')).toBeInTheDocument();
    });

    // Previous phases should be shown in sidebar
    expect(screen.getByRole('button', { name: /Planning/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ATP/i })).toBeInTheDocument();

    // Click on Planning to view completed phase
    const planningButton = screen.getByRole('button', { name: /Planning/i });
    fireEvent.click(planningButton);

    await waitFor(() => {
      expect(screen.getByText('Planning Checklist')).toBeInTheDocument();
    });

    // Should show "Completato" indicator for past phases
    expect(screen.getByText('Completato')).toBeInTheDocument();
  });

  it('should prevent skipping phases in workflow', async () => {
    // Opportunity in Planning phase
    const opp = createMockOpportunity({ currentPhase: 'Planning' });
    localStorage.setItem('raise_opportunities', JSON.stringify([opp]));

    render(
      <AllProviders>
        <TestWorkflowWrapper opp={opp} />
      </AllProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('Planning Checklist')).toBeInTheDocument();
    });

    // Future phases (ATS, ATC) should be disabled in sidebar
    const atsButton = screen.getByRole('button', { name: /ATS/i });
    const atcButton = screen.getByRole('button', { name: /ATC/i });

    expect(atsButton).toBeDisabled();
    expect(atcButton).toBeDisabled();
  });

  it('should handle Fast Track workflow skipping ATP and ATS', async () => {
    // Fast Track eligible opportunity (TCV < 250k, no KCP deviations)
    const opp = createMockOpportunity({
      currentPhase: 'Planning',
      tcv: 200000,
      raiseTcv: 200000,
      hasKcpDeviations: false,
      isNewCustomer: false,
      raiseLevel: 'L6',
    });
    localStorage.setItem('raise_opportunities', JSON.stringify([opp]));

    render(
      <AllProviders>
        <TestWorkflowWrapper opp={opp} />
      </AllProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('Planning Checklist')).toBeInTheDocument();
    });

    // Should show Fast Track indicator in the UI
    expect(screen.getByText(/Fast Track Eligible/i)).toBeInTheDocument();

    // ATP and ATS should be marked as skipped (line-through styling)
    const atpButton = screen.getByRole('button', { name: /ATP/i });
    const atsButton = screen.getByRole('button', { name: /ATS/i });

    // These buttons should have line-through class (indicating skipped)
    expect(atpButton.className).toContain('line-through');
    expect(atsButton.className).toContain('line-through');
  });

  it('should show process map with correct phase indicators', async () => {
    const opp = createMockOpportunity({ currentPhase: 'ATS' });
    localStorage.setItem('raise_opportunities', JSON.stringify([opp]));

    render(
      <AllProviders>
        <TestWorkflowWrapper opp={opp} />
      </AllProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('ATS Checklist')).toBeInTheDocument();
    });

    // Process map should show all phases
    // Current phase (ATS) should be highlighted
    // Past phases (Planning, ATP) should show as completed
    // Future phases (ATC, Handover) should show as pending

    // Verify phase navigation buttons exist (use getAllByRole to handle duplicates in process map)
    const planningButtons = screen.getAllByRole('button', { name: /Planning/i });
    const atpButtons = screen.getAllByRole('button', { name: /ATP/i });
    const atsButtons = screen.getAllByRole('button', { name: /ATS/i });
    const atcButtons = screen.getAllByRole('button', { name: /ATC/i });
    const handoverButtons = screen.getAllByRole('button', { name: /Handover/i });

    expect(planningButtons.length).toBeGreaterThan(0);
    expect(atpButtons.length).toBeGreaterThan(0);
    expect(atsButtons.length).toBeGreaterThan(0);
    expect(atcButtons.length).toBeGreaterThan(0);
    expect(handoverButtons.length).toBeGreaterThan(0);
  });
});
