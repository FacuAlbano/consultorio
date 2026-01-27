import { ReactNode } from "react";
import { Button } from "~/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "~/lib/utils";

interface CrudLayoutProps {
  title: string;
  itemName: string;
  onCreateClick: () => void;
  renderFilters?: () => ReactNode;
  renderList: () => ReactNode;
  renderCreateDialog?: () => ReactNode;
  renderEditDialog?: () => ReactNode;
  className?: string;
}

export function CrudLayout({
  title,
  itemName,
  onCreateClick,
  renderFilters,
  renderList,
  renderCreateDialog,
  renderEditDialog,
  className,
}: CrudLayoutProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <Button onClick={onCreateClick} className="gap-2">
          <Plus className="h-4 w-4" />
          Crear {itemName}
        </Button>
      </div>

      {/* Filtros */}
      {renderFilters && (
        <div className="bg-card border border-border rounded-lg p-4">
          {renderFilters()}
        </div>
      )}

      {/* Lista/Tabla */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {renderList()}
      </div>

      {/* Dialogs */}
      {renderCreateDialog && renderCreateDialog()}
      {renderEditDialog && renderEditDialog()}
    </div>
  );
}
