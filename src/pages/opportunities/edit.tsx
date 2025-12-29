import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOpportunities } from '../../stores/OpportunitiesStore';
import { useCustomers } from '../../stores/CustomerStore';
import type { Opportunity } from '../../types';
import { calculateRaiseLevel } from '../../lib/raiseLogic';
import { ArrowLeft, Save, Building2, DollarSign, Briefcase, AlertCircle, Lock, Plus } from 'lucide-react';
import { showToast } from '../../lib/toast';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { FormField } from '../../components/common/FormField';
import { ErrorSummary } from '../../components/common/ErrorSummary';
import { QuickAddCustomerModal } from '../../components/opportunities/QuickAddCustomerModal';
import { useTranslation } from 'react-i18next';

export const EditOpportunityPage = () => {
    const { t } = useTranslation('opportunities');
    const { t: tCommon } = useTranslation('common');
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { opportunities, updateOpportunity } = useOpportunities();
    const { customers } = useCustomers();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);

    const existingOpp = opportunities.find(o => o.id === id);

    const [formData, setFormData] = useState({
        title: '',
        customerId: '',
        tcv: '',
        raiseTcv: '',
        isRti: false,
        isMandataria: false,
        hasKcpDeviations: false,
        isNewCustomer: false,
        marginPercent: '20',
    });

    // Get selected customer details
    const selectedCustomer = customers.find(c => c.id === formData.customerId);

    const [formErrors, setFormErrors] = useState<Array<{ field: string; message: string }>>([]);

    const [fieldErrors, setFieldErrors] = useState({
        title: '',
        customerId: '',
        tcv: '',
    });

    const [touched, setTouched] = useState({
        title: false,
        customerId: false,
        tcv: false,
    });

    // Validation functions
    const validateTitle = useCallback((value: string) => {
        if (!value.trim()) return t('validation.titleRequired');
        if (value.length < 3) return t('validation.titleMinLength');
        if (value.length > 200) return 'Il titolo è troppo lungo (max 200 caratteri)';
        return '';
    }, [t]);

    const validateCustomerId = useCallback((value: string) => {
        if (!value) return t('validation.customerRequired');
        return '';
    }, [t]);

    const validateTcv = useCallback((value: string) => {
        const num = parseFloat(value);
        if (!value || isNaN(num)) return t('validation.tcvRequired');
        if (num <= 0) return t('validation.tcvPositive');
        if (num > 1000000000) return 'Il TCV supera il limite massimo';
        return '';
    }, [t]);

    const handleBlur = (field: 'title' | 'customerId' | 'tcv') => {
        setTouched(prev => ({ ...prev, [field]: true }));

        let error = '';
        if (field === 'title') error = validateTitle(formData.title);
        if (field === 'customerId') error = validateCustomerId(formData.customerId);
        if (field === 'tcv') error = validateTcv(formData.tcv);

        setFieldErrors(prev => ({ ...prev, [field]: error }));
    };

    const handleCustomerCreated = (customerId: string) => {
        // Auto-select the newly created customer
        setFormData({ ...formData, customerId });
        // Clear any customer selection error
        setFieldErrors(prev => ({ ...prev, customerId: '' }));
    };

    // Load existing opportunity data
    useEffect(() => {
        if (existingOpp) {
            // Find customer by ID if available, otherwise try to match by name
            let customerId = existingOpp.customerId || '';
            if (!customerId && existingOpp.clientName) {
                const matchedCustomer = customers.find(
                    c => c.name.toLowerCase() === existingOpp.clientName?.toLowerCase()
                );
                customerId = matchedCustomer?.id || '';
            }

            setFormData({
                title: existingOpp.title,
                customerId,
                tcv: existingOpp.tcv.toString(),
                raiseTcv: existingOpp.raiseTcv.toString(),
                isRti: existingOpp.isRti,
                isMandataria: existingOpp.isMandataria || false,
                hasKcpDeviations: existingOpp.hasKcpDeviations,
                isNewCustomer: existingOpp.isNewCustomer || false,
                marginPercent: (existingOpp.marginPercent || 20).toString(),
            });
        }
    }, [existingOpp, customers]);

    // If opportunity not found, show error
    if (!existingOpp) {
        return (
            <div className="animate-slide-up space-y-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/opportunities')}
                        className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 hover:text-slate-900"
                    >
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900">{t('edit.notFoundTitle')}</h1>
                </div>
                <div className="card-elevated p-12 text-center">
                    <AlertCircle size={48} className="mx-auto text-amber-500 mb-4" />
                    <p className="text-slate-600 text-lg mb-6">
                        {t('edit.notFoundMessage').replace('{{id}}', id || '')}
                    </p>
                    <button
                        onClick={() => navigate('/opportunities')}
                        className="btn-primary"
                    >
                        {t('edit.backToList')}
                    </button>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate all fields
        const titleError = validateTitle(formData.title);
        const customerIdError = validateCustomerId(formData.customerId);
        const tcvError = validateTcv(formData.tcv);

        setFieldErrors({
            title: titleError,
            customerId: customerIdError,
            tcv: tcvError,
        });

        setTouched({
            title: true,
            customerId: true,
            tcv: true,
        });

        // Collect errors for summary
        const errors: Array<{ field: string; message: string }> = [];
        if (titleError) errors.push({ field: 'title', message: titleError });
        if (customerIdError) errors.push({ field: 'Customer', message: customerIdError });
        if (tcvError) errors.push({ field: 'tcv', message: tcvError });

        setFormErrors(errors);

        // Stop if there are validation errors
        if (errors.length > 0) {
            showToast.error('Correggi gli errori nel form prima di continuare');
            return;
        }

        setIsSubmitting(true);

        try {
            const tcvValue = parseFloat(formData.tcv);
            const raiseTcvValue = parseFloat(formData.raiseTcv) || tcvValue;
            const marginValue = parseFloat(formData.marginPercent);

            // Simulate async operation
            await new Promise(resolve => setTimeout(resolve, 500));

            const updatedOpp: Opportunity = {
                ...existingOpp,
                title: formData.title,
                customerId: formData.customerId,
                tcv: tcvValue,
                raiseTcv: raiseTcvValue,
                hasKcpDeviations: formData.hasKcpDeviations,
                isFastTrack: tcvValue < 250000 && !formData.hasKcpDeviations,
                isRti: formData.isRti,
                isMandataria: formData.isMandataria,
                isPublicSector: selectedCustomer?.isPublicSector || false,
                marginPercent: marginValue,
                isNewCustomer: formData.isNewCustomer,
            };

            // Recalculate the RAISE level based on updated values
            updatedOpp.raiseLevel = calculateRaiseLevel(updatedOpp);

            updateOpportunity(updatedOpp);
            showToast.success('Modifiche salvate con successo!');
            navigate(`/opportunity/${updatedOpp.id}`);
        } catch (error) {
            showToast.error('Errore durante il salvataggio. Controlla i dati inseriti.');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="animate-slide-up space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(`/opportunity/${existingOpp.id}`)}
                    className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 hover:text-slate-900"
                >
                    <ArrowLeft size={20} strokeWidth={2.5} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gradient-primary">{t('edit.title')}</h1>
                    <p className="text-slate-500 mt-1">{t('edit.subtitle').replace('{{id}}', existingOpp.id)}</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="card-elevated p-8 space-y-6">
                {/* Error Summary */}
                {formErrors.length > 0 && <ErrorSummary errors={formErrors} />}

                {/* Basic Info Section */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Building2 size={20} className="text-cyan-600" />
                        {t('edit.sectionBasicInfo')}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            id="title"
                            name="title"
                            label={t('form.labelTitle')}
                            type="text"
                            value={formData.title}
                            onChange={(value) => setFormData({ ...formData, title: value as string })}
                            onBlur={() => handleBlur('title')}
                            error={touched.title ? fieldErrors.title : ''}
                            required
                            placeholder={t('form.placeholderTitle')}
                            helpText="Inserisci un titolo descrittivo per l'opportunità"
                        />

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                {t('form.labelCustomer')} *
                            </label>
                            <div className="flex gap-2">
                                <select
                                    value={formData.customerId}
                                    onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                                    onBlur={() => handleBlur('customerId')}
                                    className={`flex-1 px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all ${
                                        touched.customerId && fieldErrors.customerId
                                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                            : 'border-slate-200'
                                    }`}
                                >
                                    <option value="">Select Customer...</option>
                                    {customers
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))
                                    }
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setIsQuickAddModalOpen(true)}
                                    className="px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
                                    title={t('form.quickAddCustomer')}
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                            {touched.customerId && fieldErrors.customerId && (
                                <p className="mt-1 text-sm text-red-600">{fieldErrors.customerId}</p>
                            )}
                            <p className="text-xs text-slate-500 mt-1">Select existing customer or quick add new</p>
                        </div>

                        {selectedCustomer && (
                            <>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Industry
                                    </label>
                                    <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl">
                                        <Lock size={16} className="text-slate-400" />
                                        <span className="text-slate-900">{selectedCustomer.industry}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Auto-filled from customer</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Public Sector
                                    </label>
                                    <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl">
                                        <Lock size={16} className="text-slate-400" />
                                        <span className="text-slate-900">{selectedCustomer.isPublicSector ? 'Yes' : 'No'}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Auto-filled from customer</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Financial Info Section */}
                <div className="space-y-4 pt-6 border-t border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <DollarSign size={20} className="text-emerald-600" />
                        {t('edit.sectionFinancialDetails')}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                            id="tcv"
                            name="tcv"
                            label={t('form.labelTcv')}
                            type="number"
                            value={formData.tcv}
                            onChange={(value) => setFormData({ ...formData, tcv: value.toString() })}
                            onBlur={() => handleBlur('tcv')}
                            error={touched.tcv ? fieldErrors.tcv : ''}
                            required
                            placeholder={t('form.placeholderTcv')}
                            helpText="Total Contract Value (committed)"
                        />

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                {t('form.labelRaiseTcv')}
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="1000"
                                value={formData.raiseTcv}
                                onChange={e => setFormData({ ...formData, raiseTcv: e.target.value })}
                                placeholder={t('form.placeholderRaiseTcv')}
                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
                            />
                            <p className="text-xs text-slate-500 mt-1">Include parti opzionali</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                {t('form.labelMargin')}
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={formData.marginPercent}
                                onChange={e => setFormData({ ...formData, marginPercent: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Flags Section */}
                <div className="space-y-4 pt-6 border-t border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Briefcase size={20} className="text-indigo-600" />
                        {t('edit.sectionFlags')}
                    </h2>

                    {/* Public Sector is now auto-filled from customer selection */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl hover:border-cyan-300 cursor-pointer transition-colors">
                            <input
                                type="checkbox"
                                checked={formData.isRti}
                                onChange={e => setFormData({ ...formData, isRti: e.target.checked })}
                                className="w-5 h-5 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500"
                            />
                            <div>
                                <div className="font-semibold text-slate-900">{t('form.flagRti')}</div>
                                <div className="text-xs text-slate-500">Raggruppamento Temporaneo Imprese</div>
                            </div>
                        </label>

                        {formData.isRti && (
                            <label className="flex items-center gap-3 p-4 border-2 border-cyan-200 bg-cyan-50 rounded-xl cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isMandataria}
                                    onChange={e => setFormData({ ...formData, isMandataria: e.target.checked })}
                                    className="w-5 h-5 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500"
                                />
                                <div>
                                    <div className="font-semibold text-cyan-900">{t('form.flagMandataria')}</div>
                                    <div className="text-xs text-cyan-700">Lutech è la capofila</div>
                                </div>
                            </label>
                        )}

                        <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl hover:border-amber-300 cursor-pointer transition-colors">
                            <input
                                type="checkbox"
                                checked={formData.hasKcpDeviations}
                                onChange={e => setFormData({ ...formData, hasKcpDeviations: e.target.checked })}
                                className="w-5 h-5 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
                            />
                            <div>
                                <div className="font-semibold text-slate-900">{t('form.flagKcp')}</div>
                                <div className="text-xs text-slate-500">Problemi con Key Control Points</div>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl hover:border-cyan-300 cursor-pointer transition-colors">
                            <input
                                type="checkbox"
                                checked={formData.isNewCustomer}
                                onChange={e => setFormData({ ...formData, isNewCustomer: e.target.checked })}
                                className="w-5 h-5 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500"
                            />
                            <div>
                                <div className="font-semibold text-slate-900">{t('form.flagNewCustomer')}</div>
                                <div className="text-xs text-slate-500">Primo engagement con il cliente</div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                    <button
                        type="button"
                        onClick={() => navigate(`/opportunity/${existingOpp.id}`)}
                        disabled={isSubmitting}
                        className="px-6 py-3 text-slate-700 font-semibold rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t('actions.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                            isSubmitting
                                ? 'bg-slate-400 cursor-not-allowed text-white'
                                : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:scale-105'
                        }`}
                    >
                        {isSubmitting ? (
                            <>
                                <LoadingSpinner size={20} className="text-white" />
                                Salvataggio...
                            </>
                        ) : (
                            <>
                                <Save size={18} strokeWidth={2.5} />
                                {t('actions.save')}
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Quick Add Customer Modal */}
            <QuickAddCustomerModal
                isOpen={isQuickAddModalOpen}
                onClose={() => setIsQuickAddModalOpen(false)}
                onCustomerCreated={handleCustomerCreated}
            />
        </div>
    );
};
