// @/scripts/init-reports-data.ts
/**
 * Run this script to initialize sample reports data in Firebase
 * This should be run once to populate the database with sample data
 */

import { generateSampleReportData } from "@/lib/store-change-tracker";

export const initializeReportsData = async () => {
  try {
    console.log("Initializing reports data...");
    await generateSampleReportData();
    console.log("Reports data initialization complete!");
  } catch (error) {
    console.error("Error initializing reports data:", error);
  }
};

// For direct execution
if (typeof window === 'undefined') {
  // Server-side execution
  initializeReportsData();
}