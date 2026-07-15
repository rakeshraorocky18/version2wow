export default function MatchLoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-[20px] border border-gray-100 bg-white lg:flex"
          style={{ boxShadow: '0 6px 24px rgba(182, 106, 138, 0.06)' }}
        >
          <div className="h-64 w-full bg-gradient-to-br from-[#FFF0F4] to-gray-100 lg:w-64" />
          <div className="flex-1 space-y-4 p-6">
            <div className="flex justify-between gap-3">
              <div className="space-y-2">
                <div className="h-7 w-48 rounded-lg bg-gray-100" />
                <div className="h-4 w-32 rounded bg-gray-100" />
              </div>
              <div className="h-6 w-24 rounded-full bg-gray-100" />
            </div>
            <div className="h-10 w-full rounded-xl bg-gray-50" />
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((__, j) => (
                <div key={j} className="h-14 rounded-xl bg-gray-50" />
              ))}
            </div>
            <div className="h-2 rounded-full bg-gray-100" />
            <div className="flex items-center justify-between border-t border-gray-50 pt-4">
              <div className="flex gap-3">
                <div className="h-11 w-11 rounded-full bg-gray-100" />
                <div className="h-11 w-11 rounded-full bg-gray-100" />
              </div>
              <div className="h-11 w-36 rounded-2xl bg-gray-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
