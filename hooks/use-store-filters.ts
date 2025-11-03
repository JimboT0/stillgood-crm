"use client"

import { useMemo } from "react"
import { useFilters, type FilterConfig } from "./use-filters"
import type { Store, User } from "@/lib/firebase/types"

/**
 * Store-specific filter configuration
 */
export interface StoreFilterConfig extends FilterConfig<Store> {
  includeKeyAccounts?: boolean
  includeDateFiltering?: boolean
}

/**
 * Specialized hook for filtering store data
 */
export function useStoreFilters(stores: Store[], users: User[], config: StoreFilterConfig = {}) {
  // Default store filter configuration
  const defaultConfig: FilterConfig<Store> = {
    searchFields: ["tradingName", "streetAddress", "province"],
    statusField: "status",
    provinceField: "province",
    managerField: "salespersonId",
    dateField: config.includeDateFiltering ? "launchDate" : undefined,
    customFilters: {
      keyAccount: (store: Store, value: boolean) => {
        if (!config.includeKeyAccounts) return true
        return value ? store.isKeyAccount === true : store.isKeyAccount !== true
      },
    },
  }

  const mergedConfig = { ...defaultConfig, ...config }
  const filterHook = useFilters(stores, mergedConfig)

  // Get unique provinces from stores
  const provinces = useMemo(() => {
    return Array.from(new Set(stores.map((store) => store.province).filter(Boolean)))
  }, [stores])

  // Get managers (users who can be assigned to stores)
  const managers = useMemo(() => {
    return (users ?? []).filter((user) => user.role === "superadmin" || user.role === "salesperson")
  }, [users])

  // Get status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    stores.forEach((store) => {
      const status = store.status || "unknown"
      counts[status] = (counts[status] || 0) + 1
    })
    return counts
  }, [stores])

  return {
    ...filterHook,
    provinces,
    managers,
    statusCounts,
  }
}
