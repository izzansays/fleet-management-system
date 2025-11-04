import { createFileRoute } from "@tanstack/react-router";
import { DashboardMetricsCards } from "@/components/dashboard-metrics-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";

export const Route = createFileRoute("/")({ component: App });

function App() {
	return (
		<div className="flex-1">
			<div className="space-y-4">
				<DashboardMetricsCards />
				<ChartAreaInteractive />
			</div>
		</div>
	);
}
