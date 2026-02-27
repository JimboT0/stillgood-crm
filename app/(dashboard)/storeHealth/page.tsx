"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Copy, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { 
  RegionalReportData, 
  RegionalReportRequest, 
  RegionalReportResponse,
  StoreHealthMetrics,
  ProvinceStoreHealth 
} from "@/lib/types/store-health";
import { PROVINCES } from "@/lib/firebase/types"; 
import { StoreHealthChart } from "@/components/store-health/store-health-chart";

const API_BASE_URL = "https://app-sgapi-prod-lx-san-c4hka0c8aeefetfq.southafricanorth-01.azurewebsites.net";

export default function StoreHealthPage() {
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<StoreHealthMetrics | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [healthFilter, setHealthFilter] = useState<string>("all");
  const [loadFilter, setLoadFilter] = useState<string>("all");
  const [collapsedProvinces, setCollapsedProvinces] = useState<Set<string>>(new Set());
  const [storeHealthData, setStoreHealthData] = useState<ProvinceStoreHealth[]>([]);
  const [rawData, setRawData] = useState<RegionalReportData[]>([]);

  // Calculate date range for last 2 weeks
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 14);
    
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  };

  // Fetch data for all provinces
  const fetchStoreHealthData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      const allData: RegionalReportData[] = [];

      // Fetch data for each province (excluding "_")
      const provincesToFetch = PROVINCES.filter(p => p !== "_");
      
      for (const province of provincesToFetch) {
        try {
          const request: RegionalReportRequest = {
            province,
            startDate,
            endDate,
          };

          const response = await fetch(`${API_BASE_URL}/ReportManagement/regional-report`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
          });

          if (response.ok) {
            const result: RegionalReportResponse = await response.json();
            if (result.success && result.data) {
              allData.push(...result.data);
            }
          }
        } catch (error) {
          console.error(`Error fetching data for ${province}:`, error);
        }
      }

      setRawData(allData);
      const processedData = processStoreHealthData(allData);
      setStoreHealthData(processedData);
    } catch (error) {
      console.error("Error fetching store health data:", error);
      toast.error("Failed to fetch store health data");
    } finally {
      setLoading(false);
    }
  };

  // Process raw data into store health metrics
  const processStoreHealthData = (data: RegionalReportData[]): ProvinceStoreHealth[] => {
    // Group by restaurant (store)
    const storeMap = new Map<string, RegionalReportData[]>();
    
    data.forEach(item => {
      const key = item.restaurantId;
      if (!storeMap.has(key)) {
        storeMap.set(key, []);
      }
      storeMap.get(key)!.push(item);
    });

    // Calculate metrics for each store
    const stores: StoreHealthMetrics[] = [];
    
    storeMap.forEach((items, restaurantId) => {
      const firstItem = items[0];
      const totalLoads = items.reduce((sum, item) => sum + item.loadCount, 0);
      const totalSold = items.reduce((sum, item) => sum + item.soldCount, 0);
      const totalRevenue = items.reduce((sum, item) => sum + item.totalRevenue, 0);
      const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);
      
      // Calculate average sell through percentage
      const averageSellThroughPercentage = totalLoads > 0 ? (totalSold / totalLoads) * 100 : 0;
      
      // Calculate load consistency (simplified - based on variance in daily loads)
      // For now, we'll use a simplified metric based on total loads vs expected loads
      const expectedLoads = 14 * items.length; // Assuming daily loads per item type
      const loadConsistency = Math.min(100, (totalLoads / Math.max(expectedLoads, 1)) * 100);
      
      // Calculate health score
      const healthScore = calculateHealthScore(averageSellThroughPercentage, loadConsistency);
      
      stores.push({
        restaurantId,
        restaurantName: firstItem.restaurantName,
        province: firstItem.restaurantProvince,
        totalLoads,
        totalSold,
        totalRevenue,
        totalValue,
        averageSellThroughPercentage,
        loadConsistency,
        healthScore,
        wasteRange: {
          min: totalLoads * 2,
          max: totalLoads * 3,
        },
      });
    });

    // Group by province
    const provinceMap = new Map<string, StoreHealthMetrics[]>();
    stores.forEach(store => {
      if (!provinceMap.has(store.province)) {
        provinceMap.set(store.province, []);
      }
      provinceMap.get(store.province)!.push(store);
    });

    return Array.from(provinceMap.entries()).map(([province, stores]) => ({
      province,
      stores: stores.sort((a, b) => {
        const scoreOrder = { red: 0, orange: 1, yellow: 2, green: 3 };
        return scoreOrder[a.healthScore] - scoreOrder[b.healthScore];
      }),
    }));
  };

  // Calculate health score based on sell-through and consistency
  const calculateHealthScore = (sellThroughPercentage: number, loadConsistency: number): "red" | "orange" | "yellow" | "green" => {
    // Green: High sell-through (>80%) and consistent loads (>80%)
    if (sellThroughPercentage >= 80 && loadConsistency >= 80) return "green";
    
    // Yellow: Good sell-through (>60%) and decent consistency (>60%)
    if (sellThroughPercentage >= 60 && loadConsistency >= 60) return "yellow";
    
    // Orange: Either low sell-through or inconsistent loads
    if (sellThroughPercentage >= 40 || loadConsistency >= 40) return "orange";
    
    // Red: Poor performance on both metrics
    return "red";
  };

  // Copy message for store
  const copyStoreMessage = (store: StoreHealthMetrics) => {
    const message = `${store.restaurantName} had R ${store.totalRevenue} in loads this week. Your waste should be between R${2*store.totalRevenue} and R${3*store.totalRevenue}. If this is not the case, more bags should be available to pack.`;
    navigator.clipboard.writeText(message);
    toast.success("Message copied to clipboard!");
  };

  // Toggle province collapse state
  const toggleProvinceCollapse = (province: string) => {
    setCollapsedProvinces(prev => {
      const newSet = new Set(prev);
      if (newSet.has(province)) {
        newSet.delete(province);
      } else {
        newSet.add(province);
      }
      return newSet;
    });
  };

  // Filter stores based on search and filters
  const filteredData = useMemo(() => {
    return storeHealthData
      .map(provinceData => ({
        ...provinceData,
        stores: provinceData.stores.filter(store => {
          const matchesSearch = store.restaurantName.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesProvince = selectedProvince === "all" || store.province === selectedProvince;
          const matchesHealth = healthFilter === "all" || store.healthScore === healthFilter;
          const matchesLoad = loadFilter === "all" || 
            (loadFilter === "loaded" && store.totalLoads > 0) ||
            (loadFilter === "not-loaded" && store.totalLoads === 0);
          return matchesSearch && matchesProvince && matchesHealth && matchesLoad;
        }),
      }))
      .filter(provinceData => provinceData.stores.length > 0);
  }, [storeHealthData, searchTerm, selectedProvince, healthFilter, loadFilter]);

  const getHealthColor = (score: string): string => {
    switch (score) {
      case "green": return "border-l-green-500 bg-green-500/10";
      case "yellow": return "border-l-yellow-500 bg-yellow-500/10";
      case "orange": return "border-l-orange-500 bg-orange-500/10";
      case "red": return "border-l-red-500 bg-red-500/10";
      default: return "border-l-gray-500 bg-gray-500/10";
    }
  };

  const getHealthBadgeVariant = (score: string) => {
    switch (score) {
      case "green": return "default";
      case "yellow": return "secondary";
      case "orange": return "destructive";
      case "red": return "destructive";
      default: return "outline";
    }
  };

  const getHealthBadgeColor = (score: string) => {
    switch (score) {
      case "green": return "bg-green-500 text-white hover:bg-green-600";
      case "yellow": return "bg-yellow-500 text-black hover:bg-yellow-600";
      case "orange": return "bg-orange-500 text-white hover:bg-orange-600";
      case "red": return "bg-red-500 text-white hover:bg-red-600";
      default: return "bg-gray-500 text-white hover:bg-gray-600";
    }
  };

  useEffect(() => {
    fetchStoreHealthData();
    // Setup auto-refresh every 30 minutes
    const interval = setInterval(fetchStoreHealthData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading store health data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Store Health Dashboard</h1>
          <p className="text-muted-foreground">Monitor store performance over the last 2 weeks</p>
        </div>
        <Button onClick={fetchStoreHealthData} variant="outline">
          <TrendingUp className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedProvince} onValueChange={setSelectedProvince}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Provinces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Provinces</SelectItem>
                {PROVINCES.filter(p => p !== "_").map(province => (
                  <SelectItem key={province} value={province}>{province}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={healthFilter} onValueChange={setHealthFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Health Scores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Health Scores</SelectItem>
                <SelectItem value="green">Green (Excellent)</SelectItem>
                <SelectItem value="yellow">Yellow (Good)</SelectItem>
                <SelectItem value="orange">Orange (Warning)</SelectItem>
                <SelectItem value="red">Red (Critical)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={loadFilter} onValueChange={setLoadFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Load Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                <SelectItem value="loaded">Has Loaded</SelectItem>
                <SelectItem value="not-loaded">Hasn't Loaded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Store Health Grid */}
      <div className="space-y-6">
        {filteredData.map(provinceData => (
          <Card key={provinceData.province}>
            <CardHeader>
              <CardTitle 
                className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 -m-2 p-2 rounded"
                onClick={() => toggleProvinceCollapse(provinceData.province)}
              >
                {collapsedProvinces.has(provinceData.province) ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                <span>{provinceData.province}</span>
                <Badge variant="outline">{provinceData.stores.length} stores</Badge>
              </CardTitle>
            </CardHeader>
            {!collapsedProvinces.has(provinceData.province) && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {provinceData.stores.map(store => (
                  <Card 
                    key={store.restaurantId} 
                    className={`cursor-pointer hover:shadow-md transition-shadow border-l-8 ${getHealthColor(store.healthScore)} bg-gray-900`}
                    onClick={() => setSelectedStore(store)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium text-sm line-clamp-2 text-white">{store.restaurantName}</h3>
                          <Badge className={`ml-2 text-sm px-3 py-1 ${getHealthBadgeColor(store.healthScore)}`}>
                            {store.healthScore.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-xs text-gray-300">
                          <div className="flex justify-between">
                            <span>Loads:</span>
                            <span className="font-medium text-white">{store.totalLoads}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Sold:</span>
                            <span className="font-medium text-white">{store.totalSold}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Sell-through:</span>
                            <span className="font-medium text-white">{store.averageSellThroughPercentage.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Consistency:</span>
                            <span className="font-medium text-white">{store.loadConsistency.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {filteredData.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No stores found matching your filters.</p>
          </CardContent>
        </Card>
      )}

      {/* Store Detail Modal */}
      <Dialog open={!!selectedStore} onOpenChange={() => setSelectedStore(null)}>
        <DialogContent className="!max-w-none w-[50vw] max-h-[85vh] overflow-y-auto" style={{ maxWidth: '50vw' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{selectedStore?.restaurantName}</span>
              <Badge className={`text-sm px-4 py-1 ${getHealthBadgeColor(selectedStore?.healthScore || "")}`}>
                {selectedStore?.healthScore.toUpperCase()}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          {selectedStore && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{selectedStore.totalLoads}</div>
                    <div className="text-sm text-muted-foreground">Total Loads</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{selectedStore.totalSold}</div>
                    <div className="text-sm text-muted-foreground">Total Sold</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{selectedStore.averageSellThroughPercentage.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">Sell Through</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">R{selectedStore.totalRevenue.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Revenue</div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <StoreHealthChart 
                storeData={rawData.filter(d => d.restaurantId === selectedStore.restaurantId)}
                storeName={selectedStore.restaurantName}
              />

              {/* Copy Message */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    Waste Management Message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm mb-4">
                      {selectedStore.restaurantName} had R{selectedStore.totalRevenue.toFixed(2)} in loads this week. 
                      Your waste should be between R{(2 * selectedStore.totalRevenue).toFixed(2)} and R{(3 * selectedStore.totalRevenue).toFixed(2)}. 
                      If this is not the case, more bags should be available to pack.
                    </p>
                    <Button onClick={() => copyStoreMessage(selectedStore)} variant="outline" size="sm">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
