import type React from "react"
import { TableCell } from "@/components/ui/table"

interface StoreInfoCellProps {
  tradingName: string
  streetAddress: string
  className?: string
}

export const StoreInfoCell: React.FC<StoreInfoCellProps> = ({ tradingName, streetAddress, className = "" }) => {
  const truncateText = (text: string, maxLength: number) =>
    text.length > maxLength ? `${text.slice(0, maxLength)}…` : text

  return (
    <TableCell className={className}>
      <span className="space-y-1 flex flex-col">
        <span
          className="font-medium text-gray-900 max-w-[200px] truncate cursor-pointer hover:text-gray-700 transition-colors"
          title={tradingName}
        >
          {truncateText(tradingName, 70)}
        </span>
        <span
          className="text-sm text-gray-500 max-w-[200px] truncate cursor-pointer hover:text-gray-600 transition-colors"
          title={streetAddress}
        >
          {truncateText(streetAddress, 70)}
        </span>
      </span>
    </TableCell>
  )
}
