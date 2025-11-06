import { StatisticCard } from '@/components/statistic-card'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

interface DashboardMetricsCardsProps {
    className?: string
}

export function DashboardMetricsCards({ className }: DashboardMetricsCardsProps) {
    // Call individual queries for each metric card
    const totalRevenue = useQuery(api.dashboard.getTotalRevenue)
    const netProfit = useQuery(api.dashboard.getNetProfit)
    const fleetUtilization = useQuery(api.dashboard.getFleetUtilization)
    const activeBookings = useQuery(api.dashboard.getActiveBookings)

    // Determine loading state - any query can be loading independently
    const isRevenueLoading = totalRevenue === undefined
    const isProfitLoading = netProfit === undefined
    const isUtilizationLoading = fleetUtilization === undefined
    const isBookingsLoading = activeBookings === undefined

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    return (<div className={className}>
        <div className="@container grow w-full">
            <div className="grid grid-cols-1 @3xl:grid-cols-4 bg-background overflow-hidden rounded-xl border border-border">
                {/* Total Revenue */}
                <StatisticCard
                    isLoading={isRevenueLoading}
                    formatValue={formatCurrency}
                    data={{
                        title: 'Total Revenue',
                        value: isRevenueLoading ? 0 : totalRevenue.current,
                        trend: isRevenueLoading ? 0 : totalRevenue.trend,
                        previousValue: isRevenueLoading ? 0 : totalRevenue.previous,
                    }}
                />

                {/* Net Profit */}
                <StatisticCard
                    isLoading={isProfitLoading}
                    formatValue={formatCurrency}
                    data={{
                        title: 'Net Profit',
                        value: isProfitLoading ? 0 : netProfit.current,
                        trend: isProfitLoading ? 0 : netProfit.trend,
                        previousValue: isProfitLoading ? 0 : netProfit.previous,
                    }}
                />

                {/* Average Fleet Utilization */}
                <StatisticCard
                    isLoading={isUtilizationLoading}
                    formatValue={(val) => `${val.toFixed(1)}%`}
                    data={{
                        title: 'Avg Fleet Utilization',
                        value: isUtilizationLoading ? 0 : fleetUtilization.current,
                        trend: isUtilizationLoading ? 0 : fleetUtilization.trend,
                        previousValue: isUtilizationLoading ? 0 : fleetUtilization.previous,
                    }}
                />

                {/* Completed Bookings */}
                <StatisticCard
                    isLoading={isBookingsLoading}
                    data={{
                        title: 'Completed Bookings',
                        value: isBookingsLoading ? 0 : activeBookings.current,
                        trend: isBookingsLoading ? 0 : activeBookings.trend,
                        previousValue: isBookingsLoading ? 0 : activeBookings.previous,
                    }}
                />
            </div>
        </div>
    </div>)
}
