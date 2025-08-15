"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, MapPin, Calendar, Phone, Mail, UserIcon, CheckCircle, Clock, FileText, Rocket } from "lucide-react"
import type { Store, User } from "@/lib/firebase/types"
import { Timestamp } from "firebase/firestore"

interface StoreDetailsModalProps {
  store: Store | null
  isOpen: boolean
  onClose: () => void
  users: User[]
  currentUser: User | null
  onToggleSetup: (storeId: string) => Promise<void>
  onSetupConfirmation: (storeId: string) => Promise<void>
}

export function StoreDetailsModal({
  store,
  isOpen,
  onClose,
  users,
  currentUser,
  onToggleSetup,
  onSetupConfirmation,
}: StoreDetailsModalProps) {
  if (!store) return null

    const isSuperadmin = currentUser?.role === "superadmin"

  // Helper function to format dates for display (e.g., "Oct 13, 2025")
  const formatDisplayDate = (date: Timestamp | string | Date | null): string => {
    if (!date) return "Not set"

    let parsedDate: Date

    if (date instanceof Timestamp) {
      parsedDate = date.toDate()
    } else if (date instanceof Date) {
      parsedDate = date
    } else if (typeof date === "string") {
      // Handle "MM/DD/YYYY" format (e.g., "10/13/2025")
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(date)) {
        const [month, day, year] = date.split("/").map(Number)
        parsedDate = new Date(year, month - 1, day)
      }
      // Handle "DD Month YYYY" format (e.g., "13 August 2025")
      else if (/^\d{1,2}\s+[A-Za-z]+\s+\d{4}$/.test(date)) {
        parsedDate = new Date(date)
      } else {
        console.warn(`Invalid date format: ${date}`)
        return "Invalid date"
      }
    } else {
      console.warn(`Invalid date type: ${date}`)
      return "Invalid date"
    }

    if (isNaN(parsedDate.getTime())) {
      console.warn(`Invalid date parsed: ${date}`)
      return "Invalid date"
    }

    return parsedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
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

  const getStatusBadge = () => {
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            {store.tradingName}
          </DialogTitle>
          <DialogDescription>Store details and rollout information</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Actions */}
          <div className="flex items-center justify-between">
            {getStatusBadge()}
            <div className="flex gap-2">
              {!store.isSetup && isSuperadmin && (
                <Button size="sm" className="bg-blue-500 hover:bg-blue-600" onClick={() => onToggleSetup(store.id)}>
                  Mark Setup Complete
                </Button>
              )}
              {store.isSetup && !store.setupConfirmed && currentUser?.role === "superadmin" && (
                <Button
                  size="sm"
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() => onSetupConfirmation(store.id)}
                >
                  Confirm Setup
                </Button>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Store Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Store Name</p>
                    <p className="font-medium">{store.tradingName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Province</p>
                    <p className="font-medium">{store.province}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium">{store.streetAddress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Salesperson */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Salesperson</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-orange-100 text-orange-700">
                    {getSalespersonInitials(store.salespersonId)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{getSalespersonName(store.salespersonId)}</p>
                  <p className="text-sm text-gray-600">Sales Representative</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Important Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Training Date</p>
                    <p className="font-medium">{formatDisplayDate(store.trainingDate ?? null)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Launch Date</p>
                    <p className="font-medium">{formatDisplayDate(store.launchDate ?? null)}</p>
                  </div>
                </div>
              </div>
              {store.pushedToRolloutAt && (
                <div className="flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">Pushed to Rollout</p>
                    <p className="font-medium">{formatDisplayDate(store.pushedToRolloutAt ?? null)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Persons */}
          {store.contactPersons && store.contactPersons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Persons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {store.contactPersons.map((contact, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <UserIcon className="w-5 h-5 text-gray-400 mt-1" />
                      <div className="flex-1 space-y-2">
                        <div>
                          <p className="font-medium">{contact.name}</p>
                          <p className="text-sm text-gray-600">{contact.position}</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {contact.phone}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-3 h-3 text-gray-400" />
                            {contact.email}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {(store.slaDocument || store.bankDocument) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {store.slaDocument && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <FileText className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium">SLA Document</p>
                      <p className="text-sm text-gray-600">{store.slaDocument.name}</p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Uploaded
                    </Badge>
                  </div>
                )}
                {store.bankDocument && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="font-medium">Bank Confirmation</p>
                      <p className="text-sm text-gray-600">{store.bankDocument.name}</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      Uploaded
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contract Terms */}
          {store.contractTerms && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contract Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <span className="text-gray-600">Duration:</span> {store.contractTerms.months} months
                  </p>
                  {store.contractTerms.notes && (
                    <div>
                      <p className="text-gray-600">Notes:</p>
                      <p className="text-sm bg-gray-50 p-3 rounded-lg">{store.contractTerms.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
