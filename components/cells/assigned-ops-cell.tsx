import type React from "react"
import { TableCell } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { User } from "@/lib/firebase/types"

interface AssignedOpsCellProps {
    isSuperadmin: boolean
    assignedOpsIds: string[]
    users: User[]
    className?: string
}

export const AssignedOpsCell: React.FC<AssignedOpsCellProps> = ({
    isSuperadmin,
    assignedOpsIds,
    users,
    className = "",
}) => {
    if (!isSuperadmin) return null

    const assignedOps = assignedOpsIds
        .map((id) => users.find((user) => user.id === id))
        .filter(Boolean) as User[]

    const getInitials = (name: string) =>
        name
            .split(" ")
            .map((n) => n[0])
            .join("") || "?"

    return (
        <TableCell className={className}>
            <span className="flex flex-col items-center text-center w-full">
                {assignedOps.length === 0 ? (
                    <span className="text-xs text-gray-400">NONE</span>
                ) : (
                    <>
                        <span className="flex -space-x-2 mb-1">
                            {assignedOps.map((user) => (
                                <Avatar key={user.id} className="w-5 h-5 border-2 border-white">
                                    <AvatarFallback className="bg-orange-100 text-orange-500 border border-orange-500 text-xs font-xs">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                        </span>
                        <span
                            className="text-[7px] text-gray-700 truncate max-w-[120px]"
                            title={assignedOps.map((u) => u.name).join(", ")}
                        >
                            {assignedOps.map((u) => u.name).join(", ")}
                        </span>
                    </>
                )}
            </span>
        </TableCell>
    )
}
