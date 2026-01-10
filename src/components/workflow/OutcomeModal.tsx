import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface OutcomeModalProps {
  onSelectOutcome: (outcome: 'Won' | 'Lost') => void;
  onClose: () => void;
}

export const OutcomeModal = ({ onSelectOutcome, onClose }: OutcomeModalProps) => {
  const { t } = useTranslation('workflow');
  const { t: tCommon } = useTranslation('common');

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-in zoom-in-95 duration-200">
        <h3 className="text-2xl font-bold text-slate-900 mb-2">{t('outcome.title')}</h3>
        <p className="text-slate-600 mb-8">{t('outcome.selectOutcomeMessage')}</p>

        <div className="grid grid-cols-2 gap-4">
          {/* Won Button */}
          <button
            onClick={() => onSelectOutcome('Won')}
            className="group relative flex flex-col items-center justify-center p-6 bg-gradient-to-br from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 border-2 border-emerald-200 hover:border-emerald-400 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <TrendingUp
              size={48}
              className="text-emerald-600 mb-3 group-hover:scale-110 transition-transform"
              strokeWidth={2}
            />
            <span className="text-xl font-bold text-emerald-900">{t('outcome.wonLabel')}</span>
            <span className="text-sm text-emerald-700 mt-1">{t('outcome.wonMessage')}</span>
          </button>

          {/* Lost Button */}
          <button
            onClick={() => onSelectOutcome('Lost')}
            className="group relative flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-gray-50 hover:from-slate-100 hover:to-gray-100 border-2 border-slate-200 hover:border-slate-400 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <TrendingDown
              size={48}
              className="text-slate-600 mb-3 group-hover:scale-110 transition-transform"
              strokeWidth={2}
            />
            <span className="text-xl font-bold text-slate-900">{t('outcome.lostLabel')}</span>
            <span className="text-sm text-slate-700 mt-1">{t('outcome.lostMessage')}</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold transition-colors"
        >
          {tCommon('button.cancel')}
        </button>
      </div>
    </div>
  );
};
