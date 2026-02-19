"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Edit, Trash2, UserIcon } from "lucide-react"
import { StoreInfoCell, ProvinceCell, LaunchTrainDateCell, ChecklistCell } from "./cells/index"
import type { Store, User } from "@/lib/firebase/types"
import { SearchInput, FilterBar } from "@/components/shared/filters"
import { useLeadFilters } from "@/hooks/use-lead-filters"
import { Progress } from "@/components/ui/progress"
import { Timestamp } from "firebase/firestore"

interface CorporateLeadsTabProps {
  stores: Store[]
  users: User[]
  currentUser: User | null
  onAddStore: (count: number) => void
  onEditStore: (store: Store) => void
  onDeleteStore: (storeId: string) => void
}

export function CorporateLeadsTab({
  stores,
  users,
  currentUser,
  onAddStore,
  onEditStore,
  onDeleteStore,
}: CorporateLeadsTabProps) {
  const {
    filteredData: filteredStores,
    filters,
    setSearchTerm,
    hasActiveFilters,
    clearFilters,
  } = useLeadFilters(stores, users)

  const [storeCountInput, setStoreCountInput] = useState<string>("1")

  const handleDeleteClick = (storeId: string, storeName: string) => {
    if (window.confirm(`Are you sure you want to delete "${storeName}"? This action cannot be undone.`)) {
      onDeleteStore(storeId)
    }
  }

  // Group stores by corporate type
  const sparStores = filteredStores.filter(store => store.storeType === "spar corporate")
  const picknpayStores = filteredStores.filter(store => store.storeType === "picknpay corporate")

  // Calculate stores rolling out this month (October 2025)
  const currentDate = new Date(2025, 9, 10) // October 2025 (month is 0-based)
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  const isInCurrentMonth = (launchDate: Timestamp | Date | null): boolean => {
    if (!launchDate) return false
    let date: Date
    if (launchDate instanceof Timestamp) {
      date = launchDate.toDate()
    } else if (launchDate instanceof Date) {
      date = launchDate
    } else {
      return false
    }
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  }

  const totalRolloutThisMonth = filteredStores.filter(store => isInCurrentMonth(store.launchDate ?? null)).length
  const sparRolloutThisMonth = sparStores.filter(store => isInCurrentMonth(store.launchDate ?? null)).length
  const picknpayRolloutThisMonth = picknpayStores.filter(store => isInCurrentMonth(store.launchDate ?? null)).length

  // Progress bar: total corporate stores (out of a target, e.g., 100)
  const totalCorporateStores = sparStores.length + picknpayStores.length
  const targetStores = 100 // Adjustable target
  const progressPercentage = Math.min((totalCorporateStores / targetStores) * 100, 100)

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Corporate Stores Rollout</h2>
          <p className="text-sm text-gray-600">Manage SPAR and Pick n Pay corporate stores for rollout</p>
          <p className="text-sm text-gray-600 mt-1">
            <strong>{totalRolloutThisMonth}</strong> store{totalRolloutThisMonth !== 1 ? "s" : ""} rolling out in October 2025
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="1"
            value={storeCountInput}
            onChange={(e) => setStoreCountInput(e.target.value)}
            placeholder="Number of stores"
            className="w-32"
          />
          <Button
            onClick={() => {
              const count = parseInt(storeCountInput, 10)
              if (!isNaN(count) && count > 0) {
                onAddStore(count)
              } else {
                alert("Please enter a valid number of stores (1 or more).")
              }
            }}
            className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Stores
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          Total Corporate Stores: <strong>{totalCorporateStores}</strong> / {targetStores}
        </p>
        <Progress value={progressPercentage} className="w-full" />
      </div>

      <FilterBar>
        <SearchInput value={filters.searchTerm} onChange={setSearchTerm} placeholder="Search stores..." />
        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto bg-transparent">
            Clear Search
          </Button>
        )}
      </FilterBar>

      {/* SPAR Corporate Stores */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>SPAR Corporate Stores</CardTitle>
          <p className="text-sm text-gray-600">
            Total: <strong>{sparStores.length}</strong> | Rolling out this month: <strong>{sparRolloutThisMonth}</strong>
          </p>
        </CardHeader>
        <CardContent className="w-full overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Launch Date</TableHead>
                <TableHead>Checklist</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sparStores.map((store) => (
                <TableRow key={store.id}>
                  <StoreInfoCell tradingName={store.tradingName ?? ""} streetAddress={store.streetAddress ?? ""} />
                  <ProvinceCell province={store.province ?? ""} />
                  <LaunchTrainDateCell
                    launchDate={store.launchDate}
                    trainingDate={null} // Training date not needed for rollout
                  />
                  <ChecklistCell checklist={store.onboardingChecklist} />
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                        onClick={() => handleDeleteClick(store.id, store.tradingName ?? "")}
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
          {sparStores.length === 0 && (
            <div className="text-center py-8">
              <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No SPAR stores found</h3>
              <p className="text-gray-600 mb-4">
                {hasActiveFilters
                  ? "Try adjusting your search criteria"
                  : "Get started by adding SPAR corporate stores"}
              </p>
              {!hasActiveFilters && (
                <Button
                  onClick={() => onAddStore(1)}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add SPAR Stores
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pick n Pay Corporate Stores */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Pick n Pay Corporate Stores</CardTitle>
          <p className="text-sm text-gray-600">
            Total: <strong>{picknpayStores.length}</strong> | Rolling out this month: <strong>{picknpayRolloutThisMonth}</strong>
          </p>
        </CardHeader>
        <CardContent className="w-full overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Launch Date</TableHead>
                <TableHead>Checklist</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {picknpayStores.map((store) => (
                <TableRow key={store.id}>
                  <StoreInfoCell tradingName={store.tradingName ?? ""} streetAddress={store.streetAddress ?? ""} />
                  <ProvinceCell province={store.province ?? ""} />
                  <LaunchTrainDateCell
                    launchDate={store.launchDate}
                    trainingDate={null} // Training date not needed for rollout
                  />
                  <ChecklistCell checklist={store.onboardingChecklist} />
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                        onClick={() => handleDeleteClick(store.id, store.tradingName ?? "")}
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
          {picknpayStores.length === 0 && (
            <div className="text-center py-8">
              <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Pick n Pay stores found</h3>
              <p className="text-gray-600 mb-4">
                {hasActiveFilters
                  ? "Try adjusting your search criteria"
                  : "Get started by adding Pick n Pay corporate stores"}
              </p>
              {!hasActiveFilters && (
                <Button
                  onClick={() => onAddStore(1)}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Pick n Pay Stores
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
