import { FileText, FolderOpen, Link2, ExternalLink, AlertTriangle, X } from 'lucide-react';
import type { Checkpoint } from '../../types';

interface CheckpointDetailModalProps {
  cp: Checkpoint;
  onClose: () => void;
}

export const CheckpointDetailModal = ({ cp, onClose }: CheckpointDetailModalProps) => {
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
            {cp.description && <p className="text-sm text-slate-600">{cp.description}</p>}
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
              <p className="text-xs text-slate-500">Salva il documento in questa cartella su SharePoint</p>
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
                        <div className="font-semibold text-slate-900 group-hover:text-blue-700">{link.name}</div>
                        <div className="text-xs text-slate-500 font-mono truncate max-w-md">{link.url}</div>
                      </div>
                    </div>
                    <ExternalLink size={18} className="text-blue-600 group-hover:text-blue-700 flex-shrink-0" />
                  </a>
                ))}
              </div>
              <p className="text-xs text-slate-500">Clicca per aprire il template in una nuova scheda</p>
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
                Queste note provengono direttamente dal foglio Excel "Checklist_Supporto RAISE.xlsx" e descrivono le
                condizioni specifiche di mandatorietà secondo PSQ-003 v17.
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
