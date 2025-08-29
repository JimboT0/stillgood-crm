"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar, MapPin, Users, CheckCircle, AlertTriangle, Edit, Info } from "lucide-react"
import { storeService } from "@/lib/firebase/services/store"
import { userService } from "@/lib/firebase/services/user"
import type { Store, User } from "@/lib/firebase/types"
import { StoreAssignmentModal } from "@/components/modals/store-assignment-modal"
import { StoreDetailsModal } from "@/components/modals/store-details-modal"

interface RolloutDetailModalProps {
  store: Store | null
  isOpen: boolean
  onClose: () => void
}

export function RolloutDetailModal({ store, isOpen, onClose }: RolloutDetailModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editedStore, setEditedStore] = useState<Partial<Store>>({})
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false)
  const [isStoreDetailsModalOpen, setIsStoreDetailsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (store && isOpen) {
      setEditedStore({
        trainingDate: store.trainingDate,
        launchDate: store.launchDate,
        isSetup: store.isSetup,
      })
      loadUsers()
    }
  }, [store, isOpen])

  const loadUsers = async () => {
    try {
      const allUsers = await userService.getAll()
      setUsers(allUsers)
    } catch (error) {
      console.error("Error loading users:", error)
    }
  }

  const handleSave = async () => {
    if (!store) return

    setLoading(true)
    try {
      await storeService.update(store.id, editedStore)
      setIsEditing(false)
      // Refresh the store data
      const updatedStore = await storeService.getById(store.id)
      if (updatedStore) {
        Object.assign(store, updatedStore)
      }
    } catch (error) {
      console.error("Error updating store:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSetupToggle = async () => {
    if (!store) return

    setLoading(true)
    try {
      const newSetupStatus = !store.isSetup
      await storeService.update(store.id, { isSetup: newSetupStatus })
      store.isSetup = newSetupStatus
      setEditedStore({ ...editedStore, isSetup: newSetupStatus })
    } catch (error) {
      console.error("Error toggling setup status:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignUsers = async (userIds: string[], message: string) => {
    if (!store) return

    try {
      await storeService.assignUsers(store.id, userIds, "current-user", message)
      // Refresh store data
      const updatedStore = await storeService.getById(store.id)
      if (updatedStore) {
        Object.assign(store, updatedStore)
      }
    } catch (error) {
      console.error("Error assigning users:", error)
      throw error
    }
  }

  const getAssignedUsers = () => {
    if (!store?.assignedUsers) return []
    return users.filter((user) => store.assignedUsers?.includes(user.id))
  }

  if (!store) return null

  const assignedUsers = getAssignedUsers()

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              Rollout Details - {store.tradingName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Store Information */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Store Information</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsStoreDetailsModalOpen(true)}
                    className="border-orange-200 text-orange-700 hover:bg-orange-50"
                  >
                    <Info className="w-4 h-4 mr-2" />
                    Store Details
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="text-gray-500">Location:</span>
                      <div className="font-medium">{store.province}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="text-gray-500">Address:</span>
                      <div className="font-medium">{store.streetAddress}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <Badge className="ml-2 bg-green-100 text-green-800">Closed</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <div>
                      <span className="text-gray-500">Setup:</span>
                      <Badge
                        className={`ml-2 ${store.isSetup ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                      >
                        {store.isSetup ? "Complete" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rollout Schedule */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Rollout Schedule</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="border-orange-200 text-orange-700 hover:bg-orange-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {isEditing ? "Cancel" : "Edit"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="trainingDate">Training Date</Label>
                    {isEditing ? (
                      <Input
                        id="trainingDate"
                        type="date"
                        value={editedStore.trainingDate || ""}
                        onChange={(e) => setEditedStore({ ...editedStore, trainingDate: e.target.value })}
                      />
                    ) : (
                      <div className="p-2 border rounded bg-gray-50">{store.trainingDate || "Not set"}</div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="launchDate">Launch Date</Label>
                    {isEditing ? (
                      <Input
                        id="launchDate"
                        type="date"
                        value={editedStore.launchDate || ""}
                        onChange={(e) => setEditedStore({ ...editedStore, launchDate: e.target.value })}
                      />
                    ) : (
                      <div className="p-2 border rounded bg-gray-50">{store.launchDate || "Not set"}</div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-orange-500 hover:bg-orange-600">
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Setup Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Setup Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="setupComplete"
                      checked={store.isSetup || false}
                      onCheckedChange={handleSetupToggle}
                      disabled={loading}
                    />
                    <Label htmlFor="setupComplete" className="text-base">
                      Store setup is complete and active
                    </Label>
                  </div>
                  {store.isSetup && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Check this box when the store setup is complete and the store is active on the webapp.
                </p>
              </CardContent>
            </Card>

            {/* Team Assignment */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Team Assignment</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAssignmentModalOpen(true)}
                    className="border-orange-200 text-orange-700 hover:bg-orange-50"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Assign Team
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {assignedUsers.length > 0 ? (
                  <div className="space-y-3">
                    {assignedUsers.map((user) => (
                      <div key={user.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-orange-100 text-orange-700 text-sm">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{user.name}</div>
                          <div className="text-xs text-gray-600">{user.email}</div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {user.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No team members assigned</p>
                    <p className="text-sm mt-1">Click "Assign Team" to add team members to this rollout</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="bg-transparent">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <StoreAssignmentModal
        store={store}
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        onAssignUsers={handleAssignUsers}
        users={users}
        currentUserId="current-user"
      />

      <StoreDetailsModal
        store={store}
        isOpen={isStoreDetailsModalOpen}
        onClose={() => setIsStoreDetailsModalOpen(false)}
      />
    </>
  )
}
