"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, MapPin, Calendar, Phone, Mail, UserIcon, CheckCircle, Clock, FileText, Rocket } from "lucide-react"
import type { Store, User } from "@/lib/firebase/types"
// import { Timestamp } from "firebase/firestore"
import { formatDateTimeForDisplay, getSalespersonInitials, getSalespersonName } from "../../lib/utils/date-utils"
import { DocumentViewerModal } from "./document-viewer-modal"
import { useState } from "react"

interface StoreDetailsModalProps {
  store: Store | null
  isOpen: boolean
  onClose: () => void
  users: User[]
  currentUser: User | null
}

export function StoreDetailsModal({
  store,
  isOpen,
  onClose,
  users,
  currentUser,
}: StoreDetailsModalProps) {
  if (!store) return null

  const isSuperadmin = currentUser?.role === "superadmin"


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

  const [documentViewModal, setDocumentViewModal] = useState<{
    isOpen: boolean;
    store: Store | null;
    documentType: "sla" | "bank" | null;
  }>({ isOpen: false, store: null, documentType: null });

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
              {/* {!store.isSetup && isSuperadmin && (
                <Button size="sm" className="bg-blue-500 hover:bg-blue-600" onClick={() => onToggleSetup(store.id)}>
                  Mark Setup Complete
                </Button>
              )} */}
              {/* {store.isSetup && !store.setupConfirmed && currentUser?.role === "superadmin" && (
                <Button
                  size="sm"
                  onClick={() => onSetupConfirmation(store.id)}
                  className="bg-white text-white hover:bg-green-600"
                >
                  <CheckCircle className="w-4 h-4 mr-2 text-white" />
                  Confirm Setup
                </Button>
              )} */}
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
                    <p className="font-medium">{formatDateTimeForDisplay(store.trainingDate ?? null)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Launch Date</p>
                    <p className="font-medium">{formatDateTimeForDisplay(store.launchDate ?? null)}</p>
                  </div>
                </div>
              </div>
              {store.pushedToRolloutAt && (
                <div className="flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">Pushed to Rollout</p>
                    <p className="font-medium">{formatDateTimeForDisplay(store.pushedToRolloutAt ?? null)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <div>
              {store.whatsappGroupLink ? (
                <a
                  href={store.whatsappGroupLink}
                  className="text-blue-500 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {store.whatsappGroupLink}
                </a>
              ) : (
                <p className="text-sm text-gray-600">No WhatsApp channel link available</p>
              )}
            </div>


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
                          <p className="text-sm text-gray-600">{contact.role}</p>
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
          {(store.slaDocument || store.bankDocument) ? (
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
                <DocumentViewerModal
                  isOpen={documentViewModal.isOpen}
                  onClose={() => setDocumentViewModal({ isOpen: false, store: null, documentType: null })}
                  store={documentViewModal.store}
                  documentType={documentViewModal.documentType}
                  currentUser={currentUser}
                />
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
          ) : (
            <p className="text-sm text-gray-500">Documents not loaded</p>
          )}

          {/* Contract Terms */}
          {store.contractTerms && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contract</CardTitle>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contract</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <span className="text-gray-600">CreatedAt:</span> {formatDateTimeForDisplay(store.createdAt ?? null)}
                </p>
                  <div>
                    <p className="text-gray-600">Notes:</p>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg">{formatDateTimeForDisplay(store.createdAt ?? null)}</p>
                  </div>
                
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
