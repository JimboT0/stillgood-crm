import type React from "react"
import { TableCell } from "@/components/ui/table"
import { MapPin } from "lucide-react"

interface ProvinceCellProps {
  province: string
  className?: string
}

export const ProvinceCell: React.FC<ProvinceCellProps> = ({ province, className = "" }) => {
  const provinceMap: Record<string, string> = {
    Gauteng: "GP",
    "KwaZulu-Natal": "KZN",
    Natal: "KZN",
    Limpopo: "LP",
    Mpumalanga: "MP",
    "Western Cape": "WC",
    "Eastern Cape": "EC",
    "Northern Cape": "NC",
    "Free State": "FS",
    "North West": "NW",
    "Garden Route": "WC",
  }

  const abbreviation = provinceMap[province] || province

  return (
    <TableCell className={className}>
      <div className="flex items-center gap-2 text-sm">
        <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="font-medium" title={province}>
          {abbreviation}
        </span>
      </div>
    </TableCell>
  )
}
