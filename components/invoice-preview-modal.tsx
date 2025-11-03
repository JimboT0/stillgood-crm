import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface InvoicePreviewModalProps {
  invoiceUrl: string | null
  onOpenChange: (open: boolean) => void
}

export default function InvoicePreviewModal({ invoiceUrl, onOpenChange }: InvoicePreviewModalProps) {
  return (
    <Dialog open={!!invoiceUrl} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invoice Preview</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <iframe src={invoiceUrl || ""} className="w-full h-96" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
