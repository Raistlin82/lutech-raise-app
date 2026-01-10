import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Save } from 'lucide-react';
import type { Opportunity } from '../../types';
import { showToast } from '../../lib/toast';

interface EditOpportunityModalProps {
  opp: Opportunity;
  onSave: (opp: Opportunity) => void;
  onClose: () => void;
}

export const EditOpportunityModal = ({ opp, onSave, onClose }: EditOpportunityModalProps) => {
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
                {isATSCompleted ? t('editModal.atsCompletedWarning') : t('editModal.editableFlagsNote')}
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
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">RTI / Joint Venture</h3>

            <label
              className={`flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl transition-colors ${isATSCompleted ? 'opacity-50 cursor-not-allowed' : 'hover:border-cyan-300 cursor-pointer'}`}
            >
              <input
                type="checkbox"
                checked={formData.isRti}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    isRti: e.target.checked,
                    isMandataria: e.target.checked ? formData.isMandataria : false,
                  })
                }
                disabled={isATSCompleted}
                className="w-5 h-5 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div>
                <div className="font-semibold text-slate-900">RTI (Raggruppamento Temporaneo Imprese)</div>
                <div className="text-xs text-slate-500">L'opportunità è in RTI/Joint Venture</div>
              </div>
            </label>

            {formData.isRti && (
              <label
                className={`flex items-center gap-3 p-4 border-2 border-cyan-200 bg-cyan-50 rounded-xl ${isATSCompleted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <input
                  type="checkbox"
                  checked={formData.isMandataria}
                  onChange={(e) => setFormData({ ...formData, isMandataria: e.target.checked })}
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

            <label
              className={`flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl transition-colors ${isATSCompleted ? 'opacity-50 cursor-not-allowed' : 'hover:border-amber-300 cursor-pointer'}`}
            >
              <input
                type="checkbox"
                checked={formData.hasKcpDeviations}
                onChange={(e) => setFormData({ ...formData, hasKcpDeviations: e.target.checked })}
                disabled={isATSCompleted}
                className="w-5 h-5 text-amber-600 border-slate-300 rounded focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div>
                <div className="font-semibold text-slate-900">Deviazioni KCP</div>
                <div className="text-xs text-slate-500">
                  Deviazioni ai Key Contracting Principles (aumenta livello RAISE)
                </div>
              </div>
            </label>

            <label
              className={`flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl transition-colors ${isATSCompleted ? 'opacity-50 cursor-not-allowed' : 'hover:border-cyan-300 cursor-pointer'}`}
            >
              <input
                type="checkbox"
                checked={formData.isNewCustomer}
                onChange={(e) => setFormData({ ...formData, isNewCustomer: e.target.checked })}
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

            <label
              className={`flex items-center gap-3 p-4 border-2 border-red-200 bg-red-50 rounded-xl ${isATSCompleted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <input
                type="checkbox"
                checked={formData.hasSocialClauses}
                onChange={(e) => setFormData({ ...formData, hasSocialClauses: e.target.checked })}
                disabled={isATSCompleted}
                className="w-5 h-5 text-red-600 border-slate-300 rounded focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div>
                <div className="font-semibold text-red-900">Clausole Sociali</div>
                <div className="text-xs text-red-700">Obbligo assorbimento personale (forza L1)</div>
              </div>
            </label>

            <label
              className={`flex items-center gap-3 p-4 border-2 border-red-200 bg-red-50 rounded-xl ${isATSCompleted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <input
                type="checkbox"
                checked={formData.isNonCoreBusiness}
                onChange={(e) => setFormData({ ...formData, isNonCoreBusiness: e.target.checked })}
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
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">Altri Flag</h3>

            <label
              className={`flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl transition-colors ${isATSCompleted ? 'opacity-50 cursor-not-allowed' : 'hover:border-cyan-300 cursor-pointer'}`}
            >
              <input
                type="checkbox"
                checked={formData.isPublicSector}
                onChange={(e) => setFormData({ ...formData, isPublicSector: e.target.checked })}
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
