import { clsx } from 'clsx';

interface MetricProps {
  label: string;
  value: string | number;
  color?: string;
  icon?: React.ReactNode;
}

export const Metric = ({ label, value, color = 'text-white', icon }: MetricProps) => (
  <div>
    <div className="text-slate-400 text-[10px] font-bold uppercase mb-1 tracking-wider">{label}</div>
    <div className={clsx('font-semibold flex items-center gap-2 text-sm md:text-base', color)}>
      {icon} {value}
    </div>
  </div>
);
