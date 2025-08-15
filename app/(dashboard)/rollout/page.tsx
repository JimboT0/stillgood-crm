"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { useDashboardData } from "@/components/dashboard-provider"
import { RolloutTab } from "@/components/rollout-tab"

export default function RolloutPage() {
  const { stores, users, currentUser, handleToggleSetup, handleSetupConfirmation } = useDashboardData()

  return (
      <RolloutTab
        stores={stores}
        users={users}
        currentUser={currentUser}
        onToggleSetup={handleToggleSetup}
        onSetupConfirmation={handleSetupConfirmation}
      />
  )
}
