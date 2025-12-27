/**
 * ErrorSummary Component
 * Displays a summary of all form errors at the top
 * Auto-focuses first error field when clicked
 * WCAG 3.3.1 - Error Identification (Level A)
 */

import { AlertTriangle, X } from 'lucide-react';

export interface ErrorSummaryProps {
  errors: Array<{
    field: string;
    message: string;
  }>;
  onDismiss?: () => void;
  onFieldClick?: (field: string) => void;
}

export const ErrorSummary = ({ errors, onDismiss, onFieldClick }: ErrorSummaryProps) => {
  if (errors.length === 0) return null;

  return (
    <div
      className="bg-red-50 border-2 border-red-200 rounded-xl p-5 animate-in slide-in-from-top-2 duration-300"
      role="alert"
      aria-labelledby="error-summary-title"
      aria-live="polite"
    >
      <div className="flex items-start gap-4">
        <div className="p-2 bg-red-100 rounded-lg shrink-0">
          <AlertTriangle size={24} strokeWidth={2.5} className="text-red-600" aria-hidden="true" />
        </div>

        <div className="flex-1">
          <h3
            id="error-summary-title"
            className="font-bold text-red-900 text-lg mb-3"
          >
            {errors.length === 1
              ? 'Si è verificato un errore'
              : `Si sono verificati ${errors.length} errori`}
          </h3>

          <ul className="space-y-2 text-sm">
            {errors.map((error, index) => (
              <li key={`${error.field}-${index}`}>
                <button
                  type="button"
                  onClick={() => {
                    onFieldClick?.(error.field);
                    // Focus the field
                    const element = document.getElementById(error.field);
                    if (element) {
                      element.focus();
                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                  className="text-left text-red-700 hover:text-red-900 font-medium underline decoration-dotted underline-offset-2 transition-colors"
                >
                  {error.message}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600 hover:text-red-900 shrink-0"
            aria-label="Chiudi riepilogo errori"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
};
