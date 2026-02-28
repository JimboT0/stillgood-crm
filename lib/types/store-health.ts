export interface RegionalReportData {
  menuItemId: string;
  menuItemName: string;
  restaurantId: string;
  restaurantName: string;
  restaurantSuburb: string;
  restaurantMunicipality: string;
  restaurantSecondarySubdivision: string;
  restaurantProvince: string;
  loadCount: number;
  soldCount: number;
  totalRevenue: number;
  totalValue: number;
  sellThroughPercentage: number;
}

export interface RegionalReportRequest {
  province: string;
  secondarySubdivision?: string | null;
  municipality?: string | null;
  suburb?: string | null;
  restaurantId?: string | null;
  startDate: string;
  endDate: string;
}

export interface RegionalReportResponse {
  success: boolean;
  data: RegionalReportData[];
}

export interface StoreHealthMetrics {
  restaurantId: string;
  restaurantName: string;
  province: string;
  totalLoads: number;
  totalSold: number;
  totalRevenue: number;
  totalValue: number;
  averageSellThroughPercentage: number;
  loadConsistency: number; // 0-100 score
  healthScore: "critical" | "poor" | "fair" | "good" | "excellent";
  overallHealthPercentage: number; // 0-100 overall health score
  wasteRange: {
    min: number;
    max: number;
  };
  healthIndicators: {
    bagSalesPerformance: number; // 0-100 (primary metric for bag sales)
    salesRevenue: number; // Actual sales revenue earned (R value)
    salesConsistency: number; // 0-100 (regularity of bag sales)
    salesEfficiency: number; // 0-100 (conversion rate efficiency)
    volumeConsistency: number; // 0-100 (volume reliability)
    salesGrowth: number; // 0-100 (bag sales growth trend)
    revenueEfficiency: number; // 0-100 (revenue per bag efficiency)
  };
  alerts: {
    level: "info" | "warning" | "critical";
    message: string;
    category: "waste" | "performance" | "inventory" | "operations" | "consistency";
  }[];
  recommendations: string[];
}

export interface ProvinceStoreHealth {
  province: string;
  stores: StoreHealthMetrics[];
}

export interface StoreHealthData {
  provinces: ProvinceStoreHealth[];
  lastUpdated: Date;
}