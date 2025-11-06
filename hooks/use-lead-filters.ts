"use client"

import { useMemo } from "react"
import { useStoreFilters } from "./use-store-filters"
import type { Store, User } from "@/lib/firebase/types"

/**
 * Specialized hook for filtering lead stores
 */
export function useLeadFilters(stores: Store[], users: User[]) {
  console.log(`[useLeadFilters] Called with ${stores?.length || 0} stores`)
  
  // Filter to only lead stores
  const leadStores = useMemo(() => {
    if (!stores || stores.length === 0) {
      console.log(`[useLeadFilters] No stores to filter`)
      return [];
    }
    
    console.log(`[useLeadFilters] Filtering stores - input count: ${stores.length}`)
    console.log(`[useLeadFilters] Status breakdown:`, {
      new: stores.filter(s => s.status === "new").length,
      cold: stores.filter(s => s.status === "cold").length,
      warm: stores.filter(s => s.status === "warm").length,
      lead: stores.filter(s => s.status === "lead").length,
      other: stores.filter(s => !["new", "cold", "warm", "lead"].includes(s.status || "")).length,
      nullUndefined: stores.filter(s => !s.status).length,
      allStatuses: [...new Set(stores.map(s => s.status).filter(Boolean))]
    })
    
    const filtered = stores.filter((store) => {
      const status = store.status || "";
      // Include "new", "lead", "cold", and "warm" statuses
      const isLeadStore = ["new", "cold", "warm", "lead"].includes(status);
      if (!isLeadStore && store.tradingName) {
        console.log(`[useLeadFilters] Filtering out store "${store.tradingName}" - status: "${status}" (not in lead statuses)`)
      }
      return isLeadStore;
    });
    
    console.log(`[useLeadFilters] After status filter: ${filtered.length} lead stores (from ${stores.length} total)`)
    return filtered;
  }, [stores])

  const filterHook = useStoreFilters(leadStores, users, {
    includeKeyAccounts: true,
    includeDateFiltering: false,
  })

  // Lead-specific status counts
  const leadStatusCounts = useMemo(() => {
    return {
      total: leadStores.length,
      new: leadStores.filter((s) => s.status === "new").length,
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
