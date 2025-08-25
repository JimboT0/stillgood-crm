"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StoreDetailsModal } from "@/components/modals/store-details-modal"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import type { Store, User } from "@/lib/firebase/types"
import { Timestamp } from "firebase/firestore"

interface RolloutCalendarProps {
  stores: Store[]
  users: User[]
  currentUser: User | null
  onToggleSetup: (storeId: string) => Promise<void>
  onSetupConfirmation: (storeId: string) => Promise<void>
}

export function RolloutCalendar({
  stores,
  users,
  currentUser,
  onToggleSetup,
  onSetupConfirmation,
}: RolloutCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [isSubModalOpen, setIsSubModalOpen] = useState(false)
  const [calendarView, setCalendarView] = useState<"month" | "week">("month")

  // Helper function to normalize dates to YYYY-MM-DD format
  const normalizeDate = (date: Timestamp | string | null): string | null => {
    if (!date) return null
    let parsedDate: Date

    if (date instanceof Timestamp) {
      parsedDate = date.toDate()
    } else if (typeof date === "string") {
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(date)) {
        const [month, day, year] = date.split("/").map(Number)
        parsedDate = new Date(year, month - 1, day)
      } else if (/^\d{1,2}\s+[A-Za-z]+\s+\d{4}$/.test(date)) {
        parsedDate = new Date(date)
      } else {
        console.warn(`Invalid date format: ${date}`)
        return null
      }
    } else {
      console.warn(`Invalid date type: ${date}`)
      return null
    }

    if (isNaN(parsedDate.getTime())) {
      console.warn(`Invalid date parsed: ${date}`)
      return null
    }

    return `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, "0")}-${String(parsedDate.getDate()).padStart(2, "0")}`
  }

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCalendarView("week")
      } else {
        setCalendarView("month")
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getStoresForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return stores.filter((store) => {
      const normalizedTrainingDate = normalizeDate(store.trainingDate)
      const normalizedLaunchDate = normalizeDate(store.launchDate)
      return normalizedTrainingDate === dateStr || normalizedLaunchDate === dateStr
    })
  }


  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
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

  const days = []

  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-20 md:h-24 border border-gray-200"></div>)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

    // Group training and launch events by province
    const trainingByProvince: Record<string, number> = {}
    const launchByProvince: Record<string, number> = {}

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
      const normalizedTrainingDate = normalizeDate(store.trainingDate)
      const normalizedLaunchDate = normalizeDate(store.launchDate)
      const provinceFull = store.province || "Unknown"
      const province = provinceMap[provinceFull] || provinceFull
      if (normalizedTrainingDate === dateStr) {
      trainingByProvince[province] = (trainingByProvince[province] || 0) + 1
      }
      if (normalizedLaunchDate === dateStr) {
      launchByProvince[province] = (launchByProvince[province] || 0) + 1
      }
    })

    const hasEvents = Object.keys(trainingByProvince).length > 0 || Object.keys(launchByProvince).length > 0

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
              className={`w-6 h-6 flex items-center justify-center rounded-full text-white text-xs font-bold mb-1 ${
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear()
                  ? "bg-green-600"
                  : new Date(currentDate.getFullYear(), currentDate.getMonth(), day) <= new Date()
                  ? "bg-orange-500"
                  : "bg-blue-600"
              }`}
            >
              {Object.values(trainingByProvince).reduce((a, b) => a + b, 0) +
                Object.values(launchByProvince).reduce((a, b) => a + b, 0)}
            </div>
            <div className="text-[10px] text-gray-700 text-center">
              {[
                ...new Set([
                  ...Object.keys(trainingByProvince),
                  ...Object.keys(launchByProvince),
                ]),
              ].join(", ")}
            </div>
          </div>
        )}
      </div>
    )
  }

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
            {selectedDay &&
              getStoresForDate(selectedDay).map((store) => {
                const normalizedTrainingDate = normalizeDate(store.trainingDate)
                const normalizedLaunchDate = normalizeDate(store.launchDate)
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
                return (
                  <div
                    key={store.id}
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
          </div>
        </DialogContent>
      </Dialog>

      <StoreDetailsModal
        store={selectedStore}
        isOpen={!!selectedStore}
        onClose={() => setSelectedStore(null)}
        users={users}
        currentUser={currentUser}
        onToggleSetup={onToggleSetup}
        onSetupConfirmation={onSetupConfirmation}
      />
    </div>
  )
}