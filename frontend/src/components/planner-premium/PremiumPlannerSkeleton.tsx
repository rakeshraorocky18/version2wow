export default function PremiumPlannerSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading planner dashboard">
      <div className="wow-skeleton h-64 rounded-3xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="wow-skeleton h-32 rounded-2xl" />
        ))}
      </div>
      <div className="wow-skeleton h-48 rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="wow-skeleton h-64 rounded-2xl" />
        <div className="wow-skeleton h-64 rounded-2xl" />
      </div>
    </div>
  );
}
