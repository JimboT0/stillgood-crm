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
    if (!salespersonId) return "Unknown"
    const salesperson = users?.find((user) => user.id === salespersonId)
    return salesperson?.name || "Unknown"
  }

  const getSalespersonInitials = (salespersonId: string) => {
    if (!salespersonId) return "?"
    const salesperson = users?.find((user) => user.id === salespersonId)
    if (!salesperson?.name) return "?"
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

  // Log if user not found for debugging
  if (!users?.find((user) => user.id === salespersonId) && salespersonId) {
    console.log(`[SalespersonCell] User not found for salespersonId: ${salespersonId}, users count: ${users?.length || 0}`)
  }

  return (
    <TableCell className={className}>
      <div className="flex items-center gap-2">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="bg-orange-100 text-orange-600 text-xs">{initials}</AvatarFallback>
        </Avatar>
        <span className="text-sm truncate max-w-[120px]" title={name}>
          {name}
        </span>
      </div>
    </TableCell>
  )
}
