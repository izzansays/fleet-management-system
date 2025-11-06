import { query } from "./_generated/server";

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
