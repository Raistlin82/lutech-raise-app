import { useState } from 'react';
import type { Opportunity } from '../../types';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertTriangle, Plus, Trash2, Edit3 } from 'lucide-react';
import { clsx } from 'clsx';
import { calculateRaiseLevel } from '../../lib/raiseLogic';
import { useOpportunities } from '../../stores/OpportunitiesStore';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { useTranslation } from 'react-i18next';

export const OpportunitiesPage = () => {
    const { t } = useTranslation('opportunities');
    const navigate = useNavigate();
    const { opportunities, selectOpportunity, deleteOpportunity, selectedOpp } = useOpportunities();
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; opp: Opportunity | null }>({
        isOpen: false,
        opp: null
    });

    const handleSelectOpp = (opp: Opportunity) => {
        selectOpportunity(opp);
        navigate(`/opportunity/${opp.id}`);
    };

    const handleDeleteClick = (opp: Opportunity, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        setDeleteConfirm({ isOpen: true, opp });
    };

    const handleDeleteConfirm = () => {
        if (deleteConfirm.opp) {
            deleteOpportunity(deleteConfirm.opp.id);

            // If we're deleting the currently selected opportunity, clear selection and go to dashboard
            if (selectedOpp?.id === deleteConfirm.opp.id) {
                selectOpportunity(null);
                navigate('/');
            }
        }
        setDeleteConfirm({ isOpen: false, opp: null });
    };

    const handleEditClick = (opp: Opportunity, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        navigate(`/opportunities/${opp.id}/edit`);
    };

    return (
        <>
            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                title={t('actions.delete')}
                message={`${t('actions.deleteConfirm').replace('{{title}}', deleteConfirm.opp?.title || '')} Questa azione non può essere annullata.`}
                confirmLabel={t('actions.delete')}
                cancelLabel={t('actions.cancel')}
                variant="danger"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteConfirm({ isOpen: false, opp: null })}
            />

            <div className="space-y-8 animate-slide-up">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-8 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full" />
                            <h1 className="text-3xl font-bold text-gradient-primary">{t('list.title')}</h1>
                        </div>
                        <p className="text-slate-500 text-lg ml-6">{t('list.subtitle')}</p>
                    </div>
                    <button
                        onClick={() => navigate('/opportunities/new')}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={20} strokeWidth={2.5} />
                        {t('actions.create')}
                    </button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {opportunities.length === 0 ? (
                        <div className="text-center py-16 card-elevated">
                            <p className="text-slate-500 font-semibold text-lg">{t('list.empty')}</p>
                            <p className="text-slate-400 text-sm mt-2">{t('list.createFirst')}</p>
                        </div>
                    ) : (
                        opportunities.map((opp, idx) => (
                            <OpportunityCard
                                key={opp.id}
                                opp={opp}
                                onClick={() => handleSelectOpp(opp)}
                                onEdit={(e) => handleEditClick(opp, e)}
                                onDelete={(e) => handleDeleteClick(opp, e)}
                                delay={idx * 100}
                            />
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

interface OpportunityCardProps {
    opp: Opportunity;
    onClick: () => void;
    onEdit: (e: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent) => void;
    delay?: number;
}

const OpportunityCard = ({ opp, onClick, onEdit, onDelete, delay = 0 }: OpportunityCardProps) => {
    const { t } = useTranslation('opportunities');
    const calculatedLevel = calculateRaiseLevel(opp);
    const isRisky = opp.hasKcpDeviations;

    return (
        <div
            onClick={onClick}
            style={{ animationDelay: `${delay}ms` }}
            className="group card-elevated p-0 rounded-2xl cursor-pointer relative overflow-hidden hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 animate-slide-up"
        >
            {/* Action Buttons - positioned in top right */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                    onClick={onEdit}
                    className="p-2.5 text-slate-400 hover:text-cyan-600 hover:bg-white rounded-xl transition-all shadow-md hover:shadow-lg"
                    title={t('actions.edit')}
                >
                    <Edit3 size={18} strokeWidth={2.5} />
                </button>
                <button
                    onClick={onDelete}
                    className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl transition-all shadow-md hover:shadow-lg"
                    title={t('actions.delete')}
                >
                    <Trash2 size={18} strokeWidth={2.5} />
                </button>
            </div>

            {/* Status indicator bar */}
            <div className={clsx(
                "absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover:w-1.5",
                isRisky
                    ? "bg-gradient-to-b from-amber-400 to-orange-600"
                    : opp.currentPhase === 'Won'
                        ? "bg-gradient-to-b from-emerald-400 to-teal-600"
                        : "bg-gradient-to-b from-cyan-400 to-blue-600"
            )} />

            {/* Subtle hover gradient */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500 bg-gradient-to-br from-cyan-500 to-blue-600" />

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
                                        <AlertTriangle size={12} strokeWidth={2.5} /> High Risk
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <span className="font-medium">{opp.clientName || 'Cliente'}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <span>{opp.industry}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Metrics */}
                    <div className="flex items-center gap-6 lg:gap-8 border-t lg:border-t-0 lg:border-l border-slate-100 pt-5 lg:pt-0 lg:pl-8">
                        {/* TCV */}
                        <div className="flex flex-col gap-1.5">
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Value</span>
                            <span className="font-bold text-slate-900 text-base">
                                €{(opp.tcv / 1000).toFixed(0)}k
                            </span>
                        </div>

                        {/* Phase */}
                        <div className="flex flex-col gap-1.5">
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Phase</span>
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
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Level</span>
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
