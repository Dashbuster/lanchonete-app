"use client"

import { cn } from "@/utils/cn"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "skeleton-shimmer rounded bg-dark-700",
        className
      )}
    />
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border border-dark-600 bg-dark-800 overflow-hidden">
      {/* Image placeholder */}
      <div className="relative aspect-video w-full overflow-hidden">
        <Skeleton className="absolute inset-0" />
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-pulse" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    </div>
  )
}

export function CategoryPillSkeleton() {
  return <Skeleton className="h-10 w-24 rounded-full" />
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-dark-600 bg-dark-800 p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="w-12 h-12 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders table */}
      <div className="rounded-xl border border-dark-600 bg-dark-800 p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function CartDrawerSkeleton() {
  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 bg-dark-800 border-l border-dark-600 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-dark-600">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-12" />
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 p-3 bg-dark-700 rounded-lg">
            <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-dark-600 px-4 py-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    </div>
  )
}

export function CheckoutSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Steps */}
      <div className="flex items-center justify-center gap-0">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-16 h-4 ml-2" />
            {step < 3 && <Skeleton className="w-16 h-0.5 mx-1" />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
