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
import { SearchInput, StatusFilter, FilterBar, ManagerFilter } from "@/components/shared/filters"
import { AssignedOpsCell } from "./cells/assigned-ops-cell"
import { useMemo } from "react"

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
  const isSuperadmin = currentUser?.role === "superadmin";
  
  // Get all unique statuses from stores for the status filter
  const statusOptions = useMemo(() => {
    const statuses = new Set<string>();
    stores.forEach((store) => {
      if (store.status) {
        statuses.add(store.status);
      }
    });
    
    // Create options with "All" first, then sorted statuses
    const options = [
      { value: "all", label: "All Statuses" },
      ...Array.from(statuses)
        .sort()
        .map((status) => ({
          value: status,
          label: status.charAt(0).toUpperCase() + status.slice(1).replace(/([A-Z])/g, " $1"),
        })),
    ];
    
    return options;
  }, [stores]);
  
  // Apply filters - no pre-filtering, all stores are available
  const {
    filteredData: filteredStores,
    filters,
    setSearchTerm,
    setStatusFilter,
    setManagerFilter,
    hasActiveFilters,
    clearFilters,
    managers: filterManagers,
  } = useStoreFilters(stores, users, {
    includeKeyAccounts: true,
    includeDateFiltering: false,
  })

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
        <SearchInput value={filters.searchTerm} onChange={setSearchTerm} placeholder="Search stores..." />
        <ManagerFilter 
          value={filters.managerFilter || "all"} 
          onChange={setManagerFilter} 
          managers={filterManagers}
          placeholder="Filter by salesperson"
        />
        <StatusFilter 
          value={filters.statusFilter || "all"} 
          onChange={setStatusFilter} 
          options={statusOptions}
          placeholder="Filter by status"
        />
        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </FilterBar>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leads</CardTitle>
          <CardDescription>Manage your sales pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead>Creator</TableHead>
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
              {filteredStores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <div className="text-muted-foreground">
                      No leads found.
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
                  <SalespersonCell
                    isSuperadmin={true}
                    salespersonId={store.salespersonId ?? ""}
                    users={users || []} />
                  {isSuperadmin ? <AssignedOpsCell                     
                  isSuperadmin={isSuperadmin}
                  assignedOpsIds={store.assignedOpsIds ?? []} 
                  users={users} /> : null}
                  <StoreStatusBadge 
                    status={(
                      store.status && ["lead", "cold", "warm", "closed", "pending setup", "rollout", "completed"].includes(store.status)
                        ? store.status
                        : "lead"
                    ) as "lead" | "cold" | "warm" | "closed" | "pending setup" | "rollout" | "completed"} 
                    isKeyAccount={!!store.isKeyAccount} 
                  />
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