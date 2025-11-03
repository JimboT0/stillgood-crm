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
import { useLeadFilters } from "@/hooks/use-lead-filters"
import { SearchInput, StatusFilter, FilterBar, LEAD_STATUS_OPTIONS } from "@/components/shared/filters"
import { AssignedOpsCell } from "./cells/assigned-ops-cell"

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
  const {
    filteredData: filteredStores,
    filters,
    setSearchTerm,
    setStatusFilter,
    hasActiveFilters,
    clearFilters,
  } = useLeadFilters(stores, users)

  const handleDeleteClick = (storeId: string, storeName: string) => {
    if (window.confirm(`Are you sure you want to delete "${storeName}"? This action cannot be undone.`)) {
      onDeleteStore(storeId)
    }
  }

  console.log(stores.map((store) => ({
    id: store.id,
    tradingName: store.tradingName,
    status: store.status,
  })))

  const isSuperadmin = currentUser?.role === "superadmin";
  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Leads Management</h2>
          <p className="text-sm text-gray-600">Manage cold and warm leads</p>
        </div>
        <Button onClick={onAddStore} className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Lead
        </Button>
      </div>

      <FilterBar>
        <SearchInput value={filters.searchTerm} onChange={setSearchTerm} placeholder="Search leads..." />
        <StatusFilter
          value={filters.statusFilter}
          onChange={setStatusFilter}
          options={LEAD_STATUS_OPTIONS}
          placeholder="Filter by status"
        />
        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto bg-transparent">
            Clear Filters
          </Button>
        )}
      </FilterBar>


      {/* Leads Table */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>All Leads</CardTitle>
          <CardDescription>Manage your sales pipeline</CardDescription>
        </CardHeader>
        <CardContent className="w-full overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                {isSuperadmin && (<TableHead>Creator</TableHead>) }
                {isSuperadmin && (<TableHead>Assigned</TableHead>) }
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
              {filteredStores.map((store) => (
                <TableRow key={store.id}>
                  <StoreInfoCell tradingName={store.tradingName} streetAddress={store.streetAddress} />
                  {isSuperadmin ? <SalespersonCell isSuperadmin={isSuperadmin} salespersonId={store.salespersonId} users={users} /> : null}
                  {isSuperadmin ? <AssignedOpsCell isSuperadmin={isSuperadmin} users={users} assignedOpsIds={store.assignedOpsIds ?? []} /> : null}

                  <StoreStatusBadge status={store.status} isKeyAccount={!!store.isKeyAccount} />
                  <ContactsCell contactPersons={store.contactPersons ?? []} />
                  <ProvinceCell province={store.province} />
                  <LaunchTrainDateCell
                    launchDate={store.launchDate}
                    trainingDate={store.trainingDate}
                  />
                  <DocumentsCell store={store} onViewDocument={onViewDocument} />
                  <ContractTermsCell
                    contractTerms={store.contractTerms}
                  />
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {store.status === "lead" && (
                        <>
                          <Button
                            size="sm"
                            className="bg-orange-500 hover:bg-orange-600"
                            onClick={() => onStatusChange(store.id, "warm")}
                          >
                            <Flame className="w-3 h-3 mx-[2px]" />
                          </Button><Button
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600"
                            onClick={() => onStatusChange(store.id, "warm")}
                          >
                            <Snowflake className="w-3 h-3 mx-[2px]" />
                          </Button>
                        </>
                      )}
                      {store.status === "cold" && (
                        <Button
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600"
                          onClick={() => onStatusChange(store.id, "warm")}
                        >
                          <Flame className="w-3 h-3 mr-1" />
                          Warm
                        </Button>
                      )}
                      {store.status === "warm" && (
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600"
                          onClick={() => onStatusChange(store.id, "closed")}
                        >
                          <DoorClosed className="w-3 h-3 mr-1" />
                          Close
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                        onClick={() => handleDeleteClick(store.id, store.tradingName)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onEditStore(store)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredStores.length === 0 && (
            <div className="text-center py-8">
              <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
              <p className="text-gray-600 mb-4">
                {hasActiveFilters
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by adding your first lead"}
              </p>
              {!hasActiveFilters && (
                <Button onClick={onAddStore} className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Lead
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
