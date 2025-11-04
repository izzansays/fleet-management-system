import { useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { CrudDataGrid, FilterConfig } from '@/components/ui/crud-data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridTableRowSelect, DataGridTableRowSelectAll } from '@/components/ui/data-grid-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Wrench } from 'lucide-react';
import { Id } from '../../convex/_generated/dataModel';

export const Route = createFileRoute('/maintenance')({
  component: MaintenancePage,
});

// Type definition for maintenance data with vehicle info
type Maintenance = {
  _id: Id<'maintenance'>;
  _creationTime: number;
  vehicleId: Id<'vehicles'>;
  date: number;
  type: string;
  description: string;
  cost: number;
  odometerAtService: number;
  nextServiceDue?: number;
  nextServiceMileage?: number;
  vehicle: {
    _id: Id<'vehicles'>;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
  } | null;
};

// Transform Convex data to include string id
type MaintenanceWithId = Maintenance & { id: string };

function MaintenancePage() {
  const maintenanceData = useQuery(api.maintenance.list);

  // Transform data to include string id
  const maintenance: MaintenanceWithId[] = useMemo(() => {
    if (!maintenanceData) return [];
    return maintenanceData.map((record) => ({
      ...record,
      id: record._id,
    }));
  }, [maintenanceData]);

  // Get unique types and vehicles for filters
  const uniqueTypes = useMemo(() => {
    const types = new Set(maintenance.map((m) => m.type));
    return Array.from(types).sort();
  }, [maintenance]);

  const uniqueVehicles = useMemo(() => {
    const vehicleMap = new Map<string, string>();
    maintenance.forEach((record) => {
      if (record.vehicle) {
        const key = record.vehicle._id;
        const label = `${record.vehicle.make} ${record.vehicle.model} (${record.vehicle.licensePlate})`;
        vehicleMap.set(key, label);
      }
    });
    return Array.from(vehicleMap.entries()).map(([value, label]) => ({ value, label }));
  }, [maintenance]);

  const columns = useMemo<ColumnDef<MaintenanceWithId>[]>(
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
        accessorKey: 'vehicleId',
        id: 'vehicle',
        header: ({ column }) => <DataGridColumnHeader title="Vehicle" visibility={true} column={column} />,
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
        enableHiding: false,
        enableResizing: true,
      },
      {
        accessorKey: 'date',
        id: 'date',
        header: ({ column }) => <DataGridColumnHeader title="Date" visibility={true} column={column} />,
        cell: ({ row }) => {
          const date = new Date(row.original.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
          
          return (
            <div className="text-foreground font-medium">{date}</div>
          );
        },
        size: 130,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'type',
        id: 'type',
        header: ({ column }) => <DataGridColumnHeader title="Type" visibility={true} column={column} />,
        cell: ({ row }) => {
          const type = row.original.type;
          
          return (
            <Badge variant="secondary" appearance="outline">
              <Wrench className="w-3 h-3 mr-1" />
              {type}
            </Badge>
          );
        },
        size: 150,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'description',
        id: 'description',
        header: ({ column }) => <DataGridColumnHeader title="Description" visibility={true} column={column} />,
        cell: ({ row }) => {
          return (
            <div className="text-foreground max-w-md truncate">
              {row.original.description}
            </div>
          );
        },
        size: 300,
        enableSorting: false,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'cost',
        id: 'cost',
        header: ({ column }) => <DataGridColumnHeader title="Cost" visibility={true} column={column} />,
        cell: ({ row }) => {
          return (
            <div className="text-foreground font-semibold">
              ${row.original.cost.toFixed(2)}
            </div>
          );
        },
        size: 120,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'odometerAtService',
        id: 'odometer',
        header: ({ column }) => <DataGridColumnHeader title="Odometer Reading" visibility={true} column={column} />,
        cell: ({ row }) => {
          return (
            <div className="text-foreground">
              {row.original.odometerAtService.toLocaleString()} mi
            </div>
          );
        },
        size: 150,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
    ],
    [],
  );

  // Define filters
  const filters: FilterConfig<MaintenanceWithId>[] = useMemo(() => {
    return [
      {
        field: 'type',
        label: 'Type',
        type: 'checkbox',
        options: uniqueTypes.map((type) => ({
          value: type,
          label: type,
        })),
      },
      {
        field: 'vehicleId',
        label: 'Vehicle',
        type: 'checkbox',
        options: uniqueVehicles,
      },
      {
        field: 'date',
        label: 'Date Range',
        type: 'range',
      },
      {
        field: 'cost',
        label: 'Cost Range',
        type: 'range',
      },
    ];
  }, [uniqueTypes, uniqueVehicles]);

  return (
    <>
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-foreground">Maintenance Records</h1>
        <p className="text-muted-foreground mt-2">Track and manage vehicle maintenance history</p>
      </div>
      
      <CrudDataGrid
        data={maintenance}
        columns={columns}
        searchable={true}
        searchConfig={{
          placeholder: 'Search maintenance records...',
          fields: ['type', 'description'],
        }}
        filters={filters}
        pageSize={10}
        initialSorting={[{ id: 'date', desc: true }]}
        toolbarActions={
          <Button>
            <Plus />
            New Maintenance Record
          </Button>
        }
        isLoading={maintenanceData === undefined}
      />
    </>
  );
}
