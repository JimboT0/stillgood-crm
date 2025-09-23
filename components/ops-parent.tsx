"use client"

import { useState, useEffect, useMemo } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarIcon, List, Plus } from "lucide-react"
import { storeService } from "@/lib/firebase/services/store"
import { userService } from "@/lib/firebase/services/user"
import { eventService } from "@/lib/firebase/services/event"
import { auth } from "@/lib/firebase/config"
import type { User, StoreOpsView, Event } from "@/lib/firebase/types"
import { OpsList } from "./ops-list"
import { RolloutCalendar } from "@/components/rollout/rollout-calendar"
import { StoreDetailsModal } from "./modals/store-details-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Timestamp } from "firebase/firestore"
import { Description } from "@radix-ui/react-toast"
import {province} from "@/lib/firebase/types"

interface OpsParentProps {
  stores?: StoreOpsView[]
  events?: Event[]
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
]

export function OpsParent({ stores: initialStores = [], events: initialEvents = [] }: OpsParentProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [stores, setStores] = useState<StoreOpsView[]>(initialStores)
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const [selectedStore, setSelectedStore] = useState<StoreOpsView | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [provinceFilter, setProvinceFilter] = useState("All Provinces")
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false)
  const [newEvent, setNewEvent] = useState<{
    name: string
    description: string
    province: province
    eventDate: string
  }>({
    name: "",
    description: "",
    province: "",
    eventDate: "",
  })
  const isSuperadmin = currentUser?.role === "superadmin";

  // Handle authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const allUsers = await userService.getAll()
          let user = allUsers.find((u) => u.email === firebaseUser.email)

          if (!user) {
            user = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
              email: firebaseUser.email || "",
              role: isSuperadmin ? "superadmin" : "salesperson",
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          }

          setCurrentUser(user)
        } catch (error) {
          console.error("Error loading user:", error)
          setCurrentUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || "User",
            email: firebaseUser.email || "",
            role: isSuperadmin ? "superadmin" : "salesperson",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        }
      } else {
        setCurrentUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  // Fetch store and event data
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return
      setLoading(true)
      try {
        console.log("[OpsParent] Loading data for user:", currentUser.email)
        const storesData = await storeService.getAll()
        const eventsData = await eventService.getAll()
        console.log(
          "[OpsParent] Loaded stores:",
          storesData.map((s) => ({
            id: s.id,
            tradingName: s.tradingName,
            trainingDate: JSON.stringify(s.trainingDate),
            launchDate: JSON.stringify(s.launchDate),
          }))
        )
        console.log(
          "[OpsParent] Loaded events:",
          eventsData.map((e) => ({
            id: e.id,
            title: e.title,
            description: e.description,
            province: e.province,
            date: JSON.stringify(e.date),
          }))
        )
        setStores(storesData)
        setEvents(eventsData)
      } catch (error) {
        console.error("[OpsParent] Error loading data:", error)
        setStores([])
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [currentUser])

  // Filter stores based on status and province
  const filteredStores = useMemo(() => {
    let filtered = stores.filter(
      (store) => store.status === "rollout" || store.status === "completed" || store.status === "closed"
    )

    if (provinceFilter !== "All Provinces") {
      filtered = filtered.filter((store) => store.province === provinceFilter)
    }

    return filtered
  }, [stores, provinceFilter])

  // Filter events based on province
  const filteredEvents = useMemo(() => {
    if (provinceFilter === "All Provinces") return events
    return events.filter((event) => event.province === provinceFilter)
  }, [events, provinceFilter])

  // Compute provinces with events (stores or custom events)
  const provincesWithEvents = useMemo(() => {
    const provincesSet = new Set<string>(["All Provinces"])
    stores.forEach((store) => {
      if (store.trainingDate || store.launchDate) {
        provincesSet.add(store.province)
      }
    })
    events.forEach((event) => {
      provincesSet.add(event.province ?? "")
    })
    return Array.from(provincesSet).filter((province) =>
      province === "All Provinces" ? true : allProvinces.includes(province)
    )
  }, [stores, events])

  // Handle event creation
  const handleCreateEvent = async () => {
    if (!currentUser || currentUser.role !== "superadmin") return
    try {
      const eventDate = new Date(newEvent.eventDate)
      if (isNaN(eventDate.getTime())) {
        console.error("Invalid event date")
        return
      }

      const newCustomEvent: Event = {
        id: `event_${Date.now()}`,
        title: newEvent.name,
        description: newEvent.description,
        province: newEvent.province,
        date: Timestamp.fromDate(eventDate),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await eventService.create(newCustomEvent)
      setEvents((prev) => [...prev, newCustomEvent])
      setIsCreateEventModalOpen(false)
      setNewEvent({ name: "", description: "", province: "", eventDate: "" })
    } catch (error) {
      console.error("Error creating event:", error)
    }
  }

  // Placeholder functions for actions
  const handleToggleSetup = async (storeId: string) => {
    console.log(`[OpsParent] Toggling setup for store ${storeId}`)
  }

  const handleSetupConfirmation = async (storeId: string) => {
    console.log(`[OpsParent] Confirming setup for store ${storeId}`)
  }

  const handleUpdateCredentials = async (storeId: string, credentials: StoreOpsView['credentials']) => {
    console.log(`[OpsParent] Updating credentials for store ${storeId}`)
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <div className="w-4 h-4 bg-white rounded" />
          </div>
          <p className="text-gray-600">Loading operations data...</p>
        </div>
      </div>
    )
  }

  // Authentication check
  if (!currentUser) {
    return (
      <div className="text-red-500 text-center py-4" role="alert">
        Please log in to view the operations data.
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden px-1 sm:px-3 md:px-8" role="main">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 hidden md:block">Operations Dashboard</h1>
          <p className="text-gray-600 hidden md:block">Manage store training, launch schedules, and custom events</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <select
            value={provinceFilter}
            onChange={(e) => setProvinceFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {provincesWithEvents.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>

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
              <List className="w-4 h-4 mr-2" aria-hidden="true" />
              List
            </Button>
            {currentUser.role === "superadmin" && (
              <Button
                variant="outline"
                onClick={() => setIsCreateEventModalOpen(true)}
                className="flex-1 sm:flex-none"
                aria-label="Create new event"
              >
                <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                New Event
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* View Content */}
      <div className="mt-6">
        {viewMode === "list" ? (
          <OpsList
            stores={filteredStores}
            events={filteredEvents}
            users={[]}
            currentUser={currentUser}
            selectedStore={selectedStore}
            setSelectedStore={setSelectedStore}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onToggleSetup={handleToggleSetup}
            onSetupConfirmation={handleSetupConfirmation}
            updateCredentials={handleUpdateCredentials}
          />
        ) : (
          <RolloutCalendar
            stores={filteredStores}
            events={filteredEvents}
            users={[]}
            currentUser={currentUser}
          />
        )}
      </div>

      <StoreDetailsModal
        store={selectedStore}
        isOpen={!!selectedStore}
        onClose={() => setSelectedStore(null)}
        currentUser={currentUser}
        users={[]}
        onToggleSetup={handleToggleSetup}
        onSetupConfirmation={handleSetupConfirmation}
      />

      {/* Create Event Modal */}
      <Dialog open={isCreateEventModalOpen} onOpenChange={setIsCreateEventModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Event Name</Label>
              <Input
                id="name"
                value={newEvent.name}
                onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                placeholder="Enter event name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Enter event description"
              />
            </div>
            <div>
              <Label htmlFor="province">Province</Label>
              <select
                id="province"
                value={newEvent.province}
                onChange={(e) => setNewEvent({ ...newEvent, province: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                {allProvinces.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="eventDate">Event Date</Label>
              <Input
                id="eventDate"
                type="datetime-local"
                value={newEvent.eventDate}
                onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateEventModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateEvent} disabled={!newEvent.name || !newEvent.eventDate}>
              Create Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}