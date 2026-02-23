import { Navigation } from '@/components/Navigation'
import { Skeleton } from '@/components/Skeleton'

export default function DashboardLoading() {
  return (
    <div>
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
