"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StoreDetailsModal } from "@/components/store-details-modal"
import { Search, Filter, Calendar, MapPin, CheckCircle, Clock, Eye } from "lucide-react"
import type { Store, User } from "@/lib/firebase/types"
import { Timestamp } from "firebase/firestore" // Import Timestamp from Firebase
import { formatDateTime } from "./utils"

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

  // Helper function to format Firebase Timestamp to string
  const formatTimestamp = (timestamp: Timestamp | string | null): string => {
    if (!timestamp) return "Not set"
    if (typeof timestamp === "string") return timestamp
    if (timestamp instanceof Timestamp) {
      const date = timestamp.toDate()
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    }
    return "Invalid date"
  }

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

  const getSalespersonName = (salespersonId: string) => {
    const salesperson = users.find((user) => user.id === salespersonId)
    return salesperson?.name || "Unknown"
  }

  const getSalespersonInitials = (salespersonId: string) => {
    const salesperson = users.find((user) => user.id === salespersonId)
    return (
      salesperson?.name
        .split(" ")
        .map((n) => n[0])
        .join("") || "?"
    )
  }

  const getStatusBadge = (store: Store) => {
    if (store.setupConfirmed) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Confirmed
        </Badge>
      )
    } else if (store.isSetup) {
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Setup Complete
        </Badge>
      )
    } else {
      return (
        <Badge variant="secondary">
          <Clock className="w-3 h-3 mr-1" />
          Pending Setup
        </Badge>
      )
    }
  }

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

      {/* Rollout List */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Rollout Stores</CardTitle>
          <CardDescription>Track setup progress for all rollout stores</CardDescription>
        </CardHeader>
        <CardContent className="w-full overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                {isSuperadmin && (<TableHead>Salesperson</TableHead>)}
                <TableHead>Location</TableHead>
                <TableHead>Training Date</TableHead>
                <TableHead>Launch Date</TableHead>
                <TableHead>Status</TableHead>
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
                  {isSuperadmin && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
                            {getSalespersonInitials(store.salespersonId)}
                          </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{getSalespersonName(store.salespersonId)}</span>
                    </div>
                  </TableCell>)}
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
                  <TableCell>{getStatusBadge(store)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedStore(store)}>
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      {!store.isSetup && isSuperadmin && (
                        <Button
                          size="sm"
                          className="bg-blue-500 hover:bg-blue-600"
                          onClick={() => onToggleSetup(store.id)}
                        >
                          Mark Setup
                        </Button>
                      )}
                      {store.isSetup && !store.setupConfirmed && currentUser?.role === "superadmin" && (
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600"
                          onClick={() => onSetupConfirmation(store.id)}
                        >
                          Confirm
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No rollout stores found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Stores will appear here once pushed to rollout"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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
