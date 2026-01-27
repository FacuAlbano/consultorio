import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Plus } from "lucide-react";

export interface CrudLayoutConfig {
  title: string;
  itemName: string;
  items: any[];
  filters?: any;
  pagination?: {
    page: number;
    totalPages: number;
    totalItems: number;
  };
}

interface CrudLayoutProps {
  config: CrudLayoutConfig;
  renderFilters?: (props: { filters: any }) => React.ReactNode;
  renderList: (props: { items: any[]; onEdit?: (item: any) => void; onDelete?: (item: any) => void }) => React.ReactNode;
  renderCreateDialog?: (props: { open: boolean; onOpenChange: (open: boolean) => void }) => React.ReactNode;
  renderEditDialog?: (props: { item: any; open: boolean; onOpenChange: (open: boolean) => void }) => React.ReactNode;
  onCreateClick?: () => void;
}

export function CrudLayout({
  config,
  renderFilters,
  renderList,
  renderCreateDialog,
  renderEditDialog,
  onCreateClick,
}: CrudLayoutProps) {
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<any>(null);

  const handleCreateClick = () => {
    if (onCreateClick) {
      onCreateClick();
    } else {
      setCreateDialogOpen(true);
    }
  };

  const handleEditClick = (item: any) => {
    setSelectedItem(item);
    setEditDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{config.title}</h1>
          <p className="text-muted-foreground mt-1">
            {config.pagination
              ? `Total: ${config.pagination.totalItems} ${config.itemName}${config.pagination.totalItems !== 1 ? "s" : ""}`
              : `${config.items.length} ${config.itemName}${config.items.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {renderCreateDialog && (
          <Button onClick={handleCreateClick}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo {config.itemName}
          </Button>
        )}
      </div>

      {/* Filters */}
      {renderFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>{renderFilters({ filters: config.filters })}</CardContent>
        </Card>
      )}

      {/* List */}
      <Card>
        <CardContent className="pt-6">
          {renderList({ 
            items: config.items,
            onEdit: renderEditDialog ? handleEditClick : undefined,
            onDelete: undefined, // Se maneja en el componente hijo
          })}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {renderCreateDialog && renderCreateDialog({ 
        open: createDialogOpen, 
        onOpenChange: setCreateDialogOpen 
      })}

      {renderEditDialog && selectedItem && renderEditDialog({ 
        item: selectedItem,
        open: editDialogOpen,
        onOpenChange: setEditDialogOpen
      })}
    </div>
  );
}
