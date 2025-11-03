import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { maintenanceAggregate } from "./aggregates";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const maintenanceRecords = await ctx.db.query("maintenance").collect();
    
    // Get vehicle details for each maintenance record
    const recordsWithVehicles = await Promise.all(
      maintenanceRecords.map(async (record) => {
        const vehicle = await ctx.db.get(record.vehicleId);
        return {
          ...record,
          vehicle,
        };
      })
    );

    return recordsWithVehicles;
  },
});

export const getUpcomingAlerts = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const thirtyDaysFromNow = now + (30 * 24 * 60 * 60 * 1000);
    
    // Get maintenance records with upcoming due dates
    const upcomingByDate = await ctx.db
      .query("maintenance")
      .withIndex("by_next_service_due")
      .filter((q) => 
        q.and(
          q.neq(q.field("nextServiceDue"), undefined),
          q.lte(q.field("nextServiceDue"), thirtyDaysFromNow),
          q.gte(q.field("nextServiceDue"), now)
        )
      )
      .collect();

    // Get vehicles and check mileage-based alerts
    const vehicles = await ctx.db.query("vehicles").collect();
    const mileageAlerts = [];

    for (const vehicle of vehicles) {
      const lastMaintenance = await ctx.db
        .query("maintenance")
        .withIndex("by_vehicle", (q) => q.eq("vehicleId", vehicle._id))
        .order("desc")
        .first();

      if (lastMaintenance && lastMaintenance.nextServiceMileage) {
        const mileageUntilService = lastMaintenance.nextServiceMileage - vehicle.currentOdometer;
        if (mileageUntilService <= 1000 && mileageUntilService > 0) {
          mileageAlerts.push({
            ...lastMaintenance,
            vehicle,
            alertType: "mileage",
            mileageUntilService,
          });
        }
      }
    }

    // Combine and format alerts
    const dateAlerts = await Promise.all(
      upcomingByDate.map(async (record) => {
        const vehicle = await ctx.db.get(record.vehicleId);
        return {
          ...record,
          vehicle,
          alertType: "date",
          daysUntilService: Math.ceil((record.nextServiceDue! - now) / (24 * 60 * 60 * 1000)),
        };
      })
    );

    return [...dateAlerts, ...mileageAlerts].sort((a, b) => {
      if (a.alertType === "date" && b.alertType === "date") {
        return a.nextServiceDue! - b.nextServiceDue!;
      }
      if (a.alertType === "mileage" && b.alertType === "mileage") {
        return (a as any).mileageUntilService - (b as any).mileageUntilService;
      }
      return a.alertType === "mileage" ? -1 : 1;
    });
  },
});

export const create = mutation({
  args: {
    vehicleId: v.id("vehicles"),
    type: v.string(),
    description: v.string(),
    cost: v.number(),
    odometerAtService: v.number(),
    nextServiceDue: v.optional(v.number()),
    nextServiceMileage: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const maintenanceId = await ctx.db.insert("maintenance", {
      ...args,
      date: Date.now(),
    });

    // Update maintenance aggregate
    const maintenance = await ctx.db.get(maintenanceId);
    if (maintenance) {
      await maintenanceAggregate.insert(ctx, maintenance);
    }

    return maintenanceId;
  },
});
