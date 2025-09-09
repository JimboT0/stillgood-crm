"use client"

import { useMemo } from "react"
import { useStoreFilters } from "./use-store-filters"
import type { Store, User } from "@/lib/firebase/types"

/**
 * Specialized hook for filtering lead stores
 */
export function useLeadFilters(stores: Store[], users: User[]) {
  // Filter to only lead stores
  const leadStores = useMemo(() => {
    return stores.filter((store) => ["cold", "warm", "lead"].includes(store.status))
  }, [stores])

  const filterHook = useStoreFilters(leadStores, users, {
    includeKeyAccounts: true,
    includeDateFiltering: false,
  })

  // Lead-specific status counts
  const leadStatusCounts = useMemo(() => {
    return {
      total: leadStores.length,
      cold: leadStores.filter((s) => s.status === "cold").length,
      warm: leadStores.filter((s) => s.status === "warm").length,
      lead: leadStores.filter((s) => s.status === "lead").length,
    }
  }, [leadStores])

  return {
    ...filterHook,
    leadStatusCounts,
  }
}
