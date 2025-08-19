import type React from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.ComponentProps<"div"> {
  variant?: "default" | "text" | "circular" | "rectangular"
}

function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  const variants = {
    default: "bg-muted animate-pulse rounded-md",
    text: "bg-muted animate-pulse rounded h-4",
    circular: "bg-muted animate-pulse rounded-full",
    rectangular: "bg-muted animate-pulse rounded-sm",
  }

  return <div data-slot="skeleton" className={cn(variants[variant], className)} {...props} />
}

function SkeletonCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("border rounded-lg p-4 space-y-3", className)} {...props}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton variant="circular" className="h-4 w-4" />
      </div>
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

function SkeletonTable({
  rows = 5,
  cols = 6,
  className,
  ...props
}: { rows?: number; cols?: number } & React.ComponentProps<"div">) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {/* Mobile: Stack vertically, Desktop: Table layout */}
      <div className="hidden md:block">
        <div className="grid gap-4 pb-2 border-b" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid gap-4 py-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className="h-4 w-full" />
            ))}
          </div>
        ))}
      </div>

      {/* Mobile: Card-like layout */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="border rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonTable }
