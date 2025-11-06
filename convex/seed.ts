import { v } from "convex/values"
import { mutation } from "./_generated/server"
import { Id } from "./_generated/dataModel"

// Vehicle models with realistic pricing
const vehicleModels = [
  // Economy Cars
  { make: "Toyota", model: "Corolla", year: 2023, category: "Economy Cars" as const, type: "Sedan", dailyRate: 45, acquisitionCost: 25000 },
  { make: "Toyota", model: "Corolla", year: 2023, category: "Economy Cars" as const, type: "Sedan", dailyRate: 45, acquisitionCost: 25000 },
  { make: "Toyota", model: "Corolla", year: 2022, category: "Economy Cars" as const, type: "Sedan", dailyRate: 40, acquisitionCost: 22000 },
  { make: "Honda", model: "Civic", year: 2023, category: "Economy Cars" as const, type: "Sedan", dailyRate: 48, acquisitionCost: 26000 },
  { make: "Honda", model: "Civic", year: 2023, category: "Economy Cars" as const, type: "Sedan", dailyRate: 48, acquisitionCost: 26000 },
  { make: "Hyundai", model: "Elantra", year: 2023, category: "Economy Cars" as const, type: "Sedan", dailyRate: 42, acquisitionCost: 23000 },

  // Mid-size SUVs (Popular rentals)
  { make: "Toyota", model: "RAV4", year: 2023, category: "Mid-size SUVs" as const, type: "SUV", dailyRate: 65, acquisitionCost: 35000 },
  { make: "Toyota", model: "RAV4", year: 2023, category: "Mid-size SUVs" as const, type: "SUV", dailyRate: 65, acquisitionCost: 35000 },
  { make: "Toyota", model: "RAV4", year: 2022, category: "Mid-size SUVs" as const, type: "SUV", dailyRate: 60, acquisitionCost: 32000 },
  { make: "Honda", model: "CR-V", year: 2023, category: "Mid-size SUVs" as const, type: "SUV", dailyRate: 62, acquisitionCost: 34000 },
  { make: "Honda", model: "CR-V", year: 2023, category: "Mid-size SUVs" as const, type: "SUV", dailyRate: 62, acquisitionCost: 34000 },
  { make: "Mazda", model: "CX-5", year: 2023, category: "Mid-size SUVs" as const, type: "SUV", dailyRate: 63, acquisitionCost: 33000 },

  // Luxury Sedans
  { make: "Tesla", model: "Model 3", year: 2023, category: "Luxury Sedans" as const, type: "Sedan", dailyRate: 95, acquisitionCost: 45000 },
  { make: "Tesla", model: "Model 3", year: 2023, category: "Luxury Sedans" as const, type: "Sedan", dailyRate: 95, acquisitionCost: 45000 },
  { make: "BMW", model: "3 Series", year: 2023, category: "Luxury Sedans" as const, type: "Sedan", dailyRate: 110, acquisitionCost: 50000 },
  { make: "Mercedes-Benz", model: "C-Class", year: 2023, category: "Luxury Sedans" as const, type: "Sedan", dailyRate: 115, acquisitionCost: 52000 },

  // Large SUVs
  { make: "Chevrolet", model: "Tahoe", year: 2023, category: "Large SUVs" as const, type: "SUV", dailyRate: 85, acquisitionCost: 55000 },
  { make: "Ford", model: "Explorer", year: 2023, category: "Large SUVs" as const, type: "SUV", dailyRate: 80, acquisitionCost: 50000 },
  { make: "Toyota", model: "Highlander", year: 2023, category: "Large SUVs" as const, type: "SUV", dailyRate: 78, acquisitionCost: 48000 },

  // Trucks (Lower utilization but niche market)
  { make: "Ford", model: "F-150", year: 2023, category: "Trucks" as const, type: "Truck", dailyRate: 90, acquisitionCost: 50000 },
  { make: "Chevrolet", model: "Silverado", year: 2023, category: "Trucks" as const, type: "Truck", dailyRate: 88, acquisitionCost: 48000 },
]

const customers = [
  { name: "John Smith", email: "john.smith@email.com", phone: "+1-555-0101" },
  { name: "Sarah Johnson", email: "sarah.j@email.com", phone: "+1-555-0102" },
  { name: "Michael Brown", email: "m.brown@email.com", phone: "+1-555-0103" },
  { name: "Emily Davis", email: "emily.davis@email.com", phone: "+1-555-0104" },
  { name: "David Wilson", email: "d.wilson@email.com", phone: "+1-555-0105" },
  { name: "Jessica Martinez", email: "j.martinez@email.com", phone: "+1-555-0106" },
  { name: "James Anderson", email: "james.a@email.com", phone: "+1-555-0107" },
  { name: "Lisa Taylor", email: "lisa.t@email.com", phone: "+1-555-0108" },
  { name: "Robert Thomas", email: "rob.thomas@email.com", phone: "+1-555-0109" },
  { name: "Jennifer White", email: "jen.white@email.com", phone: "+1-555-0110" },
]

const maintenanceTypes = [
  { type: "Oil Change", costRange: [50, 80] },
  { type: "Tire Rotation", costRange: [40, 60] },
  { type: "Brake Service", costRange: [200, 400] },
  { type: "General Inspection", costRange: [75, 125] },
  { type: "Battery Replacement", costRange: [150, 250] },
  { type: "Air Filter Replacement", costRange: [30, 50] },
  { type: "Transmission Service", costRange: [300, 500] },
]

function generateLicensePlate() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const numbers = "0123456789"
  return (
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    "-" +
    numbers[Math.floor(Math.random() * numbers.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    numbers[Math.floor(Math.random() * numbers.length)]
  )
}

function getRandomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const seedData = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear existing data
    const existingVehicles = await ctx.db.query("vehicles").collect()
    const existingBookings = await ctx.db.query("bookings").collect()
    const existingMaintenance = await ctx.db.query("maintenance").collect()

    for (const vehicle of existingVehicles) {
      await ctx.db.delete(vehicle._id)
    }
    for (const booking of existingBookings) {
      await ctx.db.delete(booking._id)
    }
    for (const maintenance of existingMaintenance) {
      await ctx.db.delete(maintenance._id)
    }

    // Create vehicles with realistic acquisition dates (3 months ago to establish history)
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    
    const vehicleIds: Array<{
      id: Id<"vehicles">
      model: typeof vehicleModels[0]
      odometer: number
    }> = []

    for (let i = 0; i < vehicleModels.length; i++) {
      const model = vehicleModels[i]
      const odometer = getRandomInt(5000, 25000)
      
      const id = await ctx.db.insert("vehicles", {
        make: model.make,
        model: model.model,
        year: model.year,
        category: model.category,
        licensePlate: generateLicensePlate(),
        vin: `VIN${getRandomInt(10000000, 99999999)}`,
        status: "available",
        acquisitionCost: model.acquisitionCost,
        currentLatitude: 40.7128 + (Math.random() - 0.5) * 0.1, // Near NYC with some variance
        currentLongitude: -74.0060 + (Math.random() - 0.5) * 0.1,
        lastLocationUpdate: Date.now(),
        currentOdometer: odometer,
        lastOdometerUpdate: Date.now(),
      })
      
      vehicleIds.push({ id, model, odometer })
    }

    // Generate bookings over the last 3 months
    const now = new Date()
    const bookingPromises: Promise<void>[] = []

    for (const vehicle of vehicleIds) {
      // Determine utilization rate based on vehicle type
      let targetUtilization: number
      if (vehicle.model.type === "SUV" && vehicle.model.dailyRate < 70) {
        targetUtilization = 0.7 // High demand for mid-size SUVs
      } else if (vehicle.model.type === "Sedan" && vehicle.model.dailyRate < 50) {
        targetUtilization = 0.65 // Good demand for economy sedans
      } else if (vehicle.model.make === "Tesla" || vehicle.model.make === "BMW") {
        targetUtilization = 0.5 // Moderate demand for luxury
      } else if (vehicle.model.type === "Truck") {
        targetUtilization = 0.35 // Lower demand for trucks
      } else {
        targetUtilization = 0.55 // Default
      }

      // Calculate number of bookings needed
      const totalDays = 90
      const targetRentalDays = Math.floor(totalDays * targetUtilization)
      let currentRentalDays = 0
      let currentDate = new Date(threeMonthsAgo)

      while (currentRentalDays < targetRentalDays && currentDate < now) {
        // Random booking duration (1-7 days, weighted toward 3-5 days)
        const duration = [1, 2, 3, 3, 4, 4, 5, 5, 6, 7][getRandomInt(0, 9)]
        
        const startDate = new Date(currentDate)
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + duration)

        if (endDate > now) break

        const totalAmount = vehicle.model.dailyRate * duration
        const customer = customers[getRandomInt(0, customers.length - 1)]

        bookingPromises.push(
          ctx.db.insert("bookings", {
            vehicleId: vehicle.id,
            customerName: customer.name,
            customerEmail: customer.email,
            startDate: startDate.getTime(),
            endDate: endDate.getTime(),
            dailyRate: vehicle.model.dailyRate,
            totalAmount,
            status: "completed",
          }).then(() => {})
        )

        currentRentalDays += duration
        // Add gap between bookings (0-3 days)
        currentDate = new Date(endDate)
        currentDate.setDate(currentDate.getDate() + getRandomInt(0, 3))
      }

      // Add some active/upcoming bookings
      if (Math.random() > 0.7 && currentDate < now) {
        const futureStart = new Date()
        futureStart.setDate(futureStart.getDate() + getRandomInt(1, 7))
        const futureEnd = new Date(futureStart)
        futureEnd.setDate(futureEnd.getDate() + getRandomInt(3, 7))
        
        const customer = customers[getRandomInt(0, customers.length - 1)]

        bookingPromises.push(
          ctx.db.insert("bookings", {
            vehicleId: vehicle.id,
            customerName: customer.name,
            customerEmail: customer.email,
            startDate: futureStart.getTime(),
            endDate: futureEnd.getTime(),
            dailyRate: vehicle.model.dailyRate,
            totalAmount: vehicle.model.dailyRate * Math.ceil((futureEnd.getTime() - futureStart.getTime()) / (1000 * 60 * 60 * 24)),
            status: "confirmed",
          }).then(() => {})
        )
      }
    }

    await Promise.all(bookingPromises)

    // Generate maintenance records
    const maintenancePromises: Promise<void>[] = []
    
    for (const vehicle of vehicleIds) {
      // Each vehicle gets 2-5 maintenance events over 3 months
      const numMaintenanceEvents = getRandomInt(2, 5)
      
      for (let i = 0; i < numMaintenanceEvents; i++) {
        const maintenanceDate = getRandomDate(threeMonthsAgo, now)
        const maintenanceType = maintenanceTypes[getRandomInt(0, maintenanceTypes.length - 1)]
        const cost = getRandomInt(maintenanceType.costRange[0], maintenanceType.costRange[1])
        
        maintenancePromises.push(
          ctx.db.insert("maintenance", {
            vehicleId: vehicle.id,
            type: maintenanceType.type,
            description: `${maintenanceType.type} service performed`,
            cost,
            date: maintenanceDate.getTime(),
            odometerAtService: vehicle.odometer - getRandomInt(500, 5000),
          }).then(() => {})
        )
      }
    }

    await Promise.all(maintenancePromises)

    return {
      message: "Database seeded successfully!",
      vehiclesCreated: vehicleIds.length,
      customersCreated: customers.length,
      bookingsCreated: bookingPromises.length,
      maintenanceRecordsCreated: maintenancePromises.length,
    }
  },
})