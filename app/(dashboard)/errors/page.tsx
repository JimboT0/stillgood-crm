"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { useDashboardData } from "@/components/dashboard-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, Calendar, CheckCircle } from "lucide-react"

export default function ErrorsPage() {
  const { stores, users, handleClearError } = useDashboardData()

  const errorStores = stores.filter((store) => store.hasErrors)

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

  const handleClearErrorClick = (storeId: string, storeName: string) => {
    if (window.confirm(`Are you sure you want to clear the error for "${storeName}"?`)) {
      handleClearError(storeId)
    }
  }

  return (
      <div className="space-y-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Error Management</h2>
            <p className="text-sm text-gray-600">Stores that require attention due to errors</p>
          </div>
        </div>

        {/* Stats Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{errorStores.length}</div>
          </CardContent>
        </Card>

        {/* Error Stores Table */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Stores with Errors</CardTitle>
            <CardDescription>Stores that have been flagged with errors and need attention</CardDescription>
          </CardHeader>
          <CardContent className="w-full overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Store</TableHead>
                  <TableHead>Salesperson</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Error Description</TableHead>
                  <TableHead>Reported By</TableHead>
                  <TableHead>Date Reported</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errorStores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell>
                      <div className="font-medium">{store.tradingName}</div>
                      <div className="text-sm text-gray-500">{store.streetAddress}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
                            {getSalespersonInitials(store.salespersonId)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{getSalespersonName(store.salespersonId)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {store.province}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm text-red-600 break-words">{store.errorDescription}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {store.errorSetBy ? (
                        <span className="text-sm">{getSalespersonName(store.errorSetBy)}</span>
                      ) : (
                        <span className="text-gray-400 text-sm">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {store.errorSetAt ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3 text-red-500" />
                          {store.errorSetAt.toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => handleClearErrorClick(store.id, store.tradingName)}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Clear Error
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {errorStores.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No errors found</h3>
                <p className="text-gray-600">Great! All stores are running smoothly</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  )
}
