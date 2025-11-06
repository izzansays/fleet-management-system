import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
	ArrowDownRight,
	ArrowUpRight,
	Calendar,
	DollarSign,
	Percent,
	TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/analytics")({
	component: AnalyticsPage,
});

function AnalyticsPage() {
	const overviewMetrics = useQuery(api.dashboard.getOverviewMetrics);
	const categoryAnalytics = useQuery(api.dashboard.getVehicleCategoryAnalytics);
	const breakEvenData = useQuery(api.dashboard.getBreakEvenAnalysis);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount);
	};

	const formatNumber = (num: number) => {
		return new Intl.NumberFormat("en-US", {
			minimumFractionDigits: 1,
			maximumFractionDigits: 1,
		}).format(num);
	};

	return (
		<div className="flex-1 space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">
					Financial Analytics
				</h1>
				<p className="text-muted-foreground mt-2">
					Comprehensive financial performance and insights across your fleet
				</p>
			</div>

			<Tabs defaultValue="overview" className="space-y-6">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="profitability">Profitability</TabsTrigger>
					<TabsTrigger value="efficiency">Efficiency</TabsTrigger>
					<TabsTrigger value="breakeven">Break-Even Analysis</TabsTrigger>
				</TabsList>

				{/* OVERVIEW TAB */}
				<TabsContent value="overview" className="space-y-6">
					{/* Fleet-wide KPIs */}
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<Card>
							<CardHeader className="pb-3">
								<CardDescription className="flex items-center gap-2">
									<DollarSign className="h-4 w-4" />
									Total Revenue
								</CardDescription>
							</CardHeader>
							<CardContent>
								{overviewMetrics ? (
									<div className="text-2xl font-bold">
										{formatCurrency(overviewMetrics.totalRevenue)}
									</div>
								) : (
									<Skeleton className="h-8 w-32" />
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardDescription className="flex items-center gap-2">
									<TrendingUp className="h-4 w-4" />
									Net Profit
								</CardDescription>
							</CardHeader>
							<CardContent>
								{overviewMetrics ? (
									<>
										<div className="text-2xl font-bold">
											{formatCurrency(overviewMetrics.netProfit)}
										</div>
										<p className="text-xs text-muted-foreground mt-1">
											{overviewMetrics.totalRevenue > 0
												? `${formatNumber((overviewMetrics.netProfit / overviewMetrics.totalRevenue) * 100)}% margin`
												: "N/A"}
										</p>
									</>
								) : (
									<Skeleton className="h-8 w-32" />
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardDescription className="flex items-center gap-2">
									<Percent className="h-4 w-4" />
									Fleet Utilization
								</CardDescription>
							</CardHeader>
							<CardContent>
								{overviewMetrics ? (
									<div className="text-2xl font-bold">
										{formatNumber(overviewMetrics.utilizationRate)}%
									</div>
								) : (
									<Skeleton className="h-8 w-32" />
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardDescription className="flex items-center gap-2">
									<Calendar className="h-4 w-4" />
									Total Bookings
								</CardDescription>
							</CardHeader>
							<CardContent>
								{overviewMetrics ? (
									<>
										<div className="text-2xl font-bold">
											{overviewMetrics.totalBookings}
										</div>
										<p className="text-xs text-muted-foreground mt-1">
											Avg {formatCurrency(overviewMetrics.averageBookingValue)}{" "}
											per booking
										</p>
									</>
								) : (
									<Skeleton className="h-8 w-32" />
								)}
							</CardContent>
						</Card>
					</div>

					{/* Top/Bottom Performers */}
					<div className="grid gap-4 lg:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Top Performing Vehicle Categories</CardTitle>
								<CardDescription>
									Vehicle categories with highest net profit
								</CardDescription>
							</CardHeader>
							<CardContent>
								{categoryAnalytics ? (
									<div className="space-y-3">
										{categoryAnalytics.slice(0, 5).map((item, index) => (
											<div
												key={item.category}
												className="flex items-center justify-between p-3 rounded-lg border"
											>
												<div className="flex items-center gap-3">
													<div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
														{index + 1}
													</div>
													<div>
														<p className="font-medium">{item.category}</p>
														<p className="text-sm text-muted-foreground">
															{item.vehicleCount}{" "}
															{item.vehicleCount === 1
																? "vehicle"
																: "vehicles"}{" "}
															· {item.totalBookings} bookings
														</p>
													</div>
												</div>
												<div className="text-right">
													<p className="font-semibold text-green-600">
														{formatCurrency(item.netProfit)}
													</p>
													<p className="text-xs text-muted-foreground">
														{formatNumber(item.roi)}% ROI
													</p>
												</div>
											</div>
										))}
									</div>
								) : (
									<div className="space-y-3">
										{[1, 2, 3, 4, 5].map((i) => (
											<Skeleton key={i} className="h-16 w-full" />
										))}
									</div>
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Categories Needing Attention</CardTitle>
								<CardDescription>
									Underperforming vehicle categories
								</CardDescription>
							</CardHeader>
							<CardContent>
								{categoryAnalytics ? (
									<div className="space-y-3">
										{[...categoryAnalytics]
											.sort((a, b) => a.netProfit - b.netProfit)
											.slice(0, 5)
											.map((item) => (
												<div
													key={item.category}
													className="flex items-center justify-between p-3 rounded-lg border"
												>
													<div>
														<p className="font-medium">{item.category}</p>
														<p className="text-sm text-muted-foreground">
															{item.vehicleCount}{" "}
															{item.vehicleCount === 1
																? "vehicle"
																: "vehicles"}{" "}
															· {formatNumber(item.avgUtilizationRate)}% util
														</p>
													</div>
													<div className="text-right space-y-1">
														<p
															className={cn(
																"font-semibold",
																item.netProfit < 0
																	? "text-red-600"
																	: "text-muted-foreground",
															)}
														>
															{formatCurrency(item.netProfit)}
														</p>
														{item.roi < 0 && (
															<Badge variant="destructive" className="text-xs">
																{formatNumber(item.roi)}% ROI
															</Badge>
														)}
													</div>
												</div>
											))}
									</div>
								) : (
									<div className="space-y-3">
										{[1, 2, 3, 4, 5].map((i) => (
											<Skeleton key={i} className="h-16 w-full" />
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* PROFITABILITY TAB */}
				<TabsContent value="profitability" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Vehicle Category Profitability Rankings</CardTitle>
							<CardDescription>
								Financial performance by vehicle category
							</CardDescription>
						</CardHeader>
						<CardContent>
							{categoryAnalytics ? (
								<div className="rounded-md border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead className="w-12">Rank</TableHead>
												<TableHead>Vehicle Category</TableHead>
												<TableHead className="text-right">Fleet Size</TableHead>
												<TableHead className="text-right">
													Total Revenue
												</TableHead>
												<TableHead className="text-right">
													Total Costs
												</TableHead>
												<TableHead className="text-right">Net Profit</TableHead>
												<TableHead className="text-right">ROI</TableHead>
												<TableHead className="text-right">
													Avg Revenue/Vehicle
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{categoryAnalytics.map((item, index) => (
												<TableRow key={item.category}>
													<TableCell className="font-medium">
														{index + 1}
													</TableCell>
													<TableCell>
														<div className="font-medium">{item.category}</div>
														<div className="text-sm text-muted-foreground">
															{item.totalBookings} total bookings
														</div>
													</TableCell>
													<TableCell className="text-right">
														<Badge variant="secondary">
															{item.vehicleCount}{" "}
															{item.vehicleCount === 1 ? "vehicle" : "vehicles"}
														</Badge>
													</TableCell>
													<TableCell className="text-right">
														{formatCurrency(item.totalRevenue)}
													</TableCell>
													<TableCell className="text-right text-muted-foreground">
														{formatCurrency(
															item.totalAcquisitionCost +
																item.totalMaintenanceCosts,
														)}
													</TableCell>
													<TableCell className="text-right">
														<span
															className={cn(
																"font-semibold",
																item.netProfit > 0
																	? "text-green-600"
																	: "text-red-600",
															)}
														>
															{formatCurrency(item.netProfit)}
														</span>
													</TableCell>
													<TableCell className="text-right">
														<div className="flex items-center justify-end gap-1">
															{item.roi > 0 ? (
																<ArrowUpRight className="h-4 w-4 text-green-600" />
															) : (
																<ArrowDownRight className="h-4 w-4 text-red-600" />
															)}
															<span
																className={cn(
																	"font-medium",
																	item.roi > 0
																		? "text-green-600"
																		: "text-red-600",
																)}
															>
																{formatNumber(item.roi)}%
															</span>
														</div>
													</TableCell>
													<TableCell className="text-right">
														<span className="font-medium text-primary">
															{formatCurrency(item.avgRevenuePerVehicle)}
														</span>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							) : (
								<Skeleton className="h-96 w-full" />
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* EFFICIENCY TAB */}
				<TabsContent value="efficiency" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Vehicle Category Efficiency Analysis</CardTitle>
							<CardDescription>
								Revenue efficiency and utilization rates by vehicle category
							</CardDescription>
						</CardHeader>
						<CardContent>
							{categoryAnalytics ? (
								<div className="rounded-md border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead className="w-12">Rank</TableHead>
												<TableHead>Vehicle Category</TableHead>
												<TableHead className="text-right">Fleet Size</TableHead>
												<TableHead className="text-right">
													Revenue/Day
												</TableHead>
												<TableHead className="text-right">
													Total Revenue
												</TableHead>
												<TableHead className="text-right">
													Total Rental Days
												</TableHead>
												<TableHead className="text-right">
													Avg Utilization
												</TableHead>
												<TableHead className="text-right">
													Avg Revenue/Vehicle
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{[...categoryAnalytics]
												.sort((a, b) => b.revenuePerDay - a.revenuePerDay)
												.map((item, index) => (
													<TableRow key={item.category}>
														<TableCell className="font-medium">
															{index + 1}
														</TableCell>
														<TableCell>
															<div className="font-medium">{item.category}</div>
															<div className="text-sm text-muted-foreground">
																{item.totalBookings} bookings
															</div>
														</TableCell>
														<TableCell className="text-right">
															<Badge variant="secondary">
																{item.vehicleCount}
															</Badge>
														</TableCell>
														<TableCell className="text-right">
															<span className="font-semibold text-primary">
																{formatCurrency(item.revenuePerDay)}
															</span>
														</TableCell>
														<TableCell className="text-right">
															{formatCurrency(item.totalRevenue)}
														</TableCell>
														<TableCell className="text-right">
															{item.totalRentalDays}
														</TableCell>
														<TableCell className="text-right">
															<Badge
																variant={
																	item.avgUtilizationRate > 60
																		? "success"
																		: item.avgUtilizationRate > 30
																			? "secondary"
																			: "outline"
																}
															>
																{formatNumber(item.avgUtilizationRate)}%
															</Badge>
														</TableCell>
														<TableCell className="text-right">
															<span className="font-medium">
																{formatCurrency(item.avgRevenuePerVehicle)}
															</span>
														</TableCell>
													</TableRow>
												))}
										</TableBody>
									</Table>
								</div>
							) : (
								<Skeleton className="h-96 w-full" />
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* BREAK-EVEN TAB */}
				<TabsContent value="breakeven" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Break-Even Status Dashboard</CardTitle>
							<CardDescription>
								Track which vehicles have recovered their acquisition costs
							</CardDescription>
						</CardHeader>
						<CardContent>
							{breakEvenData ? (
								<div className="rounded-md border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Vehicle</TableHead>
												<TableHead className="text-right">
													Acquisition Cost
												</TableHead>
												<TableHead className="text-right">
													Net Revenue
												</TableHead>
												<TableHead className="text-right">Progress</TableHead>
												<TableHead className="text-right">
													Daily Net Revenue
												</TableHead>
												<TableHead className="text-right">
													Days Active
												</TableHead>
												<TableHead className="text-right">Status</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{breakEvenData.map((item) => (
												<TableRow key={item.vehicleId}>
													<TableCell>
														<Link to="/vehicles" className="hover:underline">
															<div className="font-medium">
																{item.year} {item.make} {item.model}
															</div>
															<div className="text-sm text-muted-foreground">
																{item.licensePlate}
															</div>
														</Link>
													</TableCell>
													<TableCell className="text-right text-muted-foreground">
														{formatCurrency(item.acquisitionCost)}
													</TableCell>
													<TableCell className="text-right">
														{formatCurrency(item.netRevenue)}
													</TableCell>
													<TableCell className="text-right">
														<div className="flex items-center justify-end gap-2">
															<div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
																<div
																	className={cn(
																		"h-full transition-all",
																		item.hasReachedBreakEven
																			? "bg-green-600"
																			: "bg-blue-600",
																	)}
																	style={{
																		width: `${item.breakEvenProgress}%`,
																	}}
																/>
															</div>
															<span className="text-sm font-medium w-12 text-right">
																{formatNumber(item.breakEvenProgress)}%
															</span>
														</div>
													</TableCell>
													<TableCell className="text-right">
														<span
															className={cn(
																item.dailyNetRevenue > 0
																	? "text-green-600"
																	: "text-red-600",
															)}
														>
															{formatCurrency(item.dailyNetRevenue)}
														</span>
													</TableCell>
													<TableCell className="text-right">
														{item.daysSinceAcquisition}
													</TableCell>
													<TableCell className="text-right">
														{item.hasReachedBreakEven ? (
															<Badge className="bg-green-600">
																Break-Even ✓
															</Badge>
														) : item.projectedDaysToBreakEven ? (
															<Badge variant="secondary">
																~{item.projectedDaysToBreakEven} days
															</Badge>
														) : (
															<Badge variant="destructive">At Risk</Badge>
														)}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							) : (
								<Skeleton className="h-96 w-full" />
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
