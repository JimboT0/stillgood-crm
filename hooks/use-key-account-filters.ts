"use client"

import { useMemo } from "react"
import { useStoreFilters } from "./use-store-filters"
import type { Store, User } from "@/lib/firebase/types"

/**
 * Specialized hook for filtering key account stores
 */
export function useKeyAccountFilters(stores: Store[], users: User[]) {
  // Filter to only key account stores
  const keyAccountStores = useMemo(() => {
    return stores.filter((store) => store.isKeyAccount === true)
  }, [stores])

  const filterHook = useStoreFilters(keyAccountStores, users, {
    includeKeyAccounts: true,
    includeDateFiltering: true,
    managerField: "keyAccountManager", // Use key account manager instead of salesperson
  })

  // Key account managers (different from regular salespersons)
  const keyAccountManagers = useMemo(() => {
    return users.filter((user) => user.role === "superadmin" || user.role === "salesperson")
  }, [users])

  // Key account specific status counts
  const keyAccountStatusCounts = useMemo(() => {
    return {
      total: keyAccountStores.length,
      active: keyAccountStores.filter((s) => s.status !== "completed").length,
      completed: keyAccountStores.filter((s) => s.status === "completed").length,
    }
  }, [keyAccountStores])

  return {
    ...filterHook,
    keyAccountManagers,
    keyAccountStatusCounts,
  }
}
