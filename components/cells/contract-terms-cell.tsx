import type React from "react"
import { TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"

interface ContractTermsCellProps {
  contractTerms?: {
    months?: string | number
    notes?: string | number
  }
  className?: string
}

export const ContractTermsCell: React.FC<ContractTermsCellProps> = ({ contractTerms, className = "" }) => {
  const hasTerms = contractTerms?.months && contractTerms.months !== "0" && contractTerms.months !== 0
  const hasNotes = contractTerms?.notes && contractTerms.notes !== "0" && contractTerms.notes !== 0

  if (!hasTerms && !hasNotes) {
    return (
      <TableCell className={className}>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <FileText className="w-3 h-3" />
          <span>None</span>
        </div>
      </TableCell>
    )
  }

  return (
    <TableCell className={className}>
      <div className="space-y-1">
        {hasTerms && (
          <Badge variant="outline" className="text-xs">
            {contractTerms.months} month{contractTerms.months === 1 || contractTerms.months === "1" ? "" : "s"}
          </Badge>
        )}
        {hasNotes && (
          <div className="text-xs text-gray-500 max-w-[100px] truncate" title={String(contractTerms.notes)}>
            {contractTerms.notes}
          </div>
        )}
      </div>
    </TableCell>
  )
}
