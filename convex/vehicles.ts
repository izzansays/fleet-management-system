import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("vehicles").collect();
  },
});

export const getById = query({
  args: { vehicleId: v.id("vehicles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.vehicleId);
  },
});

export const updateLocation = mutation({
  args: {
    vehicleId: v.id("vehicles"),
    latitude: v.number(),
    longitude: v.number(),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    // Update vehicle's current location
    await ctx.db.patch(args.vehicleId, {
      currentLatitude: args.latitude,
      currentLongitude: args.longitude,
      lastLocationUpdate: timestamp,
    });

    // Add to location history
    await ctx.db.insert("vehicleLocationHistory", {
      vehicleId: args.vehicleId,
      latitude: args.latitude,
      longitude: args.longitude,
      timestamp,
    });
  },
});

export const updateOdometer = mutation({
  args: {
    vehicleId: v.id("vehicles"),
    reading: v.number(),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    // Update vehicle's current odometer
    await ctx.db.patch(args.vehicleId, {
      currentOdometer: args.reading,
      lastOdometerUpdate: timestamp,
    });

    // Add to odometer history
    await ctx.db.insert("vehicleOdometerHistory", {
      vehicleId: args.vehicleId,
      reading: args.reading,
      timestamp,
    });
  },
});

export const updateStatus = mutation({
  args: {
    vehicleId: v.id("vehicles"),
    status: v.union(
      v.literal("available"),
      v.literal("reserved"),
      v.literal("in-use"),
      v.literal("maintenance")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.vehicleId, {
      status: args.status,
    });
  },
});

export const getVehicleProfitability = query({
  args: { vehicleId: v.id("vehicles") },
  handler: async (ctx, args) => {
    const vehicle = await ctx.db.get(args.vehicleId);
    if (!vehicle) return null;

    // Get all completed bookings for this vehicle
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_vehicle", (q) => q.eq("vehicleId", args.vehicleId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    // Get all maintenance costs for this vehicle
    const maintenanceRecords = await ctx.db
      .query("maintenance")
      .withIndex("by_vehicle", (q) => q.eq("vehicleId", args.vehicleId))
      .collect();

    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
    const totalMaintenanceCosts = maintenanceRecords.reduce((sum, record) => sum + record.cost, 0);
    const netProfit = totalRevenue - vehicle.acquisitionCost - totalMaintenanceCosts;

    return {
      vehicle,
      totalRevenue,
      acquisitionCost: vehicle.acquisitionCost,
      totalMaintenanceCosts,
      netProfit,
      bookingCount: bookings.length,
      maintenanceCount: maintenanceRecords.length,
    };
  },
});

export const getVehicleDetails = query({
  args: { vehicleId: v.id("vehicles") },
  handler: async (ctx, args) => {
    const vehicle = await ctx.db.get(args.vehicleId);
    if (!vehicle) return null;

    // Get all bookings for this vehicle
    const allBookings = await ctx.db
      .query("bookings")
      .withIndex("by_vehicle", (q) => q.eq("vehicleId", args.vehicleId))
      .order("desc")
      .collect();

    // Get completed bookings for financial calculations
    const completedBookings = allBookings.filter((b) => b.status === "completed");

    // Get last 5 bookings
    const recentBookings = allBookings.slice(0, 5);

    // Calculate booking statistics
    const totalRevenue = completedBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
    const totalBookingDays = completedBookings.reduce((sum, booking) => {
      const days = Math.ceil((booking.endDate - booking.startDate) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);
    const avgBookingDuration = completedBookings.length > 0 ? totalBookingDays / completedBookings.length : 0;
    const avgDailyRate = completedBookings.length > 0 ? completedBookings.reduce((sum, b) => sum + b.dailyRate, 0) / completedBookings.length : 0;
    const avgRevenuePerBooking = completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0;

    // Get all maintenance records for this vehicle
    const allMaintenance = await ctx.db
      .query("maintenance")
      .withIndex("by_vehicle", (q) => q.eq("vehicleId", args.vehicleId))
      .order("desc")
      .collect();

    // Get last 5 maintenance records
    const recentMaintenance = allMaintenance.slice(0, 5);

    // Calculate maintenance statistics
    const totalMaintenanceCost = allMaintenance.reduce((sum, record) => sum + record.cost, 0);

    // Get upcoming service alerts for this vehicle
    const now = Date.now();
    const thirtyDaysFromNow = now + (30 * 24 * 60 * 60 * 1000);
    
    const upcomingServiceAlerts = allMaintenance.filter((record) => {
      if (record.nextServiceDue && record.nextServiceDue >= now && record.nextServiceDue <= thirtyDaysFromNow) {
        return true;
      }
      if (record.nextServiceMileage && vehicle.currentOdometer) {
        const mileageUntilService = record.nextServiceMileage - vehicle.currentOdometer;
        if (mileageUntilService <= 1000 && mileageUntilService > 0) {
          return true;
        }
      }
      return false;
    });

    // Calculate financial metrics
    const netProfit = totalRevenue - vehicle.acquisitionCost - totalMaintenanceCost;
    const roi = vehicle.acquisitionCost > 0 ? (netProfit / vehicle.acquisitionCost) * 100 : 0;

    return {
      vehicle,
      financial: {
        acquisitionCost: vehicle.acquisitionCost,
        totalRevenue,
        totalMaintenanceCost,
        netProfit,
        roi,
      },
      bookingHistory: {
        recentBookings,
        totalBookings: allBookings.length,
        completedBookings: completedBookings.length,
        avgBookingDuration,
        avgDailyRate,
        avgRevenuePerBooking,
      },
      maintenanceHistory: {
        recentMaintenance,
        totalMaintenanceRecords: allMaintenance.length,
        upcomingServiceAlerts,
      },
    };
  },
});
