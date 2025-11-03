"use client"

import { useEffect, useState } from "react"
import ParticleBackground from "./particle-background"

interface LoadingScreenProps {
  onComplete?: () => void
  duration?: number
}

export default function LoadingScreen({ onComplete, duration = 3000 }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => onComplete?.(), 500)
          return 100
        }
        return prev + 100 / (duration / 100)
      })
    }, 100)

    return () => clearInterval(interval)
  }, [duration, onComplete])

  return (
    <div className="fixed inset-0 bg-gray-100 flex items-center justify-center">
      <div className="relative z-10 text-center">
        <div className="w-64 h-2 bg-gray-300 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-[#ff5900] transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-gray-600 text-sm">Loading... {Math.round(progress)}%</p>
      </div>
    </div>
  )
}
