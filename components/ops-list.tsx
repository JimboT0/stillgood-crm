"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, EditCard } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Bell, BellIcon, CheckCircle, EyeIcon, FileText, KeySquare } from "lucide-react"
import { SearchInput, StatusFilter } from "@/components/shared/filters"
import { StoreInfoCell, ProvinceCell } from "./cells"
import type { StoreOpsView, User, Event } from "@/lib/firebase/types"
import { StoreDetailsModal } from "./modals/store-details-modal"
import { DocumentViewerModal } from "./modals/document-viewer-modal"
import { formatDateTimeForDisplay } from "@/lib/utils/date-formatter"
import { addToCalendar } from "@/lib/utils/date-utils"
import { StoreCredModal } from "./store-cred-modal"
import { Timestamp } from "firebase/firestore"

interface OpsListProps {
    stores: StoreOpsView[]
    events: Event[]
    users: User[]
    currentUser: User | null
    selectedStore: StoreOpsView | null
    setSelectedStore: (store: StoreOpsView | null) => void
    searchTerm: string
    setSearchTerm: (term: string) => void
    onToggleSetup: (storeId: string) => Promise<void>
    onSetupConfirmation: (storeId: string) => Promise<void>
    updateCredentials: (storeId: string, credentials: StoreOpsView['credentials']) => Promise<void>
}

interface StoreEvent {
    store: StoreOpsView
    eventType: "training" | "launch"
    eventDate: Date | null
    documentType?: "sla" | "bank"
}

interface CustomEvent {
    event: Event
    eventType: "custom"
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
    events,
    users,
    currentUser,
    selectedStore,
    setSelectedStore,
    searchTerm,
    setSearchTerm,
    onToggleSetup,
    onSetupConfirmation,
    updateCredentials,
}: OpsListProps) {
    const [statusFilter, setStatusFilter] = useState<"all" | "coming" | "past" | "future">("coming")
    const isSuperadmin = currentUser?.role === "superadmin"
    const [modalMode, setModalMode] = useState<"share" | "confirmSetup">("share")
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [selectedDetailsStore, setSelectedDetailsStore] = useState<StoreOpsView | null>(null)
    const [selectedDetailStore, setSelectedDetailStore] = useState<StoreOpsView | null>(null)
    const [documentViewModal, setDocumentViewModal] = useState<{
        isOpen: boolean
        store: StoreOpsView | null
        documentType: "sla" | "bank" | null
    }>({ isOpen: false, store: null, documentType: null })

    const handleViewDocument = (store: StoreOpsView, documentType: "sla" | "bank") => {
        console.log(`Viewing ${documentType} document for store ${store.id}`)
        setDocumentViewModal({ isOpen: true, store, documentType })
    }

    const normalizeDate = (date: any): string | null => {
        if (date === null || date === undefined) {
            console.warn("Date is null or undefined");
            return null;
        }

        let parsedDate: Date;
        try {
            if (typeof date === "string") {
                parsedDate = new Date(date);
                if (isNaN(parsedDate.getTime())) {
                    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(date)) {
                        const [month, day, year] = date.split("/").map(Number);
                        parsedDate = new Date(year, month - 1, day);
                    } else if (/^\d{2}-\d{2}-\d{4}$/.test(date)) {
                        const [day, month, year] = date.split("-").map(Number);
                        parsedDate = new Date(year, month - 1, day);
                    } else if (/^\d{1,2}\s+[A-Za-z]+\s+\d{4}$/.test(date)) {
                        parsedDate = new Date(date);
                    } else {
                        console.warn(`Unsupported date string format: ${date}`);
                        return null;
                    }
                }
            } else if (date instanceof Timestamp) {
                parsedDate = date.toDate();
            } else if (typeof date === "object" && "seconds" in date && typeof date.seconds === "number") {
                parsedDate = new Date(date.seconds * 1000);
            } else if (date instanceof Date) {
                parsedDate = date;
            } else {
                console.warn(`Invalid date type: ${JSON.stringify(date)}`);
                return null;
            }

            if (isNaN(parsedDate.getTime())) {
                console.warn(`Invalid date parsed: ${JSON.stringify(date)}`);
                return null;
            }

            return `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, "0")}-${String(parsedDate.getDate()).padStart(2, "0")}`;
        } catch (error) {
            console.error(`Error parsing date: ${JSON.stringify(date)}`, error);
            return null;
        }
    };

    const handleOpenModal = (store: StoreOpsView, modal: "details" | "confirmSetup") => {
        console.log(`Opening modal: ${modal} for store ${store.id}`)
        if (modal === "details") {
            setSelectedDetailsStore(store)
            setIsDetailsModalOpen(true)
        } else if (modal === "confirmSetup") {
            setSelectedDetailStore(store)
            setModalMode("confirmSetup")
            setIsDetailModalOpen(true)
        }
    }

    const handleCloseDetailsModal = () => {
        setIsDetailsModalOpen(false)
        setSelectedDetailsStore(null)
    }

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false)
        setSelectedDetailStore(null)
    }

    // Get current date and coming month range
    const currentDate = new Date()
    const comingMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0)

    // Transform stores and events into a unified event list
    const allEvents: (StoreEvent | CustomEvent)[] = useMemo(() => {
        const storeEvents: StoreEvent[] = stores.flatMap((store) => {
            const eventsList: StoreEvent[] = [];
            if (store.trainingDate) {
                eventsList.push({
                    store,
                    eventType: "training",
                    eventDate: new Date(store.trainingDate.seconds * 1000),
                });
            }
            if (store.launchDate) {
                eventsList.push({
                    store,
                    eventType: "launch",
                    eventDate: new Date(store.launchDate.seconds * 1000),
                });
            }
            return eventsList;
        });

        const customEvents: CustomEvent[] = events.map((event) => {
            let eventDate: Date | null = null;
            try {
                eventDate = event.date ? new Date(event.date.seconds * 1000) : null;
                if (eventDate && isNaN(eventDate.getTime())) {
                    console.warn(`Invalid eventDate for event ${event.id}:`, event.date);
                    eventDate = null;
                }
            } catch (error) {
                console.error(`Error parsing date for event ${event.id}:`, error, event.date);
                eventDate = null;
            }
            return {
                event,
                eventType: "custom",
                eventDate,
            };
        });

        console.log("Custom events:", customEvents.map(e => ({
            id: e.event.id,
            title: e.event.title,
            eventDate: e.eventDate,
        })));

        return [...storeEvents, ...customEvents].filter((event) =>
            searchTerm
                ? ("store" in event
                    ? (event.store.tradingName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (event.store.storeId || "").toLowerCase().includes(searchTerm.toLowerCase())
                    : (event.event.title || "Untitled").toLowerCase().includes(searchTerm.toLowerCase()))
                : true
        );
    }, [stores, events, searchTerm]);

    // Categorize events
    const comingEvents = useMemo(() =>
        allEvents.filter((event) => event.eventDate && event.eventDate >= currentDate && event.eventDate <= comingMonthEnd)
            .sort((a, b) => (a.eventDate && b.eventDate ? a.eventDate.getTime() - b.eventDate.getTime() : 0)),
        [allEvents, currentDate, comingMonthEnd]
    )

    const pastEvents = useMemo(() =>
        allEvents.filter((event) => event.eventDate && event.eventDate < currentDate)
            .sort((a, b) => (a.eventDate && b.eventDate ? a.eventDate.getTime() - b.eventDate.getTime() : 0)),
        [allEvents, currentDate]
    )

    const futureEvents = useMemo(() =>
        allEvents.filter((event) => event.eventDate && event.eventDate > comingMonthEnd)
            .sort((a, b) => (a.eventDate && b.eventDate ? a.eventDate.getTime() - b.eventDate.getTime() : 0)),
        [allEvents, comingMonthEnd]
    )

    // Filter events based on status
    const filteredEvents = useMemo(() => {
        if (statusFilter === "all") return allEvents
        if (statusFilter === "coming") return comingEvents
        if (statusFilter === "past") return pastEvents
        if (statusFilter === "future") return futureEvents
        return allEvents
    }, [allEvents, statusFilter, comingEvents, pastEvents, futureEvents])

    // Calculate stats for cards
    const eventStats = useMemo(() => ({
        total: allEvents.length,
        coming: comingEvents.length,
        past: pastEvents.length,
        future: futureEvents.length,
        setupComplete: stores.filter((store) => store.isSetup).length,
    }), [allEvents, comingEvents, pastEvents, futureEvents, stores])

    const hasActiveFilters = searchTerm !== "" || statusFilter !== "coming"

    console.log("Stores in OpsList:", stores.map(s => ({
        id: s.id,
        tradingName: s.tradingName,
        trainingDate: s.trainingDate,
        launchDate: s.launchDate,
    })))
    console.log("Events in OpsList:", events.map(e => ({
        id: e.id,
        title: e.title,
        date: e.date,
    })))

    const renderEventTable = (events: (StoreEvent | CustomEvent)[], title: string, showHeader: boolean = false) => (
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
                            <EditCard key={`${"store" in event ? event.store.id : event.event.id}-${event.eventType}-${index}`} className="p-4 bg-gray-50">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-medium text-sm">
                                            {"store" in event ? event.store.tradingName : event.event.title}
                                        </h3>
                                        {/* <div province={"store" in event ? event.store.province : event.event.province} /> */}
                                    </div>
                                    <span className="text-sm text-gray-600 space-y-1">
                                        <p>
                                            {"store" in event ? event.store.streetAddress || "N/A" : event.event.description || "N/A"}
                                        </p>
                                        <span className="flex flex-row items-center gap-0.5">
                                            <span
                                                className={`px-2 py-1 rounded border font-medium text-xs tracking-wide
                          ${event.eventType === "training"
                                                        ? "border-blue-600 text-blue-700 bg-blue-50"
                                                        : event.eventType === "launch"
                                                            ? "border-green-600 text-green-700 bg-green-50"
                                                            : "border-orange-600 text-orange-700 bg-orange-50"
                                                    }`}
                                                style={{ letterSpacing: "0.005em" }}
                                            >
                                                {event.eventType === "training" ? "Training" : event.eventType === "launch" ? "Launch" : "Event"}
                                            </span>
                                            <span className="px-1 py-1 rounded border border-gray-300 bg-gray-50 text-gray-800 text-xs font-mono">
                                                {event.eventDate ? formatDateTimeForDisplay(event.eventDate) : "N/A"}
                                            </span>
                                            {"store" in event && (
                                                <>
                                                    <span className="px-2 py-1.5 rounded border border-yellow-400 text-yellow-500 bg-gray-50 text-xs font-mono">
                                                        <BellIcon className="w-3 h-3 cursor-pointer" onClick={() => addToCalendar(event.store, event.eventDate, event.eventType)} />
                                                    </span>
                                                    {event.store.slaDocument && (
                                                        <span className="px-2 py-1.5 rounded border border-green-400 text-green-500 bg-gray-50 text-xs font-mono">
                                                            <FileText className="w-3 h-3 cursor-pointer" onClick={() => handleViewDocument(event.store, "sla")} />
                                                        </span>
                                                    )}
                                                    {event.store.bankDocument && (
                                                        <span className="px-2 py-1.5 rounded border border-blue-400 text-blue-500 bg-gray-50 text-xs font-mono">
                                                            <FileText className="w-3 h-3 cursor-pointer" onClick={() => handleViewDocument(event.store, "bank")} />
                                                        </span>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleOpenModal(event.store, "confirmSetup")}
                                                        className={
                                                            event.store.credentials
                                                                ? "text-yellow-600 border-yellow-400 hover:text-yellow-700 hover:bg-yellow-50 bg-transparent"
                                                                : "text-gray-200 border-gray-200 hover:text-gray-400 hover:bg-gray-40 bg-transparent"
                                                        }
                                                    >
                                                        <KeySquare className="w-2 h-2" />
                                                    </Button>
                                                </>

                                            )}
                                        </span>
                                    </span>
                                    {"store" in event && isSuperadmin && event.store.isSetup && !event.store.setupConfirmed && (
                                        <span className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => onSetupConfirmation(event.store.id)}
                                                className="bg-white text-green-600 hover:bg-green-600 hover:text-white"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Confirm Setup
                                            </Button>
                                        </span>
                                    )}
                                </div>
                            </EditCard>
                        ))
                    )}
                </div>

                <Table className="hidden md:table w-full" role="grid">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Event</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {events.map((event, index) => (
                            <TableRow key={`${"store" in event ? event.store.id : event.event.id}-${event.eventType}-${index}`}>
                                <>
                                    {"store" in event ? (
                                        <StoreInfoCell
                                            tradingName={event.store.tradingName || ""}
                                            streetAddress={event.store.streetAddress || ""}
                                        />
                                    ) : (
                                        <TableCell>
                                            <div className="font-medium">{event.event.title}</div>
                                            <div className="text-sm text-gray-600">{event.event.description || "N/A"}</div>
                                        </TableCell>
                                    )}
                                </>

                                <ProvinceCell province={"store" in event ? event.store.province : event.event.province} />
                                <TableCell>
                                    <div
                                        className={`px-2 py-1 rounded border font-medium text-xs tracking-wide w-fit
                                        ${event.eventType === "training"
                                                ? "border-blue-600 text-blue-700 bg-blue-50"
                                                : event.eventType === "launch"
                                                    ? "border-green-600 text-green-700 bg-green-50"
                                                    : "border-orange-600 text-orange-700 bg-orange-50"
                                            }`}
                                        style={{ letterSpacing: "0.05em" }}
                                    >
                                        {event.eventType === "training" ? "Training" : event.eventType === "launch" ? "Launch" : "Event"}
                                    </div>
                                    <div className="px-2 py-1 rounded border border-gray-300 bg-gray-50 text-gray-800 text-xs font-mono w-fit">
                                        {event.eventDate ? formatDateTimeForDisplay(event.eventDate) : "N/A"}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="flex items-center gap-2">
                                        {"store" in event && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleOpenModal(event.store, "details")}
                                                >
                                                    <EyeIcon className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => addToCalendar(event.store, event.eventDate, event.eventType)}
                                                >
                                                    <Bell className="w-4 h-4" />
                                                </Button>
                                                {event.store.slaDocument && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleViewDocument(event.store, "sla")}
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {event.store.bankDocument && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleViewDocument(event.store, "bank")}
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleOpenModal(event.store, "confirmSetup")}
                                                    className={
                                                        event.store.credentials
                                                            ? "text-yellow-600 border-yellow-400 hover:text-yellow-700 hover:bg-yellow-50 bg-transparent"
                                                            : "text-gray-200 border-gray-200 hover:text-gray-400 hover:bg-gray-40 bg-transparent"
                                                    }
                                                >
                                                    <KeySquare className="w-3 h-3" />
                                                </Button>
                                            </>
                                        )}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {events.length === 0 && (
                    <span className="text-center py-8 hidden md:block">
                        <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No {title.toLowerCase()} found</h3>
                        <p className="text-gray-600">
                            {hasActiveFilters ? "Try adjusting your search or filter criteria" : `No ${title.toLowerCase()} available`}
                        </p>
                    </span>
                )}
            </div>
        </Card>
    )

    return (
        <>
            <span className="space-y-4 w-full">
                <span className="flex flex-col sm:flex-row gap-4">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search store or custom events..."
                    />
                    <StatusFilter
                        value={statusFilter}
                        onChange={(value) => setStatusFilter(value as "all" | "coming" | "past" )}
                        options={EVENT_STATUS_OPTIONS}
                        placeholder="Filter by status"
                    />
                </span>

                {renderEventTable(filteredEvents, "Coming Month Events", true)}
                {pastEvents.length > 0 && statusFilter === "all" && renderEventTable(pastEvents, "Past Events")}

                <StoreDetailsModal
                    store={selectedDetailsStore}
                    isOpen={isDetailsModalOpen}
                    onClose={handleCloseDetailsModal}
                    users={users}
                    currentUser={currentUser}
                    onToggleSetup={onToggleSetup}
                    onSetupConfirmation={onSetupConfirmation}
                />

                <StoreCredModal
                    store={selectedDetailStore}
                    isOpen={isDetailModalOpen}
                    onClose={handleCloseDetailModal}
                    users={users}
                    currentUser={currentUser}
                />

                <DocumentViewerModal
                    isOpen={documentViewModal.isOpen}
                    onClose={() => setDocumentViewModal({ isOpen: false, store: null, documentType: null })}
                    store={documentViewModal.store}
                    documentType={documentViewModal.documentType}
                    currentUser={currentUser}
                />
            </span>
        </>
    )
}
