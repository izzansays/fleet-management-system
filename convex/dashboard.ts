import { query } from "./_generated/server";
import { bookingsAggregate, maintenanceAggregate, vehiclesAggregate } from "./aggregates";

// Individual query for Total Revenue metric
export const getTotalRevenue = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = now - (60 * 24 * 60 * 60 * 1000);

    // Query completed bookings from the aggregate
    const current = await bookingsAggregate.sum(ctx, {
      bounds: {
        lower: { key: thirtyDaysAgo, inclusive: true },
        upper: { key: now, inclusive: true },
      },
    });

    const previous = await bookingsAggregate.sum(ctx, {
      bounds: {
        lower: { key: sixtyDaysAgo, inclusive: true },
        upper: { key: thirtyDaysAgo, inclusive: false },
      },
    });

    const currentVal = current ?? 0;
    const previousVal = previous ?? 0;
    const trend = previousVal > 0 ? parseFloat((((currentVal - previousVal) / previousVal) * 100).toFixed(1)) : 0;

    return {
      current: currentVal,
      previous: previousVal,
      trend,
    };
  },
});

// Individual query for Fleet Utilization metric
export const getFleetUtilization = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = now - (60 * 24 * 60 * 60 * 1000);

    // Get bookings for current period using indexed query
    const currentBookings = await ctx.db
      .query("bookings")
      .withIndex("by_start_date")
      .filter((q) => q.lte(q.field("startDate"), now))
      .collect();

    // Filter for bookings that overlap with current period
    const currentRentalDays = currentBookings
      .filter((b) => b.endDate >= thirtyDaysAgo && b.startDate <= now)
      .reduce((sum, booking) => {
        const bookingStart = Math.max(booking.startDate, thirtyDaysAgo);
        const bookingEnd = Math.min(booking.endDate, now);
        const days = Math.max(0, Math.ceil((bookingEnd - bookingStart) / (1000 * 60 * 60 * 24)));
        return sum + days;
      }, 0);

    // Get bookings for previous period using indexed query
    const previousBookings = await ctx.db
      .query("bookings")
      .withIndex("by_start_date")
      .filter((q) => q.lte(q.field("startDate"), thirtyDaysAgo))
      .collect();

    // Filter for bookings that overlap with previous period
    const previousRentalDays = previousBookings
      .filter((b) => b.endDate >= sixtyDaysAgo && b.startDate < thirtyDaysAgo)
      .reduce((sum, booking) => {
        const bookingStart = Math.max(booking.startDate, sixtyDaysAgo);
        const bookingEnd = Math.min(booking.endDate, thirtyDaysAgo);
        const days = Math.max(0, Math.ceil((bookingEnd - bookingStart) / (1000 * 60 * 60 * 24)));
        return sum + days;
      }, 0);

    // Get vehicle count from aggregate
    const vehicleCount = await vehiclesAggregate.count(ctx) || 1; // Avoid division by zero

    const totalPossibleDays = 30 * vehicleCount;
    const current = totalPossibleDays > 0 ? (currentRentalDays / totalPossibleDays) * 100 : 0;
    const previous = totalPossibleDays > 0 ? (previousRentalDays / totalPossibleDays) * 100 : 0;
    const trend = parseFloat((current - previous).toFixed(1));

    // Get active vehicles count
    const inUseVehicles = await ctx.db
      .query("vehicles")
      .withIndex("by_status", (q) => q.eq("status", "in-use"))
      .collect();
    
    const reservedVehicles = await ctx.db
      .query("vehicles")
      .withIndex("by_status", (q) => q.eq("status", "reserved"))
      .collect();
    
    const activeVehicles = inUseVehicles.length + reservedVehicles.length;

    return {
      current,
      previous,
      trend,
      activeVehicles,
    };
  },
});

// Individual query for Active Bookings metric
export const getActiveBookings = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = now - (60 * 24 * 60 * 60 * 1000);

    // Get current active bookings (confirmed + active status)
    const confirmedBookings = await ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("status", "confirmed"))
      .collect();
    
    const activeStatusBookings = await ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    
    const current = confirmedBookings.length + activeStatusBookings.length;

    // For trend comparison, use count of completed bookings from previous period
    const previous = await bookingsAggregate.count(ctx, {
      bounds: {
        lower: { key: sixtyDaysAgo, inclusive: true },
        upper: { key: thirtyDaysAgo, inclusive: false },
      },
    });

    const previousVal = previous ?? 0;
    const trend = previousVal > 0 ? parseFloat((((current - previousVal) / previousVal) * 100).toFixed(1)) : 0;

    return {
      current,
      previous: previousVal,
      trend,
    };
  },
});

// Individual query for Net Profit metric
export const getNetProfit = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = now - (60 * 24 * 60 * 60 * 1000);

    // Get revenue from bookings aggregate
    const currentRevenue = await bookingsAggregate.sum(ctx, {
      bounds: {
        lower: { key: thirtyDaysAgo, inclusive: true },
        upper: { key: now, inclusive: true },
      },
    });
    
    const previousRevenue = await bookingsAggregate.sum(ctx, {
      bounds: {
        lower: { key: sixtyDaysAgo, inclusive: true },
        upper: { key: thirtyDaysAgo, inclusive: false },
      },
    });

    // Get maintenance costs from aggregate
    const currentMaintenanceCosts = await maintenanceAggregate.sum(ctx, {
      bounds: {
        lower: { key: thirtyDaysAgo, inclusive: true },
        upper: { key: now, inclusive: true },
      },
    });
    
    const previousMaintenanceCosts = await maintenanceAggregate.sum(ctx, {
      bounds: {
        lower: { key: sixtyDaysAgo, inclusive: true },
        upper: { key: thirtyDaysAgo, inclusive: false },
      },
    });

    // Get total acquisition costs from aggregate (amortized monthly)
    const totalAcquisitionCost = await vehiclesAggregate.sum(ctx) ?? 0;
    const monthlyAcquisitionCost = totalAcquisitionCost / 12; // Amortize over 1 year

    const currentRevenueVal = currentRevenue ?? 0;
    const previousRevenueVal = previousRevenue ?? 0;
    const currentMaintenanceVal = currentMaintenanceCosts ?? 0;
    const previousMaintenanceVal = previousMaintenanceCosts ?? 0;

    const current = currentRevenueVal - currentMaintenanceVal - monthlyAcquisitionCost;
    const previous = previousRevenueVal - previousMaintenanceVal - monthlyAcquisitionCost;

    const trend = previous !== 0 
      ? parseFloat((((current - previous) / Math.abs(previous)) * 100).toFixed(1)) 
      : 0;
    
    const profitMargin = currentRevenueVal > 0 ? (current / currentRevenueVal) * 100 : 0;

    return {
      current,
      previous,
      trend,
      profitMargin,
    };
  },
});

// Combined query for backward compatibility  
export const getDashboardCardMetrics = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = now - (60 * 24 * 60 * 60 * 1000);

    // Get Total Revenue
    const revenueCurrentSum = await bookingsAggregate.sum(ctx, {
      bounds: { lower: { key: thirtyDaysAgo, inclusive: true }, upper: { key: now, inclusive: true } },
    });
    const revenuePreviousSum = await bookingsAggregate.sum(ctx, {
      bounds: { lower: { key: sixtyDaysAgo, inclusive: true }, upper: { key: thirtyDaysAgo, inclusive: false } },
    });
    const revenueCurrent = revenueCurrentSum ?? 0;
    const revenuePrevious = revenuePreviousSum ?? 0;
    const revenueTrend = revenuePrevious > 0 ? parseFloat((((revenueCurrent - revenuePrevious) / revenuePrevious) * 100).toFixed(1)) : 0;

    // Get Net Profit
    const currentRevenue = await bookingsAggregate.sum(ctx, {
      bounds: { lower: { key: thirtyDaysAgo, inclusive: true }, upper: { key: now, inclusive: true } },
    });
    const previousRevenue = await bookingsAggregate.sum(ctx, {
      bounds: { lower: { key: sixtyDaysAgo, inclusive: true }, upper: { key: thirtyDaysAgo, inclusive: false } },
    });
    const currentMaintenanceCosts = await maintenanceAggregate.sum(ctx, {
      bounds: { lower: { key: thirtyDaysAgo, inclusive: true }, upper: { key: now, inclusive: true } },
    });
    const previousMaintenanceCosts = await maintenanceAggregate.sum(ctx, {
      bounds: { lower: { key: sixtyDaysAgo, inclusive: true }, upper: { key: thirtyDaysAgo, inclusive: false } },
    });
    const totalAcquisitionCost = await vehiclesAggregate.sum(ctx) ?? 0;
    const monthlyAcquisitionCost = totalAcquisitionCost / 12;
    const profitCurrent = (currentRevenue ?? 0) - (currentMaintenanceCosts ?? 0) - monthlyAcquisitionCost;
    const profitPrevious = (previousRevenue ?? 0) - (previousMaintenanceCosts ?? 0) - monthlyAcquisitionCost;
    const profitTrend = profitPrevious !== 0 ? parseFloat((((profitCurrent - profitPrevious) / Math.abs(profitPrevious)) * 100).toFixed(1)) : 0;
    const profitMargin = (currentRevenue ?? 0) > 0 ? (profitCurrent / (currentRevenue ?? 0)) * 100 : 0;

    // Get Fleet Utilization - Get bookings for current period using indexed query
    const currentUtilBookings = await ctx.db
      .query("bookings")
      .withIndex("by_start_date")
      .filter((q) => q.lte(q.field("startDate"), now))
      .collect();
    const currentRentalDays = currentUtilBookings
      .filter((b) => b.endDate >= thirtyDaysAgo && b.startDate <= now)
      .reduce((sum, booking) => {
        const bookingStart = Math.max(booking.startDate, thirtyDaysAgo);
        const bookingEnd = Math.min(booking.endDate, now);
        return sum + Math.max(0, Math.ceil((bookingEnd - bookingStart) / (1000 * 60 * 60 * 24)));
      }, 0);

    // Get bookings for previous period using indexed query
    const previousUtilBookings = await ctx.db
      .query("bookings")
      .withIndex("by_start_date")
      .filter((q) => q.lte(q.field("startDate"), thirtyDaysAgo))
      .collect();
    const previousRentalDays = previousUtilBookings
      .filter((b) => b.endDate >= sixtyDaysAgo && b.startDate < thirtyDaysAgo)
      .reduce((sum, booking) => {
        const bookingStart = Math.max(booking.startDate, sixtyDaysAgo);
        const bookingEnd = Math.min(booking.endDate, thirtyDaysAgo);
        return sum + Math.max(0, Math.ceil((bookingEnd - bookingStart) / (1000 * 60 * 60 * 24)));
      }, 0);
    const vehicleCount = await vehiclesAggregate.count(ctx) || 1;
    const totalPossibleDays = 30 * vehicleCount;
    const utilizationCurrent = (currentRentalDays / totalPossibleDays) * 100;
    const utilizationPrevious = (previousRentalDays / totalPossibleDays) * 100;
    const utilizationTrend = parseFloat((utilizationCurrent - utilizationPrevious).toFixed(1));
    const inUse = await ctx.db.query("vehicles").withIndex("by_status", (q) => q.eq("status", "in-use")).collect();
    const reserved = await ctx.db.query("vehicles").withIndex("by_status", (q) => q.eq("status", "reserved")).collect();
    const activeVehicles = inUse.length + reserved.length;

    // Get Active Bookings
    const confirmed = await ctx.db.query("bookings").withIndex("by_status", (q) => q.eq("status", "confirmed")).collect();
    const active = await ctx.db.query("bookings").withIndex("by_status", (q) => q.eq("status", "active")).collect();
    const bookingsCurrent = confirmed.length + active.length;
    const bookingsPrevious = await bookingsAggregate.count(ctx, {
      bounds: { lower: { key: sixtyDaysAgo, inclusive: true }, upper: { key: thirtyDaysAgo, inclusive: false } },
    });
    const bookingsPreviousVal = bookingsPrevious ?? 0;
    const bookingsTrend = bookingsPreviousVal > 0 ? parseFloat((((bookingsCurrent - bookingsPreviousVal) / bookingsPreviousVal) * 100).toFixed(1)) : 0;

    return {
      totalRevenue: {
        current: revenueCurrent,
        previous: revenuePrevious,
        trend: revenueTrend,
      },
      netProfit: {
        current: profitCurrent,
        previous: profitPrevious,
        trend: profitTrend,
        profitMargin,
      },
      fleetUtilization: {
        current: utilizationCurrent,
        previous: utilizationPrevious,
        trend: utilizationTrend,
        activeVehicles,
      },
      activeBookings: {
        current: bookingsCurrent,
        previous: bookingsPreviousVal,
        trend: bookingsTrend,
      },
    };
  },
});

export const getOverviewMetrics = query({
  args: {},
  handler: async (ctx) => {
    // Get all vehicles
    const vehicles = await ctx.db.query("vehicles").collect();
    
    // Get all completed bookings
    const completedBookings = await ctx.db
      .query("bookings")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .collect();
    
    // Get all maintenance records
    const maintenanceRecords = await ctx.db.query("maintenance").collect();
    
    // Calculate total revenue
    const totalRevenue = completedBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);

    // Calculate total costs (acquisition + maintenance)
    const totalAcquisitionCosts = await vehiclesAggregate.sum(ctx) ?? 0;
    const totalMaintenanceCosts = maintenanceRecords.reduce((sum, record) => sum + record.cost, 0);
    const totalCosts = totalAcquisitionCosts + totalMaintenanceCosts;
    
    // Calculate utilization rate
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    const recentBookings = await ctx.db
      .query("bookings")
      .withIndex("by_start_date")
      .filter((q) => q.gte(q.field("startDate"), thirtyDaysAgo))
      .collect();
    
    // Calculate total possible rental days (30 days * number of vehicles)
    const totalPossibleDays = 30 * vehicles.length;
    
    // Calculate actual rental days
    const actualRentalDays = recentBookings.reduce((sum, booking) => {
      const bookingStart = Math.max(booking.startDate, thirtyDaysAgo);
      const bookingEnd = Math.min(booking.endDate, now);
      const days = Math.max(0, Math.ceil((bookingEnd - bookingStart) / (1000 * 60 * 60 * 24)));
      return sum + days;
    }, 0);
    
    const utilizationRate = totalPossibleDays > 0 ? (actualRentalDays / totalPossibleDays) * 100 : 0;
    
    // Get fleet status breakdown
    const fleetStatus = {
      available: vehicles.filter(v => v.status === "available").length,
      reserved: vehicles.filter(v => v.status === "reserved").length,
      inUse: vehicles.filter(v => v.status === "in-use").length,
      maintenance: vehicles.filter(v => v.status === "maintenance").length,
    };
    
    return {
      totalRevenue,
      totalCosts,
      netProfit: totalRevenue - totalCosts,
      utilizationRate,
      totalVehicles: vehicles.length,
      fleetStatus,
      totalBookings: completedBookings.length,
      averageBookingValue: completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0,
    };
  },
});

export const getVehicleProfitabilityList = query({
  args: {},
  handler: async (ctx) => {
    const vehicles = await ctx.db.query("vehicles").collect();
    
    const profitabilityData = await Promise.all(
      vehicles.map(async (vehicle) => {
        // Get completed bookings for this vehicle
        const bookings = await ctx.db
          .query("bookings")
          .withIndex("by_vehicle", (q) => q.eq("vehicleId", vehicle._id))
          .filter((q) => q.eq(q.field("status"), "completed"))
          .collect();
        
        // Get maintenance costs for this vehicle
        const maintenanceRecords = await ctx.db
          .query("maintenance")
          .withIndex("by_vehicle", (q) => q.eq("vehicleId", vehicle._id))
          .collect();
        
        const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
        const totalMaintenanceCosts = maintenanceRecords.reduce((sum, record) => sum + record.cost, 0);
        const netProfit = totalRevenue - vehicle.acquisitionCost - totalMaintenanceCosts;
        const roi = vehicle.acquisitionCost > 0 ? (netProfit / vehicle.acquisitionCost) * 100 : 0;
        
        return {
          vehicle,
          totalRevenue,
          acquisitionCost: vehicle.acquisitionCost,
          totalMaintenanceCosts,
          netProfit,
          roi,
          bookingCount: bookings.length,
        };
      })
    );
    
    return profitabilityData.sort((a, b) => b.netProfit - a.netProfit);
  },
});
