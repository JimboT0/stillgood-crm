"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useDashboardData } from "@/components/dashboard/dashboard-provider"
import { OpsParent } from "@/components/ops-parent"


export default function RolloutPage() {

  return (
    <DashboardLayout>
      <OpsParent />
    </DashboardLayout>
     
  )
}
