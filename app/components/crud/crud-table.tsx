import * as React from "react";
import { Button } from "~/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { cn } from "~/lib/utils";
import { useMediaQuery } from "~/hooks/use-media-query";

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
  const isMobile = useMediaQuery("(max-width: 767px)");

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // Vista móvil: cards responsive
  if (isMobile) {
    return (
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="border border-border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors"
          >
            {columns.map((column) => (
              <div key={column.key} className={cn("space-y-1", column.className)}>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {column.header}
                </div>
                <div className="text-sm font-medium">{column.render(item)}</div>
              </div>
            ))}
            {(onEdit || onDelete) && (
              <div className="flex gap-2 pt-3 border-t border-border">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onEdit(item)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(item)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Vista desktop: tabla
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
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
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(item)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
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
    </div>
  );
}
