"use client"

import { useEffect, useCallback } from "react"
import { useFilterContext } from "@/contexts/filter-context"
import { useFilters, type FilterConfig, type FilterState } from "./use-filters"

/**
 * Enhanced filter hook with persistence and URL synchronization
 */
export function usePersistentFilters<T = any>(
  data: T[],
  config: FilterConfig<T> = {},
  options: {
    storageKey?: string
    syncToUrl?: boolean
    initialFilters?: Partial<FilterState>
  } = {},
) {
  const { storageKey, syncToUrl = false, initialFilters = {} } = options
  const { saveFiltersToStorage, loadFiltersFromStorage, syncFiltersToUrl, getFiltersFromUrl } = useFilterContext()

  // Initialize filters from URL or storage
  const getInitialFilters = useCallback((): Partial<FilterState> => {
    if (syncToUrl) {
      const urlFilters = getFiltersFromUrl()
      if (Object.keys(urlFilters).length > 0) {
        return { ...initialFilters, ...urlFilters }
      }
    }

    if (storageKey) {
      const storedFilters = loadFiltersFromStorage(storageKey)
      if (storedFilters) {
        return { ...initialFilters, ...storedFilters }
      }
    }

    return initialFilters
  }, [syncToUrl, storageKey, initialFilters, getFiltersFromUrl, loadFiltersFromStorage])

  const filterHook = useFilters(data, config, getInitialFilters())

  // Save filters to storage when they change
  useEffect(() => {
    if (storageKey && filterHook.hasActiveFilters) {
      saveFiltersToStorage(storageKey, filterHook.filters)
    }
  }, [storageKey, filterHook.filters, filterHook.hasActiveFilters, saveFiltersToStorage])

  // Sync filters to URL when they change
  useEffect(() => {
    if (syncToUrl) {
      syncFiltersToUrl(filterHook.filters)
    }
  }, [syncToUrl, filterHook.filters, syncFiltersToUrl])

  return filterHook
}
