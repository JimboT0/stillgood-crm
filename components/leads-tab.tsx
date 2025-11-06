"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, UserIcon, DoorClosed, Flame, Snowflake } from "lucide-react"
import {
  ContactsCell,
  ContractTermsCell,
  DocumentsCell,
  LaunchTrainDateCell,
  ProvinceCell,
  SalespersonCell,
  StoreInfoCell,
  StoreStatusBadge,
} from "./cells/index"
import type { Store, User } from "@/lib/firebase/types"
import { useStoreFilters } from "@/hooks/use-store-filters"
import { SearchInput, StatusFilter, FilterBar, LEAD_STATUS_OPTIONS } from "@/components/shared/filters"
import { AssignedOpsCell } from "./cells/assigned-ops-cell"
import { useState, useMemo } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface LeadsTabProps {
  stores: Store[]
  users: User[]
  currentUser: User | null
  onAddStore: () => void
  onEditStore: (store: Store) => void
  onDeleteStore: (storeId: string) => void
  onStatusChange: (storeId: string, newStatus: Store["status"]) => void
  onViewDocument?: (store: Store, documentType: "sla" | "bank") => void
}

export function LeadsTab({
  stores,
  users,
  currentUser,
  onViewDocument,
  onAddStore,
  onEditStore,
  onDeleteStore,
  onStatusChange,
}: LeadsTabProps) {
  console.log(`[LeadsTab] Component initialized - stores: ${stores?.length || 0}, currentUser: ${currentUser?.id}, role: ${currentUser?.role}`)
  
  const isSuperadmin = currentUser?.role === "superadmin";
  
  // All users can switch between 'all' and 'my' tabs
  // Default to 'all' tab so users can see all leads immediately
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all')
  
  // Filter stores based on active tab
  // All users can see all leads, but can only modify their own
  const baseStores = useMemo(() => {
    console.log(`[LeadsTab] ========== TAB FILTERING ==========`)
    console.log(`[LeadsTab] Input: ${stores?.length || 0} stores, activeTab: "${activeTab}", currentUser.id: "${currentUser?.id}"`)
    
    if (!stores || stores.length === 0) {
      console.log(`[LeadsTab] ❌ No stores provided or empty array`)
      return [];
    }
    
    // Log status breakdown of incoming stores
    const statusBreakdown = {
      new: stores.filter(s => s.status === "new").length,
      cold: stores.filter(s => s.status === "cold").length,
      warm: stores.filter(s => s.status === "warm").length,
      lead: stores.filter(s => s.status === "lead").length,
      other: stores.filter(s => !["new", "cold", "warm", "lead"].includes(s.status || "")).length,
      null: stores.filter(s => !s.status).length
    }
    console.log(`[LeadsTab] Status breakdown of incoming stores:`, statusBreakdown)
    
    // Filter by tab
    let filtered: Store[];
    if (activeTab === 'my') {
      console.log(`[LeadsTab] 🔍 Filtering to MY leads`)
      console.log(`[LeadsTab] Current user ID: "${currentUser?.id}"`)
      console.log(`[LeadsTab] Looking for stores where salespersonId === "${currentUser?.id}"`)
      
      // Get all unique salespersonIds in stores for debugging
      const allSalespersonIds = [...new Set(stores.map(s => s.salespersonId).filter(Boolean))]
      console.log(`[LeadsTab] All salespersonIds in stores:`, allSalespersonIds)
      console.log(`[LeadsTab] Does current user ID exist in stores? ${allSalespersonIds.includes(currentUser?.id || '')}`)
      
      filtered = stores.filter((store) => {
        const storeSalespersonId = store.salespersonId || '';
        const currentUserId = currentUser?.id || '';
        const matches = storeSalespersonId === currentUserId;
        
        if (matches) {
          console.log(`[LeadsTab] ✅ MATCH: Store "${store.tradingName}" - salespersonId: "${storeSalespersonId}" === currentUser: "${currentUserId}" (status: ${store.status})`)
        }
        return matches;
      });
      
      console.log(`[LeadsTab] MY tab result: ${filtered.length} stores match current user`)
      if (filtered.length === 0) {
        console.warn(`[LeadsTab] ⚠️ WARNING: No stores found for user "${currentUser?.id}"`)
        console.warn(`[LeadsTab] Available salespersonIds:`, allSalespersonIds)
      }
    } else {
      console.log(`[LeadsTab] Showing ALL leads (no filtering by salesperson)`)
      filtered = stores;
      console.log(`[LeadsTab] ALL tab: ${filtered.length} stores (no filtering)`)
    }
    
    console.log(`[LeadsTab] After tab filter: ${filtered.length} stores`)
    console.log(`[LeadsTab] Sample filtered stores:`, filtered.slice(0, 3).map(s => ({
      tradingName: s.tradingName,
      status: s.status,
      salespersonId: s.salespersonId
    })))
    console.log(`[LeadsTab] ===================================`)
    return filtered;
  }, [stores, activeTab, currentUser?.id])
  
  // For "My Leads" tab, don't filter by status - show ALL stores created by user
  // For "All Leads" tab, filter by status (new, cold, warm, lead)
  const shouldFilterByStatus = activeTab === 'all'
  
  // Apply status filter only if needed
  const storesAfterStatusFilter = useMemo(() => {
    if (!shouldFilterByStatus) {
      // "My Leads" - show all stores regardless of status
      return baseStores
    }
    // "All Leads" - filter by lead statuses
    return baseStores.filter((store) => {
      const status = store.status || "";
      return ["new", "cold", "warm", "lead"].includes(status);
    })
  }, [baseStores, shouldFilterByStatus])
  
  // Apply search and other filters
  const {
    filteredData: filteredStores,
    filters,
    setSearchTerm,
    setStatusFilter,
    hasActiveFilters,
    clearFilters,
  } = useStoreFilters(storesAfterStatusFilter, users, {
    includeKeyAccounts: true,
    includeDateFiltering: false,
  })
  
  // Debug: Log the complete filtering chain
  console.log(`[LeadsTab] ========== FINAL FILTERING SUMMARY ==========`)
  console.log(`[LeadsTab] Step 1 - Incoming stores from props: ${stores?.length || 0}`)
  console.log(`[LeadsTab] Step 2 - After tab filter (${activeTab}): ${baseStores.length}`)
  console.log(`[LeadsTab] Step 3 - After status filter (${shouldFilterByStatus ? 'applied' : 'skipped for My Leads'}): ${storesAfterStatusFilter.length}`)
  console.log(`[LeadsTab] Step 4 - After search/filters: ${filteredStores.length}`)
  console.log(`[LeadsTab] Active filters:`, { 
    searchTerm: filters.searchTerm || "(empty)", 
    statusFilter: filters.statusFilter || "all", 
    hasActiveFilters 
  })
  console.log(`[LeadsTab] Current user: ${currentUser?.id} (${currentUser?.role})`)
  
  if (filteredStores.length > 0) {
    console.log(`[LeadsTab] ✅ SUCCESS: ${filteredStores.length} stores will be displayed`)
    console.log(`[LeadsTab] Sample stores:`, filteredStores.slice(0, 3).map(s => ({
      name: s.tradingName,
      status: s.status,
      salespersonId: s.salespersonId
    })))
  } else {
    console.warn(`[LeadsTab] ⚠️ No stores to display`)
    console.warn(`[LeadsTab] - baseStores: ${baseStores.length}`)
    console.warn(`[LeadsTab] - storesAfterStatusFilter: ${storesAfterStatusFilter.length}`)
    console.warn(`[LeadsTab] - filteredStores: ${filteredStores.length}`)
  }
  console.log(`[LeadsTab] =============================================`)

  const handleDeleteClick = (storeId: string, storeName: string) => {
    if (window.confirm(`Are you sure you want to delete "${storeName}"? This action cannot be undone.`)) {
      onDeleteStore(storeId)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Leads Management</CardTitle>
          <CardDescription>Manage cold and warm leads</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onAddStore}>
            <Plus className="mr-2 h-4 w-4" /> Add Lead
          </Button>
        </CardContent>
      </Card>

      <FilterBar>
        <SearchInput value={filters.searchTerm} onChange={setSearchTerm} />
        <StatusFilter value={filters.status} onChange={setStatusFilter} options={LEAD_STATUS_OPTIONS} />
        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </FilterBar>

      <Tabs value={activeTab} onValueChange={(value) => {
        console.log(`[LeadsTab] 🔄 Tab changed from "${activeTab}" to "${value}"`)
        const newTab = value as 'all' | 'my'
        setActiveTab(newTab)
        
        // Log what will be shown after tab change
        setTimeout(() => {
          if (newTab === 'my') {
            const myStores = stores.filter(s => s.salespersonId === currentUser?.id)
            console.log(`[LeadsTab] After switching to "my": ${myStores.length} stores match user "${currentUser?.id}"`)
            console.log(`[LeadsTab] Matching stores:`, myStores.map(s => ({
              name: s.tradingName,
              status: s.status,
              salespersonId: s.salespersonId
            })))
          }
        }, 100)
      }}>
        <TabsList>
          <TabsTrigger value="all">All Leads</TabsTrigger>
          <TabsTrigger value="my">My Leads</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>{activeTab === 'all' ? 'All Leads' : 'My Leads'}</CardTitle>
          <CardDescription>Manage your sales pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                {activeTab === 'all' && (<TableHead>Creator</TableHead>)}
                {isSuperadmin && (<TableHead>Assigned</TableHead>)}
                <TableHead>Status</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Docs</TableHead>
                <TableHead>Contract</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                console.log(`[LeadsTab] 🎨 RENDERING TABLE - activeTab: "${activeTab}", filteredStores: ${filteredStores.length}`)
                if (filteredStores.length > 0) {
                  console.log(`[LeadsTab] ✅ RENDERING ${filteredStores.length} STORES`)
                  console.log(`[LeadsTab] Stores to render:`, filteredStores.slice(0, 5).map(s => ({
                    name: s.tradingName,
                    status: s.status,
                    salespersonId: s.salespersonId,
                    id: s.id
                  })))
                } else {
                  console.warn(`[LeadsTab] ⚠️ NO STORES TO RENDER!`)
                  console.warn(`[LeadsTab] Debug info:`, {
                    storesProp: stores?.length || 0,
                    baseStoresLength: baseStores.length,
                    activeTab,
                    currentUserId: currentUser?.id,
                    filtersStatus: filters.statusFilter,
                    filtersSearch: filters.searchTerm,
                    hasActiveFilters
                  })
                }
                return null;
              })()}
              {filteredStores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {activeTab === 'my' ? 'No leads found that you created.' : 'No leads found.'}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredStores.map((store) => {
                  return (
                <TableRow key={store.id}>
                  <StoreInfoCell
                    tradingName={store.tradingName || ""}
                    streetAddress={store.streetAddress || ""} />
                  {activeTab === 'all' && (
                    <SalespersonCell
                      isSuperadmin={true}
                      salespersonId={store.salespersonId ?? ""}
                      users={users || []} />
                  )}
                  {isSuperadmin ? <AssignedOpsCell                     
                  isSuperadmin={isSuperadmin}
                  assignedOpsIds={store.assignedOpsIds ?? []} 
                  users={users} /> : null}
                  <StoreStatusBadge status={store.status || ""} isKeyAccount={!!store.isKeyAccount} />
                  <ContactsCell contactPersons={store.contactPersons || []} />
                  <ProvinceCell province={store.province || ""} />
                  <LaunchTrainDateCell launchDate={store.launchDate} trainingDate={store.trainingDate} />
                  <DocumentsCell store={store} onViewDocument={onViewDocument} />
                  <ContractTermsCell contractTerms={store.contractTerms} />
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {(isSuperadmin || store.salespersonId === currentUser?.id) && store.status === "lead" && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => onStatusChange(store.id, "warm")}>
                            <Flame className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => onStatusChange(store.id, "cold")}>
                            <Snowflake className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {(isSuperadmin || store.salespersonId === currentUser?.id) && store.status === "cold" && (
                        <Button variant="ghost" onClick={() => onStatusChange(store.id, "warm")}>
                          <Flame className="mr-2 h-4 w-4" /> Warm
                        </Button>
                      )}
                      {(isSuperadmin || store.salespersonId === currentUser?.id) && store.status === "warm" && (
                        <Button variant="ghost" onClick={() => onStatusChange(store.id, "closed")}>
                          <DoorClosed className="mr-2 h-4 w-4" /> Close
                        </Button>
                      )}
                      {(isSuperadmin || store.salespersonId === currentUser?.id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(store.id, store.tradingName || "")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {(isSuperadmin || store.salespersonId === currentUser?.id) && (
                        <Button variant="ghost" size="icon" onClick={() => onEditStore(store)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
          {filteredStores.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No leads found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {hasActiveFilters
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by adding your first lead"}
              </p>
              {!hasActiveFilters && (
                <Button onClick={onAddStore}>
                  <Plus className="mr-2 h-4 w-4" /> Add Your First Lead
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}