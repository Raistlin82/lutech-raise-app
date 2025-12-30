import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Opportunity } from '../../types';
import { calculateRaiseLevel } from '../../lib/raiseLogic';
import { clsx } from 'clsx';
import { Shield, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

interface LevelDistributionProps {
    opportunities: Opportunity[];
}

const LEVELS = ['L1', 'L2', 'L3', 'L4'] as const;

const LEVEL_CONFIG: Record<string, {
    gradient: string;
    bg: string;
    border: string;
    text: string;
    icon: React.ReactNode;
    description: string;
}> = {
    L1: {
        gradient: 'from-emerald-500 to-teal-600',
        bg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        icon: <ShieldCheck size={20} strokeWidth={2.5} />,
        description: 'Fast Track',
    },
    L2: {
        gradient: 'from-cyan-500 to-blue-600',
        bg: 'bg-gradient-to-br from-cyan-50 to-blue-50',
        border: 'border-cyan-200',
        text: 'text-cyan-700',
        icon: <Shield size={20} strokeWidth={2.5} />,
        description: 'Standard',
    },
    L3: {
        gradient: 'from-amber-500 to-orange-600',
        bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        icon: <ShieldAlert size={20} strokeWidth={2.5} />,
        description: 'Elevato',
    },
    L4: {
        gradient: 'from-red-500 to-rose-600',
        bg: 'bg-gradient-to-br from-red-50 to-rose-50',
        border: 'border-red-200',
        text: 'text-red-700',
        icon: <ShieldX size={20} strokeWidth={2.5} />,
        description: 'Critico',
    },
};

export const LevelDistribution = ({ opportunities }: LevelDistributionProps) => {
    const { t } = useTranslation('dashboard');

    const distribution = useMemo(() => {
        const data: Record<string, { count: number; totalTcv: number }> = {};
        LEVELS.forEach(level => { data[level] = { count: 0, totalTcv: 0 }; });

        opportunities.forEach(opp => {
            const level = calculateRaiseLevel(opp);
            if (data[level]) {
                data[level].count++;
                data[level].totalTcv += opp.tcv;
            }
        });

        return LEVELS.map(level => ({
            level,
            ...data[level],
            config: LEVEL_CONFIG[level],
        }));
    }, [opportunities]);

    const total = opportunities.length;

    return (
        <div className="card-elevated p-6">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900">{t('levelDistribution.title')}</h3>
                <p className="text-sm text-slate-500">{t('levelDistribution.subtitle')}</p>
            </div>

            {total === 0 ? (
                <div className="text-center py-8 text-slate-400">
                    {t('levelDistribution.noData')}
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {distribution.map(({ level, count, totalTcv, config }, idx) => (
                        <div
                            key={level}
                            className={clsx(
                                "relative p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 cursor-default",
                                config.bg,
                                config.border,
                                count === 0 && "opacity-50"
                            )}
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            {/* Level badge */}
                            <div className="flex items-center justify-between mb-3">
                                <div className={clsx(
                                    "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br",
                                    config.gradient
                                )}>
                                    {config.icon}
                                </div>
                                <span className={clsx(
                                    "text-2xl font-bold",
                                    config.text
                                )}>
                                    {level}
                                </span>
                            </div>

                            {/* Description */}
                            <p className={clsx(
                                "text-xs font-semibold uppercase tracking-wider mb-3",
                                config.text
                            )}>
                                {config.description}
                            </p>

                            {/* Stats */}
                            <div className="space-y-1">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-bold text-slate-900">{count}</span>
                                    <span className="text-xs text-slate-500">
                                        {count === 1 ? t('levelDistribution.opportunities').slice(0, -1) : t('levelDistribution.opportunities')}
                                    </span>
                                </div>
                                {count > 0 && (
                                    <div className="text-sm text-slate-600">
                                        €{(totalTcv / 1000).toFixed(0)}k
                                    </div>
                                )}
                            </div>

                            {/* Percentage indicator */}
                            {total > 0 && count > 0 && (
                                <div className="absolute top-2 right-2">
                                    <span className={clsx(
                                        "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                                        config.bg,
                                        config.text
                                    )}>
                                        {((count / total) * 100).toFixed(0)}%
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
