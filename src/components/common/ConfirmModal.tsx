import { AlertTriangle, X } from 'lucide-react';
import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal = ({
    isOpen,
    title,
    message,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel,
    variant = 'warning'
}: ConfirmModalProps) => {
    const { t } = useTranslation();
    const modalRef = useRef<HTMLDivElement>(null);

    const finalConfirmLabel = confirmLabel || t('button.confirm');
    const finalCancelLabel = cancelLabel || t('button.cancel');

    // Trap focus within modal
    useFocusTrap(modalRef, isOpen);

    // Handle Escape key to close modal
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCancel();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            bg: 'bg-gradient-to-r from-red-50 to-rose-50',
            border: 'border-red-200',
            icon: 'text-red-600',
            button: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
        },
        warning: {
            bg: 'bg-gradient-to-r from-amber-50 to-yellow-50',
            border: 'border-amber-200',
            icon: 'text-amber-600',
            button: 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700'
        },
        info: {
            bg: 'bg-gradient-to-r from-cyan-50 to-blue-50',
            border: 'border-cyan-200',
            icon: 'text-cyan-600',
            button: 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700'
        }
    };

    const styles = variantStyles[variant];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
        >
            <div
                ref={modalRef}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className={`p-6 border-b ${styles.border} ${styles.bg}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                            <div
                                className={`p-2 rounded-xl bg-white shadow-sm ${styles.icon}`}
                                aria-hidden="true"
                            >
                                <AlertTriangle size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2
                                    id="modal-title"
                                    className="text-xl font-bold text-slate-900"
                                >
                                    {title}
                                </h2>
                            </div>
                        </div>
                        <button
                            onClick={onCancel}
                            className="p-2 hover:bg-white/50 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                            aria-label={t('button.close')}
                        >
                            <X size={20} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p
                        id="modal-description"
                        className="text-slate-700 leading-relaxed"
                    >
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 text-slate-700 font-semibold rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-white transition-all"
                    >
                        {finalCancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-6 py-3 text-white font-semibold rounded-xl ${styles.button} shadow-lg transition-all`}
                    >
                        {finalConfirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
