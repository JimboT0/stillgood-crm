"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { CheckCircle, Rocket, EditIcon } from "lucide-react"
import { ClosedStoreEditModal } from "./closed-store-edit-modal"
import {
  DocumentsCell,
  LaunchTrainDateCell,
  ProvinceCell,
  SalespersonCell,
  StoreInfoCell,
  StoreStatusBadge,
} from "./cells"
import type { Store, User } from "@/lib/firebase/types"
import { useClosedFilters } from "@/hooks/use-closed-filters"
import { SearchInput, StatusFilter, CLOSED_STATUS_OPTIONS, AdvancedFilterBar } from "@/components/shared/filters"
import { useState } from "react"

interface ClosedTabProps {
  stores: Store[]
  users: User[]
  currentUser: User | null
  onViewDocument: (store: Store, documentType: "sla" | "bank") => void
  onSetupConfirmation: (storeId: string) => void
  onPushToRollout: (store: Store) => void
  onMarkAsError: (storeId: string, errorDescription: string) => void
}

const getStoreStatus = (store: Store): "pending" | "ready" | "pushed" => {
  if (store.pushedToRollout) return "pushed"
  if (store.trainingDate && store.launchDate) return "ready"
  return "pending"
}

export function ClosedTab({ stores, users, currentUser, onViewDocument, onPushToRollout }: ClosedTabProps) {
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)

  const {
    filteredData: filteredStores,
    filters,
    setSearchTerm,
    setStatusFilter,
    closedStatusCounts,
    hasActiveFilters,
    clearFilters,
  } = useClosedFilters(stores, users)

  const handleSaveStore = async (store: Store) => {
    try {
      console.log(`Updating store ${store.id}`)
      setSelectedStore(store)
    } catch (error) {
      console.error("Failed to update store:", error)
    }
  }

  const handleLoadPreset = (presetFilters: any) => {
    Object.entries(presetFilters).forEach(([key, value]) => {
      if (key === "searchTerm") setSearchTerm(value as string)
      else if (key === "statusFilter") setStatusFilter(value as string)
    })
  }

  const isSuperadmin = currentUser?.role === "superadmin"

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Closed Deals</h2>
          <p className="text-sm text-gray-600">Manage closed deals and prepare for rollout</p>
        </div>
      </div>

      <AdvancedFilterBar
        filters={filters}
        onLoadPreset={handleLoadPreset}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      >
        <SearchInput value={filters.searchTerm} onChange={setSearchTerm} placeholder="Search closed deals..." />
        <StatusFilter
          value={filters.statusFilter}
          onChange={setStatusFilter}
          options={CLOSED_STATUS_OPTIONS}
          placeholder="Filter by status"
        />
      </AdvancedFilterBar>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Closed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{closedStatusCounts.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{closedStatusCounts.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Ready for Rollout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{closedStatusCounts.ready}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">In Rollout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{closedStatusCounts.pushed}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Closed Deals</CardTitle>
          <CardDescription>Monitor and manage your closed deals</CardDescription>
        </CardHeader>
        <CardContent className="w-full overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                {isSuperadmin && <TableHead>Lead By</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Docs</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStores.map((store) => (
                <TableRow key={store.id}>
                  <StoreInfoCell tradingName={store.tradingName} streetAddress={store.streetAddress} />
                  <SalespersonCell isSuperadmin={isSuperadmin} salespersonId={store.salespersonId} users={users} />
                  <StoreStatusBadge status={getStoreStatus(store)} isKeyAccount={!!store.isKeyAccount} />
                  <ProvinceCell province={store.province} />
                  <LaunchTrainDateCell launchDate={store.launchDate} trainingDate={store.trainingDate} />
                  <DocumentsCell store={store} onViewDocument={onViewDocument} />
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {!store.pushedToRollout && store.trainingDate && store.launchDate && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            console.log("Launching rollout for store:", store.id)
                            onPushToRollout(store)
                          }}
                          className="bg-purple-500 text-white hover:bg-purple-600"
                        >
                          <Rocket className="w-4 h-4" />
                        </Button>
                      )}
                      {store.pushedToRollout && (
                        <Button size="sm" variant="outline" className="bg-green-500 text-white" disabled>
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setSelectedStore(store)}>
                        <EditIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredStores.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No closed deals found</h3>
              <p className="text-gray-600">
                {hasActiveFilters
                  ? "Try adjusting your search or filter criteria"
                  : "Closed deals will appear here once you close some leads"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <ClosedStoreEditModal
        store={selectedStore}
        isOpen={!!selectedStore}
        onClose={() => setSelectedStore(null)}
        onSave={handleSaveStore}
        isMovingToClosed={false}
        currentUserId={currentUser?.id}
      />
    </div>
  )
}
