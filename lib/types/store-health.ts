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
  healthScore: "red" | "orange" | "yellow" | "green";
  wasteRange: {
    min: number;
    max: number;
  };
}

export interface ProvinceStoreHealth {
  province: string;
  stores: StoreHealthMetrics[];
}

export interface StoreHealthData {
  provinces: ProvinceStoreHealth[];
  lastUpdated: Date;
}