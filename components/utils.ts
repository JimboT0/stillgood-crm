import { format } from "date-fns"
import type { Timestamp } from "firebase/firestore"
import { isValidTimestamp, timestampToDate, parseDateTime as centralizedParseDateTime } from "@/lib/date-validation"

// Converts a Timestamp, Date, string, or null to a string for display (e.g., "DD/MM/YYYY HH:MM")
export const formatDateTime = (date?: Timestamp | Date | string | null): string => {
  if (!date) {
    return "Not set"
  }
  let d: Date
  if (date instanceof Date) {
    d = date
  } else if (isValidTimestamp(date)) {
    try {
      d = timestampToDate(date)
    } catch (error) {
      console.error("[formatDateTime] Error converting Timestamp to Date:", error, "Input:", date)
      return "Invalid date"
    }
  } else if (typeof date === "string") {
    d = new Date(date)
  } else {
    return "Invalid date"
  }
  if (isNaN(d.getTime())) {
    return "Invalid date"
  }
  try {
    const formatted = format(d, "dd/MM/yyyy HH:mm")
    return formatted
  } catch (error) {
    console.error("[formatDateTime] Error formatting date:", error)
    return "Invalid date"
  }
}

// Converts a Timestamp, Date, string, or null to a string for datetime-local input (e.g., "YYYY-MM-DDTHH:MM")
export const formatDateTimeForInput = (date?: Timestamp | Date | string | null): string => {
  if (!date) {
    return ""
  }
  let d: Date
  if (date instanceof Date) {
    d = date
  } else if (isValidTimestamp(date)) {
    try {
      d = timestampToDate(date)
    } catch (error) {
      console.error("[formatDateTimeForInput] Error converting Timestamp to Date:", error, "Input:", date)
      return ""
    }
  } else if (typeof date === "string") {
    d = new Date(date)
  } else {
    return ""
  }
  if (isNaN(d.getTime())) {
    return ""
  }
  try {
    const formatted = format(d, "yyyy-MM-dd'T'HH:mm")
    return formatted
  } catch (error) {
    console.error("[formatDateTimeForInput] Error formatting date:", error)
    return ""
  }
}

// Converts a Timestamp, Date, or null to a string for display (e.g., "DD/MM/YYYY HH:MM")
export const formatDateTimeForDisplay = (date: Timestamp | Date | null): string => {
  if (!date) {
    return "N/A"
  }
  let jsDate: Date
  if (isValidTimestamp(date)) {
    try {
      jsDate = timestampToDate(date)
    } catch (error) {
      console.error("[formatDateTimeForDisplay] Error converting Timestamp to Date:", error, "Input:", date)
      return "N/A"
    }
  } else if (date instanceof Date) {
    jsDate = date
  } else {
    return "N/A"
  }
  if (isNaN(jsDate.getTime())) {
    return "N/A"
  }
  try {
    const formatted = format(jsDate, "dd/MM/yyyy HH:mm")
    return formatted
  } catch (error) {
    console.error("[formatDateTimeForDisplay] Error formatting date:", error)
    return "N/A"
  }
}

// Re-export the centralized parseDateTime function
export const parseDateTime = centralizedParseDateTime
