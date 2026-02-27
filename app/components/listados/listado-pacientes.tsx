import * as React from "react";
import {
  useLoaderData,
  useSearchParams,
  useFetcher,
  useRevalidator,
  useNavigate,
  useActionData,
  Form,
  Link,
} from "react-router";
import { toast } from "sonner";
import { calculateAge } from "~/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ResponsiveDialog } from "~/components/crud/responsive-dialog";
import { RegistrarPacienteFormFields } from "~/components/patient-form-create-fields";
import { Search, Users, Plus, Loader2, UserPlus } from "lucide-react";
import type { Patient } from "~/db/schema";

const INTENTS = { create: "create", update: "update", delete: "delete" } as const;

type InsuranceOption = { id: string; name: string };

function PatientFormFields({
  patient,
  defaultDocumentNumber,
  insuranceCompanies,
}: {
  patient?: Patient | null;
  defaultDocumentNumber?: string;
  insuranceCompanies: InsuranceOption[];
}) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Nombre *</Label>
          <Input id="firstName" name="firstName" required defaultValue={patient?.firstName} placeholder="Nombre" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Apellido *</Label>
          <Input id="lastName" name="lastName" required defaultValue={patient?.lastName} placeholder="Apellido" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="documentType">Tipo documento</Label>
          <select
            id="documentType"
            name="documentType"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            defaultValue={patient?.documentType ?? "DNI"}
          >
            <option value="DNI">DNI</option>
            <option value="LC">LC</option>
            <option value="LE">LE</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="documentNumber">Número documento *</Label>
          <Input
            id="documentNumber"
            name="documentNumber"
            required
            defaultValue={patient?.documentNumber ?? defaultDocumentNumber}
            placeholder="12345678"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" name="phone" type="tel" defaultValue={patient?.phone ?? ""} placeholder="(011) 1234-5678" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={patient?.email ?? ""} placeholder="email@ejemplo.com" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="medicalRecordNumber">Nº Historia Clínica (HC)</Label>
        <Input id="medicalRecordNumber" name="medicalRecordNumber" defaultValue={patient?.medicalRecordNumber ?? ""} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="insuranceCompany">Obra social</Label>
          <select
            id="insuranceCompany"
            name="insuranceCompany"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            defaultValue={patient?.insuranceCompany ?? ""}
          >
            <option value="">— Sin obra social —</option>
            {insuranceCompanies.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="insuranceNumber">Nº afiliado</Label>
          <Input id="insuranceNumber" name="insuranceNumber" defaultValue={patient?.insuranceNumber ?? ""} />
        </div>
      </div>
    </>
  );
}

export function ListadoPacientes() {
  const {
    patients,
    query: initialQuery,
    filter: initialFilter,
    insuranceCompanies,
    patientToEdit,
  } = useLoaderData<{
    patients: Patient[];
    query: string;
    filter: string;
    insuranceCompanies: Array<{ id: string; name: string }>;
    patientToEdit: Patient | null;
  }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = React.useState(initialQuery);
  const [filterType, setFilterType] = React.useState<"all" | "name" | "document" | "hc" | "insurance">(initialFilter as "all" | "name" | "document" | "hc" | "insurance");
  const [createOpen, setCreateOpen] = React.useState(false);
  const revalidator = useRevalidator();
  const navigate = useNavigate();

  const actionData = useActionData<{ success?: boolean; error?: string; deleted?: boolean }>();
  const createFetcher = useFetcher<{ success?: boolean; error?: string; createdId?: string }>();
  const editFetcher = useFetcher<{ success?: boolean; error?: string }>();
  const prevCreateStateRef = React.useRef(createFetcher.state);
  const prevEditStateRef = React.useRef(editFetcher.state);
  const lastProcessedActionDataRef = React.useRef<typeof actionData>(undefined);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) {
      params.set("q", searchQuery);
      params.set("filter", filterType);
    } else {
      params.delete("q");
      params.delete("filter");
    }
    params.delete("patient");
    setSearchParams(params, { replace: true });
  };

  const openEdit = (patientId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("patient", patientId);
    setSearchParams(params, { replace: true });
  };

  const closeEdit = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("patient");
    setSearchParams(params, { replace: true });
  };

  React.useEffect(() => {
    const prev = prevCreateStateRef.current;
    prevCreateStateRef.current = createFetcher.state;
    const justFinished = (prev === "loading" || prev === "submitting") && createFetcher.state === "idle";
    if (!justFinished || !createFetcher.data) return;
    if (createFetcher.data.success) {
      toast.success("Paciente creado correctamente");
      setCreateOpen(false);
      revalidator.revalidate();
    } else if (createFetcher.data.success === false && createFetcher.data.error) {
      toast.error(createFetcher.data.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createFetcher.state, createFetcher.data]);

  React.useEffect(() => {
    const prev = prevEditStateRef.current;
    prevEditStateRef.current = editFetcher.state;
    const justFinished = (prev === "loading" || prev === "submitting") && editFetcher.state === "idle";
    if (!justFinished || !editFetcher.data) return;
    if (editFetcher.data.success) {
      toast.success("Paciente actualizado correctamente");
      closeEdit();
      revalidator.revalidate();
    } else if (editFetcher.data.success === false && editFetcher.data.error) {
      toast.error(editFetcher.data.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editFetcher.state, editFetcher.data]);

  React.useEffect(() => {
    if (!actionData || lastProcessedActionDataRef.current === actionData) return;
    lastProcessedActionDataRef.current = actionData;
    if (actionData.success && actionData.deleted) {
      toast.success("Paciente eliminado correctamente");
      revalidator.revalidate();
    } else if (actionData.success === false && actionData.error) {
      toast.error(actionData.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionData]);

  const editOpen = !!patientToEdit;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-7 w-7" />
          Gestión de Pacientes
        </h1>
        <p className="text-muted-foreground mt-1">
          Listado de pacientes. Buscar por DNI, nombre, HC u obra social.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <Form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "Todos" },
                { value: "document", label: "DNI" },
                { value: "name", label: "Nombre" },
                { value: "hc", label: "HC" },
                { value: "insurance", label: "Obra Social" },
              ].map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilterType(f.value as typeof filterType)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                    filterType === f.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Ingresar DNI, nombre, HC u obra social..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit">Buscar</Button>
              <Button type="button" variant="secondary" className="gap-1" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Nuevo
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pacientes {patients.length > 0 ? `(${patients.length})` : ""}</CardTitle>
        </CardHeader>
        <CardContent>
          {patients.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground space-y-3">
              <p>No se encontraron pacientes.</p>
              {initialQuery.trim() && (
                <Button type="button" variant="outline" className="gap-1" onClick={() => setCreateOpen(true)}>
                  <UserPlus className="h-4 w-4" />
                  Crear paciente
                  {filterType === "document" && initialQuery.trim() ? ` con DNI ${initialQuery}` : ""}
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium">Nombre</th>
                    <th className="text-left py-3 px-2 font-medium">DNI</th>
                    <th className="text-left py-3 px-2 font-medium">HC</th>
                    <th className="text-left py-3 px-2 font-medium">Edad</th>
                    <th className="text-left py-3 px-2 font-medium">Teléfono</th>
                    <th className="text-left py-3 px-2 font-medium">Obra Social</th>
                    <th className="text-right py-3 px-2 font-medium w-32">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => {
                    const age = calculateAge(patient.birthDate);
                    return (
                      <tr
                        key={patient.id}
                        role="button"
                        tabIndex={0}
                        className="border-b border-border/50 hover:bg-muted/30 cursor-pointer"
                        onClick={() => navigate(`/pacientes/${patient.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            navigate(`/pacientes/${patient.id}`);
                          }
                        }}
                      >
                        <td className="py-3 px-2 font-medium">{patient.firstName} {patient.lastName}</td>
                        <td className="py-3 px-2">{patient.documentNumber}</td>
                        <td className="py-3 px-2">{patient.medicalRecordNumber ?? "—"}</td>
                        <td className="py-3 px-2">{age != null ? `${age} años` : "—"}</td>
                        <td className="py-3 px-2">{patient.phone ?? "—"}</td>
                        <td className="py-3 px-2">
                          {patient.insuranceCompany ?? "—"}
                          {patient.insuranceNumber ? ` (${patient.insuranceNumber})` : ""}
                        </td>
                        <td className="py-3 px-2 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                          <Link to={`/pacientes/${patient.id}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                            Ver
                          </Link>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(patient.id);
                            }}
                            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline"
                          >
                            Editar
                          </button>
                          <Form method="post" className="inline" onClick={(e) => e.stopPropagation()}>
                            <input type="hidden" name="_intent" value={INTENTS.delete} />
                            <input type="hidden" name="patientId" value={patient.id} />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive h-auto p-0 min-w-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!confirm("¿Eliminar este paciente?")) e.preventDefault();
                              }}
                            >
                              Eliminar
                            </Button>
                          </Form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ResponsiveDialog open={createOpen} onOpenChange={setCreateOpen} title="Registrar Nuevo Paciente" description="Complete los datos del paciente">
        <createFetcher.Form method="post" className="space-y-4">
          <input type="hidden" name="_intent" value={INTENTS.create} />
          <RegistrarPacienteFormFields
            defaultDocumentNumber={filterType === "document" ? initialQuery : undefined}
            className="space-y-4"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={createFetcher.state !== "idle"}>
              {createFetcher.state !== "idle" ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creando...</> : "Crear Paciente"}
            </Button>
          </div>
          {createFetcher.data?.success === false && createFetcher.data?.error && (
            <p className="text-sm text-destructive">{createFetcher.data.error}</p>
          )}
        </createFetcher.Form>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={editOpen}
        onOpenChange={(open) => !open && closeEdit()}
        title="Editar paciente"
        description={patientToEdit ? `${patientToEdit.firstName} ${patientToEdit.lastName}` : ""}
      >
        {patientToEdit && (
          <editFetcher.Form method="post" className="space-y-4">
            <input type="hidden" name="_intent" value={INTENTS.update} />
            <input type="hidden" name="patientId" value={patientToEdit.id} />
            <PatientFormFields
              patient={patientToEdit}
              insuranceCompanies={insuranceCompanies.map((c) => ({ id: c.id, name: c.name }))}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end pt-2">
              <Button type="button" variant="outline" onClick={closeEdit}>Cancelar</Button>
              <Button type="submit" disabled={editFetcher.state !== "idle"}>
                {editFetcher.state !== "idle" ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando...</> : "Guardar cambios"}
              </Button>
            </div>
            {editFetcher.data?.success === false && editFetcher.data?.error && (
              <p className="text-sm text-destructive">{editFetcher.data.error}</p>
            )}
          </editFetcher.Form>
        )}
      </ResponsiveDialog>
    </div>
  );
}
