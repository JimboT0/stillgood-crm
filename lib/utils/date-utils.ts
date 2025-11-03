import { createEvent } from "ics"
import { format } from "date-fns"
import type { Timestamp } from "firebase/firestore"

/**
 * Standardized date formatting utilities for consistent Firebase Timestamp handling
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

// Universal date parser that handles all common date formats
export const parseDateTime = (value: unknown): Timestamp | null => {
  if (!value) {
    return null
  }
  if (isValidTimestamp(value)) {
    return value as Timestamp
  }
  if (value instanceof Date && !isNaN(value.getTime())) {
    return { seconds: Math.floor(value.getTime() / 1000), nanoseconds: 0 } as Timestamp
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = new Date(value)
    if (!isNaN(parsed.getTime())) {
      // If time is 00:00:00, set default time to 09:00 SAST
      if (parsed.getHours() === 0 && parsed.getMinutes() === 0 && parsed.getSeconds() === 0) {
        parsed.setHours(9, 0, 0, 0)
      }
      return { seconds: Math.floor(parsed.getTime() / 1000), nanoseconds: 0 } as Timestamp
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

// Standard date format constants
export const DATE_FORMATS = {
  DISPLAY: "dd/MM/yyyy HH:mm",
  DISPLAY_DATE_ONLY: "dd/MM/yyyy",
  DISPLAY_TIME_ONLY: "HH:mm",
  INPUT_DATETIME: "yyyy-MM-dd'T'HH:mm",
  INPUT_DATE: "yyyy-MM-dd",
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const

// Default fallback values
export const DATE_FALLBACKS = {
  NOT_SET: "Not set",
  INVALID: "Invalid date",
  NOT_AVAILABLE: "N/A",
  EMPTY: "",
} as const

/**
 * Core date conversion function - converts any date-like value to JavaScript Date
 * @param date - Timestamp, Date, string, or null/undefined
 * @returns JavaScript Date or null if invalid
 */
export const toJavaScriptDate = (date: unknown): Date | null => {
  if (!date) return null

  try {
    if (date instanceof Date) {
      return isNaN(date.getTime()) ? null : date
    }

    if (isValidTimestamp(date)) {
      return timestampToDate(date)
    }

    if (typeof date === "string") {
      const parsed = new Date(date)
      return isNaN(parsed.getTime()) ? null : parsed
    }

    if (typeof date === "number") {
      const parsed = new Date(date)
      return isNaN(parsed.getTime()) ? null : parsed
    }

    return null
  } catch (error) {
    console.error("[toJavaScriptDate] Error converting date:", error, "Input:", date)
    return null
  }
}

/**
 * Universal date formatter with consistent error handling
 * @param date - Any date-like value
 * @param formatString - date-fns format string
 * @param fallback - Fallback value for invalid dates
 * @returns Formatted date string or fallback
 */
export const formatDate = (
  date: unknown,
  formatString: string = DATE_FORMATS.DISPLAY,
  fallback: string = DATE_FALLBACKS.INVALID,
): string => {
  const jsDate = toJavaScriptDate(date)

  if (!jsDate) {
    return fallback
  }

  try {
    return format(jsDate, formatString)
  } catch (error) {
    console.error("[formatDate] Error formatting date:", error, "Date:", jsDate, "Format:", formatString)
    return fallback
  }
}

/**
 * Format date for display in UI components (DD/MM/YYYY HH:MM)
 * @param date - Any date-like value
 * @param fallback - Fallback value for null/undefined dates
 * @returns Formatted date string
 */
export const formatDateTime = (date: unknown, fallback: string = DATE_FALLBACKS.NOT_SET): string => {
  if (!date) return fallback
  return formatDate(date, DATE_FORMATS.DISPLAY, DATE_FALLBACKS.INVALID)
}
// export function formatDateTime(date: Date | any): string {
//   if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
//     console.warn("Invalid date in formatDateTime:", date);
//     return "Invalid Date";
//   }
//   return date.toLocaleString("en-ZA", {
//     year: "numeric",
//     month: "short",
//     day: "2-digit",
//     hour: "2-digit",
//     minute: "2-digit",
//     timeZone: "Africa/Johannesburg", // SAST
//   });
// }

/**
 * Format date for display without time (DD/MM/YYYY)
 * @param date - Any date-like value
 * @param fallback - Fallback value for null/undefined dates
 * @returns Formatted date string
 */
export const formatDateOnly = (date: unknown, fallback: string = DATE_FALLBACKS.NOT_SET): string => {
  if (!date) return fallback
  return formatDate(date, DATE_FORMATS.DISPLAY_DATE_ONLY, DATE_FALLBACKS.INVALID)
}

/**
 * Format time only (HH:MM)
 * @param date - Any date-like value
 * @param fallback - Fallback value for null/undefined dates
 * @returns Formatted time string
 */
export const formatTimeOnly = (date: unknown, fallback: string = DATE_FALLBACKS.NOT_SET): string => {
  if (!date) return fallback
  return formatDate(date, DATE_FORMATS.DISPLAY_TIME_ONLY, DATE_FALLBACKS.INVALID)
}

/**
 * Format date for datetime-local input (YYYY-MM-DDTHH:MM)
 * @param date - Any date-like value
 * @returns Formatted date string for input or empty string
 */
export const formatDateTimeForInput = (date: unknown): string => {
  if (!date) return DATE_FALLBACKS.EMPTY
  return formatDate(date, DATE_FORMATS.INPUT_DATETIME, DATE_FALLBACKS.EMPTY)
}

/**
 * Format date for date input (YYYY-MM-DD)
 * @param date - Any date-like value
 * @returns Formatted date string for input or empty string
 */
export const formatDateForInput = (date: unknown): string => {
  if (!date) return DATE_FALLBACKS.EMPTY
  return formatDate(date, DATE_FORMATS.INPUT_DATE, DATE_FALLBACKS.EMPTY)
}

/**
 * Legacy compatibility function - same as formatDateTime but with N/A fallback
 * @param date - Timestamp, Date, or null
 * @returns Formatted date string
 */
export const formatDateTimeForDisplay = (date: Timestamp | Date | null): string => {
  return formatDateTime(date, DATE_FALLBACKS.NOT_AVAILABLE)
}

/**
 * Check if two dates are the same day (ignoring time)
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Boolean indicating if dates are same day
 */
export const isSameDay = (date1: unknown, date2: unknown): boolean => {
  const jsDate1 = toJavaScriptDate(date1)
  const jsDate2 = toJavaScriptDate(date2)

  if (!jsDate1 || !jsDate2) return false

  return (
    jsDate1.getFullYear() === jsDate2.getFullYear() &&
    jsDate1.getMonth() === jsDate2.getMonth() &&
    jsDate1.getDate() === jsDate2.getDate()
  )
}

/**
 * Check if a date is in the past
 * @param date - Date to check
 * @returns Boolean indicating if date is in the past
 */
export const isPastDate = (date: unknown): boolean => {
  const jsDate = toJavaScriptDate(date)
  if (!jsDate) return false
  return jsDate < new Date()
}

/**
 * Check if a date is in the future
 * @param date - Date to check
 * @returns Boolean indicating if date is in the future
 */
export const isFutureDate = (date: unknown): boolean => {
  const jsDate = toJavaScriptDate(date)
  if (!jsDate) return false
  return jsDate > new Date()
}

/**
 * Get relative time description (e.g., "2 days ago", "in 3 hours")
 * @param date - Date to compare
 * @returns Relative time string
 */
export const getRelativeTime = (date: unknown): string => {
  const jsDate = toJavaScriptDate(date)
  if (!jsDate) return DATE_FALLBACKS.INVALID

  const now = new Date()
  const diffMs = jsDate.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (Math.abs(diffDays) >= 1) {
    return diffDays > 0
      ? `in ${diffDays} day${diffDays > 1 ? "s" : ""}`
      : `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? "s" : ""} ago`
  } else if (Math.abs(diffHours) >= 1) {
    return diffHours > 0
      ? `in ${diffHours} hour${diffHours > 1 ? "s" : ""}`
      : `${Math.abs(diffHours)} hour${Math.abs(diffHours) > 1 ? "s" : ""} ago`
  } else if (Math.abs(diffMinutes) >= 1) {
    return diffMinutes > 0
      ? `in ${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`
      : `${Math.abs(diffMinutes)} minute${Math.abs(diffMinutes) > 1 ? "s" : ""} ago`
  } else {
    return "just now"
  }
}

// Utility functions to get salesperson name and initials
export const getSalespersonName = (salespersonId: string, users: { id: string; name: string }[]): string => {
  if (!users || !Array.isArray(users)) {
    return "Unknown"
  }
  const salesperson = users.find((user) => user.id === salespersonId)
  return salesperson?.name || "Unknown"
}

export const getSalespersonInitials = (salespersonId: string, users: { id: string; name: string }[]): string => {
  if (!users || !Array.isArray(users)) {
    return "?"
  }
  const salesperson = users.find((user) => user.id === salespersonId)
  return (
    salesperson?.name
      .split(" ")
      .map((n) => n[0])
      .join("") || "?"
  )
}

export const addToCalendar = (store: any, eventDate: Date | null, eventType: "training" | "launch") => {
  if (!eventDate) {
    console.warn(`No ${eventType} date for store: ${store.tradingName || store.storeId}`)
    return
  }

  const jsDate = toJavaScriptDate(eventDate)
  if (!jsDate) {
    console.error(`Invalid ${eventType} date for store: ${store.tradingName || store.storeId}`)
    return
  }

  const startDate = jsDate
  const endDate = new Date(startDate.getTime() + (eventType === "training" ? 2 : 4) * 60 * 60 * 1000)

  const icsEvent = {
    start: [
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      startDate.getDate(),
      startDate.getHours(),
      startDate.getMinutes(),
    ] as [number, number, number, number, number],
    end: [
      endDate.getFullYear(),
      endDate.getMonth() + 1,
      endDate.getDate(),
      endDate.getHours(),
      endDate.getMinutes(),
    ] as [number, number, number, number, number],
    title: `${eventType === "training" ? "Training" : "Launch"}: ${store.tradingName}`,
    description: `Store: ${store.tradingName}\nAddress: ${store.streetAddress}, ${store.province}\nStore ID: ${store.storeId}\nStatus: ${store.status}`,
    location: `${store.streetAddress}, ${store.province}`,
  }

  createEvent(icsEvent, (error, value) => {
    if (error) {
      console.error("Error creating ICS file:", error)
      return
    }
    const blob = new Blob([value], { type: "text/calendar" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${store.tradingName}-${eventType}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  })
}


// date-utils.ts
export function convertTimestampToDate(timestamp: any): Date {
  if (!timestamp) {
    console.warn("Timestamp is null or undefined, returning current date");
    return new Date();
  }
  if (timestamp.toDate && typeof timestamp.toDate === "function") {
    return timestamp.toDate();
  }
  if (typeof timestamp === "object" && "seconds" in timestamp && "nanoseconds" in timestamp) {
    return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === "string") {
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  console.warn("Invalid timestamp format:", timestamp);
  return new Date();
}
