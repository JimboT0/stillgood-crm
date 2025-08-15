"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Filter, Edit, Trash2, Phone, Mail, MapPin, Calendar, UserIcon, FileText, Flame, DoorClosed } from "lucide-react"
import type { Store, User } from "@/lib/firebase/types"
import { formatDateTime } from "./utils"

interface LeadsTabProps {
  stores: Store[]
  users: User[]
  currentUser: User | null
  onAddStore: () => void
  onEditStore: (store: Store) => void
  onDeleteStore: (storeId: string) => void
  onStatusChange: (storeId: string, newStatus: Store["status"]) => void
}

export function LeadsTab({
  stores,
  users,
  currentUser,
  onAddStore,
  onEditStore,
  onDeleteStore,
  onStatusChange,
}: LeadsTabProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "cold" | "warm" | "lead">("all")

  const leadStores = stores.filter((store) => store.status === "cold" || store.status === "warm" || store.status === "lead")

  const filteredStores = leadStores.filter((store) => {
    const matchesSearch =
      store.tradingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.streetAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.province.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || store.status === statusFilter

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

  const handleDeleteClick = (storeId: string, storeName: string) => {
    if (window.confirm(`Are you sure you want to delete "${storeName}"? This action cannot be undone.`)) {
      onDeleteStore(storeId)
    }
  }

  const isSuperadmin = currentUser?.role === "superadmin" || currentUser?.role === "salesperson";


  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Leads Management</h2>
          <p className="text-sm text-gray-600">Manage cold and warm leads</p>
        </div>
        <Button onClick={onAddStore} className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value: "all" | "cold" | "warm" | "lead") => setStatusFilter(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Leads</SelectItem>
            <SelectItem value="cold">Cold Leads</SelectItem>
            <SelectItem value="warm">Warm Leads</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{leadStores.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Cold Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {leadStores.filter((s) => s.status === "cold").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Warm Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {leadStores.filter((s) => s.status === "warm").length}
            </div>
          </CardContent>
        </Card>
      </div>

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
                {isSuperadmin ? <TableHead>Lead By</TableHead> : null}
                <TableHead>Status</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Training Date</TableHead>
                <TableHead>Launch Date</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Contract Terms</TableHead>
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
                   {isSuperadmin ? <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
                          {getSalespersonInitials(store.salespersonId)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{getSalespersonName(store.salespersonId)}</span>
                    </div>
                  </TableCell> : null}
                  <TableCell>
                    <Badge
                      variant={
                        store.status === "warm"
                          ? "default"
                          : store.status === "cold"
                          ? "secondary"
                          : "secondary"
                      }
                      className={
                        store.status === "warm"
                          ? "bg-orange-100 text-orange-800"
                          : store.status === "cold"
                          ? "bg-blue-100 text-blue-800"
                          : ""
                      }
                    >
                      {store.status === "lead"
                        ? "Lead"
                        : store.status === "warm"
                        ? "Warm"
                        : store.status === "cold"
                        ? "Cold"
                        : ""}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {store.contactPersons && store.contactPersons.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {store.contactPersons[0].phone}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {store.contactPersons[0].email}
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {store.province}
                    </div>
                  </TableCell>
                  <TableCell>
                    {store.trainingDate ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3 text-green-500" />
                        {formatDateTime(store.trainingDate)}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {store.launchDate ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3 text-blue-500" />
                         {formatDateTime(store.launchDate)}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {store.slaDocument && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                          <FileText className="w-3 h-3 mr-1" />
                          SLA
                        </Badge>
                      )}
                      {store.bankDocument && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                          <FileText className="w-3 h-3 mr-1" />
                          Bank
                        </Badge>
                      )}
                      {!store.slaDocument && !store.bankDocument && <span className="text-gray-400 text-sm">None</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {!store.contractTerms ||
                     store.contractTerms.months === undefined ||
                     store.contractTerms.months === 0 ||
                     store.contractTerms.months === "0" ? (
                      <div className="text-xs text-gray-500 truncate max-w-20">None</div>
                    ) : (
                      <div className="text-sm">
                        <div>
                          {store.contractTerms.months} months
                        </div>
                        {store.contractTerms.notes === undefined ||
                         store.contractTerms.notes === 0 ||
                         store.contractTerms.notes === "0" ? (
                          <div className="text-xs text-gray-500 truncate max-w-20">no notes</div>
                        ) : (
                          <div className="text-xs text-gray-500 truncate max-w-20">
                            {store.contractTerms.months}
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => onEditStore(store)}>
                        <Edit className="w-3 h-3" />
                      </Button>
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
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by adding your first lead"}
              </p>
              {!searchTerm && statusFilter === "all" && (
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
