import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Opportunity, Checkpoint, ControlConfig, Phase } from '../../types';
import { calculateRaiseLevel, isFastTrackEligible, getRequiredCheckpoints } from '../../lib/raiseLogic';
import { useSettings } from '../../stores/SettingsStore';
import { useOpportunities } from '../../stores/OpportunitiesStore';
import { Check, AlertTriangle, FileText, ChevronRight, ArrowLeft, Shield, Activity, Mail, Bell, ListTodo, Download, Info, ExternalLink, FolderOpen, X, Link2, Edit3, Save, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { showToast } from '../../lib/toast';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const OpportunityWorkflow = ({ opp, onBack }: { opp: Opportunity, onBack: () => void }) => {
    const { t } = useTranslation('workflow');
    const { t: tCommon } = useTranslation('common');
    const [currentOpp, setCurrentOpp] = useState(opp);
    const [activeTab, setActiveTab] = useState<Phase>(opp.currentPhase);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showOutcomeModal, setShowOutcomeModal] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const { controls } = useSettings();
    const { updateOpportunity } = useOpportunities();

    // Calculate Level Dynamically
    const level = calculateRaiseLevel(currentOpp);

    // Can edit details only up to ATP phase (inclusive)
    const canEditDetails = () => {
        const editablePhases: Phase[] = ['Planning', 'ATP'];
        return editablePhases.includes(currentOpp.currentPhase);
    };

    // Workflow phases (excluding outcome phases Won/Lost)
    const workflowPhases: Phase[] = ['Planning', 'ATP', 'ATS', 'ATC', 'Handover'];

    const getNextPhase = (current: Phase): Phase | null => {
        const currentIndex = workflowPhases.indexOf(current);
        if (currentIndex < workflowPhases.length - 1) {
            return workflowPhases[currentIndex + 1];
        }
        return null;
    };

    const handlePhaseAuthorization = async (phase: Phase) => {
        setIsCompleting(true);

        try {
            // Simulate async operation
            await new Promise(resolve => setTimeout(resolve, 500));

            // After ATC, ask user for Won/Lost outcome
            if (phase === 'ATC') {
                setShowOutcomeModal(true);
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

    return (
        <ErrorBoundary
            fallback={
                <div className="p-8 max-w-4xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-red-900 mb-2">{t('error.title')}</h2>
                        <p className="text-red-700 mb-4">
                            {t('error.message')}
                        </p>
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
                <EditOpportunityDetailsModal
                    opp={currentOpp}
                    onSave={(updatedOpp) => {
                        // Recalculate RAISE level with new values
                        const oppWithLevel = {
                            ...updatedOpp,
                            raiseLevel: calculateRaiseLevel(updatedOpp)
                        };
                        setCurrentOpp(oppWithLevel);
                        updateOpportunity(oppWithLevel);
                        setShowEditModal(false);
                        showToast.success(t('completion.changesSaved'));
                    }}
                    onClose={() => setShowEditModal(false)}
                />
            )}

            {/* Opportunity Outcome Modal (Won/Lost) - Shown after ATC */}
            {showOutcomeModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-in zoom-in-95 duration-200">
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">{t('outcome.title')}</h3>
                        <p className="text-slate-600 mb-8">
                            {t('outcome.selectOutcomeMessage')}
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Won Button */}
                            <button
                                onClick={() => handleOpportunityOutcome('Won')}
                                className="group relative flex flex-col items-center justify-center p-6 bg-gradient-to-br from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 border-2 border-emerald-200 hover:border-emerald-400 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                <TrendingUp size={48} className="text-emerald-600 mb-3 group-hover:scale-110 transition-transform" strokeWidth={2} />
                                <span className="text-xl font-bold text-emerald-900">{t('outcome.wonLabel')}</span>
                                <span className="text-sm text-emerald-700 mt-1">{t('outcome.wonMessage')}</span>
                            </button>

                            {/* Lost Button */}
                            <button
                                onClick={() => handleOpportunityOutcome('Lost')}
                                className="group relative flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-gray-50 hover:from-slate-100 hover:to-gray-100 border-2 border-slate-200 hover:border-slate-400 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                <TrendingDown size={48} className="text-slate-600 mb-3 group-hover:scale-110 transition-transform" strokeWidth={2} />
                                <span className="text-xl font-bold text-slate-900">{t('outcome.lostLabel')}</span>
                                <span className="text-sm text-slate-700 mt-1">{t('outcome.lostMessage')}</span>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowOutcomeModal(false)}
                            className="mt-6 w-full px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold transition-colors"
                        >
                            {tCommon('button.cancel')}
                        </button>
                    </div>
                </div>
            )}

            <button onClick={onBack} className="text-slate-500 hover:text-slate-800 text-sm font-medium mb-4 flex items-center gap-1 group transition-colors">
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
                                <div className={clsx(
                                    "px-4 py-2 rounded-lg font-mono font-bold text-xl shadow-lg border backdrop-blur-md",
                                    currentOpp.hasKcpDeviations
                                        ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                                        : "bg-blue-600/20 border-blue-500/50 text-blue-400"
                                )}>
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
                        <ProcessMap phases={workflowPhases} currentPhase={activeTab} isFastTrack={isFastTrackEligible(currentOpp)} />
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
                        {isFastTrackEligible(currentOpp) && (
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
                    <div className="w-full md:w-64 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-200 p-4 sticky top-0 md:relative z-10 backdrop-blur-xl md:backdrop-blur-none">
                        <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
                            {workflowPhases.map((phase) => {
                                const isFT = isFastTrackEligible(currentOpp);
                                const isSkippedInFT = isFT && (phase === 'ATP' || phase === 'ATS');
                                const isPastPhase = workflowPhases.indexOf(phase) < workflowPhases.indexOf(currentOpp.currentPhase);

                                return (
                                    <button
                                        key={phase}
                                        onClick={() => setActiveTab(phase)}
                                        disabled={workflowPhases.indexOf(phase) > workflowPhases.indexOf(currentOpp.currentPhase)}
                                        className={clsx(
                                            "whitespace-nowrap flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all min-w-[120px] md:min-w-0 md:w-full",
                                            activeTab === phase
                                                ? "bg-white shadow-md text-blue-600 border border-blue-100 ring-2 ring-blue-500/10"
                                                : isSkippedInFT
                                                    ? "text-slate-400 line-through opacity-50 border border-transparent"
                                                    : isPastPhase
                                                        ? "text-emerald-600 hover:bg-emerald-50 border border-transparent"
                                                        : workflowPhases.indexOf(phase) > workflowPhases.indexOf(currentOpp.currentPhase)
                                                            ? "text-slate-300 cursor-not-allowed border border-transparent"
                                                            : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-900 border border-transparent"
                                        )}
                                    >
                                        {isPastPhase && <Check size={16} className="mr-1" />}
                                        {phase}
                                        {activeTab === phase && <ChevronRight size={16} className="hidden md:block" />}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-6 md:p-8 bg-white/50">
                        <PhaseChecklist
                            key={activeTab}
                            phase={activeTab}
                            currentOpp={currentOpp}
                            controls={controls}
                            onAuthorize={() => handlePhaseAuthorization(activeTab)}
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

// Sub-component to manage checklist state per phase
const PhaseChecklist = ({
    phase,
    currentOpp,
    controls,
    onAuthorize,
    isCurrentPhase,
    isCompleting
}: {
    phase: string,
    currentOpp: Opportunity,
    controls: ControlConfig[],
    onAuthorize: () => void,
    isCurrentPhase: boolean,
    isCompleting: boolean
}) => {
    const { t } = useTranslation('workflow');
    const [localCheckpoints, setLocalCheckpoints] = useState<Checkpoint[]>(() =>
        getRequiredCheckpoints(phase, currentOpp, controls)
    );

    const toggleCheck = (cpId: string) => {
        setLocalCheckpoints(prev => prev.map(cp => {
            if (cp.id === cpId) {
                return { ...cp, checked: !cp.checked };
            }
            return cp;
        }));
    };

    const allRequiredChecked = localCheckpoints.every(c => !c.required || c.checked);

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    {phase} {t('checkpoints.checklist')}
                    {!isCurrentPhase && (
                        <span className="text-sm font-normal text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                            {t('checkpoints.completed')}
                        </span>
                    )}
                </h2>
                <span className="text-xs font-semibold text-slate-500 border border-slate-200 px-3 py-1 rounded-full bg-slate-100/50">
                    {localCheckpoints.filter(c => c.checked).length} / {localCheckpoints.length} {t('checkpoints.steps')}
                </span>
            </div>

            <div className="space-y-4">
                {localCheckpoints.length === 0 ? (
                    <div className="text-center p-12 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
                        <p className="text-slate-500 font-medium">{t('checkpoints.noChecksRequired')}</p>
                        <p className="text-slate-400 text-sm mt-1">
                            {(phase === 'ATP' || phase === 'ATS')
                                ? t('checkpoints.checksConditional')
                                : t('checkpoints.allChecksClear')}
                        </p>
                    </div>
                ) : (
                    localCheckpoints.map((cp) => (
                        <CheckpointItem
                            key={cp.id}
                            cp={cp}
                            onToggle={() => toggleCheck(cp.id)}
                        />
                    ))
                )}

                {/* Action Bar */}
                {isCurrentPhase && (
                    <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3">
                        <button
                            className="px-6 py-2.5 rounded-xl text-slate-600 font-medium hover:bg-slate-100 bg-white border border-slate-200 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isCompleting}
                        >
                            {t('actions.saveDraft')}
                        </button>
                        <button
                            onClick={onAuthorize}
                            disabled={!allRequiredChecked || isCompleting}
                            className={clsx(
                                "px-6 py-2.5 rounded-xl text-white font-bold shadow-lg transition-all flex items-center justify-center gap-2",
                                !allRequiredChecked || isCompleting
                                    ? "bg-slate-400 cursor-not-allowed opacity-70"
                                    : "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98]"
                            )}
                        >
                            {isCompleting ? (
                                <>
                                    <LoadingSpinner size={18} className="text-white" />
                                    {t('actions.completing')}
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={18} />
                                    {t('actions.complete', { phase })}
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

interface MetricProps {
    label: string;
    value: string | number;
    color?: string;
    icon?: React.ReactNode;
}

const Metric = ({ label, value, color = "text-white", icon }: MetricProps) => (
    <div>
        <div className="text-slate-400 text-[10px] font-bold uppercase mb-1 tracking-wider">{label}</div>
        <div className={clsx("font-semibold flex items-center gap-2 text-sm md:text-base", color)}>
            {icon} {value}
        </div>
    </div>
);

const ProcessMap = ({ phases, currentPhase, isFastTrack }: { phases: string[], currentPhase: string, isFastTrack: boolean }) => {
    return (
        <div className="flex items-center justify-between w-full max-w-4xl relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-700 -z-0 -translate-y-1/2" />
            {phases.map((phase, idx) => {
                const isActive = phase === currentPhase;
                const isCompleted = phases.indexOf(currentPhase) > idx;
                const isSkipped = isFastTrack && (phase === 'ATP' || phase === 'ATS');

                let statusColor = "bg-slate-800 border-slate-600 text-slate-400";
                if (isActive) statusColor = "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/50";
                else if (isCompleted) statusColor = "bg-emerald-500 border-emerald-400 text-white";
                else if (isSkipped) statusColor = "bg-slate-800 border-amber-500/30 text-slate-600";

                return (
                    <div key={phase} className="flex flex-col items-center gap-2 z-10 relative">
                        <div className={clsx(
                            "w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all",
                            statusColor
                        )}>
                            {isCompleted ? <Check size={16} /> : idx + 1}
                        </div>
                        <span className={clsx(
                            "text-[10px] font-medium uppercase tracking-wider whitespace-nowrap",
                            isActive ? "text-white font-bold" : isCompleted ? "text-emerald-400" : "text-slate-500",
                            isSkipped && "line-through"
                        )}>
                            {phase}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

const CheckpointItem = ({ cp, onToggle }: { cp: Checkpoint, onToggle: () => void }) => {
    const [showDetail, setShowDetail] = useState(false);

    const getActionIcon = () => {
        switch (cp.actionType) {
            case 'document': return <FileText size={16} />;
            case 'email': return <Mail size={16} />;
            case 'notification': return <Bell size={16} />;
            case 'task': return <ListTodo size={16} />;
            default: return <FileText size={16} />;
        }
    };

    const hasDetailedInfo = cp.detailedDescription || cp.folderPath || (cp.templateLinks && cp.templateLinks.length > 0) || cp.mandatoryNotes;

    return (
        <>
            {showDetail && <CheckpointDetailModal cp={cp} onClose={() => setShowDetail(false)} />}
        <div className={clsx(
            "group bg-white border-2 rounded-xl p-4 transition-all hover:shadow-md",
            cp.checked ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200"
        )}>
            <div className="flex items-start gap-4">
                {/* Order number badge */}
                {cp.order && (
                    <span className="mt-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex-shrink-0">
                        {cp.order}
                    </span>
                )}

                <button
                    onClick={onToggle}
                    className={clsx(
                        "mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-300",
                        cp.checked
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-slate-300 hover:border-blue-400 hover:bg-blue-50"
                    )}
                    role="checkbox"
                    aria-checked={cp.checked}
                    aria-label={`${cp.checked ? 'Deseleziona' : 'Seleziona'} ${cp.label}${cp.required ? ' (obbligatorio)' : ''}`}
                >
                    {cp.checked && <Check size={16} strokeWidth={3} aria-hidden="true" />}
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-1">
                            <h3 className={clsx(
                                "font-semibold text-slate-900 transition-all",
                                cp.checked && "line-through text-slate-400"
                            )}>
                                {cp.label}
                                {cp.required && <span className="text-red-500 ml-1">*</span>}
                            </h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 text-slate-400">
                                {getActionIcon()}
                                {(cp.templateRef || (cp.templateLinks && cp.templateLinks.length > 0)) && (
                                    <Download size={14} className="text-blue-500" />
                                )}
                            </div>
                            {hasDetailedInfo && (
                                <button
                                    onClick={() => setShowDetail(true)}
                                    className="relative p-2 bg-gradient-to-br from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600 rounded-lg transition-all hover:scale-110 active:scale-95 shadow-md hover:shadow-lg group focus:outline-none focus:ring-2 focus:ring-amber-300"
                                    aria-label={`Visualizza dettagli${cp.mandatoryNotes ? ' e note di mandatorietà' : ''} per ${cp.label}`}
                                    title="Visualizza dettagli e note di mandatorietà"
                                >
                                    <Info size={16} strokeWidth={2.5} className="relative z-10" aria-hidden="true" />
                                    {cp.mandatoryNotes && (
                                        <span
                                            className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"
                                            aria-hidden="true"
                                        />
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {cp.description && (
                        <p className="text-sm text-slate-600 mb-2">{cp.description}</p>
                    )}

                    {cp.templateRef && (
                        <div className="mt-2">
                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 font-medium">
                                Template: {cp.templateRef}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </>
    );
};

// Modal per visualizzare dettagli completi del checkpoint
const CheckpointDetailModal = ({ cp, onClose }: { cp: Checkpoint, onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-gradient-to-r from-cyan-50 to-blue-50">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-xl font-bold text-slate-900">{cp.label}</h2>
                            {cp.required && (
                                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-200">
                                    OBBLIGATORIO
                                </span>
                            )}
                        </div>
                        {cp.description && (
                            <p className="text-sm text-slate-600">{cp.description}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(80vh-140px)]">
                    {/* Descrizione Dettagliata */}
                    {cp.detailedDescription && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                <FileText size={16} className="text-cyan-600" />
                                Istruzioni Operative
                            </h3>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                    {cp.detailedDescription}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Percorso Cartella */}
                    {cp.folderPath && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                <FolderOpen size={16} className="text-amber-600" />
                                Percorso SharePoint
                            </h3>
                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 font-mono text-sm text-amber-900">
                                {cp.folderPath}
                            </div>
                            <p className="text-xs text-slate-500">
                                Salva il documento in questa cartella su SharePoint
                            </p>
                        </div>
                    )}

                    {/* Template Links */}
                    {cp.templateLinks && cp.templateLinks.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                <Link2 size={16} className="text-blue-600" />
                                Template Disponibili
                            </h3>
                            <div className="space-y-2">
                                {cp.templateLinks.map((link, index) => (
                                    <a
                                        key={index}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 hover:border-blue-300 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
                                                <FileText size={18} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-900 group-hover:text-blue-700">
                                                    {link.name}
                                                </div>
                                                <div className="text-xs text-slate-500 font-mono truncate max-w-md">
                                                    {link.url}
                                                </div>
                                            </div>
                                        </div>
                                        <ExternalLink size={18} className="text-blue-600 group-hover:text-blue-700 flex-shrink-0" />
                                    </a>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500">
                                Clicca per aprire il template in una nuova scheda
                            </p>
                        </div>
                    )}

                    {/* Mandatory Notes from Excel */}
                    {cp.mandatoryNotes && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                <AlertTriangle size={16} className="text-amber-600" />
                                Note sulla Mandatorietà (da Excel PSQ-003)
                            </h3>
                            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200">
                                <p className="text-sm text-amber-900 font-medium whitespace-pre-wrap leading-relaxed">
                                    {cp.mandatoryNotes}
                                </p>
                            </div>
                            <p className="text-xs text-slate-500 italic">
                                Queste note provengono direttamente dal foglio Excel "Checklist_Supporto RAISE.xlsx" e descrivono le condizioni specifiche di mandatorietà secondo PSQ-003 v17.
                            </p>
                        </div>
                    )}

                    {/* Action Type Info */}
                    {cp.actionType && (
                        <div className="pt-4 border-t border-slate-200">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <span className="font-semibold">Tipo di azione:</span>
                                <span className="px-3 py-1 bg-slate-100 rounded-lg border border-slate-200 font-medium capitalize">
                                    {cp.actionType}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        Chiudi
                    </button>
                </div>
            </div>
        </div>
    );
};

// Edit Opportunity Details Modal - Allows modifying RTI, KCP deviations, and other flags (only up to ATP phase)
interface EditOpportunityDetailsModalProps {
    opp: Opportunity;
    onSave: (opp: Opportunity) => void;
    onClose: () => void;
}

const EditOpportunityDetailsModal = ({ opp, onSave, onClose }: EditOpportunityDetailsModalProps) => {
    const { t } = useTranslation('workflow');
    const [formData, setFormData] = useState({
        isRti: opp.isRti,
        isMandataria: opp.isMandataria || false,
        hasKcpDeviations: opp.hasKcpDeviations,
        isNewCustomer: opp.isNewCustomer || false,
        isPublicSector: opp.isPublicSector,
        hasSocialClauses: opp.hasSocialClauses || false,
        isNonCoreBusiness: opp.isNonCoreBusiness || false,
    });

    // Check if ATS has been completed (flags can only be modified until ATS is complete)
    const isATSCompleted = ['ATC', 'Handover', 'Won', 'Lost'].includes(opp.currentPhase);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isATSCompleted) {
            showToast.error(t('completion.flagsLockedAfterATS'));
            return;
        }

        const updatedOpp: Opportunity = {
            ...opp,
            isRti: formData.isRti,
            isMandataria: formData.isMandataria,
            hasKcpDeviations: formData.hasKcpDeviations,
            isNewCustomer: formData.isNewCustomer,
            isPublicSector: formData.isPublicSector,
            hasSocialClauses: formData.hasSocialClauses,
            isNonCoreBusiness: formData.isNonCoreBusiness,
        };
        onSave(updatedOpp);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-cyan-50 to-blue-50">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">{t('editModal.title')}</h2>
                            <p className="text-slate-600 mt-1">
                                {isATSCompleted
                                    ? t('editModal.atsCompletedWarning')
                                    : t('editModal.editableFlagsNote')}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                        >
                            <X size={20} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-180px)]">
                    {/* RTI & Mandataria */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">
                            RTI / Joint Venture
                        </h3>

                        <label className={`flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl transition-colors ${isATSCompleted ? 'opacity-50 cursor-not-allowed' : 'hover:border-cyan-300 cursor-pointer'}`}>
                            <input
                                type="checkbox"
                                checked={formData.isRti}
                                onChange={e => setFormData({ ...formData, isRti: e.target.checked, isMandataria: e.target.checked ? formData.isMandataria : false })}
                                disabled={isATSCompleted}
                                className="w-5 h-5 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <div>
                                <div className="font-semibold text-slate-900">RTI (Raggruppamento Temporaneo Imprese)</div>
                                <div className="text-xs text-slate-500">L'opportunità è in RTI/Joint Venture</div>
                            </div>
                        </label>

                        {formData.isRti && (
                            <label className={`flex items-center gap-3 p-4 border-2 border-cyan-200 bg-cyan-50 rounded-xl ${isATSCompleted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                <input
                                    type="checkbox"
                                    checked={formData.isMandataria}
                                    onChange={e => setFormData({ ...formData, isMandataria: e.target.checked })}
                                    disabled={isATSCompleted}
                                    className="w-5 h-5 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <div>
                                    <div className="font-semibold text-cyan-900">Lutech è Mandataria</div>
                                    <div className="text-xs text-cyan-700">Lutech è la capofila dell'RTI</div>
                                </div>
                            </label>
                        )}
                    </div>

                    {/* KCP & Risks */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">
                            KCP Deviations & Rischi
                        </h3>

                        <label className={`flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl transition-colors ${isATSCompleted ? 'opacity-50 cursor-not-allowed' : 'hover:border-amber-300 cursor-pointer'}`}>
                            <input
                                type="checkbox"
                                checked={formData.hasKcpDeviations}
                                onChange={e => setFormData({ ...formData, hasKcpDeviations: e.target.checked })}
                                disabled={isATSCompleted}
                                className="w-5 h-5 text-amber-600 border-slate-300 rounded focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <div>
                                <div className="font-semibold text-slate-900">Deviazioni KCP</div>
                                <div className="text-xs text-slate-500">Deviazioni ai Key Contracting Principles (aumenta livello RAISE)</div>
                            </div>
                        </label>

                        <label className={`flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl transition-colors ${isATSCompleted ? 'opacity-50 cursor-not-allowed' : 'hover:border-cyan-300 cursor-pointer'}`}>
                            <input
                                type="checkbox"
                                checked={formData.isNewCustomer}
                                onChange={e => setFormData({ ...formData, isNewCustomer: e.target.checked })}
                                disabled={isATSCompleted}
                                className="w-5 h-5 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <div>
                                <div className="font-semibold text-slate-900">Nuovo Cliente</div>
                                <div className="text-xs text-slate-500">Primo ingaggio con il cliente (aumenta livello RAISE)</div>
                            </div>
                        </label>
                    </div>

                    {/* Forcing Factors to L1 */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">
                            Fattori Forzatura Livello L1
                        </h3>

                        <label className={`flex items-center gap-3 p-4 border-2 border-red-200 bg-red-50 rounded-xl ${isATSCompleted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                            <input
                                type="checkbox"
                                checked={formData.hasSocialClauses}
                                onChange={e => setFormData({ ...formData, hasSocialClauses: e.target.checked })}
                                disabled={isATSCompleted}
                                className="w-5 h-5 text-red-600 border-slate-300 rounded focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <div>
                                <div className="font-semibold text-red-900">Clausole Sociali</div>
                                <div className="text-xs text-red-700">Obbligo assorbimento personale (forza L1)</div>
                            </div>
                        </label>

                        <label className={`flex items-center gap-3 p-4 border-2 border-red-200 bg-red-50 rounded-xl ${isATSCompleted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                            <input
                                type="checkbox"
                                checked={formData.isNonCoreBusiness}
                                onChange={e => setFormData({ ...formData, isNonCoreBusiness: e.target.checked })}
                                disabled={isATSCompleted}
                                className="w-5 h-5 text-red-600 border-slate-300 rounded focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <div>
                                <div className="font-semibold text-red-900">NON Core Business</div>
                                <div className="text-xs text-red-700">Attività fuori dal core business Lutech (forza L1)</div>
                            </div>
                        </label>
                    </div>

                    {/* Other Flags */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">
                            Altri Flag
                        </h3>

                        <label className={`flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl transition-colors ${isATSCompleted ? 'opacity-50 cursor-not-allowed' : 'hover:border-cyan-300 cursor-pointer'}`}>
                            <input
                                type="checkbox"
                                checked={formData.isPublicSector}
                                onChange={e => setFormData({ ...formData, isPublicSector: e.target.checked })}
                                disabled={isATSCompleted}
                                className="w-5 h-5 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <div>
                                <div className="font-semibold text-slate-900">Settore Pubblico</div>
                                <div className="text-xs text-slate-500">Cliente è PA o ente pubblico</div>
                            </div>
                        </label>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 text-slate-700 font-semibold rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-white transition-all"
                    >
                        Annulla
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isATSCompleted}
                        className={`px-6 py-3 font-semibold rounded-xl transition-all flex items-center gap-2 ${
                            isATSCompleted
                                ? 'bg-slate-400 text-white cursor-not-allowed opacity-70'
                                : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                    >
                        <Save size={18} strokeWidth={2.5} />
                        Salva Modifiche
                    </button>
                </div>
            </div>
        </div>
    );
};
