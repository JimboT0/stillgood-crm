"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Store as StoreIcon, Snowflake, Flame, DoorClosed, CheckCircle2, AlertCircle, TrendingUp, DollarSign, Package, Search, Filter } from "lucide-react"
import type { Store, User } from "@/lib/firebase/types"
import { format } from "date-fns"
import { useState, useMemo } from "react"

interface PerformanceProps {
  stores: Store[]
  users: User[]
}

export function Performance({ stores, users }: PerformanceProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"blocks" | "list">("blocks")
  const [open, setOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // === SALESPERSON STATS ===
  const salespersonStats = useMemo(() => {
    return users
      .map((user) => {
        const userStores = stores.filter((store) => store.salespersonId === user.id)

        const cold = userStores.filter((s) => s.status === "cold").length
        const warm = userStores.filter((s) => s.status === "warm").length
        const closedNotRolledOut = userStores.filter((s) => s.status === "closed" && !s.pushedToRollout).length
        const rolledOut = userStores.filter((s) => s.pushedToRollout === true).length
        const total = userStores.length

        // Placeholder performance score (to be replaced with real data)
        const performanceScore = rolledOut * 10 + warm * 3 - closedNotRolledOut * 2

        return {
          user,
          cold,
          warm,
          closedNotRolledOut,
          rolledOut,
          total,
          performanceScore,
          // To be filled by you:
          unresolvedComplaints: 0,
          profit: 0,
          acquisitionCost: 0,
        }
      })
      .filter((stat) => stat.total > 0)
  }, [stores, users])

  // === FILTERED & SEARCHED LIST ===
  const filteredStats = useMemo(() => {
    return salespersonStats
      .filter((stat) => {
        const name = (stat.user.name || stat.user.email || "").toLowerCase()
        const matchesSearch = name.includes(searchTerm.toLowerCase())
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "rolledOut" && stat.rolledOut > 0) ||
          (statusFilter === "active" && (stat.cold > 0 || stat.warm > 0)) ||
          (statusFilter === "closed" && stat.closedNotRolledOut > 0)
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => b.performanceScore - a.performanceScore)
  }, [salespersonStats, searchTerm, statusFilter])

  const topPerformer = filteredStats[0] || null

  const selectedStores = selectedUser
    ? stores.filter((store) => store.salespersonId === selectedUser.id && store.pushedToRollout === true)
    : []

  return (
    <div className="space-y-6 w-full">
      {/* === HEADER: SEARCH + FILTERS + VIEW TOGGLE === */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search salespeople..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Salespeople</SelectItem>
              <SelectItem value="rolledOut">Has Rolled Out</SelectItem>
              <SelectItem value="active">Has Active Leads</SelectItem>
              <SelectItem value="closed">Has Closed (Not Rolled Out)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "blocks" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("blocks")}
          >
            Blocks
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            List
          </Button>
        </div>
      </div>

      {/* === BLOCKS VIEW === */}
      {viewMode === "blocks" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStats.map((stat) => (
            <Card
              key={stat.user.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                setSelectedUser(stat.user)
                setOpen(true)
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">
                    {stat.user.name || stat.user.email}
                  </CardTitle>
                  {topPerformer?.user.id === stat.user.id && (
                    <Badge variant="default" className="bg-green-600">
                      Top
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Snowflake className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Cold</span>
                  </div>
                  <span className="text-lg font-bold">{stat.cold}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Warm</span>
                  </div>
                  <span className="text-lg font-bold">{stat.warm}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DoorClosed className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">Closed</span>
                  </div>
                  <span className="text-lg font-bold">{stat.closedNotRolledOut}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Rolled Out</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">{stat.rolledOut}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span>Performance Score</span>
                  <span className="font-bold">{stat.performanceScore}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* === LIST VIEW === */}
      {viewMode === "list" && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Salesperson</TableHead>
                  <TableHead>Cold</TableHead>
                  <TableHead>Warm</TableHead>
                  <TableHead>Closed</TableHead>
                  <TableHead>Rolled Out</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStats.map((stat) => (
                  <TableRow key={stat.user.id}>
                    <TableCell className="font-medium">
                      {stat.user.name || stat.user.email}
                      {topPerformer?.user.id === stat.user.id && (
                        <Badge variant="default" className="ml-2 bg-green-600 text-xs">
                          Top
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{stat.cold}</TableCell>
                    <TableCell>{stat.warm}</TableCell>
                    <TableCell>{stat.closedNotRolledOut}</TableCell>
                    <TableCell className="font-semibold text-green-600">{stat.rolledOut}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{stat.performanceScore}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedUser(stat.user)
                          setOpen(true)
                        }}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* === MODAL: DETAILED PERFORMANCE PER SALESPERSON === */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedUser?.name || selectedUser?.email}&apos;s Performance Dashboard
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="stores">Rolled Out Stores</TabsTrigger>
              <TabsTrigger value="metrics">Store Metrics</TabsTrigger>
            </TabsList>

            {/* === OVERVIEW TAB === */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Rolled Out</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedStores.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unresolved Complaints</CardTitle>
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {/* Replace with real data */}
                      0
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Acquisition Cost</CardTitle>
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {/* Replace with real data */}
                      R0
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Profit & Waste Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p>Connect sales, waste, and complaints data to see profit insights</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* === ROLLED OUT STORES TAB === */}
            <TabsContent value="stores">
              <div className="space-y-4">
                <div className="text-right font-semibold">
                  Total Rolled Out: {selectedStores.length}
                </div>
                <div className="max-h-96 overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Store Name</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedStores.map((store) => (
                        <TableRow key={store.id}>
                          <TableCell className="font-medium">
                            {store.tradingName || "Unnamed Store"}
                          </TableCell>
                          <TableCell>
                            {store.createdAt ? format(new Date(store.createdAt), "PPp") : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-green-600">
                              Rolled Out
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {selectedStores.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            No rolled out stores yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* === METRICS PER STORE TAB === */}
            <TabsContent value="metrics">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Per-Store Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {selectedStores.length === 0 ? (
                      <p className="text-center text-muted-foreground">No rolled out stores to analyze.</p>
                    ) : (
                      selectedStores.map((store) => (
                        <div key={store.id} className="border rounded-lg p-4 space-y-3">
                          <div className="font-semibold text-lg">
                            {store.tradingName || "Unnamed Store"}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Sales:</span>
                              <span className="ml-2 font-bold">R0</span>
                              {/* Replace with real sales data */}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Complaints:</span>
                              <span className="ml-2 font-bold text-red-600">0</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Waste:</span>
                              <span className="ml-2 font-bold">0kg</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}