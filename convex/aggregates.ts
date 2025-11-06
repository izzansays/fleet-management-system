import { TableAggregate } from "@convex-dev/aggregate";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";

// Aggregate bookings by [status, endDate] for revenue calculations
// This tracks totalAmount over time for revenue metrics
// Using composite key allows filtering by status (e.g., only "completed" bookings)
export const bookingsAggregate = new TableAggregate<{
  Key: [string, number]; // [status, endDate] tuple for grouped queries
  DataModel: DataModel;
  TableName: "bookings";
}>(components.bookingsAggregate, {
  sortKey: (doc) => [doc.status, doc.endDate],
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

// Aggregate vehicles by creation time (using any timestamp field)
// This allows efficient count() and sum() operations for vehicle metrics
export const vehiclesAggregate = new TableAggregate<{
  Key: number; // Using lastLocationUpdate as sortKey
  DataModel: DataModel;
  TableName: "vehicles";
}>(components.vehiclesAggregate, {
  sortKey: (doc) => doc.lastLocationUpdate,
  sumValue: (doc) => doc.acquisitionCost,
});

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
