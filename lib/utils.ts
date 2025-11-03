import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp } from "firebase/firestore"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const safeDateToTimestamp = (date: any): Timestamp | null => {
  if (!date) return null

  if (date instanceof Date) {
    return Timestamp.fromDate(date)
  }

  if (date instanceof Timestamp) {
    return date
  }

  if (typeof date === "string" || typeof date === "number") {
    const parsed = new Date(date)
    if (!isNaN(parsed.getTime())) {
      return Timestamp.fromDate(parsed)
    }
  }

  return null
}
