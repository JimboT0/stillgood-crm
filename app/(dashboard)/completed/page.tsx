"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useDashboardData } from "@/components/dashboard/dashboard-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"
import { formatDateTime } from "@/components/utils/date-utils"
import { LaunchTrainDateCell, ProvinceCell, SalespersonCell } from "@/components/cells"
import StoreFilters from "@/components/filters/store-filter"

export default function CompletedPage() {
  const { stores, users, currentUser } = useDashboardData()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProvince, setSelectedProvince] = useState("all")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })

  const completedStores = stores.filter((store) => store.isSetup && store.setupConfirmed)

  const isSuperAdmin = currentUser?.role === "superadmin"

  // Filter stores based on search, province, and date range
  const filteredStores = completedStores.filter((store) => {
    const matchesSearch = store.tradingName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProvince = selectedProvince === "all" || store.province === selectedProvince
    const storeDate = store.launchDate instanceof Date ? store.launchDate : new Date(store.launchDate?.seconds * 1000)
    const matchesDate =
      !dateRange.from ||
      !dateRange.to ||
      (storeDate >= dateRange.from && storeDate <= dateRange.to)
    return matchesSearch && matchesProvince && matchesDate
  })

  return (
    <div className="space-y-6 w-full">
      <StoreFilters
        stores={stores}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedProvince={selectedProvince}
        setSelectedProvince={setSelectedProvince}
        dateRange={dateRange}
        setDateRange={setDateRange}
      />

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
                <TableHead></TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Setup Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell>
                    <div className="font-medium">{store.tradingName}</div>
                    <div className="text-sm text-gray-500">{store.streetAddress}</div>
                  </TableCell>
                  <SalespersonCell
                    isSuperadmin={isSuperAdmin}
                    salespersonId={store.salespersonId}
                    users={users}
                  />
                  <ProvinceCell province={store.province} />
                  <LaunchTrainDateCell
                    launchDate={store.launchDate}
                    trainingDate={store.trainingDate}
                    formatDateTime={formatDateTime}
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

          {filteredStores.length === 0 && (
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
