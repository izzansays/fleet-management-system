import type { Column } from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronsUpDown,
} from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useDataGrid } from '@/components/ui/data-grid';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface DataGridColumnHeaderProps<TData, TValue> extends HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title?: string;
  icon?: ReactNode;
  filter?: ReactNode;
}

function DataGridColumnHeader<TData, TValue>({
  column,
  title = '',
  icon,
  className,
  filter,
}: DataGridColumnHeaderProps<TData, TValue>) {
  const { isLoading, recordCount } = useDataGrid();

  const headerLabel = () => {
    return (
      <div
        className={cn(
          'text-secondary-foreground/80 font-normal inline-flex h-full items-center gap-1.5 text-[0.8125rem] leading-[calc(1.125/0.8125)] [&_svg]:size-3.5 [&_svg]:opacity-60',
          className,
        )}
      >
        {icon && icon}
        {title}
      </div>
    );
  };

  const headerButton = () => {
    return (
      <Button
        variant="ghost"
        className={cn(
          'text-secondary-foreground/80 rounded-md font-normal -ms-2 px-2 h-7 hover:bg-secondary data-[state=open]:bg-secondary hover:text-foreground data-[state=open]:text-foreground',
          className,
        )}
        disabled={isLoading || recordCount === 0}
        onClick={() => {
          const isSorted = column.getIsSorted();
          if (isSorted === 'asc') {
            column.toggleSorting(true);
          } else if (isSorted === 'desc') {
            column.clearSorting();
          } else {
            column.toggleSorting(false);
          }
        }}
      >
        {icon && icon}
        {title}

        {column.getCanSort() &&
          (column.getIsSorted() === 'desc' ? (
            <ArrowDown className="size-[0.7rem]! mt-px" />
          ) : column.getIsSorted() === 'asc' ? (
            <ArrowUp className="size-[0.7rem]! mt-px" />
          ) : (
            <ChevronsUpDown className="size-[0.7rem]! mt-px" />
          ))}
      </Button>
    );
  };

  const headerControls = () => {
    return (
      <div className="flex items-center h-full gap-1.5 justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>{headerButton()}</DropdownMenuTrigger>
          <DropdownMenuContent className="w-40" align="start">
            {filter && <DropdownMenuLabel>{filter}</DropdownMenuLabel>}

            {filter && column.getCanSort() && <DropdownMenuSeparator />}

            {column.getCanSort() && (
              <>
                <DropdownMenuItem
                  onClick={() => {
                    if (column.getIsSorted() === 'asc') {
                      column.clearSorting();
                    } else {
                      column.toggleSorting(false);
                    }
                  }}
                  disabled={!column.getCanSort()}
                >
                  <ArrowUp className="size-3.5!" />
                  <span className="grow">Asc</span>
                  {column.getIsSorted() === 'asc' && <Check className="size-4 opacity-100! text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (column.getIsSorted() === 'desc') {
                      column.clearSorting();
                    } else {
                      column.toggleSorting(true);
                    }
                  }}
                  disabled={!column.getCanSort()}
                >
                  <ArrowDown className="size-3.5!" />
                  <span className="grow">Desc</span>
                  {column.getIsSorted() === 'desc' && <Check className="size-4 opacity-100! text-primary" />}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  if (filter) {
    return headerControls();
  }

  if (column.getCanSort()) {
    return <div className="flex items-center h-full">{headerButton()}</div>;
  }

  return headerLabel();
}

export { DataGridColumnHeader, type DataGridColumnHeaderProps };
