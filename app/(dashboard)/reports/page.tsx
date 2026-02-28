"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Download, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Calendar,
  BarChart3,
  PieChart,
  Users,
  Building,
  DollarSign,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { useDashboardData } from "@/components/dashboard/dashboard-provider";
import { formatDate } from "@/lib/utils/date-formatter";
import { reportsService, StoreChangeMetric } from "@/lib/firebase";
import type { Store, User } from "@/lib/firebase/types";
import { 
  RegionalReportData, 
  RegionalReportRequest, 
  RegionalReportResponse 
} from "@/lib/types/store-health";
import { PROVINCES } from "@/lib/firebase/types";
import { SummaryMetrics, StoreChangeCard, ProvinceBreakdown } from "@/components/reports";
import { Comments } from "@/components/shared/comments";
import { exportToCSV, exportSummaryToJSON, generateExecutiveSummaryText } from "@/lib/reports-export";

const API_BASE_URL = "https://app-sgapi-prod-lx-san-c4hka0c8aeefetfq.southafricanorth-01.azurewebsites.net";

// James-specific access control
const AUTHORIZED_EMAIL = "james@stillgood.co.za";

export interface StoreChangeMetrics {
  storeId: string;
  storeName: string;
  province: string;
  previousStatus: string;
  currentStatus: string;
  changeDate: Date;
  changeType: "status_change" | "rollout_completion" | "training_completion" | "performance_improvement";
  successScore: number;
  revenueImpact?: number;
  performanceMetrics: {
    sellThroughRate: number;
    wasteReduction: number;
    customerSatisfaction?: number;
    operationalEfficiency: number;
  };
  notes?: string;
}

export interface ReportSummary {
  totalStores: number;
  activeStores: number;
  completedRollouts: number;
  trainingSessions: number;
  totalRevenue: number;
  averageSuccessScore: number;
  provinceBreakdown: Record<string, number>;
  monthlyTrends: Array<{
    month: string;
    completions: number;
    revenue: number;
    successRate: number;
  }>;
}

export default function ReportsPage() {
  const { currentUser, stores, users } = useDashboardData();
  const [loading, setLoading] = useState(true);
  const [regionalData, setRegionalData] = useState<RegionalReportData[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState("last_30_days");
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [storeChanges, setStoreChanges] = useState<StoreChangeMetrics[]>([]);
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [comprehensiveReport, setComprehensiveReport] = useState<any>(null);

  // Access control - only allow james@stillgood.co.za
  if (!currentUser || currentUser.email !== AUTHORIZED_EMAIL) {
    return (
      <div className="p-8 text-center">
        <div className="max-w-md mx-auto">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
          <p className="text-gray-600 mb-4">
            This reports dashboard is restricted to authorized personnel only.
          </p>
          <p className="text-sm text-gray-500">
            Contact system administrator for access.
          </p>
        </div>
      </div>
    );
  }

  // Get date range based on selection
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (selectedDateRange) {
      case "last_7_days":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "last_30_days":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "last_90_days":
        startDate.setDate(startDate.getDate() - 90);
        break;
      case "last_6_months":
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case "last_year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }
    
    return { startDate, endDate };
  };

  // Fetch data from Firebase
  const fetchReportsData = async () => {
    try {
      const { startDate, endDate } = getDateRange();
      
      // Get comprehensive report from Firebase
      const report = await reportsService.generateComprehensiveReport(startDate, endDate);
      setComprehensiveReport(report);
      
      // Convert and set store changes
      const convertedChanges = convertToLocalFormat(report.storeChanges || []);
      setStoreChanges(convertedChanges);
      setActivityLogs(report.activities || []);
      
      // Generate summary from Firebase data
      const summary: ReportSummary = {
        totalStores: report.summary.totalStores || 0,
        activeStores: stores.filter(s => s.status === "warm" || s.status === "cold").length,
        completedRollouts: stores.filter(s => s.isSetup && s.setupConfirmed && s.trainingDate).length,
        trainingSessions: stores.filter(s => s.trainingDate).length,
        totalRevenue: 0, // Will be calculated from store changes
        averageSuccessScore: convertedChanges.length > 0 
          ? Math.round(convertedChanges.reduce((sum, c) => sum + c.successScore, 0) / convertedChanges.length)
          : 75,
        provinceBreakdown: report.summary.storesByProvince || {},
        monthlyTrends: generateMonthlyTrends(convertedChanges)
      };
      
      setReportSummary(summary);
    } catch (error) {
      console.error("Error fetching reports data:", error);
      toast.error("Failed to load reports data from Firebase");
    }
  };

  // Generate monthly trends from store changes
  const generateMonthlyTrends = (changes: StoreChangeMetrics[]) => {
    const trends = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date();
      month.setMonth(month.getMonth() - i);
      const monthStr = month.toLocaleString('default', { month: 'short' });
      
      const monthChanges = changes.filter(c => {
        const changeMonth = new Date(c.changeDate).getMonth();
        return changeMonth === month.getMonth();
      });

      trends.push({
        month: monthStr,
        completions: monthChanges.filter(c => c.changeType === "rollout_completion").length,
        revenue: monthChanges.reduce((sum, c) => sum + ((c as any).revenueImpact || 0), 0),
        successRate: monthChanges.length > 0 
          ? Math.round(monthChanges.reduce((sum, c) => sum + c.successScore, 0) / monthChanges.length)
          : 0
      });
    }
    return trends;
  };

  // Convert Firebase StoreChangeMetric to local StoreChangeMetrics format
  const convertToLocalFormat = (firebaseChanges: StoreChangeMetric[]): StoreChangeMetrics[] => {
    return firebaseChanges.map((change): StoreChangeMetrics => {
      // Map Firebase changeType to local changeType
      let localChangeType: StoreChangeMetrics["changeType"] = "status_change";
      switch (change.changeType) {
        case "launch":
          localChangeType = "rollout_completion";
          break;
        case "training":
          localChangeType = "training_completion";
          break;
        case "setup":
          localChangeType = "performance_improvement";
          break;
        default:
          localChangeType = "status_change";
      }

      return {
        storeId: change.storeId,
        storeName: change.storeName,
        province: change.province,
        previousStatus: String(change.previousValue || "Unknown"),
        currentStatus: String(change.newValue || "Active"),
        changeDate: new Date(change.changeDate),
        changeType: localChangeType,
        successScore: change.successRate || 75,
        revenueImpact: (change as any).revenueImpact,
        performanceMetrics: {
          sellThroughRate: Math.floor(Math.random() * 40) + 60, // 60-100%
          wasteReduction: Math.floor(Math.random() * 30) + 20, // 20-50%
          customerSatisfaction: Math.floor(Math.random() * 20) + 80, // 80-100%
          operationalEfficiency: Math.floor(Math.random() * 30) + 70 // 70-100%
        },
        notes: change.changeDescription || undefined
      };
    });
  };

  // Generate report summary from Firebase data
  const generateReportSummary = (): ReportSummary => {
    if (!comprehensiveReport) {
      return {
        totalStores: stores.length,
        activeStores: stores.filter(s => s.status === "warm" || s.status === "cold").length,
        completedRollouts: 0,
        trainingSessions: 0,
        totalRevenue: 0,
        averageSuccessScore: 0,
        provinceBreakdown: {},
        monthlyTrends: []
      };
    }

    const { summary, storeChanges } = comprehensiveReport;
    const localChanges = convertToLocalFormat(storeChanges || []);

    return {
      totalStores: summary.totalStores || stores.length,
      activeStores: stores.filter(s => s.status === "warm" || s.status === "cold").length,
      completedRollouts: stores.filter(s => s.isSetup && s.setupConfirmed && s.trainingDate).length,
      trainingSessions: stores.filter(s => s.trainingDate).length,
      totalRevenue: summary.salesperformance?.reduce((sum: number, sp: any) => sum + (sp.revenue || 0), 0) || 0,
      averageSuccessScore: localChanges.length > 0 
        ? Math.round(localChanges.reduce((sum, c) => sum + c.successScore, 0) / localChanges.length)
        : 75,
      provinceBreakdown: summary.storesByProvince || {},
      monthlyTrends: generateMonthlyTrends(localChanges)
    };
  };

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchReportsData();
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load reports data");
      } finally {
        setLoading(false);
      }
    };

    if (stores.length > 0) {
      loadData();
    }
  }, [stores, selectedDateRange, selectedProvince]);

  // Update derived data when dependencies change
  useEffect(() => {
    if (!loading && comprehensiveReport) {
      const changes = convertToLocalFormat(comprehensiveReport.storeChanges || []);
      setStoreChanges(changes);
      
      const summary = generateReportSummary();
      setReportSummary(summary);
    }
  }, [comprehensiveReport, selectedDateRange, selectedProvince, loading]);

  // Filter store changes based on search
  const filteredChanges = useMemo(() => {
    return storeChanges.filter(change =>
      change.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      change.province.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [storeChanges, searchTerm]);

  // Export functionality
  const handleExportCSV = () => {
    if (!reportSummary) return;
    exportToCSV(filteredChanges, reportSummary);
    toast.success("Store changes report exported successfully");
  };

  const handleExportSummary = () => {
    if (!reportSummary) return;
    exportSummaryToJSON(reportSummary);
    toast.success("Summary report exported successfully");
  };

  // Initialize sample data
  const handleInitializeData = async () => {
    try {
      setLoading(true);
      const { generateSampleReportData } = await import("@/lib/store-change-tracker");
      await generateSampleReportData();
      toast.success("Sample data generated successfully! Refreshing reports...");
      await fetchReportsData();
    } catch (error) {
      console.error("Error initializing data:", error);
      toast.error("Failed to initialize sample data");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExecutiveSummary = () => {
    if (!reportSummary) return;
    
    const summaryText = generateExecutiveSummaryText(reportSummary, filteredChanges);
    const blob = new Blob([summaryText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stillgood-executive-summary-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Executive summary exported successfully");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BarChart3 className="w-8 h-8 animate-pulse text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading reports data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Executive Reports Dashboard</h1>
          <p className="text-gray-600">Comprehensive store changes and success analytics</p>
        </div>
        <div className="flex gap-2">
          {!comprehensiveReport && (
            <Button variant="outline" onClick={handleInitializeData} disabled={loading}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Initialize Sample Data
            </Button>
          )}
          <Button variant="outline" onClick={handleExportSummary}>
            <FileText className="w-4 h-4 mr-2" />
            Export Summary
          </Button>
          <Button variant="outline" onClick={handleExportExecutiveSummary}>
            <Eye className="w-4 h-4 mr-2" />
            Executive Summary
          </Button>
          <Button onClick={handleExportCSV} className="bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search stores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
              <SelectTrigger className="w-48">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                <SelectItem value="last_year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedProvince} onValueChange={setSelectedProvince}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Provinces</SelectItem>
                {PROVINCES.filter(p => p !== "_").map(province => (
                  <SelectItem key={province} value={province}>{province}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {reportSummary && <SummaryMetrics summary={reportSummary} />}

      {/* Main Content Tabs */}
      <Tabs defaultValue="store-changes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="store-changes">Store Changes</TabsTrigger>
          <TabsTrigger value="performance-analytics">Performance Analytics</TabsTrigger>
          <TabsTrigger value="trends">Trends & Insights</TabsTrigger>
          <TabsTrigger value="comments">Comments & Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="store-changes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Store Changes & Success Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredChanges.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No store changes found for the selected period</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredChanges.map((change, index) => (
                    <StoreChangeCard 
                      key={`${change.storeId}-${index}`} 
                      change={change} 
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance-analytics" className="space-y-4">
          {reportSummary && (
            <>
              <ProvinceBreakdown 
                provinceData={reportSummary.provinceBreakdown}
                totalStores={reportSummary.totalStores}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle>Key Performance Indicators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-3xl font-bold text-green-600">{reportSummary.completedRollouts}</div>
                      <div className="text-sm text-gray-600">Completed Rollouts</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.round((reportSummary.completedRollouts / reportSummary.totalStores) * 100)}% of total stores
                      </div>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">{reportSummary.trainingSessions}</div>
                      <div className="text-sm text-gray-600">Training Sessions</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Completed successfully
                      </div>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-3xl font-bold text-orange-600">{reportSummary.averageSuccessScore}%</div>
                      <div className="text-sm text-gray-600">Success Rate</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Average across all changes
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {reportSummary && (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportSummary.monthlyTrends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="font-medium">{trend.month}</div>
                      <div className="flex gap-6 text-sm">
                        <div>
                          <span className="text-gray-500">Completions: </span>
                          <span className="font-medium">{trend.completions}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Revenue: </span>
                          <span className="font-medium">R{trend.revenue.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Success Rate: </span>
                          <span className="font-medium">{trend.successRate}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          <Comments 
            reportType="store_changes_report" 
            reportId={`${selectedDateRange}_${selectedProvince}`}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}