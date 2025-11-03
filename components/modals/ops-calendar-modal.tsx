"use client";

import React, { useState, useEffect, useMemo } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { format, isSameDay, startOfDay } from "date-fns";
import { enUS, is } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarIcon, List, MapPin, Bell, X } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { auth } from "@/lib/firebase/config";
import { storeService } from "@/lib/firebase/services/store";
import { userService } from "@/lib/firebase/services/user";
import type { User, StoreOpsView } from "@/lib/firebase/types";
import {formatDateTime} from "../../lib/utils/date-utils";
import { storeTypes } from "@/lib/firebase/types";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";

interface ContactPerson {
    name: string;
    phone: string;
    email: string;
    designation: string;
    isPrimary: boolean;
}

interface Product {
    name: string;
    description: string;
    retailPrice: number;
    estimatedValue: number;
}

interface CollectionTimes {
    mondayFriday: { from: string; to: string };
    saturday: { from: string; to: string };
    sunday: { from: string; to: string };
    publicHoliday: { from: string; to: string };
}

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

interface StoreEditModalProps {
    store: StoreOpsView | null;
    isOpen: boolean;
    onClose: () => void;
    eventType?: "training" | "launch";
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

};

const SessionsModal: React.FC<{
    events: CalendarEvent[];
    isOpen: boolean;
    onClose: () => void;
    onSelectEvent: (event: CalendarEvent) => void;
}> = ({ events, isOpen, onClose, onSelectEvent }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Sessions list">
            <div className="bg-white rounded-lg w-[95vw] max-w-lg max-h-[80vh] overflow-y-auto p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
                    aria-label="Close modal"
                >
                </button>
                <h2 className="text-xl font-bold mb-4">
                    Sessions on {format(events[0]?.start || new Date(), "dd/MM/yyyy")}
                </h2>
                <div className="space-y-4">
                    {events.length === 0 ? (
                        <p className="text-gray-500">No sessions scheduled for this day.</p>
                    ) : (
                        events.map((event) => (
                            <div
                                key={event.id}
                                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                                onClick={() => onSelectEvent(event)}
                                role="button"
                                aria-label={`View details for ${event.title}`}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">{event.title}</p>
                                        <p className="text-sm text-gray-600">
                                            {formatDateTime(event.start)}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {event.resource.store.streetAddress}, {event.resource.store.province}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge
                                            variant={event.resource.type === "training" ? "default" : "success"}
                                            className={event.resource.type === "training" ? "bg-blue-500" : "bg-green-500"}
                                        >
                                            {event.resource.type === "training" ? "Training" : "Launch"}
                                        </Badge>
                                        <AddToCalendarButton event={{ resource: { store, type } }} className="text-xs" />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="flex justify-end mt-4">
                    <Button
                        variant="outline"
                        className="text-xs"
                        onClick={onClose}
                        aria-label="Close sessions modal"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};

export function OpsCalendarModal({ store, isOpen, onClose, eventType }: StoreEditModalProps) {
    if (!isOpen || !store) return null;

    const contactPersons: ContactPerson[] = (store.contactPersons as ContactPerson[]) || [];
    const products: Product[] = (store.products as Product[]) || [];
    const collectionTimes: CollectionTimes = (store.collectionTimes as CollectionTimes) || {
        mondayFriday: { from: "", to: "" },
        saturday: { from: "", to: "" },
        sunday: { from: "", to: "" },
        publicHoliday: { from: "", to: "" },
    };

    const selectedEventType = eventType || (store.trainingDate ? "training" : "launch");

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogTitle></DialogTitle>
            <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto p-6">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
                    aria-label="Close modal"
                >
                </button>

                <Tabs defaultValue="basic" className="mt-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                        <TabsTrigger value="contacts">Contacts</TabsTrigger>
                        <TabsTrigger value="products">Products</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Store Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium">Store Name</p>
                                        <p className="text-sm text-gray-600">{store.tradingName || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Province</p>
                                        <p className="text-sm text-gray-600">{store.province || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Store Type</p>
                                        <p className="text-sm text-gray-600">
                                            {storeTypes.find((type) => type.value === store.storeType)?.label || "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Store ID</p>
                                        <p className="text-sm text-gray-600">{store.storeId || "N/A"}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Street Address</p>
                                    <p className="text-sm text-gray-600">{store.streetAddress || "N/A"}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex items-center justify-between flex-row">
                                <CardTitle className="text-lg">Important Dates</CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs bg-transparent"
                                    onClick={() => addToCalendar(store, selectedEventType)}
                                    aria-label={`Set reminder for ${selectedEventType} event at ${store.tradingName}`}
                                >
                                    <Bell className="w-3 h-3 mr-1" aria-hidden="true" />
                                    Set Reminder
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium">Training Date & Time</p>
                                        <p className="text-sm text-gray-600">{formatDateTime(store.trainingDate)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Launch Date & Time</p>
                                        <p className="text-sm text-gray-600">{formatDateTime(store.launchDate)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="contacts" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Contact Persons</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {contactPersons.length === 0 && (
                                    <p className="text-gray-500 text-center py-4">No contacts available.</p>
                                )}
                                {contactPersons.map((contact, index) => (
                                    <div key={index} className="border rounded-lg p-4 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm font-medium">Name</p>
                                                <p className="text-sm text-gray-600">{contact.name || "N/A"}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Designation</p>
                                                <p className="text-sm text-gray-600">{contact.designation || "N/A"}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Phone</p>
                                                <p className="text-sm text-gray-600">{contact.phone || "N/A"}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Email</p>
                                                <p className="text-sm text-gray-600">{contact.email || "N/A"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <p className="text-sm font-medium">Primary Contact</p>
                                            <p className="text-sm text-gray-600">{contact.isPrimary ? "Yes" : "No"}</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="products" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Products</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {products.length === 0 && (
                                    <p className="text-gray-500 text-center py-4">No products available.</p>
                                )}
                                {products.map((product, index) => (
                                    <div key={index} className="border rounded-lg p-4 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-sm font-medium">Name</p>
                                                <p className="text-sm text-gray-600">{product.name || "N/A"}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Retail Price (R)</p>
                                                <p className="text-sm text-gray-600">
                                                    {product.retailPrice ? `R${product.retailPrice}` : "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Total Value (R)</p>
                                                <p className="text-sm text-gray-600">
                                                    {product.estimatedValue ? `R${product.estimatedValue}` : "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Description</p>
                                            <p className="text-sm text-gray-600">{product.description || "N/A"}</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Collection Times</CardTitle>


                            </CardHeader>
                            <CardContent className="space-y-4">
                                {Object.entries(collectionTimes).map(([period, times]) => (
                                    <div key={period} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                        <p className="text-sm font-medium capitalize">
                                            {period === "mondayFriday"
                                                ? "Monday - Friday"
                                                : period === "publicHoliday"
                                                    ? "Public Holiday"
                                                    : period.charAt(0).toUpperCase() + period.slice(1)}
                                        </p>
                                        <div>
                                            <p className="text-sm font-medium">From</p>
                                            <p className="text-sm text-gray-600">{times.from || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">To</p>
                                            <p className="text-sm text-gray-600">{times.to || "N/A"}</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

export function OpsCalendar({ stores: initialStores = [] }: OpsCalendarProps) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [stores, setStores] = useState<StoreOpsView[]>(initialStores);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"list" | "date">("list");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [sessionsModalOpen, setSessionsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
      const isSuperadmin = currentUser?.role === "superadmin";

    // Set current user from Firebase auth
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const allUsers = await userService.getAll();
                    let user = allUsers.find((u) => u.email === firebaseUser.email);

                    if (!user) {
                        // const isAdmin = firebaseUser.email?.includes("admin");
                        user = {
                            id: firebaseUser.uid,
                            name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
                            email: firebaseUser.email || "",
                            role: isSuperadmin  ? "superadmin" : "salesperson",
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
            province === "All Provinces" ? true : allProvinces.includes(province)
        );
    }, [stores]);

    const getEvents = (province: string, eventType: "all" | "training" | "launch") => {
        const now = new Date();

        const filteredStores =
            province === "All Provinces" ? stores : stores.filter((store) => store.province === province);

        const searchLower = searchTerm.toLowerCase();
        const searchedStores = searchLower
            ? filteredStores.filter(
                (store) =>
                    (store.tradingName || "").toLowerCase().includes(searchLower) ||
                    (store.storeId || "").toLowerCase().includes(searchLower)
            )
            : filteredStores;

        const calendarEvents: CalendarEvent[] = [];

        searchedStores.forEach((store) => {
            if (eventType === "all" || eventType === "training") {
                if (store.trainingDate) {
                    const trainingDate =
                        store.trainingDate instanceof Timestamp ? store.trainingDate.toDate() : new Date(store.trainingDate);
                    if (isNaN(trainingDate.getTime())) {
                        console.warn(`Invalid training date for store-ops-cal-m: ${store.tradingName || store.storeId}`);
                    } else if (trainingDate >= now) {
                        calendarEvents.push({
                            id: `training-${store.storeId ?? `fallback-${store.tradingName ?? "unknown"}`}`,
                            title: `Training: ${store.tradingName}`,
                            start: trainingDate,
                            end: new Date(trainingDate.getTime() + 2 * 60 * 60 * 1000),
                            resource: { type: "training", store: { ...store, storeId: store.storeId ?? `fallback-${store.tradingName ?? "unknown"}` } },
                        });
                    }
                }
            }

            if (eventType === "all" || eventType === "launch") {
                if (store.launchDate) {
                    const launchDate =
                        store.launchDate instanceof Timestamp ? store.launchDate.toDate() : new Date(store.launchDate);
                    if (isNaN(launchDate.getTime())) {
                        console.warn(`Invalid launch date for store: ${store.tradingName || store.storeId}`);
                    } else if (launchDate >= now) {
                        calendarEvents.push({
                            id: `launch-${store.storeId ?? `fallback-${store.tradingName ?? "unknown"}`}`,
                            title: `Launch: ${store.tradingName}`,
                            start: launchDate,
                            end: new Date(launchDate.getTime() + 4 * 60 * 60 * 1000),
                            resource: { type: "launch", store: { ...store, storeId: store.storeId ?? `fallback-${store.tradingName ?? "unknown"}` } },
                        });
                    }
                }
            }
        });

        return calendarEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
    };

    const getEventsForDate = (province: string, eventType: "all" | "training" | "launch", date: Date | null) => {
        if (!date) return [];
        const events = getEvents(province, eventType);
        return events.filter((event) => isSameDay(startOfDay(event.start), startOfDay(date)));
    };

    const ListView = ({ province, eventType }: { province: string; eventType: "all" | "training" | "launch" }) => {
        const events = getEvents(province, eventType);

        return (
            <Card>
                <CardContent className="p-0">
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
                                                {formatDateTime(
                                                    event.resource.type === "training"
                                                        ? event.resource.store.trainingDate
                                                        : event.resource.store.launchDate
                                                )}
                                            </p>
                                            <p>
                                                <strong>Store Name:</strong> {event.resource.store.tradingName || "N/A"}
                                            </p>
                                            <p>
                                                <strong>Address:</strong>{" "}
                                                {event.resource.store.streetAddress
                                                    ? `${event.resource.store.streetAddress}, ${event.resource.store.province}`
                                                    : "N/A"}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                className="text-xs bg-transparent"
                                                onClick={() => {
                                                    setSelectedEvent(event);
                                                    setSessionsModalOpen(false);
                                                }}
                                                aria-label={`View details for ${event.title}`}
                                            >
                                                Details
                                            </Button>
                                            <AddToCalendarButton
                                                event={event}
                                                className="text-xs bg-transparent"
                                            />
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>

                    <Table className="hidden md:table w-full" role="grid">
                        <TableHeader>
                            <TableRow className="border-b bg-gray-50">
                                <TableHeader className="p-3 text-left text-sm font-medium" scope="col">
                                    Event
                                </TableHeader>
                                <TableHeader className="p-3 text-left text-sm font-medium" scope="col">
                                    Store Name
                                </TableHeader>
                                <TableHeader className="p-3 text-left text-sm font-medium" scope="col">
                                    Address
                                </TableHeader>
                                <TableHeader className="p-3 text-left text-sm font-medium" scope="col">
                                    Province
                                </TableHeader>
                                <TableHeader className="p-3 text-left text-sm font-medium" scope="col">
                                    Date
                                </TableHeader>
                                <TableHeader className="p-3 text-left text-sm font-medium" scope="col">
                                    Actions
                                </TableHeader>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {events.map((event) => (
                                <TableRow key={event.id} className="hover:bg-gray-200 border-b">
                                    <TableCell className="p-3">
                                        <Badge
                                            variant={event.resource.type === "training" ? "default" : "success"}
                                            className={event.resource.type === "training" ? "bg-blue-500" : "bg-green-500"}
                                        >
                                            {event.resource.type === "training" ? "Training" : "Launch"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="p-3 text-sm">{event.resource.store.tradingName || "N/A"}</TableCell>
                                    <TableCell className="p-3 text-sm">
                                        {event.resource.store.streetAddress
                                            ? `${event.resource.store.streetAddress}, ${event.resource.store.province}`
                                            : "N/A"}
                                    </TableCell>
                                    <TableCell className="p-3 text-sm">{event.resource.store.province || "N/A"}</TableCell>
                                    <TableCell className="p-3 text-sm">
                                        {formatDateTime(
                                            event.resource.type === "training"
                                                ? event.resource.store.trainingDate
                                                : event.resource.store.launchDate
                                        )}
                                    </TableCell>
                                    <TableCell className="p-3">
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                className="text-xs bg-transparent"
                                                onClick={() => {
                                                    setSelectedEvent(event);
                                                    setSessionsModalOpen(false);
                                                }}
                                                aria-label={`View details for ${event.title}`}
                                            >
                                                Details
                                            </Button>
                                            <AddToCalendarButton event={{ resource: { store, type } }} className="text-xs" />

                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
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

    const DateView = ({ province, eventType }: { province: string; eventType: "all" | "training" | "launch" }) => {
        return (
            <Card>
                <CardContent className="p-4">
                    <div className="mb-4">
                        <h3 className="text-lg font-medium mb-2">Select a Date</h3>
                        <DatePicker
                            selected={selectedDate}
                            onChange={(date: Date | null) => {
                                setSelectedDate(date);
                                if (date) {
                                    setSessionsModalOpen(true);
                                }
                            }}
                            placeholderText="Select a date to view events"
                            className="w-full p-2 border rounded"
                            dateFormat="dd/MM/yyyy"
                            locale={enUS}
                            aria-label="Select date to view events"
                        />
                    </div>
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
                            variant={viewMode === "date" ? "default" : "outline"}
                            onClick={() => setViewMode("date")}
                            className="flex-1 sm:flex-none"
                            aria-label="Switch to date view"
                        >
                            <CalendarIcon className="w-4 h-4 mr-2" aria-hidden="true" />
                            Date
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

                        <Tabs defaultValue="all" className="space-y-4">
                            <TabsList className="grid w-full grid-cols-3" role="tablist">
                                <TabsTrigger value="all" role="tab" aria-label="View all events">
                                    All Events
                                </TabsTrigger>
                                <TabsTrigger value="training" role="tab" aria-label="View training events">
                                    Training
                                </TabsTrigger>
                                <TabsTrigger value="launch" role="tab" aria-label="View launch events">
                                    Launch
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="all" role="tabpanel">
                                {viewMode === "date" ? (
                                    <DateView province={province} eventType="all" />
                                ) : (
                                    <ListView province={province} eventType="all" />
                                )}
                            </TabsContent>

                            <TabsContent value="training" role="tabpanel">
                                {viewMode === "date" ? (
                                    <DateView province={province} eventType="training" />
                                ) : (
                                    <ListView province={province} eventType="training" />
                                )}
                            </TabsContent>

                            <TabsContent value="launch" role="tabpanel">
                                {viewMode === "date" ? (
                                    <DateView province={province} eventType="launch" />
                                ) : (
                                    <ListView province={province} eventType="launch" />
                                )}
                            </TabsContent>
                        </Tabs>
                    </TabsContent>
                ))}
            </Tabs>

            <SessionsModal
                events={selectedDate ? getEventsForDate(provincesWithEvents.find((p) => p === document.querySelector('[role="tabpanel"] [role="tab"][aria-selected="true"]')?.textContent || "All Provinces"), document.querySelector('[role="tabpanel"] [role="tab"][aria-selected="true"]')?.value as "all" | "training" | "launch" || "all", selectedDate) : []}
                isOpen={sessionsModalOpen}
                onClose={() => {
                    setSessionsModalOpen(false);
                    setSelectedDate(null);
                }}
                onSelectEvent={(event) => {
                    setSelectedEvent(event);
                    setSessionsModalOpen(false);
                }}
            />
            <OpsCalendarModal
                store={selectedEvent?.resource.store}
                isOpen={!!selectedEvent}
                onClose={() => {
                    setSelectedEvent(null);
                }}
                eventType={selectedEvent?.resource.type}
            />
        </div>
    );
}
