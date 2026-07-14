export function StatCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
      <div className="h-8 w-16 bg-gray-200 rounded" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-100 rounded-lg" />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card text-center py-12">
      <h3 className="font-display text-xl text-wow-text mb-2">{title}</h3>
      {description && <p className="text-wow-muted mb-6 max-w-md mx-auto">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="card border-red-100 bg-red-50 text-red-700">
      {message || 'Something went wrong. Please try again.'}
    </div>
  );
}

export function ProfileProgress({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex justify-between text-xs text-wow-muted mb-1">
        <span>Profile completion</span>
        <span>{clamped}%</span>
      </div>
      <div className="h-2 rounded-full bg-wow-secondary/50 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-wow-primary to-wow-primary-light transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    draft: 'bg-gray-100 text-gray-600',
    inactive: 'bg-red-100 text-red-700',
    completed: 'bg-green-100 text-green-700',
    in_progress: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-gray-100 text-gray-600',
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-slate-100 text-slate-600',
  };
  return (
    <span
      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
        styles[status] || 'bg-gray-100 text-gray-600'
      }`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
