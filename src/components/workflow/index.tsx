import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Opportunity, Phase } from '../../types';
import { calculateRaiseLevel, isFastTrackEligible } from '../../lib/raiseLogic';
import { useSettings } from '../../stores/SettingsStore';
import { useOpportunities } from '../../stores/OpportunitiesStore';
import { Check, AlertTriangle, ArrowLeft, Shield, Activity, Edit3 } from 'lucide-react';
import { clsx } from 'clsx';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { showToast } from '../../lib/toast';

// Extracted components
import { ProcessMap } from './ProcessMap';
import { Metric } from './Metric';
import { PhaseChecklist } from './PhaseChecklist';
import { EditOpportunityModal } from './EditOpportunityModal';
import { OutcomeModal } from './OutcomeModal';
import { WorkflowSidebar } from './WorkflowSidebar';

// Workflow phases (excluding outcome phases Won/Lost)
const WORKFLOW_PHASES: Phase[] = ['Planning', 'ATP', 'ATS', 'ATC', 'Handover'];

export const OpportunityWorkflow = ({ opp, onBack }: { opp: Opportunity; onBack: () => void }) => {
  const { t } = useTranslation('workflow');
  const [currentOpp, setCurrentOpp] = useState(opp);
  const [activeTab, setActiveTab] = useState<Phase>(opp.currentPhase);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const { controls } = useSettings();
  const { updateOpportunity } = useOpportunities();

  // Calculate Level Dynamically
  const level = calculateRaiseLevel(currentOpp);
  const isFastTrack = isFastTrackEligible(currentOpp);

  // Can edit details only up to ATP phase (inclusive)
  const canEditDetails = () => {
    const editablePhases: Phase[] = ['Planning', 'ATP'];
    return editablePhases.includes(currentOpp.currentPhase);
  };

  const getNextPhase = (current: Phase): Phase | null => {
    const currentIndex = WORKFLOW_PHASES.indexOf(current);
    if (currentIndex < WORKFLOW_PHASES.length - 1) {
      let nextPhase = WORKFLOW_PHASES[currentIndex + 1];

      // Fast Track: skip ATP and ATS phases (go directly from Planning to ATC)
      if (isFastTrack) {
        while (nextPhase === 'ATP' || nextPhase === 'ATS') {
          const nextIndex = WORKFLOW_PHASES.indexOf(nextPhase);
          if (nextIndex < WORKFLOW_PHASES.length - 1) {
            nextPhase = WORKFLOW_PHASES[nextIndex + 1];
          } else {
            return null;
          }
        }
      }

      return nextPhase;
    }
    return null;
  };

  const handlePhaseAuthorization = async (phase: Phase) => {
    setIsCompleting(true);

    try {
      // Simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 500));

      // After ATC, ask user for Won/Lost outcome
      if (phase === 'ATC') {
        setShowOutcomeModal(true);
        return;
      }

      // Handover is the final phase - workflow is complete
      if (phase === 'Handover') {
        showToast.success(t('completion.success') + ' - Workflow completato!');
        return;
      }

      const nextPhase = getNextPhase(phase);

      if (nextPhase) {
        const updatedOpp = { ...currentOpp, currentPhase: nextPhase };
        setCurrentOpp(updatedOpp);
        updateOpportunity(updatedOpp);
        setActiveTab(nextPhase);
        showToast.success(t('completion.successAdvance', { phase, nextPhase }));
      }
    } catch {
      showToast.error(t('completion.error'));
    } finally {
      setIsCompleting(false);
    }
  };

  const handleOpportunityOutcome = (outcome: 'Won' | 'Lost') => {
    if (outcome === 'Won') {
      // Won -> go to Handover phase
      const updatedOpp: Opportunity = { ...currentOpp, currentPhase: 'Handover' };
      setCurrentOpp(updatedOpp);
      updateOpportunity(updatedOpp);
      setActiveTab('Handover');
      setShowOutcomeModal(false);
      showToast.success(t('outcome.wonSuccess'));
    } else {
      // Lost -> mark as Lost (final phase)
      const updatedOpp: Opportunity = { ...currentOpp, currentPhase: 'Lost' };
      setCurrentOpp(updatedOpp);
      updateOpportunity(updatedOpp);
      setShowOutcomeModal(false);
      showToast.info(t('outcome.lostInfo'));
    }
  };

  const handleEditSave = (updatedOpp: Opportunity) => {
    // Recalculate RAISE level with new values
    const oppWithLevel = {
      ...updatedOpp,
      raiseLevel: calculateRaiseLevel(updatedOpp),
    };
    setCurrentOpp(oppWithLevel);
    updateOpportunity(oppWithLevel);
    setShowEditModal(false);
    showToast.success(t('completion.changesSaved'));
  };

  const handleSaveDraft = (checkpoints: typeof currentOpp.checkpoints[string]) => {
    const updatedOpp = {
      ...currentOpp,
      checkpoints: {
        ...currentOpp.checkpoints,
        [activeTab]: checkpoints,
      },
    };
    setCurrentOpp(updatedOpp);
    updateOpportunity(updatedOpp);
    showToast.success(t('completion.draftSaved'));
  };

  return (
    <ErrorBoundary
      fallback={
        <div className="p-8 max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-red-900 mb-2">{t('error.title')}</h2>
            <p className="text-red-700 mb-4">{t('error.message')}</p>
            <button
              onClick={onBack}
              className="px-6 py-2 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700"
            >
              {t('actions.backToDashboard')}
            </button>
          </div>
        </div>
      }
    >
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Edit Opportunity Details Modal */}
        {showEditModal && (
          <EditOpportunityModal opp={currentOpp} onSave={handleEditSave} onClose={() => setShowEditModal(false)} />
        )}

        {/* Opportunity Outcome Modal (Won/Lost) - Shown after ATC */}
        {showOutcomeModal && (
          <OutcomeModal onSelectOutcome={handleOpportunityOutcome} onClose={() => setShowOutcomeModal(false)} />
        )}

        <button
          onClick={onBack}
          className="text-slate-500 hover:text-slate-800 text-sm font-medium mb-4 flex items-center gap-1 group transition-colors"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          {t('actions.backToDashboard')}
        </button>

        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/60 shadow-xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5 bg-white blur-3xl rounded-full pointer-events-none" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-1 text-slate-400 text-sm">
                  {currentOpp.id} <span className="w-1 h-1 rounded-full bg-slate-500" /> {currentOpp.industry}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
                  {currentOpp.title}
                </h1>
                <p className="text-slate-400 text-lg mt-1">{currentOpp.clientName}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-3">
                  {canEditDetails() && (
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all flex items-center gap-2 text-sm font-semibold"
                      title={t('editModal.tooltip')}
                    >
                      <Edit3 size={16} strokeWidth={2.5} />
                      <span className="hidden sm:inline">{t('actions.editDetails')}</span>
                    </button>
                  )}
                  <div
                    className={clsx(
                      'px-4 py-2 rounded-lg font-mono font-bold text-xl shadow-lg border backdrop-blur-md',
                      currentOpp.hasKcpDeviations
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                        : 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                    )}
                  >
                    {level}
                  </div>
                </div>
                <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1">
                  <Shield size={10} /> {t('authLevel')}
                </span>
              </div>
            </div>

            {/* Process Map */}
            <div className="mt-8 pt-6 border-t border-slate-700/50">
              <ProcessMap phases={WORKFLOW_PHASES} currentPhase={activeTab} isFastTrack={isFastTrack} />
            </div>

            {/* Context Bar */}
            <div className="mt-6 flex flex-wrap items-center gap-6 md:gap-8 pt-4">
              <Metric label="TCV" value={`€ ${currentOpp.tcv.toLocaleString()}`} />
              <Metric label="RAISE TCV" value={`€ ${currentOpp.raiseTcv.toLocaleString()}`} color="text-blue-300" />
              <Metric
                label={t('kcp.status')}
                value={currentOpp.hasKcpDeviations ? t('kcp.deviations') : t('kcp.standard')}
                color={currentOpp.hasKcpDeviations ? 'text-amber-400' : 'text-emerald-400'}
                icon={currentOpp.hasKcpDeviations ? <AlertTriangle size={16} /> : <Check size={16} />}
              />

              {/* Process Context */}
              {isFastTrack && (
                <div className="bg-blue-500/20 border border-blue-400/30 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-200 flex items-center gap-2">
                  <Activity size={12} />
                  {t('fastTrack.eligible')}
                </div>
              )}
            </div>
          </div>

          {/* Workflow Body */}
          <div className="flex flex-col md:flex-row min-h-[500px]">
            {/* Stepper Sidebar */}
            <WorkflowSidebar
              phases={WORKFLOW_PHASES}
              currentPhase={currentOpp.currentPhase}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isFastTrack={isFastTrack}
            />

            {/* Content Area */}
            <div className="flex-1 p-6 md:p-8 bg-white/50">
              <PhaseChecklist
                key={activeTab}
                phase={activeTab}
                currentOpp={currentOpp}
                controls={controls}
                onAuthorize={() => handlePhaseAuthorization(activeTab)}
                onSaveDraft={handleSaveDraft}
                isCurrentPhase={activeTab === (currentOpp.currentPhase as Phase)}
                isCompleting={isCompleting}
              />
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};
