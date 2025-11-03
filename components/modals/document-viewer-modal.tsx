"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Eye, Download } from "lucide-react"
import type { Store, User } from "@/lib/firebase/types"

interface DocumentViewerModalProps {
  isOpen: boolean
  onClose: () => void
  store: Store | null
  documentType: "sla" | "bank" | null
  currentUser: User | null
}

export function DocumentViewerModal({ isOpen, onClose, store, documentType, currentUser }: DocumentViewerModalProps) {
  if (!store || !documentType) return null

  const isSla = documentType === "sla"
  const isUploaded = isSla ? store.signedSla : store.bankConfirmation
  const documentInfo = isSla ? store.slaDocument : store.bankDocument
  const documentTitle = isSla ? "Service Level Agreement" : "Bank Confirmation"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            {documentTitle}
          </DialogTitle>
          <DialogDescription>{store.tradingName} - Document Management</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Document Status
                <Badge
                  variant={isUploaded ? "default" : "secondary"}
                  className={isUploaded ? "bg-green-100 text-green-800" : ""}
                >
                  {isUploaded ? "Uploaded" : "Not Uploaded"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isUploaded && documentInfo ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">File Name:</span>
                      <p className="text-gray-600">{documentInfo.name}</p>
                    </div>
                    {/* <div>
                      <span className="font-medium">Uploaded:</span>
                      <p className="text-gray-600">
                        {documentInfo.uploadedAt instanceof Date
                          ? documentInfo.uploadedAt.toLocaleDateString()
                          : new Date(documentInfo.uploadedAt).toLocaleDateString()}
                      </p>
                    </div> */}
                  {isSla && (
                    <div>
                      <span className="font-medium">Uploaded By:</span>
                      <p className="text-gray-600">{store.bankConfirmationEmail}</p>
                    </div>
                  )}
                  </div>

                  <div className="flex gap-2">
                    {documentInfo.url && (
                      <>
                        <Button
                          variant="outline"
                          className="flex items-center gap-2 bg-transparent"
                          onClick={() => window.open(documentInfo.url, "_blank")}
                        >
                          <Eye className="w-4 h-4" />
                          View Document
                        </Button>
                        <Button
                          variant="outline"
                          className="flex items-center gap-2 bg-transparent"
                          onClick={() => window.location.href = documentInfo.url}
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </>

                    )}
                  </div>
                  {store.bankConfirmationEmail ? store.bankConfirmationEmail : "No email"}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Document Available</h3>
                  <p className="text-gray-600 mb-4">
                    The {documentTitle.toLowerCase()} {isUploaded ? "metadata is missing." : "has not been uploaded yet."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Store Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Store Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Store Name:</span>
                <span className="ml-2">{store.tradingName}</span>
              </div>
              <div>
                <span className="font-medium">Address:</span>
                <span className="ml-2">
                  {store.streetAddress}, {store.province}
                </span>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <Badge className="ml-2" variant={store.status === "closed" ? "default" : "secondary"}>
                  {store.status.charAt(0).toUpperCase() + store.status.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
