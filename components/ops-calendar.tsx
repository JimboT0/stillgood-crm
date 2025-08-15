"use client";

import React, { useState, useEffect, useMemo } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { createEvent } from "ics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarIcon, List, MapPin, FileText, Download, Bell, ChevronLeft, ChevronRight, X } from "lucide-react";
import { DocumentViewerModal } from "@/components/document-viewer-modal";
import { Timestamp } from "firebase/firestore";
import { auth } from "@/lib/firebase/config";
import { storeService } from "@/lib/firebase/services/store";
import { userService } from "@/lib/firebase/services/user";
import type { User, StoreOpsView } from "@/lib/firebase/types";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { formatDateTime } from "./utils";
import { OpsCalendarModal } from "./ops-calendar-modal";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface OpsCalendarProps {
  stores?: StoreOpsView[];
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    type: "training" | "launch";
    store: StoreOpsView;
  };
}

const allProvinces = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

const addToCalendar = (event: CalendarEvent) => {
  const { store, type } = event.resource;
  const eventDate = type === "training" ? store.trainingDate : store.launchDate;
  if (!eventDate) return;

  const jsDate =
    eventDate instanceof Timestamp ? eventDate.toDate() : new Date(eventDate);
  if (isNaN(jsDate.getTime())) {
    console.error(`Invalid ${type} date for store: ${store.tradingName || store.storeId}`);
    return;
  }

  const startDate = jsDate;
  const endDate = new Date(startDate.getTime() + (type === "training" ? 2 : 4) * 60 * 60 * 1000);

  const icsEvent = {
    start: [
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      startDate.getDate(),
      startDate.getHours(),
      startDate.getMinutes(),
    ],
    end: [
      endDate.getFullYear(),
      endDate.getMonth() + 1,
      endDate.getDate(),
      endDate.getHours(),
      endDate.getMinutes(),
    ],
    title: `${type === "training" ? "Training" : "Launch"}: ${store.tradingName}`,
    description: `Store: ${store.tradingName}\nAddress: ${store.streetAddress}, ${store.province}\nStore ID: ${store.storeId}\nStatus: ${store.status}`,
    location: `${store.streetAddress}, ${store.province}`,
  };

  createEvent(icsEvent, (error, value) => {
    if (error) {
      console.error("Error creating ICS file:", error);
      return;
    }
    const blob = new Blob([value], { type: "text/calendar" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${store.tradingName}-${type}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  });
};

const CustomEventModal: React.FC<{
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onViewDocument?: (store: StoreOpsView) => void;
}> = ({ event, isOpen, onClose }) => {
  if (!isOpen || !event) return null;

  const { store, type } = event.resource;
  const eventDate = type === "training" ? store.trainingDate : store.launchDate;
  const formattedDate = formatDateTime(eventDate);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Event details">
      <div className="bg-white rounded-lg w-[95vw] max-w-lg max-h-[80vh] overflow-y-auto p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold mb-4">
          {type === "training" ? "Training" : "Launch"} Details: {store.tradingName}
        </h2>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">Event Information</h4>
            <p className="text-sm text-gray-600">
              <strong>Type:</strong> {type === "training" ? "Training" : "Launch"}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Date & Time:</strong> {formattedDate}
            </p>
          </div>
          <div>
            <h4 className="font-medium">Store Details</h4>
            <p className="text-sm text-gray-600">
              <strong>Store Name:</strong> {store.tradingName || "N/A"}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Address:</strong> {store.streetAddress}, {store.province}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Store ID:</strong> {store.storeId || "N/A"}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Status:</strong> {store.status || "N/A"}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Contact Person:</strong> {store.contactPerson || "N/A"}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Contact Number:</strong> {store.contactNumber || "N/A"}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Email:</strong> {store.email || "N/A"}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-4">
          <Button
            variant="outline"
            className="text-xs"
            onClick={() => addToCalendar(event)}
            aria-label={`Set calendar reminder for ${type} event`}
          >
            <Bell className="w-4 h-4 mr-2" />
          </Button>
          <Button
            variant="outline"
            className="text-xs"
            onClick={onClose}
            aria-label="Close event details"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export function OpsCalendar({ stores: initialStores = [] }: OpsCalendarProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [stores, setStores] = useState<StoreOpsView[]>(initialStores);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("list");
  const [calendarView, setCalendarView] = useState<"month" | "week" | "day">(
    typeof window !== "undefined" && window.innerWidth < 768 ? "week" : "month",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Set current user from Firebase auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const allUsers = await userService.getAll();
          let user = allUsers.find((u) => u.email === firebaseUser.email);

          if (!user) {
            const isAdmin = firebaseUser.email?.includes("admin");
            user = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
              email: firebaseUser.email || "",
              role: isAdmin ? "superadmin" : "salesperson",
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }

          setCurrentUser(user);
        } catch (error) {
          console.error("Error loading user:", error);
          setCurrentUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || "User",
            email: firebaseUser.email || "",
            role: firebaseUser.email?.includes("admin") ? "superadmin" : "salesperson",
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load all stores for every user
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;

      setLoading(true);
      try {
        const storesData = await storeService.getAll();
        setStores(storesData);
      } catch (error) {
        console.error("Error loading stores:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  const provincesWithEvents = useMemo(() => {
    const provincesSet = new Set<string>(["All Provinces"]);
    stores.forEach((store) => {
      if (store.trainingDate || store.launchDate) {
        provincesSet.add(store.province);
      }
    });
    return Array.from(provincesSet).filter((province) =>
      province === "All Provinces" ? true : allProvinces.includes(province),
    );
  }, [stores]);

const getEvents = (province: string, eventType: "all" | "training" | "launch") => {
  const now = new Date(); // Current date and time (2025-08-14 19:30 SAST)

  const filteredStores =
    province === "All Provinces" ? stores : stores.filter((store) => store.province === province);

  const searchLower = searchTerm.toLowerCase();
  const searchedStores = searchLower
    ? filteredStores.filter(
        (store) =>
          (store.tradingName || "").toLowerCase().includes(searchLower) ||
          (store.storeId || "").toLowerCase().includes(searchLower),
      )
    : filteredStores;

  const calendarEvents: CalendarEvent[] = [];

  searchedStores.forEach((store) => {
    if (eventType === "all" || eventType === "training") {
      if (!store.trainingDate) {
        console.warn(`Missing training date for store: ${store.tradingName || store.storeId}`);
      } else {
        const trainingDate =
          store.trainingDate instanceof Timestamp ? store.trainingDate.toDate() : new Date(store.trainingDate);
        if (isNaN(trainingDate.getTime())) {
          console.warn(`Invalid training date for store: ${store.tradingName || store.storeId}`);
        } else if (trainingDate >= now) {
          calendarEvents.push({
            id: `training-${store.storeId || `fallback-${store.tradingName || "unknown"}`}`,
            title: `Training: ${store.tradingName}`,
            start: trainingDate,
            end: new Date(trainingDate.getTime() + 2 * 60 * 60 * 1000),
            resource: { type: "training", store },
          });
        }
      }
    }

    if (eventType === "all" || eventType === "launch") {
      if (!store.launchDate) {
        console.warn(`Missing launch date for store: ${store.tradingName || store.storeId}`);
      } else {
        const launchDate =
          store.launchDate instanceof Timestamp ? store.launchDate.toDate() : new Date(store.launchDate);
        if (isNaN(launchDate.getTime())) {
          console.warn(`Invalid launch date for store: ${store.tradingName || store.storeId}`);
        } else if (launchDate >= now) {
          calendarEvents.push({
            id: `launch-${store.storeId || `fallback-${store.tradingName || "unknown"}`}`,
            title: `Launch: ${store.tradingName}`,
            start: launchDate,
            end: new Date(launchDate.getTime() + 4 * 60 * 60 * 1000),
            resource: { type: "launch", store },
          });
        }
      }
    }
  });

  return calendarEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
};

const CustomEvent = ({ event }: { event: CalendarEvent }) => {
  const { store, type } = event.resource;
  const eventDate = type === "training" ? store.trainingDate : store.launchDate;
  const formattedDate = eventDate
    ? format(eventDate instanceof Timestamp ? eventDate.toDate() : new Date(eventDate), "dd/MM/yyyy HH:mm")
    : "N/A";

  return (
    <div className="p-1 text-xs"           
    onClick={(e) => {
            e.stopPropagation();
            setSelectedEvent(event);
            setEventModalOpen(true);
          }}>
      <div className="font-medium">{event.title}</div>
      <div className="opacity-90 flex items-center gap-1">
        <MapPin className="w-3 h-3" aria-hidden="true" />
        {store.streetAddress ? `${store.streetAddress}, ${store.province}` : "N/A"}
      </div>
      <div className="mt-1">
        {formattedDate}
      </div>
      <div className="flex gap-2 mt-2">
        {/* <Button
          variant="outline"
          size="sm"
          className="text-xs bg-transparent"
          onClick={(e) => {
            e.stopPropagation();
            addToCalendar(event);
          }}
          aria-label={`Set reminder for ${event.title}`}
        >
          <Bell className="w-3 h-3 mr-1" aria-hidden="true" />
        </Button> */}
      </div>
    </div>
  );
};

const eventStyleGetter = (event: CalendarEvent) => {
  let backgroundColor = "#e0e7ff"; // default for training
  if (event.resource.type === "launch") {
    backgroundColor = "#bbf7d0"; // green for launch
  }
  return {
    style: {
      backgroundColor,
      borderRadius: "6px",
      color: "#222",
      border: "none",
      padding: "4px 8px",
      fontSize: "0.95em",
    },
  };
};

const ListView = ({ province, eventType }: { province: string; eventType: "all" | "training" | "launch" }) => {
  const events = getEvents(province, eventType);

  return (
    <Card>
      <CardContent className="p-0">
        {/* Mobile: Card-based layout */}
        <div className="block md:hidden space-y-4 p-4">
          {events.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No {eventType === "all" ? "events" : eventType + " events"} found for {province}.
              {searchTerm && " Clear the search to view all events."}
            </p>
          ) : (
            events.map((event) => (
              <Card key={event.id} className="p-4 bg-gray-50">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-sm">{event.title}</h3>
                    <Badge
                      variant={event.resource.type === "training" ? "default" : "success"}
                      className={event.resource.type === "training" ? "bg-blue-500" : "bg-green-500"}
                    >
                      {event.resource.type === "training" ? "Training" : "Launch"}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <strong>Date & Time:</strong>{" "}
                      {formatDateTime(event.resource.type === "training" ? event.resource.store.trainingDate : event.resource.store.launchDate)}
                    </p>
                    <p>
                      <strong>Store Name:</strong> {event.resource.store.tradingName || "N/A"}
                    </p>
                    <p>
                      <strong>Address:</strong>{" "}
                      {event.resource.store.streetAddress ? `${event.resource.store.streetAddress}, ${event.resource.store.province}` : "N/A"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="text-xs bg-transparent"
                      onClick={() => {
                        setSelectedEvent(event);
                        setEventModalOpen(true);
                      }}
                      aria-label={`View details for ${event.title}`}
                    >
                      Details
                    </Button>
                    <Button
                      variant="outline"
                      className="text-xs bg-transparent"
                      onClick={() => addToCalendar(event)}
                      aria-label={`Set reminder for ${event.title}`}
                    >
                      <Bell className="w-4 h-4 mr-1" aria-hidden="true" />

                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Desktop: Table layout */}
        <table className="hidden md:table w-full" role="grid">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-3 text-left text-sm font-medium" scope="col">Event</th>
              <th className="p-3 text-left text-sm font-medium" scope="col">Store Name</th>
              <th className="p-3 text-left text-sm font-medium" scope="col">Address</th>
              <th className="p-3 text-left text-sm font-medium" scope="col">Province</th>
              <th className="p-3 text-left text-sm font-medium" scope="col">Date</th>
              <th className="p-3 text-left text-sm font-medium" scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-gray-200 border-b">
                <td className="p-3">
                  <Badge
                    variant={event.resource.type === "training" ? "default" : "success"}
                    className={event.resource.type === "training" ? "bg-blue-500" : "bg-green-500"}
                  >
                    {event.resource.type === "training" ? "Training" : "Launch"}
                  </Badge>
                </td>
                <td className="p-3 text-sm">{event.resource.store.tradingName || "N/A"}</td>
                <td className="p-3 text-sm">
                  {event.resource.store.streetAddress ? `${event.resource.store.streetAddress}, ${event.resource.store.province}` : "N/A"}
                </td>
                <td className="p-3 text-sm">{event.resource.store.province || "N/A"}</td>
                <td className="p-3 text-sm">
                  {formatDateTime(event.resource.type === "training" ? event.resource.store.trainingDate : event.resource.store.launchDate)}
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="text-xs bg-transparent"
                      onClick={() => {
                        setSelectedEvent(event);
                        setEventModalOpen(true);
                      }}
                      aria-label={`View details for ${event.title}`}
                    >
                      Details
                    </Button>
                    <Button
                      variant="outline"
                      className="text-xs bg-transparent"
                      onClick={() => addToCalendar(event)}
                      aria-label={`Set reminder for ${event.title}`}
                    >
                      <Bell className="w-4 h-4 mr-1" aria-hidden="true" />
                      Set Reminder
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 && (
          <p className="text-gray-500 text-center py-4 hidden md:block">
            No {eventType === "all" ? "events" : eventType + " events"} found for {province}.
            {searchTerm && " Clear the search to view all events."}
          </p>
        )}
      </CardContent>
    </Card>
  );
};



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <div className="w-4 h-4 bg-white rounded" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="text-red-500 text-center py-4" role="alert">
        Please log in to view the operations calendar.
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden px-4 sm:px-6 md:px-8" role="main">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 hidden md:block">Operations Calendar</h1>
          <p className="text-gray-600 hidden md:block">Training and launch schedule for assigned stores</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <div className="relative w-full sm:w-64">
            <Input
              placeholder="Search by store name or ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-8"
              aria-label="Search stores by name or ID"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              onClick={() => setViewMode("calendar")}
              className="flex-1 sm:flex-none"
              aria-label="Switch to calendar view"
            >
              <CalendarIcon className="w-4 h-4 mr-2" aria-hidden="true" />
              Calendar
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
              className="flex-1 sm:flex-none"
              aria-label="Switch to list view"
            >
              <List className="w-4 h-4 mr-3" aria-hidden="true" />
              List
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs for Provinces */}
      <Tabs defaultValue="All Provinces" className="space-y-6">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1" role="tablist">
          {provincesWithEvents.map((province) => (
            <TabsTrigger
              key={province}
              value={province}
              className="flex-1 min-w-0 text-xs sm:text-sm"
              role="tab"
              aria-label={`View events for ${province}`}
            >
              {province}
            </TabsTrigger>
          ))}
        </TabsList>

        {provincesWithEvents.map((province) => (
          <TabsContent key={province} value={province} role="tabpanel">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Assigned Stores</CardTitle>
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">
                    {province === "All Provinces"
                      ? stores.length
                      : stores.filter((store) => store.province === province).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Stores in calendar</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Training Events</CardTitle>
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">
                    {getEvents(province, "training").length}
                  </div>
                  <p className="text-xs text-muted-foreground">Training sessions scheduled</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Launch Events</CardTitle>
                  <CalendarIcon className="h-4 h-4 text-muted-foreground" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">
                    {getEvents(province, "launch").length}
                  </div>
                  <p className="text-xs text-muted-foreground">Store launches scheduled</p>
                </CardContent>
              </Card>
            </div>

            {/* Sub-Tabs for All, Training, and Launches */}
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3" role="tablist">
                <TabsTrigger value="all" role="tab" aria-label="View all events">All Events</TabsTrigger>
                <TabsTrigger value="training" role="tab" aria-label="View training events">Training</TabsTrigger>
                <TabsTrigger value="launch" role="tab" aria-label="View launch events">Launch</TabsTrigger>
              </TabsList>

              <TabsContent value="all" role="tabpanel">
                {viewMode === "calendar" ? (
                  <Card>
                    <CardContent className="p-2 sm:p-6">
                      <div className="mb-4 flex justify-center md:hidden">
                        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                          <Button
                            variant={calendarView === "month" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setCalendarView("month")}
                            className="text-xs"
                            aria-label="Switch to month view"
                          >
                            Month
                          </Button>
                          <Button
                            variant={calendarView === "week" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setCalendarView("week")}
                            className="text-xs"
                            aria-label="Switch to week view"
                          >
                            Week
                          </Button>
                          <Button
                            variant={calendarView === "day" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setCalendarView("day")}
                            className="text-xs"
                            aria-label="Switch to day view"
                          >
                            Day
                          </Button>
                        </div>
                      </div>
                      <div className="h-[300px] sm:h-[400px] lg:h-[600px] overflow-x-hidden">
                        <Calendar
                          localizer={localizer}
                          events={getEvents(province, "all")}
                          startAccessor="start"
                          endAccessor="end"
                          view={calendarView}
                          onView={setCalendarView}
                          views={["month", "week", "day"]}
                          eventPropGetter={eventStyleGetter}
                          components={{
                            event: CustomEvent,
                            toolbar: ({ onNavigate, label }) => (
                              <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded" role="toolbar" aria-label="Calendar navigation">
                                <Button variant="outline" size="sm" onClick={() => onNavigate("PREV")} className="p-2" aria-label="Previous period">
                                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                                </Button>
                                <span className="font-medium text-sm sm:text-base" aria-live="polite">{label}</span>
                                <Button variant="outline" size="sm" onClick={() => onNavigate("NEXT")} className="p-2" aria-label="Next period">
                                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                                </Button>
                              </div>
                            ),
                          }}
                          popup
                          showMultiDayTimes
                          step={60}
                          showAllEvents
                          aria-label="Operations calendar"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <ListView province={province} eventType="all" />
                )}
              </TabsContent>

              <TabsContent value="training" role="tabpanel">
                {viewMode === "calendar" ? (
                  <Card>
                    <CardContent className="p-2 sm:p-6">
                      <div className="h-[300px] sm:h-[400px] lg:h-[600px] overflow-x-hidden">
                        <Calendar
                          localizer={localizer}
                          events={getEvents(province, "training")}
                          startAccessor="start"
                          endAccessor="end"
                          view={calendarView}
                          onView={setCalendarView}
                          views={["month", "week", "day"]}
                          eventPropGetter={eventStyleGetter}
                          components={{
                            event: CustomEvent,
                            toolbar: ({ onNavigate, label }) => (
                              <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded" role="toolbar" aria-label="Calendar navigation">
                                <Button variant="outline" size="sm" onClick={() => onNavigate("PREV")} className="p-2" aria-label="Previous period">
                                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                                </Button>
                                <span className="font-medium text-sm sm:text-base" aria-live="polite">{label}</span>
                                <Button variant="outline" size="sm" onClick={() => onNavigate("NEXT")} className="p-2" aria-label="Next period">
                                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                                </Button>
                              </div>
                            ),
                          }}
                          popup
                          showMultiDayTimes
                          step={60}
                          showAllEvents
                          aria-label="Training events calendar"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <ListView province={province} eventType="training" />
                )}
              </TabsContent>

              <TabsContent value="launch" role="tabpanel">
                {viewMode === "calendar" ? (
                  <Card>
                    <CardContent className="p-2 sm:p-6">
                      <div className="h-[300px] sm:h-[400px] lg:h-[600px] overflow-x-hidden">
                        <Calendar
                          localizer={localizer}
                          events={getEvents(province, "launch")}
                          startAccessor="start"
                          endAccessor="end"
                          view={calendarView}
                          onView={setCalendarView}
                          views={["month", "week", "day"]}
                          eventPropGetter={eventStyleGetter}
                          components={{
                            event: CustomEvent,
                            toolbar: ({ onNavigate, label }) => (
                              <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded" role="toolbar" aria-label="Calendar navigation">
                                <Button variant="outline" size="sm" onClick={() => onNavigate("PREV")} className="p-2" aria-label="Previous period">
                                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                                </Button>
                                <span className="font-medium text-sm sm:text-base" aria-live="polite">{label}</span>
                                <Button variant="outline" size="sm" onClick={() => onNavigate("NEXT")} className="p-2" aria-label="Next period">
                                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                                </Button>
                              </div>
                            ),
                          }}
                          popup
                          showMultiDayTimes
                          step={60}
                          showAllEvents
                          aria-label="Launch events calendar"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <ListView province={province} eventType="launch" />
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
        ))}
      </Tabs>

      <OpsCalendarModal
        store={selectedEvent?.resource.store}
        isOpen={eventModalOpen}
        onClose={() => {
          setEventModalOpen(false);
          setSelectedEvent(null);
        }}
      />
    </div>
  );
}
