"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Eye, CheckCircle, Calendar, MapPin, Rocket, FileText } from "lucide-react";
import { ClosedStoreEditModal } from "./closed-store-edit-modal";
import { Timestamp } from "firebase/firestore";
import { formatDateTime } from "./utils";

// Type Definitions
interface Store {
  id: string;
  tradingName: string;
  streetAddress: string;
  province: string;
  status: string;
  salespersonId: string;
  trainingDate?: Timestamp;
  launchDate?: Timestamp;
  pushedToRollout?: boolean;
  signedSla?: string;
  bankConfirmation?: string;
  notes?: string;
  contactPersons?: Array<{
    name: string;
    designation: string;
    phone?: string;
    email?: string;
    isPrimary?: boolean;
  }>;
  collectionTimes?: {
    mondayFriday: { from: string; to: string };
    saturday: { from: string; to: string };
    sunday: { from: string; to: string };
    publicHoliday: { from: string; to: string };
  };
  products?: Array<{ id: string; name: string }>;
  contractTerms?: { months: number; notes: string };
}

interface User {
  id: string;
  name: string;
  role: "superadmin" | "salesperson" | "mediateam";
}

// Placeholder Firebase update function
async function updateStore(storeId: string, updates: Partial<Store>) {
  try {
    console.log(`Updating store ${storeId} with:`, updates);
    // Add your Firebase update logic here
    await new Promise((resolve) => setTimeout(resolve, 500));
    alert("Store updated successfully!");
  } catch (error) {
    console.error("Failed to update store:", error);
    alert("Failed to update store. Please try again.");
  }
}

// Utility Functions
const getStoreStatus = (store: Store): "pending" | "ready" | "pushed" => {
  if (store.pushedToRollout) return "pushed";
  if (store.trainingDate && store.launchDate) return "ready";
  return "pending";
};

const getStatusBadge = (store: Store) => {
  const status = getStoreStatus(store);
  switch (status) {
    case "pushed":
      return (
        <Badge className="bg-purple-100 text-purple-800">
          <Rocket className="w-3 h-3 mr-1" />
          In Rollout
        </Badge>
      );
    case "ready":
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Ready for Rollout
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          <Calendar className="w-3 h-3 mr-1" />
          Pending Setup
        </Badge>
      );
  }
};

const getSalespersonName = (salespersonId: string, users: User[]) => {
  const salesperson = users.find((user) => user.id === salespersonId);
  return salesperson?.name || "Unknown";
};

const getSalespersonInitials = (salespersonId: string, users: User[]) => {
  const salesperson = users.find((user) => user.id === salespersonId);
  return salesperson?.name.split(" ").map((n) => n[0]).join("") || "?";
};

// Filters Component
interface FiltersProps {
  searchTerm: string;
  statusFilter: "all" | "pending" | "ready" | "pushed";
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: "all" | "pending" | "ready" | "pushed") => void;
}

function Filters({ searchTerm, statusFilter, setSearchTerm, setStatusFilter }: FiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search closed deals..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          aria-label="Search closed deals"
        />
      </div>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-full sm:w-48">
          <Filter className="w-4 h-4 mr-2" />
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Deals</SelectItem>
          <SelectItem value="pending">Pending Setup</SelectItem>
          <SelectItem value="ready">Ready for Rollout</SelectItem>
          <SelectItem value="pushed">In Rollout</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

// Stats Cards Component
interface StatsCardsProps {
  closedStores: Store[];
}

function StatsCards({ closedStores }: StatsCardsProps) {


  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Total Closed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{closedStores.length}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Pending Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {closedStores.filter((s) => getStoreStatus(s) === "pending").length}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Ready for Rollout</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {closedStores.filter((s) => getStoreStatus(s) === "ready").length}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">In Rollout</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {closedStores.filter((s) => getStoreStatus(s) === "pushed").length}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Store Table Component
interface StoreTableProps {
  filteredStores: Store[];
  users: User[];
  onViewDocument: (store: Store, documentType: "sla" | "bank") => void;
  onPushToRollout: (store: Store) => void;
  setSelectedStore: (store: Store | null) => void;
  currentUser: User | null;
  searchTerm: string;
  statusFilter: "all" | "pending" | "ready" | "pushed";
}

function StoreTable({
  filteredStores,
  users,
  onViewDocument,
  onPushToRollout,
  setSelectedStore,
  currentUser,
  searchTerm,
  statusFilter,
}: StoreTableProps) {
  const isSuperAdmin = currentUser?.role === "superadmin";

  
  

  return (
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
                {isSuperAdmin ? <TableHead>Lead By</TableHead> : null}
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Training Date</TableHead>
              <TableHead>Launch Date</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStores.map((store) => (
              <TableRow key={store.id}>
                <TableCell>
                  <div className="font-medium">{store.tradingName}</div>
                  <div className="text-sm text-gray-500">{store.streetAddress}</div>
                </TableCell>
                {isSuperAdmin ?
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
                          {getSalespersonInitials(store.salespersonId, users)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{getSalespersonName(store.salespersonId, users)}</span>
                    </div>
                  </TableCell>
                  : null}
                <TableCell>{getStatusBadge(store)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    {store.province}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="w-3 h-3 text-green-500" />
                    {formatDateTime(store.trainingDate)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="w-3 h-3 text-blue-500" />
                    {formatDateTime(store.launchDate)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewDocument(store, "sla")}
                      disabled={!store.signedSla}
                      className={store.signedSla ? "" : "opacity-50"}
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      SLA
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewDocument(store, "bank")}
                      disabled={!store.bankConfirmation}
                      className={store.bankConfirmation ? "" : "opacity-50"}
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      Bank
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedStore(store)}
                      className="bg-orange-100 text-orange-700 hover:bg-orange-200"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View/Edit
                    </Button>
                    {!store.pushedToRollout && store.trainingDate && store.launchDate && (
                        <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          console.log("Launching rollout for store:", store.id);
                          onPushToRollout(store);
                        }}
                        className="bg-purple-500 text-white hover:bg-purple-600"
                        >
                        <Rocket className="w-3 h-3 mr-1" />
                        Rollout
                        </Button>
                    )}
                    {store.pushedToRollout && (
                      <Button size="sm" variant="outline" className="bg-green-500 text-white" disabled>
                        Pushed
                        <CheckCircle className="w-3 h-3 ml-1" />
                      </Button>
                    )}
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
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Closed deals will appear here once you close some leads"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ClosedTab Props
interface ClosedTabProps {
  stores: Store[];
  users: User[];
  currentUser: User | null;
  onViewDocument: (store: Store, documentType: "sla" | "bank") => void;
  onSetupConfirmation: (storeId: string) => void;
  onPushToRollout: (store: Store) => void;
  onMarkAsError: (storeId: string, errorDescription: string) => void;
}

// Main ClosedTab Component
export function ClosedTab({
  stores,
  users,
  currentUser,
  onViewDocument,
  onPushToRollout,
}: ClosedTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "ready" | "pushed">("all");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  const closedStores = stores.filter((store) => store.status === "closed");

  const filteredStores = useMemo(() => {
    return closedStores.filter((store) => {
      const matchesSearch =
        store.tradingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.streetAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.province.toLowerCase().includes(searchTerm.toLowerCase());

      const status = getStoreStatus(store);
      return matchesSearch && (statusFilter === "all" || statusFilter === status);
    });
  }, [closedStores, searchTerm, statusFilter]);

  const handleSaveStore = async (store: Store) => {
    try {
      await updateStore(store.id, store);
      setSelectedStore(store);
    } catch (error) {
      console.error("Failed to update store:", error);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Closed Deals</h2>
          <p className="text-sm text-gray-600">Manage closed deals and prepare for rollout</p>
        </div>
      </div>

      <Filters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        setSearchTerm={setSearchTerm}
        setStatusFilter={setStatusFilter}
      />

      <StatsCards closedStores={closedStores} />

      <StoreTable
        filteredStores={filteredStores}
        users={users}
        onViewDocument={onViewDocument}
        onPushToRollout={onPushToRollout}
        setSelectedStore={setSelectedStore}
        currentUser={currentUser}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
      />

      <ClosedStoreEditModal
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
// "use client"

// import { useState } from "react"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Avatar, AvatarFallback } from "@/components/ui/avatar"
// import { Input } from "@/components/ui/input"
// import { RolloutModal } from "@/components/rollout-modal"
// import { Search, Calendar, UserIcon, MapPin, Rocket } from "lucide-react"
// import type { Store, User } from "@/lib/firebase/types"
// import { ClosedStoreEditModal } from "./closed-store-edit-modal"

// interface ClosedTabProps {
//   stores: Store[]
//   users: User[]
//   currentUser: User | null
//   onPushToRollout: (storeId: string, trainingDate: string, launchDate: string) => Promise<void>
// }

// export function ClosedTab({ stores, users, currentUser, onPushToRollout }: ClosedTabProps) {
//   const [searchTerm, setSearchTerm] = useState("")
//   const [rolloutStore, setRolloutStore] = useState<Store | null>(null)

//   const [selectedStore, setSelectedStore] = useState<Store | null>(null);


//   const closedStores = stores.filter((store) => store.status === "closed")

//   const filteredStores = closedStores.filter((store) => {
//     const matchesSearch =
//       store.tradingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       store.streetAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       store.province.toLowerCase().includes(searchTerm.toLowerCase())

//     return matchesSearch
//   })

//   const getSalespersonName = (salespersonId: string) => {
//     const salesperson = users.find((user) => user.id === salespersonId)
//     return salesperson?.name || "Unknown"
//   }

//   const handleSaveStore = async (store: Store) => {
//     try {
//       await updateStore(store.id, store);
//       setSelectedStore(store);
//     } catch (error) {
//       console.error("Failed to update store:", error);
//     }
//   };

//   const getSalespersonInitials = (salespersonId: string) => {
//     const salesperson = users.find((user) => user.id === salespersonId)
//     return (
//       salesperson?.name
//         .split(" ")
//         .map((n) => n[0])
//         .join("") || "?"
//     )
//   }

//   const handlePushToRolloutClick = (store: Store) => {
//     setRolloutStore(store)
//   }

//   const handleRolloutSubmit = async (trainingDate: string, launchDate: string) => {
//     if (rolloutStore) {
//       await onPushToRollout(rolloutStore.id, trainingDate, launchDate)
//       setRolloutStore(null)
//     }
//   }

//   return (
//     <div className="space-y-6 w-full">
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//         <div>
//           <h2 className="text-xl font-semibold text-gray-900">Closed Deals</h2>
//           <p className="text-sm text-gray-600">Manage closed deals and push to rollout</p>
//         </div>
//       </div>

//       {/* Search */}
//       <div className="flex flex-col sm:flex-row gap-4">
//         <div className="relative flex-1">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//           <Input
//             placeholder="Search closed deals..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="pl-10"
//           />
//         </div>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <Card>
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium text-gray-600">Total Closed</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-green-600">{closedStores.length}</div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium text-gray-600">In Rollout</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-purple-600">
//               {closedStores.filter((s) => s.pushedToRollout).length}
//             </div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="pb-2">
//             <CardTitle className="text-sm font-medium text-gray-600">Pending Rollout</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-orange-600">
//               {closedStores.filter((s) => !s.pushedToRollout).length}
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Closed Deals Table */}
//       <Card className="w-full">
//         <CardHeader>
//           <CardTitle>Closed Deals</CardTitle>
//           <CardDescription>All successfully closed deals</CardDescription>
//         </CardHeader>
//         <CardContent className="w-full overflow-x-auto">
//           <Table className="w-full">
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Store</TableHead>
//                 <TableHead>Salesperson</TableHead>
//                 <TableHead>Location</TableHead>
//                 <TableHead>Training Date</TableHead>
//                 <TableHead>Launch Date</TableHead>
//                 <TableHead>Contract</TableHead>
//                 <TableHead>Edit</TableHead>
//                 <TableHead>Status</TableHead>
//                 <TableHead>Actions</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {filteredStores.map((store) => (
//                 <TableRow key={store.id}>
//                   <TableCell>
//                     <div className="">
//                       {store.tradingName.length > 20
//                         ? `${store.tradingName.slice(0, 20)}...`
//                         : store.tradingName}
//                     </div>

//                     <div className="text-sm text-gray-500">
//                       {store.streetAddress.length > 20
//                         ? `${store.streetAddress.slice(0, 20)}...`
//                         : store.streetAddress}
//                     </div>

//                   </TableCell>
//                   <TableCell>
//                     <div className="flex items-center gap-2">
//                       <Avatar className="w-6 h-6">
//                         <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
//                           {getSalespersonInitials(store.salespersonId)}
//                         </AvatarFallback>
//                       </Avatar>
//                       <span className="text-sm">{getSalespersonName(store.salespersonId)}</span>
//                     </div>
//                   </TableCell>
//                   <TableCell>
//                     <div className="flex items-center gap-1 text-sm">
//                       <MapPin className="w-3 h-3 text-gray-400" />
//                       {store.province}
//                     </div>
//                   </TableCell>
//                   <TableCell>
//                     {store.trainingDate ? (
//                       <div className="flex items-center gap-1 text-sm">
//                         <Calendar className="w-3 h-3 text-green-500" />
//                         {store.trainingDate}
//                       </div>
//                     ) : (
//                       <span className="text-gray-400 text-sm">Not set</span>
//                     )}
//                   </TableCell>
//                   <TableCell>
//                     {store.launchDate ? (
//                       <div className="flex items-center gap-1 text-sm">
//                         <Calendar className="w-3 h-3 text-blue-500" />
//                         {store.launchDate}
//                       </div>
//                     ) : (
//                       <span className="text-gray-400 text-sm">Not set</span>
//                     )}
//                   </TableCell>
//                   <TableCell>
//                     {store.contractTerms ? (
//                       <div className="text-sm">
//                         <div>{store.contractTerms.months} months</div>
//                         {store.contractTerms.notes && (
//                           <div className="text-xs text-gray-500 truncate max-w-20">{store.contractTerms.notes}</div>
//                         )}
//                       </div>
//                     ) : (
//                       <span className="text-gray-400 text-sm">Not set</span>
//                     )}
//                   </TableCell>
//                   <TableCell>
//                     <ClosedStoreEditModal
//                       store={selectedStore}
//                       isOpen={!!selectedStore}
//                       onClose={() => setSelectedStore(null)}
//                       onSave={handleSaveStore}
//                       isMovingToClosed={false}
//                       currentUserId={currentUser?.id}
//                     />
//                   </TableCell>
//                   <TableCell>
//                     {store.pushedToRollout ? (
//                       <Badge className="bg-purple-100 text-purple-800">
//                         <Rocket className="w-3 h-3 mr-1" />
//                         In Rollout
//                       </Badge>
//                     ) : (
//                       <Badge variant="secondary">Closed</Badge>
//                     )}
//                   </TableCell>
//                   <TableCell>
//                     {!store.pushedToRollout && (
//                       <Button
//                         size="sm"
//                         className="bg-purple-500 hover:bg-purple-600"
//                         onClick={() => handlePushToRolloutClick(store)}
//                       >
//                         <Rocket className="w-3 h-3 mr-1" />
//                         Rollout
//                       </Button>
//                     )}
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>

//           {filteredStores.length === 0 && (
//             <div className="text-center py-8">
//               <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//               <h3 className="text-lg font-medium text-gray-900 mb-2">No closed deals found</h3>
//               <p className="text-gray-600">
//                 {searchTerm ? "Try adjusting your search criteria" : "Closed deals will appear here"}
//               </p>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       <RolloutModal
//         store={rolloutStore}
//         isOpen={!!rolloutStore}
//         onClose={() => setRolloutStore(null)}
//         onSubmit={handleRolloutSubmit}
//       />
//     </div>
//   )
// }
