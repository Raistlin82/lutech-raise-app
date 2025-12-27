import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export const LoadingSpinner = ({ size = 24, className = '' }: LoadingSpinnerProps) => {
  return (
    <Loader2
      size={size}
      className={`animate-spin text-cyan-600 ${className}`}
      strokeWidth={2.5}
    />
  );
};
