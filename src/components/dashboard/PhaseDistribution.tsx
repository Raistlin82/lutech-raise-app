import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Opportunity } from '../../types';
import { clsx } from 'clsx';

interface PhaseDistributionProps {
    opportunities: Opportunity[];
}

const PHASES = ['Planning', 'ATP', 'ATS', 'ATC', 'Handover', 'Won'] as const;

const PHASE_COLORS: Record<string, { bg: string; bar: string; text: string }> = {
    Planning: { bg: 'bg-slate-100', bar: 'bg-gradient-to-r from-slate-400 to-slate-500', text: 'text-slate-700' },
    ATP: { bg: 'bg-cyan-50', bar: 'bg-gradient-to-r from-cyan-400 to-cyan-600', text: 'text-cyan-700' },
    ATS: { bg: 'bg-blue-50', bar: 'bg-gradient-to-r from-blue-400 to-blue-600', text: 'text-blue-700' },
    ATC: { bg: 'bg-indigo-50', bar: 'bg-gradient-to-r from-indigo-400 to-indigo-600', text: 'text-indigo-700' },
    Handover: { bg: 'bg-violet-50', bar: 'bg-gradient-to-r from-violet-400 to-violet-600', text: 'text-violet-700' },
    Won: { bg: 'bg-emerald-50', bar: 'bg-gradient-to-r from-emerald-400 to-emerald-600', text: 'text-emerald-700' },
};

export const PhaseDistribution = ({ opportunities }: PhaseDistributionProps) => {
    const { t } = useTranslation('dashboard');

    const distribution = useMemo(() => {
        const counts: Record<string, number> = {};
        PHASES.forEach(phase => { counts[phase] = 0; });

        opportunities.forEach(opp => {
            if (counts[opp.currentPhase] !== undefined) {
                counts[opp.currentPhase]++;
            }
        });

        const total = opportunities.length;
        const maxCount = Math.max(...Object.values(counts), 1);

        return PHASES.map(phase => ({
            phase,
            count: counts[phase],
            percentage: total > 0 ? (counts[phase] / total) * 100 : 0,
            barWidth: (counts[phase] / maxCount) * 100,
        }));
    }, [opportunities]);

    const total = opportunities.length;

    return (
        <div className="card-elevated p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">{t('phaseDistribution.title')}</h3>
                    <p className="text-sm text-slate-500">{t('phaseDistribution.subtitle')}</p>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-bold text-slate-900">{total}</span>
                    <span className="text-sm text-slate-500 ml-1">{t('phaseDistribution.opportunities')}</span>
                </div>
            </div>

            {total === 0 ? (
                <div className="text-center py-8 text-slate-400">
                    {t('phaseDistribution.noData')}
                </div>
            ) : (
                <div className="space-y-3">
                    {distribution.map(({ phase, count, percentage, barWidth }, idx) => (
                        <div
                            key={phase}
                            className="group"
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                    <span className={clsx(
                                        "text-sm font-semibold",
                                        PHASE_COLORS[phase].text
                                    )}>
                                        {phase}
                                    </span>
                                    {count > 0 && (
                                        <span className="text-xs text-slate-400">
                                            ({percentage.toFixed(0)}%)
                                        </span>
                                    )}
                                </div>
                                <span className={clsx(
                                    "text-sm font-bold",
                                    count > 0 ? PHASE_COLORS[phase].text : 'text-slate-300'
                                )}>
                                    {count}
                                </span>
                            </div>
                            <div className={clsx(
                                "h-3 rounded-full overflow-hidden",
                                PHASE_COLORS[phase].bg
                            )}>
                                <div
                                    className={clsx(
                                        "h-full rounded-full transition-all duration-700 ease-out",
                                        PHASE_COLORS[phase].bar,
                                        count === 0 && "opacity-0"
                                    )}
                                    style={{
                                        width: `${barWidth}%`,
                                        transitionDelay: `${idx * 100}ms`
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
