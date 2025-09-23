"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RolloutCalendar } from "./rollout-calendar"
import { RolloutList } from "./rollout-list"
import { Button } from "@/components/ui/button"
import { Calendar, List, Menu } from "lucide-react"
import type { Store, User } from "@/lib/firebase/types"

interface RolloutTabProps {
  stores: Store[]
  users: User[]
  currentUser: User | null
  onToggleSetup: (storeId: string) => Promise<void>
  onSetupConfirmation: (storeId: string) => Promise<void>
  onToggleSocialSetup: (storeId: string) => Promise<void>
  updateCredentials: (storeId: string, credentials: Store['credentials']) => Promise<void>

}

import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

const updateCredentials = async (storeId: string, credentials: Store['credentials']) => {
  try {
    const storeRef = doc(db, "stores", storeId);
    await updateDoc(storeRef, { credentials });
  } catch (error) {
    throw new Error("Failed to update credentials");
  }
};

export function RolloutTab({ stores, users, currentUser, onToggleSetup, onSetupConfirmation, onToggleSocialSetup }: RolloutTabProps) {
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")

  const rolloutStores = stores.filter((store) => store.pushedToRollout)

  return (
    <div className="space-y-6 w-full">
      <div className="px-4 md:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="hidden md:block">
            <h2 className="text-xl font-semibold text-gray-900">Rollout Management</h2>
            <p className="text-sm text-gray-600">Track store rollouts and setup progress</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              onClick={() => setViewMode("calendar")}
              className="w-full"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
              className="w-full"
            >
              <List className="w-4 h-4 mr-2" />
              List
            </Button>
          </div>
        </div>
{/* 
        <div className=" grid grid-cols-1 md:grid-cols-4 gap-2 mt-2">
          <Card className="md:block hidden">
            <CardHeader className=" pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total in Rollout</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{rolloutStores.length}</div>
            </CardContent>
          </Card>
          <Card className="md:block hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Setup Complete</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{rolloutStores.filter((s) => s.isSetup).length}</div>
            </CardContent>
          </Card>
          <Card className="md:block hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Confirmed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {rolloutStores.filter((s) => s.setupConfirmed).length}
              </div>
            </CardContent>
          </Card>
          <Card className="md:block hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{rolloutStores.filter((s) => !s.isSetup).length}</div>
            </CardContent>
          </Card>
        </div> */}

        {/* View Content */}
        <div className="mt-6">
          {viewMode === "list" ? (
              <RolloutList
              stores={rolloutStores}
              users={users}
              currentUser={currentUser}
              onToggleSetup={onToggleSetup}
              onSetupConfirmation={onSetupConfirmation}
              onToggleSocialSetup={onToggleSocialSetup}
              updateCredentials={updateCredentials} events={[]}               />
          ) : (
            <RolloutCalendar
              stores={rolloutStores}
              users={users}
              currentUser={currentUser}
              onToggleSetup={onToggleSetup}
              onSetupConfirmation={onSetupConfirmation}
            />
          )}
        </div>
      </div>
    </div>
  )
}
