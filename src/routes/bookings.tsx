import { createFileRoute } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { useQuery } from 'convex/react';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CrudDataGrid, FilterConfig } from '@/components/ui/crud-data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridTableRowSelect, DataGridTableRowSelectAll } from '@/components/ui/data-grid-table';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

export const Route = createFileRoute('/bookings')({
  component: BookingsPage,
});

// Type definition for booking data with vehicle info
type Booking = {
  _id: Id<'bookings'>;
  _creationTime: number;
  vehicleId: Id<'vehicles'>;
  customerName: string;
  customerEmail: string;
  startDate: number;
  endDate: number;
  dailyRate: number;
  totalAmount: number;
  status: 'confirmed' | 'active' | 'completed' | 'cancelled';
  vehicle: {
    _id: Id<'vehicles'>;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
  } | null;
};

// Transform Convex data to include string id
type BookingWithId = Booking & { id: string };

function BookingsPage() {
  const bookingsData = useQuery(api.bookings.list);

  // Transform data to include string id
  const bookings: BookingWithId[] = useMemo(() => {
    if (!bookingsData) return [];
    return bookingsData.map((booking) => ({
      ...booking,
      id: booking._id,
    }));
  }, [bookingsData]);

  // Get unique customers and vehicles for filters
  const uniqueCustomers = useMemo(() => {
    const customers = new Set(bookings.map((b) => b.customerName));
    return Array.from(customers).sort();
  }, [bookings]);

  const uniqueVehicles = useMemo(() => {
    const vehicleMap = new Map<string, string>();
    bookings.forEach((booking) => {
      if (booking.vehicle) {
        const key = booking.vehicle._id;
        const label = `${booking.vehicle.make} ${booking.vehicle.model} (${booking.vehicle.licensePlate})`;
        vehicleMap.set(key, label);
      }
    });
    return Array.from(vehicleMap.entries()).map(([value, label]) => ({ value, label }));
  }, [bookings]);

  const columns = useMemo<ColumnDef<BookingWithId>[]>(
    () => [
      {
        accessorKey: 'id',
        id: 'select',
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        enableSorting: false,
        size: 35,
      },
      {
        accessorKey: 'customerName',
        id: 'customer',
        header: ({ column }) => <DataGridColumnHeader title="Customer" column={column} />,
        cell: ({ row }) => {
          return (
            <div className="space-y-px">
              <div className="font-medium text-foreground">{row.original.customerName}</div>
              <div className="text-sm text-muted-foreground">{row.original.customerEmail}</div>
            </div>
          );
        },
        size: 220,
        enableSorting: true,
      },
      {
        accessorKey: 'vehicleId',
        id: 'vehicle',
        header: ({ column }) => <DataGridColumnHeader title="Vehicle" column={column} />,
        cell: ({ row }) => {
          const vehicle = row.original.vehicle;
          if (!vehicle) {
            return <div className="text-muted-foreground">No vehicle</div>;
          }
          return (
            <div className="space-y-px">
              <div className="font-medium text-foreground">
                {vehicle.make} {vehicle.model}
              </div>
              <div className="text-sm text-muted-foreground">
                {vehicle.year} · {vehicle.licensePlate}
              </div>
            </div>
          );
        },
        size: 200,
        enableSorting: false,
      },
      {
        accessorKey: 'startDate',
        id: 'dates',
        header: ({ column }) => <DataGridColumnHeader title="Dates" column={column} />,
        cell: ({ row }) => {
          const startDate = new Date(row.original.startDate).toLocaleString();
          const endDate = new Date(row.original.endDate).toLocaleString();
          
          return (
            <div className="space-y-px">
              <div className="text-sm font-medium text-foreground">{startDate}</div>
              <div className="text-xs text-muted-foreground">{endDate}</div>
            </div>
          );
        },
        size: 180,
        enableSorting: true,
      },
      {
        accessorKey: 'duration',
        id: 'duration',
        header: ({ column }) => <DataGridColumnHeader title="Duration" column={column} />,
        cell: ({ row }) => {
          const days = Math.ceil(
            (row.original.endDate - row.original.startDate) / (1000 * 60 * 60 * 24)
          );
          return (
            <div className="text-foreground">
              {days} {days === 1 ? 'day' : 'days'}
            </div>
          );
        },
        size: 100,
        enableSorting: false,
      },
      {
        accessorKey: 'status',
        id: 'status',
        header: ({ column }) => <DataGridColumnHeader title="Status" column={column} />,
        cell: ({ row }) => {
          const status = row.original.status;
          const statusConfig = {
            confirmed: { variant: 'secondary' as const, label: 'Confirmed' },
            active: { variant: 'primary' as const, label: 'Active' },
            completed: { variant: 'success' as const, label: 'Completed' },
            cancelled: { variant: 'destructive' as const, label: 'Cancelled' },
          };

          const config = statusConfig[status];
          return (
            <Badge variant={config.variant} appearance="outline">
              {config.label}
            </Badge>
          );
        },
        size: 120,
        enableSorting: true,
      },
      {
        accessorKey: 'dailyRate',
        id: 'dailyRate',
        header: ({ column }) => <DataGridColumnHeader title="Daily Rate" column={column} />,
        cell: ({ row }) => {
          return (
            <div className="text-foreground font-medium">
              ${row.original.dailyRate.toFixed(2)}
            </div>
          );
        },
        size: 120,
        enableSorting: true,
      },
      {
        accessorKey: 'totalAmount',
        id: 'total',
        header: ({ column }) => <DataGridColumnHeader title="Total" column={column} />,
        cell: ({ row }) => {
          return (
            <div className="text-foreground font-semibold">
              ${row.original.totalAmount.toFixed(2)}
            </div>
          );
        },
        size: 120,
        enableSorting: true,
      },
    ],
    [],
  );

  // Define filters
  const filters: FilterConfig<BookingWithId>[] = useMemo(() => {
    return [
      {
        field: 'status',
        label: 'Status',
        type: 'checkbox',
        options: [
          { value: 'confirmed', label: 'Confirmed' },
          { value: 'active', label: 'Active' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' },
        ],
      },
      {
        field: 'customerName',
        label: 'Customer',
        type: 'checkbox',
        options: uniqueCustomers.map((customer) => ({
          value: customer,
          label: customer,
        })),
      },
      {
        field: 'vehicleId',
        label: 'Vehicle',
        type: 'checkbox',
        options: uniqueVehicles,
      },
    ];
  }, [uniqueCustomers, uniqueVehicles]);

  return (
    <>
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-foreground">Bookings</h1>
        <p className="text-muted-foreground mt-2">Manage vehicle rental bookings</p>
      </div>
      
      <CrudDataGrid
        data={bookings}
        columns={columns}
        searchable={true}
        searchConfig={{
          placeholder: 'Search bookings...',
          fields: ['customerName', 'customerEmail'],
        }}
        filters={filters}
        pageSize={10}
        initialSorting={[{ id: 'dates', desc: true }]}
        toolbarActions={
          <Button>
            <Plus />
            New Booking
          </Button>
        }
        isLoading={bookingsData === undefined}
      />
    </>
  );
}
