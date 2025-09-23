
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StoreDetailModal } from "./store-detail-modal";
import { Search, Filter, CheckCircle, Eye, Share, X, CheckCheck, FileText } from "lucide-react";
import type { Store, User, Event } from "@/lib/firebase/types";
import { Timestamp } from "firebase/firestore";
import { formatDateTime } from "@/lib/utils/date-utils";
import { ProvinceCell } from "@/components/cells/province-cell";
import { LaunchTrainDateCell, SalespersonCell, StoreInfoCell } from "@/components/cells";
import toast, { Toaster } from "react-hot-toast";
import { StoreDetailsModal } from "../modals/store-details-modal";
import { DocumentViewerModal } from "../modals/document-viewer-modal";

interface RolloutListProps {
  stores: Store[] | null | undefined;
  events: Event[] | null | undefined;
  users: User[] | null | undefined;
  currentUser: User | null;
  onToggleSetup: (storeId: string) => Promise<void>;
  onSetupConfirmation: (storeId: string) => Promise<void>;
  onToggleSocialSetup: (storeId: string) => Promise<void>;
  updateCredentials: (storeId: string, credentials: Store["credentials"]) => Promise<void>;
}

interface StoreEvent {
  type: "store";
  store: Store;
  eventType: "training" | "launch";
  eventDate: Date | null;
}

interface CustomEvent {
  type: "custom";
  event: Event;
  eventDate: Date | null;
}

export function RolloutList({
  stores: storesProp,
  events: eventsProp,
  users: usersProp,
  currentUser,
  onToggleSetup,
  onSetupConfirmation,
  onToggleSocialSetup,
  updateCredentials,
}: RolloutListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "setup" | "confirmed" | "events">("all");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [modalMode, setModalMode] = useState<"share" | "confirmSetup">("share");
  const [documentViewModal, setDocumentViewModal] = useState<{
    isOpen: boolean;
    store: Store | null;
    documentType: "sla" | "bank" | null;
  }>({ isOpen: false, store: null, documentType: null });
  const isSuperadmin = currentUser?.role === "superadmin";
  const isMedia = currentUser?.role === "media";
  const [showTables, setShowTables] = useState(false);

  // Normalize props to empty arrays if undefined/null
  const stores = Array.isArray(storesProp) ? storesProp : [];
  const events = Array.isArray(eventsProp) ? eventsProp : [];
  const users = Array.isArray(usersProp) ? usersProp : [];

  // Date normalization function (copied from RolloutCalendar)
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

  const handleViewDocument = (store: Store, documentType: "sla" | "bank") => {
    console.log(`Viewing ${documentType} document for store ${store.id}`);
    setDocumentViewModal({ isOpen: true, store, documentType });
  };

  const currentDate = new Date();
  const todayStr = normalizeDate(currentDate);
  // Match RolloutCalendar: include current and next month
  const calendarStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const calendarEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);
  // Yesterday for past events filter
  const yesterday = new Date(currentDate);
  yesterday.setDate(currentDate.getDate() - 1);

  // Combine store and custom events, matching RolloutCalendar's date range
  const allEvents: (StoreEvent | CustomEvent)[] = useMemo(() => {
    const storeEvents: StoreEvent[] = stores.flatMap((store) => {
      const eventsList: StoreEvent[] = [];
      const normalizedTrainingDate = normalizeDate(store.trainingDate);
      const normalizedLaunchDate = normalizeDate(store.launchDate);

      // Convert normalized dates to Date objects for filtering
      const trainingDate = normalizedTrainingDate ? new Date(normalizedTrainingDate) : null;
      const launchDate = normalizedLaunchDate ? new Date(normalizedLaunchDate) : null;

      // Only include events within the calendar date range
      if (trainingDate && trainingDate >= calendarStart && trainingDate <= calendarEnd) {
        eventsList.push({
          type: "store",
          store,
          eventType: "training",
          eventDate: trainingDate,
        });
      }
      if (launchDate && launchDate >= calendarStart && launchDate <= calendarEnd) {
        eventsList.push({
          type: "store",
          store,
          eventType: "launch",
          eventDate: launchDate,
        });
      }
      return eventsList;
    });

    const customEvents: CustomEvent[] = events
      .filter((event) => {
        const normalizedEventDate = normalizeDate(event.date);
        const eventDate = normalizedEventDate ? new Date(normalizedEventDate) : null;
        return eventDate && eventDate >= calendarStart && eventDate <= calendarEnd;
      })
      .map((event) => ({
        type: "custom",
        event,
        eventDate: event.date ? new Date(normalizeDate(event.date)!) : null,
      }));

    // Apply search term filter
    return [...storeEvents, ...customEvents].filter((event) =>
      searchTerm
        ? event.type === "store"
          ? event.store.tradingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.store.streetAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.store.province.toLowerCase().includes(searchTerm.toLowerCase())
          : event.event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (event.event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            (event.event.province?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
        : true
    );
  }, [stores, events, searchTerm, calendarStart, calendarEnd]);

  // Filter events by status
  const filteredEvents = useMemo(() => {
    if (statusFilter === "all") return allEvents;
    if (statusFilter === "pending") return allEvents.filter((event) => event.type === "store" && !event.store.isSetup);
    if (statusFilter === "setup") return allEvents.filter((event) => event.type === "store" && event.store.isSetup && !event.store.setupConfirmed);
    if (statusFilter === "confirmed") return allEvents.filter((event) => event.type === "store" && event.store.setupConfirmed);
    if (statusFilter === "events") return allEvents.filter((event) => event.type === "custom");
    return allEvents;
  }, [allEvents, statusFilter]);

  // Split into today's, upcoming, and past events
  const todaysEvents = filteredEvents
    .filter((event) => {
      const eventDateStr = event.eventDate ? normalizeDate(event.eventDate) : null;
      return eventDateStr === todayStr;
    })
    .sort((a, b) => (a.eventDate && b.eventDate ? a.eventDate.getTime() - b.eventDate.getTime() : 0));

  const upcomingEvents = filteredEvents
    .filter((event) => event.eventDate && event.eventDate > currentDate && event.eventDate <= calendarEnd)
    .sort((a, b) => (a.eventDate && b.eventDate ? a.eventDate.getTime() - b.eventDate.getTime() : 0));

  const pastEvents = filteredEvents
    .filter((event) => {
      const eventDate = event.eventDate;
      return eventDate && eventDate <= yesterday && eventDate >= calendarStart;
    })
    .sort((a, b) => (a.eventDate && b.eventDate ? a.eventDate.getTime() - b.eventDate.getTime() : 0));

  const handleToggleSocialSetup = async (storeId: string, tradingName: string, isSocialSetup: boolean) => {
    try {
      await onToggleSocialSetup(storeId);
      toast.success(`"${tradingName}" social setup ${isSocialSetup ? "removed" : "confirmed"}!`, {
        style: {
          background: "#fff",
          color: "#111827",
          border: "1px solid #f97316",
        },
      });
    } catch (error) {
      toast.error("Failed to toggle social setup", {
        style: {
          background: "#fff",
          color: "#111827",
          border: "1px solid #f97316",
        },
      });
    }
  };

  const handleOpenConfirmSetupModal = (store: Store) => {
    setSelectedStore(store);
    setModalMode("confirmSetup");
  };

  const renderEventTable = (events: (StoreEvent | CustomEvent)[], title: string) => (
    <Card className="w-full mt-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Track setup progress for {title.toLowerCase()}</CardDescription>
      </CardHeader>
      <CardContent className="w-full overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              {isSuperadmin && <TableHead>Salesperson</TableHead>}
              <TableHead>Location</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Socials</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event, index) => (
              <TableRow key={`${event.type === "store" ? event.store.id : event.event.id}-${event.eventType || "custom"}-${index}`}>
                <TableCell>
                  {event.type === "store" ? (
                    <StoreInfoCell tradingName={event.store.tradingName} streetAddress={event.store.streetAddress} />
                  ) : (
                    <div>
                      <div className="font-medium">{event.event.title}</div>
                      <div className="text-sm text-gray-600">{event.event.description || "N/A"}</div>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {event.type === "store" ? (
                    <SalespersonCell
                      isSuperadmin={isSuperadmin}
                      salespersonId={event.store.salespersonId}
                      users={users}
                    />
                  ) : (
                    <span className="text-sm text-gray-500">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  <ProvinceCell province={event.type === "store" ? event.store.province : event.event.province || "N/A"} />
                </TableCell>
                <TableCell>
                  {event.type === "store" ? (
                    <LaunchTrainDateCell
                      launchDate={event.eventType === "launch" ? event.eventDate : null}
                      trainingDate={event.eventType === "training" ? event.eventDate : null}
                    />
                  ) : (
                    <span className="text-sm text-gray-600">
                      {event.eventDate ? formatDateTime(event.eventDate) : "N/A"}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {event.type === "store" ? (
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!event.store.isSocialSetup}
                          onChange={() => handleToggleSocialSetup(event.store.id, event.store.tradingName, !!event.store.isSocialSetup)}
                          disabled={event.store.isSocialSetup || (!isSuperadmin && !isMedia)}
                          className="sr-only peer"
                          aria-label="Social Setup Confirmed"
                        />
                        <div
                          className={`w-11 h-6 rounded-full transition-colors duration-200
                            ${!!event.store.isSocialSetup ? "bg-green-500" : "bg-red-500"}
                            ${event.store.isSocialSetup ? "opacity-60" : ""}
                            peer-disabled:opacity-60`}
                        ></div>
                        <div
                          className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200
                            ${!!event.store.isSocialSetup ? "translate-x-5" : ""}
                            peer-disabled:opacity-60`}
                        ></div>
                      </label>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  {event.type === "store" ? (
                    isSuperadmin ? (
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!event.store.credentials}
                          onChange={() => isSuperadmin && handleOpenConfirmSetupModal(event.store)}
                          disabled={!isSuperadmin}
                          className="sr-only peer"
                          aria-label="Setup Confirmed"
                        />
                        <div
                          className={`w-11 h-6 rounded-full transition-colors duration-200
                            ${!!event.store.credentials ? "bg-green-500" : "bg-red-500"}
                            ${!isSuperadmin ? "opacity-60" : ""}
                            peer-disabled:opacity-60`}
                        ></div>
                        <div
                          className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200
                            ${!!event.store.credentials ? "translate-x-5" : ""}
                            peer-disabled:opacity-60`}
                        ></div>
                      </label>
                    ) : (
                      <span className="text-sm text-gray-500">
                        {!!event.store.credentials ? <CheckCheck className="text-green-500" size={16} /> : <X className="text-red-500" size={16} />}
                      </span>
                    )
                  ) : (
                    <span className="text-sm text-gray-500">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-row items-center gap-2">
                    {event.type === "store" ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedStore(event.store);
                            setModalMode("share");
                          }}
                          className="text-gray-900 hover:text-blue-600"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedStore(event.store);
                            setModalMode("confirmSetup");
                          }}
                          className="text-gray-500 hover:text-blue-600"
                        >
                          <Share size={16} />
                        </Button>
                        {event.store.slaDocument && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDocument(event.store, "sla")}
                            className="text-green-600 hover:text-green-700"
                          >
                            <FileText size={16} />
                          </Button>
                        )}
                        {event.store.bankDocument && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDocument(event.store, "bank")}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <FileText size={16} />
                          </Button>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">N/A</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {events.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No {title.toLowerCase()} found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : `No ${title.toLowerCase()} available`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search stores or events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value: "all" | "pending" | "setup" | "confirmed" | "events") => setStatusFilter(value)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending Setup</SelectItem>
            <SelectItem value="setup">Setup Complete</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="events">Custom Events</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {todaysEvents.length > 0 && renderEventTable(todaysEvents, "Today's Events")}
      {renderEventTable(upcomingEvents, "Upcoming Events")}
      <Button
        variant="default"
        onClick={() => setShowTables((prev) => !prev)}
        className="mt-4"
      >
        {showTables ? "Hide Past Events" : "Show Past Events"}
      </Button>
      {showTables && renderEventTable(pastEvents, "Past Events")}

      {selectedStore && modalMode === "share" && (
        <StoreDetailsModal
          store={selectedStore}
          isOpen={true}
          onClose={() => setSelectedStore(null)}
          users={users}
          currentUser={currentUser}
          onToggleSetup={onToggleSetup}
          onSetupConfirmation={onSetupConfirmation}
        />
      )}
      {selectedStore && modalMode === "confirmSetup" && (
        <StoreDetailModal
          store={selectedStore}
          isOpen={true}
          onClose={() => setSelectedStore(null)}
          users={users}
          currentUser={currentUser}
          onToggleSetup={onToggleSetup}
          onSetupConfirmation={onSetupConfirmation}
          updateCredentials={updateCredentials}
          mode={modalMode}
        />
      )}
      <DocumentViewerModal
        isOpen={documentViewModal.isOpen}
        onClose={() => setDocumentViewModal({ isOpen: false, store: null, documentType: null })}
        store={documentViewModal.store}
        documentType={documentViewModal.documentType}
        currentUser={currentUser}
      />
    </div>
  );
}
