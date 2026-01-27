import * as React from "react";
import { Button } from "~/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { cn } from "~/lib/utils";

export interface CrudTableColumn<T = any> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  className?: string;
}

interface CrudTableProps<T = any> {
  items: T[];
  columns: CrudTableColumn<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  emptyMessage?: string;
}

export function CrudTable<T extends { id: string }>({
  items,
  columns,
  onEdit,
  onDelete,
  emptyMessage = "No hay elementos para mostrar",
}: CrudTableProps<T>) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "px-4 py-3 text-left text-sm font-medium text-foreground",
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th className="px-4 py-3 text-right text-sm font-medium text-foreground">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="border-b border-border hover:bg-muted/50 transition-colors"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn("px-4 py-3 text-sm", column.className)}
                >
                  {column.render(item)}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(item)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
