import { mutation } from "./_generated/server";
import { vehiclesAggregate } from "./aggregates";

export const createSampleData = mutation({
  args: {},
  handler: async (ctx) => {
    // Create sample vehicles
    const vehicle1Id = await ctx.db.insert("vehicles", {
      make: "Toyota",
      model: "Camry",
      year: 2022,
      licensePlate: "ABC123",
      vin: "1HGBH41JXMN109186",
      acquisitionCost: 25000,
      status: "available",
      currentLatitude: 40.7128,
      currentLongitude: -74.0060,
      lastLocationUpdate: Date.now(),
      currentOdometer: 15000,
      lastOdometerUpdate: Date.now(),
    });
    const vehicle1 = await ctx.db.get(vehicle1Id);
    if (vehicle1) await vehiclesAggregate.insert(ctx, vehicle1);

    const vehicle2Id = await ctx.db.insert("vehicles", {
      make: "Honda",
      model: "Civic",
      year: 2023,
      licensePlate: "XYZ789",
      vin: "2HGFC2F59NH123456",
      acquisitionCost: 22000,
      status: "in-use",
      currentLatitude: 40.7589,
      currentLongitude: -73.9851,
      lastLocationUpdate: Date.now(),
      currentOdometer: 8500,
      lastOdometerUpdate: Date.now(),
    });
    const vehicle2 = await ctx.db.get(vehicle2Id);
    if (vehicle2) await vehiclesAggregate.insert(ctx, vehicle2);

    const vehicle3Id = await ctx.db.insert("vehicles", {
      make: "Ford",
      model: "Escape",
      year: 2021,
      licensePlate: "DEF456",
      vin: "1FMCU9HD5MUA12345",
      acquisitionCost: 28000,
      status: "maintenance",
      currentLatitude: 40.7505,
      currentLongitude: -73.9934,
      lastLocationUpdate: Date.now(),
      currentOdometer: 32000,
      lastOdometerUpdate: Date.now(),
    });
    const vehicle3 = await ctx.db.get(vehicle3Id);
    if (vehicle3) await vehiclesAggregate.insert(ctx, vehicle3);

    // Create sample bookings
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    await ctx.db.insert("bookings", {
      vehicleId: vehicle1Id,
      customerName: "John Smith",
      customerEmail: "john@example.com",
      startDate: now - (7 * oneDay),
      endDate: now - (4 * oneDay),
      dailyRate: 45,
      totalAmount: 135,
      status: "completed",
    });

    await ctx.db.insert("bookings", {
      vehicleId: vehicle2Id,
      customerName: "Sarah Johnson",
      customerEmail: "sarah@example.com",
      startDate: now - (2 * oneDay),
      endDate: now + (3 * oneDay),
      dailyRate: 40,
      totalAmount: 200,
      status: "active",
    });

    await ctx.db.insert("bookings", {
      vehicleId: vehicle1Id,
      customerName: "Mike Davis",
      customerEmail: "mike@example.com",
      startDate: now + (5 * oneDay),
      endDate: now + (8 * oneDay),
      dailyRate: 45,
      totalAmount: 135,
      status: "confirmed",
    });

    // Create sample maintenance records
    await ctx.db.insert("maintenance", {
      vehicleId: vehicle1Id,
      date: now - (30 * oneDay),
      type: "Oil Change",
      description: "Regular oil change and filter replacement",
      cost: 75,
      odometerAtService: 14500,
      nextServiceDue: now + (60 * oneDay),
      nextServiceMileage: 18000,
    });

    await ctx.db.insert("maintenance", {
      vehicleId: vehicle2Id,
      date: now - (15 * oneDay),
      type: "Tire Rotation",
      description: "Rotated tires and checked alignment",
      cost: 50,
      odometerAtService: 8000,
      nextServiceDue: now + (75 * oneDay),
      nextServiceMileage: 12000,
    });

    await ctx.db.insert("maintenance", {
      vehicleId: vehicle3Id,
      date: now - (5 * oneDay),
      type: "Brake Repair",
      description: "Replaced brake pads and rotors",
      cost: 450,
      odometerAtService: 31800,
      nextServiceDue: now + (180 * oneDay),
      nextServiceMileage: 40000,
    });

    return "Sample data created successfully!";
  },
});
