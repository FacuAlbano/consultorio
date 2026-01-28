import * as React from "react";
import { useLoaderData, useActionData, useSearchParams, Form, useNavigation } from "react-router";
import type { Route } from "./+types/dashboard.administracion.web.tipos-turnos";
import { requireAuth } from "~/lib/middleware";
import { getUserInfo } from "~/lib/user-info";
import { AppointmentTypeCRUDService } from "~/lib/appointment-types-crud.service.server";
import { CrudLayout, type CrudLayoutConfig } from "~/components/crud/crud-layout";
import { CrudTable, type CrudTableColumn } from "~/components/crud/crud-table";
import { CrudInputField } from "~/components/crud/crud-input-field";
import { ResponsiveDialog } from "~/components/crud/responsive-dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { useState } from "react";

const APPOINTMENT_TYPE_ACTIONS = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
} as const;

export async function loader({ request }: Route.LoaderArgs) {
  const { getAllAppointmentTypes, searchAppointmentTypes } = await import("~/lib/appointment-types.server");
  const { tokenType } = await requireAuth(request);
  const userInfo = getUserInfo(tokenType);

  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";

  let types;
  if (query && query.length >= 2) {
    types = await searchAppointmentTypes({ query, limit: 50 });
  } else {
    types = await getAllAppointmentTypes({ limit: 50 });
  }

  return {
    userInfo,
    types,
    query,
  };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === APPOINTMENT_TYPE_ACTIONS.CREATE) {
    const result = await AppointmentTypeCRUDService.createAppointmentType({ formData });
    return { ...result, actionType: APPOINTMENT_TYPE_ACTIONS.CREATE };
  }

  if (intent === APPOINTMENT_TYPE_ACTIONS.UPDATE) {
    const appointmentTypeId = formData.get("appointmentTypeId") as string;
    const result = await AppointmentTypeCRUDService.updateAppointmentType({ appointmentTypeId, formData });
    return { ...result, actionType: APPOINTMENT_TYPE_ACTIONS.UPDATE };
  }

  if (intent === APPOINTMENT_TYPE_ACTIONS.DELETE) {
    const appointmentTypeId = formData.get("appointmentTypeId") as string;
    const result = await AppointmentTypeCRUDService.deleteAppointmentType({ appointmentTypeId });
    return { ...result, actionType: APPOINTMENT_TYPE_ACTIONS.DELETE };
  }

  return { success: false, error: "Acción no válida", actionType: "" };
}

export default function TiposTurnos() {
  const { types, query: initialQuery } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const isSubmitting = navigation.state === "submitting";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) {
      params.set("q", searchQuery);
    } else {
      params.delete("q");
    }
    setSearchParams(params, { replace: true });
  };

  const handleDelete = async (type: any) => {
    if (confirm(`¿Estás seguro de eliminar el tipo de turno "${type.name}"?`)) {
      const formData = new FormData();
      formData.append("intent", APPOINTMENT_TYPE_ACTIONS.DELETE);
      formData.append("appointmentTypeId", type.id);
      const form = document.createElement("form");
      form.method = "post";
      Array.from(formData.entries()).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value as string;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    }
  };

  const formatDuration = (duration: string | null) => {
    if (!duration) return "-";
    // Formato HH:MM:SS -> HH:MM
    return duration.substring(0, 5);
  };

  const config: CrudLayoutConfig = {
    title: "Tipos de Turnos de la Institución",
    itemName: "tipo de turno",
    items: types,
  };

  const columns: CrudTableColumn[] = [
    {
      key: "name",
      header: "Nombre",
      render: (type) => <div className="font-medium">{type.name}</div>,
    },
    {
      key: "description",
      header: "Descripción",
      render: (type) => (
        <div className="text-sm text-muted-foreground">{type.description || "-"}</div>
      ),
    },
    {
      key: "duration",
      header: "Duración",
      render: (type) => (
        <div className="text-sm">{formatDuration(type.duration)}</div>
      ),
    },
  ];

  return (
    <CrudLayout
      config={config}
      renderFilters={({ filters }) => (
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre..."
            className="flex-1"
          />
          <div className="flex gap-2">
            <Button type="submit" className="flex-1 sm:flex-initial">
              <Search className="h-4 w-4 sm:mr-2" />
              <span className="sm:inline">Buscar</span>
            </Button>
            {searchQuery && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSearchParams({}, { replace: true });
                }}
                className="sm:flex-initial"
              >
                <span className="sm:inline">Limpiar</span>
              </Button>
            )}
          </div>
        </form>
      )}
      renderList={({ items, onEdit }) => (
        <CrudTable
          items={items}
          columns={columns}
          onEdit={onEdit}
          onDelete={handleDelete}
          emptyMessage="No se encontraron tipos de turnos"
        />
      )}
      renderCreateDialog={({ open, onOpenChange }) => (
        <CreateAppointmentTypeDialog
          open={open}
          onOpenChange={onOpenChange}
          actionData={actionData}
          isSubmitting={isSubmitting}
        />
      )}
      renderEditDialog={({ item, open, onOpenChange }) => (
        <EditAppointmentTypeDialog
          open={open}
          onOpenChange={onOpenChange}
          type={item}
          actionData={actionData}
          isSubmitting={isSubmitting}
        />
      )}
    />
  );
}

function CreateAppointmentTypeDialog({
  open,
  onOpenChange,
  actionData,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionData?: any;
  isSubmitting: boolean;
}) {
  React.useEffect(() => {
    if (open && actionData?.success && actionData.actionType === APPOINTMENT_TYPE_ACTIONS.CREATE) {
      onOpenChange(false);
    }
  }, [open, actionData, onOpenChange]);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nuevo Tipo de Turno"
      description="Registrar un nuevo tipo de turno"
    >
      <Form method="post" className="space-y-4">
        <input type="hidden" name="intent" value={APPOINTMENT_TYPE_ACTIONS.CREATE} />

        {actionData?.error && actionData.actionType === APPOINTMENT_TYPE_ACTIONS.CREATE && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {actionData.error}
          </div>
        )}

        <div className="space-y-4">
          <CrudInputField
            name="name"
            label="Nombre"
            required
            placeholder="Ej: Consulta General, Control..."
          />

          <div>
            <label className="block text-sm font-medium mb-2">Descripción</label>
            <textarea
              name="description"
              className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm"
              placeholder="Descripción del tipo de turno..."
            />
          </div>

          <CrudInputField
            name="duration"
            label="Duración"
            type="time"
            required
            placeholder="HH:MM"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear Tipo de Turno"
            )}
          </Button>
        </div>
      </Form>
    </ResponsiveDialog>
  );
}

function EditAppointmentTypeDialog({
  open,
  onOpenChange,
  type,
  actionData,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: any;
  actionData?: any;
  isSubmitting: boolean;
}) {
  React.useEffect(() => {
    if (open && actionData?.success && actionData.actionType === APPOINTMENT_TYPE_ACTIONS.UPDATE) {
      onOpenChange(false);
    }
  }, [open, actionData, onOpenChange]);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Editar Tipo de Turno"
      description={`Editar información de ${type.name}`}
    >
      <Form method="post" className="space-y-4">
        <input type="hidden" name="intent" value={APPOINTMENT_TYPE_ACTIONS.UPDATE} />
        <input type="hidden" name="appointmentTypeId" value={type.id} />

        {actionData?.error && actionData.actionType === APPOINTMENT_TYPE_ACTIONS.UPDATE && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {actionData.error}
          </div>
        )}

        <div className="space-y-4">
          <CrudInputField
            name="name"
            label="Nombre"
            required
            defaultValue={type.name}
            placeholder="Ej: Consulta General, Control..."
          />

          <div>
            <label className="block text-sm font-medium mb-2">Descripción</label>
            <textarea
              name="description"
              className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm"
              defaultValue={type.description || ""}
              placeholder="Descripción del tipo de turno..."
            />
          </div>

          <CrudInputField
            name="duration"
            label="Duración"
            type="time"
            required
            defaultValue={type.duration ? type.duration.substring(0, 5) : ""}
            placeholder="HH:MM"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </div>
      </Form>
    </ResponsiveDialog>
  );
}
