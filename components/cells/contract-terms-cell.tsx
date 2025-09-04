import type React from "react"
import { TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"

interface ContractTermsCellProps {
  contractTerms?: {
    months?: string | number
    notes?: string | number
    isKeyaccount?: boolean
  }
  className?: string
}

export const ContractTermsCell: React.FC<ContractTermsCellProps> = ({ contractTerms, className = "" }) => {
  const hasTerms = contractTerms?.months && contractTerms.months !== "0" && contractTerms.months !== 0
  const hasNotes = contractTerms?.notes && contractTerms.notes !== "0" && contractTerms.notes !== 0

  if (!hasTerms && !hasNotes) {
    return (
      <TableCell className={className}>
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <FileText className="w-3 h-3" />
          <span>None</span>
        </span>
      </TableCell>
    )
  }

  return (
    <TableCell className="flex flex-col gap-1">
      <span className="block max-w-[100px] overflow-hidden">
      {hasTerms && (
        <Badge variant="outline" className="text-xs mb-1">
        {contractTerms.months} month{contractTerms.months === 1 || contractTerms.months === "1" ? "" : "s"}
        </Badge>
      )}
      {hasNotes && (
        <span className="text-xs text-gray-500 truncate whitespace-nowrap block" title={String(contractTerms.notes)}>
        {contractTerms.notes}
        </span>
      )}
      </span>
    </TableCell>
  )
}
