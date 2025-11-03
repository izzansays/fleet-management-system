import { TableAggregate, DirectAggregate } from "@convex-dev/aggregate";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";

// Aggregate bookings by endDate for revenue calculations
// This tracks totalAmount over time for revenue metrics
export const bookingsAggregate = new TableAggregate<{
  Key: number; // endDate timestamp for time-based queries
  DataModel: DataModel;
  TableName: "bookings";
}>(components.bookingsAggregate, {
  sortKey: (doc) => doc.endDate,
  sumValue: (doc) => doc.totalAmount,
});

// Aggregate maintenance costs by date
export const maintenanceAggregate = new TableAggregate<{
  Key: number; // date timestamp
  DataModel: DataModel;
  TableName: "maintenance";
}>(components.maintenanceAggregate, {
  sortKey: (doc) => doc.date,
  sumValue: (doc) => doc.cost,
});

// DirectAggregate for vehicle metrics (fleet size, acquisition costs)
// These are computed/snapshot values, not raw table data
export const vehiclesMetrics = new DirectAggregate<{
  Namespace: "fleetMetrics";
  Key: "vehicleCount" | "acquisitionCost";
  Id: string;
}>(components.vehiclesAggregate);

// Helper to determine which time period a timestamp falls into
export function getTimePeriod(timestamp: number): "last30days" | "previous30days" | null {
  const now = Date.now();
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = now - (60 * 24 * 60 * 60 * 1000);

  if (timestamp >= thirtyDaysAgo && timestamp <= now) {
    return "last30days";
  } else if (timestamp >= sixtyDaysAgo && timestamp < thirtyDaysAgo) {
    return "previous30days";
  }
  return null;
}
