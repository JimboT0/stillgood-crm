"use client"

import { useMemo } from "react"
import { useStoreFilters } from "./use-store-filters"
import type { Store, User } from "@/lib/firebase/types"

/**
 * Get store rollout status
 */
const getStoreStatus = (store: Store): "pending" | "ready" | "pushed" => {
  if (store.pushedToRollout) return "pushed"
  if (store.trainingDate && store.launchDate) return "ready"
  return "pending"
}

/**
 * Specialized hook for filtering closed deal stores
 */
export function useClosedFilters(stores: Store[], users: User[]) {
  // Filter to only closed stores
  const closedStores = useMemo(() => {
    return stores.filter((store) => store.status === "closed")
  }, [stores])

  const filterHook = useStoreFilters(closedStores, users, {
    includeKeyAccounts: false,
    includeDateFiltering: true,
    customFilters: {
      rolloutStatus: (store: Store, value: string) => {
        if (value === "all") return true
        return getStoreStatus(store) === value
      },
    },
  })

  // Override status filter to use rollout status instead
  const filteredData = useMemo(() => {
    if (filterHook.filters.statusFilter === "all") {
      return filterHook.filteredData
    }

    return filterHook.filteredData.filter((store) => getStoreStatus(store) === filterHook.filters.statusFilter)
  }, [filterHook.filteredData, filterHook.filters.statusFilter])

  // Closed deal specific status counts
  const closedStatusCounts = useMemo(() => {
    return {
      total: closedStores.length,
      pending: closedStores.filter((s) => getStoreStatus(s) === "pending").length,
      ready: closedStores.filter((s) => getStoreStatus(s) === "ready").length,
      pushed: closedStores.filter((s) => getStoreStatus(s) === "pushed").length,
    }
  }, [closedStores])

  return {
    ...filterHook,
    filteredData,
    closedStatusCounts,
  }
}
