"use client"

import { useMemo } from "react"
import { useStoreFilters } from "./use-store-filters"
import type { Store, User } from "@/lib/firebase/types"

/**
 * Specialized hook for filtering rollout stores
 */
export function useRolloutFilters(stores: Store[], users: User[]) {
  // Filter to only rollout stores
  const rolloutStores = useMemo(() => {
    return stores.filter((store) => store.pushedToRollout)
  }, [stores])

  const filterHook = useStoreFilters(rolloutStores, users, {
    includeKeyAccounts: false,
    includeDateFiltering: true,
    customFilters: {
      setupStatus: (store: Store, value: string) => {
        if (value === "all") return true
        if (value === "pending") return !store.isSetup
        if (value === "confirmed") return !!store.setupConfirmed
        return true
      },
    },
  })

  // Override filtered data to use setup status
  const filteredData = useMemo(() => {
    if (filterHook.filters.statusFilter === "all") {
      return filterHook.filteredData
    }

    return filterHook.filteredData.filter((store) => {
      const status = filterHook.filters.statusFilter
      if (status === "pending") return !store.isSetup
      if (status === "setup") return store.isSetup && !store.setupConfirmed
      if (status === "confirmed") return store.setupConfirmed
      return true
    })
  }, [filterHook.filteredData, filterHook.filters.statusFilter])

  // Rollout-specific status counts
  const rolloutStatusCounts = useMemo(() => {
    return {
      total: rolloutStores.length,
      pending: rolloutStores.filter((s) => !s.isSetup).length,
      setup: rolloutStores.filter((s) => s.isSetup && !s.setupConfirmed).length,
      confirmed: rolloutStores.filter((s) => s.setupConfirmed).length,
    }
  }, [rolloutStores])

  return {
    ...filterHook,
    filteredData,
    rolloutStatusCounts,
  }
}
