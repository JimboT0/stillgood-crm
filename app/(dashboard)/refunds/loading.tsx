import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton, SkeletonCard, SkeletonTable } from "@/components/ui/skeleton"

export default function RefundsLoading() {
  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="space-y-2">
          <Skeleton className="h-6 md:h-7 w-28 md:w-32" />
          <Skeleton className="h-3 md:h-4 w-52 md:w-64" />
        </div>
        <Skeleton className="h-9 md:h-10 w-full md:w-36" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} className="p-3 md:p-4" />
        ))}
      </div>

      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-4">
            <Skeleton className="h-9 md:h-10 w-full md:flex-1" />
            <Skeleton className="h-9 md:h-10 w-full md:w-48" />
            <Skeleton className="h-9 md:h-10 w-full md:w-48" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 md:pb-4">
          <Skeleton className="h-5 md:h-6 w-20 md:w-24" />
          <Skeleton className="h-3 md:h-4 w-40 md:w-48" />
        </CardHeader>
        <CardContent className="p-3 md:p-6">
          <SkeletonTable rows={8} cols={6} />
        </CardContent>
      </Card>
    </div>
  )
}
