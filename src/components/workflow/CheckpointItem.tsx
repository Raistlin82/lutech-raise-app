import { useState } from 'react';
import { Check, FileText, Mail, Bell, ListTodo, Download, Info } from 'lucide-react';
import { clsx } from 'clsx';
import type { Checkpoint } from '../../types';
import { CheckpointDetailModal } from './CheckpointDetailModal';

interface CheckpointItemProps {
  cp: Checkpoint;
  onToggle: () => void;
}

export const CheckpointItem = ({ cp, onToggle }: CheckpointItemProps) => {
  const [showDetail, setShowDetail] = useState(false);

  const getActionIcon = () => {
    switch (cp.actionType) {
      case 'document':
        return <FileText size={16} />;
      case 'email':
        return <Mail size={16} />;
      case 'notification':
        return <Bell size={16} />;
      case 'task':
        return <ListTodo size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const hasDetailedInfo =
    cp.detailedDescription || cp.folderPath || (cp.templateLinks && cp.templateLinks.length > 0) || cp.mandatoryNotes;

  return (
    <>
      {showDetail && <CheckpointDetailModal cp={cp} onClose={() => setShowDetail(false)} />}
      <div
        className={clsx(
          'group bg-white border-2 rounded-xl p-4 transition-all hover:shadow-md',
          cp.checked ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'
        )}
      >
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
              'mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-300',
              cp.checked
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
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
                <h3
                  className={clsx(
                    'font-semibold text-slate-900 transition-all',
                    cp.checked && 'line-through text-slate-400'
                  )}
                >
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

            {cp.description && <p className="text-sm text-slate-600 mb-2">{cp.description}</p>}

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
