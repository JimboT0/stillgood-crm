// @/lib/store-change-tracker.ts
import { reportsService, storeService, userService } from "@/lib/firebase";
import type { Store, StoreChangeMetric } from "@/lib/firebase";

/**
 * Helper functions to track store changes and automatically log them to Firebase
 */

export const logStoreChange = async (
  storeId: string,
  changeType: StoreChangeMetric["changeType"],
  previousValue: any,
  newValue: any,
  changeDescription: string,
  impact: "positive" | "negative" | "neutral" = "neutral",
  successRate?: number
) => {
  try {
    const store = await storeService.getById(storeId);
    if (!store) {
      console.error(`Store not found: ${storeId}`);
      return;
    }

    const user = store.salespersonId ? await userService.getById(store.salespersonId) : null;

    const changeMetric: Omit<StoreChangeMetric, "id"> = {
      storeId: store.id,
      storeName: store.tradingName || store.id,
      salespersonId: store.salespersonId || "unknown",
      salespersonName: user?.name || "Unknown",
      province: store.province || "Unknown",
      changeType,
      previousValue,
      newValue,
      changeDate: new Date(),
      changeDescription,
      successRate: successRate || calculateSuccessRate(store, changeType),
      impact
    };

    await reportsService.logStoreChange(changeMetric);
    console.log(`Store change logged for ${store.tradingName}: ${changeDescription}`);
  } catch (error) {
    console.error("Error logging store change:", error);
  }
};

/**
 * Calculate success rate based on store status and change type
 */
const calculateSuccessRate = (store: Store, changeType: StoreChangeMetric["changeType"]): number => {
  let baseScore = 50;

  // Adjust score based on change type
  switch (changeType) {
    case "status":
      if (store.status === "warm") baseScore = 85;
      else if (store.status === "closed") baseScore = 100;
      else baseScore = 60;
      break;
    case "setup":
      baseScore = store.isSetup ? 90 : 40;
      break;
    case "training":
      baseScore = store.trainingDate ? 85 : 30;
      break;
    case "launch":
      baseScore = store.launchDate ? 95 : 25;
      break;
    case "error":
      baseScore = 20;
      break;
    default:
      baseScore = 70;
  }

  // Additional factors
  if (store.isSetup && store.setupConfirmed) baseScore += 10;
  if (store.trainingDate && store.launchDate) baseScore += 15;

  return Math.min(100, Math.max(0, baseScore));
};

/**
 * Log activity for audit trail
 */
export const logActivity = async (
  storeId: string,
  userId: string,
  action: string,
  details: string,
  category: "store_management" | "user_action" | "system_event" | "error" = "store_management"
) => {
  try {
    const store = await storeService.getById(storeId);
    const user = await userService.getById(userId);

    if (!store || !user) {
      console.error("Store or user not found for activity log");
      return;
    }

    await reportsService.logActivity({
      storeId: store.id,
      storeName: store.tradingName || store.id,
      userId: user.id,
      userName: user.name,
      action,
      details,
      category
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};

/**
 * Log multiple store changes for batch operations
 */
export const logBatchStoreChanges = async (changes: Array<{
  storeId: string;
  changeType: StoreChangeMetric["changeType"];
  previousValue: any;
  newValue: any;
  changeDescription: string;
  impact?: "positive" | "negative" | "neutral";
  successRate?: number;
}>) => {
  try {
    const promises = changes.map(change =>
      logStoreChange(
        change.storeId,
        change.changeType,
        change.previousValue,
        change.newValue,
        change.changeDescription,
        change.impact,
        change.successRate
      )
    );

    await Promise.all(promises);
    console.log(`Batch logged ${changes.length} store changes`);
  } catch (error) {
    console.error("Error logging batch store changes:", error);
  }
};

/**
 * Generate sample data for demonstration (call this once to populate Firebase)
 */
export const generateSampleReportData = async () => {
  try {
    console.log("Generating sample report data...");
    
    const stores = await storeService.getAll();
    const users = await userService.getAll();
    
    if (stores.length === 0) {
      console.log("No stores found. Please add stores first.");
      return;
    }

    const sampleChanges = [];
    
    // Generate sample changes for the last 30 days
    for (let i = 0; i < 30; i++) {
      const randomStore = stores[Math.floor(Math.random() * stores.length)];
      const changeDate = new Date();
      changeDate.setDate(changeDate.getDate() - i);
      
      const changeTypes: StoreChangeMetric["changeType"][] = ["status", "setup", "training", "launch", "contract"];
      const randomChangeType = changeTypes[Math.floor(Math.random() * changeTypes.length)];
      
      const impacts: ("positive" | "negative" | "neutral")[] = ["positive", "positive", "positive", "negative", "neutral"];
      const randomImpact = impacts[Math.floor(Math.random() * impacts.length)];

      const user = users.find(u => u.id === randomStore.salespersonId) || users[0];

      // Create a realistic change description
      let description = "";
      let previousValue: any = "";
      let newValue: any = "";
      
      switch (randomChangeType) {
        case "status":
          const statuses = ["cold", "warm", "closed"];
          previousValue = statuses[Math.floor(Math.random() * statuses.length)];
          newValue = statuses[Math.floor(Math.random() * statuses.length)];
          description = `Store status changed from ${previousValue} to ${newValue}`;
          break;
        case "setup":
          previousValue = false;
          newValue = true;
          description = "Store setup completed successfully";
          break;
        case "training":
          previousValue = null;
          newValue = changeDate.toISOString();
          description = "Training session scheduled and completed";
          break;
        case "launch":
          previousValue = null;
          newValue = changeDate.toISOString();
          description = "Store launched successfully";
          break;
        case "contract":
          previousValue = "6 months";
          newValue = "12 months";
          description = "Contract terms updated";
          break;
      }

      const changeMetric: Omit<StoreChangeMetric, "id"> = {
        storeId: randomStore.id,
        storeName: randomStore.tradingName || randomStore.id,
        salespersonId: randomStore.salespersonId || user?.id || "unknown",
        salespersonName: user?.name || "Unknown",
        province: randomStore.province || "Gauteng",
        changeType: randomChangeType,
        previousValue,
        newValue,
        changeDate,
        changeDescription: description,
        successRate: Math.floor(Math.random() * 40) + 60, // 60-100%
        impact: randomImpact
      };

      sampleChanges.push(changeMetric);
    }

    // Log all sample changes
    for (const change of sampleChanges) {
      await reportsService.logStoreChange(change);
    }

    console.log(`Generated ${sampleChanges.length} sample store changes`);
    
    // Generate some sample activity logs
    for (let i = 0; i < 20; i++) {
      const randomStore = stores[Math.floor(Math.random() * stores.length)];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const timestamp = new Date();
      timestamp.setHours(timestamp.getHours() - i);

      const activities = [
        "Updated store information",
        "Completed setup checklist",
        "Scheduled training session",
        "Updated contact details",
        "Added documentation",
        "Resolved setup issues",
        "Updated contract terms"
      ];

      const activity = activities[Math.floor(Math.random() * activities.length)];

      await reportsService.logActivity({
        storeId: randomStore.id,
        storeName: randomStore.tradingName || randomStore.id,
        userId: randomUser.id,
        userName: randomUser.name,
        action: activity,
        details: `${activity} for ${randomStore.tradingName}`,
        category: "store_management"
      });
    }

    console.log("Sample report data generated successfully!");
  } catch (error) {
    console.error("Error generating sample data:", error);
  }
};