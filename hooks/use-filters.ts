"use client"

import { useState, useMemo, useCallback } from "react"
import type { DateRange } from "@/components/shared/filters"

/**
 * Generic filter state interface
 */
export interface FilterState {
  searchTerm: string
  statusFilter: string
  provinceFilter: string
  managerFilter: string
  dateRange: DateRange
  [key: string]: any // Allow additional custom filters
}

/**
 * Filter configuration interface
 */
export interface FilterConfig<T = any> {
  searchFields?: (keyof T)[]
  statusField?: keyof T
  provinceField?: keyof T
  managerField?: keyof T
  dateField?: keyof T
  customFilters?: Record<string, (item: T, filterValue: any) => boolean>
}

/**
 * Hook for managing filter state and logic
 */
export function useFilters<T = any>(
  data: T[],
  config: FilterConfig<T> = {},
  initialFilters: Partial<FilterState> = {},
) {
  // Initialize filter state
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    statusFilter: "all",
    provinceFilter: "all",
    managerFilter: "all",
    dateRange: { from: undefined, to: undefined },
    ...initialFilters,
  })

  // Update individual filter values
  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: "",
      statusFilter: "all",
      provinceFilter: "all",
      managerFilter: "all",
      dateRange: { from: undefined, to: undefined },
      ...initialFilters,
    })
  }, [initialFilters])

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchTerm !== "" ||
      filters.statusFilter !== "all" ||
      filters.provinceFilter !== "all" ||
      filters.managerFilter !== "all" ||
      filters.dateRange.from !== undefined ||
      filters.dateRange.to !== undefined ||
      Object.keys(filters).some(
        (key) =>
          !["searchTerm", "statusFilter", "provinceFilter", "managerFilter", "dateRange"].includes(key) &&
          filters[key] !== "" &&
          filters[key] !== "all" &&
          filters[key] !== undefined,
      )
    )
  }, [filters])

  // Filter the data based on current filter state
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Search filter
      if (filters.searchTerm && config.searchFields) {
        const searchLower = filters.searchTerm.toLowerCase()
        const matchesSearch = config.searchFields.some((field) => {
          const value = item[field]
          return value && String(value).toLowerCase().includes(searchLower)
        })
        if (!matchesSearch) return false
      }

      // Status filter
      if (filters.statusFilter !== "all" && config.statusField) {
        if (item[config.statusField] !== filters.statusFilter) return false
      }

      // Province filter
      if (filters.provinceFilter !== "all" && config.provinceField) {
        if (item[config.provinceField] !== filters.provinceFilter) return false
      }

      // Manager filter
      if (filters.managerFilter !== "all" && config.managerField) {
        if (item[config.managerField] !== filters.managerFilter) return false
      }

      // Date range filter
      if ((filters.dateRange.from || filters.dateRange.to) && config.dateField) {
        const itemDate = item[config.dateField]
        if (itemDate) {
          const date = itemDate instanceof Date ? itemDate : itemDate.toDate ? itemDate.toDate() : new Date(itemDate)

          if (filters.dateRange.from && date < filters.dateRange.from) return false
          if (filters.dateRange.to && date > filters.dateRange.to) return false
        }
      }

      // Custom filters
      if (config.customFilters) {
        for (const [filterKey, filterFn] of Object.entries(config.customFilters)) {
          const filterValue = filters[filterKey]
          if (filterValue !== undefined && filterValue !== "all" && filterValue !== "") {
            if (!filterFn(item, filterValue)) return false
          }
        }
      }

      return true
    })
  }, [data, filters, config])

  // Get filter counts for different categories
  const getFilterCounts = useCallback(
    (statusField?: keyof T) => {
      if (!statusField) return {}

      const counts: Record<string, number> = {}
      data.forEach((item) => {
        const status = String(item[statusField])
        counts[status] = (counts[status] || 0) + 1
      })
      return counts
    },
    [data],
  )

  return {
    filters,
    filteredData,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    getFilterCounts,
    // Individual filter setters for convenience
    setSearchTerm: (value: string) => updateFilter("searchTerm", value),
    setStatusFilter: (value: string) => updateFilter("statusFilter", value),
    setProvinceFilter: (value: string) => updateFilter("provinceFilter", value),
    setManagerFilter: (value: string) => updateFilter("managerFilter", value),
    setDateRange: (value: DateRange) => updateFilter("dateRange", value),
  }
}
