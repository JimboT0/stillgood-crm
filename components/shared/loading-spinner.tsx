"use client"

interface LoadingSpinnerProps {
  message?: string
  size?: "sm" | "md" | "lg"
}

export function LoadingSpinner({ message = "Loading...", size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }

  const containerPadding = {
    sm: "py-4",
    md: "py-8",
    lg: "py-12",
  }

  return (
    <div className={`flex flex-col items-center justify-center ${containerPadding[size]} px-4`}>
      <div
        className={`${sizeClasses[size]} bg-orange-500 rounded-lg flex items-center justify-center mb-3 animate-pulse`}
      >
        <div className="w-1/2 h-1/2 bg-white rounded" />
      </div>
      <p className="text-muted-foreground text-sm text-center">{message}</p>
    </div>
  )
}
