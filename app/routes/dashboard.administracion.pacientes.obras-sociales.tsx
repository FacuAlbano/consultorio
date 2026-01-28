import * as React from "react";
import { useLoaderData, useActionData, useSearchParams, Form, useNavigation } from "react-router";
import type { Route } from "./+types/dashboard.administracion.pacientes.obras-sociales";
import { requireAuth } from "~/lib/middleware";
import { getUserInfo } from "~/lib/user-info";
import { InsuranceCompanyCRUDService } from "~/lib/insurance-companies-crud.service.server";
import { CrudLayout, type CrudLayoutConfig } from "~/components/crud/crud-layout";
import { CrudTable, type CrudTableColumn } from "~/components/crud/crud-table";
import { CrudInputField } from "~/components/crud/crud-input-field";
import { ResponsiveDialog } from "~/components/crud/responsive-dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Search, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";

const INSURANCE_COMPANY_ACTIONS = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
} as const;

export async function loader({ request }: Route.LoaderArgs) {
  const { getAllInsuranceCompanies, searchInsuranceCompanies } = await import("~/lib/insurance-companies.server");
  const { tokenType } = await requireAuth(request);
  const userInfo = getUserInfo(tokenType);

  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";

  let companies;
  if (query && query.length >= 2) {
    companies = await searchInsuranceCompanies({ query, limit: 50 });
  } else {
    companies = await getAllInsuranceCompanies({ limit: 50 });
  }

  return {
    userInfo,
    companies,
    query,
  };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === INSURANCE_COMPANY_ACTIONS.CREATE) {
    const result = await InsuranceCompanyCRUDService.createInsuranceCompany({ formData });
    return { ...result, actionType: INSURANCE_COMPANY_ACTIONS.CREATE };
  }

  if (intent === INSURANCE_COMPANY_ACTIONS.UPDATE) {
    const insuranceCompanyId = formData.get("insuranceCompanyId") as string;
    const result = await InsuranceCompanyCRUDService.updateInsuranceCompany({ insuranceCompanyId, formData });
    return { ...result, actionType: INSURANCE_COMPANY_ACTIONS.UPDATE };
  }

  if (intent === INSURANCE_COMPANY_ACTIONS.DELETE) {
    const insuranceCompanyId = formData.get("insuranceCompanyId") as string;
    const result = await InsuranceCompanyCRUDService.deleteInsuranceCompany({ insuranceCompanyId });
    return { ...result, actionType: INSURANCE_COMPANY_ACTIONS.DELETE };
  }

  return { success: false, error: "Acción no válida", actionType: "" };
}

export default function ObrasSociales() {
  const { companies, query: initialQuery } = useLoaderData<typeof loader>();
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

  const handleDelete = async (company: any) => {
    if (confirm(`¿Estás seguro de eliminar la obra social "${company.name}"?`)) {
      const formData = new FormData();
      formData.append("intent", INSURANCE_COMPANY_ACTIONS.DELETE);
      formData.append("insuranceCompanyId", company.id);
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
    title: "Obras Sociales de la Institución",
    itemName: "obra social",
    items: companies,
  };

  const columns: CrudTableColumn[] = [
    {
      key: "name",
      header: "Nombre",
      render: (company) => <div className="font-medium">{company.name}</div>,
    },
    {
      key: "code",
      header: "Código",
      render: (company) => (
        <div className="text-sm text-muted-foreground">{company.code || "-"}</div>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (company) => (
        <div className="flex items-center gap-2">
          {company.isActive ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">Activa</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">Inactiva</span>
            </>
          )}
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
            placeholder="Buscar por nombre o código..."
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
          emptyMessage="No se encontraron obras sociales"
        />
      )}
      renderCreateDialog={({ open, onOpenChange }) => (
        <CreateInsuranceCompanyDialog
          open={open}
          onOpenChange={onOpenChange}
          actionData={actionData}
          isSubmitting={isSubmitting}
        />
      )}
      renderEditDialog={({ item, open, onOpenChange }) => (
        <EditInsuranceCompanyDialog
          open={open}
          onOpenChange={onOpenChange}
          company={item}
          actionData={actionData}
          isSubmitting={isSubmitting}
        />
      )}
    />
  );
}

function CreateInsuranceCompanyDialog({
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
    if (actionData?.success && actionData.actionType === INSURANCE_COMPANY_ACTIONS.CREATE) {
      onOpenChange(false);
    }
  }, [actionData, onOpenChange]);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nueva Obra Social"
      description="Registrar una nueva obra social"
    >
      <Form method="post" className="space-y-4">
        <input type="hidden" name="intent" value={INSURANCE_COMPANY_ACTIONS.CREATE} />

        {actionData?.error && actionData.actionType === INSURANCE_COMPANY_ACTIONS.CREATE && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {actionData.error}
          </div>
        )}

        <div className="space-y-4">
          <CrudInputField
            name="name"
            label="Nombre"
            required
            placeholder="Nombre de la obra social"
          />

          <CrudInputField
            name="code"
            label="Código"
            placeholder="Código de la obra social"
          />

          <div>
            <label className="block text-sm font-medium mb-2">Descripción</label>
            <textarea
              name="description"
              className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm"
              placeholder="Descripción de la obra social..."
            />
          </div>

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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isActive"
              id="isActive"
              defaultChecked
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="isActive" className="text-sm font-medium">
              Activa
            </label>
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
              "Crear Obra Social"
            )}
          </Button>
        </div>
      </Form>
    </ResponsiveDialog>
  );
}

function EditInsuranceCompanyDialog({
  open,
  onOpenChange,
  company,
  actionData,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: any;
  actionData?: any;
  isSubmitting: boolean;
}) {
  React.useEffect(() => {
    if (actionData?.success && actionData.actionType === INSURANCE_COMPANY_ACTIONS.UPDATE) {
      onOpenChange(false);
    }
  }, [actionData, onOpenChange]);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Editar Obra Social"
      description={`Editar información de ${company.name}`}
    >
      <Form method="post" className="space-y-4">
        <input type="hidden" name="intent" value={INSURANCE_COMPANY_ACTIONS.UPDATE} />
        <input type="hidden" name="insuranceCompanyId" value={company.id} />

        {actionData?.error && actionData.actionType === INSURANCE_COMPANY_ACTIONS.UPDATE && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {actionData.error}
          </div>
        )}

        <div className="space-y-4">
          <CrudInputField
            name="name"
            label="Nombre"
            required
            defaultValue={company.name}
            placeholder="Nombre de la obra social"
          />

          <CrudInputField
            name="code"
            label="Código"
            defaultValue={company.code || ""}
            placeholder="Código de la obra social"
          />

          <div>
            <label className="block text-sm font-medium mb-2">Descripción</label>
            <textarea
              name="description"
              className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm"
              defaultValue={company.description || ""}
              placeholder="Descripción de la obra social..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CrudInputField
              name="phone"
              label="Teléfono"
              type="tel"
              defaultValue={company.phone || ""}
              placeholder="Teléfono"
            />
            <CrudInputField
              name="email"
              label="Email"
              type="email"
              defaultValue={company.email || ""}
              placeholder="email@ejemplo.com"
            />
          </div>

          <CrudInputField
            name="website"
            label="Sitio Web"
            type="url"
            defaultValue={company.website || ""}
            placeholder="https://..."
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isActive"
              id="isActive"
              defaultChecked={company.isActive}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="isActive" className="text-sm font-medium">
              Activa
            </label>
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
