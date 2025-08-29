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
    const salesperson = users.find((user) => user.id === salespersonId)
    return salesperson?.name || "Unknown"
  }

  const getSalespersonInitials = (salespersonId: string) => {
    const salesperson = users.find((user) => user.id === salespersonId)
    return (
      salesperson?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("") || "?"
    )
  }

  if (!isSuperadmin) return null

  const name = getSalespersonName(salespersonId)
  const initials = getSalespersonInitials(salespersonId)

  return (
    <TableCell className={className}>
      <span className="flex flex-col items-center text-center">
        <Avatar className="w-5 h-5 flex-shrink-0">
          <AvatarFallback className="bg-orange-100 text-orange-500 border border-orange-500 text-xs font-xs">{initials}</AvatarFallback>
        </Avatar>
        <span className="text-[7px] text-gray-700 truncate max-w-[120px]" title={name}>
          {name}
        </span>
      </span>
    </TableCell>
  )
}
