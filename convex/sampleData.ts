import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createSampleData = mutation({
  args: {},
  handler: async (ctx) => {
    // Create sample vehicles
    const vehicle1 = await ctx.db.insert("vehicles", {
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

    const vehicle2 = await ctx.db.insert("vehicles", {
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

    const vehicle3 = await ctx.db.insert("vehicles", {
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

    // Create sample bookings
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    await ctx.db.insert("bookings", {
      vehicleId: vehicle1,
      customerName: "John Smith",
      customerEmail: "john@example.com",
      startDate: now - (7 * oneDay),
      endDate: now - (4 * oneDay),
      dailyRate: 45,
      totalAmount: 135,
      status: "completed",
    });

    await ctx.db.insert("bookings", {
      vehicleId: vehicle2,
      customerName: "Sarah Johnson",
      customerEmail: "sarah@example.com",
      startDate: now - (2 * oneDay),
      endDate: now + (3 * oneDay),
      dailyRate: 40,
      totalAmount: 200,
      status: "active",
    });

    await ctx.db.insert("bookings", {
      vehicleId: vehicle1,
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
      vehicleId: vehicle1,
      date: now - (30 * oneDay),
      type: "Oil Change",
      description: "Regular oil change and filter replacement",
      cost: 75,
      odometerAtService: 14500,
      nextServiceDue: now + (60 * oneDay),
      nextServiceMileage: 18000,
    });

    await ctx.db.insert("maintenance", {
      vehicleId: vehicle2,
      date: now - (15 * oneDay),
      type: "Tire Rotation",
      description: "Rotated tires and checked alignment",
      cost: 50,
      odometerAtService: 8000,
      nextServiceDue: now + (75 * oneDay),
      nextServiceMileage: 12000,
    });

    await ctx.db.insert("maintenance", {
      vehicleId: vehicle3,
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
