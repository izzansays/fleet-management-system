import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { bookingsAggregate } from "./aggregates";

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

export const create = mutation({
  args: {
    vehicleId: v.id("vehicles"),
    customerName: v.string(),
    customerEmail: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    dailyRate: v.number(),
  },
  handler: async (ctx, args) => {
    const days = Math.ceil((args.endDate - args.startDate) / (1000 * 60 * 60 * 24));
    const totalAmount = days * args.dailyRate;

    const bookingId = await ctx.db.insert("bookings", {
      ...args,
      totalAmount,
      status: "confirmed",
    });

    // Update vehicle status to reserved
    await ctx.db.patch(args.vehicleId, {
      status: "reserved",
    });

    // Update bookings aggregate
    const booking = await ctx.db.get(bookingId);
    if (booking) {
      await bookingsAggregate.insert(ctx, booking);
    }

    return bookingId;
  },
});

export const updateStatus = mutation({
  args: {
    bookingId: v.id("bookings"),
    status: v.union(
      v.literal("confirmed"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const oldBooking = await ctx.db.get(args.bookingId);
    if (!oldBooking) throw new Error("Booking not found");

    await ctx.db.patch(args.bookingId, {
      status: args.status,
    });

    const newBooking = await ctx.db.get(args.bookingId);
    if (!newBooking) throw new Error("Booking not found after update");

    // Update vehicle status based on booking status
    if (args.status === "active") {
      await ctx.db.patch(oldBooking.vehicleId, { status: "in-use" });
    } else if (args.status === "completed" || args.status === "cancelled") {
      await ctx.db.patch(oldBooking.vehicleId, { status: "available" });
    }

    // Update bookings aggregate
    await bookingsAggregate.replace(ctx, oldBooking, newBooking);
  },
});
