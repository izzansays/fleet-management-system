import { query } from "./_generated/server";
import { bookingsAggregate, maintenanceAggregate, vehiclesAggregate } from "./aggregates";

// Individual query for Total Revenue metric
export const getTotalRevenue = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = now - (60 * 24 * 60 * 60 * 1000);

    // Query completed bookings from the aggregate using status in composite key
    // The key is [status, endDate], so we bound by ["completed", timestamp]
    const current = await bookingsAggregate.sum(ctx, {
      bounds: {
        lower: { key: ["completed", thirtyDaysAgo], inclusive: true },
        upper: { key: ["completed", now], inclusive: true },
      },
    });

    const previous = await bookingsAggregate.sum(ctx, {
      bounds: {
        lower: { key: ["completed", sixtyDaysAgo], inclusive: true },
        upper: { key: ["completed", thirtyDaysAgo], inclusive: false },
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

// Individual query for Average Fleet Utilization metric
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

    // Filter for bookings that overlap with current period and calculate total rental days
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

    // Filter for bookings that overlap with previous period and calculate total rental days
    const previousRentalDays = previousBookings
      .filter((b) => b.endDate >= sixtyDaysAgo && b.startDate < thirtyDaysAgo)
      .reduce((sum, booking) => {
        const bookingStart = Math.max(booking.startDate, sixtyDaysAgo);
        const bookingEnd = Math.min(booking.endDate, thirtyDaysAgo);
        const days = Math.max(0, Math.ceil((bookingEnd - bookingStart) / (1000 * 60 * 60 * 24)));
        return sum + days;
      }, 0);

    // Calculate average utilization across the fleet
    // Formula: (Total rental days / Total possible days) * 100
    // Example: 150 rental days / (30 days * 10 vehicles) * 100 = 50% average utilization
    const vehicleCount = await vehiclesAggregate.count(ctx) || 1; // Avoid division by zero
    const totalPossibleDays = 30 * vehicleCount;
    const current = totalPossibleDays > 0 ? (currentRentalDays / totalPossibleDays) * 100 : 0;
    const previous = totalPossibleDays > 0 ? (previousRentalDays / totalPossibleDays) * 100 : 0;
    const trend = parseFloat((current - previous).toFixed(1));

    // Get count of currently active vehicles (in-use or reserved)
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

// Individual query for Completed Bookings metric
export const getActiveBookings = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = now - (60 * 24 * 60 * 60 * 1000);

    // Get completed bookings for current period (last 30 days)
    const current = await bookingsAggregate.count(ctx, {
      bounds: {
        lower: { key: ["completed", thirtyDaysAgo], inclusive: true },
        upper: { key: ["completed", now], inclusive: true },
      },
    });

    // Get completed bookings for previous period (30-60 days ago)
    const previous = await bookingsAggregate.count(ctx, {
      bounds: {
        lower: { key: ["completed", sixtyDaysAgo], inclusive: true },
        upper: { key: ["completed", thirtyDaysAgo], inclusive: false },
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

// Individual query for Net Profit metric
export const getNetProfit = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = now - (60 * 24 * 60 * 60 * 1000);

    // Get revenue from bookings aggregate (only completed bookings)
    const currentRevenue = await bookingsAggregate.sum(ctx, {
      bounds: {
        lower: { key: ["completed", thirtyDaysAgo], inclusive: true },
        upper: { key: ["completed", now], inclusive: true },
      },
    });

    const previousRevenue = await bookingsAggregate.sum(ctx, {
      bounds: {
        lower: { key: ["completed", sixtyDaysAgo], inclusive: true },
        upper: { key: ["completed", thirtyDaysAgo], inclusive: false },
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
    const monthlyAcquisitionCost = totalAcquisitionCost / 60; // Amortize over 5 years (standard vehicle depreciation)

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
    
    // Calculate total revenue (from completed bookings)
    const totalRevenue = completedBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);

    // Calculate total costs (maintenance + depreciation, NOT full acquisition cost)
    // Using realistic approach: maintenance costs + depreciation expense
    const totalAcquisitionCosts = await vehiclesAggregate.sum(ctx) ?? 0;
    const totalMaintenanceCosts = maintenanceRecords.reduce((sum, record) => sum + record.cost, 0);

    // Calculate average vehicle age in months to determine depreciation
    const avgVehicleAgeMonths = vehicles.length > 0
      ? vehicles.reduce((sum, v) => sum + Math.max(1, Math.ceil((Date.now() - v._creationTime) / (1000 * 60 * 60 * 24 * 30))), 0) / vehicles.length
      : 3;

    // Depreciation expense = (Total Acquisition / 60 months) * average age in months
    const depreciationExpense = (totalAcquisitionCosts / 60) * avgVehicleAgeMonths;
    const totalCosts = depreciationExpense + totalMaintenanceCosts;
    
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
      totalRevenue, // All-time revenue from completed bookings
      totalCosts, // Depreciation expense (based on vehicle age) + maintenance costs
      netProfit: totalRevenue - totalCosts, // Operating profit after depreciation
      utilizationRate,
      totalVehicles: vehicles.length,
      fleetStatus,
      totalBookings: completedBookings.length,
      averageBookingValue: completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0,
    };
  },
});

export const getBreakEvenAnalysis = query({
  args: {},
  handler: async (ctx) => {
    const vehicles = await ctx.db.query("vehicles").collect();

    const breakEvenData = await Promise.all(
      vehicles.map(async (vehicle) => {
        const completedBookings = await ctx.db
          .query("bookings")
          .withIndex("by_vehicle", (q) => q.eq("vehicleId", vehicle._id))
          .filter((q) => q.eq(q.field("status"), "completed"))
          .collect();

        const maintenanceRecords = await ctx.db
          .query("maintenance")
          .withIndex("by_vehicle", (q) => q.eq("vehicleId", vehicle._id))
          .collect();

        const totalRevenue = completedBookings.reduce((sum, b) => sum + b.totalAmount, 0);
        const totalMaintenanceCosts = maintenanceRecords.reduce((sum, m) => sum + m.cost, 0);
        const netRevenue = totalRevenue - totalMaintenanceCosts;

        // Calculate days since acquisition
        const daysSinceAcquisition = Math.max(1, Math.ceil((Date.now() - vehicle._creationTime) / (1000 * 60 * 60 * 24)));

        // Calculate break-even metrics
        const hasReachedBreakEven = netRevenue >= vehicle.acquisitionCost;
        const breakEvenProgress = vehicle.acquisitionCost > 0 ? (netRevenue / vehicle.acquisitionCost) * 100 : 0;

        // Calculate projected days to break-even based on current daily net revenue
        const dailyNetRevenue = netRevenue / daysSinceAcquisition;
        const projectedDaysToBreakEven = dailyNetRevenue > 0 && !hasReachedBreakEven
          ? Math.ceil((vehicle.acquisitionCost - netRevenue) / dailyNetRevenue)
          : null;

        return {
          vehicleId: vehicle._id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          licensePlate: vehicle.licensePlate,
          acquisitionCost: vehicle.acquisitionCost,
          totalRevenue,
          totalMaintenanceCosts,
          netRevenue,
          daysSinceAcquisition,
          hasReachedBreakEven,
          breakEvenProgress: Math.min(breakEvenProgress, 100),
          projectedDaysToBreakEven,
          dailyNetRevenue,
        };
      })
    );

    // Sort by break-even progress (closest to break-even first for those not yet reached)
    return breakEvenData.sort((a, b) => {
      if (a.hasReachedBreakEven && !b.hasReachedBreakEven) return -1;
      if (!a.hasReachedBreakEven && b.hasReachedBreakEven) return 1;
      return b.breakEvenProgress - a.breakEvenProgress;
    });
  },
});

// Vehicle category-based analytics grouped by category
export const getVehicleCategoryAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const vehicles = await ctx.db.query("vehicles").collect();

    // Group vehicles by category
    const categoryMap = new Map<string, typeof vehicles>();
    for (const vehicle of vehicles) {
      const category = vehicle.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(vehicle);
    }

    // Calculate metrics for each category
    const categoryAnalytics = await Promise.all(
      Array.from(categoryMap.entries()).map(async ([category, categoryVehicles]) => {
        // Aggregate data across all vehicles in this category
        let totalRevenue = 0;
        let totalAcquisitionCost = 0;
        let totalMaintenanceCosts = 0;
        let totalBookings = 0;
        let totalRentalDays = 0;
        let totalDaysSinceAcquisition = 0;

        for (const vehicle of categoryVehicles) {
          const completedBookings = await ctx.db
            .query("bookings")
            .withIndex("by_vehicle", (q) => q.eq("vehicleId", vehicle._id))
            .filter((q) => q.eq(q.field("status"), "completed"))
            .collect();

          const maintenanceRecords = await ctx.db
            .query("maintenance")
            .withIndex("by_vehicle", (q) => q.eq("vehicleId", vehicle._id))
            .collect();

          totalRevenue += completedBookings.reduce((sum, b) => sum + b.totalAmount, 0);
          totalAcquisitionCost += vehicle.acquisitionCost;
          totalMaintenanceCosts += maintenanceRecords.reduce((sum, m) => sum + m.cost, 0);
          totalBookings += completedBookings.length;

          // Calculate rental days
          const rentalDays = completedBookings.reduce((sum, b) => {
            const days = Math.ceil((b.endDate - b.startDate) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0);
          totalRentalDays += rentalDays;

          const daysSinceAcquisition = Math.max(1, Math.ceil((Date.now() - vehicle._creationTime) / (1000 * 60 * 60 * 24)));
          totalDaysSinceAcquisition += daysSinceAcquisition;
        }

        const vehicleCount = categoryVehicles.length;

        // Calculate depreciation expense based on average vehicle age
        const avgAgeMonths = totalDaysSinceAcquisition > 0
          ? (totalDaysSinceAcquisition / vehicleCount) / 30
          : 3;
        const depreciationExpense = (totalAcquisitionCost / 60) * avgAgeMonths;

        // Net profit = Revenue - (Depreciation + Maintenance), not full acquisition cost
        const netProfit = totalRevenue - depreciationExpense - totalMaintenanceCosts;
        const roi = totalAcquisitionCost > 0 ? (netProfit / totalAcquisitionCost) * 100 : 0;
        const avgRevenuePerVehicle = vehicleCount > 0 ? totalRevenue / vehicleCount : 0;
        const avgUtilizationRate = totalDaysSinceAcquisition > 0 ? (totalRentalDays / totalDaysSinceAcquisition) * 100 : 0;
        const revenuePerDay = totalDaysSinceAcquisition > 0 ? totalRevenue / totalDaysSinceAcquisition : 0;

        return {
          category,
          vehicleCount,
          totalRevenue,
          totalAcquisitionCost,
          totalMaintenanceCosts,
          netProfit,
          roi,
          totalBookings,
          avgRevenuePerVehicle,
          avgUtilizationRate,
          revenuePerDay,
          totalRentalDays,
        };
      })
    );

    // Sort by net profit descending
    return categoryAnalytics.sort((a, b) => b.netProfit - a.netProfit);
  },
});
