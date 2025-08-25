"use client"

import { useState, useEffect } from "react"
import { auth } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, Search, MapPin, Phone, Mail, User, Calendar, Users, Plus, Edit, Trash2 } from "lucide-react"
import { GroupCreateModal } from "./modals/group-create-modal"
import { GroupEditModal } from "./modals/group-edit-modal"
import { groupService } from "@/lib/firebase/services/group"
import type { Store, User as UserType, StoreGroup } from "@/lib/firebase/types"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Timestamp } from "firebase/firestore"
import { formatDateTimeForDisplay } from "@/lib/utils/date-utils"

interface KeyAccountsTabProps {
  stores: Store[]
  users: UserType[]
  currentUser: UserType | null
  onEditStore: (store: Store) => void
  onStatusChange: (storeId: string, newStatus: Store["status"]) => Promise<void>
}

export function KeyAccountsTab({ stores, users, currentUser, onEditStore, onStatusChange }: KeyAccountsTabProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [managerFilter, setManagerFilter] = useState<string>("all")
  const [groups, setGroups] = useState<StoreGroup[]>([])
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<StoreGroup | null>(null)
  const [isLoading, setIsLoading] = useState(true)


  // Load groups and log user info
  useEffect(() => {
    console.log("Current user:", {
      uid: currentUser?.id,
      role: currentUser?.role,
      name: currentUser?.name,
      authUid: auth.currentUser?.uid,
    })
    const loadGroups = async () => {
      try {
        const groupsData = await groupService.getAll()
        console.log("Loaded groups:", groupsData)
        setGroups(groupsData)
      } catch (error) {
        console.error("Error loading groups:", error)
        alert("Failed to load groups. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }
    loadGroups()
  }, [currentUser])

  // Filter key accounts - handle undefined isKeyAccount values
  const keyAccounts = stores.filter((store) => store.isKeyAccount === true)

  const filteredStores = keyAccounts.filter((store) => {
    const matchesSearch =
      store.tradingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.streetAddress.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || store.status === statusFilter
    const matchesManager = managerFilter === "all" || store.keyAccountManager === managerFilter

    return matchesSearch && matchesStatus && matchesManager
  })

  const keyAccountManagers = users.filter((u) => u.role === "superadmin" || u.role === "salesperson")

  const getStatusColor = (status: Store["status"]) => {
    switch (status) {
      case "lead":
        return "bg-blue-100 text-blue-800"
      case "warm":
        return "bg-yellow-100 text-yellow-800"
      case "closed":
        return "bg-green-100 text-green-800"
      case "setup":
        return "bg-purple-100 text-purple-800"
      case "rollout":
        return "bg-orange-100 text-orange-800"
      case "completed":
        return "bg-emerald-100 text-emerald-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

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

  const getManagerName = (managerId?: string) => {
    if (!managerId) return "Unassigned"
    const manager = users.find((u) => u.id === managerId)
    return manager?.name || "Unknown"
  }

  const getGroupName = (groupId?: string) => {
    if (!groupId) return null
    const group = groups.find((g) => g.id === groupId)
    return group?.name || "Unknown Group"
  }

  const getStoresInGroup = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId)
    if (!group) return []
    // Check both store.groupId and group.storeIds for consistency
    return stores.filter((store) => store.groupId === groupId || (group.storeIds || []).includes(store.id))
  }

  const handleCreateGroup = async (groupData: Omit<StoreGroup, "id">) => {
    try {
      console.log("Creating group with data:", groupData, "by user:", {
        uid: auth.currentUser?.uid,
        role: currentUser?.role,
      })
      const groupId = await groupService.create(groupData)
      const newGroup = { ...groupData, id: groupId, storeIds: groupData.storeIds || [] }
      setGroups((prev) => [newGroup, ...prev])
    } catch (error) {
      console.error("Error creating group:", error)
      alert("Failed to create group. Please try again.")
      throw error
    }
  }

  const handleEditGroup = async (groupData: Partial<StoreGroup>, groupId: string) => {
    try {
      console.log("Updating group:", { groupId, groupData, userId: auth.currentUser?.uid })
      await groupService.update(groupId, groupData)
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, ...groupData, storeIds: g.storeIds || [] } : g)),
      )
    } catch (error) {
      console.error("Error updating group:", error)
      alert("Failed to update group. Please try again.")
      throw error
    }
  }

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete the group "${groupName}"? This will not delete the stores, but they will be ungrouped.`,
      )
    ) {
      try {
        console.log("Deleting group:", { groupId, groupName, userId: auth.currentUser?.uid })
        await groupService.deleteWithUngroup(groupId)
        setGroups((prev) => prev.filter((g) => g.id !== groupId))
      } catch (error) {
        console.error("Error deleting group:", error)
        alert(`Failed to delete group: ${error.message || "Unknown error"}. Please try again.`)
      }
    }
  }

  // Stats
  const totalKeyAccounts = keyAccounts.length
  const activeKeyAccounts = keyAccounts.filter((s) => s.status !== "completed").length
  const completedKeyAccounts = keyAccounts.filter((s) => s.status === "completed").length
  const totalGroups = groups.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" />
            Key Accounts
          </h1>
          <p className="text-gray-600">Manage your most important client relationships and store groups</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Key Accounts</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalKeyAccounts}</div>
            <p className="text-xs text-muted-foreground">High-value client accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeKeyAccounts}</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedKeyAccounts}</div>
            <p className="text-xs text-muted-foreground">Successfully launched</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Store Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGroups}</div>
            <p className="text-xs text-muted-foreground">Multi-store owners</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="accounts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="accounts">Key Accounts</TabsTrigger>
          <TabsTrigger value="groups">Store Groups</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search key accounts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="warm">Warm</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="setup">Setup</SelectItem>
                    <SelectItem value="rollout">Rollout</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={managerFilter} onValueChange={setManagerFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Managers</SelectItem>
                    {keyAccountManagers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Key Accounts List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredStores.map((store) => (
              <Card key={store.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      <div>
                        <CardTitle className="text-lg">{store.tradingName}</CardTitle>
                        {store.groupId && (
                          <div className="flex items-center gap-1 mt-1">
                            <Users className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-500">{getGroupName(store.groupId)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge className={getStatusColor(store.status)}>
                      {store.status.charAt(0).toUpperCase() + store.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{store.streetAddress}</span>
                    </div>
                    {store.contactPersons && store.contactPersons.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{store.contactPersons[0]?.name || "No contact name"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{store.contactPersons[0]?.email || "No email"}</span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-4 h-4" />
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
                          {getSalespersonInitials(store.salespersonId)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{getSalespersonName(store.salespersonId)}</span>
                    </div>
                  </div>

                  {(store.trainingDate || store.launchDate) && (
                    <div className="pt-2 border-t">
                      <div className="text-sm text-gray-600 space-y-1">
                        {store.trainingDate && <div>Training: {formatDateTimeForDisplay(store.trainingDate)}</div>}
                        {store.launchDate && <div>Launch: {formatDateTimeForDisplay(store.launchDate)}</div>}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => onEditStore(store)} className="flex-1">
                      Edit Details
                    </Button>
                    {store.status !== "completed" && (
                      <Select
                        value={store.status}
                        onValueChange={(value) => onStatusChange(store.id!, value as Store["status"])}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lead">Lead</SelectItem>
                          <SelectItem value="warm">Warm</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                          <SelectItem value="setup">Setup</SelectItem>
                          <SelectItem value="rollout">Rollout</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredStores.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Key Accounts Found</h3>
                <p className="text-gray-600">
                  {keyAccounts.length === 0
                    ? "No stores have been marked as key accounts yet."
                    : "No key accounts match your current filters."}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="groups" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Store Groups</h2>
              <p className="text-sm text-gray-600">Manage groups for multi-store owners</p>
            </div>
            <Button onClick={() => setIsGroupModalOpen(true)} className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading groups...</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {groups.map((group) => {
                const groupStores = getStoresInGroup(group.id)
                const primaryContact = group.contactPersons.find((cp) => cp.isPrimary) || group.contactPersons[0]

                return (
                  <Card key={group.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-blue-500" />
                          <div>
                            <CardTitle className="text-lg">{group.name}</CardTitle>
                            {group.description && <p className="text-sm text-gray-600 mt-1">{group.description}</p>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedGroup(group)
                              setIsEditModalOpen(true)
                            }}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteGroup(group.id, group.name)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4" />
                          <span>Owner: {group.ownerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{group.ownerEmail}</span>
                        </div>
                        {group.ownerPhone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span>{group.ownerPhone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-600">
                          <Star className="w-4 h-4" />
                          <span>Manager: {group.keyAccountManagerName}</span>
                        </div>
                      </div>

                      {primaryContact && (
                        <div className="pt-2 border-t">
                          <div className="text-sm font-medium text-gray-900 mb-1">Primary Contact</div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>
                              {primaryContact.name} - {primaryContact.designation}
                            </div>
                            <div className="flex items-center gap-4">
                              <span>{primaryContact.phone}</span>
                              <span>{primaryContact.email}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Stores in Group</span>
                          <Badge variant="outline">{groupStores.length}</Badge>
                        </div>
                        {groupStores.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {groupStores.slice(0, 3).map((store) => (
                              <div key={store.id} className="text-xs text-gray-600">
                                • {store.tradingName}
                              </div>
                            ))}
                            {groupStores.length > 3 && (
                              <div className="text-xs text-gray-500">+{groupStores.length - 3} more stores</div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {!isLoading && groups.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Store Groups</h3>
                <p className="text-gray-600 mb-4">Create groups to manage multi-store owners more efficiently.</p>
                <Button onClick={() => setIsGroupModalOpen(true)} className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Group
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <GroupCreateModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSave={handleCreateGroup}
        users={users}
        currentUser={currentUser}
      />
      {selectedGroup && (
        <GroupEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedGroup(null)
          }}
          onSave={handleEditGroup}
          group={selectedGroup}
          users={users}
          currentUser={currentUser}
        />
      )}
    </div>
  )
}
