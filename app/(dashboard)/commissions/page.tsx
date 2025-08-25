"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ExternalLink } from "lucide-react"
import { storeService } from "@/lib/firebase/services/store"
import { formatDateTime } from "@/lib/utils/date-utils"
import type { Store } from "@/lib/firebase/types"
import { Label } from "@/components/ui/label"

interface ProcessedStore extends Store {
  expiryDate: Date | null
  expiryStatus: "expired" | "today" | "active"
  daysRemaining: number
}

function CommissionsPage() {
  const [stores, setStores] = useState<ProcessedStore[]>([])
  const [filteredStores, setFilteredStores] = useState<ProcessedStore[]>([])
  const [filter, setFilter] = useState<"all" | "withCommission">("withCommission")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStores = async () => {
      try {
        setIsLoading(true)
        const storesData = await storeService.getAll()
        const now = new Date()
        const processedStores = storesData.map((store) => {
          let expiryDate: Date | null = null
          let expiryStatus: "expired" | "today" | "active" = "active"
          let daysRemaining: number = 0

          if (store.contractTerms?.months && store.createdAt) {
            const createdAt = new Date(store.createdAt)
            if (isNaN(createdAt.getTime())) {
              console.warn(`[AccountsPage] Invalid createdAt for store ${store.id}`)
              return { ...store, expiryDate: null, expiryStatus: "active" as "expired" | "today" | "active", daysRemaining: 0 }
            }
            expiryDate = new Date(createdAt)
            expiryDate.setMonth(expiryDate.getMonth() + (store.contractTerms.months || 0))
            const diffMs = expiryDate.getTime() - now.getTime()
            daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
            expiryStatus = daysRemaining < 0 ? "expired" : daysRemaining === 0 ? "today" : "active"
          }

          return { ...store, expiryDate, expiryStatus, daysRemaining }
        })

        // Sort stores: those with commissions by expiryDate (latest to earliest), then those without by createdAt (latest to earliest)
        const sortedStores = processedStores.sort((a, b) => {
          if (a.expiryDate && b.expiryDate) {
            return b.expiryDate.getTime() - a.expiryDate.getTime() // Latest expiry first
          } else if (a.expiryDate) {
            return -1 // Stores with expiry come first
          } else if (b.expiryDate) {
            return 1
          } else {
            const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0
            const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0
            return bCreated - aCreated // Latest createdAt first for non-commission stores
          }
        })

        setStores(sortedStores)
        setError(null)
      } catch (error: any) {
        console.error("[AccountsPage] Error loading stores:", error)
        setError("Failed to load store data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    loadStores()
  }, [])

  useEffect(() => {
    // Apply filter based on commission status
    const filtered = filter === "withCommission"
      ? stores.filter(store => store.contractTerms?.months && store.contractTerms.months > 0)
      : stores
    setFilteredStores(filtered)
  }, [stores, filter])

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Accounts Overview</CardTitle>
            <div className="w-48">
              <Label htmlFor="commissionFilter">Filter Stores</Label>
              <Select
                value={filter}
                onValueChange={(value: "all" | "withCommission") => setFilter(value)}
              >
                <SelectTrigger id="commissionFilter">
                  <SelectValue placeholder="Select filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="withCommission">With Commission</SelectItem>
                  <SelectItem value="all">All Stores</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          {isLoading ? (
            <div className="flex justify-center py-4">
              <svg
                className="animate-spin h-8 w-8 text-orange-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            </div>
          ) : filteredStores.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              {filter === "withCommission" ? "No stores with commission periods." : "No stores available."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-6 py-3">Store Name</TableHead>
                    <TableHead className="px-6 py-3">Start Date</TableHead>
                    <TableHead className="px-6 py-3">0 Comm Period</TableHead>
                    <TableHead className="px-6 py-3">Expiry Date</TableHead>
                    <TableHead className="px-6 py-3">Expiry Status</TableHead>
                    <TableHead className="px-6 py-3">Bank Confirmation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStores.map((store) => (
                    <TableRow key={store.id} className="hover:bg-gray-50">
                      <TableCell className="px-6 py-4 font-medium">{store.tradingName}</TableCell>
                      <TableCell className="px-6 py-4">
                        {store.createdAt ? formatDateTime(new Date(store.createdAt)) : "N/A"}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {store.contractTerms?.months
                          ? `${store.contractTerms.months} month${store.contractTerms.months !== 1 ? "s" : ""}`
                          : "None"}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {store.expiryDate ? formatDateTime(store.expiryDate) : "N/A"}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {store.contractTerms?.months ? (
                          <Badge
                            className={
                              store.expiryStatus === "expired"
                                ? "bg-red-100 text-red-800"
                                : store.expiryStatus === "today"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-green-100 text-green-800"
                            }
                          >
                            {store.expiryStatus === "expired"
                              ? `Expired ${Math.abs(store.daysRemaining)} day${Math.abs(store.daysRemaining) !== 1 ? "s" : ""} ago`
                              : store.expiryStatus === "today"
                              ? "Expires today"
                              : `${store.daysRemaining} day${store.daysRemaining !== 1 ? "s" : ""} left`}
                          </Badge>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {store.bankConfirmation && store.bankDocument?.url ? (
                          <a
                            href={store.bankDocument.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            Yes <ExternalLink className="w-4 h-4" />
                          </a>
                        ) : (
                          <span className="text-red-600">No</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default CommissionsPage
