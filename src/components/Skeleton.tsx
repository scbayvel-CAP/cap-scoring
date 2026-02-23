'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200',
        className
      )}
    />
  )
}

// Pre-built skeleton patterns for common UI elements

export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('card', className)}>
      <Skeleton className="h-4 w-1/3 mb-2" />
      <Skeleton className="h-8 w-1/2 mb-1" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  )
}

export function SkeletonTableRow({ columns = 4 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SkeletonAthleteRow() {
  return (
    <div className="card flex items-center gap-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-8 w-24" />
    </div>
  )
}

export function SkeletonAthleteList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonAthleteRow key={i} />
      ))}
    </div>
  )
}

export function SkeletonStatsGrid() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonLeaderboard({ rows = 10 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden p-0">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 w-16"><Skeleton className="h-4 w-8" /></th>
            <th className="px-4 py-3"><Skeleton className="h-4 w-20" /></th>
            <th className="px-4 py-3 w-16"><Skeleton className="h-4 w-4 mx-auto" /></th>
            <th className="px-4 py-3 w-16"><Skeleton className="h-4 w-4 mx-auto" /></th>
            <th className="px-4 py-3 w-16"><Skeleton className="h-4 w-4 mx-auto" /></th>
            <th className="px-4 py-3 w-16"><Skeleton className="h-4 w-4 mx-auto" /></th>
            <th className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td className="px-4 py-3">
                <Skeleton className="h-8 w-8 rounded-full" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </td>
              <td className="px-4 py-3"><Skeleton className="h-4 w-4 mx-auto" /></td>
              <td className="px-4 py-3"><Skeleton className="h-4 w-4 mx-auto" /></td>
              <td className="px-4 py-3"><Skeleton className="h-4 w-4 mx-auto" /></td>
              <td className="px-4 py-3"><Skeleton className="h-4 w-4 mx-auto" /></td>
              <td className="px-4 py-3"><Skeleton className="h-6 w-20 ml-auto" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SkeletonScoreEntry() {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 flex-1 rounded-md" />
        <Skeleton className="h-6 w-6" />
      </div>
    </div>
  )
}

export function SkeletonScoreEntryList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonScoreEntry key={i} />
      ))}
    </div>
  )
}
