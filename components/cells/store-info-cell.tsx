import type React from "react"
import { TableCell } from "@/components/ui/table"

interface StoreInfoCellProps {
  tradingName: string
  streetAddress: string
  className?: string
}

export const StoreInfoCell: React.FC<StoreInfoCellProps> = ({ tradingName, streetAddress, className = "" }) => {
  const truncateText = (text: string, maxLength: number) =>
    text && text.trim() !== "" && text.length > maxLength ? `${text.slice(0, maxLength)}…` : text

  if (!tradingName && !streetAddress) return null

  return (
    <TableCell className={className}>
      <div className="space-y-1">
        <div className="font-medium text-foreground max-w-[200px] truncate">{truncateText(tradingName, 70)}</div>
        <div className="text-sm text-muted-foreground max-w-[200px] truncate">{truncateText(streetAddress, 70)}</div>
      </div>
    </TableCell>
  )
}
