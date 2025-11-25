"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CheckCircle, Rocket, EditIcon, Check } from "lucide-react";
import { ClosedStoreEditModal } from "./modals/closed-store-edit-modal";
import {
  DocumentsCell,
  LaunchTrainDateCell,
  ProvinceCell,
  SalespersonCell,
  StoreInfoCell,
  StoreStatusBadge,
} from "./cells";
import type { Store, User } from "@/lib/firebase/types";
import { useClosedFilters } from "@/hooks/use-closed-filters";
import { SearchInput, StatusFilter, CLOSED_STATUS_OPTIONS, AdvancedFilterBar } from "@/components/shared/filters";
import { useState } from "react";
import { StoreEditModal } from "./modals/store-edit-modal";

interface ClosedTabProps {
  stores: Store[];
  users: User[];
  currentUser: User | null;
  onViewDocument: (store: Store, documentType: "sla" | "bank") => void;
  onSetupConfirmation: (storeId: string) => void;
  onPushToRollout: (store: Store) => void; // Updated prop name
}

const getStoreStatus = (store: Store): "closed" | "pending setup" | "rollout" => {
  if (store.status === "rollout" || store.pushedToRollout) return "rollout";
  if (store.status === "pending setup") return "pending setup";
  if (store.status === "closed") return "closed";
  return "pending setup";
};

export function ClosedTab({
  stores,
  users,
  currentUser,
  onViewDocument,
  onSetupConfirmation,
  onPushToRollout,
}: ClosedTabProps) {
  const {
    filteredData: filteredStores,
    filters,
    setSearchTerm,
    setStatusFilter,
    closedStatusCounts,
    hasActiveFilters,
    clearFilters,
  } = useClosedFilters(stores, users);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  const handleSaveStore = async (store: Store) => {
    try {
      setSelectedStore(store);
    } catch (error) {
      console.error("Failed to update store:", error);
    }
  };

  const handlePushToPendingSetup = (store: Store) => {
    onPushToRollout(store);
  };

  const handleLoadPreset = (presetFilters: any) => {
    Object.entries(presetFilters).forEach(([key, value]) => {
      if (key === "searchTerm") setSearchTerm(value as string);
      else if (key === "statusFilter") setStatusFilter(value as string);
    });
  };

  const isSuperadmin = currentUser?.role === "superadmin";

  return (
    <div className="space-y-6 w-full">
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
          options={[
            ...CLOSED_STATUS_OPTIONS,
            { value: "pendingSetup", label: "Pending Setup" },
          ]}
          placeholder="Filter by status"
        />
      </AdvancedFilterBar>

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
                {isSuperadmin && <TableHead>Creator</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Docs</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStores.map((store) => {
                const status = getStoreStatus(store);
                return (
                  <TableRow key={store.id}>
                    <StoreInfoCell tradingName={store.tradingName || ""} streetAddress={store.streetAddress || ""} />
                    <SalespersonCell isSuperadmin={isSuperadmin} salespersonId={store.salespersonId || ""}  users={users} />
                    <StoreStatusBadge status={status} isKeyAccount={!!store.isKeyAccount} />
                    <ProvinceCell province={store.province || ""} />
                    <LaunchTrainDateCell launchDate={store.launchDate} trainingDate={store.trainingDate} />
                    <DocumentsCell store={store} onViewDocument={onViewDocument} />
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {status === "closed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePushToPendingSetup(store)}
                            className="bg-purple-500 text-white hover:bg-purple-600"
                          >
                            <Rocket className="w-4 h-4" />
                            Rollout!
                          </Button>
                        )}
                        {status === "pending setup" && isSuperadmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onSetupConfirmation(store.id)} // Simplified to use onSetupConfirmation directly
                            className="bg-yellow-500 text-white hover:bg-yellow-600"
                          >
                            <Check className="w-4 h-4" />
                            Confirm Setup
                          </Button>
                        )}
                        {status === "rollout" && (
                          <Button size="sm" variant="outline" className="bg-green-500 text-white" disabled>
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setSelectedStore(store)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 bg-transparent"
                        >
                          <EditIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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

      <StoreEditModal
        store={selectedStore}
        isOpen={!!selectedStore}
        onClose={() => setSelectedStore(null)}
        onSave={handleSaveStore}
        isMovingToClosed={false}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}
