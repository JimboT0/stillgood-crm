"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Minus, Edit, Package, TrendingUp, TrendingDown, Clock, AlertTriangle, Search } from "lucide-react";
import { bagService } from "@/lib/firebase/services/bag";
import { BagAdditionModal } from "@/components/bag-addition-modal";
import { BagRemovalModal } from "@/components/bag-removal-modal";
import { InventoryEditModal } from "@/components/inventory-edit-modal";
import { useDashboardData } from "@/components/dashboard-provider";
import type { BagInventory, BagLog, Province } from "@/lib/firebase/types";
import { PROVINCES } from "@/lib/firebase/types";
import { formatDateTime } from "@/components/utils";

export default function BagsPage() {
  const { currentUser } = useDashboardData();
  const [inventory, setInventory] = useState<BagInventory[]>([]);
  const [logs, setLogs] = useState<BagLog[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<BagInventory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("all");
  const [changeTypeFilter, setChangeTypeFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");

  const isSuperadmin = currentUser?.role === "superadmin";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [inventoryData, logsData] = await Promise.all([bagService.getAllInventory(), bagService.getAllLogs()]);
      console.log("Logs data:", logsData); // Debug: Inspect log.createdAt format
      setInventory(inventoryData);
      setLogs(logsData);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBags = async (province: Province, bagsToAdd: number, source: string, notes?: string) => {
    if (!currentUser) throw new Error("User not authenticated");
    await bagService.addBags(province, bagsToAdd, source, notes || "", currentUser.id, currentUser.name);
    await loadData();
  };

  const handleRemoveBags = async (province: Province, bagsToRemove: number, destination: string, notes?: string) => {
    if (!currentUser) throw new Error("User not authenticated");
    await bagService.removeBags(province, bagsToRemove, destination, notes || "", currentUser.id, currentUser.name);
    await loadData();
  };

  const handleUpdateInventory = async (province: Province, totalBags: number) => {
    if (!currentUser) throw new Error("User not authenticated");
    await bagService.updateInventory(province, totalBags, currentUser.id, currentUser.name);
    await loadData();
  };

  // Calculate stats
  const totalBags = inventory.reduce((sum, inv) => sum + inv.totalBags, 0);
  const totalAdditions = logs
    .filter((log) => log.changeType === "addition")
    .reduce((sum, log) => sum + log.bagsChanged, 0);
  const totalRemovals = logs
    .filter((log) => log.changeType === "removal")
    .reduce((sum, log) => sum + Math.abs(log.bagsChanged), 0);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const recentChanges = logs.filter((log) => {
    let logDate: Date;
    if (typeof log.createdAt === "object" && "seconds" in log.createdAt) {
      logDate = new Date(log.createdAt.seconds * 1000 + log.createdAt.nanoseconds / 1000000);
    } else if (typeof log.createdAt === "string") {
      logDate = new Date(log.createdAt);
    } else if (log.createdAt instanceof Date) {
      logDate = log.createdAt;
    } else {
      return false;
    }
    return logDate >= yesterday;
  }).length;

  const lowStockProvinces = inventory.filter((inv) => inv.totalBags < 100).length;

  // Create stock map for removal modal
  const availableStock = inventory.reduce(
    (acc, inv) => {
      acc[inv.province] = inv.totalBags;
      return acc;
    },
    {} as { [province: string]: number },
  );

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.destination?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (log.source?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      log.removedByName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProvince = provinceFilter === "all" || log.province === provinceFilter;
    const matchesChangeType = changeTypeFilter === "all" || log.changeType === changeTypeFilter;

    // Time filter logic
    let matchesTime = true;
    const now = new Date("2025-08-14T21:15:00+02:00"); // Current date in SAST
    let logDate: Date;

    if (typeof log.createdAt === "object" && "seconds" in log.createdAt) {
      logDate = new Date(log.createdAt.seconds * 1000 + log.createdAt.nanoseconds / 1000000);
    } else if (typeof log.createdAt === "string") {
      logDate = new Date(log.createdAt);
    } else if (log.createdAt instanceof Date) {
      logDate = log.createdAt;
    } else {
      console.error("Invalid log.createdAt:", log.createdAt);
      return false;
    }

    if (timeFilter === "past-month") {
      const pastMonth = new Date(now);
      pastMonth.setDate(now.getDate() - 30);
      matchesTime = logDate >= pastMonth && logDate <= now;
    } else if (timeFilter === "past-week") {
      const pastWeek = new Date(now);
      pastWeek.setDate(now.getDate() - 7);
      matchesTime = logDate >= pastWeek && logDate <= now;
    }

    return matchesSearch && matchesProvince && matchesChangeType && matchesTime;
  });

  // Get provinces to display - for superadmin show all, for others show only provinces with inventory
  const provincesToShow = isSuperadmin
    ? PROVINCES
    : PROVINCES.filter((province) => inventory.some((inv) => inv.province === province && inv.totalBags > 0));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bag Management</h1>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bag Management</h1>
          <p className="text-gray-600">Track and manage bag inventory across provinces</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={() => setIsAddModalOpen(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Bags
          </Button>
          <Button
            onClick={() => setIsRemoveModalOpen(true)}
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <Minus className="w-4 h-4 mr-2" />
            Remove Bags
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bags</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBags.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Additions</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalAdditions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Removals</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalRemovals.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row the items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Changes</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentChanges}</div>
            <p className="text-xs text-gray-500">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space đời-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockProvinces}</div>
            <p className="text-xs text-gray-500">{"< 100 bags"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Inventory */}
      <Card>
        <CardHeader>
          <CardTitle>Current Inventory by Province</CardTitle>
          {!isSuperadmin && <p className="text-sm text-gray-500">Showing only provinces with available inventory</p>}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {provincesToShow.map((province) => {
              const inv = inventory.find((i) => i.province === province);
              const bags = inv?.totalBags || 0;
              const isLowStock = bags < 100;

              // For non-superadmin users, skip provinces with 0 bags
              if (!isSuperadmin && bags === 0) {
                return null;
              }

              return (
                <div key={province} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{province}</h4>
                    <p className={`text-sm ${isLowStock ? "text-yellow-600" : "text-gray-600"}`}>
                      {bags.toLocaleString()} bags
                      {isLowStock && bags > 0 && " (Low Stock)"}
                    </p>
                  </div>
                  {isSuperadmin && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedInventory(
                          inv || {
                            id: "",
                            province,
                            totalBags: 0,
                            lastUpdated: new Date(),
                            updatedBy: "",
                            updatedByName: "",
                          },
                        );
                        setIsEditModalOpen(true);
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Change History */}
      <Card>
        <CardHeader>
          <CardTitle>Change History</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by destination, source, or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={provinceFilter} onValueChange={setProvinceFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by province" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Provinces</SelectItem>
                {provincesToShow.map((province) => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={changeTypeFilter} onValueChange={setChangeTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Changes</SelectItem>
                <SelectItem value="addition">Additions</SelectItem>
                <SelectItem value="removal">Removals</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="past-month">Past Month</SelectItem>
                <SelectItem value="past-week">Past Week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Province</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Bags</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Changed By</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                  <TableCell>{log.province}</TableCell>
                  <TableCell>
                    <Badge
                      variant={log.changeType === "addition" ? "default" : "destructive"}
                      className={log.changeType === "addition" ? "bg-green-100 text-green-800" : ""}
                    >
                      {log.changeType === "addition" ? (
                        <>
                          <TrendingUp className="w-3 h-3 mr-1" /> Addition
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-3 h-3 mr-1" /> Removal
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className={log.changeType === "addition" ? "text-green-600" : "text-red-600"}>
                    {log.changeType === "addition" ? "+" : "-"}
                    {Math.abs(log.bagsChanged).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{log.source || log.destination}</div>
                  </TableCell>
                  <TableCell>{log.removedByName}</TableCell>
                  <TableCell className="max-w-xs truncate">{log.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-gray-500">No changes found matching your filters.</div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <BagAdditionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddBags} />
      <BagRemovalModal
        isOpen={isRemoveModalOpen}
        onClose={() => setIsRemoveModalOpen(false)}
        onRemove={handleRemoveBags}
        availableStock={availableStock}
      />
      <InventoryEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleUpdateInventory}
        inventory={selectedInventory}
      />
    </div>
  );
}
