"use client"

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode, Suspense } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import type { FilterState } from "@/hooks/use-filters"

interface FilterContextValue {
  // Global filter state
  globalFilters: FilterState
  updateGlobalFilter: (key: keyof FilterState, value: any) => void
  clearGlobalFilters: () => void

  // URL synchronization
  syncFiltersToUrl: (filters: Partial<FilterState>) => void
  getFiltersFromUrl: () => Partial<FilterState>

  // Persistence
  saveFiltersToStorage: (key: string, filters: FilterState) => void
  loadFiltersFromStorage: (key: string) => Partial<FilterState> | null
  clearFiltersFromStorage: (key: string) => void

  // Filter presets
  saveFilterPreset: (name: string, filters: FilterState) => void
  loadFilterPreset: (name: string) => FilterState | null
  deleteFilterPreset: (name: string) => void
  getFilterPresets: () => Record<string, FilterState>
}

const FilterContext = createContext<FilterContextValue | undefined>(undefined)

const DEFAULT_FILTERS: FilterState = {
  searchTerm: "",
  statusFilter: "all",
  provinceFilter: "all",
  managerFilter: "all",
  dateRange: { from: undefined, to: undefined },
}

interface FilterProviderProps {
  children: ReactNode
}

// Separate component that uses useSearchParams
function FilterProviderInner({ children }: FilterProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [globalFilters, setGlobalFilters] = useState<FilterState>(DEFAULT_FILTERS)

  // Initialize filters from URL on mount
  useEffect(() => {
    const urlFilters = getFiltersFromUrl()
    if (Object.keys(urlFilters).length > 0) {
      setGlobalFilters((prev) => ({ ...prev, ...urlFilters }))
    }
  }, [])

  // Update global filter state
  const updateGlobalFilter = useCallback((key: keyof FilterState, value: any) => {
    setGlobalFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Clear all global filters
  const clearGlobalFilters = useCallback(() => {
    setGlobalFilters(DEFAULT_FILTERS)
  }, [])

  // Sync filters to URL
  const syncFiltersToUrl = useCallback(
    (filters: Partial<FilterState>) => {
      const params = new URLSearchParams(searchParams.toString())

      // Clear existing filter params
      const filterKeys = ["search", "status", "province", "manager", "dateFrom", "dateTo"]
      filterKeys.forEach((key) => params.delete(key))

      // Add new filter params
      if (filters.searchTerm && filters.searchTerm !== "") {
        params.set("search", filters.searchTerm)
      }
      if (filters.statusFilter && filters.statusFilter !== "all") {
        params.set("status", filters.statusFilter)
      }
      if (filters.provinceFilter && filters.provinceFilter !== "all") {
        params.set("province", filters.provinceFilter)
      }
      if (filters.managerFilter && filters.managerFilter !== "all") {
        params.set("manager", filters.managerFilter)
      }
      if (filters.dateRange?.from) {
        params.set("dateFrom", filters.dateRange.from.toISOString())
      }
      if (filters.dateRange?.to) {
        params.set("dateTo", filters.dateRange.to.toISOString())
      }

      const newUrl = `${pathname}?${params.toString()}`
      router.replace(newUrl, { scroll: false })
    },
    [searchParams, pathname, router],
  )

  // Get filters from URL
  const getFiltersFromUrl = useCallback((): Partial<FilterState> => {
    const filters: Partial<FilterState> = {}

    const search = searchParams.get("search")
    if (search) filters.searchTerm = search

    const status = searchParams.get("status")
    if (status) filters.statusFilter = status

    const province = searchParams.get("province")
    if (province) filters.provinceFilter = province

    const manager = searchParams.get("manager")
    if (manager) filters.managerFilter = manager

    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    if (dateFrom || dateTo) {
      filters.dateRange = {
        from: dateFrom ? new Date(dateFrom) : undefined,
        to: dateTo ? new Date(dateTo) : undefined,
      }
    }

    return filters
  }, [searchParams])

  // Save filters to localStorage
  const saveFiltersToStorage = useCallback((key: string, filters: FilterState) => {
    try {
      const serializedFilters = {
        ...filters,
        dateRange: {
          from: filters.dateRange.from?.toISOString(),
          to: filters.dateRange.to?.toISOString(),
        },
      }
      localStorage.setItem(`filters_${key}`, JSON.stringify(serializedFilters))
    } catch (error) {
      console.error("Failed to save filters to storage:", error)
    }
  }, [])

  // Load filters from localStorage
  const loadFiltersFromStorage = useCallback((key: string): Partial<FilterState> | null => {
    try {
      const stored = localStorage.getItem(`filters_${key}`)
      if (!stored) return null

      const parsed = JSON.parse(stored)

      // Deserialize dates
      if (parsed.dateRange) {
        parsed.dateRange = {
          from: parsed.dateRange.from ? new Date(parsed.dateRange.from) : undefined,
          to: parsed.dateRange.to ? new Date(parsed.dateRange.to) : undefined,
        }
      }

      return parsed
    } catch (error) {
      console.error("Failed to load filters from storage:", error)
      return null
    }
  }, [])

  // Clear filters from localStorage
  const clearFiltersFromStorage = useCallback((key: string) => {
    try {
      localStorage.removeItem(`filters_${key}`)
    } catch (error) {
      console.error("Failed to clear filters from storage:", error)
    }
  }, [])

  // Save filter preset
  const saveFilterPreset = useCallback((name: string, filters: FilterState) => {
    try {
      const presets = getFilterPresets()
      const serializedFilters = {
        ...filters,
        dateRange: {
          from: filters.dateRange.from?.toISOString(),
          to: filters.dateRange.to?.toISOString(),
        },
      }
      presets[name] = serializedFilters as FilterState
      localStorage.setItem("filter_presets", JSON.stringify(presets))
    } catch (error) {
      console.error("Failed to save filter preset:", error)
    }
  }, [])

  // Load filter preset
  const loadFilterPreset = useCallback((name: string): FilterState | null => {
    try {
      const presets = getFilterPresets()
      const preset = presets[name]
      if (!preset) return null

      // Deserialize dates
      if (preset.dateRange) {
        preset.dateRange = {
          from: preset.dateRange.from ? new Date(preset.dateRange.from as string) : undefined,
          to: preset.dateRange.to ? new Date(preset.dateRange.to as string) : undefined,
        }
      }

      return preset
    } catch (error) {
      console.error("Failed to load filter preset:", error)
      return null
    }
  }, [])

  // Delete filter preset
  const deleteFilterPreset = useCallback((name: string) => {
    try {
      const presets = getFilterPresets()
      delete presets[name]
      localStorage.setItem("filter_presets", JSON.stringify(presets))
    } catch (error) {
      console.error("Failed to delete filter preset:", error)
    }
  }, [])

  // Get all filter presets
  const getFilterPresets = useCallback((): Record<string, FilterState> => {
    try {
      const stored = localStorage.getItem("filter_presets")
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.error("Failed to get filter presets:", error)
      return {}
    }
  }, [])

  const value: FilterContextValue = {
    globalFilters,
    updateGlobalFilter,
    clearGlobalFilters,
    syncFiltersToUrl,
    getFiltersFromUrl,
    saveFiltersToStorage,
    loadFiltersFromStorage,
    clearFiltersFromStorage,
    saveFilterPreset,
    loadFilterPreset,
    deleteFilterPreset,
    getFilterPresets,
  }

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
}

// Main provider with Suspense wrapper
export function FilterProvider({ children }: FilterProviderProps) {
  return (
    <Suspense fallback={<div>Loading filters...</div>}>
      <FilterProviderInner>{children}</FilterProviderInner>
    </Suspense>
  )
}

export function useFilterContext() {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error("useFilterContext must be used within a FilterProvider")
  }
  return context
}
