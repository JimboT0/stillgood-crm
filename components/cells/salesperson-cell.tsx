import type React from "react"
import { TableCell } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { User } from "@/lib/firebase/types"

interface SalespersonCellProps {
  isSuperadmin: boolean
  salespersonId: string
  users: User[]
  className?: string
}

export const SalespersonCell: React.FC<SalespersonCellProps> = ({
  isSuperadmin,
  salespersonId,
  users,
  className = "",
}) => {
  const getSalespersonName = (salespersonId: string) => {
    if (!salespersonId) return "Unassigned"
    const salesperson = users?.find((user) => user.id === salespersonId)
    return salesperson?.name || `Deleted User (${salespersonId.slice(-6)})`
  }

  const getSalespersonInitials = (salespersonId: string) => {
    if (!salespersonId) return "U"
    const salesperson = users?.find((user) => user.id === salespersonId)
    if (!salesperson?.name) return "DU" // Deleted User
    return (
      salesperson.name
        .split(" ")
        .map((n) => n[0])
        .join("") || "?"
    )
  }

  // Show cell if superadmin OR if explicitly requested (for creator column)
  // The isSuperadmin prop is now used to determine visibility, but we can also show it for creator column
  if (!isSuperadmin && !salespersonId) return null

  const name = getSalespersonName(salespersonId)
  const initials = getSalespersonInitials(salespersonId)
  const isDeleted = salespersonId && !users?.find((user) => user.id === salespersonId)

  // Reduced logging for missing users
  if (isDeleted && salespersonId) {
    console.warn(`[SalespersonCell] Orphaned salesperson ID: ${salespersonId}`)
  }

  return (
    <TableCell className={className}>
      <div className="flex items-center gap-2">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback 
            className={`text-xs ${
              isDeleted 
                ? 'bg-red-100 text-red-600' 
                : 'bg-orange-100 text-orange-600'
            }`}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <span 
          className={`text-sm truncate max-w-[120px] ${
            isDeleted ? 'text-red-600 italic' : ''
          }`} 
          title={name}
        >
          {name}
        </span>
      </div>
    </TableCell>
  )
}
