export { SearchInput } from "./search-input"
export { StatusFilter } from "./status-filter"
export { ProvinceFilter } from "./province-filter"
export { DateRangeFilter } from "./date-range-filter"
export { ManagerFilter } from "./manager-filter"
export { FilterBar } from "./filter-bar"
export { FilterPresets } from "./filter-presets"
export { AdvancedFilterBar } from "./advanced-filter-bar"
export { AssignedOpsFilter } from "./assigned-ops-filter"

// Common filter option types
export interface FilterOption {
  value: string
  label: string
}

export interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

// Common status options for different tabs
export const LEAD_STATUS_OPTIONS: FilterOption[] = [
  { value: "cold", label: "Cold Leads" },
  { value: "warm", label: "Warm Leads" },
  { value: "closed", label: "Closed Leads" },
]

export const CLOSED_STATUS_OPTIONS: FilterOption[] = [
  { value: "all", label: "All Deals" },
  { value: "pending", label: "Pending Setup" },
  { value: "ready", label: "Ready for Rollout" },
  { value: "pushed", label: "In Rollout" },
]

export const ROLLOUT_STATUS_OPTIONS: FilterOption[] = [
  { value: "all", label: "All Stores" },
  { value: "pending", label: "Pending Setup" },
  { value: "setup", label: "Setup Complete" },
  { value: "confirmed", label: "Confirmed" },
]

export const KEY_ACCOUNT_STATUS_OPTIONS: FilterOption[] = [
  { value: "all", label: "All Statuses" },
  { value: "lead", label: "Lead" },
  { value: "warm", label: "Warm" },
  { value: "closed", label: "Closed" },
  { value: "setup", label: "Setup" },
  { value: "rollout", label: "Rollout" },
  { value: "completed", label: "Completed" },
]
