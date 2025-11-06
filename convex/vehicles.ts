import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("vehicles").collect();
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

// Mutation to backfill category field on existing vehicles
export const backfillVehicleCategories = mutation({
  args: {},
  handler: async (ctx) => {
    const vehicles = await ctx.db.query("vehicles").collect();

    // Map make/model combinations to categories based on seed data patterns
    const getCategoryForVehicle = (make: string, model: string, type?: string) => {
      // Economy Cars
      if ((make === "Toyota" && model === "Corolla") ||
          (make === "Honda" && model === "Civic") ||
          (make === "Hyundai" && model === "Elantra")) {
        return "Economy Cars";
      }

      // Mid-size SUVs
      if ((make === "Toyota" && model === "RAV4") ||
          (make === "Honda" && model === "CR-V") ||
          (make === "Mazda" && model === "CX-5")) {
        return "Mid-size SUVs";
      }

      // Luxury Sedans
      if ((make === "Tesla" && model === "Model 3") ||
          (make === "BMW" && model === "3 Series") ||
          (make === "Mercedes-Benz" && model === "C-Class")) {
        return "Luxury Sedans";
      }

      // Large SUVs
      if ((make === "Chevrolet" && model === "Tahoe") ||
          (make === "Ford" && model === "Explorer") ||
          (make === "Toyota" && model === "Highlander")) {
        return "Large SUVs";
      }

      // Trucks
      if ((make === "Ford" && model === "F-150") ||
          (make === "Chevrolet" && model === "Silverado")) {
        return "Trucks";
      }

      // Fallback: determine category based on type if available
      if (type === "Truck") return "Trucks";
      if (type === "SUV") return "Mid-size SUVs"; // Default SUVs to mid-size
      return "Economy Cars"; // Default sedans to economy
    };

    let updated = 0;
    for (const vehicle of vehicles) {
      // Skip if category already exists
      if ("category" in vehicle && vehicle.category) continue;

      const category = getCategoryForVehicle(vehicle.make, vehicle.model);
      await ctx.db.patch(vehicle._id, { category });
      updated++;
    }

    return {
      message: `Successfully backfilled ${updated} vehicle categories`,
      totalVehicles: vehicles.length,
      updated,
    };
  },
});
