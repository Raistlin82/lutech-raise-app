import { Check } from 'lucide-react';
import { clsx } from 'clsx';

interface ProcessMapProps {
  phases: string[];
  currentPhase: string;
  isFastTrack: boolean;
}

export const ProcessMap = ({ phases, currentPhase, isFastTrack }: ProcessMapProps) => {
  return (
    <div className="flex items-center justify-between w-full max-w-4xl relative">
      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-700 -z-0 -translate-y-1/2" />
      {phases.map((phase, idx) => {
        const isActive = phase === currentPhase;
        const isCompleted = phases.indexOf(currentPhase) > idx;
        const isSkipped = isFastTrack && (phase === 'ATP' || phase === 'ATS');

        let statusColor = 'bg-slate-800 border-slate-600 text-slate-400';
        if (isActive) statusColor = 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/50';
        else if (isCompleted) statusColor = 'bg-emerald-500 border-emerald-400 text-white';
        else if (isSkipped) statusColor = 'bg-slate-800 border-amber-500/30 text-slate-600';

        return (
          <div key={phase} className="flex flex-col items-center gap-2 z-10 relative">
            <div
              className={clsx(
                'w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all',
                statusColor
              )}
            >
              {isCompleted ? <Check size={16} /> : idx + 1}
            </div>
            <span
              className={clsx(
                'text-[10px] font-medium uppercase tracking-wider whitespace-nowrap',
                isActive ? 'text-white font-bold' : isCompleted ? 'text-emerald-400' : 'text-slate-500',
                isSkipped && 'line-through'
              )}
            >
              {phase}
            </span>
          </div>
        );
      })}
    </div>
  );
};
