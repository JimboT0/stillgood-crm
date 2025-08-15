"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { useDashboardData } from "@/components/dashboard-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CheckCircle, MapPin, Calendar } from "lucide-react"
import { Timestamp } from "firebase/firestore"
import { formatDateTime } from "@/components/utils"

export default function CompletedPage() {
  const { stores, users, currentUser } = useDashboardData()

  const completedStores = stores.filter((store) => store.isSetup && store.setupConfirmed)
  const isSuperAdmin = currentUser?.role === "superadmin"

  const getSalespersonName = (salespersonId: string) => {
    const salesperson = users.find((user) => user.id === salespersonId)
    return salesperson?.name || "Unknown"
  }

  const getSalespersonInitials = (salespersonId: string) => {
    const salesperson = users.find((user) => user.id === salespersonId)
    return (
      salesperson?.name
        .split(" ")
        .map((n) => n[0])
        .join("") || "?"
    )
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Completed Stores</h2>
          <p className="text-sm text-gray-600">Stores that have been successfully set up and confirmed</p>
        </div>
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Total Completed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{completedStores.length}</div>
        </CardContent>
      </Card>

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
                <TableHead>Salesperson</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Setup Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedStores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell>
                    <div className="font-medium">{store.tradingName}</div>
                    <div className="text-sm text-gray-500">{store.streetAddress}</div>
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
                            {getSalespersonInitials(store.salespersonId)}
                          </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{getSalespersonName(store.salespersonId)}</span>
                    </div>
                  </TableCell>)}
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {store.province}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="w-3 h-3 text-blue-500" />
                      {formatDateTime(store.trainingDate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {completedStores.length === 0 && (
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
