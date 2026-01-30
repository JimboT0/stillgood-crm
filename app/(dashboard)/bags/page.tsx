// "use client";

// import { useState, useEffect } from "react";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Plus, Minus, Edit, Package, TrendingUp, TrendingDown, Clock, AlertTriangle, Search, RefreshCw, Book, ThumbsUp } from "lucide-react";
// import { bagService } from "@/lib/firebase/services/bag";
// import { BagAdditionModal } from "@/components/modals/bag-addition-modal";
// import { BagRemovalModal } from "@/components/modals/bag-removal-modal";
// import { InventoryEditModal } from "@/components/modals/inventory-edit-modal";
// import { useDashboardData } from "@/components/dashboard/dashboard-provider";
// import type { BagInventory, BagLog, province } from "@/lib/firebase/types";
// import { BAG_PROVINCES as PROVINCES } from "@/lib/firebase/types";
// import { formatDateTime } from "@/lib/utils/date-utils";

// export default function BagsPage() {
//   const { currentUser } = useDashboardData();
//   const [inventory, setInventory] = useState<BagInventory[]>([]);
//   const [logs, setLogs] = useState<BagLog[]>([]);
//   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
//   const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [selectedInventory, setSelectedInventory] = useState<BagInventory | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [provinceFilter, setProvinceFilter] = useState("all");
//   const [changeTypeFilter, setChangeTypeFilter] = useState("all");
//   const [timeFilter, setTimeFilter] = useState<string>("all");

//   const isSuperadmin = currentUser?.role === "superadmin";

//   useEffect(() => {
//     loadData();
//   }, []);

//   const loadData = async () => {
//     setIsLoading(true);
//     try {
//       const [inventoryData, logsData] = await Promise.all([bagService.getAllInventory(), bagService.getAllLogs()]);
//       setInventory(inventoryData);
//       setLogs(logsData);
//     } catch (err: any) {
//       setError(err.message || "Failed to load data");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleAddBags = async (province: province, bagsToAdd: number, source: string, notes?: string) => {
//     if (!currentUser) throw new Error("User not authenticated");
//     await bagService.addBags(province, bagsToAdd, source, notes || "", currentUser.id, currentUser.name);
//     await loadData();
//   };

//   const handleRemoveBags = async (province: province, bagsToRemove: number, destination: string, notes?: string) => {
//     if (!currentUser) throw new Error("User not authenticated");
//     await bagService.removeBags(province, bagsToRemove, destination, notes || "", currentUser.id, currentUser.name);
//     await loadData();
//   };

//   const handleUpdateInventory = async (province: province, totalBags: number) => {
//     if (!currentUser) throw new Error("User not authenticated");
//     await bagService.updateInventory(province, totalBags, currentUser.id, currentUser.name);
//     await loadData();
//   };


//   // Calculate stats
//   const totalBags = inventory.reduce((sum, inv) => sum + inv.totalBags, 0);
//   const totalAdditions = logs
//     .filter((log) => log.changeType === "addition")
//     .reduce((sum, log) => sum + log.bagsChanged, 0);
//   const totalRemovals = logs
//     .filter((log) => log.changeType === "removal")
//     .reduce((sum, log) => sum + Math.abs(log.bagsChanged), 0);

//   const yesterday = new Date();
//   yesterday.setDate(yesterday.getDate() - 1);
//   const recentChanges = logs.filter((log) => {
//     const logDate = new Date(log.createdAt);
//     return logDate >= yesterday;
//   }).length;
//   const lowStockProvinces = inventory.filter((inv) => inv.totalBags < 100).length;

//   // Create stock map for removal modal
//   const availableStock = inventory.reduce(
//     (acc, inv) => {
//       acc[inv.province] = inv.totalBags;
//       return acc;
//     },
//     {} as { [province: string]: number },
//   );

//   // Filter logs
//   const filteredLogs = logs.filter((log) => {
//     const matchesSearch =
//       (log.destination?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
//       (log.source?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
//       log.removedByName.toLowerCase().includes(searchTerm.toLowerCase());

//     const matchesProvince =
//       provinceFilter === "all" || log.province === provinceFilter;

//     const matchesChangeType =
//       changeTypeFilter === "all" || log.changeType === changeTypeFilter;

//     const logDate = new Date(log.createdAt);
//     let matchesTime = true;
//     const now = new Date();
//     if (timeFilter === "past-month") {
//       const pastMonth = new Date(now);
//       pastMonth.setDate(now.getDate() - 30);
//       matchesTime = logDate >= pastMonth && logDate <= now;
//     } else if (timeFilter === "past-week") {
//       const pastWeek = new Date(now);
//       pastWeek.setDate(now.getDate() - 7);
//       matchesTime = logDate >= pastWeek && logDate <= now;
//     }

//     return matchesSearch && matchesProvince && matchesChangeType && matchesTime;
//   });

//   // Get provinces to display
//   const provincesToShow = isSuperadmin
//     ? PROVINCES
//     : PROVINCES.filter((province) => inventory.some((inv) => inv.province === province && inv.totalBags > 0));

//   if (isLoading) {
//     return (
//       <div className="space-y-6">
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">Bag Management</h1>
//             <p className="text-gray-600">Loading...</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Bag Management</h1>
//           <p className="text-gray-600">Track and manage bag inventory across provinces</p>
//         </div>
//         <div className="flex flex-col gap-2">
//           {isSuperadmin ? (
//             <>
//               <Button onClick={() => setIsAddModalOpen(true)} className="bg-green-600 hover:bg-green-700">
//                 <Plus className="w-4 h-4 mr-2" />
//                 Add Bags
//               </Button>
//             </>
//           ) : null}
//           <Button
//             onClick={() => setIsRemoveModalOpen(true)}
//             variant="outline"
//             className="border-red-200 text-red-600 hover:bg-red-50"
//           >
//             <Minus className="w-4 h-4 mr-2" />
//             Remove Bags
//           </Button>
//         </div>
//       </div>

//       {error && (
//         <Alert variant={error.includes("Successfully") ? "default" : "destructive"}>
//           <AlertTriangle className="h-4 w-4" />
//           <AlertDescription>{error}</AlertDescription>
//         </Alert>
//       )}

//       {/* <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Total Bags</CardTitle>
//             <Package className="h-4 w-4 text-blue-500" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{totalBags.toLocaleString()}</div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Total Additions</CardTitle>
//             <TrendingUp className="h-4 w-4 text-green-500" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-green-600">{totalAdditions.toLocaleString()}</div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Total Removals</CardTitle>
//             <TrendingDown className="h-4 w-4 text-red-500" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-red-600">{totalRemovals.toLocaleString()}</div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Recent Changes</CardTitle>
//             <Clock className="h-4 w-4 text-orange-500" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">{recentChanges}</div>
//             <p className="text-xs text-gray-500">Last 24 hours</p>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
//             <AlertTriangle className="h-4 w-4 text-red-500" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold text-yellow-600">{lowStockProvinces}</div>
//             <p className="text-xs text-gray-500">{"< 2000 bags"}</p>
//           </CardContent>
//         </Card>
//       </div> */}

//       <Card>
//         <CardHeader>
//           <CardTitle>Current Inventory by Province</CardTitle>
//           {!isSuperadmin && <p className="text-sm text-gray-500">Showing only provinces with available inventory</p>}
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             {provincesToShow.map((province) => {
//               const inv = inventory.find((i) => i.province === province);
//               const bags = inv?.totalBags || 0;


//               const isLowStock = bags < 2000 && bags > 0;
//               const isCriticalStock = bags < 1000 && bags > 0;
//               const isNoStock = bags === 0;

//               if (!isSuperadmin && bags === 0) {
//                 return null;
//               }

//               return (
//                 <div key={province} className={`flex items-center justify-between p-3 border rounded-lg ${isCriticalStock ? "border-red-400 bg-red-50" : isLowStock ? "border-yellow-300 bg-yellow-50" : isNoStock ? "border-grey-300 bg-grey-50" : "border-green-200 bg-green-50"} `}>
                  

//                   <div className="text-sm text-gray-600">
//                     <h4 className="font-medium">{province}</h4>
//                     <p>
//                       {bags} bags
//                     </p>
//                   </div>
//                   <div className="flex flex-row items-center gap-2">
//                     {isCriticalStock
//                       ? <span className="text-red-600"> <AlertTriangle className="h-4 w-4" /></span>
//                       : isLowStock
//                         ? <span className="text-yellow-600"> <Clock className="h-4 w-4" /></span>
//                         : isNoStock ? <span className="text-gray-400"> <Book className="h-4 w-4" /></span>
//                           : <span className="text-green-500"> <ThumbsUp className="h-4 w-4" /></span>
//                     }
//                     {isSuperadmin && (
//                       <Button
//                         size="sm"
//                         variant="outline"
//                         onClick={() => {
//                           setSelectedInventory(
//                             inv || {
//                               id: "",
//                               province,
//                               totalBags: 0,
//                               lastUpdated: new Date(),
//                               updatedBy: "",
//                               updatedByName: "",
//                             },
//                           );
//                           setIsEditModalOpen(true);
//                         }}
//                       >
//                         <Edit className="w-3 h-3" />
//                       </Button>
//                     )}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </CardContent>
//       </Card>

//       <Card>
//         <CardHeader>
//           <CardTitle>Change History</CardTitle>
//           <div className="flex flex-col sm:flex-row gap-4 mt-4">
//             <div className="flex-1">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                 <Input
//                   placeholder="Search by destination, source, or user..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="pl-10"
//                 />
//               </div>
//             </div>
//             <Select value={provinceFilter} onValueChange={setProvinceFilter}>
//               <SelectTrigger className="w-full sm:w-48">
//                 <SelectValue placeholder="Filter by province" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Provinces</SelectItem>
//                 {provincesToShow.map((province) => (
//                   <SelectItem key={province} value={province}>
//                     {province}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//             <Select value={changeTypeFilter} onValueChange={setChangeTypeFilter}>
//               <SelectTrigger className="w-full sm:w-48">
//                 <SelectValue placeholder="Filter by type" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Changes</SelectItem>
//                 <SelectItem value="addition">Additions</SelectItem>
//                 <SelectItem value="removal">Removals</SelectItem>
//               </SelectContent>
//             </Select>
//             <Select value={timeFilter} onValueChange={setTimeFilter}>
//               <SelectTrigger className="w-full sm:w-48">
//                 <SelectValue placeholder="Filter by time" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Time</SelectItem>
//                 <SelectItem value="past-month">Past Month</SelectItem>
//                 <SelectItem value="past-week">Past Week</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//         </CardHeader>
//         <CardContent>
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Date</TableHead>
//                 <TableHead>Province</TableHead>
//                 <TableHead>Type</TableHead>
//                 <TableHead>Bags</TableHead>
//                 <TableHead>Details</TableHead>
//                 <TableHead>Changed By</TableHead>
//                 <TableHead>Notes</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {filteredLogs.map((log) => (
//                 <TableRow key={log.id}>
//                   <TableCell>{formatDateTime(log.createdAt)}</TableCell>
//                   <TableCell>{log.province}</TableCell>
//                   <TableCell>
//                     <Badge
//                       variant={log.changeType === "addition" ? "default" : "destructive"}
//                       className={log.changeType === "addition" ? "bg-green-100 text-green-800" : ""}
//                     >
//                       {log.changeType === "addition" ? (
//                         <>
//                           <TrendingUp className="w-3 h-3 mr-1" /> Addition
//                         </>
//                       ) : (
//                         <>
//                           <TrendingDown className="w-3 h-3 mr-1" /> Removal
//                         </>
//                       )}
//                     </Badge>
//                   </TableCell>
//                   <TableCell className={log.changeType === "addition" ? "text-green-600" : "text-red-600"}>
//                     {log.changeType === "addition" ? "+" : "-"}
//                     {Math.abs(log.bagsChanged).toLocaleString()}
//                   </TableCell>
//                   <TableCell>
//                     <div className="font-medium">{log.source || log.destination}</div>
//                   </TableCell>
//                   <TableCell>{log.removedByName}</TableCell>
//                   <TableCell className="max-w-xs truncate">{log.notes}</TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>

//           {filteredLogs.length === 0 && (
//             <div className="text-center py-8 text-gray-500">No changes found matching your filters.</div>
//           )}
//         </CardContent>
//       </Card>

//       <BagAdditionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddBags} />
//       <BagRemovalModal
//         isOpen={isRemoveModalOpen}
//         onClose={() => setIsRemoveModalOpen(false)}
//         onRemove={handleRemoveBags}
//         availableStock={availableStock}
//       />
//       <InventoryEditModal
//         isOpen={isEditModalOpen}
//         onClose={() => setIsEditModalOpen(false)}
//         onUpdate={handleUpdateInventory}
//         inventory={selectedInventory}
//       />
//     </div>
//   );
// }
"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Download,
  Package,
  Search,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from "lucide-react"
import { BagStockUpdateDTO } from "@/lib/types/updateBagStockDTO"

const MS_PER_DAY = 1000 * 60 * 60 * 24
const BOX_SIZE = 100
const FORECAST_DAYS = 5
const EXPORT_FORECAST_DAYS = 14
const SAFETY_FACTOR = 1.1

function daysSince(dateString: string) {
  const d = new Date(dateString).getTime()
  const now = Date.now()
  if (Number.isNaN(d)) return 1
  return Math.max(1, Math.ceil((now - d) / MS_PER_DAY))
}

function formatNumber(n: number, digits = 0) {
  if (!Number.isFinite(n)) return "∞"
  return n.toLocaleString(undefined, { maximumFractionDigits: digits })
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatDateShort(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function calcUsage(retailer: any, forecastDays: number) {
  const days = daysSince(retailer.stockLoadTime)
  const sold = Number(retailer.totalSoldSinceLoad ?? 0)
  const available = Number(retailer.availableStock ?? 0)

  const avgPerDay = sold / days

  // base forecast (no safety)
  const forecastBagsBase = avgPerDay * forecastDays

  // ✅ safety-adjusted forecast used for "bags needed" everywhere (display + downloads)
  const forecastBags = forecastBagsBase * SAFETY_FACTOR

  const shortageBags = Math.max(0, Math.ceil(forecastBags - available))
  const boxesNeeded = shortageBags > 0 ? Math.ceil(shortageBags / BOX_SIZE) : 0

  const daysUntilEmpty =
    avgPerDay > 0 ? Math.max(0, Math.floor(available / avgPerDay)) : Number.POSITIVE_INFINITY
  const runOutDate = Number.isFinite(daysUntilEmpty) ? addDays(new Date(), daysUntilEmpty) : null

  return {
    daysSinceLoad: days,
    avgPerDay,
    forecastBags, // safety-adjusted
    shortageBags, // safety-adjusted
    boxesNeeded, // safety-adjusted
    daysUntilEmpty,
    runOutDate,
  }
}

function getStockStatus(remaining: number, threshold: number) {
  if (remaining <= threshold * 0.3) return { status: "critical", color: "destructive" as const }
  if (remaining <= threshold) return { status: "low", color: "secondary" as const }
  return { status: "good", color: "default" as const }
}

function csvEscape(value: any) {
  const s = String(value ?? "")
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function downloadCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return

  const headers = Object.keys(rows[0])
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((r) => headers.map((h) => csvEscape(r[h])).join(",")),
  ]

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

function getProvince(retailer: any): string {
  try {
    const raw = retailer?.addressObject
    if (!raw) return "Unknown"
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw
    return obj?.address?.countrySubdivision || "Unknown"
  } catch {
    return "Unknown"
  }
}

function slugify(s: string) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
}

export default function Component() {
  const [retailerData, setRetailerData] = useState<any[]>([])
  const [selectedRetailer, setSelectedRetailer] = useState<any | null>(null)
  const [bagsToAdd, setBagsToAdd] = useState<string>("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [totalStock, setTotalStock] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")

  // collapsed by default
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setIsLoading(true)
    void getStoreBagStock()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getStoreBagStock = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Stock/getstorebagstock`)
    const result = await res.json()

    const items = result?.storeStockItems ?? []
    setRetailerData(items)

    const summary = items.reduce(
      (acc: { total: number; below50: number }, item: any) => {
        acc.total += Number(item.availableStock ?? 0)
        if (Number(item.availableStock ?? 0) < 50) acc.below50 += 1
        return acc
      },
      { total: 0, below50: 0 }
    )

    setTotalStock(summary.total)
    setLowStockCount(summary.below50)
    setIsLoading(false)
  }

  const updateBagStock = async (bagStockUpdate: BagStockUpdateDTO) => {
    const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/StockManagement/updatebagstock`

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bagStockUpdate),
    })

    if (!res.ok) throw new Error("Network response was not ok")

    await getStoreBagStock()
    return res
  }

  const handleAddBags = async () => {
    if (!selectedRetailer) return
    const amount = Number.parseInt(bagsToAdd)
    if (!bagsToAdd || Number.isNaN(amount) || amount <= 0) return

    await updateBagStock({
      quantity: amount,
      restaurantId: selectedRetailer.restaurantId,
      userId: "",
    })

    setBagsToAdd("")
    setIsDialogOpen(false)
    setSelectedRetailer(null)
  }

  const setDialogForBags = (retailerToSet: any) => {
    setSelectedRetailer(retailerToSet)
    setBagsToAdd("")
    setIsDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // overall ranking: highest shortage (2-week) -> lowest
  const rankedRetailers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()

    const filtered = !q
      ? retailerData
      : retailerData.filter((r) => {
          const name = String(r.restaurantName ?? "").toLowerCase()
          const addr = String(r.address ?? "").toLowerCase()
          return name.includes(q) || addr.includes(q)
        })

    return [...filtered].sort((a, b) => {
      const ua = calcUsage(a, EXPORT_FORECAST_DAYS)
      const ub = calcUsage(b, EXPORT_FORECAST_DAYS)

      if (ua.shortageBags !== ub.shortageBags) return ub.shortageBags - ua.shortageBags

      const ra = Number(a.availableStock ?? 0)
      const rb = Number(b.availableStock ?? 0)
      if (ra !== rb) return ra - rb

      return String(a.restaurantName ?? "").localeCompare(String(b.restaurantName ?? ""))
    })
  }, [retailerData, searchQuery])

  const groupedByProvince = useMemo(() => {
    const map = new Map<string, any[]>()
    for (const r of rankedRetailers) {
      const province = getProvince(r)
      if (!map.has(province)) map.set(province, [])
      map.get(province)!.push(r)
    }

    const provinces = Array.from(map.keys()).sort((pa, pb) => {
      const aTop = calcUsage(map.get(pa)![0], EXPORT_FORECAST_DAYS).shortageBags
      const bTop = calcUsage(map.get(pb)![0], EXPORT_FORECAST_DAYS).shortageBags
      if (aTop !== bTop) return bTop - aTop
      return pa.localeCompare(pb)
    })

    return provinces.map((province) => {
      const retailers = map.get(province)!

      const needingStock = retailers
        .map((r) => ({ r, usage14: calcUsage(r, EXPORT_FORECAST_DAYS) }))
        .filter(({ usage14 }) => usage14.shortageBags > 0)

      return { province, retailers, needingStock }
    })
  }, [rankedRetailers])

  // collapsed by default: init each new province to true
  useEffect(() => {
    setCollapsed((prev) => {
      const next = { ...prev }
      groupedByProvince.forEach(({ province }) => {
        if (next[province] === undefined) next[province] = true
      })
      return next
    })
  }, [groupedByProvince])

  const totalStoresNeedingStock = useMemo(() => {
    return groupedByProvince.reduce((acc, g) => acc + g.needingStock.length, 0)
  }, [groupedByProvince])

  const toggleProvince = (province: string) => {
    setCollapsed((prev) => ({ ...prev, [province]: !prev[province] }))
  }

  // ✅ Internal CSV export (unchanged shape) - still per province and still uses safety-adjusted usage14
  const handleExportCsv = () => {
    const groupsNeedingStock = groupedByProvince.filter((g) => g.needingStock.length > 0)
    if (!groupsNeedingStock.length) return

    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, "0")
    const dd = String(today.getDate()).padStart(2, "0")

    groupsNeedingStock.forEach(({ province, needingStock }) => {
      const rows = needingStock.map(({ r, usage14 }) => {
        const boxesText =
          usage14.boxesNeeded === 1
            ? "1 box needs to be delivered"
            : `${usage14.boxesNeeded} boxes need to be delivered`

        return {
          store: r.restaurantName,
          address: r.address,
          availableStock: Number(r.availableStock ?? 0),
          avgPerDay: Number(usage14.avgPerDay.toFixed(2)),
          forecastDays: EXPORT_FORECAST_DAYS,
          forecastBags: Math.ceil(usage14.forecastBags),
          bagsNeeded: usage14.shortageBags,
          boxesNeeded: usage14.boxesNeeded,
          deliveryInstruction: boxesText,
          daysUntilEmpty: Number.isFinite(usage14.daysUntilEmpty) ? usage14.daysUntilEmpty : "",
          estimatedRunOutDate: usage14.runOutDate ? formatDateShort(usage14.runOutDate) : "",
          lastLoadDate: r.stockLoadTime ? formatDate(r.stockLoadTime) : "",
        }
      })

      downloadCsv(`bag-stock-needs-${slugify(province)}-${yyyy}-${mm}-${dd}.csv`, rows)
    })
  }

  // ✅ NEW Delivery CSV export (delivery instructions only)
  const handleExportDeliveryCsv = () => {
    const groupsNeedingStock = groupedByProvince.filter((g) => g.needingStock.length > 0)
    if (!groupsNeedingStock.length) return

    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, "0")
    const dd = String(today.getDate()).padStart(2, "0")

    groupsNeedingStock.forEach(({ province, needingStock }) => {
      const rows = needingStock.map(({ r, usage14 }) => ({
        store: r.restaurantName,
        address: r.address,
        boxesToDeliver: usage14.boxesNeeded,
      }))

      downloadCsv(`delivery-instructions-${slugify(province)}-${yyyy}-${mm}-${dd}.csv`, rows)
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Retailer Dashboard</h1>
              <p className="text-gray-600 mt-1">Monitor bag sales and inventory across all retailers</p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleExportCsv}
                disabled={isLoading || totalStoresNeedingStock === 0}
                title={
                  totalStoresNeedingStock === 0
                    ? "No stores currently need stock"
                    : "Export internal CSVs per province"
                }
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV (Internal)
              </Button>

              <Button
                type="button"
                variant="default"
                onClick={handleExportDeliveryCsv}
                disabled={isLoading || totalStoresNeedingStock === 0}
                title={
                  totalStoresNeedingStock === 0
                    ? "No stores currently need stock"
                    : "Export delivery instruction CSVs per province"
                }
              >
                <Download className="h-4 w-4 mr-2" />
                Export Delivery CSV
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stock Remaining</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStock}</div>
              <p className="text-xs text-muted-foreground">Bags in inventory</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lowStockCount}</div>
              <p className="text-xs text-muted-foreground">Retailers under 50 bags</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Forecast Window</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{FORECAST_DAYS} days</div>
              <p className="text-xs text-muted-foreground">Table forecast window</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stores Needing Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStoresNeedingStock}</div>
              <p className="text-xs text-muted-foreground">
                Short for next {EXPORT_FORECAST_DAYS} days (includes {SAFETY_FACTOR}× safety factor)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search retailers..."
              className="pl-10 max-w-sm"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Provinces are collapsed by default. Summary is always visible and lists ALL stores needing bags + estimated run-out.
          </div>
        </div>

        {/* Retailers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Store bag management</CardTitle>
            <CardDescription>
              Province summary shows ALL stores needing bags (2-week cover). Click the province header to expand/collapse the full list.
              All bag/box needs include a {SAFETY_FACTOR}× safety factor.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Rank</TableHead>
                    <TableHead>Retailer</TableHead>
                    <TableHead>Location</TableHead>

                    <TableHead className="text-center">Sold Since Load</TableHead>
                    <TableHead className="text-center">Stock Remaining</TableHead>
                    <TableHead className="text-center">Last Restock</TableHead>

                    <TableHead className="text-center">Avg / Day</TableHead>
                    <TableHead className="text-center">Bags Needed (Next {FORECAST_DAYS})</TableHead>
                    <TableHead className="text-center">Boxes Needed</TableHead>

                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {groupedByProvince.map(({ province, retailers, needingStock }) => {
                    const isCollapsed = Boolean(collapsed[province])

                    const storesNeedCount = needingStock.length
                    const totalBagsNeeded = needingStock.reduce(
                      (acc, x) => acc + Number(x.usage14.shortageBags ?? 0),
                      0
                    )
                    const totalBoxesNeeded = needingStock.reduce(
                      (acc, x) => acc + Number(x.usage14.boxesNeeded ?? 0),
                      0
                    )

                    return (
                      <Fragment key={province}>
                        {/* Province header row (clickable) */}
                        <TableRow className="cursor-pointer" onClick={() => toggleProvince(province)}>
                          <TableCell colSpan={11} className="bg-gray-100 font-semibold">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {isCollapsed ? (
                                  <ChevronRight className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                                <span>{province}</span>
                              </div>

                              <div className="flex items-center gap-2 text-sm font-medium">
                                {storesNeedCount > 0 ? (
                                  <>
                                    <Badge style={{ backgroundColor: "red" }} className="px-3 py-1">
                                      {storesNeedCount} store{storesNeedCount === 1 ? "" : "s"} need bags
                                    </Badge>
                                    <span className="text-gray-700">
                                      {formatNumber(totalBagsNeeded, 0)} bags • {formatNumber(totalBoxesNeeded, 0)} boxes
                                    </span>
                                  </>
                                ) : (
                                  <Badge style={{ backgroundColor: "green" }} className="px-3 py-1">
                                    No bags needed
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Summary row: ALWAYS visible */}
                        <TableRow>
                          <TableCell colSpan={11} className="bg-white">
                            {storesNeedCount === 0 ? (
                              <div className="text-sm text-muted-foreground">
                                No stores in this province currently need bags for the next {EXPORT_FORECAST_DAYS} days.
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                                  <span>
                                    Stores needing bags (2-week cover, includes {SAFETY_FACTOR}× safety factor):
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {needingStock.map(({ r, usage14 }) => (
                                    <div key={r.restaurantId} className="rounded-lg border p-3">
                                      <div className="font-semibold text-sm">{r.restaurantName}</div>
                                      <div className="text-sm text-muted-foreground mt-1">
                                        Needs{" "}
                                        <span className="font-medium">
                                          {formatNumber(usage14.shortageBags, 0)}
                                        </span>{" "}
                                        bags •{" "}
                                        <span className="font-medium">
                                          {formatNumber(usage14.boxesNeeded, 0)}
                                        </span>{" "}
                                        {usage14.boxesNeeded === 1 ? "box" : "boxes"}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        Runs out:{" "}
                                        <span className="font-medium">
                                          {Number.isFinite(usage14.daysUntilEmpty)
                                            ? usage14.daysUntilEmpty === 0
                                              ? "Today"
                                              : usage14.runOutDate
                                                ? formatDateShort(usage14.runOutDate)
                                                : "—"
                                            : "—"}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>

                        {/* Collapsed details */}
                        {!isCollapsed &&
                          retailers.map((retailer, idx) => {
                            const remaining = Number(retailer.availableStock ?? 0)
                            const threshold = Number(retailer.lowStockThreshold ?? 50)
                            const stockStatus = getStockStatus(remaining, threshold)
                            const usage = calcUsage(retailer, FORECAST_DAYS)

                            return (
                              <TableRow key={retailer.restaurantId}>
                                <TableCell className="text-center font-semibold">{idx + 1}</TableCell>

                                <TableCell className="font-medium">{retailer.restaurantName}</TableCell>
                                <TableCell className="text-muted-foreground">{retailer.address}</TableCell>

                                <TableCell className="text-center">
                                  <span className="font-semibold text-green-600">
                                    {formatNumber(Number(retailer.totalSoldSinceLoad ?? 0), 0)}
                                  </span>
                                  <div className="text-xs text-muted-foreground">
                                    over {usage.daysSinceLoad} day{usage.daysSinceLoad === 1 ? "" : "s"}
                                  </div>
                                </TableCell>

                                <TableCell className="text-center">
                                  <span
                                    className={`font-semibold ${
                                      stockStatus.status === "critical"
                                        ? "text-red-600"
                                        : stockStatus.status === "low"
                                          ? "text-yellow-600"
                                          : "text-gray-900"
                                    }`}
                                  >
                                    {formatNumber(remaining, 0)}
                                  </span>
                                </TableCell>

                                <TableCell className="text-center">
                                  <div className="text-sm">
                                    <div className="font-medium">
                                      {retailer.stockLoadTime ? formatDate(retailer.stockLoadTime) : "—"}
                                    </div>
                                    <div className="text-muted-foreground">
                                      +{formatNumber(Number(retailer.latestQuantity ?? 0), 0)} bags
                                    </div>
                                  </div>
                                </TableCell>

                                <TableCell className="text-center">
                                  <span className="font-semibold">{formatNumber(usage.avgPerDay, 1)}</span>
                                </TableCell>

                                <TableCell className="text-center">
                                  {usage.shortageBags > 0 ? (
                                    <Badge className="px-3 py-1" style={{ backgroundColor: "red" }}>
                                      {formatNumber(usage.shortageBags, 0)}
                                    </Badge>
                                  ) : (
                                    <Badge className="px-3 py-1" style={{ backgroundColor: "green" }}>
                                      0
                                    </Badge>
                                  )}
                                </TableCell>

                                <TableCell className="text-center">
                                  <div className="font-semibold">{usage.boxesNeeded}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {usage.boxesNeeded === 1 ? "1 box" : `${usage.boxesNeeded} boxes`} × {BOX_SIZE}
                                  </div>
                                </TableCell>

                                <TableCell className="text-center">
                                  <Badge
                                    style={{
                                      backgroundColor:
                                        remaining < 10 ? "red" : remaining < 50 ? "orange" : "green",
                                    }}
                                    className="capitalize px-3 py-1"
                                  >
                                    {remaining < 20 ? "Critical" : remaining < 50 ? "Low Stock" : "Good"}
                                  </Badge>
                                </TableCell>

                                <TableCell className="text-center">
                                  <Button size="sm" onClick={() => setDialogForBags(retailer)}>
                                    Add Bags
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                      </Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Dialog for adding bags */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setSelectedRetailer(null)
            setBagsToAdd("")
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Bags to {selectedRetailer?.restaurantName}</DialogTitle>
            <DialogDescription>Current stock: {selectedRetailer?.availableStock} bags</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bags" className="text-right">
                Bags to add
              </Label>
              <Input
                id="bags"
                type="number"
                value={bagsToAdd}
                onChange={(e) => setBagsToAdd(e.target.value)}
                className="col-span-3"
                placeholder="Enter number of bags"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false)
                setSelectedRetailer(null)
                setBagsToAdd("")
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddBags}
              disabled={!bagsToAdd || Number.parseInt(bagsToAdd) <= 0}
            >
              Add Bags
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
