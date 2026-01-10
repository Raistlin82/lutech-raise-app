import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOpportunities } from '../../stores/OpportunitiesStore';
import { useCustomers } from '../../stores/CustomerStore';
import { useUserEmail } from '@/hooks/useUserEmail';
import type { Opportunity, Lot } from '../../types';
import { calculateRaiseLevel } from '../../lib/raiseLogic';
import { ArrowLeft, Save, Building2, DollarSign, Briefcase, Lock, Plus, Trash2, Layers } from 'lucide-react';
import { showToast } from '../../lib/toast';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { FormField } from '../../components/common/FormField';
import { ErrorSummary } from '../../components/common/ErrorSummary';
import { QuickAddCustomerModal } from '../../components/opportunities/QuickAddCustomerModal';
import { useTranslation } from 'react-i18next';

export const NewOpportunityPage = () => {
    const { t } = useTranslation('opportunities');
    const navigate = useNavigate();
    const userEmail = useUserEmail();
    const { addOpportunity, selectOpportunity } = useOpportunities();
    const { customers } = useCustomers();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<Array<{ field: string; message: string }>>([]);
    const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);

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

    // Multi-Lot State
    const [isMultiLot, setIsMultiLot] = useState(false);
    const [areLotsMutuallyExclusive, setAreLotsMutuallyExclusive] = useState(false);
    const [lots, setLots] = useState<Array<{ id: string; name: string; tcv: string; raiseTcv: string; marginPercent: string }>>([
        { id: '1', name: 'Lotto 1', tcv: '', raiseTcv: '', marginPercent: '20' }
    ]);

    const addLot = () => {
        setLots(prev => [
            ...prev,
            { id: Date.now().toString(), name: `Lotto ${prev.length + 1}`, tcv: '', raiseTcv: '', marginPercent: '20' }
        ]);
    };

    const removeLot = (id: string) => {
        if (lots.length <= 1) return;
        setLots(prev => prev.filter(l => l.id !== id));
    };

    const updateLot = (id: string, field: string, value: string) => {
        setLots(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
    };

    // Get selected customer details
    const selectedCustomer = customers.find(c => c.id === formData.customerId);

    // Field-level errors
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Check user authentication first
        if (!userEmail) {
            showToast.error('User not authenticated. Please log in to create opportunities.');
            return;
        }

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
        if (customerIdError) errors.push({ field: 'customerId', message: customerIdError });
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

            // Multi-Lot Logic
            let finalTcv = tcvValue;
            let finalRaiseTcv = raiseTcvValue;
            let finalMargin = marginValue;
            let finalLots: Lot[] = [];

            if (isMultiLot) {
                // Convert UI lots to Domain lots
                finalLots = lots.map(l => ({
                    id: l.id,
                    name: l.name,
                    tcv: parseFloat(l.tcv) || 0,
                    raiseTcv: parseFloat(l.raiseTcv) || parseFloat(l.tcv) || 0,
                    marginPercent: parseFloat(l.marginPercent) || 0,
                    description: ''
                }));

                // Find Main Lot (highest Value)
                const mainLot = finalLots.reduce((prev, current) =>
                    (current.raiseTcv > prev.raiseTcv) ? current : prev
                );

                // Overwrite top-level values with Main Lot values
                finalTcv = mainLot.tcv;
                finalRaiseTcv = mainLot.raiseTcv;
                finalMargin = mainLot.marginPercent;
            }

            const newOpp: Opportunity = {
                id: `OPP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
                title: formData.title,
                customerId: formData.customerId,
                tcv: finalTcv,
                raiseTcv: finalRaiseTcv,
                isMultiLot,
                areLotsMutuallyExclusive,
                lots: isMultiLot ? finalLots : undefined, // Only save lots if enabled
                currentPhase: 'Planning',
                hasKcpDeviations: formData.hasKcpDeviations,
                isFastTrack: tcvValue < 250000 && !formData.hasKcpDeviations,
                isRti: formData.isRti,
                isMandataria: formData.isMandataria,
                isPublicSector: selectedCustomer?.isPublicSector || false,
                raiseLevel: 'L6', // Temporary, will be calculated next
                deviations: [],
                checkpoints: {},

                marginPercent: finalMargin,
                cashFlowNeutral: true,
                isNewCustomer: formData.isNewCustomer,
                createdByEmail: userEmail,
            };

            // Calculate the correct RAISE level based on TCV and other factors
            newOpp.raiseLevel = calculateRaiseLevel(newOpp);

            const createdOpp = await addOpportunity(newOpp, userEmail);
            selectOpportunity(createdOpp);
            navigate(`/opportunity/${createdOpp.id}`);
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
                    onClick={() => navigate('/opportunities')}
                    className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 hover:text-slate-900"
                >
                    <ArrowLeft size={20} strokeWidth={2.5} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gradient-primary">{t('new.title')}</h1>
                    <p className="text-slate-500 mt-1">{t('new.subtitle')}</p>
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
                        {t('new.sectionBasicInfo')}
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
                                    className={`flex-1 px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all ${touched.customerId && fieldErrors.customerId
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                        : 'border-slate-200'
                                        }`}
                                >
                                    <option value="">{t('form.placeholderCustomer')}</option>
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
                                        <span className="text-slate-700">{selectedCustomer.industry}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Auto-filled from customer</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Public Sector
                                    </label>
                                    <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl">
                                        <Lock size={16} className="text-slate-400" />
                                        <span className="text-slate-700">{selectedCustomer.isPublicSector ? 'Yes' : 'No'}</span>
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
                        {t('new.sectionFinancialDetails')}
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

                {/* Multi-Lot Toggle Section */}
                <div className="space-y-4 pt-6 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Layers size={20} className="text-purple-600" />
                            Gestione Lotti
                        </h2>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={isMultiLot}
                                    onChange={e => setIsMultiLot(e.target.checked)}
                                />
                                <div className={`block w-14 h-8 rounded-full transition-colors ${isMultiLot ? 'bg-purple-600' : 'bg-slate-300'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isMultiLot ? 'translate-x-6' : ''}`}></div>
                            </div>
                            <span className="font-medium text-slate-700">Abilita Multi-Lotto</span>
                        </label>
                    </div>

                    {isMultiLot && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mb-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={areLotsMutuallyExclusive}
                                        onChange={e => setAreLotsMutuallyExclusive(e.target.checked)}
                                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                    />
                                    <div>
                                        <div className="font-semibold text-purple-900">Lotti Mutualmente Esclusivi</div>
                                        <div className="text-sm text-purple-700">L'aggiudicazione di un lotto esclude gli altri</div>
                                    </div>
                                </label>
                            </div>

                            <div className="space-y-3">
                                {lots.map((lot, index) => (
                                    <div key={lot.id} className="p-4 border-2 border-slate-200 rounded-xl bg-white hover:border-purple-200 transition-colors">
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="font-bold text-slate-700">Lotto {index + 1}</h3>
                                            {lots.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeLot(lot.id)}
                                                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                            <div className="md:col-span-1">
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">Nome Lotto</label>
                                                <input
                                                    type="text"
                                                    value={lot.name}
                                                    onChange={e => updateLot(lot.id, 'name', e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                                    placeholder="Es. Lotto 1"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">TCV</label>
                                                <input
                                                    type="number"
                                                    value={lot.tcv}
                                                    onChange={e => updateLot(lot.id, 'tcv', e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                                    placeholder="Valore"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">RAISE TCV</label>
                                                <input
                                                    type="number"
                                                    value={lot.raiseTcv}
                                                    onChange={e => updateLot(lot.id, 'raiseTcv', e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                                    placeholder="Inc. Opzioni"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">Margine %</label>
                                                <input
                                                    type="number"
                                                    value={lot.marginPercent}
                                                    onChange={e => updateLot(lot.id, 'marginPercent', e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={addLot}
                                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center gap-2 font-semibold"
                            >
                                <Plus size={20} />
                                Aggiungi Lotto
                            </button>
                        </div>
                    )}
                </div>

                {/* Flags Section */}
                <div className="space-y-4 pt-6 border-t border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Briefcase size={20} className="text-indigo-600" />
                        {t('new.sectionFlags')}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Public Sector is now auto-filled from customer selection */}

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
                        onClick={() => navigate('/opportunities')}
                        disabled={isSubmitting}
                        className="px-6 py-3 text-slate-700 font-semibold rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t('actions.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${isSubmitting
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
                                {t('actions.create')}
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
