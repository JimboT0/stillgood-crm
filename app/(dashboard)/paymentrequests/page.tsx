"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Eye, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { getAllRequests, updateRequestStatus } from "@/lib/firebase/services/refund"
import type { Refunds } from "@/lib/firebase/types"
import InvoicePreviewModal from "@/components/invoice-preview-modal"

export default function PaymentRequests() {
  const router = useRouter()
  const [requests, setRequests] = useState<Refunds[]>([])
  const [filterUrgency, setFilterUrgency] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [viewInvoiceUrl, setViewInvoiceUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchAllRequests()
  }, [])

  const fetchAllRequests = async () => {
    const allRequests = await getAllRequests()
    setRequests(allRequests)
  }

  const filteredRequests = requests.filter((request) => {
    const matchesUrgency = filterUrgency === "all" || request.urgency === filterUrgency
    const matchesType = filterType === "all" || request.type === filterType
    return matchesUrgency && matchesType
  })

  const handleUpdateStatus = async (id: string, newStatus: Refunds["status"]) => {
    await updateRequestStatus(id, newStatus)
    fetchAllRequests()
  }

  const getStatusBadgeClass = (status: Refunds["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "accepted":
        return "bg-blue-100 text-blue-800"
      case "paid":
        return "bg-green-100 text-green-800"
      case "declined":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          Logged Financial Requests
        </h1>
      </div>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={filterUrgency} onValueChange={setFilterUrgency}>
            <SelectTrigger className="w-full sm:w-48 border-gray-300 focus:ring-2 focus:ring-blue-500">
              <SelectValue placeholder="Filter by urgency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Urgencies</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-48 border-gray-300 focus:ring-2 focus:ring-blue-500">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-gray-700 font-medium">Email</TableHead>
                <TableHead className="text-gray-700 font-medium">Amount</TableHead>
                <TableHead className="text-gray-700 font-medium">Bank</TableHead>
                <TableHead className="text-gray-700 font-medium">VAT</TableHead>
                <TableHead className="text-gray-700 font-medium">Invoice</TableHead>
                <TableHead className="text-gray-700 font-medium">Urgency</TableHead>
                <TableHead className="text-gray-700 font-medium">Supplier</TableHead>
                <TableHead className="text-gray-700 font-medium">Account</TableHead>
                <TableHead className="text-gray-700 font-medium">Type</TableHead>
                <TableHead className="text-gray-700 font-medium">Submitted</TableHead>
                <TableHead className="text-gray-700 font-medium">Status</TableHead>
                <TableHead className="text-gray-700 font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request, index) => (
                <TableRow
                  key={request.id}
                  className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                >
                  <TableCell className="text-gray-900">{request.email}</TableCell>
                  <TableCell className="text-gray-900">R {request.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-gray-900">{request.bank}</TableCell>
                  <TableCell className="text-gray-900">{request.vat ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    {request.invoiceUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewInvoiceUrl(request.invoiceUrl)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-900 capitalize">{request.urgency}</TableCell>
                  <TableCell className="text-gray-900">{request.supplierName}</TableCell>
                  <TableCell className="text-gray-900">{request.accountNumber}</TableCell>
                  <TableCell className="text-gray-900 capitalize">{request.type}</TableCell>
                  <TableCell className="text-gray-900">{format(request.submittedAt, "PPP")}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                        request.status
                      )}`}
                    >
                      {request.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={request.status}
                      onValueChange={(value) => handleUpdateStatus(request.id, value as any)}
                    >
                      <SelectTrigger className="w-32 border-gray-300 focus:ring-2 focus:ring-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filteredRequests.length === 0 && (
          <div className="text-center py-8 text-gray-500">No requests found</div>
        )}
      </div>
      <InvoicePreviewModal
        invoiceUrl={viewInvoiceUrl}
        onOpenChange={() => setViewInvoiceUrl(null)}
      />
    </div>
  )
}
