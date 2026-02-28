"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Copy, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, Loader2, ChevronDown, ChevronRight, Star, Plus, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { 
  RegionalReportData, 
  RegionalReportRequest, 
  RegionalReportResponse,
  StoreHealthMetrics,
  ProvinceStoreHealth 
} from "@/lib/types/store-health";
import { PROVINCES } from "@/lib/firebase/types"; 
import { StoreHealthChart } from "@/components/store-health/store-health-chart";
import { useDashboardData } from "@/components/dashboard/dashboard-provider";
import { 
  addStoreNote as saveStoreNote,
  getStoreNotes,
  addFeedbackToNote,
  updateStoreNoteRating,
  StoreNote,
  StoreFeedback
} from "@/lib/firebase/store-notes";

const API_BASE_URL = "https://app-sgapi-prod-lx-san-c4hka0c8aeefetfq.southafricanorth-01.azurewebsites.net";

export default function StoreHealthPage() {
  const { currentUser } = useDashboardData();
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<StoreHealthMetrics | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [healthFilter, setHealthFilter] = useState<string>("all");
  const [loadFilter, setLoadFilter] = useState<string>("all");
  const [revenueFilter, setRevenueFilter] = useState<string>("all");
  const [collapsedProvinces, setCollapsedProvinces] = useState<Set<string>>(new Set());
  const [storeHealthData, setStoreHealthData] = useState<ProvinceStoreHealth[]>([]);
  const [rawData, setRawData] = useState<RegionalReportData[]>([]);
  
  // Notes state
  const [storeNotes, setStoreNotes] = useState<Map<string, StoreNote[]>>(new Map());
  const [newNote, setNewNote] = useState("");
  const [newRating, setNewRating] = useState(3);
  const [feedbackText, setFeedbackText] = useState<Map<string, string>>(new Map());
  const [editingRating, setEditingRating] = useState<string | null>(null);
  const [loadingNotes, setLoadingNotes] = useState<Set<string>>(new Set());

  // Calculate date range for last 30 days (for comparison analysis)
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  };

  // Split data into comparison periods
  const splitDataIntoPeriods = (data: RegionalReportData[]) => {
    const now = new Date();
    const recentStart = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000)); // Last 14 days
    const olderStart = new Date(now.getTime() - (28 * 24 * 60 * 60 * 1000)); // Days 15-28 ago
    const olderEnd = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000)); // 14 days ago

    // Note: Assuming data contains a timestamp field - if not, we'll filter by data structure
    const recentData = data; // Most recent 2 weeks (assuming the API already filters by date)
    const olderData = data; // For now, we'll use the same data and split in processing
    
    return { recentData, olderData, recentStart, olderStart, olderEnd };
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

  // Process raw data into store health metrics with period comparison
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

    // Calculate average revenue per load across all stores for benchmarking
    const allItems = Array.from(storeMap.values()).flat();
    const totalRevenue = allItems.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalLoads = allItems.reduce((sum, item) => sum + item.loadCount, 0);
    const averageRevenuePerLoad = totalLoads > 0 ? totalRevenue / totalLoads : 0;

    // Calculate metrics for each store with comprehensive health analysis
    const stores: StoreHealthMetrics[] = [];
    
    storeMap.forEach((items, restaurantId) => {
      const firstItem = items[0];
      
      // Split data for period comparison
      const midPoint = Math.floor(items.length / 2);
      const recentItems = items.slice(0, midPoint);
      const olderItems = items.slice(midPoint);
      
      // Calculate metrics for recent period
      const recentLoads = recentItems.reduce((sum, item) => sum + item.loadCount, 0);
      const recentSold = recentItems.reduce((sum, item) => sum + item.soldCount, 0);
      const recentRevenue = recentItems.reduce((sum, item) => sum + item.totalRevenue, 0);
      const recentSellThrough = recentLoads > 0 ? (recentSold / recentLoads) * 100 : 0;
      
      // Calculate metrics for older period
      const olderLoads = olderItems.reduce((sum, item) => sum + item.loadCount, 0);
      const olderSold = olderItems.reduce((sum, item) => sum + item.soldCount, 0);
      const olderRevenue = olderItems.reduce((sum, item) => sum + item.totalRevenue, 0);
      const olderSellThrough = olderLoads > 0 ? (olderSold / olderLoads) * 100 : 0;
      
      // Calculate overall metrics
      const totalLoads = items.reduce((sum, item) => sum + item.loadCount, 0);
      const totalSold = items.reduce((sum, item) => sum + item.soldCount, 0);
      const totalRevenue = items.reduce((sum, item) => sum + item.totalRevenue, 0);
      const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);
      const averageSellThroughPercentage = totalLoads > 0 ? (totalSold / totalLoads) * 100 : 0;
      
      // Calculate health-specific metrics
      const wasteCount = totalLoads - totalSold;
      const wasteRatio = totalLoads > 0 ? wasteCount / totalLoads : 0;
      const revenuePerLoad = totalLoads > 0 ? totalRevenue / totalLoads : 0;
      
      // Calculate trends
      const loadTrend = olderLoads > 0 ? ((recentLoads - olderLoads) / olderLoads) * 100 : 0;
      const revenueTrend = olderRevenue > 0 ? ((recentRevenue - olderRevenue) / olderRevenue) * 100 : 0;
      const sellThroughTrend = olderSellThrough > 0 ? ((recentSellThrough - olderSellThrough) / olderSellThrough) * 100 : 0;
      
      // Calculate load consistency (based on variance and expected performance)
      const expectedLoads = 30 * items.length;
      const loadConsistency = Math.min(100, (totalLoads / Math.max(expectedLoads, 1)) * 100);
      
      // Calculate comprehensive health metrics
      const healthMetrics = calculateComprehensiveHealthScore({
        sellThroughPercentage: averageSellThroughPercentage,
        loadConsistency,
        wasteRatio,
        growthTrend: sellThroughTrend,
        revenuePerLoad,
        averageRevenuePerLoad,
        totalRevenue
      });
      
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
        ...healthMetrics,
        wasteRange: {
          min: totalRevenue * 2,
          max: totalRevenue * 3,
        },
        // Add comparison data
        periodComparison: {
          recent: {
            loads: recentLoads,
            sold: recentSold,
            revenue: recentRevenue,
            sellThrough: recentSellThrough
          },
          older: {
            loads: olderLoads,
            sold: olderSold,
            revenue: olderRevenue,
            sellThrough: olderSellThrough
          },
          trends: {
            loadTrend,
            revenueTrend,
            sellThroughTrend
          }
        }
      } as StoreHealthMetrics & {
        periodComparison: {
          recent: { loads: number; sold: number; revenue: number; sellThrough: number };
          older: { loads: number; sold: number; revenue: number; sellThrough: number };
          trends: { loadTrend: number; revenueTrend: number; sellThroughTrend: number };
        }
      });
    });

    // Group by province and sort by health score
    const provinceMap = new Map<string, any[]>();
    stores.forEach(store => {
      if (!provinceMap.has(store.province)) {
        provinceMap.set(store.province, []);
      }
      provinceMap.get(store.province)!.push(store);
    });

    return Array.from(provinceMap.entries()).map(([province, stores]) => ({
      province,
      stores: stores.sort((a, b) => {
        // Sort by health percentage (worst first for attention)
        return a.overallHealthPercentage - b.overallHealthPercentage;
      }),
    }));
  };

  // Calculate comprehensive health score based on bag sales performance
  const calculateComprehensiveHealthScore = (metrics: {
    sellThroughPercentage: number;
    loadConsistency: number;
    wasteRatio: number;
    growthTrend: number;
    revenuePerLoad: number;
    averageRevenuePerLoad: number;
    totalRevenue: number; // Add total revenue for actual sales calculation
  }) => {
    const {
      sellThroughPercentage,
      loadConsistency,
      wasteRatio,
      growthTrend,
      revenuePerLoad,
      averageRevenuePerLoad,
      totalRevenue
    } = metrics;

    // Calculate individual health indicators (0-100) - prioritizing bag sales
    const bagSalesPerformance = Math.min(100, Math.max(0, sellThroughPercentage));
    const salesConsistency = Math.min(100, Math.max(0, loadConsistency));
    
    // Sales revenue (actual value, not percentage)
    const salesRevenue = totalRevenue; // Store actual sales revenue earned
    
    // Bag sales efficiency (how well they convert loads to sales)
    const salesEfficiency = Math.min(100, (bagSalesPerformance + salesConsistency) / 2);
    
    // Sales volume consistency (reliable revenue income)
    const volumeConsistency = loadConsistency;
    
    // Growth score prioritizing bag sales growth (critical for revenue growth)
    const salesGrowth = Math.min(100, Math.max(-50, growthTrend + 50)); // More forgiving on negative growth
    
    // Sales revenue efficiency (compared to average)
    const revenueEfficiency = averageRevenuePerLoad > 0 
      ? Math.min(150, Math.max(50, (revenuePerLoad / averageRevenuePerLoad) * 100))
      : 100;

    // Weighted overall health score - heavily focused on bag sales and revenue generation
    const overallHealthPercentage = (
      bagSalesPerformance * 0.40 +     // 40% weight on bags sold (primary metric)
      salesConsistency * 0.25 +        // 25% weight on sales consistency 
      salesGrowth * 0.20 +             // 20% weight on bag sales growth
      salesEfficiency * 0.15           // 15% weight on sales efficiency
    );

    // Determine health category
    let healthScore: "critical" | "poor" | "fair" | "good" | "excellent";
    if (overallHealthPercentage >= 90) healthScore = "excellent";
    else if (overallHealthPercentage >= 75) healthScore = "good";
    else if (overallHealthPercentage >= 60) healthScore = "fair";
    else if (overallHealthPercentage >= 40) healthScore = "poor";
    else healthScore = "critical";

    // Generate alerts and recommendations focused on bag sales performance
    const alerts = [];
    const recommendations = [];

    // Critical alerts - focused on revenue-impacting issues
    if (sellThroughPercentage < 25) {
      alerts.push({
        level: "critical" as const,
        message: "Critically low bag sales - major revenue loss risk",
        category: "performance" as const
      });
      recommendations.push("Check bag quality and customer reviews for issues");
      recommendations.push("If store is new with good quality bags, focus on marketing and visibility");
      recommendations.push("Consider reducing bag load quantities until sales improve");
    }

    if (growthTrend < -20) {
      alerts.push({
        level: "critical" as const,
        message: "Declining bag sales trend - sales revenue at risk",
        category: "performance" as const
      });
      recommendations.push("Implement immediate intervention to reverse sales decline");
      recommendations.push("Check bag quality and review customer feedback");
      recommendations.push("Comment your intervention below and rate how it affects future sales");
    }

    // Warning alerts - potential revenue impact
    if (sellThroughPercentage < 45 && sellThroughPercentage >= 25) {
      alerts.push({
        level: "warning" as const,
        message: "Below target bag sales performance - monitor closely",
        category: "performance" as const
      });
      recommendations.push("Check bag quality and customer satisfaction");
      recommendations.push("If bags are good quality, improve marketing and store visibility");
      recommendations.push("Document any changes made and monitor sales impact");
    }

    if (loadConsistency < 60) {
      alerts.push({
        level: "warning" as const,
        message: "Inconsistent bag sales pattern - unpredictable revenue income",
        category: "consistency" as const
      });
      recommendations.push("Work with store to establish more consistent bag sales routine");
    }

    // Info alerts for good performance
    if (overallHealthPercentage >= 85 && alerts.length === 0) {
      alerts.push({
        level: "info" as const,
        message: "Excellent bag sales performance - optimal revenue generation",
        category: "performance" as const
      });
      recommendations.push("Share best practices with other stores");
      recommendations.push("Consider expanding to additional short-dated product categories");
    }

    return {
      overallHealthPercentage: Math.round(overallHealthPercentage),
      healthScore,
      healthIndicators: {
        bagSalesPerformance: Math.round(bagSalesPerformance),
        salesRevenue: salesRevenue, // Store actual revenue value
        salesConsistency: Math.round(salesConsistency),
        salesEfficiency: Math.round(salesEfficiency),
        volumeConsistency: Math.round(volumeConsistency),
        salesGrowth: Math.round(salesGrowth),
        revenueEfficiency: Math.round(revenueEfficiency)
      },
      alerts,
      recommendations
    };
  };

  // Copy message for store - focused on bag sales performance
  const copyStoreMessage = (store: StoreHealthMetrics) => {
    const salesRate = ((store.totalSold / store.totalLoads) * 100);
    const salesRateText = salesRate.toFixed(1);
    const message = `${store.restaurantName} bag sales update: ${store.totalSold} bags sold out of ${store.totalLoads} loaded (${salesRateText}% success rate) generating R${store.totalRevenue.toFixed(2)} sales revenue over 30 days. ${salesRate < 50 ? 'Focus needed on improving bag sales conversion.' : 'Great performance - keep it up!'}`;
    navigator.clipboard.writeText(message);
    toast.success("Bag sales message copied to clipboard!");
  };
  // Load notes for a specific store
  const loadStoreNotes = async (storeId: string) => {
    if (loadingNotes.has(storeId) || storeNotes.has(storeId)) return;
    
    setLoadingNotes(prev => new Set(prev).add(storeId));
    
    try {
      const notes = await getStoreNotes(storeId);
      setStoreNotes(prev => {
        const updated = new Map(prev);
        updated.set(storeId, notes);
        return updated;
      });
    } catch (error) {
      console.error("Error loading store notes:", error);
      toast.error("Failed to load notes for this store");
    } finally {
      setLoadingNotes(prev => {
        const updated = new Set(prev);
        updated.delete(storeId);
        return updated;
      });
    }
  };

  // Add note for store
  const addStoreNote = async (storeId: string, storeName: string, province: string) => {
    if (!newNote.trim()) {
      toast.error("Please enter a note message");
      return;
    }

    if (!currentUser) {
      toast.error("User not authenticated");
      return;
    }

    try {
      const noteData = {
        storeId,
        storeName,
        province,
        message: newNote.trim(),
        rating: newRating,
        author: currentUser.name,
        authorRole: currentUser.role,
        authorEmail: currentUser.email,
        timestamp: new Date().toISOString(),
        feedback: [],
      };

      await saveStoreNote(noteData);
      
      // Reload notes for this store
      const notes = await getStoreNotes(storeId);
      setStoreNotes(prev => {
        const updated = new Map(prev);
        updated.set(storeId, notes);
        return updated;
      });

      setNewNote("");
      setNewRating(3);
      toast.success("Note added successfully!");
    } catch (error) {
      console.error("Error adding store note:", error);
      toast.error("Failed to add note");
    }
  };

  // Add feedback to note
  const addFeedback = async (storeId: string, noteId: string) => {
    const feedbackMessage = feedbackText.get(noteId);
    if (!feedbackMessage?.trim()) {
      toast.error("Please enter feedback message");
      return;
    }

    if (!currentUser) {
      toast.error("You must be logged in to add feedback");
      return;
    }

    try {
      await addFeedbackToNote(noteId, {
        author: currentUser.name || "Unknown User",
        role: currentUser.role || "User", 
        email: currentUser.email || "",
        message: feedbackMessage.trim(),
        timestamp: new Date().toISOString(),
      });

      // Reload notes for this store
      const notes = await getStoreNotes(storeId);
      setStoreNotes(prev => {
        const updated = new Map(prev);
        updated.set(storeId, notes);
        return updated;
      });

      setFeedbackText(prev => {
        const updated = new Map(prev);
        updated.set(noteId, "");
        return updated;
      });

      toast.success("Feedback added successfully!");
    } catch (error) {
      console.error("Error adding feedback:", error);
      toast.error("Failed to add feedback");
    }
  };

  // Update note rating
  const updateNoteRating = async (storeId: string, noteId: string, newRating: number) => {
    try {
      await updateStoreNoteRating(noteId, newRating);
      
      // Reload notes for this store
      const notes = await getStoreNotes(storeId);
      setStoreNotes(prev => {
        const updated = new Map(prev);
        updated.set(storeId, notes);
        return updated;
      });

      setEditingRating(null);
      toast.success("Rating updated successfully!");
    } catch (error) {
      console.error("Error updating rating:", error);
      toast.error("Failed to update rating");
    }
  };

  // Render star rating
  const renderStars = (rating: number, interactive: boolean = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            } ${
              interactive ? 'cursor-pointer hover:text-yellow-400' : ''
            }`}
            onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
          />
        ))}
      </div>
    );
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
          const matchesRevenue = revenueFilter === "all" ||
            (revenueFilter === "under-500" && store.totalRevenue < 500) ||
            (revenueFilter === "500-1000" && store.totalRevenue >= 500 && store.totalRevenue < 1000) ||
            (revenueFilter === "1000-2500" && store.totalRevenue >= 1000 && store.totalRevenue < 2500) ||
            (revenueFilter === "2500-5000" && store.totalRevenue >= 2500 && store.totalRevenue < 5000) ||
            (revenueFilter === "over-5000" && store.totalRevenue >= 5000);
          return matchesSearch && matchesProvince && matchesHealth && matchesLoad && matchesRevenue;
        }),
      }))
      .filter(provinceData => provinceData.stores.length > 0);
  }, [storeHealthData, searchTerm, selectedProvince, healthFilter, loadFilter, revenueFilter]);

  const getHealthColor = (score: string): string => {
    switch (score) {
      case "excellent": return "border-l-green-500";
      case "good": return "border-l-yellow-500";
      case "fair": return "border-l-orange-500";
      case "poor": return "border-l-red-500";
      case "critical": return "border-l-red-600";
      default: return "border-l-gray-500";
    }
  };

  const getHealthBadgeColor = (score: string): string => {
    switch (score) {
      case "excellent": return "bg-green-500 text-white";
      case "good": return "bg-yellow-500 text-black";
      case "fair": return "bg-orange-500 text-white";
      case "poor": return "bg-red-500 text-white";
      case "critical": return "bg-red-600 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getHealthBadgeVariant = (score: string) => {
    switch (score) {
      case "excellent": return "default";
      case "good": return "secondary";
      case "fair": return "destructive";
      case "poor": return "destructive";
      case "critical": return "destructive";
      default: return "outline";
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
          <p className="text-muted-foreground">Monitor store performance over the last 30 days with 2-week period comparisons</p>
        </div>
        <Button onClick={fetchStoreHealthData} variant="outline">
          <TrendingUp className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Legend/Key Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Store Health Dashboard Key
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Health Score Colors */}
            <div>
              <h3 className="font-medium text-sm mb-3">Health Score Colors</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gray-800 border-l-4 border-l-green-500 rounded"></div>
                  <span className="text-sm"><strong>Green Border:</strong> Excellent (90%+ overall health)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gray-800 border-l-4 border-l-yellow-500 rounded"></div>
                  <span className="text-sm"><strong>Yellow Border:</strong> Good (75-89% overall health)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gray-800 border-l-4 border-l-orange-500 rounded"></div>
                  <span className="text-sm"><strong>Orange Border:</strong> Fair (60-74% overall health)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gray-800 border-l-4 border-l-red-500 rounded"></div>
                  <span className="text-sm"><strong>Red Border:</strong> Poor (40-59% overall health)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gray-800 border-l-4 border-l-red-600 rounded"></div>
                  <span className="text-sm"><strong>Dark Red Border:</strong> Critical (&lt;40% overall health)</span>
                </div>
              </div>
            </div>

            {/* Key Metrics for Bag Sales Business */}
            <div>
              <h3 className="font-medium text-sm mb-3">Key Metrics</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Bags Loaded:</strong> Total number of short-dated stock bags loaded into store</div>
                <div><strong>Bags Sold:</strong> Number of bags successfully sold to customers (revenue source)</div>
                <div><strong>Bag Sales Rate:</strong> Percentage of loaded bags that were sold</div>
                <div><strong>Sales Consistency:</strong> How regularly the store maintains steady bag sales</div>
                <div><strong>Sales Revenue:</strong> bag sales over 30 days</div>
              </div>
            </div>

            {/* Trend Indicators */}
            <div>
              <h3 className="font-medium text-sm mb-3">Trend Indicators</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-1 rounded">
                    <TrendingUp className="h-3 w-3" />
                    <span>+15%</span>
                  </div>
                  <span className="text-sm">Performance improving vs previous 2 weeks</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs bg-red-600 text-white px-2 py-1 rounded">
                    <TrendingDown className="h-3 w-3" />
                    <span>-12%</span>
                  </div>
                  <span className="text-sm">Performance declining vs previous 2 weeks</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Shows recent 2 weeks vs previous 2 weeks comparison
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                <SelectValue placeholder="All Health Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Health Levels</SelectItem>
                <SelectItem value="excellent">Excellent (90%+)</SelectItem>
                <SelectItem value="good">Good (75-89%)</SelectItem>
                <SelectItem value="fair">Fair (60-74%)</SelectItem>
                <SelectItem value="poor">Poor (40-59%)</SelectItem>
                <SelectItem value="critical">Critical (under 40%)</SelectItem>
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
            <Select value={revenueFilter} onValueChange={setRevenueFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Revenue Ranges" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Revenue Ranges</SelectItem>
                <SelectItem value="under-500">Under R500</SelectItem>
                <SelectItem value="500-1000">R500 - R1,000</SelectItem>
                <SelectItem value="1000-2500">R1,000 - R2,500</SelectItem>
                <SelectItem value="2500-5000">R2,500 - R5,000</SelectItem>
                <SelectItem value="over-5000">Over R5,000</SelectItem>
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
                  <div 
                    key={store.restaurantId} 
                    className={`cursor-pointer hover:shadow-lg transition-all duration-200 rounded-lg bg-gray-800 border-l-4 ${getHealthColor(store.healthScore)} text-white`}
                    onClick={() => {
                      setSelectedStore(store);
                      loadStoreNotes(store.restaurantId);
                    }}
                  >
                    <div className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-sm line-clamp-2">{store.restaurantName}</h3>
                            <p className="text-xs opacity-90 mt-1">Overall Health: {store.overallHealthPercentage}%</p>
                            
                            {/* Critical alerts indicator */}
                            {store.alerts.filter(a => a.level === 'critical').length > 0 && (
                              <div className="flex items-center gap-1 mt-1 text-xs opacity-90">
                                <AlertTriangle className="h-3 w-3" />
                                <span>{store.alerts.filter(a => a.level === 'critical').length} critical issue{store.alerts.filter(a => a.level === 'critical').length > 1 ? 's' : ''}</span>
                              </div>
                            )}
                            
                            {/* Add trend indicators */}
                            {(store as any).periodComparison && (
                              <div className="flex items-center gap-1 mt-1">
                                {(store as any).periodComparison.trends.sellThroughTrend > 5 && (
                                  <div className="flex items-center gap-1 text-xs bg-black/20 px-1.5 py-0.5 rounded">
                                    <TrendingUp className="h-2.5 w-2.5" />
                                    <span>+{(store as any).periodComparison.trends.sellThroughTrend.toFixed(0)}%</span>
                                  </div>
                                )}
                                {(store as any).periodComparison.trends.sellThroughTrend < -5 && (
                                  <div className="flex items-center gap-1 text-xs bg-black/20 px-1.5 py-0.5 rounded">
                                    <TrendingDown className="h-2.5 w-2.5" />
                                    <span>{(store as any).periodComparison.trends.sellThroughTrend.toFixed(0)}%</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <Badge className={`ml-2 text-sm px-3 py-1 ${getHealthBadgeColor(store.healthScore)}`}>
                            {store.healthScore.toUpperCase()}
                          </Badge>
                        </div>
                        
                        {/* Health Indicators Mini Dashboard - Bag Sales Focus */}
                        <div className="grid grid-cols-2 gap-2 text-xs opacity-90">
                          <div className="flex justify-between">
                            <span>Bag Sales:</span>
                            <span className={`font-medium ${
                              store.healthIndicators.bagSalesPerformance >= 75 ? 'text-green-400' :
                              store.healthIndicators.bagSalesPerformance >= 50 ? 'text-yellow-400' : 'text-red-400'
                            }`}>{store.healthIndicators.bagSalesPerformance}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Sales:</span>
                            <span className={`font-medium ${
                              store.healthIndicators.salesRevenue >= 1000 ? 'text-green-400' :
                              store.healthIndicators.salesRevenue >= 500 ? 'text-yellow-400' : 'text-red-400'
                            }`}>R{store.healthIndicators.salesRevenue.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Consistency:</span>
                            <span className={`font-medium ${
                              store.healthIndicators.salesConsistency >= 75 ? 'text-green-400' :
                              store.healthIndicators.salesConsistency >= 50 ? 'text-yellow-400' : 'text-red-400'
                            }`}>{store.healthIndicators.salesConsistency}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Growth:</span>
                            <span className={`font-medium ${
                              store.healthIndicators.salesGrowth >= 75 ? 'text-green-400' :
                              store.healthIndicators.salesGrowth >= 50 ? 'text-yellow-400' : 'text-red-400'
                            }`}>{store.healthIndicators.salesGrowth}%</span>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-400 border-t border-gray-600 pt-2">
                          <div className="flex justify-between">
                            <span>Bags/Sold:</span>
                            <span>{store.totalLoads}/{store.totalSold}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Sales Rev:</span>
                            <span>R{store.totalRevenue.toFixed(0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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
              {/* Health Overview & Indicators */}
              <div className="grid grid-cols-12 gap-4">
                {/* Overall Health Score */}
                <div className="col-span-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        Health Score
                        <Badge className={`${getHealthBadgeColor(selectedStore.healthScore)} text-sm px-3 py-1`}>
                          {selectedStore.healthScore.toUpperCase()}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-center">
                          <div className="relative w-32 h-32">
                            <svg className="transform -rotate-90 w-32 h-32" viewBox="0 0 100 100">
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-muted-foreground/20"
                              />
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={251.32}
                                strokeDashoffset={251.32 - (251.32 * selectedStore.overallHealthPercentage / 100)}
                                className={
                                  selectedStore.overallHealthPercentage >= 75 ? 'text-green-500' :
                                  selectedStore.overallHealthPercentage >= 50 ? 'text-yellow-500' : 'text-red-500'
                                }
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-3xl font-bold">{selectedStore.overallHealthPercentage}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Health Indicators */}
                <div className="col-span-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Performance Indicators</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { label: 'Bag Sales', value: selectedStore.healthIndicators.bagSalesPerformance, weight: '40%', isPercentage: true },
                          { label: 'Sales', value: selectedStore.healthIndicators.salesRevenue, weight: '20%', isCurrency: true },
                          { label: 'Consistency', value: selectedStore.healthIndicators.salesConsistency, weight: '25%', isPercentage: true },
                          { label: 'Growth', value: selectedStore.healthIndicators.salesGrowth, weight: '15%', isPercentage: true }
                        ].map((indicator) => (
                          <div key={indicator.label} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{indicator.label}</span>
                              <span className="text-muted-foreground">{indicator.weight}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-500 ${ 
                                    indicator.isCurrency 
                                      ? indicator.value >= 1000 ? 'bg-green-500' : indicator.value >= 500 ? 'bg-yellow-500' : 'bg-red-500'
                                      : indicator.value >= 75 ? 'bg-green-500' : indicator.value >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ 
                                    width: indicator.isCurrency 
                                      ? `${Math.min((indicator.value / 2000) * 100, 100)}%` // Scale currency to progress bar
                                      : `${Math.min(indicator.value, 100)}%` 
                                  }}
                                />
                              </div>
                              <span className="text-sm font-medium min-w-[45px] text-right">
                                {indicator.isCurrency ? `R${indicator.value.toFixed(0)}` : `${indicator.value}%`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Alerts & Recommendations */}
              <div className="grid grid-cols-2 gap-4">
                {/* Alerts */}
                {selectedStore.alerts.length > 0 && (
                  <Card className="bg-destructive/5 border-destructive/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Active Alerts ({selectedStore.alerts.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {selectedStore.alerts.map((alert, idx) => (
                          <div 
                            key={idx} 
                            className={`p-2 rounded text-sm ${ 
                              alert.level === 'critical' ? 'bg-destructive/10 border border-destructive/20' :
                              alert.level === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/20' :
                              'bg-blue-500/10 border border-blue-500/20'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-medium">{alert.message}</span>
                              <Badge variant="secondary" className="text-xs">
                                {alert.level}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recommendations */}
                {selectedStore.recommendations.length > 0 && (
                  <Card className="bg-blue-500/5 border-blue-500/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {selectedStore.recommendations.map((rec, idx) => (
                          <div key={idx} className="p-2 bg-blue-500/10 rounded text-sm border border-blue-500/20">
                            {rec}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Raw Stats Summary */}
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

              {/* Period Comparison */}
              {selectedStore && (selectedStore as any).periodComparison && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      30-Day Performance Comparison
                      <Badge variant="outline" className="text-xs">Recent 2 weeks vs Previous 2 weeks</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Loads Comparison */}
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Loads</span>
                            <div className="flex items-center gap-1">
                              {(selectedStore as any).periodComparison.trends.loadTrend > 0 ? (
                                <TrendingUp className="h-3 w-3 text-green-600" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-red-600" />
                              )}
                              <span className={`text-xs font-medium ${
                                (selectedStore as any).periodComparison.trends.loadTrend > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {(selectedStore as any).periodComparison.trends.loadTrend.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <div className="text-muted-foreground">Recent 2 weeks</div>
                              <div className="font-medium">{(selectedStore as any).periodComparison.recent.loads}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Previous 2 weeks</div>
                              <div className="font-medium">{(selectedStore as any).periodComparison.older.loads}</div>
                            </div>
                          </div>
                        </div>

                        {/* Revenue Comparison */}
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Revenue</span>
                            <div className="flex items-center gap-1">
                              {(selectedStore as any).periodComparison.trends.revenueTrend > 0 ? (
                                <TrendingUp className="h-3 w-3 text-green-600" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-red-600" />
                              )}
                              <span className={`text-xs font-medium ${
                                (selectedStore as any).periodComparison.trends.revenueTrend > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {(selectedStore as any).periodComparison.trends.revenueTrend.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <div className="text-muted-foreground">Recent 2 weeks</div>
                              <div className="font-medium">R{(selectedStore as any).periodComparison.recent.revenue.toFixed(2)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Previous 2 weeks</div>
                              <div className="font-medium">R{(selectedStore as any).periodComparison.older.revenue.toFixed(2)}</div>
                            </div>
                          </div>
                        </div>

                        {/* Sell Through Comparison */}
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Sell Through</span>
                            <div className="flex items-center gap-1">
                              {(selectedStore as any).periodComparison.trends.sellThroughTrend > 0 ? (
                                <TrendingUp className="h-3 w-3 text-green-600" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-red-600" />
                              )}
                              <span className={`text-xs font-medium ${
                                (selectedStore as any).periodComparison.trends.sellThroughTrend > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {(selectedStore as any).periodComparison.trends.sellThroughTrend.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <div className="text-muted-foreground">Recent 2 weeks</div>
                              <div className="font-medium">{(selectedStore as any).periodComparison.recent.sellThrough.toFixed(1)}%</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Previous 2 weeks</div>
                              <div className="font-medium">{(selectedStore as any).periodComparison.older.sellThrough.toFixed(1)}%</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Performance Interpretation - Bag Sales Focus */}
                      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border-l-4 border-blue-500">
                        <h4 className="text-sm font-medium mb-2">Bag Sales Performance Analysis</h4>
                        <p className="text-xs text-muted-foreground">
                          {(selectedStore as any).periodComparison.trends.sellThroughTrend > 10
                            ? "📈 Strong improvement in bag sales rate - excellent for sales revenue growth. Store is converting more bags to sales successfully."
                            : (selectedStore as any).periodComparison.trends.sellThroughTrend < -10
                            ? "📉 Declining bag sales performance - sales revenue at risk. This requires immediate attention to improve conversion rates."
                            : "📊 Bag sales performance remains stable with minimal change between periods."
                          }
                          {(selectedStore as any).periodComparison.trends.revenueTrend > 5 && (
                            " Sales revenue growth indicates positive momentum for ongoing partnership."
                          )}
                          {(selectedStore as any).periodComparison.trends.revenueTrend < -5 && (
                            " Sales revenue decline suggests urgent need for store support or strategy adjustment."
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

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
                    Bag Sales Performance Message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm mb-4">
                      {selectedStore.restaurantName} bag sales update: {selectedStore.totalSold} bags sold out of {selectedStore.totalLoads} loaded ({((selectedStore.totalSold / selectedStore.totalLoads) * 100).toFixed(1)}% success rate) generating R{selectedStore.totalRevenue.toFixed(2)} sales revenue over 30 days. 
                      {((selectedStore.totalSold / selectedStore.totalLoads) * 100) < 50 ? ' Focus needed on improving bag sales conversion.' : ' Great performance - keep it up!'}
                    </p>
                    <Button onClick={() => copyStoreMessage(selectedStore)} variant="outline" size="sm">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Bag Sales Message
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Store Discussion Forum */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Store Intervention Discussion
                    <Badge variant="outline" className="text-xs">
                      {(storeNotes.get(selectedStore.restaurantId) || []).length} posts
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Track changes, rate effectiveness, and discuss interventions with your team
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Create New Post */}
                  <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Plus className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Share Your Intervention</h4>
                        <p className="text-xs text-muted-foreground">Describe changes made and rate their effectiveness</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Textarea
                        placeholder="What changes did you implement? How did customers respond? What was the impact on sales?..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 border">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Impact Rating:</span>
                          <div className="flex items-center gap-1">
                            {renderStars(newRating, true, setNewRating)}
                            <span className="text-xs text-muted-foreground ml-2">
                              {newRating === 1 ? 'Made it worse' : 
                               newRating === 2 ? 'No impact' :
                               newRating === 3 ? 'Small improvement' :
                               newRating === 4 ? 'Good improvement' : 'Excellent results'}
                            </span>
                          </div>
                        </div>
                        <Button 
                          onClick={() => addStoreNote(selectedStore.restaurantId, selectedStore.restaurantName, selectedStore.province)} 
                          size="sm" 
                          className="bg-primary hover:bg-primary/90"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Post Update
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Discussion Thread */}
                  <div className="space-y-4">
                    {(storeNotes.get(selectedStore.restaurantId) || []).length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No discussions yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">Start the conversation by sharing your first intervention</p>
                        <div className="text-xs text-muted-foreground">
                          💡 Share what you tried, how customers reacted, and rate the results
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground border-b pb-2">
                          <MessageSquare className="h-4 w-4" />
                          <span>{(storeNotes.get(selectedStore.restaurantId) || []).length} intervention(s) documented</span>
                        </div>
                        
                        {(storeNotes.get(selectedStore.restaurantId) || []).map((note, index) => (
                          <div key={note.id} className="border rounded-lg overflow-hidden bg-white dark:bg-gray-800/50 shadow-sm hover:shadow-md transition-shadow">
                            {/* Post Header */}
                            <div className="bg-gray-50 dark:bg-gray-800 border-b px-4 py-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                    {note.author.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">{note.author}</span>
                                      <Badge variant="secondary" className="text-xs">
                                        Intervention #{(storeNotes.get(selectedStore.restaurantId) || []).length - index}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <span>{new Date(note.timestamp).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}</span>
                                      <span>•</span>
                                      <div className="flex items-center gap-1">
                                        <span>Impact:</span>
                                        {editingRating === note.id ? (
                                          <div className="flex items-center gap-2 ml-1">
                                            {renderStars(note.rating, true, (rating) => updateNoteRating(selectedStore.restaurantId, note.id!, rating))}
                                            <Button 
                                              size="sm" 
                                              variant="ghost" 
                                              onClick={() => setEditingRating(null)}
                                              className="h-6 px-2 text-xs"
                                            >
                                              ✓
                                            </Button>
                                          </div>
                                        ) : (
                                          <div 
                                            className="flex items-center gap-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 rounded px-1 py-0.5 transition-colors"
                                            onClick={() => setEditingRating(note.id!)}
                                            title="Click to edit rating"
                                          >
                                            {renderStars(note.rating)}
                                            <span className="text-xs ml-1">
                                              ({note.rating === 1 ? 'Made it worse' : 
                                                note.rating === 2 ? 'No impact' :
                                                note.rating === 3 ? 'Small improvement' :
                                                note.rating === 4 ? 'Good improvement' : 'Excellent results'})
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right text-xs text-muted-foreground">
                                  {note.feedback.length > 0 && (
                                    <div className="flex items-center gap-1">
                                      <MessageSquare className="h-3 w-3" />
                                      <span>{note.feedback.length} comment(s)</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Post Content */}
                            <div className="p-4">
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <p className="text-sm leading-relaxed">{note.message}</p>
                              </div>
                            </div>
                            
                            {/* Comments Section */}
                            <div className="border-t bg-gray-50/50 dark:bg-gray-900/50 p-4 space-y-4">
                              {/* Add Comment */}
                              <div className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mt-1">
                                  <MessageSquare className="h-3 w-3 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="flex-1 space-y-2">
                                  <Textarea
                                    placeholder="Share your thoughts, ask questions, or add follow-up observations..."
                                    value={feedbackText.get(note.id!) || ""}
                                    onChange={(e) => {
                                      const updated = new Map(feedbackText);
                                      updated.set(note.id!, e.target.value);
                                      setFeedbackText(updated);
                                    }}
                                    rows={2}
                                    className="text-sm resize-none"
                                  />
                                  {feedbackText.get(note.id!) && (
                                    <div className="flex justify-end">
                                      <Button 
                                        size="sm" 
                                        onClick={() => addFeedback(selectedStore.restaurantId, note.id!)}
                                        className="text-xs"
                                      >
                                        💬 Post Comment
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Existing Comments */}
                              {note.feedback.length > 0 && (
                                <div className="space-y-3">
                                  <div className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                                    <div className="h-px bg-border flex-1"></div>
                                    <span>💬 {note.feedback.length} comment(s)</span>
                                    <div className="h-px bg-border flex-1"></div>
                                  </div>
                                  {note.feedback.map(feedback => (
                                    <div key={feedback.id} className="flex gap-3 bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                                        {feedback.author.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-xs font-medium">{feedback.author}</span>
                                          <Badge variant="outline" className="text-xs px-1 py-0">
                                            Comment
                                          </Badge>
                                          <span className="text-xs text-muted-foreground">
                                            {new Date(feedback.timestamp).toLocaleDateString('en-US', {
                                              month: 'short',
                                              day: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </span>
                                        </div>
                                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{feedback.message}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
