"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, EditCard } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Bell, BellIcon, Calendar, CheckCircle, EditIcon, EyeIcon } from "lucide-react"
import { SearchInput, StatusFilter } from "@/components/shared/filters"
import { StoreInfoCell, ProvinceCell, StoreStatusBadge, SalespersonCell } from "./cells"
import { OpsCalendarModal } from "./ops-calendar-modal"
import type { StoreOpsView, User } from "@/lib/firebase/types"
import { StoreDetailsModal } from "./store-details-modal"
import { formatDateTimeForDisplay } from "../lib/utils/date-utils"
import { addToCalendar } from "../lib/utils/date-utils"

interface OpsListProps {
    stores: StoreOpsView[]
    users: User[]
    currentUser: User | null
    selectedStore: StoreOpsView | null
    setSelectedStore: (store: StoreOpsView | null) => void
    searchTerm: string
    setSearchTerm: (term: string) => void
    onToggleSetup: (storeId: string) => Promise<void>
    onSetupConfirmation: (storeId: string) => Promise<void>
}

interface StoreEvent {
    store: StoreOpsView
    eventType: "training" | "launch"
    eventDate: Date | null
}

const EVENT_STATUS_OPTIONS = [
    { value: "all", label: "All Events" },
    { value: "coming", label: "Coming Month" },
    { value: "past", label: "Past Events" },
    { value: "future", label: "Future Events" },
]

export function OpsList({
    stores,
    users,
    currentUser,
    selectedStore,
    setSelectedStore,
    searchTerm,
    setSearchTerm,
    onToggleSetup,
    onSetupConfirmation,
}: OpsListProps) {
    const [statusFilter, setStatusFilter] = useState<"all" | "coming" | "past" | "future">("coming")
    const isSuperadmin = currentUser?.role === "superadmin"

    // Get current date and coming month range
    const currentDate = new Date()
    const comingMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0) // End of next month

    // Transform stores into events
    const events: StoreEvent[] = useMemo(() => {
        return stores.flatMap((store) => {
            const eventsList: StoreEvent[] = []
            if (store.trainingDate) {
                eventsList.push({
                    store,
                    eventType: "training",
                    eventDate: new Date(store.trainingDate.seconds * 1000),
                })
            }
            if (store.launchDate) {
                eventsList.push({
                    store,
                    eventType: "launch",
                    eventDate: new Date(store.launchDate.seconds * 1000),
                })
            }
            return eventsList
        }).filter((event) =>
            searchTerm
                ? (event.store.tradingName || event.store.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (event.store.storeId || "").toLowerCase().includes(searchTerm.toLowerCase())
                : true
        )
    }, [stores, searchTerm])

    // Categorize events
    const comingEvents = useMemo(() =>
        events.filter((event) => event.eventDate && event.eventDate >= currentDate && event.eventDate <= comingMonthEnd)
            .sort((a, b) => (a.eventDate && b.eventDate ? a.eventDate.getTime() - b.eventDate.getTime() : 0)),
        [events, currentDate, comingMonthEnd]
    )

    const pastEvents = useMemo(() =>
        events.filter((event) => event.eventDate && event.eventDate < currentDate)
            .sort((a, b) => (a.eventDate && b.eventDate ? a.eventDate.getTime() - b.eventDate.getTime() : 0)),
        [events, currentDate]
    )

    const futureEvents = useMemo(() =>
        events.filter((event) => event.eventDate && event.eventDate > comingMonthEnd)
            .sort((a, b) => (a.eventDate && b.eventDate ? a.eventDate.getTime() - b.eventDate.getTime() : 0)),
        [events, comingMonthEnd]
    )

    // Filter events based on status
    const filteredEvents = useMemo(() => {
        if (statusFilter === "all") return events
        if (statusFilter === "coming") return comingEvents
        if (statusFilter === "past") return pastEvents
        if (statusFilter === "future") return futureEvents
        return events
    }, [events, statusFilter, comingEvents, pastEvents, futureEvents])

    // Calculate stats for cards
    const eventStats = useMemo(() => ({
        total: events.length,
        coming: comingEvents.length,
        past: pastEvents.length,
        future: futureEvents.length,
        setupComplete: stores.filter((store) => store.isSetup).length,
    }), [events, comingEvents, pastEvents, futureEvents, stores])

    const hasActiveFilters = searchTerm !== "" || statusFilter !== "coming"

    const renderEventTable = (events: StoreEvent[], title: string, showHeader: boolean = false) => (
        <Card className="w-full mt-6">
            {showHeader && (
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>Monitor and manage {title.toLowerCase()}</CardDescription>
                </CardHeader>
            )}
            <div className="w-full overflow-x-auto p-4">
                <div className="block md:hidden space-y-2">
                    {events.length === 0 ? (
                        <div className="text-center py-2">
                            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No {title.toLowerCase()} found</h3>
                            <p className="text-gray-600">
                                {hasActiveFilters ? "Try adjusting your search or filter criteria" : `No ${title.toLowerCase()} available`}
                            </p>
                        </div>
                    ) : (
                        events.map((event, index) => (
                            <EditCard key={`${event.store.id}-${event.eventType}-${index}`} className="p-4 bg-gray-50">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-medium text-sm">{event.store.tradingName || event.store.tradingName}</h3>
                                        <ProvinceCell province={event.store.province} />
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p>
                                            {event.store.streetAddress || "N/A"}
                                        </p>

                                        <div className="flex flex-row items-center gap-0.5">
                                            <span
                                                className={`px-2 py-1 rounded border font-medium text-xs tracking-wide
                                            ${event.eventType === "training"
                                                        ? "border-blue-600 text-blue-700 bg-blue-50"
                                                        : "border-green-600 text-green-700 bg-green-50"
                                                    }`}
                                                style={{ letterSpacing: "0.005em" }}
                                            >
                                                {event.eventType === "training" ? "training" : "launch"}
                                            </span>
                                            <span className="px-1 py-1 rounded border border-gray-300 bg-gray-50 text-gray-800 text-xs font-mono">
                                                {event.eventDate ? formatDateTimeForDisplay(event.eventDate) : "N/A"}
                                            </span>

                                            <span className="px-2 py-1.5 rounded border border-gray-400 bg-gray-50 text-gray-800 text-xs font-mono">
                                                <EyeIcon className="w-3 h-3" onClick={() => setSelectedStore(event.store)} />
                                            </span>
                                            <span className="px-2 py-1.5 rounded border border-yellow-400 text-yellow-500 bg-gray-50 text-gray-800 text-xs font-mono">
                                                <BellIcon className="w-3 h-3" onClick={() => addToCalendar(event.store, event.eventType, event.eventDate)}
                                                />
                                            </span>
                                        </div>


                                    </div>
                                    <div className="flex gap-2">

                                        {isSuperadmin && event.store.isSetup && !event.store.setupConfirmed && (
                                       <Button
                                                size="sm"
                                                onClick={() => onSetupConfirmation(event.store.id)}
                                                className="bg-white text-white hover:bg-green-600"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2 text-white" />
                                                Confirm Setup
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </EditCard>
                        ))
                    )}
                    |       </div>

                <Table className="hidden md:table w-full" role="grid">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Store</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Event</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {events.map((event, index) => (
                            <TableRow key={`${event.store.id}-${event.eventType}-${index}`}>
                                <StoreInfoCell
                                    tradingName={event.store.tradingName || event.store.name || ""}
                                    streetAddress={event.store.streetAddress || ""}
                                />
                                <ProvinceCell province={event.store.province} />
                                <TableCell>
                                    <span
                                        className={`px-2 py-1 rounded border font-medium text-xs tracking-wide
                                            ${event.eventType === "training"
                                                ? "border-blue-600 text-blue-700 bg-blue-50"
                                                : "border-green-600 text-green-700 bg-green-50"
                                            }`}
                                        style={{ letterSpacing: "0.05em" }}
                                    >
                                        {event.eventType === "training" ? "training" : "launch"}
                                    </span>
                                    <span className=" px-2 py-1 rounded border border-gray-300 bg-gray-50 text-gray-800 text-xs font-mono">
                                        {event.eventDate ? formatDateTimeForDisplay(event.eventDate) : "N/A"}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setSelectedStore(event.store)}
                                        >
                                            <EyeIcon className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => addToCalendar(event.store, event.eventType, event.eventDate)}
                                        >
                                            <Bell className="w-4 h-4" />
                                        </Button>

                                        {isSuperadmin && event.store.isSetup && !event.store.setupConfirmed && (
                                            <Button
                                                size="sm"
                                                onClick={() => onSetupConfirmation(event.store.id)}
                                                className="bg-white text-white hover:bg-green-600"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2 text-white" />
                                                Confirm Setup
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {events.length === 0 && (
                    <div className="text-center py-8 hidden md:block">
                        <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No {title.toLowerCase()} found</h3>
                        <p className="text-gray-600">
                            {hasActiveFilters ? "Try adjusting your search or filter criteria" : `No ${title.toLowerCase()} available`}
                        </p>
                    </div>
                )}
            </div>
        </Card>
    )

    return (
        <div className="space-y-4 w-full">

            <div className="flex flex-col sm:flex-row gap-4">
                <SearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search store events..."
                />
                <StatusFilter
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={EVENT_STATUS_OPTIONS}
                    placeholder="Filter by status"
                />
            </div>


            {renderEventTable(filteredEvents, "Coming Month Events", true)}
            {pastEvents.length > 0 && statusFilter === "all" && renderEventTable(pastEvents, "Past Events")}
            {futureEvents.length > 0 && statusFilter === "all" && renderEventTable(futureEvents, "Future Events")}

            <StoreDetailsModal
                store={selectedStore}
                isOpen={!!selectedStore}
                onClose={() => setSelectedStore(null)}
            />
        </div>
    )
}