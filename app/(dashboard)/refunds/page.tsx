"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useDashboardData } from "@/components/dashboard/dashboard-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FileText, Eye, DollarSign, Clock, CheckCircle, XCircle, Upload } from "lucide-react"
import { format } from "date-fns"
import { addRequest, getUserRequests, uploadInvoiceToStorage } from "@/lib/firebase/services/refund"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"

import type { Refunds } from "@/lib/firebase/types"

export default function RefundsPage() {
  const { currentUser } = useDashboardData()
  const [formData, setFormData] = useState({
    submitter: currentUser?.email || "",
    email: currentUser?.email || "",
    amount: "",
    bank: "",
    vat: false,
    invoice: null as File | null,
    urgency: "low" as "low" | "medium" | "high",
    supplierName: "",
    accountNumber: "",
    type: "bag costs" as
      | "bag costs"
      | "printing"
      | "travel"
      | "consulting"
      | "marketing"
      | "stationery"
      | "entertainment"
      | "other",
  })
  const [userRequests, setUserRequests] = useState<Refunds[]>([])
  const [viewInvoiceUrl, setViewInvoiceUrl] = useState<string | null>(null)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const isSuperAdmin = currentUser?.role === "superadmin"

  useEffect(() => {
    if (currentUser) {
      fetchUserRequests()
    }
  }, [currentUser])

  const fetchUserRequests = async () => {
    if (currentUser?.id) {
      const requests = await getUserRequests(currentUser.id)
      setUserRequests(requests)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser?.id) return

    setIsSubmitting(true)
    try {
      let invoiceUrl = ""
      if (formData.invoice) {
        setIsUploading(true)
        invoiceUrl = await uploadInvoiceToStorage(formData.invoice, currentUser.id)
        setIsUploading(false)
      }

      const newRequest: Omit<Refunds, "id" | "submittedAt" | "status"> = {
        userId: currentUser.id,
        email: formData.email,
        amount: Number.parseFloat(formData.amount),
        bank: formData.bank,
        vat: formData.vat,
        invoiceUrl,
        urgency: formData.urgency,
        supplierName: formData.supplierName,
        accountNumber: formData.accountNumber,
        type: formData.type,
      }

      await addRequest(newRequest)

      setFormData({
        ...formData,
        amount: "",
        bank: "",
        vat: false,
        invoice: null,
        urgency: "low",
        supplierName: "",
        accountNumber: "",
        type: "bag costs",
      })

      toast.success("Financial request submitted successfully!")
      fetchUserRequests()
    } catch (error) {
      toast.error("Failed to submit request. Please try again.")
      console.error("Error submitting request:", error)
    } finally {
      setIsSubmitting(false)
      setIsUploading(false)
    }
  }

  const getStatusBadge = (status: Refunds["status"]) => {
    const statusConfig = {
      pending: { icon: Clock, variant: "secondary" as const, label: "Pending" },
      accepted: { icon: CheckCircle, variant: "default" as const, label: "Accepted" },
      paid: { icon: DollarSign, variant: "default" as const, label: "Paid" },
      declined: { icon: XCircle, variant: "destructive" as const, label: "Declined" },
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getUrgencyBadge = (urgency: "low" | "medium" | "high") => {
    const urgencyConfig = {
      low: { variant: "secondary" as const, label: "Low" },
      medium: { variant: "default" as const, label: "Medium" },
      high: { variant: "destructive" as const, label: "High" },
    }

    const config = urgencyConfig[urgency]

    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-2">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Financial Requests</h1>
          <p className="text-slate-600">Submit and manage your financial reimbursement requests</p>
        </div>

        {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Requests</p>
                  <p className="text-2xl font-bold text-slate-900">{userRequests.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Pending</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {userRequests.filter((r) => r.status === "pending").length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {userRequests.filter((r) => r.status === "accepted" || r.status === "paid").length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Amount</p>
                  <p className="text-2xl font-bold text-slate-900">
                    R {userRequests.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div> */}

        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-slate-900">Submit New Request</CardTitle>
                <CardDescription className="text-slate-600">
                  Fill out the form below to submit a new financial request
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  Request Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.submitter}
                      disabled
                      className="hidden bg-slate-50 border-slate-200"
                    />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      className="bg-slate-50 border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-sm font-medium text-slate-700">
                      Amount (ZAR)
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-medium text-slate-700">
                      Request Type
                    </Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                    >
                      <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Select request type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bag costs">Bag Costs</SelectItem>
                        <SelectItem value="printing">Printing</SelectItem>
                        <SelectItem value="travel">Travel</SelectItem>
                        <SelectItem value="consulting">Consulting</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="stationery">Stationery</SelectItem>
                        <SelectItem value="entertainment">Entertainment</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="urgency" className="text-sm font-medium text-slate-700">
                      Urgency Level
                    </Label>
                    <Select
                      value={formData.urgency}
                      onValueChange={(value) => setFormData({ ...formData, urgency: value as any })}
                    >
                      <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Select urgency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-200" />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Banking & Supplier Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="bank" className="text-sm font-medium text-slate-700">
                      Bank Name
                    </Label>
                    <Input
                      id="bank"
                      placeholder="e.g., Standard Bank"
                      value={formData.bank}
                      onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                      className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber" className="text-sm font-medium text-slate-700">
                      Account Number
                    </Label>
                    <Input
                      id="accountNumber"
                      placeholder="Account number"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="supplierName" className="text-sm font-medium text-slate-700">
                      Supplier/Vendor Name
                    </Label>
                    <Input
                      id="supplierName"
                      placeholder="Name of supplier or vendor"
                      value={formData.supplierName}
                      onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                      className="border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-200" />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <Checkbox
                        id="vat"
                        checked={formData.vat}
                        onCheckedChange={(checked) => setFormData({ ...formData, vat: !!checked })}
                        className="border-slate-300"
                      />
                      <Label htmlFor="vat" className="text-sm font-medium text-slate-700 cursor-pointer">
                        VAT Included in Amount
                      </Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoice" className="text-sm font-medium text-slate-700">
                      Invoice/Receipt (PDF)
                    </Label>
                    <div className="relative">
                      <Input
                        id="invoice"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setFormData({ ...formData, invoice: e.target.files?.[0] || null })}
                        className="border-slate-200 focus:border-blue-500 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {isUploading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Upload className="h-4 w-4 animate-spin text-blue-600" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">Upload supporting documents (PDF, JPG, PNG - Max 50MB)</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Upload className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Submit Request
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-1">
          <Button
            variant="outline"
            onClick={() => setIsUserModalOpen(true)}
            className="flex items-center gap-2 border-slate-200 hover:bg-slate-50"
          >
            <FileText className="h-4 w-4" />
            View My Requests ({userRequests.length})
          </Button>

          {isSuperAdmin && (
            <Button
              variant="outline"
              className="flex items-center gap-2 border-slate-200 hover:bg-slate-50"
              onClick={() => window.location.href = "/paymentrequests"}
            >
              <DollarSign className="h-4 w-4" />
              Go to Payment Requests
            </Button>
          )}
        </div>

        <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl font-semibold text-slate-900">My Financial Requests</DialogTitle>
            </DialogHeader>

            {userRequests.length > 0 ? (
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-semibold text-slate-700">Amount</TableHead>
                      <TableHead className="font-semibold text-slate-700">Type</TableHead>
                      <TableHead className="font-semibold text-slate-700">Urgency</TableHead>
                      <TableHead className="font-semibold text-slate-700">Submitted</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="font-semibold text-slate-700">Invoice</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userRequests.map((request) => (
                      <TableRow key={request.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium">R {request.amount.toFixed(2)}</TableCell>
                        <TableCell className="capitalize">{request.type.replace(/([A-Z])/g, " $1").trim()}</TableCell>
                        <TableCell>{getUrgencyBadge(request.urgency)}</TableCell>
                        <TableCell className="text-slate-600">{format(request.submittedAt, "MMM dd, yyyy")}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          {request.invoiceUrl ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewInvoiceUrl(request.invoiceUrl)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-slate-400 text-sm">No file</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No requests found</h3>
                <p className="text-slate-500">You haven't submitted any financial requests yet.</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {viewInvoiceUrl && (
          <Dialog open={!!viewInvoiceUrl} onOpenChange={() => setViewInvoiceUrl(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-slate-900">Invoice Preview</DialogTitle>
              </DialogHeader>
              <div className="bg-slate-50 rounded-lg p-4 h-[70vh]">
                <iframe
                  src={viewInvoiceUrl}
                  className="w-full h-full rounded border border-slate-200"
                  title="Invoice Preview"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
