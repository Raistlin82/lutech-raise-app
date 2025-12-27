import { LoadingSpinner } from './LoadingSpinner';

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay = ({ message = 'Caricamento...' }: LoadingOverlayProps) => {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
        <LoadingSpinner size={48} />
        <p className="text-slate-700 font-semibold">{message}</p>
      </div>
    </div>
  );
};
