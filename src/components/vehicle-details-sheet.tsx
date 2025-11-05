import { useQuery } from 'convex/react';
import { Alert, AlertContent, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

interface VehicleDetailsSheetProps {
  vehicleId: Id<'vehicles'> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VehicleDetailsSheet({ vehicleId, open, onOpenChange }: VehicleDetailsSheetProps) {
  // Only query when sheet is open and vehicleId exists
  const vehicleDetails = useQuery(
    api.vehicles.getVehicleDetails,
    vehicleId && open ? { vehicleId } : 'skip'
  );

  // Don't render anything when closed to prevent memory leaks
  if (!open) {
    return null;
  }

  if (!vehicleDetails || !vehicleDetails.vehicle) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Vehicle Details</SheetTitle>
            <SheetDescription>Loading vehicle information...</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  const { vehicle, financial, bookingHistory, maintenanceHistory } = vehicleDetails;

  const statusConfig = {
    available: { variant: 'primary' as const, label: 'Available' },
    reserved: { variant: 'secondary' as const, label: 'Reserved' },
    'in-use': { variant: 'info' as const, label: 'In Use' },
    maintenance: { variant: 'destructive' as const, label: 'Maintenance' },
  };

  const config = statusConfig[vehicle.status];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>
            {vehicle.make} {vehicle.model}
          </SheetTitle>
          <SheetDescription>
            {vehicle.year} • {vehicle.licensePlate}
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          {/* Add key to force remount on vehicle change */}
          <ScrollArea key={vehicleId} className="h-[calc(100vh-150px)]">
            <div className="space-y-6 pr-4">
              {/* Vehicle Info Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Vehicle Information</h3>
                <Card>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant={config.variant} appearance="outline">
                        {config.label}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">VIN</span>
                      <span className="text-sm font-mono font-medium">{vehicle.vin}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">License Plate</span>
                      <span className="text-sm font-mono font-medium">{vehicle.licensePlate}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-muted-foreground">
                        Location
                      </span>
                      <div className="text-end">
                        <div className="text-sm font-medium">
                          {vehicle.currentLatitude.toFixed(4)}, {vehicle.currentLongitude.toFixed(4)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Updated: {new Date(vehicle.lastLocationUpdate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Odometer</span>
                      <span className="text-sm font-medium">
                        {vehicle.currentOdometer.toLocaleString()} mi
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Financial Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Financial Performance
                </h3>
                <Card>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Acquisition Cost</span>
                      <span className="text-sm font-medium">
                        ${financial.acquisitionCost.toLocaleString()}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Revenue</span>
                      <span className="text-sm font-medium text-green-600">
                        ${financial.totalRevenue.toLocaleString()}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Maintenance Costs</span>
                      <span className="text-sm font-medium text-red-600">
                        ${financial.totalMaintenanceCost.toLocaleString()}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-foreground">Net Profit</span>
                      <span
                        className={`text-sm font-semibold ${
                          financial.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        ${financial.netProfit.toLocaleString()}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-foreground">
                        ROI
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          financial.roi >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {financial.roi.toFixed(2)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Booking History Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Booking History
                </h3>
                <Card>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Bookings</span>
                      <span className="text-sm font-medium">{bookingHistory.totalBookings}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Completed Bookings</span>
                      <span className="text-sm font-medium">{bookingHistory.completedBookings}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Avg Duration
                      </span>
                      <span className="text-sm font-medium">
                        {bookingHistory.avgBookingDuration.toFixed(1)} days
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avg Daily Rate</span>
                      <span className="text-sm font-medium">
                        ${bookingHistory.avgDailyRate.toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avg Revenue/Booking</span>
                      <span className="text-sm font-medium">
                        ${bookingHistory.avgRevenuePerBooking.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Last 5 Bookings */}
                {bookingHistory.recentBookings.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Recent Bookings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {bookingHistory.recentBookings.map((booking, index) => {
                        const bookingStatusConfig = {
                          confirmed: { variant: 'secondary' as const, label: 'Confirmed' },
                          active: { variant: 'info' as const, label: 'Active' },
                          completed: { variant: 'primary' as const, label: 'Completed' },
                          cancelled: { variant: 'destructive' as const, label: 'Cancelled' },
                        };
                        const bookingConfig = bookingStatusConfig[booking.status];

                        return (
                          <div key={booking._id}>
                            {index > 0 && <Separator />}
                            <div className="space-y-2 py-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="text-sm font-medium">{booking.customerName}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {booking.customerEmail}
                                  </div>
                                </div>
                                <Badge variant={bookingConfig.variant} appearance="outline" size="sm">
                                  {bookingConfig.label}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Start: </span>
                                  <span className="font-medium">
                                    {new Date(booking.startDate).toLocaleDateString()}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">End: </span>
                                  <span className="font-medium">
                                    {new Date(booking.endDate).toLocaleDateString()}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Daily Rate: </span>
                                  <span className="font-medium">${booking.dailyRate}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Total: </span>
                                  <span className="font-medium">${booking.totalAmount}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Maintenance History Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Maintenance History
                </h3>

                {/* Upcoming Service Alerts */}
                {maintenanceHistory.upcomingServiceAlerts.length > 0 && (
                  <div className="space-y-3">
                    {maintenanceHistory.upcomingServiceAlerts.map((alert) => (
                      <Alert key={alert._id} variant="warning" appearance="light">
                        <AlertContent>
                          <AlertTitle>{alert.type}</AlertTitle>
                          <AlertDescription>
                            <div className="space-y-1">
                              <div>{alert.description}</div>
                              {alert.nextServiceDue && (
                                <div className="font-medium">
                                  Due: {new Date(alert.nextServiceDue).toLocaleDateString()}
                                </div>
                              )}
                              {alert.nextServiceMileage && (
                                <div className="font-medium">
                                  Due at: {alert.nextServiceMileage.toLocaleString()} mi
                                </div>
                              )}
                            </div>
                          </AlertDescription>
                        </AlertContent>
                      </Alert>
                    ))}
                  </div>
                )}

                {/* Last 5 Maintenance Records */}
                {maintenanceHistory.recentMaintenance.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Recent Maintenance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {maintenanceHistory.recentMaintenance.map((record, index) => (
                        <div key={record._id}>
                          {index > 0 && <Separator />}
                          <div className="space-y-2 py-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="text-sm font-medium">{record.type}</div>
                                <div className="text-xs text-muted-foreground">
                                  {record.description}
                                </div>
                              </div>
                              <span className="text-sm font-medium text-red-600">
                                ${record.cost.toLocaleString()}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Date: </span>
                                <span className="font-medium">
                                  {new Date(record.date).toLocaleDateString()}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Odometer: </span>
                                <span className="font-medium">
                                  {record.odometerAtService.toLocaleString()} mi
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </ScrollArea>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
