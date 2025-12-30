import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Database,
    HardDrive,
    ArrowRight,
    ArrowLeft,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    AlertTriangle,
    Loader2
} from 'lucide-react';
import { clsx } from 'clsx';
import * as migrationService from '../../services/migrationService';
import type { MigrationStatus, MigrationResult } from '../../services/migrationService';

type MigrationDirection = 'toSupabase' | 'toLocal';

export const DataMigrationPanel = () => {
    const { t } = useTranslation('settings');
    const [status, setStatus] = useState<MigrationStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [migrating, setMigrating] = useState(false);
    const [result, setResult] = useState<MigrationResult | { success: boolean; error?: string } | null>(null);
    const [showConfirm, setShowConfirm] = useState<MigrationDirection | null>(null);

    const canMigrate = migrationService.canMigrate();

    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        setLoading(true);
        try {
            const migrationStatus = await migrationService.getMigrationStatus();
            setStatus(migrationStatus);
        } catch (error) {
            console.error('Error loading migration status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMigrateToSupabase = async (overwrite: boolean = false) => {
        setMigrating(true);
        setResult(null);
        setShowConfirm(null);
        try {
            const migrationResult = await migrationService.migrateToSupabase({
                clearLocalAfter: false,
                overwriteExisting: overwrite
            });
            setResult(migrationResult);
            await loadStatus(); // Refresh status
        } catch (error) {
            setResult({
                success: false,
                customersCount: 0,
                opportunitiesCount: 0,
                controlsCount: 0,
                errors: [error instanceof Error ? error.message : 'Errore sconosciuto'],
                warnings: []
            });
        } finally {
            setMigrating(false);
        }
    };

    const handleExportToLocal = async () => {
        setMigrating(true);
        setResult(null);
        setShowConfirm(null);
        try {
            const exportResult = await migrationService.exportToLocalStorage();
            setResult(exportResult);
            await loadStatus(); // Refresh status
        } catch (error) {
            setResult({
                success: false,
                error: error instanceof Error ? error.message : 'Errore sconosciuto'
            });
        } finally {
            setMigrating(false);
        }
    };

    if (!canMigrate) {
        return (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <h3 className="font-semibold text-amber-800">{t('migration.notConfigured')}</h3>
                        <p className="text-sm text-amber-700 mt-1">
                            {t('migration.notConfiguredDesc')}
                        </p>
                        <p className="text-xs text-amber-600 mt-2 font-mono">
                            VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">{t('migration.title')}</h3>
                        <p className="text-sm text-slate-500 mt-1">{t('migration.subtitle')}</p>
                    </div>
                    <button
                        onClick={loadStatus}
                        disabled={loading}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={clsx(loading && 'animate-spin')} />
                    </button>
                </div>
            </div>

            {/* Status Section */}
            <div className="p-6 bg-slate-50 border-b border-slate-100">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="animate-spin text-slate-400" size={24} />
                    </div>
                ) : status ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Local Storage */}
                        <div className="bg-white rounded-lg border border-slate-200 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <HardDrive className="text-slate-500" size={20} />
                                <span className="font-semibold text-slate-700">{t('migration.localStorage')}</span>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">{t('migration.customers')}:</span>
                                    <span className="font-medium text-slate-700">{status.localCounts.customers}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">{t('migration.opportunities')}:</span>
                                    <span className="font-medium text-slate-700">{status.localCounts.opportunities}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">{t('migration.controls')}:</span>
                                    <span className="font-medium text-slate-700">{status.localCounts.controls}</span>
                                </div>
                            </div>
                            {status.hasLocalData && (
                                <div className="mt-3 pt-3 border-t border-slate-100">
                                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                        <CheckCircle size={12} /> {t('migration.hasData')}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Supabase */}
                        <div className="bg-white rounded-lg border border-slate-200 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Database className="text-emerald-500" size={20} />
                                <span className="font-semibold text-slate-700">Supabase</span>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">{t('migration.customers')}:</span>
                                    <span className="font-medium text-slate-700">{status.supabaseCounts.customers}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">{t('migration.opportunities')}:</span>
                                    <span className="font-medium text-slate-700">{status.supabaseCounts.opportunities}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">{t('migration.controls')}:</span>
                                    <span className="font-medium text-slate-700">{status.supabaseCounts.controls}</span>
                                </div>
                            </div>
                            {status.hasSupabaseData && (
                                <div className="mt-3 pt-3 border-t border-slate-100">
                                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                        <CheckCircle size={12} /> {t('migration.hasData')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Actions Section */}
            <div className="p-6 space-y-4">
                {/* Result Message */}
                {result && (
                    <div className={clsx(
                        'p-4 rounded-lg',
                        result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    )}>
                        <div className="flex items-start gap-3">
                            {result.success ? (
                                <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                            ) : (
                                <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
                            )}
                            <div className="flex-1">
                                <p className={clsx(
                                    'font-medium',
                                    result.success ? 'text-green-800' : 'text-red-800'
                                )}>
                                    {result.success ? t('migration.success') : t('migration.error')}
                                </p>
                                {'customersCount' in result && (
                                    <p className="text-sm text-green-700 mt-1">
                                        {t('migration.migratedCounts', {
                                            customers: result.customersCount,
                                            opportunities: result.opportunitiesCount,
                                            controls: result.controlsCount
                                        })}
                                    </p>
                                )}
                                {'errors' in result && result.errors.length > 0 && (
                                    <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
                                        {result.errors.map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                )}
                                {'warnings' in result && result.warnings.length > 0 && (
                                    <ul className="text-sm text-amber-700 mt-2 list-disc list-inside">
                                        {result.warnings.map((warn, i) => (
                                            <li key={i}>{warn}</li>
                                        ))}
                                    </ul>
                                )}
                                {'error' in result && result.error && (
                                    <p className="text-sm text-red-700 mt-1">{result.error}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Migration Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Migrate to Supabase */}
                    <button
                        onClick={() => {
                            if (status?.hasSupabaseData) {
                                setShowConfirm('toSupabase');
                            } else {
                                handleMigrateToSupabase(false);
                            }
                        }}
                        disabled={migrating || !status?.hasLocalData}
                        className={clsx(
                            'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors',
                            status?.hasLocalData
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/30'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        )}
                    >
                        {migrating ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <>
                                <HardDrive size={18} />
                                <ArrowRight size={16} />
                                <Database size={18} />
                            </>
                        )}
                        <span className="ml-2">{t('migration.migrateToSupabase')}</span>
                    </button>

                    {/* Export to Local */}
                    <button
                        onClick={() => {
                            if (status?.hasLocalData) {
                                setShowConfirm('toLocal');
                            } else {
                                handleExportToLocal();
                            }
                        }}
                        disabled={migrating || !status?.hasSupabaseData}
                        className={clsx(
                            'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors',
                            status?.hasSupabaseData
                                ? 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        )}
                    >
                        {migrating ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <>
                                <Database size={18} />
                                <ArrowLeft size={16} />
                                <HardDrive size={18} />
                            </>
                        )}
                        <span className="ml-2">{t('migration.exportToLocal')}</span>
                    </button>
                </div>

                <p className="text-xs text-slate-500 text-center">
                    {t('migration.hint')}
                </p>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-amber-100 rounded-full">
                                    <AlertTriangle className="text-amber-600" size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    {t('migration.confirmTitle')}
                                </h3>
                            </div>
                            <p className="text-slate-600 mb-6">
                                {showConfirm === 'toSupabase'
                                    ? t('migration.confirmOverwrite')
                                    : t('migration.confirmExport')
                                }
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirm(null)}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                                >
                                    {t('migration.cancel')}
                                </button>
                                <button
                                    onClick={() => {
                                        if (showConfirm === 'toSupabase') {
                                            handleMigrateToSupabase(true);
                                        } else {
                                            handleExportToLocal();
                                        }
                                    }}
                                    className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                                >
                                    {t('migration.confirm')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
