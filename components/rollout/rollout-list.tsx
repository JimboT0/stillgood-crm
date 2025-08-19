"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StoreDetailsModal } from "@/components/store-details-modal"
import { Search, Filter, Calendar, MapPin, CheckCircle, Clock, Eye, CheckCircle2Icon } from "lucide-react"
import type { Store, User } from "@/lib/firebase/types"
import { Timestamp } from "firebase/firestore"
import { formatDateTime } from "../utils/date-utils"
import { ProvinceCell } from "../cells/province-cell"
import { LaunchTrainDateCell, SalespersonCell, StoreInfoCell } from "../cells"

interface RolloutListProps {
  stores: Store[]
  users: User[]
  currentUser: User | null
  onToggleSetup: (storeId: string) => Promise<void>
  onSetupConfirmation: (storeId: string) => Promise<void>
}

export function RolloutList({ stores, users, currentUser, onToggleSetup, onSetupConfirmation }: RolloutListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "setup" | "confirmed">("all")
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const isSuperadmin = currentUser?.role === "superadmin"

  // Get current date for comparison
  const currentDate = new Date()

  // Filter and sort stores
  const filteredStores = stores.filter((store) => {
    const matchesSearch =
      store.tradingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.streetAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.province.toLowerCase().includes(searchTerm.toLowerCase())

    let matchesStatus = true
    if (statusFilter === "pending") matchesStatus = !store.isSetup
    else if (statusFilter === "setup") matchesStatus = store.isSetup && !store.setupConfirmed
    else if (statusFilter === "confirmed") matchesStatus = store.setupConfirmed

    return matchesSearch && matchesStatus
  })

  // Separate stores into upcoming and past based on launchDate
  const upcomingStores = filteredStores
    .filter((store) => {
      const launchDate = store.launchDate instanceof Timestamp ? store.launchDate.toDate() : new Date(store.launchDate)
      return launchDate >= currentDate
    })
    .sort((a, b) => {
      const dateA = a.launchDate instanceof Timestamp ? a.launchDate.toDate() : new Date(a.launchDate)
      const dateB = b.launchDate instanceof Timestamp ? b.launchDate.toDate() : new Date(b.launchDate)
      return dateA.getTime() - dateB.getTime() // Ascending order (earliest first)
    })

  const pastStores = filteredStores
    .filter((store) => {
      const launchDate = store.launchDate instanceof Timestamp ? store.launchDate.toDate() : new Date(store.launchDate)
      return launchDate <= currentDate
    })
    .sort((a, b) => {
      const dateA = a.launchDate instanceof Timestamp ? a.launchDate.toDate() : new Date(a.launchDate)
      const dateB = b.launchDate instanceof Timestamp ? b.launchDate.toDate() : new Date(b.launchDate)
      return dateA.getTime() - dateB.getTime() // Ascending order (earliest first)
    })

  const getStatusBadge = (store: Store) => {
    if (store.setupConfirmed) {
      return (
        <Badge className="bg-white text-green-400">
          <CheckCircle size={32} />
        </Badge>
      )
    } else if (store.isSetup) {
      return (
        <Badge className="bg-white text-blue-500">
          <CheckCircle size={32} />
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-white text-gray-500">
          <Clock size={32} />
        </Badge>
      )
    }
  }

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
              {isSuperadmin && <TableHead></TableHead>}
              <TableHead>Location</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Setup</TableHead>
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
                <TableCell>{getStatusBadge(store)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setSelectedStore(store)}>
                      <Eye size={32} />
                    </Button>
                    {store.isSetup && !store.setupConfirmed && currentUser?.role === "superadmin" && (
                      <Button
                        size="sm"
                        className="text-green-400 bg-green-400"
                        onClick={() => onSetupConfirmation(store.id)}
                      >
                        <CheckCircle2Icon className="w-4 h-4" /> Confirmed
                      </Button>
                    )}
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
  )

  return (
    <div className="space-y-6">
      {/* Filters */}
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

      {/* Upcoming Stores */}
      {renderStoreTable(upcomingStores, "Upcoming Stores")}

      {/* Past Stores */}
      {renderStoreTable(pastStores, "Past Stores")}

      <StoreDetailsModal
        store={selectedStore}
        isOpen={!!selectedStore}
        onClose={() => setSelectedStore(null)}
        users={users}
        currentUser={currentUser}
        onToggleSetup={onToggleSetup}
        onSetupConfirmation={onSetupConfirmation}
      />
    </div>
  )
}
