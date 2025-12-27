import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOpportunities } from '../../stores/OpportunitiesStore';
import type { Opportunity } from '../../types';
import { calculateRaiseLevel } from '../../lib/raiseLogic';
import { ArrowLeft, Save, Building2, DollarSign, Briefcase } from 'lucide-react';
import { showToast } from '../../lib/toast';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { FormField } from '../../components/common/FormField';
import { ErrorSummary } from '../../components/common/ErrorSummary';

export const NewOpportunityPage = () => {
    const navigate = useNavigate();
    const { addOpportunity, selectOpportunity } = useOpportunities();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<Array<{ field: string; message: string }>>([]);

    const [formData, setFormData] = useState({
        title: '',
        clientName: '',
        tcv: '',
        raiseTcv: '',
        industry: 'Technology',
        isPublicSector: false,
        isRti: false,
        isMandataria: false,
        hasKcpDeviations: false,
        isNewCustomer: false,
        marginPercent: '20',
    });

    // Field-level errors
    const [fieldErrors, setFieldErrors] = useState({
        title: '',
        clientName: '',
        tcv: '',
    });

    const [touched, setTouched] = useState({
        title: false,
        clientName: false,
        tcv: false,
    });

    // Validation functions
    const validateTitle = useCallback((value: string) => {
        if (!value.trim()) return 'Il titolo è obbligatorio';
        if (value.length < 3) return 'Il titolo deve contenere almeno 3 caratteri';
        if (value.length > 200) return 'Il titolo è troppo lungo (max 200 caratteri)';
        return '';
    }, []);

    const validateClientName = useCallback((value: string) => {
        if (!value.trim()) return 'Il nome del cliente è obbligatorio';
        if (value.length < 2) return 'Il nome deve contenere almeno 2 caratteri';
        return '';
    }, []);

    const validateTcv = useCallback((value: string) => {
        const num = parseFloat(value);
        if (!value || isNaN(num)) return 'Il TCV è obbligatorio';
        if (num <= 0) return 'Il TCV deve essere maggiore di zero';
        if (num > 1000000000) return 'Il TCV supera il limite massimo';
        return '';
    }, []);

    const handleBlur = (field: 'title' | 'clientName' | 'tcv') => {
        setTouched(prev => ({ ...prev, [field]: true }));

        let error = '';
        if (field === 'title') error = validateTitle(formData.title);
        if (field === 'clientName') error = validateClientName(formData.clientName);
        if (field === 'tcv') error = validateTcv(formData.tcv);

        setFieldErrors(prev => ({ ...prev, [field]: error }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate all fields
        const titleError = validateTitle(formData.title);
        const clientNameError = validateClientName(formData.clientName);
        const tcvError = validateTcv(formData.tcv);

        setFieldErrors({
            title: titleError,
            clientName: clientNameError,
            tcv: tcvError,
        });

        setTouched({
            title: true,
            clientName: true,
            tcv: true,
        });

        // Collect errors for summary
        const errors: Array<{ field: string; message: string }> = [];
        if (titleError) errors.push({ field: 'title', message: titleError });
        if (clientNameError) errors.push({ field: 'clientName', message: clientNameError });
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

            const newOpp: Opportunity = {
                id: `OPP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
                title: formData.title,
                clientName: formData.clientName,
                tcv: tcvValue,
                raiseTcv: raiseTcvValue,
                industry: formData.industry,
                currentPhase: 'Planning',
                hasKcpDeviations: formData.hasKcpDeviations,
                isFastTrack: tcvValue < 250000 && !formData.hasKcpDeviations,
                isRti: formData.isRti,
                isMandataria: formData.isMandataria,
                isPublicSector: formData.isPublicSector,
                raiseLevel: 'L6', // Temporary, will be calculated next
                deviations: [],
                checkpoints: {},
                marginPercent: marginValue,
                cashFlowNeutral: true,
                isNewCustomer: formData.isNewCustomer,
            };

            // Calculate the correct RAISE level based on TCV and other factors
            newOpp.raiseLevel = calculateRaiseLevel(newOpp);

            addOpportunity(newOpp);
            selectOpportunity(newOpp);
            showToast.success('Opportunità creata con successo!');
            navigate(`/opportunity/${newOpp.id}`);
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
                    <h1 className="text-3xl font-bold text-gradient-primary">New Opportunity</h1>
                    <p className="text-slate-500 mt-1">Create a new RAISE workflow opportunity</p>
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
                        Basic Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            id="title"
                            name="title"
                            label="Opportunity Title"
                            type="text"
                            value={formData.title}
                            onChange={(value) => setFormData({ ...formData, title: value as string })}
                            onBlur={() => handleBlur('title')}
                            error={touched.title ? fieldErrors.title : ''}
                            required
                            placeholder="e.g., Cloud Migration Project"
                            helpText="Inserisci un titolo descrittivo per l'opportunità"
                        />

                        <FormField
                            id="clientName"
                            name="clientName"
                            label="Client Name"
                            type="text"
                            value={formData.clientName}
                            onChange={(value) => setFormData({ ...formData, clientName: value as string })}
                            onBlur={() => handleBlur('clientName')}
                            error={touched.clientName ? fieldErrors.clientName : ''}
                            required
                            placeholder="e.g., Acme Corporation"
                            helpText="Nome dell'azienda o ente cliente"
                        />

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Industry *
                            </label>
                            <select
                                value={formData.industry}
                                onChange={e => setFormData({ ...formData, industry: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
                            >
                                <option value="Technology">Technology</option>
                                <option value="Finance">Finance</option>
                                <option value="Healthcare">Healthcare</option>
                                <option value="Manufacturing">Manufacturing</option>
                                <option value="Retail">Retail</option>
                                <option value="Public Sector">Public Sector</option>
                                <option value="Energy">Energy</option>
                                <option value="Telecommunications">Telecommunications</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Financial Info Section */}
                <div className="space-y-4 pt-6 border-t border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <DollarSign size={20} className="text-emerald-600" />
                        Financial Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                            id="tcv"
                            name="tcv"
                            label="TCV (€)"
                            type="number"
                            value={formData.tcv}
                            onChange={(value) => setFormData({ ...formData, tcv: value.toString() })}
                            onBlur={() => handleBlur('tcv')}
                            error={touched.tcv ? fieldErrors.tcv : ''}
                            required
                            placeholder="1000000"
                            helpText="Total Contract Value (committed)"
                        />

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                RAISE TCV (€)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="1000"
                                value={formData.raiseTcv}
                                onChange={e => setFormData({ ...formData, raiseTcv: e.target.value })}
                                placeholder="Same as TCV if empty"
                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
                            />
                            <p className="text-xs text-slate-500 mt-1">Includes optional parts</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Margin (%)
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
                        Opportunity Flags
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl hover:border-cyan-300 cursor-pointer transition-colors">
                            <input
                                type="checkbox"
                                checked={formData.isPublicSector}
                                onChange={e => setFormData({ ...formData, isPublicSector: e.target.checked })}
                                className="w-5 h-5 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500"
                            />
                            <div>
                                <div className="font-semibold text-slate-900">Public Sector</div>
                                <div className="text-xs text-slate-500">Government or public entity</div>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl hover:border-cyan-300 cursor-pointer transition-colors">
                            <input
                                type="checkbox"
                                checked={formData.isRti}
                                onChange={e => setFormData({ ...formData, isRti: e.target.checked })}
                                className="w-5 h-5 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500"
                            />
                            <div>
                                <div className="font-semibold text-slate-900">RTI (Joint Venture)</div>
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
                                    <div className="font-semibold text-cyan-900">Mandataria</div>
                                    <div className="text-xs text-cyan-700">Lutech is leading mandatory</div>
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
                                <div className="font-semibold text-slate-900">KCP Deviations</div>
                                <div className="text-xs text-slate-500">Key Control Points issues</div>
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
                                <div className="font-semibold text-slate-900">New Customer</div>
                                <div className="text-xs text-slate-500">First engagement with client</div>
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
                        Cancel
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
                                Create Opportunity
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
