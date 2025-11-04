'use client';

import { ReactNode, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardHeading, CardTable, CardToolbar } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DataGrid, DataGridProps } from '@/components/ui/data-grid';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  ColumnDef,
  FilterFn,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { rankItem } from '@tanstack/match-sorter-utils';
import { Filter, Search, X } from 'lucide-react';

// Define a custom fuzzy filter function for search functionality
const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value);
  addMeta({ itemRank });
  return itemRank.passed;
};

export interface FilterConfig<TData = unknown> {
  /** The field to filter on */
  field: keyof TData;
  /** Label to display in the filter UI */
  label: string;
  /** Type of filter */
  type: 'checkbox' | 'select' | 'range';
  /** Options for checkbox/select filters */
  options?: Array<{
    value: string;
    label: string;
    count?: number;
  }>;
}

export interface SearchConfig<TData = unknown> {
  /** Fields to search across (if not provided, searches all string fields) */
  fields?: Array<keyof TData>;
  /** Placeholder text for search input */
  placeholder?: string;
}

export interface CrudDataGridProps<TData extends { id: string }> {
  /** The data array to display */
  data: TData[];
  /** Column definitions for the table */
  columns: ColumnDef<TData>[];
  /** Enable search functionality */
  searchable?: boolean;
  /** Search configuration */
  searchConfig?: SearchConfig<TData>;
  /** Filter configurations */
  filters?: FilterConfig<TData>[];
  /** Enable pagination */
  paginated?: boolean;
  /** Initial page size */
  pageSize?: number;
  /** Initial sorting state */
  initialSorting?: SortingState;
  /** Actions to show in the toolbar */
  toolbarActions?: ReactNode;
  /** Card title */
  title?: ReactNode;
  /** Card description */
  description?: ReactNode;
  /** Custom empty state message */
  emptyMessage?: ReactNode | string;
  /** Loading state */
  isLoading?: boolean;
  /** Table layout options (passed to DataGrid) */
  tableLayout?: DataGridProps<TData>['tableLayout'];
  /** Custom CSS class for the card */
  className?: string;
  /** Callback when a row is clicked */
  onRowClick?: (row: TData) => void;
  /** Custom filter renderer */
  renderFilters?: (filters: FilterConfig<TData>[], selectedFilters: Record<string, string[]>) => ReactNode;
}

/**
 * CrudDataGrid - A high-level component for CRUD operations with built-in
 * search, filtering, pagination, and toolbar composition.
 * 
 * Wraps the lower-level DataGrid component and provides common CRUD patterns.
 */
export function CrudDataGrid<TData extends { id: string }>({
  data,
  columns,
  searchable = false,
  searchConfig,
  filters = [],
  paginated = true,
  pageSize = 10,
  initialSorting = [],
  toolbarActions,
  title,
  description,
  emptyMessage,
  isLoading = false,
  tableLayout,
  className,
  onRowClick,
  renderFilters,
}: CrudDataGridProps<TData>) {
  // State management
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

  // Column order state
  const [columnOrder, setColumnOrder] = useState<string[]>(columns.map((column) => column.id as string));

  // Filter and search data
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Apply filters
      const matchesFilters = filters.every((filter) => {
        const filterValues = selectedFilters[filter.field as string];
        if (!filterValues || filterValues.length === 0) return true;
        
        const itemValue = item[filter.field];
        return filterValues.includes(String(itemValue));
      });

      // Apply search
      if (!searchQuery) return matchesFilters;

      const searchLower = searchQuery.toLowerCase();
      const fieldsToSearch = searchConfig?.fields || (Object.keys(item) as Array<keyof TData>);
      
      const matchesSearch = fieldsToSearch.some((field) => {
        const value = item[field];
        return String(value).toLowerCase().includes(searchLower);
      });

      return matchesFilters && matchesSearch;
    });
  }, [data, searchQuery, selectedFilters, filters, searchConfig]);

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const counts: Record<string, Record<string, number>> = {};
    
    filters.forEach((filter) => {
      const field = filter.field as string;
      counts[field] = {};
      
      data.forEach((item) => {
        const value = String(item[filter.field]);
        counts[field][value] = (counts[field][value] || 0) + 1;
      });
    });
    
    return counts;
  }, [data, filters]);

  // Handle filter changes
  const handleFilterChange = (field: string, checked: boolean, value: string) => {
    setSelectedFilters((prev) => {
      const fieldFilters = prev[field] || [];
      return {
        ...prev,
        [field]: checked ? [...fieldFilters, value] : fieldFilters.filter((v) => v !== value),
      };
    });
  };

  // Create table instance
  const table = useReactTable<TData>({
    columns,
    data: filteredData,
    pageCount: Math.ceil((filteredData?.length || 0) / pagination.pageSize),
    getRowId: (row: TData) => row.id,
    state: {
      pagination,
      sorting,
      columnOrder,
    },
    columnResizeMode: 'onChange',
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: false,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
  });

  // Default filter renderer
  const defaultFilterRenderer = (filters: FilterConfig<TData>[], selectedFilters: Record<string, string[]>) => {
    return filters.map((filter) => {
      const field = filter.field as string;
      const selectedCount = selectedFilters[field]?.length || 0;

      return (
        <Popover key={field}>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <Filter />
              {filter.label}
              {selectedCount > 0 && (
                <Badge size="sm" appearance="outline">
                  {selectedCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-3" align="start">
            <div className="space-y-3">
              <div className="text-xs font-medium text-muted-foreground">Filters</div>
              <div className="space-y-3">
                {filter.options?.map((option) => {
                  const count = filterCounts[field]?.[option.value] || 0;
                  return (
                    <div key={option.value} className="flex items-center gap-2.5">
                      <Checkbox
                        id={`${field}-${option.value}`}
                        checked={selectedFilters[field]?.includes(option.value) || false}
                        onCheckedChange={(checked) => handleFilterChange(field, checked === true, option.value)}
                      />
                      <Label
                        htmlFor={`${field}-${option.value}`}
                        className="grow flex items-center justify-between font-normal gap-1.5"
                      >
                        {option.label}
                        <span className="text-muted-foreground">{count}</span>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      );
    });
  };

  return (
    <DataGrid
      table={table}
      recordCount={filteredData?.length || 0}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      onRowClick={onRowClick}
      tableLayout={{
        columnsPinnable: true,
        columnsResizable: true,
        columnsMovable: true,
        columnsVisibility: true,
        ...tableLayout,
      }}
    >
      <Card className={className}>
        <CardHeader className="py-4">
          <CardHeading>
            {(title || description) && (
              <div className="space-y-1">
                {title && <div className="text-lg font-semibold">{title}</div>}
                {description && <div className="text-sm text-muted-foreground">{description}</div>}
              </div>
            )}
            <div className="flex items-center gap-2.5">
              {searchable && (
                <div className="relative">
                  <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder={searchConfig?.placeholder || 'Search...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-9 w-40"
                  />
                  {searchQuery.length > 0 && (
                    <Button
                      mode="icon"
                      variant="ghost"
                      className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                      onClick={() => setSearchQuery('')}
                    >
                      <X />
                    </Button>
                  )}
                </div>
              )}
              {filters.length > 0 && (renderFilters ? renderFilters(filters, selectedFilters) : defaultFilterRenderer(filters, selectedFilters))}
            </div>
          </CardHeading>
          {toolbarActions && <CardToolbar>{toolbarActions}</CardToolbar>}
        </CardHeader>
        <CardTable>
          <ScrollArea>
            <DataGridTable />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardTable>
        {paginated && (
          <CardFooter>
            <DataGridPagination />
          </CardFooter>
        )}
      </Card>
    </DataGrid>
  );
}
