import { defineApp } from "convex/server";
import aggregate from "@convex-dev/aggregate/convex.config";

const app = defineApp();

// Use separate aggregate instances for different data types
app.use(aggregate, { name: "bookingsAggregate" });
app.use(aggregate, { name: "maintenanceAggregate" });
app.use(aggregate, { name: "vehiclesAggregate" });

export default app;
