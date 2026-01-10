import { Check, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import type { Phase } from '../../types';

interface WorkflowSidebarProps {
  phases: Phase[];
  currentPhase: Phase;
  activeTab: Phase;
  setActiveTab: (phase: Phase) => void;
  isFastTrack: boolean;
}

export const WorkflowSidebar = ({
  phases,
  currentPhase,
  activeTab,
  setActiveTab,
  isFastTrack,
}: WorkflowSidebarProps) => {
  return (
    <div className="w-full md:w-64 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-200 p-4 sticky top-0 md:relative z-10 backdrop-blur-xl md:backdrop-blur-none">
      <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
        {phases.map((phase) => {
          const isSkippedInFT = isFastTrack && (phase === 'ATP' || phase === 'ATS');
          const isPastPhase = phases.indexOf(phase) < phases.indexOf(currentPhase);

          return (
            <button
              key={phase}
              onClick={() => setActiveTab(phase)}
              disabled={phases.indexOf(phase) > phases.indexOf(currentPhase)}
              className={clsx(
                'whitespace-nowrap flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all min-w-[120px] md:min-w-0 md:w-full',
                activeTab === phase
                  ? 'bg-white shadow-md text-blue-600 border border-blue-100 ring-2 ring-blue-500/10'
                  : isSkippedInFT
                    ? 'text-slate-400 line-through opacity-50 border border-transparent'
                    : isPastPhase
                      ? 'text-emerald-600 hover:bg-emerald-50 border border-transparent'
                      : phases.indexOf(phase) > phases.indexOf(currentPhase)
                        ? 'text-slate-300 cursor-not-allowed border border-transparent'
                        : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-900 border border-transparent'
              )}
            >
              {isPastPhase && <Check size={16} className="mr-1" />}
              {phase}
              {activeTab === phase && <ChevronRight size={16} className="hidden md:block" />}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
