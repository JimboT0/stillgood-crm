"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useDashboardData } from "@/components/dashboard/dashboard-provider"
import { RolloutTab } from "@/components/rollout/rollout-tab"
import { Store } from "@/lib/firebase/types"
import { Performance } from "@/components/performance"

export default function RolloutPage() {
  const { stores, users, currentUser, handleToggleSetup, handleToggleSocialSetup, handleSetupConfirmation, handleUpdateCredentials } = useDashboardData()

  return (
      <Performance
      stores={stores}
      users={users}
      />
  )
}
