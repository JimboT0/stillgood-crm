"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useDashboardData } from "@/components/dashboard/dashboard-provider"
import { RolloutTab } from "@/components/rollout/rollout-tab"
import { Store } from "@/lib/firebase/types"

export default function RolloutPage() {
  const { stores, users, currentUser, handleToggleSetup, handleToggleSocialSetup, handleSetupConfirmation, handleUpdateCredentials } = useDashboardData()

  return (
      <RolloutTab
      stores={stores}
      users={users}
      currentUser={currentUser}
      onToggleSetup={handleToggleSetup}
      onSetupConfirmation={handleSetupConfirmation}
      onToggleSocialSetup={handleToggleSocialSetup} 
      updateCredentials={handleUpdateCredentials}
      />
  )
}
