import type React from "react"
import { TableCell } from "@/components/ui/table"
import { formatDateTime } from "@/lib/utils/date-formatter"

interface LaunchTrainDateCellProps {
  launchDate?: any
  trainingDate?: any
  className?: string
}

export const LaunchTrainDateCell: React.FC<LaunchTrainDateCellProps> = ({
  trainingDate,
  launchDate,
  className = "",
}) => {
  return (
    <TableCell className={className}>
      <div className="space-y-2 text-sm">
        {trainingDate && (
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-semibold text-xs flex-shrink-0">
              T
            </span>
            <span className="text-xs text-blue-600">{formatDateTime(trainingDate, "Not set")}</span>
          </div>
        )}
        {launchDate && (
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600 font-semibold text-xs flex-shrink-0">
              L
            </span>
            <span className="text-xs text-green-600">{formatDateTime(launchDate, "Not set")}</span>
          </div>
        )}
      </div>
    </TableCell>
  )
}
