import { createFileRoute } from '@tanstack/react-router'
import { DashboardMetricsCards } from '@/components/dashboard-metrics-cards'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <div className="flex-1">
      <div className="space-y-4">
        <DashboardMetricsCards />
      </div>
    </div>
  )
}
