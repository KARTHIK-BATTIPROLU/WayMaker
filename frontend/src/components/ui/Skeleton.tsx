export function SkeletonCard() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="h-4 bg-white/[0.08] rounded w-3/4 mb-4"></div>
      <div className="h-3 bg-white/[0.06] rounded w-full mb-2"></div>
      <div className="h-3 bg-white/[0.06] rounded w-5/6 mb-2"></div>
      <div className="h-3 bg-white/[0.06] rounded w-4/6"></div>
    </div>
  )
}

export function SkeletonLine({ width = 'full' }: { width?: string }) {
  return <div className={`h-3 bg-white/[0.08] rounded w-${width} animate-pulse`}></div>
}

export function SkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  )
}
