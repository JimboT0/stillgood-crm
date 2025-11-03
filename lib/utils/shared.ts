// Shared utility functions used across the application

/**
 * Get status badge styling for refund/payment statuses
 */
export const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    case "approved":
      return "bg-green-100 text-green-800"
    case "rejected":
      return "bg-red-100 text-red-800"
    case "completed":
      return "bg-blue-100 text-blue-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

/**
 * Get initials from a name
 */
export const getInitials = (name: string): string => {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Truncate text to a specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

/**
 * Format currency
 */
export const formatCurrency = (amount: number, currency = "ZAR"): string => {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
  }).format(amount)
}
