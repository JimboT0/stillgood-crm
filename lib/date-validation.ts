import { Timestamp } from "firebase/firestore"

/**
 * Centralized date validation and parsing utilities
 * All date-related validation should use these functions
 */

// Type guard for Firebase Timestamp objects (both proper and plain objects)
export const isValidTimestamp = (value: unknown): value is Timestamp => {
  return (
    value != null &&
    typeof value === "object" &&
    "seconds" in value &&
    "nanoseconds" in value &&
    typeof (value as any).seconds === "number" &&
    typeof (value as any).nanoseconds === "number" &&
    !isNaN((value as any).seconds) &&
    !isNaN((value as any).nanoseconds)
  )
}

// Convert Firebase Timestamp (both proper and plain objects) to JavaScript Date
export const timestampToDate = (timestamp: any): Date => {
  // If it's a proper Firestore Timestamp with toDate method
  if (typeof timestamp.toDate === "function") {
    return timestamp.toDate()
  }
  // If it's a plain object with seconds and nanoseconds
  if (timestamp.seconds && typeof timestamp.seconds === "number") {
    return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000)
  }
  throw new Error("Invalid timestamp format")
}

// Parse Firestore date fields (used in Firebase services)
export const parseFirestoreDate = (value: any): Date | null => {
  if (!value) return null

  if (value instanceof Timestamp) {
    return value.toDate()
  }

  if (value instanceof Date) {
    return value
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value)
    return isNaN(parsed.getTime()) ? null : parsed
  }

  if (isValidTimestamp(value)) {
    try {
      return timestampToDate(value)
    } catch {
      return null
    }
  }

  if (typeof value.toDate === "function") {
    return value.toDate()
  }

  return null
}

// Parse custom date formats (DDMMYY HH:mm, YYYY-MM-DDTHH:mm, etc.)
export const parseCustomDate = (dateString: string): Date | null => {
  // Remove any extra quotes from the date string
  const cleanedDateString = dateString.replace(/^"|"$/g, "")

  // Try DDMMYY HH:mm format
  let regex = /^(\d{2})(\d{2})(\d{2})\s(\d{2}):(\d{2})$/
  let match = cleanedDateString.match(regex)
  if (match) {
    const [_, day, month, year, hours, minutes] = match
    const fullYear = `20${year}`
    const isoDate = `${fullYear}-${month}-${day}T${hours}:${minutes}:00`
    const parsedDate = new Date(isoDate)
    return isNaN(parsedDate.getTime()) ? null : parsedDate
  }

  // Try YYYY-MM-DDTHH:mm format
  regex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
  match = cleanedDateString.match(regex)
  if (match) {
    const [_, year, month, day, hours, minutes] = match
    const isoDate = `${year}-${month}-${day}T${hours}:${minutes}:00`
    const parsedDate = new Date(isoDate)
    return isNaN(parsedDate.getTime()) ? null : parsedDate
  }

  // Try YYYY-MM-DD format
  regex = /^(\d{4})-(\d{2})-(\d{2})$/
  match = cleanedDateString.match(regex)
  if (match) {
    const [_, year, month, day] = match
    const isoDate = `${year}-${month}-${day}T00:00:00`
    const parsedDate = new Date(isoDate)
    return isNaN(parsedDate.getTime()) ? null : parsedDate
  }

  console.error("Date string does not match expected formats:", JSON.stringify(cleanedDateString))
  return null
}

// Universal date parser that handles all common date formats
export const parseDateTime = (value: unknown): Timestamp | null => {
  if (!value) {
    return null
  }
  if (isValidTimestamp(value)) {
    return value as Timestamp
  }
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Timestamp.fromDate(value)
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = new Date(value)
    if (!isNaN(parsed.getTime())) {
      // If time is 00:00:00, set default time to 09:00 SAST
      if (parsed.getHours() === 0 && parsed.getMinutes() === 0 && parsed.getSeconds() === 0) {
        parsed.setHours(9, 0, 0, 0)
      }
      return Timestamp.fromDate(parsed)
    }
  }
  return null
}

// Validate if a value can be converted to a valid date
export const isValidDate = (value: unknown): boolean => {
  if (!value) return false

  if (value instanceof Date) {
    return !isNaN(value.getTime())
  }

  if (isValidTimestamp(value)) {
    try {
      const date = timestampToDate(value)
      return !isNaN(date.getTime())
    } catch {
      return false
    }
  }

  if (typeof value === "string") {
    const parsed = new Date(value)
    return !isNaN(parsed.getTime())
  }

  return false
}
