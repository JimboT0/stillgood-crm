"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, Send } from "lucide-react"
import type { Store, User } from "@/lib/firebase/types"

interface StoreAssignmentModalProps {
  store: Store | null
  isOpen: boolean
  onClose: () => void
  onAssignUsers: (userIds: string[], message: string) => Promise<void>
  users: User[]
  currentUserId: string
}

export function StoreAssignmentModal({
  store,
  isOpen,
  onClose,
  onAssignUsers,
  users,
  currentUserId,
}: StoreAssignmentModalProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [message, setMessage] = useState("")
  const [isAssigning, setIsAssigning] = useState(false)

  const handleUserToggle = (userId: string) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const handleAssign = async () => {
    if (selectedUsers.length === 0) {
      alert("Please select at least one user to assign")
      return
    }

    setIsAssigning(true)
    try {
      await onAssignUsers(selectedUsers, message)
      setSelectedUsers([])
      setMessage("")
      onClose()
    } catch (error) {
      console.error("Error assigning users:", error)
      alert("Failed to assign users. Please try again.")
    } finally {
      setIsAssigning(false)
    }
  }

  if (!store) return null

  const availableUsers = users.filter((user) => user.id !== currentUserId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            Assign Team to {store.tradingName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Selection */}
          <div>
            <Label className="text-base font-medium">Select Team Members</Label>
            <p className="text-sm text-gray-600 mb-4">Choose users to assign to this store rollout</p>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {availableUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleUserToggle(user.id)}
                >
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={() => handleUserToggle(user.id)}
                  />
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
                  <Badge variant={user.role === "superadmin" ? "default" : "secondary"} className="text-xs">
                    {user.role === "superadmin" ? "Admin" : "Salesperson"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="assignment-message" className="text-base font-medium">
              Assignment Message (Optional)
            </Label>
            <p className="text-sm text-gray-600 mb-2">Add a message for the assigned team members</p>
            <Textarea
              id="assignment-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter assignment details, instructions, or notes..."
              rows={4}
            />
          </div>

          {/* Selected Users Summary */}
          {selectedUsers.length > 0 && (
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Selected Team Members ({selectedUsers.length})</h4>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((userId) => {
                  const user = users.find((u) => u.id === userId)
                  return user ? (
                    <Badge key={userId} variant="secondary" className="bg-orange-100 text-orange-800">
                      {user.name}
                    </Badge>
                  ) : null
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={selectedUsers.length === 0 || isAssigning}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isAssigning ? (
              "Assigning..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Assign Team ({selectedUsers.length})
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
