"use client"

import type React from "react"
import { TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Ligature as Signature, PiggyBank } from "lucide-react"
import type { Store } from "@/lib/firebase/types"

interface DocumentsCellProps {
  store: Store
  onViewDocument?: (store: Store, documentType: "sla" | "bank") => void
  className?: string
}

export const DocumentsCell: React.FC<DocumentsCellProps> = ({ store, onViewDocument, className = "" }) => {
  const hasSla = !!store.signedSla
  const hasBank = !!store.bankConfirmation

  if (!onViewDocument) {
    return (
      <TableCell className={className}>
        <div className="flex flex-col gap-1">
          <span className={`text-xs ${hasSla ? "text-green-600" : "text-muted-foreground"}`}>
            SLA: {hasSla ? "✓" : "✗"}
          </span>
          <span className={`text-xs ${hasBank ? "text-green-600" : "text-muted-foreground"}`}>
            Bank: {hasBank ? "✓" : "✗"}
          </span>
        </div>
      </TableCell>
    )
  }

  return (
    <TableCell className={className}>
      <div className="flex flex-col gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onViewDocument(store, "sla")}
          disabled={!hasSla}
          className={`h-6 px-2 text-xs ${!hasSla ? "opacity-50" : ""}`}
        >
          <Signature className="w-3 h-3 mr-1" />
          <span className={!hasSla ? "line-through" : ""}>SLA</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onViewDocument(store, "bank")}
          disabled={!hasBank}
          className={`h-6 px-2 text-xs ${!hasBank ? "opacity-50" : ""}`}
        >
          <PiggyBank className="w-3 h-3 mr-1" />
          <span className={!hasBank ? "line-through" : ""}>Bank</span>
        </Button>
      </div>
    </TableCell>
  )
}
