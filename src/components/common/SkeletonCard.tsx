export const SkeletonCard = () => {
  return (
    <div className="card-elevated p-6 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-slate-200 rounded-2xl" />
        <div className="flex-1 space-y-3">
          <div className="h-6 bg-slate-200 rounded w-3/4" />
          <div className="h-4 bg-slate-200 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
};
