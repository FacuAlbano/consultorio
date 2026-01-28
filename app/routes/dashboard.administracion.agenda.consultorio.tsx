import * as React from "react";
import { useLoaderData, useActionData, useSearchParams, Form, useNavigation } from "react-router";
import type { Route } from "./+types/dashboard.administracion.agenda.consultorio";
import { requireAuth } from "~/lib/middleware";
import { getUserInfo } from "~/lib/user-info";
import { ConsultingRoomCRUDService } from "~/lib/consulting-rooms-crud.service.server";
import { CrudLayout, type CrudLayoutConfig } from "~/components/crud/crud-layout";
import { CrudTable, type CrudTableColumn } from "~/components/crud/crud-table";
import { CrudInputField } from "~/components/crud/crud-input-field";
import { ResponsiveDialog } from "~/components/crud/responsive-dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { useState } from "react";

const CONSULTING_ROOM_ACTIONS = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
} as const;

export async function loader({ request }: Route.LoaderArgs) {
  const { getAllConsultingRooms, searchConsultingRooms } = await import("~/lib/consulting-rooms.server");
  const { tokenType } = await requireAuth(request);
  const userInfo = getUserInfo(tokenType);

  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";

  let rooms;
  if (query && query.length >= 2) {
    rooms = await searchConsultingRooms({ query, limit: 50 });
  } else {
    rooms = await getAllConsultingRooms({ limit: 50 });
  }

  return {
    userInfo,
    rooms,
    query,
  };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === CONSULTING_ROOM_ACTIONS.CREATE) {
    const result = await ConsultingRoomCRUDService.createConsultingRoom({ formData });
    return { ...result, actionType: CONSULTING_ROOM_ACTIONS.CREATE };
  }

  if (intent === CONSULTING_ROOM_ACTIONS.UPDATE) {
    const consultingRoomId = formData.get("consultingRoomId") as string;
    const result = await ConsultingRoomCRUDService.updateConsultingRoom({ consultingRoomId, formData });
    return { ...result, actionType: CONSULTING_ROOM_ACTIONS.UPDATE };
  }

  if (intent === CONSULTING_ROOM_ACTIONS.DELETE) {
    const consultingRoomId = formData.get("consultingRoomId") as string;
    const result = await ConsultingRoomCRUDService.deleteConsultingRoom({ consultingRoomId });
    return { ...result, actionType: CONSULTING_ROOM_ACTIONS.DELETE };
  }

  return { success: false, error: "Acción no válida", actionType: "" };
}

export default function Consultorios() {
  const { rooms, query: initialQuery } = useLoaderData<typeof loader>();
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

  const handleDelete = async (room: any) => {
    if (confirm(`¿Estás seguro de eliminar el consultorio "${room.name}"?`)) {
      const formData = new FormData();
      formData.append("intent", CONSULTING_ROOM_ACTIONS.DELETE);
      formData.append("consultingRoomId", room.id);
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

  const config: CrudLayoutConfig = {
    title: "Asignación de Consultorio",
    itemName: "consultorio",
    items: rooms,
  };

  const columns: CrudTableColumn[] = [
    {
      key: "name",
      header: "Nombre",
      render: (room) => <div className="font-medium">{room.name}</div>,
    },
    {
      key: "description",
      header: "Descripción",
      render: (room) => (
        <div className="text-sm text-muted-foreground">{room.description || "-"}</div>
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
          emptyMessage="No se encontraron consultorios"
        />
      )}
      renderCreateDialog={({ open, onOpenChange }) => (
        <CreateConsultingRoomDialog
          open={open}
          onOpenChange={onOpenChange}
          actionData={actionData}
          isSubmitting={isSubmitting}
        />
      )}
      renderEditDialog={({ item, open, onOpenChange }) => (
        <EditConsultingRoomDialog
          open={open}
          onOpenChange={onOpenChange}
          room={item}
          actionData={actionData}
          isSubmitting={isSubmitting}
        />
      )}
    />
  );
}

function CreateConsultingRoomDialog({
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
    if (open && actionData?.success && actionData.actionType === CONSULTING_ROOM_ACTIONS.CREATE) {
      onOpenChange(false);
    }
  }, [actionData, onOpenChange]);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nuevo Consultorio"
      description="Registrar un nuevo consultorio"
    >
      <Form method="post" className="space-y-4">
        <input type="hidden" name="intent" value={CONSULTING_ROOM_ACTIONS.CREATE} />

        {actionData?.error && actionData.actionType === CONSULTING_ROOM_ACTIONS.CREATE && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {actionData.error}
          </div>
        )}

        <div className="space-y-4">
          <CrudInputField
            name="name"
            label="Nombre"
            required
            placeholder="Nombre del consultorio"
          />

          <div>
            <label className="block text-sm font-medium mb-2">Descripción</label>
            <textarea
              name="description"
              className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm"
              placeholder="Descripción del consultorio..."
            />
          </div>
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
              "Crear Consultorio"
            )}
          </Button>
        </div>
      </Form>
    </ResponsiveDialog>
  );
}

function EditConsultingRoomDialog({
  open,
  onOpenChange,
  room,
  actionData,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: any;
  actionData?: any;
  isSubmitting: boolean;
}) {
  React.useEffect(() => {
    if (open && actionData?.success && actionData.actionType === CONSULTING_ROOM_ACTIONS.UPDATE) {
      onOpenChange(false);
    }
  }, [actionData, onOpenChange]);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Editar Consultorio"
      description={`Editar información de ${room.name}`}
    >
      <Form method="post" className="space-y-4">
        <input type="hidden" name="intent" value={CONSULTING_ROOM_ACTIONS.UPDATE} />
        <input type="hidden" name="consultingRoomId" value={room.id} />

        {actionData?.error && actionData.actionType === CONSULTING_ROOM_ACTIONS.UPDATE && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {actionData.error}
          </div>
        )}

        <div className="space-y-4">
          <CrudInputField
            name="name"
            label="Nombre"
            required
            defaultValue={room.name}
            placeholder="Nombre del consultorio"
          />

          <div>
            <label className="block text-sm font-medium mb-2">Descripción</label>
            <textarea
              name="description"
              className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm"
              defaultValue={room.description || ""}
              placeholder="Descripción del consultorio..."
            />
          </div>
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
