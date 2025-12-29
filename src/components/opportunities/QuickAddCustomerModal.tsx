import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useCustomers } from '../../stores/CustomerStore';
import type { Industry } from '../../types';
import { validateCustomer } from '../../lib/validation';

interface QuickAddCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCustomerCreated: (customerId: string) => void;
}

const INDUSTRIES: Industry[] = [
    'Technology',
    'Manufacturing',
    'Finance',
    'Healthcare',
    'Retail',
    'Energy',
    'Transportation',
    'Public Administration',
    'Telecommunications',
    'Consulting',
];

export const QuickAddCustomerModal: React.FC<QuickAddCustomerModalProps> = ({
    isOpen,
    onClose,
    onCustomerCreated,
}) => {
    const { t } = useTranslation('customers');
    const { t: tCommon } = useTranslation('common');
    const { addCustomer } = useCustomers();
    const [formData, setFormData] = useState({
        name: '',
        industry: 'Technology' as Industry,
        isPublicSector: false,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setFormData({
                name: '',
                industry: 'Technology',
                isPublicSector: false,
            });
            setErrors({});
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate with temporary ID (will be replaced by addCustomer)
        const customerData = {
            id: crypto.randomUUID(),
            ...formData,
        };

        const validation = validateCustomer(customerData);

        if (!validation.success) {
            const fieldErrors: Record<string, string> = {};
            validation.error.issues.forEach((err) => {
                if (err.path[0]) {
                    fieldErrors[err.path[0].toString()] = err.message;
                }
            });
            setErrors(fieldErrors);
            return;
        }

        setIsSubmitting(true);

        try {
            // Add customer and get the new ID
            const newCustomerId = addCustomer({
                ...formData,
            });

            // Notify parent with new customer ID
            onCustomerCreated(newCustomerId);

            // Close modal
            onClose();
        } catch (error) {
            console.error('Failed to add customer:', error);
            setErrors({ submit: 'Failed to add customer. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-900">{t('form.titleAdd')}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Name */}
                    <div>
                        <label htmlFor="customer-name" className="block text-sm font-semibold text-slate-700 mb-2">
                            {t('form.labelName')} *
                        </label>
                        <input
                            id="customer-name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => {
                                setFormData({ ...formData, name: e.target.value });
                                setErrors({ ...errors, name: '' });
                            }}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-cyan-300 transition-all ${
                                errors.name
                                    ? 'border-red-300 bg-red-50'
                                    : 'border-slate-200 focus:border-cyan-500'
                            }`}
                            placeholder={t('form.placeholderName')}
                            autoFocus
                        />
                        {errors.name && (
                            <p className="text-red-600 text-xs mt-1 font-medium">{errors.name}</p>
                        )}
                    </div>

                    {/* Industry */}
                    <div>
                        <label htmlFor="customer-industry" className="block text-sm font-semibold text-slate-700 mb-2">
                            {t('form.labelIndustry')} *
                        </label>
                        <select
                            id="customer-industry"
                            value={formData.industry}
                            onChange={(e) =>
                                setFormData({ ...formData, industry: e.target.value as Industry })
                            }
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-cyan-300 transition-all ${
                                errors.industry
                                    ? 'border-red-300 bg-red-50'
                                    : 'border-slate-200 focus:border-cyan-500'
                            }`}
                        >
                            {INDUSTRIES.map((ind) => (
                                <option key={ind} value={ind}>
                                    {ind}
                                </option>
                            ))}
                        </select>
                        {errors.industry && (
                            <p className="text-red-600 text-xs mt-1 font-medium">{errors.industry}</p>
                        )}
                    </div>

                    {/* Public Sector */}
                    <div>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={formData.isPublicSector}
                                onChange={(e) =>
                                    setFormData({ ...formData, isPublicSector: e.target.checked })
                                }
                                className="w-5 h-5 rounded border-slate-300 text-cyan-600 focus:ring-4 focus:ring-cyan-300 transition-all cursor-pointer"
                            />
                            <span className="text-sm font-semibold text-slate-700 group-hover:text-cyan-700 transition-colors">
                                {t('form.labelPublicSector')}
                            </span>
                        </label>
                    </div>

                    {/* Submit Error */}
                    {errors.submit && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 text-sm font-medium">{errors.submit}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                            disabled={isSubmitting}
                        >
                            {t('actions.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? tCommon('message.loading') : t('actions.add')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
