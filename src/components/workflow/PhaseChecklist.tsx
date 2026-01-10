import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import type { Opportunity, Checkpoint, ControlConfig } from '../../types';
import { getRequiredCheckpoints } from '../../lib/raiseLogic';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { CheckpointItem } from './CheckpointItem';

interface PhaseChecklistProps {
  phase: string;
  currentOpp: Opportunity;
  controls: ControlConfig[];
  onAuthorize: () => void;
  onSaveDraft: (checkpoints: Checkpoint[]) => void;
  isCurrentPhase: boolean;
  isCompleting: boolean;
}

export const PhaseChecklist = ({
  phase,
  currentOpp,
  controls,
  onAuthorize,
  onSaveDraft,
  isCurrentPhase,
  isCompleting,
}: PhaseChecklistProps) => {
  const { t } = useTranslation('workflow');
  const [isSaving, setIsSaving] = useState(false);
  const [localCheckpoints, setLocalCheckpoints] = useState<Checkpoint[]>(() => {
    // First check if there are saved checkpoints for this phase
    const savedCheckpoints = currentOpp.checkpoints?.[phase];
    if (savedCheckpoints && savedCheckpoints.length > 0) {
      return savedCheckpoints;
    }
    // Otherwise compute from controls
    return getRequiredCheckpoints(phase, currentOpp, controls);
  });

  const toggleCheck = (cpId: string) => {
    setLocalCheckpoints((prev) =>
      prev.map((cp) => {
        if (cp.id === cpId) {
          return { ...cp, checked: !cp.checked };
        }
        return cp;
      })
    );
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      // Simulate async save operation
      await new Promise((resolve) => setTimeout(resolve, 300));
      onSaveDraft(localCheckpoints);
    } finally {
      setIsSaving(false);
    }
  };

  const allRequiredChecked = localCheckpoints.every((c) => !c.required || c.checked);

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
          {localCheckpoints.filter((c) => c.checked).length} / {localCheckpoints.length} {t('checkpoints.steps')}
        </span>
      </div>

      <div className="space-y-4">
        {localCheckpoints.length === 0 ? (
          <div className="text-center p-12 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
            <p className="text-slate-500 font-medium">{t('checkpoints.noChecksRequired')}</p>
            <p className="text-slate-400 text-sm mt-1">
              {phase === 'ATP' || phase === 'ATS'
                ? t('checkpoints.checksConditional')
                : t('checkpoints.allChecksClear')}
            </p>
          </div>
        ) : (
          localCheckpoints.map((cp) => <CheckpointItem key={cp.id} cp={cp} onToggle={() => toggleCheck(cp.id)} />)
        )}

        {/* Action Bar */}
        {isCurrentPhase && (
          <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={handleSaveDraft}
              className="px-6 py-2.5 rounded-xl text-slate-600 font-medium hover:bg-slate-100 bg-white border border-slate-200 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={isCompleting || isSaving}
            >
              {isSaving ? (
                <>
                  <LoadingSpinner size={16} className="text-slate-600" />
                  {t('actions.saving')}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {t('actions.saveDraft')}
                </>
              )}
            </button>
            <button
              onClick={onAuthorize}
              disabled={!allRequiredChecked || isCompleting}
              className={clsx(
                'px-6 py-2.5 rounded-xl text-white font-bold shadow-lg transition-all flex items-center justify-center gap-2',
                !allRequiredChecked || isCompleting
                  ? 'bg-slate-400 cursor-not-allowed opacity-70'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98]'
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
