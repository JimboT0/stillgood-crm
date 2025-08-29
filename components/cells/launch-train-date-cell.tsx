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
      <span className="space-y-2 text-sm">
        <span className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-semibold text-xs flex-shrink-0">
            T
          </span>
          <span className={`text-xs ${trainingDate ? "text-blue-600" : "text-gray-400"}`}>
            {formatDateTime(trainingDate, "Not set")}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600 font-semibold text-xs flex-shrink-0">
            L
          </span>
          <span className={`text-xs ${launchDate ? "text-green-600" : "text-gray-400"}`}>
            {formatDateTime(launchDate, "Not set")}
          </span>
        </span>
      </span>
    </TableCell>
  )
}
