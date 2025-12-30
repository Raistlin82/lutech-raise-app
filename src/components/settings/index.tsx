import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../stores/SettingsStore';
import type { ControlConfig, RaiseLevel } from '../../types';
import { Plus, Trash2, Edit2, RotateCcw, Save, X, Filter, XCircle, Settings2, Database } from 'lucide-react';
import { clsx } from 'clsx';
import { DataMigrationPanel } from './DataMigrationPanel';

const PHASES = ['Planning', 'ATP', 'ATS', 'ATC', 'Handover'] as const;
const LEVELS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'] as const;

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

type TabType = 'controls' | 'data';

export const Settings = () => {
    const { t } = useTranslation('settings');
    const { controls, addControl, updateControl, deleteControl, resetDefaults } = useSettings();
    const [activeTab, setActiveTab] = useState<TabType>('controls');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingControl, setEditingControl] = useState<ControlConfig | null>(null);
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
            </div>

            {activeTab === 'data' && <DataMigrationPanel />}

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
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => openEdit(control)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => deleteControl(control.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
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
        </div>
    );
};

const ControlModal = ({ control, onSave, onClose }: { control: ControlConfig | null, onSave: (c: ControlConfig) => void, onClose: () => void }) => {
    const { t } = useTranslation('settings');
    const { t: tCommon } = useTranslation('common');
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
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Condition (Applicability Logic)</label>
                        <textarea
                            rows={2}
                            placeholder="e.g. opp.raiseLevel === 'L1' || opp.hasKcpDeviations === true"
                            value={formData.condition || ''}
                            onChange={e => setFormData({ ...formData, condition: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-mono text-xs"
                        />
                        <p className="text-xs text-slate-400 mt-1">Espressione JavaScript per definire quando il checkpoint si applica. Usa 'opp' per accedere all'opportunità</p>
                    </div>

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
