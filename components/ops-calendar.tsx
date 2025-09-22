"use client"

import { useState, useEffect, useMemo } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CalendarIcon, List, X } from "lucide-react"
import { storeService } from "@/lib/firebase/services/store"
import { userService } from "@/lib/firebase/services/user"
import { auth } from "@/lib/firebase/config"
import type { User, Store } from "@/lib/firebase/types"
import { OpsCalendarModal } from "./modals/ops-calendar-modal"
import { RolloutCalendar } from "@/components/rollout/rollout-calendar"
import { OpsList } from "./ops-list"
import { StoreDetailsModal } from "./modals/store-details-modal"

interface OpsCalendarProps {
  stores?: Store[]
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

export function OpsCalendar({
   stores: initialStores = [] }: OpsCalendarProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [stores, setStores] = useState<Store[]>(initialStores)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [provinceFilter, setProvinceFilter] = useState("All Provinces")
  
useEffect(() => {
  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const storesData = await storeService.getAll();
      console.log("Fetched stores:", storesData.map(s => ({
        id: s.id,
        tradingName: s.tradingName,
        trainingDate: JSON.stringify(s.trainingDate),
        launchDate: JSON.stringify(s.launchDate),
      })));
      setStores(storesData);
    } catch (error) {
      console.error("Error loading stores:", error);
      setStores([]);
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, [currentUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const allUsers = await userService.getAll()
          let user = allUsers.find((u) => u.email === firebaseUser.email)

          if (!user) {
            const isAdmin = firebaseUser.email?.includes("admin")
            user = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
              email: firebaseUser.email || "",
              role: isAdmin ? "superadmin" : "salesperson",
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
            role: firebaseUser.email?.includes("admin") ? "superadmin" : "salesperson",
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

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return

      setLoading(true)
      try {
        console.log("[v0] Loading OpsCalendar data for user:", currentUser.email)
        const storesData = await storeService.getAll()
        console.log("[v0] Loaded stores data:", storesData.length, "stores")
        setStores(storesData)
      } catch (error) {
        console.error("[v0] Error loading stores:", error)
        setStores([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [currentUser])

  const filteredStores = useMemo(() => {
    let filtered = stores

    filtered = filtered.filter((store) =>  store.status === "rollout" || store.status === "completed" || store.status === "closed");

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (store) =>
          (store.tradingName || "").toLowerCase().includes(searchLower) ||
          (store.storeId || "").toLowerCase().includes(searchLower),
      )
    }

    if (provinceFilter !== "All Provinces") {
      filtered = filtered.filter((store) => store.province === provinceFilter)
    }

    return filtered
  }, [stores, searchTerm, provinceFilter])

  const provincesWithEvents = useMemo(() => {
    const provincesSet = new Set<string>(["All Provinces"])
    stores.forEach((store) => {
      if (store.trainingDate || store.launchDate) {
        provincesSet.add(store.province)
      }
    })
    return Array.from(provincesSet).filter((province) =>
      province === "All Provinces" ? true : allProvinces.includes(province),
    )
  }, [stores])

  // const convertToRolloutStores = (opsStores: StoreOpsView[]) => {
  //   return opsStores.map((store) => ({
  //     ...store,
  //     // pushedToRollout: true,
  //     // setupConfirmed: store.setupConfirmed || false,
  //   }))
  // }

  // const rolloutCompatibleStores = convertToRolloutStores(filteredStores)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <div className="w-4 h-4 bg-white rounded" />
          </div>
          <p className="text-gray-600">Loading operations calendar...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="text-red-500 text-center py-4" role="alert">
        Please log in to view the operations calendar.
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden px-1 sm:px-3 md:px-8" role="main">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 hidden md:block">Operations Calendar</h1>
          <p className="text-gray-600 hidden md:block">Training and launch schedule for all stores</p>
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
          </div>
        </div>
      </div>


      {/* View Content */}
      <div className="mt-6">
        {viewMode === "list" ? (
          <OpsList stores={filteredStores} selectedStore={selectedStore} setSelectedStore={setSelectedStore} users={[]}
            currentUser={null}
            onToggleSetup={async () => { }}
            onSetupConfirmation={async () => { }} searchTerm={""} setSearchTerm={function (term: string): void { }}
            updateCredentials={async (storeId: string, credentials: Store['credentials']) => { }} />
        ) : (
          <RolloutCalendar
            stores={filteredStores}
            users={[]}
            currentUser={null}
            onToggleSetup={async () => { }}
            onSetupConfirmation={async () => { }}
          />
        )}
      </div>

      <StoreDetailsModal
        store={selectedStore}
        isOpen={!!selectedStore}
        onClose={() => setSelectedStore(null)}
        currentUser={currentUser} 
        users={[]} 
        onToggleSetup={function (storeId: string): Promise<void> {
          throw new Error("Function not implemented.")
        } } 
        onSetupConfirmation={function (storeId: string): Promise<void> {
          throw new Error("Function not implemented.")
        } }      />    
      </div>
  )
}
