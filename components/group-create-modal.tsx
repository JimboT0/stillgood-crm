"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Plus, Trash2, User } from "lucide-react"
import type { StoreGroup, User as UserType, ContactPerson } from "@/lib/firebase/types"

interface GroupCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (group: Omit<StoreGroup, "id">) => Promise<void>
  users: UserType[]
  currentUser: UserType | null
}

export function GroupCreateModal({ isOpen, onClose, onSave, users, currentUser }: GroupCreateModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
  })
  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([
    { name: "", designation: "", phone: "", email: "", isPrimary: true },
  ])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const validateForm = (): Record<string, string> => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Group name is required"
    if (!formData.ownerName.trim()) newErrors.ownerName = "Owner name is required"
    if (!formData.ownerEmail.trim()) newErrors.ownerEmail = "Owner email is required"
    if (formData.ownerEmail && !/\S+@\S+\.\S+/.test(formData.ownerEmail)) {
      newErrors.ownerEmail = "Please enter a valid email address"
    }

    // Validate contact persons
    const validContactPersons = contactPersons.filter(
      (cp) => cp.name.trim() || cp.designation.trim() || cp.phone.trim() || cp.email.trim(),
    )

    if (validContactPersons.length === 0) {
      newErrors.contactPersons = "At least one contact person is required"
    } else {
      validContactPersons.forEach((cp, index) => {
        if (!cp.name.trim()) newErrors[`contact_${index}_name`] = "Contact name is required"
        if (!cp.designation.trim()) newErrors[`contact_${index}_designation`] = "Designation is required"
        if (!cp.phone.trim()) newErrors[`contact_${index}_phone`] = "Phone is required"
        if (!cp.email.trim()) newErrors[`contact_${index}_email`] = "Email is required"
        if (cp.email && !/\S+@\S+\.\S+/.test(cp.email)) {
          newErrors[`contact_${index}_email`] = "Please enter a valid email address"
        }
      })
    }

    return newErrors
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev }
        delete updated[field]
        return updated
      })
    }
  }

  const handleContactPersonChange = (index: number, field: keyof ContactPerson, value: string | boolean) => {
    setContactPersons((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })

    // Clear related errors
    const errorKey = `contact_${index}_${field}`
    if (errors[errorKey]) {
      setErrors((prev) => {
        const updated = { ...prev }
        delete updated[errorKey]
        return updated
      })
    }
  }

  const addContactPerson = () => {
    setContactPersons((prev) => [...prev, { name: "", designation: "", phone: "", email: "", isPrimary: false }])
  }

  const removeContactPerson = (index: number) => {
    if (contactPersons.length > 1) {
      setContactPersons((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const setPrimaryContact = (index: number) => {
    setContactPersons((prev) => prev.map((cp, i) => ({ ...cp, isPrimary: i === index })))
  }

  const handleSave = async () => {
    const newErrors = validateForm()
    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) return

    if (!currentUser) {
      setErrors({ general: "User authentication required" })
      return
    }

    setIsLoading(true)

    try {
      // Filter out empty contact persons
      const validContactPersons = contactPersons
        .filter((cp) => cp.name.trim() || cp.designation.trim() || cp.phone.trim() || cp.email.trim())
        .map((cp) => ({
          name: cp.name.trim(),
          designation: cp.designation.trim(),
          phone: cp.phone.trim(),
          email: cp.email.trim(),
          isPrimary: cp.isPrimary,
        }))

      const groupData: Omit<StoreGroup, "id"> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        ownerId: "", // This would be generated or assigned differently in a real app
        ownerName: formData.ownerName.trim(),
        ownerEmail: formData.ownerEmail.trim(),
        ownerPhone: formData.ownerPhone.trim(),
        contactPersons: validContactPersons,
        storeIds: [],
        keyAccountManager: currentUser.id, // Auto-assign creator as manager
        keyAccountManagerName: currentUser.name,
        createdBy: currentUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await onSave(groupData)

      // Reset form
      setFormData({
        name: "",
        description: "",
        ownerName: "",
        ownerEmail: "",
        ownerPhone: "",
      })
      setContactPersons([{ name: "", designation: "", phone: "", email: "", isPrimary: true }])
      setErrors({})
      onClose()
    } catch (error: any) {
      console.error("Error creating group:", error)
      setErrors({ general: error.message || "Failed to create group. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      ownerName: "",
      ownerEmail: "",
      ownerPhone: "",
    })
    setContactPersons([{ name: "", designation: "", phone: "", email: "", isPrimary: true }])
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Create Store Group
          </DialogTitle>
        </DialogHeader>

        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{errors.general}</p>
          </div>
        )}

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Group Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Group Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Smith Family Stores"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Optional description of the store group"
                  rows={3}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Key Account Manager</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  You ({currentUser?.name}) will be automatically assigned as the key account manager for this group.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Owner Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ownerName">Owner Name *</Label>
                  <Input
                    id="ownerName"
                    value={formData.ownerName}
                    onChange={(e) => handleInputChange("ownerName", e.target.value)}
                    placeholder="Owner's full name"
                    className={errors.ownerName ? "border-red-500" : ""}
                  />
                  {errors.ownerName && <p className="text-red-500 text-sm mt-1">{errors.ownerName}</p>}
                </div>

                <div>
                  <Label htmlFor="ownerEmail">Owner Email *</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    value={formData.ownerEmail}
                    onChange={(e) => handleInputChange("ownerEmail", e.target.value)}
                    placeholder="owner@example.com"
                    className={errors.ownerEmail ? "border-red-500" : ""}
                  />
                  {errors.ownerEmail && <p className="text-red-500 text-sm mt-1">{errors.ownerEmail}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="ownerPhone">Owner Phone</Label>
                <Input
                  id="ownerPhone"
                  value={formData.ownerPhone}
                  onChange={(e) => handleInputChange("ownerPhone", e.target.value)}
                  placeholder="Optional phone number"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Contact Persons</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addContactPerson}
                  className="flex items-center gap-2 bg-transparent"
                >
                  <Plus className="w-4 h-4" />
                  Add Contact
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {errors.contactPersons && <p className="text-red-500 text-sm">{errors.contactPersons}</p>}

              {contactPersons.map((contact, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">Contact Person {index + 1}</h4>
                      {contact.isPrimary && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Primary</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!contact.isPrimary && (
                        <Button type="button" variant="outline" size="sm" onClick={() => setPrimaryContact(index)}>
                          Set as Primary
                        </Button>
                      )}
                      {contactPersons.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeContactPerson(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`contact-name-${index}`}>Name *</Label>
                      <Input
                        id={`contact-name-${index}`}
                        value={contact.name}
                        onChange={(e) => handleContactPersonChange(index, "name", e.target.value)}
                        placeholder="Contact person name"
                        className={errors[`contact_${index}_name`] ? "border-red-500" : ""}
                      />
                      {errors[`contact_${index}_name`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`contact_${index}_name`]}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`contact-designation-${index}`}>Designation *</Label>
                      <Input
                        id={`contact-designation-${index}`}
                        value={contact.designation}
                        onChange={(e) => handleContactPersonChange(index, "designation", e.target.value)}
                        placeholder="e.g., Store Manager"
                        className={errors[`contact_${index}_designation`] ? "border-red-500" : ""}
                      />
                      {errors[`contact_${index}_designation`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`contact_${index}_designation`]}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`contact-phone-${index}`}>Phone *</Label>
                      <Input
                        id={`contact-phone-${index}`}
                        value={contact.phone}
                        onChange={(e) => handleContactPersonChange(index, "phone", e.target.value)}
                        placeholder="Phone number"
                        className={errors[`contact_${index}_phone`] ? "border-red-500" : ""}
                      />
                      {errors[`contact_${index}_phone`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`contact_${index}_phone`]}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`contact-email-${index}`}>Email *</Label>
                      <Input
                        id={`contact-email-${index}`}
                        type="email"
                        value={contact.email}
                        onChange={(e) => handleContactPersonChange(index, "email", e.target.value)}
                        placeholder="email@example.com"
                        className={errors[`contact_${index}_email`] ? "border-red-500" : ""}
                      />
                      {errors[`contact_${index}_email`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`contact_${index}_email`]}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                Creating...
              </span>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
