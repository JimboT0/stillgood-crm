"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserIcon } from "lucide-react"

interface Manager {
  id: string
  name: string
  role?: string
}

interface ManagerFilterProps {
  value: string
  onChange: (value: string) => void
  managers: Manager[]
  placeholder?: string
  className?: string
}

export function ManagerFilter({
  value,
  onChange,
  managers,
  placeholder = "Filter by manager",
  className = "",
}: ManagerFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`w-full sm:w-48 ${className}`}>
        <UserIcon className="w-4 h-4 mr-2" />
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Managers</SelectItem>
        {managers.map((manager) => (
          <SelectItem key={manager.id} value={manager.id}>
            {manager.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
