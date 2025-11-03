import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { format } from "date-fns"

interface Refunds {
  id: string
  userId: string
  email: string
  amount: number
  bank: string
  vat: boolean
  invoiceUrl?: string
  urgency: "low" | "medium" | "high"
  supplierName: string
  accountNumber: string
  type: "bag costs" | "printing" | "travel" | "consulting" | "marketing" | "stationery" | "entertainment" | "other"
  submittedAt: Date
  status: "pending" | "accepted" | "paid" | "declined"
}

interface UserRequestsModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  userRequests: Refunds[]
  onViewInvoice: (url: string | null) => void
}

export default function UserRequestsModal({ isOpen, onOpenChange, userRequests, onViewInvoice }: UserRequestsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full">
        <DialogHeader>
          <DialogTitle>My Financial Requests</DialogTitle>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Amount</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Invoice</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>R {request.amount.toFixed(2)}</TableCell>
                <TableCell>{format(request.submittedAt, "PPP")}</TableCell>
                <TableCell>{request.status}</TableCell>
                <TableCell>
                  {request.invoiceUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewInvoice(request.invoiceUrl)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {userRequests.length === 0 && (
          <div className="text-center py-8">No requests found</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
