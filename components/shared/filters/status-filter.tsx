"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter } from "lucide-react"

interface StatusOption {
  value: string
  label: string
}

interface StatusFilterProps {
  value: string
  onChange: (value: string) => void
  options: StatusOption[]
  placeholder?: string
  className?: string
}

export function StatusFilter({
  value,
  onChange,
  options,
  placeholder = "Filter by status",
  className = "",
}: StatusFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`w-full sm:w-48 ${className}`}>
        <Filter className="w-4 h-4 mr-2" />
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
