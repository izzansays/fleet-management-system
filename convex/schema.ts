import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  vehicles: defineTable({
    make: v.string(),
    model: v.string(),
    year: v.number(),
    licensePlate: v.string(),
    vin: v.string(),
    acquisitionCost: v.number(),
    category: 
      v.union(
        v.literal("Economy Cars"),
        v.literal("Mid-size SUVs"),
        v.literal("Luxury Sedans"),
        v.literal("Large SUVs"),
        v.literal("Trucks")
      )
    ,
    status: v.union(
      v.literal("available"),
      v.literal("reserved"),
      v.literal("in-use"),
      v.literal("maintenance")
    ),
    currentLatitude: v.number(),
    currentLongitude: v.number(),
    lastLocationUpdate: v.number(),
    currentOdometer: v.number(),
    lastOdometerUpdate: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_license_plate", ["licensePlate"])
    .index("by_category", ["category"]),

  vehicleLocationHistory: defineTable({
    vehicleId: v.id("vehicles"),
    latitude: v.number(),
    longitude: v.number(),
    timestamp: v.number(),
  }).index("by_vehicle_and_timestamp", ["vehicleId", "timestamp"]),

  vehicleOdometerHistory: defineTable({
    vehicleId: v.id("vehicles"),
    reading: v.number(),
    timestamp: v.number(),
  }).index("by_vehicle_and_timestamp", ["vehicleId", "timestamp"]),

  bookings: defineTable({
    vehicleId: v.id("vehicles"),
    customerName: v.string(),
    customerEmail: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    dailyRate: v.number(),
    totalAmount: v.number(),
    status: v.union(
      v.literal("confirmed"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  })
    .index("by_vehicle", ["vehicleId"])
    .index("by_status", ["status"])
    .index("by_start_date", ["startDate"]),

  maintenance: defineTable({
    vehicleId: v.id("vehicles"),
    date: v.number(),
    type: v.string(),
    description: v.string(),
    cost: v.number(),
    odometerAtService: v.number(),
    nextServiceDue: v.optional(v.number()),
    nextServiceMileage: v.optional(v.number()),
  })
    .index("by_vehicle", ["vehicleId"])
    .index("by_date", ["date"])
    .index("by_next_service_due", ["nextServiceDue"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
