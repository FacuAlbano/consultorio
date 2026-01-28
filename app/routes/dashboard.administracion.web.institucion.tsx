import * as React from "react";
import { useLoaderData, useActionData, useSearchParams, Form, useNavigation } from "react-router";
import type { Route } from "./+types/dashboard.administracion.web.institucion";
import { requireAuth } from "~/lib/middleware";
import { getUserInfo } from "~/lib/user-info";
import { InstitutionCRUDService } from "~/lib/institutions-crud.service.server";
import { CrudLayout, type CrudLayoutConfig } from "~/components/crud/crud-layout";
import { CrudTable, type CrudTableColumn } from "~/components/crud/crud-table";
import { CrudInputField } from "~/components/crud/crud-input-field";
import { ResponsiveDialog } from "~/components/crud/responsive-dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { useState } from "react";

const INSTITUTION_ACTIONS = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
} as const;

export async function loader({ request }: Route.LoaderArgs) {
  const { getAllInstitutions, searchInstitutions } = await import("~/lib/institutions.server");
  const { tokenType } = await requireAuth(request);
  const userInfo = getUserInfo(tokenType);

  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";

  let institutions;
  if (query && query.length >= 2) {
    institutions = await searchInstitutions({ query, limit: 50 });
  } else {
    institutions = await getAllInstitutions({ limit: 50 });
  }

  return {
    userInfo,
    institutions,
    query,
  };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === INSTITUTION_ACTIONS.CREATE) {
    const result = await InstitutionCRUDService.createInstitution({ formData });
    return { ...result, actionType: INSTITUTION_ACTIONS.CREATE };
  }

  if (intent === INSTITUTION_ACTIONS.UPDATE) {
    const institutionId = formData.get("institutionId") as string;
    const result = await InstitutionCRUDService.updateInstitution({ institutionId, formData });
    return { ...result, actionType: INSTITUTION_ACTIONS.UPDATE };
  }

  if (intent === INSTITUTION_ACTIONS.DELETE) {
    const institutionId = formData.get("institutionId") as string;
    const result = await InstitutionCRUDService.deleteInstitution({ institutionId });
    return { ...result, actionType: INSTITUTION_ACTIONS.DELETE };
  }

  return { success: false, error: "Acción no válida", actionType: "" };
}

export default function Institucion() {
  const { institutions, query: initialQuery } = useLoaderData<typeof loader>();
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

  const handleDelete = async (institution: any) => {
    if (confirm(`¿Estás seguro de eliminar la institución "${institution.name}"?`)) {
      const formData = new FormData();
      formData.append("intent", INSTITUTION_ACTIONS.DELETE);
      formData.append("institutionId", institution.id);
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
    title: "Datos de Institución",
    itemName: "institución",
    items: institutions,
  };

  const columns: CrudTableColumn[] = [
    {
      key: "name",
      header: "Nombre",
      render: (institution) => <div className="font-medium">{institution.name}</div>,
    },
    {
      key: "description",
      header: "Descripción",
      render: (institution) => (
        <div className="text-sm text-muted-foreground">{institution.description || "-"}</div>
      ),
    },
    {
      key: "contact",
      header: "Contacto",
      render: (institution) => (
        <div className="text-sm">
          {institution.phone && <div>{institution.phone}</div>}
          {institution.email && <div className="text-muted-foreground">{institution.email}</div>}
        </div>
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
          emptyMessage="No se encontraron instituciones"
        />
      )}
      renderCreateDialog={({ open, onOpenChange }) => (
        <CreateInstitutionDialog
          open={open}
          onOpenChange={onOpenChange}
          actionData={actionData}
          isSubmitting={isSubmitting}
        />
      )}
      renderEditDialog={({ item, open, onOpenChange }) => (
        <EditInstitutionDialog
          open={open}
          onOpenChange={onOpenChange}
          institution={item}
          actionData={actionData}
          isSubmitting={isSubmitting}
        />
      )}
    />
  );
}

function CreateInstitutionDialog({
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
    if (open && actionData?.success && actionData.actionType === INSTITUTION_ACTIONS.CREATE) {
      onOpenChange(false);
    }
  }, [actionData, onOpenChange]);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nueva Institución"
      description="Registrar una nueva institución"
    >
      <Form method="post" className="space-y-4">
        <input type="hidden" name="intent" value={INSTITUTION_ACTIONS.CREATE} />

        {actionData?.error && actionData.actionType === INSTITUTION_ACTIONS.CREATE && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {actionData.error}
          </div>
        )}

        <div className="space-y-4">
          <CrudInputField
            name="name"
            label="Nombre"
            required
            placeholder="Nombre de la institución"
          />

          <div>
            <label className="block text-sm font-medium mb-2">Descripción</label>
            <textarea
              name="description"
              className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm"
              placeholder="Descripción de la institución..."
            />
          </div>

          <CrudInputField
            name="address"
            label="Dirección"
            placeholder="Dirección de la institución"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CrudInputField
              name="phone"
              label="Teléfono"
              type="tel"
              placeholder="Teléfono"
            />
            <CrudInputField
              name="email"
              label="Email"
              type="email"
              placeholder="email@ejemplo.com"
            />
          </div>

          <CrudInputField
            name="website"
            label="Sitio Web"
            type="url"
            placeholder="https://..."
          />

          <CrudInputField
            name="logoUrl"
            label="URL del Logo"
            type="url"
            placeholder="https://..."
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
              "Crear Institución"
            )}
          </Button>
        </div>
      </Form>
    </ResponsiveDialog>
  );
}

function EditInstitutionDialog({
  open,
  onOpenChange,
  institution,
  actionData,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institution: any;
  actionData?: any;
  isSubmitting: boolean;
}) {
  React.useEffect(() => {
    if (open && actionData?.success && actionData.actionType === INSTITUTION_ACTIONS.UPDATE) {
      onOpenChange(false);
    }
  }, [actionData, onOpenChange]);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Editar Institución"
      description={`Editar información de ${institution.name}`}
    >
      <Form method="post" className="space-y-4">
        <input type="hidden" name="intent" value={INSTITUTION_ACTIONS.UPDATE} />
        <input type="hidden" name="institutionId" value={institution.id} />

        {actionData?.error && actionData.actionType === INSTITUTION_ACTIONS.UPDATE && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {actionData.error}
          </div>
        )}

        <div className="space-y-4">
          <CrudInputField
            name="name"
            label="Nombre"
            required
            defaultValue={institution.name}
            placeholder="Nombre de la institución"
          />

          <div>
            <label className="block text-sm font-medium mb-2">Descripción</label>
            <textarea
              name="description"
              className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm"
              defaultValue={institution.description || ""}
              placeholder="Descripción de la institución..."
            />
          </div>

          <CrudInputField
            name="address"
            label="Dirección"
            defaultValue={institution.address || ""}
            placeholder="Dirección de la institución"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CrudInputField
              name="phone"
              label="Teléfono"
              type="tel"
              defaultValue={institution.phone || ""}
              placeholder="Teléfono"
            />
            <CrudInputField
              name="email"
              label="Email"
              type="email"
              defaultValue={institution.email || ""}
              placeholder="email@ejemplo.com"
            />
          </div>

          <CrudInputField
            name="website"
            label="Sitio Web"
            type="url"
            defaultValue={institution.website || ""}
            placeholder="https://..."
          />

          <CrudInputField
            name="logoUrl"
            label="URL del Logo"
            type="url"
            defaultValue={institution.logoUrl || ""}
            placeholder="https://..."
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
