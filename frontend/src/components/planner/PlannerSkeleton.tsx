export default function PlannerSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-40 rounded-3xl bg-[#F4E4EC]" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-[#FAF0F4]" />
        ))}
      </div>
      <div className="h-28 rounded-2xl bg-[#FAF0F4]" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-[#FAF0F4]" />
        ))}
      </div>
    </div>
  );
}
