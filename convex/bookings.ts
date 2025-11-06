import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { bookingsAggregate, maintenanceAggregate, vehiclesAggregate } from "./aggregates";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const bookings = await ctx.db.query("bookings").collect();
    
    // Get vehicle details for each booking
    const bookingsWithVehicles = await Promise.all(
      bookings.map(async (booking) => {
        const vehicle = await ctx.db.get(booking.vehicleId);
        return {
          ...booking,
          vehicle,
        };
      })
    );

    return bookingsWithVehicles;
  },
});

export const backfillAggregates = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear all aggregates first to prevent duplicates
    await bookingsAggregate.clear(ctx);
    await maintenanceAggregate.clear(ctx);
    await vehiclesAggregate.clear(ctx);

    // Get all bookings and insert into bookings aggregate
    const bookings = await ctx.db.query("bookings").collect();
    for (const booking of bookings) {
      await bookingsAggregate.insert(ctx, booking);
    }

    // Get all maintenance records and insert into maintenance aggregate
    const maintenanceRecords = await ctx.db.query("maintenance").collect();
    for (const record of maintenanceRecords) {
      await maintenanceAggregate.insert(ctx, record);
    }

    // Get all vehicles and insert into vehicles aggregate
    const vehicles = await ctx.db.query("vehicles").collect();
    for (const vehicle of vehicles) {
      await vehiclesAggregate.insert(ctx, vehicle);
    }

    return {
      bookingsCount: bookings.length,
      maintenanceCount: maintenanceRecords.length,
      vehiclesCount: vehicles.length,
    };
  },
});

export const getDailyRevenue = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysToQuery = args.days ?? 90; // Default to 90 days (3 months)
    const now = Date.now();
    const startDate = now - (daysToQuery * 24 * 60 * 60 * 1000);

    // Query all bookings within the date range
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_start_date")
      .filter((q) => q.gte(q.field("endDate"), startDate))
      .collect();

    // Group bookings by day and sum revenue
    const dailyRevenueMap = new Map<string, number>();

    for (const booking of bookings) {
      if (booking.status === "cancelled") continue;

      const date = new Date(booking.endDate);
      const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD format

      const currentRevenue = dailyRevenueMap.get(dateKey) ?? 0;
      dailyRevenueMap.set(dateKey, currentRevenue + booking.totalAmount);
    }

    // Convert to array and sort by date
    const dailyRevenue = Array.from(dailyRevenueMap.entries())
      .map(([date, revenue]) => ({
        date,
        revenue,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return dailyRevenue;
  },
});
