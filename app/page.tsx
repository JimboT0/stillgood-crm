"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useDashboardData } from "@/components/dashboard/dashboard-provider"
import { OpsCalendar } from "@/components/ops-calendar"
import { RolloutTab } from "@/components/rollout/rollout-tab"

export default function RolloutPage() {
  const { stores, users, currentUser, handleToggleSetup, handleSetupConfirmation } = useDashboardData()

  return (
    <DashboardLayout>
      <OpsCalendar />
    </DashboardLayout>
     
  )
}
