import { useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { CrudDataGrid, FilterConfig } from '@/components/ui/crud-data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridTableRowSelect, DataGridTableRowSelectAll } from '@/components/ui/data-grid-table';
import { Badge } from '@/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';
import { MapPin } from 'lucide-react';
import { Id } from '../../convex/_generated/dataModel';

export const Route = createFileRoute('/vehicles')({
  component: VehiclesPage,
});

// Type definition for vehicle data with id
type Vehicle = {
  _id: Id<'vehicles'>;
  _creationTime: number;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  acquisitionCost: number;
  status: 'available' | 'reserved' | 'in-use' | 'maintenance';
  currentLatitude: number;
  currentLongitude: number;
  lastLocationUpdate: number;
  currentOdometer: number;
  lastOdometerUpdate: number;
};

// Transform Convex data to include string id
type VehicleWithId = Vehicle & { id: string };

function VehiclesPage() {
  const vehiclesData = useQuery(api.vehicles.list);

  // Transform data to include string id
  const vehicles: VehicleWithId[] = useMemo(() => {
    if (!vehiclesData) return [];
    return vehiclesData.map((vehicle) => ({
      ...vehicle,
      id: vehicle._id,
    }));
  }, [vehiclesData]);

  // Get unique makes for filter
  const uniqueMakes = useMemo(() => {
    const makes = new Set(vehicles.map((v) => v.make));
    return Array.from(makes).sort();
  }, [vehicles]);

  const columns = useMemo<ColumnDef<VehicleWithId>[]>(
    () => [
      {
        accessorKey: 'id',
        id: 'select',
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        enableSorting: false,
        size: 35,
        enableResizing: false,
        enableHiding: false,
      },
      {
        accessorKey: 'make',
        id: 'vehicle',
        header: ({ column }) => <DataGridColumnHeader title="Vehicle" visibility={true} column={column} />,
        cell: ({ row }) => {
          return (
            <div className="space-y-px">
              <div className="font-medium text-foreground">
                {row.original.make} {row.original.model}
              </div>
              <div className="text-sm text-muted-foreground">{row.original.year}</div>
            </div>
          );
        },
        size: 200,
        enableSorting: true,
        enableHiding: false,
        enableResizing: true,
      },
      {
        accessorKey: 'licensePlate',
        id: 'licensePlate',
        header: ({ column }) => <DataGridColumnHeader title="License Plate" visibility={true} column={column} />,
        cell: ({ row }) => {
          return (
            <div className="font-mono text-foreground font-medium">{row.original.licensePlate}</div>
          );
        },
        size: 150,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'status',
        id: 'status',
        header: ({ column }) => <DataGridColumnHeader title="Status" visibility={true} column={column} />,
        cell: ({ row }) => {
          const status = row.original.status;
          const statusConfig = {
            available: { variant: 'primary' as const, label: 'Available' },
            reserved: { variant: 'secondary' as const, label: 'Reserved' },
            'in-use': { variant: 'info' as const, label: 'In Use' },
            maintenance: { variant: 'destructive' as const, label: 'Maintenance' },
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
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'currentLatitude',
        id: 'location',
        header: ({ column }) => <DataGridColumnHeader title="Current Location" visibility={true} column={column} />,
        cell: ({ row }) => {
          const lat = row.original.currentLatitude.toFixed(4);
          const lng = row.original.currentLongitude.toFixed(4);
          const lastUpdate = new Date(row.original.lastLocationUpdate).toLocaleDateString();

          return (
            <div className="flex items-start gap-2">
              <MapPin className="size-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="space-y-px">
                <div className="font-medium text-foreground text-sm">
                  {lat}, {lng}
                </div>
                <div className="text-xs text-muted-foreground">Updated: {lastUpdate}</div>
              </div>
            </div>
          );
        },
        size: 220,
        enableSorting: false,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'currentOdometer',
        id: 'odometer',
        header: ({ column }) => <DataGridColumnHeader title="Odometer" visibility={true} column={column} />,
        cell: ({ row }) => {
          return (
            <div className="text-foreground">
              {row.original.currentOdometer.toLocaleString()} mi
            </div>
          );
        },
        size: 120,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
    ],
    [],
  );

  // Define filters
  const filters: FilterConfig<VehicleWithId>[] = useMemo(() => {
    return [
      {
        field: 'status',
        label: 'Status',
        type: 'checkbox',
        options: [
          { value: 'available', label: 'Available' },
          { value: 'reserved', label: 'Reserved' },
          { value: 'in-use', label: 'In Use' },
          { value: 'maintenance', label: 'Maintenance' },
        ],
      },
      {
        field: 'make',
        label: 'Make',
        type: 'checkbox',
        options: uniqueMakes.map((make) => ({
          value: make,
          label: make,
        })),
      },
    ];
  }, [uniqueMakes]);

  return (
    <>
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-foreground">Fleet Vehicles</h1>
        <p className="text-muted-foreground mt-2">Manage your fleet of vehicles</p>
      </div>
      
      <CrudDataGrid
        data={vehicles}
        columns={columns}
        searchable={true}
        searchConfig={{
          placeholder: 'Search vehicles...',
          fields: ['make', 'model', 'licensePlate', 'vin'],
        }}
        filters={filters}
        pageSize={10}
        initialSorting={[{ id: 'vehicle', desc: false }]}
        isLoading={vehiclesData === undefined}
      />
    </>
  );
}
