"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin } from "lucide-react"

interface ProvinceFilterProps {
  value: string
  onChange: (value: string) => void
  provinces: string[]
  placeholder?: string
  className?: string
}

export function ProvinceFilter({
  value,
  onChange,
  provinces,
  placeholder = "Select province",
  className = "",
}: ProvinceFilterProps) {
  const provinceOptions = ["all", ...(provinces ?? [])]

  return (
    <Select value={value} onValueChange={(val: string) => onChange(val)}>
      <SelectTrigger className={`w-full sm:w-48 ${className}`}>
        <MapPin className="w-4 h-4 mr-2" />
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {provinceOptions.map((province) => (
          <SelectItem key={province} value={province}>
            {province === "all" ? "All Provinces" : province}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
