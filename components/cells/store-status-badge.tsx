import type React from "react"
import { TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Hand, SnowflakeIcon, Flame, Rocket, CheckCircle, Calendar, KeyIcon, Clock, ThumbsUp } from "lucide-react"

type storeStatus =
  "lead" | "cold" | "warm" | "closed" | "pending setup" | "rollout" | "completed";

interface StoreStatusBadgeProps {
  status: storeStatus
  isKeyAccount?: boolean
  className?: string
}

export const StoreStatusBadge: React.FC<StoreStatusBadgeProps> = ({ status, isKeyAccount = false, className = "" }) => {
  const getBadgeProps = () => {
    const iconClass = "w-4 h-4"

    switch (status) {
      case "pending setup":
      case "rollout":
        return {
          className: "bg-purple-50 text-purple-700 border-purple-200",
          icon: <Rocket className={iconClass} />,
          label: "In Rollout",
        }
      case "completed":
        return {
          className: "bg-green-50 text-green-700 border-green-200",
          icon: <CheckCircle className={iconClass} />,
          label: status === "completed" ? "Completed" : "Ready",
        }
      case "pending setup":
        return {
          className: "bg-yellow-50 text-yellow-700 border-yellow-200",
          icon: <Clock className={iconClass} />,
          label: "Pending Setup",
        }
      case "closed":
        return {
          className: "bg-green-50 text-green-700 border-green-200",
          icon: <CheckCircle className={iconClass} />,
          label: "Closed",
        }
      case "lead":
        return {
          className: "bg-gray-50 text-gray-700 border-gray-200",
          icon: <Hand className={iconClass} />,
          label: "Lead",
        }
      case "cold":
        return {
          className: "bg-blue-50 text-blue-700 border-blue-200",
          icon: <SnowflakeIcon className={iconClass} />,
          label: "Cold",
        }
      case "warm":
        return {
          className: "bg-orange-50 text-orange-700 border-orange-200",
          icon: <Flame className={iconClass} />,
          label: "Warm",
        }
      default:
        return {
          className: "bg-gray-50 text-gray-700 border-gray-200",
          icon: <Calendar className={iconClass} />,
          label: "Unknown",
        }
    }
  }

  const { className: badgeClassName, icon, label } = getBadgeProps()

  return (
    <TableCell className={className}>
      <span className="flex flex-col gap-1">
        <Badge className={`${badgeClassName} flex items-center gap-1 w-fit`}>
          {icon}
          <span className="text-xs font-thin">{label}</span>
        </Badge>
        {isKeyAccount && (
          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1 w-fit">
            <KeyIcon className="w-3 h-3" />
            <span className="text-xs font-thin">Key</span>
          </Badge>
        )}
      </span>
    </TableCell>
  )
}
