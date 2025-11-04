import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatisticCardData {
  title: string;
  value: string | number;
  trend: number;
  previousValue: string | number;
}

interface StatisticCardProps {
  data: StatisticCardData;
  isLoading?: boolean;
  formatValue?: (value: number) => string;
}

export function StatisticCard({ data, isLoading = false, formatValue }: StatisticCardProps) {
  // Compute badge styling based on trend value
  const isPositiveTrend = data.trend >= 0;
  const badgeColor = isPositiveTrend ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  const iconColor = isPositiveTrend ? 'text-green-700' : 'text-red-700';
  const valueColor = Number(data.value) >= 0 ? 'text-green-600' : 'text-red-600';
  const TrendIcon = isPositiveTrend ? TrendingUp : TrendingDown;
  
  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Generate subtext
  const subtext = isLoading ? (
    <span className="text-muted-foreground">Loading...</span>
  ) : (
    <span className="text-muted-foreground">
      <span className="font-medium text-foreground">
        {formatValue ? formatValue(Number(data.previousValue)) : data.previousValue}
      </span> from last month
    </span>
  );
  return (
    <Card className="border-0 shadow-none rounded-none border-y @3xl:border-x @3xl:border-y-0 border-border last:border-0 first:border-0">
      <CardContent className="flex flex-col h-full space-y-6 justify-between">
        <div className="space-y-0.25">
          <div className="text-lg font-semibold text-foreground">{data.title}</div>
          <div className="text-sm text-muted-foreground">Last 30 days</div>
        </div>

        {/* Information */}
        <div className="flex-1 flex flex-col gap-1.5 justify-between grow">
          {/* Value & Delta */}
          <div className="flex items-center gap-2">
            {isLoading ? (
              <>
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </>
            ) : (
              <>
                <span className={`text-3xl font-bold tracking-tight ${valueColor}`}>
                  {formatValue ? formatValue(Number(data.value)) : data.value}
                </span>
                <Badge
                  className={`${badgeColor} px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1 shadow-none`}
                >
                  <TrendIcon className={`w-3 h-3 ${iconColor}`} />
                  {formatPercentage(data.trend)}
                </Badge>
              </>
            )}
          </div>
          {/* Subtext */}
          <div className="text-sm">
            {isLoading ? (
              <Skeleton className="h-4 w-40" />
            ) : (
              subtext
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
