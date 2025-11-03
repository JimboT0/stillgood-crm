"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

interface DateRangeFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
  className?: string
}

export function DateRangeFilter({ value, onChange, className = "" }: DateRangeFilterProps) {
  const [openFrom, setOpenFrom] = useState(false)
  const [openTo, setOpenTo] = useState(false)

  return (
    <div className={`flex flex-col sm:flex-row gap-2 ${className}`}>
      {/* From Date */}
      <Popover open={openFrom} onOpenChange={setOpenFrom}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full sm:w-40 justify-start text-left font-normal bg-transparent">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value.from ? format(value.from, "PPP") : "From date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value.from}
            onSelect={(date) => {
              onChange({ ...value, from: date ?? undefined })
              setOpenFrom(false)
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      {/* To Date */}
      <Popover open={openTo} onOpenChange={setOpenTo}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full sm:w-40 justify-start text-left font-normal bg-transparent">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value.to ? format(value.to, "PPP") : "To date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value.to}
            onSelect={(date) => {
              onChange({ ...value, to: date ?? undefined })
              setOpenTo(false)
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
