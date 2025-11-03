"use client"

import { useState } from "react"
import { useDashboardData } from "@/components/dashboard/dashboard-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"
import { formatDateTime } from "@/lib/utils/date-utils"
import { LaunchTrainDateCell, ProvinceCell, SalespersonCell, StoreInfoCell } from "@/components/cells"

export default function CompletedPage() {
  const { stores, users, currentUser } = useDashboardData()


  const completedStores = stores.filter((store) => {
    const launchDate =
      store.launchDate instanceof Date
        ? store.launchDate
        : store.launchDate?.seconds !== undefined
        ? new Date(store.launchDate.seconds * 1000)
        : undefined

    return store.pushedToRollout === true && launchDate !== undefined && launchDate < new Date()
  })

  const isSuperAdmin = currentUser?.role === "superadmin"


  return (
    <div className="space-y-6 w-full">

      {/* Completed Stores Table */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Completed Stores</CardTitle>
          <CardDescription>All stores that have completed the onboarding process</CardDescription>
        </CardHeader>
        <CardContent className="w-full overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                {isSuperAdmin ? <TableHead>Creator</TableHead> : null}
                <TableHead>Location</TableHead>
                <TableHead>Setup Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((store, idx) => (
                <TableRow key={store.id ?? `store-row-${idx}`}>
                    <StoreInfoCell
                      tradingName={store.tradingName ?? ""}
                      streetAddress={store.streetAddress ?? ""}
                    />
                  {isSuperAdmin ? (
                      <SalespersonCell
                        isSuperadmin={isSuperAdmin}
                        salespersonId={store.salespersonId ?? ""}
                        users={users}
                      />
                  ) : null}
                    <ProvinceCell province={store.province ?? ""} />
                    <LaunchTrainDateCell
                      launchDate={store.launchDate}
                      trainingDate={store.trainingDate}
                    />
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800 h">
                      <CheckCircle className="w-3 h-7 mr-1" />
                      Completed
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {stores.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No completed stores</h3>
              <p className="text-gray-600">Stores will appear here once they complete the setup process</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
