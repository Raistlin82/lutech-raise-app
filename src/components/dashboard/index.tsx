import { useState, useEffect } from 'react';
import type { Opportunity } from '../../types';
import { calculateRaiseLevel } from '../../lib/raiseLogic';
import { AlertTriangle, ArrowRight, DollarSign, Activity, Trash2, Edit3 } from 'lucide-react';
import { clsx } from 'clsx';
import { useOpportunities } from '../../stores/OpportunitiesStore';
import { ConfirmModal } from '../common/ConfirmModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { SkeletonCard } from '../common/SkeletonCard';
import { PhaseDistribution } from './PhaseDistribution';
import { LevelDistribution } from './LevelDistribution';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const Dashboard = ({ onSelectOpp }: { onSelectOpp: (opp: Opportunity) => void }) => {
    const { t } = useTranslation('dashboard');
    const { t: tCommon } = useTranslation('common');
    const navigate = useNavigate();
    const { opportunities, deleteOpportunity, selectOpportunity, selectedOpp } = useOpportunities();
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; opp: Opportunity | null }>({
        isOpen: false,
        opp: null
    });

    useEffect(() => {
        // Immediate load (delay removed for test compatibility)
        setIsLoading(false);
    }, []);

    const totalTCV = opportunities.reduce((sum, opp) => sum + opp.tcv, 0);
    const activeCount = opportunities.length;
    const criticalCount = opportunities.filter(opp => opp.hasKcpDeviations).length;
    const inProgressCount = opportunities.filter(o => o.currentPhase !== 'Won').length;

    const handleDeleteClick = (opp: Opportunity, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteConfirm({ isOpen: true, opp });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm.opp) return;

        setDeletingId(deleteConfirm.opp.id);

        try {
            // Delay removed for test compatibility
            deleteOpportunity(deleteConfirm.opp.id);
            if (selectedOpp?.id === deleteConfirm.opp.id) {
                selectOpportunity(null);
            }
        } finally {
            setDeletingId(null);
            setDeleteConfirm({ isOpen: false, opp: null });
        }
    };

    const handleEditClick = (opp: Opportunity, e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/opportunities/${opp.id}/edit`);
    };

    if (isLoading) {
        return (
            <div className="space-y-8 animate-slide-up">
                <div className="flex items-center gap-3">
                    <LoadingSpinner />
                    <h1 className="text-4xl font-bold text-slate-900">{tCommon('message.loading')}</h1>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                </div>
            </div>
        );
    }

    return (
        <>
            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                title={t('deleteConfirm.title')}
                message={t('deleteConfirm.message', { title: deleteConfirm.opp?.title })}
                confirmLabel={t('deleteConfirm.confirm')}
                cancelLabel={t('deleteConfirm.cancel')}
                variant="danger"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteConfirm({ isOpen: false, opp: null })}
            />

            <div className="space-y-8 animate-slide-up">
            {/* Page Header */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full" />
                    <h1 className="text-4xl font-bold text-gradient-primary">{t('title')}</h1>
                </div>
                <p className="text-slate-500 text-lg ml-6">{t('subtitle')}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title={t('stats.totalPipelineValue')}
                    value={`€${(totalTCV / 1000000).toFixed(2)}M`}
                    subtitle={t('stats.totalContractValue')}
                    icon={<DollarSign size={24} strokeWidth={2.5} />}
                    gradient="from-emerald-500 via-teal-500 to-cyan-600"
                    trend={`${opportunities.length} ${t('stats.opportunities')}`}
                    trendUp={true}
                />
                <StatCard
                    title={t('stats.activeOpportunities')}
                    value={activeCount.toString()}
                    subtitle={t('stats.acrossAllPhases')}
                    icon={<Activity size={24} strokeWidth={2.5} />}
                    gradient="from-cyan-500 via-blue-500 to-indigo-600"
                    trend={`${inProgressCount} ${t('stats.inProgress')}`}
                    trendUp={inProgressCount > 0}
                />
                <StatCard
                    title={t('stats.criticalRisks')}
                    value={criticalCount.toString()}
                    subtitle={t('stats.kcpDeviations')}
                    icon={<AlertTriangle size={24} strokeWidth={2.5} />}
                    gradient="from-amber-500 via-orange-500 to-red-600"
                    trend={criticalCount > 0 ? t('stats.actionRequired') : t('stats.allClear')}
                    trendUp={false}
                />
            </div>

            {/* Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PhaseDistribution opportunities={opportunities} />
                <LevelDistribution opportunities={opportunities} />
            </div>

            {/* Opportunities List */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-gradient-primary">
                            {t('activeWorkflows.title')}
                        </h2>
                        <span className="bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 text-xs font-bold px-3 py-1.5 rounded-full border border-cyan-200/50 uppercase tracking-wider">
                            {opportunities.length} {t('activeWorkflows.total')}
                        </span>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {opportunities.map((opp, idx) => (
                        <OpportunityCard
                            key={opp.id}
                            opp={opp}
                            onClick={() => onSelectOpp(opp)}
                            onEdit={(e) => handleEditClick(opp, e)}
                            onDelete={(e) => handleDeleteClick(opp, e)}
                            delay={idx * 100}
                            isDeleting={deletingId === opp.id}
                            t={t}
                        />
                    ))}
                </div>
            </div>
            </div>
        </>
    );
};

interface StatCardProps {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ReactNode;
    gradient: string;
    trend: string;
    trendUp: boolean;
}

const StatCard = ({ title, value, subtitle, icon, gradient, trend, trendUp }: StatCardProps) => (
    <div
        className="card-elevated p-7 relative overflow-hidden group cursor-default transition-all duration-500 hover:scale-[1.02]"
        role="region"
        aria-label={`${title}: ${value}`}
    >
        {/* Animated background gradient */}
        <div className={clsx(
            "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-700 bg-gradient-to-br",
            gradient
        )}
            aria-hidden="true"
        />

        {/* Decorative corner accent */}
        <div className={clsx(
            "absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-all duration-700 bg-gradient-to-br",
            gradient
        )} />

        <div className="relative z-10 space-y-5">
            {/* Header with icon */}
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">{title}</p>
                    <p className="text-xs text-slate-400">{subtitle}</p>
                </div>
                <div className={clsx(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl bg-gradient-to-br",
                    gradient
                )}>
                    <div className="text-white">{icon}</div>
                </div>
            </div>

            {/* Value */}
            <div className="space-y-2">
                <h3 className="text-4xl font-bold text-slate-900 tracking-tight animate-counter">
                    {value}
                </h3>

                {/* Trend indicator */}
                <div className="flex items-center gap-2">
                    <div className={clsx(
                        "text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-lg",
                        trendUp
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                    )}>
                        {trend}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

interface OpportunityCardProps {
    opp: Opportunity;
    onClick: () => void;
    onEdit: (e: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent) => void;
    delay?: number;
    isDeleting?: boolean;
    t: (key: string, options?: Record<string, unknown>) => string;
}

const OpportunityCard = ({ opp, onClick, onEdit, onDelete, delay = 0, isDeleting = false, t }: OpportunityCardProps) => {
    const calculatedLevel = calculateRaiseLevel(opp);
    const isRisky = opp.hasKcpDeviations;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
        }
    };

    const clientName = opp.clientName || t('opportunityCard.defaultClient');
    const ariaLabel = t('opportunityCard.ariaLabel', {
        title: opp.title,
        client: clientName,
        value: (opp.tcv / 1000).toFixed(0),
        phase: opp.currentPhase
    });

    return (
        <div
            onClick={onClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="button"
            aria-label={ariaLabel}
            style={{ animationDelay: `${delay}ms` }}
            className={clsx(
                "group card-elevated p-0 rounded-2xl cursor-pointer relative overflow-hidden hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 animate-slide-up focus:outline-none focus:ring-4 focus:ring-cyan-300",
                isDeleting && "opacity-50 pointer-events-none"
            )}
        >
            {/* Action Buttons - positioned in top right */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200">
                <button
                    onClick={onEdit}
                    className="p-2.5 text-slate-400 hover:text-cyan-600 hover:bg-white rounded-xl transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-300"
                    aria-label={`${t('opportunityCard.editLabel')} ${opp.title}`}
                    title={t('opportunityCard.editLabel')}
                >
                    <Edit3 size={18} strokeWidth={2.5} aria-hidden="true" />
                </button>
                <button
                    onClick={onDelete}
                    className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-300"
                    aria-label={`${t('opportunityCard.deleteLabel')} ${opp.title}`}
                    title={t('opportunityCard.deleteLabel')}
                >
                    <Trash2 size={18} strokeWidth={2.5} aria-hidden="true" />
                </button>
            </div>

            {/* Status indicator bar */}
            <div
                className={clsx(
                    "absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover:w-1.5",
                    isRisky
                        ? "bg-gradient-to-b from-amber-400 to-orange-600"
                        : opp.currentPhase === 'Won'
                            ? "bg-gradient-to-b from-emerald-400 to-teal-600"
                            : "bg-gradient-to-b from-cyan-400 to-blue-600"
                )}
                aria-hidden="true"
            />

            {/* Subtle hover gradient */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500 bg-gradient-to-br from-cyan-500 to-blue-600"
                aria-hidden="true"
            />

            <div className="p-6 pl-8 relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                    {/* Left: Identity & Title */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Client avatar */}
                        <div className={clsx(
                            "w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg shadow-md shrink-0 transition-all duration-300 group-hover:scale-105 border-2",
                            isRisky
                                ? "bg-gradient-to-br from-amber-50 to-orange-50 text-amber-700 border-amber-200"
                                : "bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700 border-slate-200"
                        )}>
                            {(opp.clientName || 'CL').substring(0, 2).toUpperCase()}
                        </div>

                        {/* Title & metadata */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h3 className="font-bold text-lg text-slate-900 group-hover:text-cyan-700 transition-colors truncate">
                                    {opp.title}
                                </h3>
                                {isRisky && (
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-gradient-to-r from-amber-50 to-orange-50 px-2.5 py-1 rounded-lg border border-amber-200 shrink-0">
                                        <AlertTriangle size={12} strokeWidth={2.5} /> {t('opportunityCard.highRisk')}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <span className="font-medium">{opp.clientName || t('opportunityCard.defaultClient')}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <span>{opp.industry || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Metrics */}
                    <div className="flex items-center gap-6 lg:gap-8 border-t lg:border-t-0 lg:border-l border-slate-100 pt-5 lg:pt-0 lg:pl-8">
                        {/* TCV */}
                        <div className="flex flex-col gap-1.5">
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{t('opportunityCard.value')}</span>
                            <span className="font-bold text-slate-900 text-base">
                                €{(opp.tcv / 1000).toFixed(0)}k
                            </span>
                        </div>

                        {/* Phase */}
                        <div className="flex flex-col gap-1.5">
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{t('opportunityCard.phase')}</span>
                            <span className={clsx(
                                "phase-badge",
                                opp.currentPhase === 'Won'
                                    ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200"
                                    : "bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 border border-cyan-200"
                            )}>
                                {opp.currentPhase}
                            </span>
                        </div>

                        {/* RAISE Level */}
                        <div className="flex flex-col gap-1.5">
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{t('opportunityCard.level')}</span>
                            <div className={clsx(
                                "badge-level transition-all duration-300 group-hover:scale-110",
                                isRisky
                                    ? "bg-gradient-to-br from-amber-50 to-orange-50 text-amber-700 border-amber-300"
                                    : "bg-white text-slate-700 border-slate-300"
                            )}>
                                {calculatedLevel}
                            </div>
                        </div>

                        {/* Arrow indicator */}
                        <div className="hidden lg:flex text-slate-300 group-hover:text-cyan-600 group-hover:translate-x-2 transition-all duration-300">
                            <ArrowRight size={22} strokeWidth={2.5} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
