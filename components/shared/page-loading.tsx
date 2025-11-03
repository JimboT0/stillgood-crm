"use client"

interface PageLoadingProps {
  message?: string
}

export function PageLoading({ message = "Loading data..." }: PageLoadingProps) {
  return (
    <div className="flex items-center justify-center min-h-[50vh] w-full">
      <div className="text-center max-w-xs px-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white rounded" />
        </div>
        <p className="text-muted-foreground text-sm sm:text-base">{message}</p>
      </div>
    </div>
  )
}
