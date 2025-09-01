"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StoreDetailModal } from "./store-detail-modal";
import { Search, Filter, CheckCircle, Eye, Share, X, CheckCheck, Share2Icon, CheckSquare } from "lucide-react";
import type { Store, User } from "@/lib/firebase/types";
import { Timestamp } from "firebase/firestore";
import { formatDateTime } from "@/lib/utils/date-utils";
import { ProvinceCell } from "@/components/cells/province-cell";
import { LaunchTrainDateCell, SalespersonCell, StoreInfoCell } from "@/components/cells";
import toast, { Toaster } from "react-hot-toast";
import { StoreDetailsModal } from "../modals/store-details-modal";

interface RolloutListProps {
  stores: Store[];
  users: User[];
  currentUser: User | null;
  onToggleSetup: (storeId: string) => Promise<void>;
  onSetupConfirmation: (storeId: string) => Promise<void>;
  onToggleSocialSetup: (storeId: string) => Promise<void>;
  updateCredentials: (storeId: string, credentials: Store['credentials']) => Promise<void>;
}

export function RolloutList({ stores, users, currentUser, onToggleSetup, onSetupConfirmation, onToggleSocialSetup, updateCredentials }: RolloutListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "setup" | "confirmed">("all");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [modalMode, setModalMode] = useState<"share" | "confirmSetup">("share");
  const isSuperadmin = currentUser?.role === "superadmin";
  const isMedia = currentUser?.role === "media";
  const [showTables, setShowTables] = useState(false);

  const currentDate = new Date();

  const filteredStores = stores.filter((store) => {
    if (store.status === "closed") {
      return true;
    }

    const matchesSearch =
      store.tradingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.streetAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.province.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === "pending") matchesStatus = !store.isSetup;
    else if (statusFilter === "setup") matchesStatus = !!store.isSetup && !store.setupConfirmed;
    else if (statusFilter === "confirmed") matchesStatus = !!store.setupConfirmed;

    return matchesSearch && matchesStatus;
  });

  const upcomingStores = filteredStores
    .filter((store) => {
      const launchDate = store.launchDate instanceof Timestamp ? store.launchDate.toDate() : new Date(store.launchDate);
      return launchDate >= currentDate;
    })
    .sort((a, b) => {
      const dateA = a.launchDate instanceof Timestamp ? a.launchDate.toDate() : new Date(a.launchDate);
      const dateB = b.launchDate instanceof Timestamp ? b.launchDate.toDate() : new Date(b.launchDate);
      return dateA.getTime() - dateB.getTime();
    });

  const pastStores = filteredStores
    .filter((store) => {
      const launchDate = store.launchDate instanceof Timestamp ? store.launchDate.toDate() : new Date(store.launchDate);
      return launchDate <= currentDate;
    })
    .sort((a, b) => {
      const dateA = a.launchDate instanceof Timestamp ? a.launchDate.toDate() : new Date(a.launchDate);
      const dateB = b.launchDate instanceof Timestamp ? b.launchDate.toDate() : new Date(b.launchDate);
      return dateA.getTime() - dateB.getTime();
    });

const handleToggleSocialSetup = async (storeId: string, tradingName: string, isSocialSetup: boolean) => {
  try {
    await onToggleSocialSetup(storeId);
    toast.success(`"${tradingName}" social setup ${isSocialSetup ? "removed" : "confirmed"}!`, {
      style: {
        background: '#fff',
        color: '#111827',
        border: '1px solid #f97316',
      },
    });
  } catch (error) {
    toast.error('Failed to toggle social setup', {
      style: {
        background: '#fff',
        color: '#111827',
        border: '1px solid #f97316',
      },
    });
  }
};


  const handleOpenConfirmSetupModal = (store: Store) => {
    setSelectedStore(store);
    setModalMode("confirmSetup");
  };

  const renderStoreTable = (stores: Store[], title: string) => (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Track setup progress for {title.toLowerCase()}</CardDescription>
      </CardHeader>
      <CardContent className="w-full overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Store</TableHead>
              {isSuperadmin && <TableHead>Salesperson</TableHead>}
              <TableHead>Location</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Socials</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores.map((store) => (
              <TableRow key={store.id}>
                <StoreInfoCell tradingName={store.tradingName} streetAddress={store.streetAddress} />
                <SalespersonCell
                  isSuperadmin={isSuperadmin}
                  salespersonId={store.salespersonId}
                  users={users}
                />
                <ProvinceCell province={store.province} />
                <LaunchTrainDateCell
                  launchDate={store.launchDate}
                  trainingDate={store.trainingDate}
                  formatDateTime={formatDateTime}
                />
                <TableCell>
                    <div className="flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                      type="checkbox"
                      checked={!!store.isSocialSetup}
                      onChange={() => handleToggleSocialSetup(store.id, store.tradingName, !!store.isSocialSetup)}
                      disabled={store.isSocialSetup || (!isSuperadmin && !isMedia)}
                      className="sr-only peer"
                      aria-label="Social Setup Confirmed"
                      />
                      <div
                      className={`w-11 h-6 rounded-full transition-colors duration-200
                        ${!!store.isSocialSetup ? "bg-green-500" : "bg-red-500"}
                        ${store.isSocialSetup ? "opacity-60" : ""}
                        peer-disabled:opacity-60`}
                      ></div>
                      <div
                      className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200
                        ${!!store.isSocialSetup ? "translate-x-5" : ""}
                        peer-disabled:opacity-60`}
                      ></div>
                    </label>
                    </div>
                </TableCell>
                <TableCell>
                  {isSuperadmin ? (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!store.credentials}
                        onChange={() => isSuperadmin && handleOpenConfirmSetupModal(store)}
                        disabled={ !isSuperadmin}
                        className="sr-only peer"
                        aria-label="Setup Confirmed"
                      />
                      <div
                        className={`w-11 h-6 rounded-full transition-colors duration-200
                          ${!!store.credentials ? "bg-green-500" : "bg-red-500"}
                          ${ !isSuperadmin ? "opacity-60" : ""}
                          peer-disabled:opacity-60`}
                      ></div>
                      <div
                        className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200
                          ${!!store.credentials ? "translate-x-5" : ""}
                          peer-disabled:opacity-60`}
                      ></div>
                    </label>
                  ) : (
                    <span className="text-sm text-gray-500">
                      {!!store.credentials ? <CheckCheck className='text-green-500' size={16} /> : <X className='text-red-500' size={16} />}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-row items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedStore(store);
                        setModalMode("share"); // Ensure StoreDetailsModal is used
                      }}
                      className="text-gray-900 hover:text-blue-600"
                    >
                      <Eye size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedStore(store);
                        setModalMode("confirmSetup"); // Ensure StoreDetailModal is used
                      }}
                      className="text-gray-500 hover:text-blue-600"
                    >
                      <Share size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {stores.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No {title.toLowerCase()} found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : `No ${title.toLowerCase()} available`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search rollout stores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value: "all" | "pending" | "setup" | "confirmed") => setStatusFilter(value)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stores</SelectItem>
            <SelectItem value="pending">Pending Setup</SelectItem>
            <SelectItem value="setup">Setup Complete</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {renderStoreTable(upcomingStores, "Upcoming Stores")}

      <Button
        variant="default"
        onClick={() => setShowTables((prev) => !prev)}
        className="mt-4"
      >
        {showTables ? "Hide Past Stores" : "Open Past Stores"}
      </Button>

      {showTables && (
        <>
          {renderStoreTable(pastStores, "Past Stores")}
        </>
      )}

      {selectedStore && modalMode === "share" && (
        <StoreDetailsModal
          store={selectedStore}
          isOpen={true}
          onClose={() => setSelectedStore(null)}
          users={users}
          currentUser={currentUser}
          onToggleSetup={onToggleSetup}
          onSetupConfirmation={onSetupConfirmation}
        />
      )}
      {selectedStore && modalMode === "confirmSetup" && (
        <StoreDetailModal
          store={selectedStore}
          isOpen={true}
          onClose={() => setSelectedStore(null)}
          users={users}
          currentUser={currentUser}
          onToggleSetup={onToggleSetup}
          onSetupConfirmation={onSetupConfirmation}
          updateCredentials={updateCredentials}
          mode={modalMode}
        />
      )}
    </div>
  );
}
