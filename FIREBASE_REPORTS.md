# Firebase Reports System

The reports system has been migrated from API calls to Firebase for better performance and data persistence.

## Overview

The new Firebase-based reports system provides:
- Store change tracking and analytics
- Activity logging and audit trails
- Comprehensive performance metrics
- Real-time data instead of API polling

## Key Features

### 1. Store Change Tracking
- Automatically logs all store status changes
- Tracks setup progress, training completion, launches
- Calculates success rates and impact metrics
- Associates changes with salesperson performance

### 2. Firebase Collections

#### `storeChanges`
Stores individual change events:
```typescript
{
  storeId: string
  storeName: string
  salespersonId: string
  salespersonName: string
  province: string
  changeType: "status" | "setup" | "contract" | "training" | "launch" | "error" | "assignment"
  previousValue: any
  newValue: any
  changeDate: Date
  changeDescription: string
  successRate?: number
  impact?: "positive" | "negative" | "neutral"
}
```

#### `reportMetrics`
Aggregated metrics for different time periods:
```typescript
{
  period: "daily" | "weekly" | "monthly" | "quarterly"
  startDate: Date
  endDate: Date
  totalStores: number
  newStores: number
  salesperformance: array
  revenueImpact: object
}
```

#### `activityLogs`
Activity audit trail:
```typescript
{
  storeId: string
  storeName: string
  userId: string
  userName: string
  action: string
  details: string
  timestamp: Date
  category: "store_management" | "user_action" | "system_event" | "error"
}
```

## How to Use

### 1. Initial Setup
The reports page includes an "Initialize Sample Data" button that will populate Firebase with sample data to demonstrate the system.

### 2. Automatic Change Logging
To automatically log store changes in your application:

```typescript
import { logStoreChange, logActivity } from '@/lib/store-change-tracker';

// Log a store status change
await logStoreChange(
  storeId,
  "status",
  "cold",
  "warm",
  "Store moved to warm status after successful follow-up",
  "positive",
  85
);

// Log an activity
await logActivity(
  storeId,
  userId,
  "Updated store status",
  "Changed store from cold to warm",
  "store_management"
);
```

### 3. Access Reports
Only the authorized email (`james@stillgood.co.za`) can access the reports dashboard at `/reports`.

### 4. Export Options
- **CSV Export**: Detailed store changes data
- **JSON Summary**: Aggregated metrics
- **Executive Summary**: Text-based summary for management

## Benefits of Firebase vs API

1. **Performance**: Data is stored locally in Firebase instead of requiring external API calls
2. **Real-time**: Changes are reflected immediately
3. **Offline Capability**: Firebase provides offline support
4. **Cost Effective**: No API rate limits or external service costs
5. **Data Ownership**: Complete control over your data
6. **Audit Trail**: Comprehensive logging of all changes

## Data Privacy & Security

- Only authorized users can access reports
- All data is stored in your Firebase project
- Activity logs provide complete audit trail
- Access is controlled at the application level

## Integration Points

The system automatically integrates with:
- Store management operations
- User actions and changes
- Setup and training workflows
- Error tracking and resolution

## Future Enhancements

Potential additions:
- Automated report generation and email scheduling
- Advanced analytics and trend prediction
- Integration with business intelligence tools
- Custom report builders
- Real-time notifications for significant changes

## Troubleshooting

**No data showing**: Click "Initialize Sample Data" to populate with examples
**Permission denied**: Ensure your email is `james@stillgood.co.za`
**Loading issues**: Check Firebase connection and configuration

For technical support, review the Firebase console for any error logs.