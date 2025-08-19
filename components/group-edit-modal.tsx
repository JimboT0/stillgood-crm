'use client'
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { StoreGroup, User as UserType } from "@/lib/firebase/types"

interface GroupEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (groupData: Partial<StoreGroup>, groupId: string) => Promise<void>
  group: StoreGroup
  users: UserType[]
  currentUser: UserType | null
}

export function GroupEditModal({ isOpen, onClose, onSave, group, users, currentUser }: GroupEditModalProps) {
  const [name, setName] = useState(group.name ?? "")
  const [description, setDescription] = useState(group.description ?? "")
  const [ownerName, setOwnerName] = useState(group.ownerName ?? "")
  const [ownerEmail, setOwnerEmail] = useState(group.ownerEmail ?? "")
  const [ownerPhone, setOwnerPhone] = useState(group.ownerPhone ?? "")
  const [keyAccountManager, setKeyAccountManager] = useState(group.keyAccountManager ?? "")
  const [contactPersons, setContactPersons] = useState(
    Array.isArray(group.contactPersons) && group.contactPersons.length > 0
      ? group.contactPersons.map((c) => ({
          name: c.name ?? "",
          role: c.role ?? "",
          phone: c.phone ?? "",
          email: c.email ?? "",
        }))
      : [{ name: "", role: "", phone: "", email: "" }]
  )

  useEffect(() => {
    // Reset form when group changes
    setName(group.name ?? "")
    setDescription(group.description ?? "")
    setOwnerName(group.ownerName ?? "")
    setOwnerEmail(group.ownerEmail ?? "")
    setOwnerPhone(group.ownerPhone ?? "")
    setKeyAccountManager(group.keyAccountManager ?? "")
    setContactPersons(
      Array.isArray(group.contactPersons) && group.contactPersons.length > 0
        ? group.contactPersons.map((c) => ({
            name: c.name ?? "",
            role: c.role ?? "",
            phone: c.phone ?? "",
            email: c.email ?? "",
          }))
        : [{ name: "", role: "", phone: "", email: "" }]
    )
  }, [group])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Build group data without undefined fields
      const updatedGroupData: Partial<StoreGroup> = {
        name,
        ownerName,
        ownerEmail,
        keyAccountManager,
        contactPersons,
      }
      if (description !== "") {
        updatedGroupData.description = description
      }
      if (ownerPhone !== "") {
        updatedGroupData.ownerPhone = ownerPhone
      }
      console.log("Saving updated group:", updatedGroupData)
      await onSave(updatedGroupData, group.id)
      onClose()
    } catch (error) {
      console.error("Error updating group:", error)
      alert("Failed to update group. Please try again.")
    }
  }

  const handleAddContact = () => {
    setContactPersons([...contactPersons, { name: "", role: "", phone: "", email: "" }])
  }

  const handleContactChange = (index: number, field: keyof typeof contactPersons[0], value: string) => {
    const updatedContacts = [...contactPersons]
    updatedContacts[index] = { ...updatedContacts[index], [field]: value }
    setContactPersons(updatedContacts)
  }

  const handleRemoveContact = (index: number) => {
    setContactPersons(contactPersons.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Store Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter group name"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter group description (optional)"
            />
          </div>
          <div>
            <Label htmlFor="ownerName">Owner Name</Label>
            <Input
              id="ownerName"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              required
              placeholder="Enter owner name"
            />
          </div>
          <div>
            <Label htmlFor="ownerEmail">Owner Email</Label>
            <Input
              id="ownerEmail"
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              required
              placeholder="Enter owner email"
            />
          </div>
          <div>
            <Label htmlFor="ownerPhone">Owner Phone (Optional)</Label>
            <Input
              id="ownerPhone"
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
              placeholder="Enter owner phone"
            />
          </div>
      

          <div className="space-y-2">
            <Label>Contact Persons</Label>
            {contactPersons.map((contact, index) => (
              <div key={index} className="space-y-2 border p-4 rounded-md">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Contact Name"
                    value={contact.name}
                    onChange={(e) => handleContactChange(index, "name", e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Role"
                    value={contact.role}
                    onChange={(e) => handleContactChange(index, "role", e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Phone"
                    value={contact.phone}
                    onChange={(e) => handleContactChange(index, "phone", e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={contact.email}
                    onChange={(e) => handleContactChange(index, "email", e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  {contactPersons.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveContact(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={handleAddContact}>
              Add Contact
            </Button>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
