"use client"

import { useState, useEffect, JSX } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StoreDetailsModal } from "@/components/modals/store-details-modal"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import type { StoreOpsView, User } from "@/lib/firebase/types"
import { Timestamp } from "firebase/firestore"

interface Event {
  id: string
  title: string
  description?: string
  date: string | Date | Timestamp | { seconds: number }
  province?: string
  createdAt: Date
  updatedAt: Date
}

interface RolloutCalendarProps {
  stores: StoreOpsView[] | null | undefined
  events: Event[] | null | undefined
  users: User[] | null | undefined
  currentUser: User | null
}

export function RolloutCalendar({
  stores: storesProp,
  events: eventsProp,
  users: usersProp,
  currentUser,
}: RolloutCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedStore, setSelectedStore] = useState<StoreOpsView | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [isSubModalOpen, setIsSubModalOpen] = useState(false)
  const [calendarView, setCalendarView] = useState<"month" | "week">("month")

  // Normalize props to empty arrays if undefined/null
  const stores = Array.isArray(storesProp) ? storesProp : []
  const events = Array.isArray(eventsProp) ? eventsProp : []
  const users = Array.isArray(usersProp) ? usersProp : []

  // Log props for debugging
  useEffect(() => {
    console.log("RolloutCalendar props:", { stores, events, users, currentUser })
  }, [stores, events, users, currentUser])

  const normalizeDate = (date: any): string | null => {
    if (date === null || date === undefined) {
      console.warn("Date is null or undefined")
      return null
    }

    let parsedDate: Date
    try {
      if (typeof date === "string") {
        parsedDate = new Date(date)
        if (isNaN(parsedDate.getTime())) {
          if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(date)) {
            const [month, day, year] = date.split("/").map(Number)
            parsedDate = new Date(year, month - 1, day)
          } else if (/^\d{2}-\d{2}-\d{4}$/.test(date)) {
            const [day, month, year] = date.split("-").map(Number)
            parsedDate = new Date(year, month - 1, day)
          } else if (/^\d{1,2}\s+[A-Za-z]+\s+\d{4}$/.test(date)) {
            parsedDate = new Date(date)
          } else {
            console.warn(`Unsupported date string format: ${date}`)
            return null
          }
        }
      } else if (date instanceof Timestamp) {
        parsedDate = date.toDate()
      } else if (typeof date === "object" && "seconds" in date && typeof date.seconds === "number") {
        parsedDate = new Date(date.seconds * 1000)
      } else if (date instanceof Date) {
        parsedDate = date
      } else {
        console.warn(`Invalid date type: ${JSON.stringify(date)}`)
        return null
      }

      if (isNaN(parsedDate.getTime())) {
        console.warn(`Invalid date parsed: ${JSON.stringify(date)}`)
        return null
      }

      return `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, "0")}-${String(parsedDate.getDate()).padStart(2, "0")}`
    } catch (error) {
      console.error(`Error parsing date: ${JSON.stringify(date)}`, error)
      return null
    }
  }

  const getItemsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    const matchingStores = stores.filter((store) => {
      const normalizedTraining = normalizeDate(store.trainingDate)
      const normalizedLaunch = normalizeDate(store.launchDate)
      return normalizedTraining === dateStr || normalizedLaunch === dateStr
    })
    const matchingEvents = events.filter((event) => {
      const normalizedEventDate = normalizeDate(event.date)
      return normalizedEventDate === dateStr
    })
    return { stores: matchingStores, events: matchingEvents }
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getStoresForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    const matchingStores = stores.filter((store) => {
      const normalizedTrainingDate = normalizeDate(store.trainingDate ?? null)
      const normalizedLaunchDate = normalizeDate(store.launchDate ?? null)
      console.log(`Store ${store.tradingName}:`, { trainingDate: store.trainingDate, normalizedTrainingDate, launchDate: store.launchDate, normalizedLaunchDate })
      return normalizedTrainingDate === dateStr || normalizedLaunchDate === dateStr
    })
    return matchingStores
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(direction === "prev" ? prev.getMonth() - 1 : prev.getMonth() + 1)
      return newDate
    })
  }

  const handleDayClick = (day: number) => {
    setSelectedDay(day)
    setIsSubModalOpen(true)
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })

  const days: JSX.Element[] = []

  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-20 md:h-24 border border-gray-200"></div>)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

    const trainingByProvince: Record<string, number> = {}
    const launchByProvince: Record<string, number> = {}
    const customByProvince: Record<string, number> = {}

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
    }

    stores.forEach((store) => {
      const normalizedTrainingDate = normalizeDate(store.trainingDate ?? null)
      const normalizedLaunchDate = normalizeDate(store.launchDate ?? null)
      const provinceFull = store.province || "Unknown"
      const province = provinceMap[provinceFull] || provinceFull
      if (normalizedTrainingDate === dateStr) {
        trainingByProvince[province] = (trainingByProvince[province] || 0) + 1
      }
      if (normalizedLaunchDate === dateStr) {
        launchByProvince[province] = (launchByProvince[province] || 0) + 1
      }
    })

    events.forEach((event) => {
      const normalizedEventDate = normalizeDate(event.date)
      const provinceFull = event.province || "Unknown"
      const province = provinceMap[provinceFull] || provinceFull
      if (normalizedEventDate === dateStr) {
        customByProvince[province] = (customByProvince[province] || 0) + 1
      }
    })

    const hasEvents =
      Object.keys(trainingByProvince).length > 0 ||
      Object.keys(launchByProvince).length > 0 ||
      Object.keys(customByProvince).length > 0

    const totalCount =
      Object.values(trainingByProvince).reduce((a, b) => a + b, 0) +
      Object.values(launchByProvince).reduce((a, b) => a + b, 0) +
      Object.values(customByProvince).reduce((a, b) => a + b, 0)

    const allProvinces = new Set([
      ...Object.keys(trainingByProvince),
      ...Object.keys(launchByProvince),
      ...Object.keys(customByProvince),
    ])

    days.push(
      <div
        key={day}
        className={`h-20 md:h-24 border border-gray-200 p-1 overflow-hidden ${hasEvents ? "cursor-pointer hover:bg-gray-100" : ""}`}
        onClick={() => hasEvents && handleDayClick(day)}
        style={{ overflowY: "auto" }}
      >
        <div className="text-xs md:text-sm font-medium text-gray-900 mb-[2px]">{day}</div>
        {hasEvents && (
          <div className="flex flex-col items-center mt-2">
            <div
              className={`w-7 h-7 flex items-center justify-center rounded-full text-white text-xs font-bold mb-1 ${
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear()
                  ? "bg-green-600"
                  : new Date(currentDate.getFullYear(), currentDate.getMonth(), day) <= new Date()
                  ? "bg-gray-500/50"
                  : "bg-blue-600"
              }`}
            >
              {totalCount}
            </div>
            <div className="text-[10px] text-gray-700 text-center">{[...allProvinces].join(", ")}</div>
          </div>
        )}
      </div>
    )
  }

  const todayStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`
  const todayStores = stores.filter((store) => {
    const normalizedTrainingDate = normalizeDate(store.trainingDate ?? null)
    const normalizedLaunchDate = normalizeDate(store.launchDate ?? null)
    return normalizedTrainingDate === todayStr || normalizedLaunchDate === todayStr
  })
  console.log("Today’s stores:", todayStores.map((store) => store.tradingName))

  return (
    <div className="space-y-4">
      <div className="md:hidden flex justify-center mb-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <Button
            variant={calendarView === "month" ? "default" : "ghost"}
            size="sm"
            onClick={() => setCalendarView("month")}
            className="text-xs"
          >
            Month
          </Button>
          <Button
            variant={calendarView === "week" ? "default" : "ghost"}
            size="sm"
            onClick={() => setCalendarView("week")}
            className="text-xs"
          >
            Week
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Calendar className="w-5 h-5" />
                {monthName}
              </CardTitle>
              <CardDescription className="text-sm">Training and launch schedule</CardDescription>
            </div>
            <div className="flex gap-2 justify-center sm:justify-end">
              <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                <ChevronLeft className="w-4 h-4" />
                <span className="sr-only">Previous month</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                <ChevronRight className="w-4 h-4" />
                <span className="sr-only">Next month</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          <div className="min-w-[320px] grid grid-cols-7 gap-0 border border-gray-200 text-xs sm:text-sm">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="h-8 sm:h-10 border border-gray-200 bg-gray-50 flex items-center justify-center font-medium"
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.charAt(0)}</span>
              </div>
            ))}
            {days}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isSubModalOpen} onOpenChange={setIsSubModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Events for {selectedDay} {monthName}
            </DialogTitle>
          </DialogHeader>
            <div className="space-y-4">
            {selectedDay && (
              <>
              {/* Stores for the selected day */}
              {getStoresForDate(selectedDay).map((store) => {
                const normalizedTrainingDate = normalizeDate(store.trainingDate ?? null)
                const normalizedLaunchDate = normalizeDate(store.launchDate ?? null)
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
                return (
                <div
                  key={`store-${store.id}`}
                  className="p-2 rounded cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                  setSelectedStore(store)
                  setIsSubModalOpen(false)
                  }}
                >
                  <div className="font-medium">{store.tradingName}</div>
                  <div className="flex gap-2 mt-1">
                  {normalizedTrainingDate === dateStr && (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                    Training
                    </Badge>
                  )}
                  {normalizedLaunchDate === dateStr && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    Launch
                    </Badge>
                  )}
                  </div>
                </div>
                )
              })}

              {/* Events for the selected day */}
              {events
                .filter((event) => normalizeDate(event.date) === `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`)
                .map((event) => (
                <div
                  key={`event-${event.id}`}
                  className="p-2 rounded bg-gray-50 border cursor-default"
                >
                  <div className="font-medium">{event.title}</div>
                  {event.description && (
                  <div className="text-xs text-gray-600 mt-1">{event.description}</div>
                  )}
                  <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="bg-purple-50 text-purple-700">
                    Event
                  </Badge>
                  {event.province && (
                    <Badge variant="outline" className="bg-gray-100 text-gray-700">
                    {event.province}
                    </Badge>
                  )}
                  </div>
                </div>
                ))}
              </>
            )}
            </div>
        </DialogContent>
      </Dialog>

      <StoreDetailsModal
        store={selectedStore}
        isOpen={!!selectedStore}
        onClose={() => setSelectedStore(null)}
        users={users}
        currentUser={currentUser}
      />
    </div>
  )
}
