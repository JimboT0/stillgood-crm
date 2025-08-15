"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { useDashboardData } from "@/components/dashboard-provider"
import { OpsCalendar } from "@/components/ops-calendar"
import { RolloutTab } from "@/components/rollout-tab"

export default function RolloutPage() {
  const { stores, users, currentUser, handleToggleSetup, handleSetupConfirmation } = useDashboardData()

  return (
    <DashboardLayout>
      <OpsCalendar />
    </DashboardLayout>
     
  )
}
