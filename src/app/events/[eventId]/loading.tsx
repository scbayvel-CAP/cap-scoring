import { Navigation } from '@/components/Navigation'
import { Skeleton, SkeletonStatsGrid } from '@/components/Skeleton'

export default function EventLoading() {
  return (
    <div>
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        <SkeletonStatsGrid />

        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
