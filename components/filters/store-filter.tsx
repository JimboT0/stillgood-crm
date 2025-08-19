"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

interface StoreFiltersProps {
    stores: any[]
    searchTerm: string
    setSearchTerm: (term: string) => void
    selectedProvince: string
    setSelectedProvince: (province: string) => void
    dateRange: { from: Date | undefined; to: Date | undefined }
    setDateRange: (range: { from: Date | undefined; to: Date | undefined }) => void
}

export default function StoreFilters({
    stores,
    searchTerm,
    setSearchTerm,
    selectedProvince,
    setSelectedProvince,
    dateRange,
    setDateRange,
}: StoreFiltersProps) {
    const [openFrom, setOpenFrom] = useState(false)
    const [openTo, setOpenTo] = useState(false)

    // Get unique provinces for filter dropdown
    const provinces = ["all", ...new Set(stores.map((store) => store.province))]

    // Set default date range to last 30 days on component mount
    useEffect(() => {
        const today = new Date()
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(today.getDate() - 30)
        setDateRange({ from: thirtyDaysAgo, to: today })
    }, [setDateRange])

    // Search button handler (implement your search logic here)
    const handleSearch = () => {
        // You can trigger your search/filter logic here
        // For example, you might want to call a prop function or set a state
    }

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 w-full">
                <Input
                    placeholder="Search stores..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64"
                />
                <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                    <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                        {provinces.map((province) => (
                            <SelectItem key={province} value={province}>
                                {province === "all" ? "All Provinces" : province}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {/* From Date */}
                <Popover open={openFrom} onOpenChange={setOpenFrom}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full sm:w-40 justify-start text-left font-normal"
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.from ? format(dateRange.from, "PPP") : "From date"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={dateRange.from}
                            onSelect={(date) => {
                                setDateRange({ ...dateRange, from: date ?? undefined })
                                setOpenFrom(false)
                            }}
                            autoFocus
                        />
                    </PopoverContent>
                </Popover>
                {/* To Date */}
                <Popover open={openTo} onOpenChange={setOpenTo}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full sm:w-40 justify-start text-left font-normal"
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.to ? format(dateRange.to, "PPP") : "To date"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={dateRange.to}
                            onSelect={(date) => {
                                setDateRange({ ...dateRange, to: date ?? undefined })
                                setOpenTo(false)
                            }}
                            autoFocus
                        />
                    </PopoverContent>
                </Popover>
                <Button
                    variant="default"
                    className="w-full sm:w-32"
                    onClick={handleSearch}
                >
                    Search
                </Button>
            </div>
        </div>
    )
}
