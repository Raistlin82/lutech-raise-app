import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../stores/SettingsStore';
import type { ControlConfig, RaiseLevel, AuthorizationMatrixConfig, AuthorizationLevel, WorkflowType, ExpertInvolvementConfig, ExpertConfig, ExpertFunction, FinancialTargetsConfig, FinancialTarget, FinancialTargetCategory, UnderMarginConfig, MarginThreshold, MarginType } from '../../types';
import { Plus, Trash2, Edit2, Eye, RotateCcw, Save, X, Filter, XCircle, Settings2, Database, Check, Shield, Users, Mail, Target, DollarSign, Percent, TrendingDown } from 'lucide-react';
import { clsx } from 'clsx';
import { DataMigrationPanel } from './DataMigrationPanel';
import {
    getAuthorizationMatrix,
    saveAuthorizationMatrix,
    resetAuthorizationMatrix,
    DEFAULT_AUTHORIZATION_MATRIX
} from '../../services/authorizationMatrixService';
import {
    getExpertInvolvement,
    saveExpertInvolvement,
    resetExpertInvolvement,
    DEFAULT_EXPERT_INVOLVEMENT
} from '../../services/expertInvolvementService';
import {
    getFinancialTargets,
    saveFinancialTargets,
    resetFinancialTargets,
    DEFAULT_FINANCIAL_TARGETS,
    getCategoryDisplayName
} from '../../services/financialTargetsService';
import {
    getUnderMarginConfig,
    saveUnderMarginConfig,
    resetUnderMarginConfig,
    DEFAULT_UNDER_MARGIN,
    getMarginTypeDisplayName
} from '../../services/underMarginService';

const PHASES = ['Planning', 'ATP', 'ATS', 'ATC', 'Handover'] as const;
const LEVELS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'] as const;
const WORKFLOW_TYPES: WorkflowType[] = ['Classic', 'Simplified', 'FastTrack'];

// Helper function to extract RAISE levels from condition string
const extractRaiseLevels = (condition?: string): RaiseLevel[] | 'ALL' => {
    if (!condition || condition.trim() === '') return 'ALL';

    const levels: RaiseLevel[] = [];
    const levelPattern = /raiseLevel\s*===\s*["']?(L[1-6])["']?/g;
    let match;

    while ((match = levelPattern.exec(condition)) !== null) {
        const level = match[1] as RaiseLevel;
        if (!levels.includes(level)) {
            levels.push(level);
        }
    }

    return levels.length > 0 ? levels.sort() : 'ALL';
};

type TabType = 'controls' | 'data' | 'authorization' | 'experts' | 'financial' | 'margins';

export const Settings = () => {
    const { t } = useTranslation('settings');
    const { controls, addControl, updateControl, deleteControl, resetDefaults } = useSettings();
    const [activeTab, setActiveTab] = useState<TabType>('controls');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingControl, setEditingControl] = useState<ControlConfig | null>(null);
    const [viewingControl, setViewingControl] = useState<ControlConfig | null>(null);
    const [phaseFilter, setPhaseFilter] = useState<string>('');
    const [levelFilter, setLevelFilter] = useState<string>('');

    // Filter controls based on selected filters
    const filteredControls = useMemo(() => {
        return controls.filter(control => {
            // Phase filter
            if (phaseFilter && control.phase !== phaseFilter) {
                return false;
            }

            // Level filter
            if (levelFilter) {
                const controlLevels = extractRaiseLevels(control.condition);
                if (controlLevels === 'ALL') {
                    // 'ALL' matches any level filter
                    return true;
                }
                if (!controlLevels.includes(levelFilter as RaiseLevel)) {
                    return false;
                }
            }

            return true;
        });
    }, [controls, phaseFilter, levelFilter]);

    const hasActiveFilters = phaseFilter || levelFilter;

    const clearFilters = () => {
        setPhaseFilter('');
        setLevelFilter('');
    };

    const handleSave = (control: ControlConfig) => {
        if (editingControl) {
            updateControl(control);
        } else {
            addControl({ ...control, id: `custom-${Date.now()}` });
        }
        setIsModalOpen(false);
        setEditingControl(null);
    };

    const openView = (control: ControlConfig) => {
        setViewingControl(control);
        setIsViewModalOpen(true);
    };

    const openEdit = (control: ControlConfig) => {
        setEditingControl(control);
        setIsModalOpen(true);
    };

    const openNew = () => {
        setEditingControl(null);
        setIsModalOpen(true);
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
                    <p className="text-slate-500">{t('subtitle')}</p>
                </div>
                {activeTab === 'controls' && (
                    <div className="flex gap-2">
                        <button onClick={resetDefaults} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 flex items-center gap-2">
                            <RotateCcw size={16} /> {t('controls.resetDefaults')}
                        </button>
                        <button onClick={openNew} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-500/30">
                            <Plus size={16} /> {t('controls.addControl')}
                        </button>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('controls')}
                    className={clsx(
                        'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                        activeTab === 'controls'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                    )}
                >
                    <Settings2 size={16} />
                    {t('tabs.controls')}
                </button>
                <button
                    onClick={() => setActiveTab('data')}
                    className={clsx(
                        'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                        activeTab === 'data'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                    )}
                >
                    <Database size={16} />
                    {t('tabs.data')}
                </button>
                <button
                    onClick={() => setActiveTab('authorization')}
                    className={clsx(
                        'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                        activeTab === 'authorization'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                    )}
                >
                    <Shield size={16} />
                    Matrice Autorizzativa
                </button>
                <button
                    onClick={() => setActiveTab('experts')}
                    className={clsx(
                        'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                        activeTab === 'experts'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                    )}
                >
                    <Users size={16} />
                    Coinvolgimento Expert
                </button>
                <button
                    onClick={() => setActiveTab('financial')}
                    className={clsx(
                        'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                        activeTab === 'financial'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                    )}
                >
                    <Target size={16} />
                    Target Finanziari
                </button>
                <button
                    onClick={() => setActiveTab('margins')}
                    className={clsx(
                        'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                        activeTab === 'margins'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                    )}
                >
                    <Percent size={16} />
                    Under-margin
                </button>
            </div>

            {activeTab === 'data' && <DataMigrationPanel />}

            {activeTab === 'authorization' && <AuthorizationMatrixPanel />}

            {activeTab === 'experts' && <ExpertInvolvementPanel />}

            {activeTab === 'financial' && <FinancialTargetsPanel />}

            {activeTab === 'margins' && <UnderMarginPanel />}

            {activeTab === 'controls' && (
                <>
                    {/* Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 text-slate-500">
                                <Filter size={18} />
                                <span className="font-medium text-sm">Filtri:</span>
                            </div>

                            {/* Phase Filter */}
                            <div className="flex items-center gap-2">
                                <label htmlFor="phase-filter" className="text-sm text-slate-600">
                                    {t('controls.filters.phase')}:
                                </label>
                                <select
                                    id="phase-filter"
                                    value={phaseFilter}
                                    onChange={(e) => setPhaseFilter(e.target.value)}
                                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">{t('controls.filters.allPhases')}</option>
                                    {PHASES.map(phase => (
                                        <option key={phase} value={phase}>{phase}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Level Filter */}
                            <div className="flex items-center gap-2">
                                <label htmlFor="level-filter" className="text-sm text-slate-600">
                                    {t('controls.filters.level')}:
                                </label>
                                <select
                                    id="level-filter"
                                    value={levelFilter}
                                    onChange={(e) => setLevelFilter(e.target.value)}
                                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">{t('controls.filters.allLevels')}</option>
                                    {LEVELS.map(level => (
                                        <option key={level} value={level}>{level}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Clear Filters Button */}
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <XCircle size={16} />
                                    {t('controls.filters.clearFilters')}
                                </button>
                            )}

                            {/* Results count */}
                            <div className="ml-auto text-sm text-slate-500">
                                {t('controls.filters.showing')} <span className="font-bold text-slate-700">{filteredControls.length}</span> {t('controls.filters.of')} <span className="font-bold text-slate-700">{controls.length}</span> {t('controls.filters.controls')}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-4 font-semibold text-slate-700 text-center w-16">#</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">{t('controls.tableHeaders.phase')}</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">{t('controls.tableHeaders.raiseLevels')}</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">{t('controls.tableHeaders.label')}</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">{t('controls.tableHeaders.description')}</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-center">{t('controls.tableHeaders.mandatory')}</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-right">{t('controls.tableHeaders.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredControls
                                    .sort((a, b) => {
                                        // Sort by phase order, then by control order
                                        const phaseOrder = { 'Planning': 1, 'ATP': 2, 'ATS': 3, 'ATC': 4, 'Handover': 5, 'ALL': 6 };
                                        const phaseA = phaseOrder[a.phase as keyof typeof phaseOrder] || 99;
                                        const phaseB = phaseOrder[b.phase as keyof typeof phaseOrder] || 99;
                                        if (phaseA !== phaseB) return phaseA - phaseB;
                                        return (a.order || 0) - (b.order || 0);
                                    })
                                    .map((control) => {
                                        const raiseLevels = extractRaiseLevels(control.condition);
                                        return (
                                            <tr key={control.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-3 text-center">
                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                                                        {control.order || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className={clsx(
                                                        "px-2 py-1 rounded text-xs font-medium",
                                                        {
                                                            "bg-blue-50 text-blue-600": control.phase === 'Planning',
                                                            "bg-indigo-50 text-indigo-600": control.phase === 'ATP',
                                                            "bg-purple-50 text-purple-600": control.phase === 'ATS',
                                                            "bg-emerald-50 text-emerald-600": control.phase === 'ATC',
                                                            "bg-slate-100 text-slate-600": control.phase === 'Handover',
                                                            "bg-amber-50 text-amber-700": control.phase === 'ALL',
                                                        }
                                                    )}>
                                                        {control.phase}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    {raiseLevels === 'ALL' ? (
                                                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                                                            ALL
                                                        </span>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-1">
                                                            {raiseLevels.map(level => (
                                                                <span key={level} className={clsx(
                                                                    "px-1.5 py-0.5 rounded text-xs font-bold",
                                                                    {
                                                                        "bg-red-100 text-red-700 border border-red-200": level === 'L1',
                                                                        "bg-orange-100 text-orange-700 border border-orange-200": level === 'L2',
                                                                        "bg-amber-100 text-amber-700 border border-amber-200": level === 'L3',
                                                                        "bg-yellow-100 text-yellow-700 border border-yellow-200": level === 'L4',
                                                                        "bg-lime-100 text-lime-700 border border-lime-200": level === 'L5',
                                                                        "bg-emerald-100 text-emerald-700 border border-emerald-200": level === 'L6',
                                                                    }
                                                                )}>
                                                                    {level}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 font-medium text-slate-900">{control.label}</td>
                                                <td className="px-6 py-3 text-slate-500 max-w-md truncate" title={control.description}>{control.description}</td>
                                                <td className="px-6 py-3 text-center">
                                                    {control.isMandatory ? (
                                                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">{t('controls.mandatory')}</span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">{t('controls.optional')}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <button
                                                            onClick={() => openView(control)}
                                                            className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded transition-colors"
                                                            title={t('controls.actions.view')}
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => openEdit(control)}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                            title={t('controls.actions.edit')}
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteControl(control.id)}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            title={t('controls.actions.delete')}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {isModalOpen && (
                <ControlModal
                    control={editingControl}
                    onSave={handleSave}
                    onClose={() => setIsModalOpen(false)}
                />
            )}

            {isViewModalOpen && viewingControl && (
                <ViewControlModal
                    control={viewingControl}
                    onClose={() => setIsViewModalOpen(false)}
                    onEdit={() => {
                        setIsViewModalOpen(false);
                        openEdit(viewingControl);
                    }}
                />
            )}
        </div>
    );
};

// Helper function to generate condition string from selected levels
const generateLevelCondition = (levels: RaiseLevel[]): string => {
    if (levels.length === 0 || levels.length === 6) return ''; // Empty or all = no level filter
    return levels.map(l => `opp.raiseLevel === "${l}"`).join(' || ');
};

// Helper function to extract non-level parts of a condition
const extractNonLevelCondition = (condition?: string): string => {
    if (!condition) return '';
    // Remove RAISE level checks and clean up
    const result = condition
        .replace(/\(?opp\.raiseLevel\s*===\s*["']?L[1-6]["']?\s*\)?/g, '')
        .replace(/\|\|\s*\|\|/g, '||')
        .replace(/&&\s*&&/g, '&&')
        .replace(/^\s*\|\|\s*/g, '')
        .replace(/\s*\|\|\s*$/g, '')
        .replace(/^\s*&&\s*/g, '')
        .replace(/\s*&&\s*$/g, '')
        .replace(/\(\s*\)/g, '')
        .trim();
    // Clean up surrounding parentheses if empty inside
    if (result === '()' || result === '( )') return '';
    return result;
};

const ControlModal = ({ control, onSave, onClose }: { control: ControlConfig | null, onSave: (c: ControlConfig) => void, onClose: () => void }) => {
    const { t } = useTranslation('settings');
    const { t: tCommon } = useTranslation('common');

    // Parse initial RAISE levels from condition
    const initialLevels = control?.condition ? extractRaiseLevels(control.condition) : 'ALL';
    const initialSelectedLevels = initialLevels === 'ALL' ? [] : initialLevels;
    const initialOtherCondition = extractNonLevelCondition(control?.condition);

    const [formData, setFormData] = useState<Partial<ControlConfig>>(control || {
        label: '',
        description: '',
        phase: 'ATP',
        isMandatory: true,
        actionType: 'document',
        templateRef: '',
        condition: '',
        detailedDescription: '',
        folderPath: '',
        templateLinks: []
    });

    const [selectedLevels, setSelectedLevels] = useState<RaiseLevel[]>(initialSelectedLevels);
    const [otherCondition, setOtherCondition] = useState(initialOtherCondition);

    // Update condition when levels or otherCondition change
    const updateCondition = (levels: RaiseLevel[], other: string) => {
        const levelPart = generateLevelCondition(levels);
        let fullCondition = '';

        if (levelPart && other) {
            fullCondition = `(${levelPart}) && (${other})`;
        } else if (levelPart) {
            fullCondition = levels.length > 1 ? `(${levelPart})` : levelPart;
        } else {
            fullCondition = other;
        }

        setFormData(prev => ({ ...prev, condition: fullCondition }));
    };

    const toggleLevel = (level: RaiseLevel) => {
        const newLevels = selectedLevels.includes(level)
            ? selectedLevels.filter(l => l !== level)
            : [...selectedLevels, level].sort();
        setSelectedLevels(newLevels);
        updateCondition(newLevels, otherCondition);
    };

    const selectAllLevels = () => {
        setSelectedLevels([]);
        updateCondition([], otherCondition);
    };

    const addTemplateLink = () => {
        const currentLinks = formData.templateLinks || [];
        setFormData({
            ...formData,
            templateLinks: [...currentLinks, { name: '', url: '' }]
        });
    };

    const updateTemplateLink = (index: number, field: 'name' | 'url', value: string) => {
        const currentLinks = [...(formData.templateLinks || [])];
        currentLinks[index] = { ...currentLinks[index], [field]: value };
        setFormData({ ...formData, templateLinks: currentLinks });
    };

    const removeTemplateLink = (index: number) => {
        const currentLinks = [...(formData.templateLinks || [])];
        currentLinks.splice(index, 1);
        setFormData({ ...formData, templateLinks: currentLinks });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as ControlConfig);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl animate-in zoom-in-95 duration-200 my-8">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900">{t('form.title')}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.labelPhase')}</label>
                        <select
                            value={formData.phase}
                            onChange={e => setFormData({ ...formData, phase: e.target.value as ControlConfig['phase'] })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        >
                            {['Planning', 'ATP', 'ATS', 'ATC', 'Handover'].map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.labelName')}</label>
                        <input
                            type="text"
                            required
                            value={formData.label}
                            onChange={e => setFormData({ ...formData, label: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.labelDescription')}</label>
                        <textarea
                            required
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={formData.isMandatory}
                            onChange={e => setFormData({ ...formData, isMandatory: e.target.checked })}
                            id="isMandatory"
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="isMandatory" className="text-sm font-medium text-slate-700">{t('form.labelMandatory')}</label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.labelActionType')}</label>
                        <select
                            value={formData.actionType}
                            onChange={e => setFormData({ ...formData, actionType: e.target.value as ControlConfig['actionType'] })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        >
                            <option value="document">{t('form.actionTypes.document')}</option>
                            <option value="email">{t('form.actionTypes.email')}</option>
                            <option value="task">{t('form.actionTypes.task')}</option>
                            <option value="notification">{t('form.actionTypes.notification')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Template Reference (Optional)</label>
                        <input
                            type="text"
                            placeholder="e.g. MOD-092, MOD-105"
                            value={formData.templateRef || ''}
                            onChange={e => setFormData({ ...formData, templateRef: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        />
                        <p className="text-xs text-slate-400 mt-1">Nome template (es. MOD-092, MOD-105)</p>
                    </div>
                    {/* RAISE Level Selector */}
                    <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-slate-700">
                                {t('controls.tableHeaders.raiseLevels')}
                            </label>
                            <button
                                type="button"
                                onClick={selectAllLevels}
                                className={clsx(
                                    "text-xs px-2 py-1 rounded transition-colors",
                                    selectedLevels.length === 0
                                        ? "bg-blue-100 text-blue-700"
                                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                                )}
                            >
                                {selectedLevels.length === 0 ? (
                                    <span className="flex items-center gap-1"><Check size={12} /> Tutti i livelli</span>
                                ) : (
                                    "Seleziona tutti"
                                )}
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {LEVELS.map(level => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => toggleLevel(level)}
                                    className={clsx(
                                        "px-3 py-2 rounded-lg text-sm font-bold transition-all border-2",
                                        selectedLevels.includes(level) || selectedLevels.length === 0
                                            ? {
                                                "bg-red-100 text-red-700 border-red-300 shadow-sm": level === 'L1',
                                                "bg-orange-100 text-orange-700 border-orange-300 shadow-sm": level === 'L2',
                                                "bg-amber-100 text-amber-700 border-amber-300 shadow-sm": level === 'L3',
                                                "bg-yellow-100 text-yellow-700 border-yellow-300 shadow-sm": level === 'L4',
                                                "bg-lime-100 text-lime-700 border-lime-300 shadow-sm": level === 'L5',
                                                "bg-emerald-100 text-emerald-700 border-emerald-300 shadow-sm": level === 'L6',
                                            }
                                            : "bg-slate-100 text-slate-400 border-slate-200 opacity-50"
                                    )}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            {selectedLevels.length === 0
                                ? "Applicabile a tutti i livelli RAISE"
                                : `Applicabile a: ${selectedLevels.join(', ')}`
                            }
                        </p>
                    </div>

                    {/* Additional Conditions */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Condizioni Aggiuntive (Opzionale)</label>
                        <textarea
                            rows={2}
                            placeholder="e.g. opp.hasKcpDeviations === true || opp.hasSuppliers === true"
                            value={otherCondition}
                            onChange={e => {
                                setOtherCondition(e.target.value);
                                updateCondition(selectedLevels, e.target.value);
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-mono text-xs"
                        />
                        <p className="text-xs text-slate-400 mt-1">Condizioni extra oltre ai livelli RAISE (es. opp.hasKcpDeviations, opp.isRti)</p>
                    </div>

                    {/* Generated Condition Preview */}
                    {formData.condition && (
                        <div className="p-3 bg-slate-100 rounded-lg border border-slate-200">
                            <div className="text-xs font-medium text-slate-500 mb-1">Condizione Generata:</div>
                            <code className="text-xs text-slate-700 font-mono break-all">{formData.condition}</code>
                        </div>
                    )}

                    {/* NUOVI CAMPI */}
                    <div className="pt-4 border-t border-slate-200">
                        <h4 className="text-sm font-bold text-slate-700 mb-3">Informazioni Aggiuntive</h4>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descrizione Dettagliata (da Excel)</label>
                                <textarea
                                    rows={4}
                                    placeholder="Descrizione estesa con istruzioni operative complete dall'Excel..."
                                    value={formData.detailedDescription || ''}
                                    onChange={e => setFormData({ ...formData, detailedDescription: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none"
                                />
                                <p className="text-xs text-slate-400 mt-1">Istruzioni operative dettagliate visualizzate nel workflow</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Percorso Cartella SharePoint</label>
                                <input
                                    type="text"
                                    placeholder="es. /SharePoint/Documents/ATP/ o /RAISE/ATS/MOD-001/"
                                    value={formData.folderPath || ''}
                                    onChange={e => setFormData({ ...formData, folderPath: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none font-mono text-sm"
                                />
                                <p className="text-xs text-slate-400 mt-1">Dove salvare il documento in SharePoint</p>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-slate-700">Link ai Template</label>
                                    <button
                                        type="button"
                                        onClick={addTemplateLink}
                                        className="flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 px-2 py-1 rounded-lg transition-colors"
                                    >
                                        <Plus size={14} /> Aggiungi Link
                                    </button>
                                </div>

                                {(!formData.templateLinks || formData.templateLinks.length === 0) ? (
                                    <div className="text-center p-4 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                                        <p className="text-sm text-slate-500">Nessun template configurato</p>
                                        <p className="text-xs text-slate-400 mt-1">Clicca "Aggiungi Link" per aggiungere template</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {formData.templateLinks.map((link, index) => (
                                            <div key={index} className="flex gap-2 p-3 border border-slate-200 rounded-lg bg-slate-50">
                                                <div className="flex-1 space-y-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Nome template (es. MOD-092)"
                                                        value={link.name}
                                                        onChange={e => updateTemplateLink(index, 'name', e.target.value)}
                                                        className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none"
                                                    />
                                                    <input
                                                        type="url"
                                                        placeholder="https://sharepoint.lutech.it/templates/MOD-092.docx"
                                                        value={link.url}
                                                        onChange={e => updateTemplateLink(index, 'url', e.target.value)}
                                                        className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none font-mono"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeTemplateLink(index)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors self-start"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <p className="text-xs text-slate-400 mt-1">Link diretti ai template da aprire dal workflow</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-2 border-t border-slate-200">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">{tCommon('button.cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2">
                            <Save size={16} /> {t('actions.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DetailRow = ({ label, value, mono = false }: { label: string; value?: string | React.ReactNode; mono?: boolean }) => (
    <div className="py-3 border-b border-slate-100 last:border-0">
        <div className="text-xs font-medium text-slate-500 mb-1">{label}</div>
        <div className={clsx("text-sm text-slate-900", mono && "font-mono text-xs bg-slate-50 p-2 rounded")}>
            {value || <span className="text-slate-400 italic">-</span>}
        </div>
    </div>
);

const ViewControlModal = ({ control, onClose, onEdit }: { control: ControlConfig, onClose: () => void, onEdit: () => void }) => {
    const { t } = useTranslation('settings');
    const raiseLevels = extractRaiseLevels(control.condition);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl animate-in zoom-in-95 duration-200 my-8">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                            <Eye size={20} className="text-cyan-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">{control.label}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={clsx(
                                    "px-2 py-0.5 rounded text-xs font-medium",
                                    {
                                        "bg-blue-50 text-blue-600": control.phase === 'Planning',
                                        "bg-indigo-50 text-indigo-600": control.phase === 'ATP',
                                        "bg-purple-50 text-purple-600": control.phase === 'ATS',
                                        "bg-emerald-50 text-emerald-600": control.phase === 'ATC',
                                        "bg-slate-100 text-slate-600": control.phase === 'Handover',
                                        "bg-amber-50 text-amber-700": control.phase === 'ALL',
                                    }
                                )}>
                                    {control.phase}
                                </span>
                                {control.isMandatory ? (
                                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                                        {t('controls.mandatory')}
                                    </span>
                                ) : (
                                    <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                                        {t('controls.optional')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="space-y-1">
                        {/* RAISE Levels */}
                        <DetailRow
                            label={t('controls.tableHeaders.raiseLevels')}
                            value={
                                raiseLevels === 'ALL' ? (
                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">ALL</span>
                                ) : (
                                    <div className="flex flex-wrap gap-1">
                                        {raiseLevels.map(level => (
                                            <span key={level} className={clsx(
                                                "px-2 py-1 rounded text-xs font-bold",
                                                {
                                                    "bg-red-100 text-red-700 border border-red-200": level === 'L1',
                                                    "bg-orange-100 text-orange-700 border border-orange-200": level === 'L2',
                                                    "bg-amber-100 text-amber-700 border border-amber-200": level === 'L3',
                                                    "bg-yellow-100 text-yellow-700 border border-yellow-200": level === 'L4',
                                                    "bg-lime-100 text-lime-700 border border-lime-200": level === 'L5',
                                                    "bg-emerald-100 text-emerald-700 border border-emerald-200": level === 'L6',
                                                }
                                            )}>
                                                {level}
                                            </span>
                                        ))}
                                    </div>
                                )
                            }
                        />

                        {/* Description */}
                        <DetailRow label={t('form.labelDescription')} value={control.description} />

                        {/* Action Type */}
                        <DetailRow
                            label={t('form.labelActionType')}
                            value={
                                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                    {control.actionType}
                                </span>
                            }
                        />

                        {/* Template Reference */}
                        {control.templateRef && (
                            <DetailRow label="Template Reference" value={control.templateRef} />
                        )}

                        {/* Condition */}
                        {control.condition && (
                            <DetailRow label="Condition" value={control.condition} mono />
                        )}

                        {/* Detailed Description */}
                        {control.detailedDescription && (
                            <DetailRow
                                label="Descrizione Dettagliata"
                                value={
                                    <div className="whitespace-pre-wrap text-sm bg-slate-50 p-3 rounded-lg border border-slate-200">
                                        {control.detailedDescription}
                                    </div>
                                }
                            />
                        )}

                        {/* Folder Path */}
                        {control.folderPath && (
                            <DetailRow
                                label="Percorso Cartella SharePoint"
                                value={
                                    <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono">
                                        {control.folderPath}
                                    </code>
                                }
                            />
                        )}

                        {/* Template Links */}
                        {control.templateLinks && control.templateLinks.length > 0 && (
                            <DetailRow
                                label="Link ai Template"
                                value={
                                    <div className="space-y-2">
                                        {control.templateLinks.map((link, index) => (
                                            <a
                                                key={index}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 hover:underline text-sm"
                                            >
                                                {link.name || link.url}
                                            </a>
                                        ))}
                                    </div>
                                }
                            />
                        )}
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                        Chiudi
                    </button>
                    <button
                        onClick={onEdit}
                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Edit2 size={16} /> Modifica
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper function to format TCV for display
const formatTcv = (value: number): string => {
    if (value === Infinity) return '∞';
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M€`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K€`;
    return `${value}€`;
};

// Helper function to parse TCV from string input
const parseTcv = (value: string): number => {
    const cleaned = value.replace(/[€,\s]/g, '').toUpperCase();
    if (cleaned === '' || cleaned === 'INFINITY' || cleaned === '∞') return Infinity;

    let multiplier = 1;
    let numStr = cleaned;

    if (cleaned.endsWith('M')) {
        multiplier = 1000000;
        numStr = cleaned.slice(0, -1);
    } else if (cleaned.endsWith('K')) {
        multiplier = 1000;
        numStr = cleaned.slice(0, -1);
    }

    const num = parseFloat(numStr);
    return isNaN(num) ? 0 : num * multiplier;
};

const AuthorizationMatrixPanel = () => {
    const [matrix, setMatrix] = useState<AuthorizationMatrixConfig>(() => getAuthorizationMatrix());
    const [editingLevel, setEditingLevel] = useState<RaiseLevel | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    const handleSave = () => {
        saveAuthorizationMatrix(matrix);
        setHasChanges(false);
    };

    const handleReset = () => {
        if (confirm('Sei sicuro di voler ripristinare i valori di default? Tutte le modifiche andranno perse.')) {
            resetAuthorizationMatrix();
            setMatrix(DEFAULT_AUTHORIZATION_MATRIX);
            setHasChanges(false);
        }
    };

    const updateLevel = (levelConfig: AuthorizationLevel) => {
        setMatrix(prev => ({
            ...prev,
            levels: prev.levels.map(l => l.level === levelConfig.level ? levelConfig : l),
            updatedAt: new Date().toISOString()
        }));
        setHasChanges(true);
    };

    const getLevelColor = (level: RaiseLevel) => {
        const colors: Record<RaiseLevel, string> = {
            'L1': 'bg-red-100 text-red-700 border-red-300',
            'L2': 'bg-orange-100 text-orange-700 border-orange-300',
            'L3': 'bg-amber-100 text-amber-700 border-amber-300',
            'L4': 'bg-yellow-100 text-yellow-700 border-yellow-300',
            'L5': 'bg-lime-100 text-lime-700 border-lime-300',
            'L6': 'bg-emerald-100 text-emerald-700 border-emerald-300',
        };
        return colors[level];
    };

    const getWorkflowBadge = (workflowType: WorkflowType) => {
        const styles: Record<WorkflowType, string> = {
            'Classic': 'bg-purple-100 text-purple-700',
            'Simplified': 'bg-blue-100 text-blue-700',
            'FastTrack': 'bg-green-100 text-green-700',
        };
        return styles[workflowType];
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Shield className="text-blue-600" size={20} />
                            Matrice di Autorizzazione (PSQ-003 §5.4)
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Configura le soglie TCV e gli autorizzatori per ogni livello RAISE.
                            Queste impostazioni determinano automaticamente il livello delle opportunità.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 flex items-center gap-2"
                        >
                            <RotateCcw size={16} /> Default
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges}
                            className={clsx(
                                "px-4 py-2 rounded-lg flex items-center gap-2",
                                hasChanges
                                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30"
                                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            )}
                        >
                            <Save size={16} /> Salva
                        </button>
                    </div>
                </div>
            </div>

            {/* Matrix Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Livello</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Range TCV</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Autorizzatori ATP</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Autorizzatori ATS/ATC/HND</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Workflow</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {matrix.levels.map((level) => (
                                <tr key={level.level} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-4">
                                        <span className={clsx(
                                            "px-3 py-1.5 rounded-lg text-sm font-bold border-2",
                                            getLevelColor(level.level)
                                        )}>
                                            {level.level}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="text-sm font-medium text-slate-900">{level.tcvLabel}</div>
                                        <div className="text-xs text-slate-400 mt-0.5">
                                            {formatTcv(level.tcvMin)} - {formatTcv(level.tcvMax)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="text-sm text-slate-700 max-w-xs">{level.authorizersAtp}</div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="text-sm text-slate-700 max-w-md">{level.authorizersAtsAtcHnd}</div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={clsx(
                                            "px-2 py-1 rounded text-xs font-medium",
                                            getWorkflowBadge(level.workflowType)
                                        )}>
                                            {level.workflowType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <button
                                            onClick={() => setEditingLevel(level.level)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Modifica"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h3 className="font-semibold text-amber-800 mb-2">Note sulla Matrice</h3>
                <ul className="text-sm text-amber-700 space-y-1">
                    <li>• <strong>Classic:</strong> Autorizzazioni mediante meeting con autorizzatori Lutech S.p.A. e intervento Expert</li>
                    <li>• <strong>Simplified:</strong> Autorizzazioni via e-mail, senza Expert (salvo deviazioni KCP)</li>
                    <li>• <strong>Fast Track:</strong> Workflow accelerato con tracking, se nessuna deviazione KCP</li>
                    <li>• Le clausole sociali o attività NON core business portano direttamente a L1</li>
                    <li>• Deviazioni KCP aumentano il livello di 1 (da L6→L5, L5→L4, L4 resta L4)</li>
                </ul>
            </div>

            {/* Edit Modal */}
            {editingLevel && (
                <AuthorizationLevelModal
                    level={matrix.levels.find(l => l.level === editingLevel)!}
                    onSave={(updated) => {
                        updateLevel(updated);
                        setEditingLevel(null);
                    }}
                    onClose={() => setEditingLevel(null)}
                />
            )}
        </div>
    );
};

const AuthorizationLevelModal = ({
    level,
    onSave,
    onClose
}: {
    level: AuthorizationLevel;
    onSave: (level: AuthorizationLevel) => void;
    onClose: () => void;
}) => {
    const [formData, setFormData] = useState<AuthorizationLevel>(level);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const getLevelColor = (l: RaiseLevel) => {
        const colors: Record<RaiseLevel, string> = {
            'L1': 'bg-red-100 text-red-700',
            'L2': 'bg-orange-100 text-orange-700',
            'L3': 'bg-amber-100 text-amber-700',
            'L4': 'bg-yellow-100 text-yellow-700',
            'L5': 'bg-lime-100 text-lime-700',
            'L6': 'bg-emerald-100 text-emerald-700',
        };
        return colors[l];
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className={clsx("px-3 py-1.5 rounded-lg font-bold", getLevelColor(level.level))}>
                            {level.level}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Modifica Livello {level.level}</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* TCV Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">TCV Minimo</label>
                            <input
                                type="text"
                                value={formatTcv(formData.tcvMin)}
                                onChange={e => setFormData({ ...formData, tcvMin: parseTcv(e.target.value) })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder="es. 250K, 1M"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">TCV Massimo</label>
                            <input
                                type="text"
                                value={formatTcv(formData.tcvMax)}
                                onChange={e => setFormData({ ...formData, tcvMax: parseTcv(e.target.value) })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder="es. 500K, 10M, ∞"
                            />
                        </div>
                    </div>

                    {/* TCV Label */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Etichetta Range</label>
                        <input
                            type="text"
                            value={formData.tcvLabel}
                            onChange={e => setFormData({ ...formData, tcvLabel: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            placeholder="es. 250-500 K€"
                        />
                    </div>

                    {/* Authorizers ATP */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Autorizzatori ATP</label>
                        <textarea
                            rows={2}
                            value={formData.authorizersAtp}
                            onChange={e => setFormData({ ...formData, authorizersAtp: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>

                    {/* Authorizers ATS/ATC/HND */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Autorizzatori ATS/ATC/HND</label>
                        <textarea
                            rows={2}
                            value={formData.authorizersAtsAtcHnd}
                            onChange={e => setFormData({ ...formData, authorizersAtsAtcHnd: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>

                    {/* Workflow Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tipo Workflow</label>
                        <select
                            value={formData.workflowType}
                            onChange={e => setFormData({ ...formData, workflowType: e.target.value as WorkflowType })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                            {WORKFLOW_TYPES.map(wt => (
                                <option key={wt} value={wt}>{wt}</option>
                            ))}
                        </select>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Note</label>
                        <textarea
                            rows={3}
                            value={formData.notes || ''}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                            placeholder="Note aggiuntive sul workflow..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex justify-end gap-2 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Save size={16} /> Salva
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Expert Involvement Panel Component
const ExpertInvolvementPanel = () => {
    const [config, setConfig] = useState<ExpertInvolvementConfig>(() => getExpertInvolvement());
    const [editingExpert, setEditingExpert] = useState<ExpertConfig | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    const handleSave = () => {
        saveExpertInvolvement(config);
        setHasChanges(false);
    };

    const handleReset = () => {
        if (confirm('Sei sicuro di voler ripristinare i valori di default? Tutte le modifiche andranno perse.')) {
            resetExpertInvolvement();
            setConfig(DEFAULT_EXPERT_INVOLVEMENT);
            setHasChanges(false);
        }
    };

    const updateExpert = (expertConfig: ExpertConfig) => {
        setConfig(prev => ({
            ...prev,
            experts: prev.experts.map(e => e.id === expertConfig.id ? expertConfig : e),
            updatedAt: new Date().toISOString()
        }));
        setHasChanges(true);
    };

    const getFunctionBadgeColor = (func: ExpertFunction): string => {
        const colors: Record<ExpertFunction, string> = {
            'Finance': 'bg-green-100 text-green-700 border-green-200',
            'Procurement': 'bg-blue-100 text-blue-700 border-blue-200',
            'CMCIO': 'bg-purple-100 text-purple-700 border-purple-200',
            'Legal': 'bg-red-100 text-red-700 border-red-200',
            'Compliance231': 'bg-amber-100 text-amber-700 border-amber-200',
            'ComplianceAnticorruzione': 'bg-amber-100 text-amber-700 border-amber-200',
            'ComplianceESG': 'bg-teal-100 text-teal-700 border-teal-200',
            'ComplianceSistemiGestione': 'bg-amber-100 text-amber-700 border-amber-200',
            'ComplianceAltro': 'bg-amber-100 text-amber-700 border-amber-200',
            'DataPrivacy': 'bg-indigo-100 text-indigo-700 border-indigo-200',
            'Risk': 'bg-orange-100 text-orange-700 border-orange-200',
            'Security': 'bg-slate-100 text-slate-700 border-slate-200',
            'HSE': 'bg-lime-100 text-lime-700 border-lime-200',
            'HR': 'bg-pink-100 text-pink-700 border-pink-200',
        };
        return colors[func] || 'bg-slate-100 text-slate-700';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Users className="text-blue-600" size={20} />
                            Coinvolgimento Expert (PSQ-003)
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Configura le condizioni di coinvolgimento degli esperti per ogni area funzionale.
                            Gli esperti vengono coinvolti automaticamente in base ai criteri definiti.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 flex items-center gap-2"
                        >
                            <RotateCcw size={16} /> Default
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges}
                            className={clsx(
                                "px-4 py-2 rounded-lg flex items-center gap-2",
                                hasChanges
                                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30"
                                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            )}
                        >
                            <Save size={16} /> Salva
                        </button>
                    </div>
                </div>
            </div>

            {/* Expert Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {config.experts.map((expert) => (
                    <div
                        key={expert.id}
                        className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                <span className={clsx(
                                    "px-2 py-1 rounded-md text-xs font-semibold border",
                                    getFunctionBadgeColor(expert.function)
                                )}>
                                    {expert.function}
                                </span>
                            </div>
                            <button
                                onClick={() => setEditingExpert(expert)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Modifica"
                            >
                                <Edit2 size={16} />
                            </button>
                        </div>

                        <h3 className="font-semibold text-slate-900 mb-2">{expert.displayName}</h3>

                        {expert.email && (
                            <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                                <Mail size={14} />
                                <a href={`mailto:${expert.email}`} className="text-blue-600 hover:underline">
                                    {expert.email}
                                </a>
                            </div>
                        )}

                        <div className="mb-3">
                            <div className="text-xs font-medium text-slate-500 mb-1">Livelli Applicabili</div>
                            <div className="flex flex-wrap gap-1">
                                {expert.applicableLevels.map(level => (
                                    <span key={level} className={clsx(
                                        "px-1.5 py-0.5 rounded text-xs font-bold",
                                        {
                                            "bg-red-100 text-red-700": level === 'L1',
                                            "bg-orange-100 text-orange-700": level === 'L2',
                                            "bg-amber-100 text-amber-700": level === 'L3',
                                            "bg-yellow-100 text-yellow-700": level === 'L4',
                                            "bg-lime-100 text-lime-700": level === 'L5',
                                            "bg-emerald-100 text-emerald-700": level === 'L6',
                                        }
                                    )}>
                                        {level}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs font-medium text-slate-500 mb-1">Quando Coinvolgere</div>
                            <p className="text-sm text-slate-600 line-clamp-3">{expert.involvementCondition}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Come Funziona il Coinvolgimento Expert</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Gli esperti vengono notificati automaticamente quando un'opportunità soddisfa le loro condizioni</li>
                    <li>• Ogni esperto fornisce un parere (Green/Yellow/Red) che viene registrato nell'opportunità</li>
                    <li>• Il coinvolgimento è obbligatorio per i livelli L1-L5 secondo le condizioni specificate</li>
                    <li>• I contatti email sono utilizzati per le comunicazioni automatiche</li>
                </ul>
            </div>

            {/* Edit Modal */}
            {editingExpert && (
                <ExpertModal
                    expert={editingExpert}
                    onSave={(updated) => {
                        updateExpert(updated);
                        setEditingExpert(null);
                    }}
                    onClose={() => setEditingExpert(null)}
                />
            )}
        </div>
    );
};

// Expert Edit Modal
const ExpertModal = ({
    expert,
    onSave,
    onClose
}: {
    expert: ExpertConfig;
    onSave: (expert: ExpertConfig) => void;
    onClose: () => void;
}) => {
    const [formData, setFormData] = useState<ExpertConfig>(expert);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const toggleLevel = (level: RaiseLevel) => {
        const newLevels = formData.applicableLevels.includes(level)
            ? formData.applicableLevels.filter(l => l !== level)
            : [...formData.applicableLevels, level].sort() as RaiseLevel[];
        setFormData({ ...formData, applicableLevels: newLevels });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Users size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Modifica Expert</h3>
                            <p className="text-sm text-slate-500">{expert.function}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Display Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome Visualizzato</label>
                        <input
                            type="text"
                            value={formData.displayName}
                            onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Contatto</label>
                        <input
                            type="email"
                            value={formData.email || ''}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="expert@lutech.it"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>

                    {/* Applicable Levels */}
                    <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                            Livelli RAISE Applicabili
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {LEVELS.map(level => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => toggleLevel(level)}
                                    className={clsx(
                                        "px-3 py-2 rounded-lg text-sm font-bold transition-all border-2",
                                        formData.applicableLevels.includes(level)
                                            ? {
                                                "bg-red-100 text-red-700 border-red-300 shadow-sm": level === 'L1',
                                                "bg-orange-100 text-orange-700 border-orange-300 shadow-sm": level === 'L2',
                                                "bg-amber-100 text-amber-700 border-amber-300 shadow-sm": level === 'L3',
                                                "bg-yellow-100 text-yellow-700 border-yellow-300 shadow-sm": level === 'L4',
                                                "bg-lime-100 text-lime-700 border-lime-300 shadow-sm": level === 'L5',
                                                "bg-emerald-100 text-emerald-700 border-emerald-300 shadow-sm": level === 'L6',
                                            }
                                            : "bg-slate-100 text-slate-400 border-slate-200 opacity-50"
                                    )}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            Livelli selezionati: {formData.applicableLevels.length > 0
                                ? formData.applicableLevels.join(', ')
                                : 'Nessuno'}
                        </p>
                    </div>

                    {/* Involvement Condition */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Condizione di Coinvolgimento
                        </label>
                        <textarea
                            rows={4}
                            value={formData.involvementCondition}
                            onChange={e => setFormData({ ...formData, involvementCondition: e.target.value })}
                            placeholder="Descrivi quando questo esperto deve essere coinvolto..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                            Descrizione delle condizioni in cui l'esperto deve essere coinvolto
                        </p>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Note (opzionale)</label>
                        <textarea
                            rows={2}
                            value={formData.notes || ''}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Note aggiuntive..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex justify-end gap-2 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Save size={16} /> Salva
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Financial Targets Panel Component
const CATEGORIES: FinancialTargetCategory[] = ['CashFlow', 'Margins', 'Deviations', 'IFRS15'];

const FinancialTargetsPanel = () => {
    const [config, setConfig] = useState<FinancialTargetsConfig>(() => getFinancialTargets());
    const [editingTarget, setEditingTarget] = useState<FinancialTarget | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    const handleSave = () => {
        saveFinancialTargets(config);
        setHasChanges(false);
    };

    const handleReset = () => {
        if (confirm('Sei sicuro di voler ripristinare i valori di default? Tutte le modifiche andranno perse.')) {
            resetFinancialTargets();
            setConfig(DEFAULT_FINANCIAL_TARGETS);
            setHasChanges(false);
        }
    };

    const updateTarget = (targetConfig: FinancialTarget) => {
        setConfig(prev => ({
            ...prev,
            targets: prev.targets.map(t => t.id === targetConfig.id ? targetConfig : t),
            updatedAt: new Date().toISOString()
        }));
        setHasChanges(true);
    };

    const getCategoryColor = (category: FinancialTargetCategory): string => {
        const colors: Record<FinancialTargetCategory, string> = {
            'CashFlow': 'bg-blue-100 text-blue-700 border-blue-200',
            'Margins': 'bg-green-100 text-green-700 border-green-200',
            'Deviations': 'bg-amber-100 text-amber-700 border-amber-200',
            'IFRS15': 'bg-purple-100 text-purple-700 border-purple-200',
        };
        return colors[category];
    };

    const getCategoryIcon = (category: FinancialTargetCategory) => {
        switch (category) {
            case 'CashFlow': return <DollarSign size={18} />;
            case 'Margins': return <Target size={18} />;
            case 'Deviations': return <Shield size={18} />;
            case 'IFRS15': return <Check size={18} />;
        }
    };

    // Group targets by category
    const targetsByCategory = CATEGORIES.reduce((acc, category) => {
        acc[category] = config.targets.filter(t => t.category === category);
        return acc;
    }, {} as Record<FinancialTargetCategory, FinancialTarget[]>);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Target className="text-green-600" size={20} />
                            Key Financial Targets (PSQ-003)
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Configura i target finanziari chiave per le opportunità RAISE:
                            Cash Flow, Margini, Deviazioni KCP e valutazioni IFRS15.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 flex items-center gap-2"
                        >
                            <RotateCcw size={16} /> Default
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges}
                            className={clsx(
                                "px-4 py-2 rounded-lg flex items-center gap-2",
                                hasChanges
                                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30"
                                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            )}
                        >
                            <Save size={16} /> Salva
                        </button>
                    </div>
                </div>
            </div>

            {/* Targets grouped by category */}
            {CATEGORIES.map(category => (
                <div key={category} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className={clsx(
                        "px-6 py-4 border-b border-slate-100 flex items-center gap-3",
                        getCategoryColor(category).replace('border-', 'bg-').split(' ')[0]
                    )}>
                        <span className={clsx(
                            "p-2 rounded-lg",
                            getCategoryColor(category)
                        )}>
                            {getCategoryIcon(category)}
                        </span>
                        <h3 className="font-semibold text-slate-900">{getCategoryDisplayName(category)}</h3>
                        <span className="ml-auto text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                            {targetsByCategory[category].length} regole
                        </span>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {targetsByCategory[category].map(target => (
                            <div
                                key={target.id}
                                className="px-6 py-4 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-medium text-slate-900">{target.scope}</h4>
                                            {target.threshold !== undefined && (
                                                <span className={clsx(
                                                    "px-2 py-0.5 rounded text-xs font-bold",
                                                    getCategoryColor(category)
                                                )}>
                                                    {target.threshold}{target.thresholdUnit === 'percent' ? '%' : target.thresholdUnit === 'days' ? ' gg' : ' mesi'}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-600">{target.rule}</p>
                                    </div>
                                    <button
                                        onClick={() => setEditingTarget(target)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                                        title="Modifica"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Info Box */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h3 className="font-semibold text-green-800 mb-2">Applicazione dei Target</h3>
                <ul className="text-sm text-green-700 space-y-1">
                    <li>• <strong>Cash Flow:</strong> Termini di pagamento massimi e neutralità del cash</li>
                    <li>• <strong>Margini:</strong> Soglie minime di margine per prodotti e servizi</li>
                    <li>• <strong>Deviazioni:</strong> Gestione delle eccezioni ai Key Contracting Principles</li>
                    <li>• <strong>IFRS15:</strong> Validazione contabile delle valutazioni finanziarie</li>
                </ul>
            </div>

            {/* Edit Modal */}
            {editingTarget && (
                <FinancialTargetModal
                    target={editingTarget}
                    onSave={(updated) => {
                        updateTarget(updated);
                        setEditingTarget(null);
                    }}
                    onClose={() => setEditingTarget(null)}
                />
            )}
        </div>
    );
};

// Financial Target Edit Modal
const FinancialTargetModal = ({
    target,
    onSave,
    onClose
}: {
    target: FinancialTarget;
    onSave: (target: FinancialTarget) => void;
    onClose: () => void;
}) => {
    const [formData, setFormData] = useState<FinancialTarget>(target);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <Target size={20} className="text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Modifica Target</h3>
                            <p className="text-sm text-slate-500">{getCategoryDisplayName(target.category)}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Scope */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ambito</label>
                        <input
                            type="text"
                            value={formData.scope}
                            onChange={e => setFormData({ ...formData, scope: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        />
                    </div>

                    {/* Rule */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Regola / Controllo</label>
                        <textarea
                            rows={4}
                            value={formData.rule}
                            onChange={e => setFormData({ ...formData, rule: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        />
                    </div>

                    {/* Threshold */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Soglia (opzionale)</label>
                            <input
                                type="number"
                                value={formData.threshold ?? ''}
                                onChange={e => setFormData({
                                    ...formData,
                                    threshold: e.target.value ? parseFloat(e.target.value) : undefined
                                })}
                                placeholder="es. 16, 120, 18"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Unità</label>
                            <select
                                value={formData.thresholdUnit || ''}
                                onChange={e => setFormData({
                                    ...formData,
                                    thresholdUnit: e.target.value as FinancialTarget['thresholdUnit'] || undefined
                                })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                            >
                                <option value="">-</option>
                                <option value="percent">Percentuale (%)</option>
                                <option value="days">Giorni</option>
                                <option value="months">Mesi</option>
                            </select>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Note (opzionale)</label>
                        <textarea
                            rows={2}
                            value={formData.notes || ''}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Note aggiuntive..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                        />
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex justify-end gap-2 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                            <Save size={16} /> Salva
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Under-margin Panel Component
const MARGIN_TYPES: MarginType[] = ['Products', 'Services', 'Practice'];

const UnderMarginPanel = () => {
    const [config, setConfig] = useState<UnderMarginConfig>(() => getUnderMarginConfig());
    const [editingThreshold, setEditingThreshold] = useState<MarginThreshold | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    const handleSave = () => {
        saveUnderMarginConfig(config);
        setHasChanges(false);
    };

    const handleReset = () => {
        if (confirm('Sei sicuro di voler ripristinare i valori di default? Tutte le modifiche andranno perse.')) {
            resetUnderMarginConfig();
            setConfig(DEFAULT_UNDER_MARGIN);
            setHasChanges(false);
        }
    };

    const updateThreshold = (thresholdConfig: MarginThreshold) => {
        setConfig(prev => ({
            ...prev,
            thresholds: prev.thresholds.map(t => t.id === thresholdConfig.id ? thresholdConfig : t),
            updatedAt: new Date().toISOString()
        }));
        setHasChanges(true);
    };

    const getTypeColor = (type: MarginType): string => {
        const colors: Record<MarginType, string> = {
            'Products': 'bg-blue-100 text-blue-700 border-blue-200',
            'Services': 'bg-purple-100 text-purple-700 border-purple-200',
            'Practice': 'bg-orange-100 text-orange-700 border-orange-200',
        };
        return colors[type];
    };

    const getTypeIcon = (type: MarginType) => {
        switch (type) {
            case 'Products': return <DollarSign size={18} />;
            case 'Services': return <Users size={18} />;
            case 'Practice': return <Target size={18} />;
        }
    };

    // Group thresholds by type
    const thresholdsByType = MARGIN_TYPES.reduce((acc, type) => {
        acc[type] = config.thresholds.filter(t => t.type === type);
        return acc;
    }, {} as Record<MarginType, MarginThreshold[]>);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <TrendingDown className="text-orange-600" size={20} />
                            Soglie Under-margin (PSQ-003)
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Configura le soglie di margine target e minimo per ogni tipologia.
                            Gli under-margin richiedono approvazione specifica.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 flex items-center gap-2"
                        >
                            <RotateCcw size={16} /> Default
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges}
                            className={clsx(
                                "px-4 py-2 rounded-lg flex items-center gap-2",
                                hasChanges
                                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30"
                                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            )}
                        >
                            <Save size={16} /> Salva
                        </button>
                    </div>
                </div>
            </div>

            {/* Thresholds grouped by type */}
            {MARGIN_TYPES.map(type => (
                <div key={type} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className={clsx(
                        "px-6 py-4 border-b border-slate-100 flex items-center gap-3",
                        getTypeColor(type).replace('border-', 'bg-').split(' ')[0]
                    )}>
                        <span className={clsx(
                            "p-2 rounded-lg",
                            getTypeColor(type)
                        )}>
                            {getTypeIcon(type)}
                        </span>
                        <h3 className="font-semibold text-slate-900">{getMarginTypeDisplayName(type)}</h3>
                        <span className="ml-auto text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                            {thresholdsByType[type].length} soglie
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Nome</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Target</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Minimo</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Approvazione</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Azioni</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {thresholdsByType[type].map(threshold => (
                                    <tr key={threshold.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-900">{threshold.name}</div>
                                            {threshold.notes && (
                                                <div className="text-xs text-slate-500 mt-0.5 max-w-xs truncate" title={threshold.notes}>
                                                    {threshold.notes}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-bold">
                                                {threshold.targetMargin}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-sm font-bold">
                                                {threshold.minimumMargin}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {threshold.approvalRequired ? (
                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                                                    {threshold.approverLevel || 'Richiesta'}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => setEditingThreshold(threshold)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Modifica"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}

            {/* Info Box */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <h3 className="font-semibold text-orange-800 mb-2">Regole Under-margin</h3>
                <ul className="text-sm text-orange-700 space-y-1">
                    <li>• <strong>Target:</strong> Margine obiettivo per la tipologia. Sotto questa soglia si configura under-margin.</li>
                    <li>• <strong>Minimo:</strong> Margine minimo accettabile. Sotto questa soglia serve approvazione escalata.</li>
                    <li>• <strong>Approvazione:</strong> Livello RAISE minimo richiesto per approvare l'under-margin.</li>
                    <li>• Gli under-margin devono essere giustificati e documentati nell'Opportunity Site.</li>
                </ul>
            </div>

            {/* Edit Modal */}
            {editingThreshold && (
                <UnderMarginModal
                    threshold={editingThreshold}
                    onSave={(updated) => {
                        updateThreshold(updated);
                        setEditingThreshold(null);
                    }}
                    onClose={() => setEditingThreshold(null)}
                />
            )}
        </div>
    );
};

// Under-margin Threshold Edit Modal
const UnderMarginModal = ({
    threshold,
    onSave,
    onClose
}: {
    threshold: MarginThreshold;
    onSave: (threshold: MarginThreshold) => void;
    onClose: () => void;
}) => {
    const [formData, setFormData] = useState<MarginThreshold>(threshold);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                            <TrendingDown size={20} className="text-orange-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Modifica Soglia Margine</h3>
                            <p className="text-sm text-slate-500">{getMarginTypeDisplayName(threshold.type)}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                    </div>

                    {/* Margins */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Margine Target (%)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={formData.targetMargin}
                                onChange={e => setFormData({ ...formData, targetMargin: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                            />
                            <p className="text-xs text-slate-400 mt-1">Obiettivo di margine</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Margine Minimo (%)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={formData.minimumMargin}
                                onChange={e => setFormData({ ...formData, minimumMargin: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                            />
                            <p className="text-xs text-slate-400 mt-1">Soglia minima accettabile</p>
                        </div>
                    </div>

                    {/* Approval Required */}
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                        <input
                            type="checkbox"
                            id="approvalRequired"
                            checked={formData.approvalRequired}
                            onChange={e => setFormData({ ...formData, approvalRequired: e.target.checked })}
                            className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500"
                        />
                        <div>
                            <label htmlFor="approvalRequired" className="font-medium text-slate-700">
                                Richiede Approvazione Under-margin
                            </label>
                            <p className="text-xs text-slate-500">Se attivo, margini sotto target richiedono approvazione esplicita</p>
                        </div>
                    </div>

                    {/* Approver Level */}
                    {formData.approvalRequired && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Livello Approvatore Minimo</label>
                            <select
                                value={formData.approverLevel || ''}
                                onChange={e => setFormData({ ...formData, approverLevel: e.target.value as RaiseLevel || undefined })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                            >
                                <option value="">Seleziona livello</option>
                                {LEVELS.map(level => (
                                    <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Note (opzionale)</label>
                        <textarea
                            rows={2}
                            value={formData.notes || ''}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Note aggiuntive..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex justify-end gap-2 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 flex items-center gap-2"
                        >
                            <Save size={16} /> Salva
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};